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

async function syncTransactions(
  plaidBase: string,
  clientId: string,
  secret: string,
  token: string,
  entryCursor: string | undefined
): Promise<{
  added: unknown[];
  modified: unknown[];
  removed: unknown[];
  next_cursor: string;
}> {
  const added: unknown[] = [];
  const modified: unknown[] = [];
  const removed: unknown[] = [];
  let currentCursor: string | undefined = entryCursor;
  let retryCount = 0;

  while (true) {
    const body: Record<string, unknown> = {
      client_id: clientId,
      secret,
      access_token: token,
      options: { include_personal_finance_category: true },
    };
    if (currentCursor !== undefined) body.cursor = currentCursor;

    const res = await fetch(`${plaidBase}/transactions/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.error_code === "TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION") {
      if (++retryCount > 10) throw new Error("Sync retry limit exceeded");
      // Reset accumulators and restart from the original entry cursor
      added.length = 0;
      modified.length = 0;
      removed.length = 0;
      currentCursor = entryCursor;
      continue;
    }

    if (data.error_code) {
      throw new Error(data.error_message || data.error_code);
    }
    if (!res.ok) {
      throw new Error(`Plaid HTTP ${res.status}`);
    }

    added.push(...(data.added ?? []));
    modified.push(...(data.modified ?? []));
    removed.push(...(data.removed ?? []));
    currentCursor = data.next_cursor;

    if (!data.has_more) break;
  }

  return { added, modified, removed, next_cursor: currentCursor as string };
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

    const jwt = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(jwt);
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { connection_id, access_token, card_name, cursor, save } = body;

    let token: string;
    let resolvedConnectionId: string | undefined = connection_id;

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
        const { data: inserted } = await supabase
          .from("plaid_connections")
          .insert({ user_id: user.id, card_name, access_token })
          .select("id")
          .single();
        if (inserted) resolvedConnectionId = inserted.id;
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

    // cursor absent or empty string = full sync (no cursor passed to Plaid)
    const entryCursor: string | undefined = cursor || undefined;

    const { added, modified, removed, next_cursor } = await syncTransactions(
      plaidBase,
      clientId,
      secret,
      token!,
      entryCursor
    );

    return json({
      added,
      modified,
      removed,
      next_cursor,
      connection_id: resolvedConnectionId,
    });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
