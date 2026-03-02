# brettlabs.dev

Personal portfolio site and tooling, built with React + Vite and deployed to Vercel.

**Live site:** [brettlabs.dev](https://www.brettlabs.dev)

---

## Project structure

```
├── src/
│   ├── main.jsx
│   ├── globals.css             # Tailwind v4 + shadcn/ui CSS variables (single CSS entry)
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components (button, dialog, input, etc.)
│   │   └── ...                 # Portfolio page sections (Hero, About, My Work, Projects, etc.)
│   ├── lib/
│   │   └── utils.js            # shadcn cn() utility
│   └── tools/
│       └── spend-analyzer/     # Spend Analyzer app
│           ├── SpendAnalyzer.jsx
│           ├── components/
│           ├── context/        # Auth, Categories, CatRules, DetailLabels
│           └── lib/            # supabase.js, parse.js, constants.js, format.js
├── supabase/
│   └── functions/
│       ├── plaid-fetch/        # Edge Function: live Plaid transaction fetch + sync
│       ├── send-invite/        # Edge Function: send partner invite email via Resend
│       └── accept-invite/      # Edge Function: accept a partner invite token
├── docs/
│   └── plaid-setup.md          # Step-by-step guide for Plaid token setup
├── .github/
│   └── PULL_REQUEST_TEMPLATE.md
├── vite.config.js
├── components.json             # shadcn/ui config
└── package.json
```

---

## Development

```bash
npm install
npm run dev       # local dev server
npm run build     # production build → dist/
npm run preview   # preview production build locally
```

---

## Deployment

Pushes to `main` automatically trigger a Vercel deployment. No manual steps required — Vercel detects the push, runs `npm run build`, and publishes the `dist/` output.

The site is live at [brettlabs.dev](https://www.brettlabs.dev).

---

## Spend Analyzer

A personal financial transaction analysis tool available at `/tools/spend-analyzer/`. Requires Google sign-in to access persistent features.

### Architecture

- **Frontend:** React 18 + Vite + Tailwind CSS v4 + shadcn/ui, hosted on Vercel
- **Backend:** Supabase (Google OAuth, Postgres DB, Edge Functions)
- **Plaid integration:** via the `plaid-fetch` Edge Function (Deno/TypeScript)
- **Email:** Resend API via the `send-invite` Edge Function

### Features

#### Import & analysis (session-only)
- **Multi-card import** — load up to 4 accounts simultaneously, each as Plaid JSON or CSV
- **Plaid JSON support** — paste or drag-drop a `/transactions/get` response; parses all Plaid fields natively
- **CSV support** — auto-detects column layout from Chase, Mint, Capital One, and generic exports
- **Spending breakdown** — category and subcategory totals with bar charts, click to filter transactions
- **Transaction tables** — separate sections for Pending, Posted, and Credits/Refunds, each with fixed aligned columns:
  - Date · Merchant · Category · Subcategory · Channel · Card · Amount
- **Merchant logos** — pulled from Plaid's `logo_url` field and displayed inline
- **Transaction detail modal** — click any row to see full Plaid metadata including location, counterparties, authorized datetime, account/transaction IDs
- **Search & filter** — filter by keyword, category, subcategory, date range, and card
- **Sortable columns** — click Date, Merchant, or Amount headers to sort
- **Low confidence indicator** — merchant names with low Plaid categorization confidence are outlined in red
- **Summary stats** — cards (with card count + transaction count), total posted spend, pending spend, credits, and net spend at a glance
- **Dark mode** — toggle light/dark theme from the header

#### Live Plaid connections (requires sign-in)
- **Saved Plaid connections** — paste an access token once; it's saved to the DB and auto-loaded on future sessions
- **Account type badging** — connections display "Bank", "Credit Card", or "Mixed" based on Plaid account types
- **Fetch All** — pulls up to 2 years of transaction history
- **Sync** — incremental update since last fetch using Plaid's cursor-based sync API
- See [docs/plaid-setup.md](docs/plaid-setup.md) for the full token setup walkthrough

#### Persistent storage (requires sign-in)
- **Save to My Spending** — import analyzed transactions into the DB with duplicate detection; confirmation modal prevents accidental imports
- **My Spending page** — view and manage all saved transactions across sessions
- **Per-card summary** — count and date range for each saved card/account
- **Bulk recategorization** — reassign a transaction's category; optionally apply to all transactions with the same merchant; confirmation modal before applying
- **Bulk delete** — select multiple transactions via checkboxes; shift-click to range-select; action bar between category breakdown and the table; batched in chunks of 100 with a phase-based result dialog
- **Single-delete** — two-step confirm inside the transaction detail modal (no accidental inline row deletions)
- **URL state persistence** — active view, filters, and date range are encoded in URL query params so links are shareable and page refreshes preserve state

#### Budget (requires sign-in)
- **My Budget page** — set monthly spend targets per category and subcategory; inline editing with automatic save

#### Customization (requires sign-in)
- **Custom categories** — add, edit, or delete spending categories; configure exclusions (e.g. loan payments, transfers)
- **Categorization rules** — regex-based rules that auto-categorize transactions by merchant name (applies to both CSV imports and recategorization)
- **Detail labels** — human-readable names for Plaid subcategory codes (e.g. display "Coffee" instead of `FOOD_AND_DRINK_COFFEE`)

#### Partner access (requires sign-in)
- **Invite a partner** — enter a partner's Google account email; they receive an invite link via email (sent through Resend)
- **Limited read access** — partner can browse transactions and recategorize, but cannot import data, delete transactions, or access settings
- **Manage the link** — cancel a pending invite or remove an active partner link at any time from Settings
- **Accept flow** — invite token in the URL is resolved by the `accept-invite` Edge Function, then the partner is redirected into the app

#### Settings (requires sign-in)
Full-page settings area with a left-nav sidebar covering:
- Categories
- Categorization Rules
- Detail Labels
- Partner Access
- Budget

### Supabase tables

| Table | Purpose |
|---|---|
| `imported_transactions` | All saved transactions, scoped by `user_id` |
| `plaid_connections` | Saved Plaid access tokens (card name, account type, cursor) |
| `categories` | User-defined category config (key, label, color, excluded flag) |
| `cat_rules` | Regex-based categorization rules (merchant → category) |
| `detail_labels` | Human-readable subcategory labels |
| `budget_items` | Monthly budget targets per category/subcategory |
| `partner_invites` | Pending partner invite tokens |
| `partner_access` | Active partner links (master ↔ partner user IDs) |

All tables use Row Level Security (RLS) scoped to `user_id`.

### Supabase Edge Functions

| Function | Purpose |
|---|---|
| `plaid-fetch` | Fetch or sync Plaid transactions; save to `imported_transactions` |
| `send-invite` | Create a partner invite record and send the invite email via Resend |
| `accept-invite` | Validate an invite token and create the `partner_access` record |

### Plaid fields used

| Field | Usage |
|---|---|
| `merchant_name` / `name` | Merchant display name |
| `logo_url` | Inline logo in table + modal |
| `website` | Clickable link in modal |
| `payment_channel` | Channel column (`in store`, `online`, etc.) |
| `personal_finance_category` | Category, subcategory, confidence level |
| `pending` | Separated into Pending section |
| `authorized_date` / `authorized_datetime` | Shown in modal |
| `datetime` | Precise timestamp in modal |
| `location` | Address + Google Maps link in modal |
| `counterparties` | Name, type, logo in modal |
| `transaction_id` / `account_id` | Reference IDs in modal |

### CSV auto-detection

Recognized column names (case-insensitive):

- **Date** — `date`, `transaction date`, `trans date`
- **Merchant** — `description`, `merchant`, `name`, `payee`, `memo`
- **Amount** — `amount`, `debit`, `charge`
- **Category** — `category`

If amounts are mostly negative (Mint-style), they are automatically sign-flipped. Rows with `type = payment` are excluded.
