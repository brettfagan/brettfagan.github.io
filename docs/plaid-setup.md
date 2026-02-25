# Adding a New Plaid Account to the Spend Analyzer

This is the end-to-end process for connecting a new bank/card via Plaid and importing its transactions.

---

## Overview

Three phases:
1. **Get a `public_token`** — use the local Plaid Link HTML page to authenticate with your bank
2. **Exchange for an `access_token`** — one Postman call
3. **Add the connection in the Analyzer UI** — paste the token, save, and fetch

---

## Prerequisites

- Plaid credentials set as Supabase Edge Function secrets:
  - `PLAID_CLIENT_ID`
  - `PLAID_SECRET`
  - `PLAID_ENV` (`sandbox` or `production`)
- The `plaid-link.html` file (see template below if you need to recreate it)

---

## Phase 1: Create a Link Token (Postman)

This mints a short-lived token that authorizes the Plaid Link widget to open.

**POST** `https://production.plaid.com/link/token/create`
(use `https://sandbox.plaid.com` for sandbox)

Headers:
```
Content-Type: application/json
```

Body:
```json
{
  "client_id": "<YOUR_CLIENT_ID>",
  "secret": "<YOUR_SECRET>",
  "user": { "client_user_id": "user-001" },
  "client_name": "Spend Analyzer",
  "products": ["transactions"],
  "country_codes": ["US"],
  "language": "en",
  "webhook": "https://webhook.site/<your-unique-id>"
}
```

