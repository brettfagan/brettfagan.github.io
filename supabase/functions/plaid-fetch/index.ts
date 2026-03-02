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

// Derives a summary account type from an array of Plaid account objects.
// Returns 'credit', 'depository', or 'mixed'.
function deriveAccountType(accounts: { type?: string }[]): string {
  const types = [...new Set(accounts.map((a) => a.type).filter(Boolean))];
  if (types.length === 1) return types[0] as string;
  return "mixed";
}

// Full historical fetch via /transactions/get (offset-based pagination).
// Returns all transactions within the date window, plus the accounts array.
async function fetchAllTransactions(
  plaidBase: string,
  clientId: string,
  secret: string,
  token: string,
  startDate: string,
  endDate: string
): Promise<{ transactions: unknown[]; accounts: { type?: string }[] }> {
  const allTransactions: unknown[] = [];
  let accounts: { type?: string }[] = [];
  let offset = 0;
  let totalTransactions = Infinity;

  while (allTransactions.length < totalTransactions) {
    const res = await fetch(`${plaidBase}/transactions/get`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        secret,
        access_token: token,
        start_date: startDate,
        end_date: endDate,
        options: {
          count: 500,
          offset,
          include_personal_finance_category: true,
        },
      }),
    });

    const data = await res.json();

    if (data.error_code) {
      throw new Error(data.error_message || data.error_code);
    }
    if (!res.ok) {
      throw new Error(`Plaid HTTP ${res.status}`);
    }

    // Accounts are the same on every page; capture once
    if (accounts.length === 0 && Array.isArray(data.accounts)) {
      accounts = data.accounts;
    }

    totalTransactions = data.total_transactions ?? 0;
    const batch: unknown[] = data.transactions ?? [];
    allTransactions.push(...batch);
    offset += batch.length;

    if (batch.length === 0) break; // Safety: avoid infinite loop
  }

  return { transactions: allTransactions, accounts };
}

