import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set(["https://www.brettlabs.dev"]);

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing authorization" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const jwt = authHeader.replace(/^bearer /i, "");
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(jwt);
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

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

  const res = await fetch(`${plaidBase}/link/token/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      secret,
      user: { client_user_id: user.id },
      client_name: "BrettLabs Spend Analyzer",
      products: ["transactions"],
      country_codes: ["US"],
      language: "en",
    }),
  });

  const data = await res.json();
  if (data.error_code) {
    return json({ error: data.error_message || data.error_code }, 500);
  }

  return json({ link_token: data.link_token });
});
