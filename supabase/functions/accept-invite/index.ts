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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  // User-scoped client
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  // Admin client — needed to look up invite by token and create partner_access
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  const body = await req.json();
  const { token } = body;
  if (!token || typeof token !== "string") {
    return json({ error: "token is required" }, 400);
  }

  // Look up invite by token
  const { data: invite, error: fetchError } = await supabaseAdmin
    .from("partner_invites")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (fetchError || !invite) {
    return json({ error: "Invitation not found or already used" }, 404);
  }

  // Check expiry
  if (new Date(invite.expires_at) < new Date()) {
    await supabaseAdmin.from("partner_invites").delete().eq("id", invite.id);
    return json({ error: "This invitation has expired" }, 410);
  }

  // Validate that the signed-in user's email matches the invited email
  if (user.email?.toLowerCase() !== invite.invited_email.toLowerCase()) {
    return json(
      {
        error:
          "This invitation was sent to a different email address. Please sign in with the correct account.",
      },
      403,
    );
  }

  // If partner is already linked (e.g. double-click), clean up and return success
  const { data: existingAccess } = await supabaseAdmin
    .from("partner_access")
    .select("id")
    .eq("partner_user_id", user.id)
    .maybeSingle();
  if (existingAccess) {
    await supabaseAdmin.from("partner_invites").delete().eq("id", invite.id);
    return json({ success: true });
  }

  // Create the partner_access link
  const { error: accessError } = await supabaseAdmin
    .from("partner_access")
    .insert({
      master_user_id: invite.master_user_id,
      partner_user_id: user.id,
      partner_email: user.email,
    });
  if (accessError) {
    console.error("partner_access insert error:", accessError);
    return json({ error: "Failed to create access link" }, 500);
  }

  // Delete the invite — single-use
  await supabaseAdmin.from("partner_invites").delete().eq("id", invite.id);

  return json({ success: true });
});
