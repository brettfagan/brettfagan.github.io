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

    const jwt = authHeader.replace(/^bearer /i, "");
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
