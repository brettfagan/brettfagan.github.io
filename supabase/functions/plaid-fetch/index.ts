import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    // Supabase client scoped to the requesting user (RLS enforced)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const {
      connection_id,
      access_token,
      card_name,
      start_date,
      end_date,
      save,
    } = body;

    if (!start_date || !end_date) {
      return json({ error: "start_date and end_date are required" }, 400);
    }

    let token: string;

    if (connection_id) {
      // Fetch saved connection — RLS ensures the user owns this row
      const { data, error } = await supabase
        .from("plaid_connections")
        .select("access_token")
        .eq("id", connection_id)
        .single();
      if (error || !data) return json({ error: "Connection not found" }, 404);
      token = data.access_token;
    } else if (access_token) {
      token = access_token;
      if (save && card_name) {
        await supabase
          .from("plaid_connections")
          .insert({ user_id: user.id, card_name, access_token });
      }
    } else {
      return json({ error: "connection_id or access_token required" }, 400);
    }

    const clientId = Deno.env.get("PLAID_CLIENT_ID");
    const secret = Deno.env.get("PLAID_SECRET");
    const plaidEnv = Deno.env.get("PLAID_ENV") || "production";
    if (!clientId || !secret) {
      return json({ error: "Plaid credentials not configured" }, 500);
    }

    const plaidBase =
      plaidEnv === "sandbox"
        ? "https://sandbox.plaid.com"
        : "https://production.plaid.com";

    // Paginated fetch
    const allTransactions: unknown[] = [];
    let offset = 0;
    let totalTransactions = Infinity;

    while (allTransactions.length < totalTransactions) {
      const plaidRes = await fetch(`${plaidBase}/transactions/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          secret,
          access_token: token,
          start_date,
          end_date,
          options: {
            count: 500,
            offset,
            include_personal_finance_category: true,
          },
        }),
      });

      const plaidData = await plaidRes.json();

      if (plaidData.error_code) {
        return json(
          { error: plaidData.error_message || plaidData.error_code },
          400
        );
      }
      if (!plaidRes.ok) {
        return json({ error: `Plaid HTTP ${plaidRes.status}` }, 502);
      }

      totalTransactions = plaidData.total_transactions ?? 0;
      const batch: unknown[] = plaidData.transactions ?? [];
      allTransactions.push(...batch);
      offset += batch.length;

      // Safety: stop if Plaid returns an empty batch to avoid infinite loop
      if (batch.length === 0) break;
    }

    return json({ transactions: allTransactions });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