// Prime the sync cursor by paging through /transactions/sync with no cursor.
// We discard the transactions and keep only the final next_cursor so that
// future Sync calls return only true incremental changes.
async function primeSyncCursor(
  plaidBase: string,
  clientId: string,
  secret: string,
  token: string
): Promise<string> {
  let cursor: string | undefined = undefined;
  let retryCount = 0;

  while (true) {
    const body: Record<string, unknown> = {
      client_id: clientId,
      secret,
      access_token: token,
      options: { include_personal_finance_category: true },
    };
    if (cursor !== undefined) body.cursor = cursor;

    const res = await fetch(`${plaidBase}/transactions/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.error_code === "TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION") {
      if (++retryCount > 10) throw new Error("Sync retry limit exceeded");
      cursor = undefined; // restart from the beginning
      continue;
    }

    if (data.error_code) {
      throw new Error(data.error_message || data.error_code);
    }
    if (!res.ok) {
      throw new Error(`Plaid HTTP ${res.status}`);
    }

    cursor = data.next_cursor;
    if (!data.has_more) break;
  }

  return cursor as string;
}

// Incremental sync via /transactions/sync (cursor-based pagination).
// Returns added/modified/removed deltas, the new next_cursor, and accounts.
async function syncTransactions(
  plaidBase: string,
  clientId: string,
  secret: string,
  token: string,
  entryCursor: string
): Promise<{
  added: unknown[];
  modified: unknown[];
  removed: unknown[];
  next_cursor: string;
  accounts: { type?: string }[];
}> {
  const added: unknown[] = [];
  const modified: unknown[] = [];
  const removed: unknown[] = [];
  let accounts: { type?: string }[] = [];
  let currentCursor: string = entryCursor;
  let retryCount = 0;

  while (true) {
    const body: Record<string, unknown> = {
      client_id: clientId,
      secret,
      access_token: token,
      cursor: currentCursor,
      options: { include_personal_finance_category: true },
    };

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
      accounts = [];
      currentCursor = entryCursor;
      continue;
    }

    if (data.error_code) {
      throw new Error(data.error_message || data.error_code);
    }
    if (!res.ok) {
      throw new Error(`Plaid HTTP ${res.status}`);
    }

    // Accounts are the same on every page; capture once
    if (accounts.length === 0 && Array.isArray(data.accounts)) {
      accounts = data.accounts;
    }

    added.push(...(data.added ?? []));
    modified.push(...(data.modified ?? []));
    removed.push(...(data.removed ?? []));
    currentCursor = data.next_cursor;

    if (!data.has_more) break;
  }

  return { added, modified, removed, next_cursor: currentCursor, accounts };
}

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
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

    // Admin client for Vault operations — service role bypasses RLS and can
    // read vault.decrypted_secrets. Never used for user-data reads/writes.
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SB_SERVICE_ROLE_KEY")!,
    );

    const jwt = authHeader.replace(/^bearer /i, "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(jwt);
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { connection_id, access_token, card_name, cursor, save, action } = body;

    // ── Token rotation ────────────────────────────────────────────────────────
    // Replaces the direct client-side write to plaid_connections.access_token.
    if (action === "rotate_token") {
      if (!connection_id || !access_token) {
        return json({ error: "connection_id and access_token required" }, 400);
      }
      const { data: conn, error: connErr } = await supabase
        .from("plaid_connections")
        .select("vault_secret_id")
        .eq("id", connection_id)
        .single();
      if (connErr || !conn) return json({ error: "Connection not found" }, 404);
      const { error: vaultErr } = await adminSupabase.rpc("update_plaid_vault_secret", {
        p_secret_id: conn.vault_secret_id,
        p_token: access_token,
      });
      if (vaultErr) return json({ error: "Failed to update token" }, 500);
      return json({ ok: true });
    }

    let token: string;
    let resolvedConnectionId: string | undefined = connection_id;

    if (connection_id) {
      // Fetch saved connection — RLS ensures the user owns this row.
      // vault_secret_id is a pointer into Supabase Vault; decrypt via admin client.
      const { data, error } = await supabase
        .from("plaid_connections")
        .select("vault_secret_id")
        .eq("id", connection_id)
        .single();
      if (error || !data) return json({ error: "Connection not found" }, 404);
      const { data: vaultToken, error: vaultErr } = await adminSupabase.rpc(
        "read_plaid_vault_secret",
        { p_secret_id: data.vault_secret_id },
      );
      if (vaultErr || !vaultToken) return json({ error: "Failed to retrieve token" }, 500);
      token = vaultToken;
    } else if (access_token) {
      token = access_token;
      if (save && card_name) {
        // Store the token in Vault and save only the opaque secret ID to the DB.
        const { data: secretId, error: vaultErr } = await adminSupabase.rpc(
          "create_plaid_vault_secret",
          { p_token: access_token },
        );
        if (vaultErr || !secretId) {
          return json({ error: "Failed to store token" }, 500);
        }
        const { data: inserted, error: insertErr } = await supabase
          .from("plaid_connections")
          .insert({ user_id: user.id, card_name, vault_secret_id: secretId })
          .select("id")
          .single();
        if (insertErr) return json({ error: "Failed to save connection" }, 500);
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

    if (cursor) {
      // Incremental sync — use /transactions/sync with the stored cursor
      const { added, modified, removed, next_cursor, accounts } = await syncTransactions(
        plaidBase, clientId, secret, token!, cursor
      );
      const account_type = accounts.length > 0 ? deriveAccountType(accounts) : undefined;
      return json({ added, modified, removed, next_cursor, connection_id: resolvedConnectionId, account_type });
    } else {
      // Full historical fetch — use /transactions/get for complete history,
      // then prime the sync cursor so future Sync calls return only deltas
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const { transactions, accounts } = await fetchAllTransactions(plaidBase, clientId, secret, token!, startDate, endDate);
      const next_cursor = await primeSyncCursor(plaidBase, clientId, secret, token!);
      const account_type = accounts.length > 0 ? deriveAccountType(accounts) : undefined;

      // Persist account_type on new connections so the UI can badge them
      if (resolvedConnectionId && account_type) {
        await supabase
          .from("plaid_connections")
          .update({ account_type })
          .eq("id", resolvedConnectionId);
      }

      return json({ transactions, next_cursor, connection_id: resolvedConnectionId, account_type });
    }
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
