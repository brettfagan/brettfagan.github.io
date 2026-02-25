# brettfagan.github.io

Personal portfolio site and tooling, built with React + Vite and deployed to GitHub Pages.

**Live site:** [brettfagan.github.io](https://brettfagan.github.io)

---

## Project structure

```
├── src/
│   ├── main.jsx
│   ├── styles.css
│   ├── components/             # Portfolio page sections (Hero, About, Projects, etc.)
│   └── tools/
│       └── spend-analyzer/     # Spend Analyzer app
│           ├── SpendAnalyzer.jsx
│           ├── components/
│           ├── context/        # Auth, Categories, CsvRules, DetailLabels
│           ├── lib/            # supabase.js, parse.js, constants.js, format.js
│           └── main.jsx
├── supabase/
│   └── functions/
│       └── plaid-fetch/        # Edge Function: live Plaid transaction fetch + sync
├── docs/
│   └── plaid-setup.md          # Step-by-step guide for Plaid token setup
├── .github/
│   └── workflows/
│       └── deploy-pages.yml    # CI/CD → GitHub Pages
├── vite.config.js
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

Pushes to `main` trigger the GitHub Actions workflow (`.github/workflows/deploy-pages.yml`), which builds the site and deploys the `dist/` output to GitHub Pages automatically.

**Required GitHub setting:** Settings → Pages → Build and deployment → Source → **GitHub Actions**

The repository must be **public** for GitHub Pages to be available on a free plan.

---

## Spend Analyzer

A personal financial transaction analysis tool available at `/tools/spend-analyzer/`. Requires Google sign-in to access persistent features.

### Architecture

- **Frontend:** React 18 + Vite, hosted on GitHub Pages
- **Backend:** Supabase (Google OAuth, Postgres DB, Edge Functions)
- **Plaid integration:** via the `plaid-fetch` Edge Function (Deno/TypeScript)

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
- **Summary stats** — cards, total posted spend, pending spend, credits, and net spend at a glance

#### Live Plaid connections (requires sign-in)
- **Saved Plaid connections** — paste an access token once; it's saved to the DB and auto-loaded on future sessions
- **Account type badging** — connections display "Bank", "Credit Card", or "Mixed" based on Plaid account types
- **Fetch All** — pulls up to 2 years of transaction history
- **Sync** — incremental update since last fetch using Plaid's cursor-based sync API
- See [docs/plaid-setup.md](docs/plaid-setup.md) for the full token setup walkthrough

#### Persistent storage (requires sign-in)
- **Save to My Spending** — import analyzed transactions into the DB with duplicate detection
- **My Spending page** — view and manage all saved transactions across sessions
- **Per-card summary** — count and date range for each saved card/account
- **Bulk recategorization** — reassign a transaction's category; optionally apply to all transactions with the same merchant

#### Customization (requires sign-in)
- **Custom categories** — add, edit, or delete spending categories; configure exclusions (e.g. loan payments, transfers)
- **CSV rules** — regex-based rules that auto-categorize CSV imports by merchant name
- **Detail labels** — human-readable names for Plaid subcategory codes (e.g. display "Coffee" instead of `FOOD_AND_DRINK_COFFEE`)

### Supabase tables

| Table | Purpose |
|---|---|
| `imported_transactions` | All saved transactions, scoped by `user_id` |
| `plaid_connections` | Saved Plaid access tokens (card name, account type, cursor) |
| `categories` | User-defined category config (key, label, color, excluded flag) |
| `csv_rules` | Regex-based CSV categorization rules |
| `detail_labels` | Human-readable subcategory labels |

All tables use Row Level Security (RLS) scoped to `user_id`.

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