> **Webhook (optional but recommended for debugging):** The `webhook` field tells Plaid where to POST transaction update events. Use a [webhook.site](https://webhook.site) URL here to inspect live payloads during setup — see the [Monitoring Webhooks](#monitoring-webhook-events-webhooksite) section below.

Response — copy the `link_token` value:
```json
{
  "link_token": "link-production-xxxxxxxx-xxxx-...",
  "expiration": "2024-...",
  "request_id": "..."
}
```

---

## Phase 2: Open Plaid Link HTML File

Open `plaid-link.html` (local file, not deployed) in your browser.

1. Paste the `link_token` from Phase 1 into the input field
2. Click **Open Plaid Link**
3. The Plaid authentication window opens — log into your bank
4. After completing auth, the page displays a `public_token` like:
   `public-production-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
5. Copy this token — it expires in 30 minutes

> **HTML template** is at the bottom of this file if you need to recreate it.

---

## Phase 3: Exchange for an Access Token (Postman)

**POST** `https://production.plaid.com/item/public_token/exchange`

Headers:
```
Content-Type: application/json
```

Body:
```json
{
  "client_id": "<YOUR_CLIENT_ID>",
  "secret": "<YOUR_SECRET>",
  "public_token": "<public_token from Phase 2>"
}
```

Response — copy the `access_token`:
```json
{
  "access_token": "access-production-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "item_id": "...",
  "request_id": "..."
}
```

Store this `access_token` securely — it doesn't expire (but can be revoked).

---

## Phase 4: Add the Connection in the Analyzer UI

1. Open the Spend Analyzer and sign in
2. Click **Import** to open the Import sidebar
3. Scroll to the **Plaid Connections** section
4. In the **Add Connection** form:
   - **Card name** — human-readable label (e.g. "Chase Sapphire", "Amex Gold"). This becomes the key in `loadedData` and the label shown in the UI. Use a name from the `CARDS` constant if applicable, otherwise any string works.
   - **Access token** — paste the token from Phase 3
   - **Save connection** — check this box to persist the token to the `plaid_connections` DB table so you don't have to paste it again next session
5. Click **Add**

The new connection appears in the list.

6. Click **Fetch All** on the new connection — this pulls up to 2 years of transactions
7. Once loaded (green highlight), click **Import to DB** to save transactions to `imported_transactions`
8. Run **Analyze** to include the new card in the dashboard

---

## Subsequent Sessions (Saved Connection)

Once a connection is saved:

1. Open the Import sidebar → Plaid Connections
2. The saved connection appears automatically
3. Click **Fetch All** for a full 2-year re-pull, or **Sync** for just new/changed transactions since last fetch
4. Import to DB as needed

> **Sync** uses a `localStorage` cursor (`plaid_cursor_{id}`). If you clear browser storage, Sync will fall back to a full fetch automatically.

---

## Token Rotation

If an access token is revoked or expires:
1. Repeat Phases 1–3 to get a new `access_token`
2. In the Plaid Connections list, click the **edit (pencil) icon** on the connection
3. Paste the new token and save
4. The cursor is automatically cleared — the next action will be a full re-fetch

---

## Monitoring Webhook Events (webhook.site)

[webhook.site](https://webhook.site) gives you a free, unique HTTPS URL that captures and displays any HTTP request sent to it — useful for watching Plaid fire transaction events without standing up a real server.

### 1. Get your unique URL

1. Go to [https://webhook.site](https://webhook.site)
2. A unique URL is generated automatically, e.g.:
   ```
   https://webhook.site/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```
3. Keep the tab open — incoming requests appear in real time

### 2. Register the webhook URL with Plaid

**Option A — At link token creation (Phase 1):**
Add the `webhook` field to the `/link/token/create` body (shown in Phase 1 above). Plaid registers the URL when the item is created.

**Option B — After you already have an access token:**
Call `/item/webhook/update` directly via Postman:

**POST** `https://production.plaid.com/item/webhook/update`

Body:
```json
{
  "client_id": "<YOUR_CLIENT_ID>",
  "secret": "<YOUR_SECRET>",
  "access_token": "<access_token>",
  "webhook": "https://webhook.site/<your-unique-id>"
}
```

This updates the webhook for an existing connection without repeating the full link flow.

### 3. What events to look for

Once the connection is established and transactions are loading, Plaid posts `TRANSACTIONS` webhook events to your URL:

| Event | When it fires |
|-------|--------------|
| `INITIAL_UPDATE` | First batch of recent transactions is ready (~1–2 min after connection) |
| `HISTORICAL_UPDATE` | Full historical backfill is complete (up to 2 years) |
| `SYNC_UPDATES_AVAILABLE` | New, modified, or removed transactions are available |
| `TRANSACTIONS_REMOVED` | Transactions were deleted by the institution |

Example payload you'll see in webhook.site:
```json
{
  "webhook_type": "TRANSACTIONS",
  "webhook_code": "SYNC_UPDATES_AVAILABLE",
  "item_id": "eVBnVMp7zdTJLkRNr33Rs6zr27",
  "initial_update_complete": true,
  "historical_update_complete": false,
  "environment": "production"
}
```

### 4. Triggering a sync after the webhook fires

The webhook is a notification only — Plaid does not push transaction data in the payload. After receiving `SYNC_UPDATES_AVAILABLE` or `HISTORICAL_UPDATE`, go to the Import sidebar and click **Sync** (or **Fetch All**) on the connection to pull the new data.

> **Tip:** In sandbox, you can fire a test webhook immediately via Postman:
> **POST** `https://sandbox.plaid.com/sandbox/item/fire_webhook`
> ```json
> { "client_id": "...", "secret": "...", "access_token": "...", "webhook_code": "SYNC_UPDATES_AVAILABLE" }
> ```

---

## Plaid Link HTML Template

Save this as `plaid-link.html` locally (do not commit to the repo — it's a dev tool):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Plaid Link</title>
</head>
<body>
  <h2>Plaid Link Token Exchange</h2>
  <label>
    Link Token:<br />
    <input id="link-token" type="text" size="80" placeholder="link-production-..." />
  </label>
  <br /><br />
  <button onclick="openLink()">Open Plaid Link</button>
  <br /><br />
  <strong>Public Token:</strong>
  <pre id="result" style="background:#f4f4f4;padding:12px;min-height:40px"></pre>

  <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
  <script>
    function openLink() {
      const token = document.getElementById('link-token').value.trim();
      if (!token) { alert('Paste a link_token first'); return; }

      const handler = Plaid.create({
        token,
        onSuccess(public_token, metadata) {
          document.getElementById('result').textContent = public_token;
          console.log('public_token:', public_token);
          console.log('metadata:', metadata);
        },
        onExit(err, metadata) {
          if (err) console.error(err, metadata);
        },
      });

      handler.open();
    }
  </script>
</body>
</html>
```

---

## Environment Notes

| Env | Plaid Base URL | Behavior |
|-----|---------------|----------|
| `sandbox` | `https://sandbox.plaid.com` | Use test credentials (username: `user_good`, password: `pass_good`) |
| `production` | `https://production.plaid.com` | Real banks, real data |

The `PLAID_ENV` secret in the Supabase Edge Function controls which environment the `plaid-fetch` function uses when fetching transactions.
