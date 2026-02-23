# brettfagan.github.io

Personal portfolio site and tooling, built with React + Vite and deployed to GitHub Pages.

**Live site:** [brettfagan.github.io](https://brettfagan.github.io)

---

## Project structure

```
├── src/
│   ├── main.jsx
│   ├── styles.css
│   └── components/
│       ├── Hero.jsx
│       ├── About.jsx
│       ├── Projects.jsx
│       ├── Contact.jsx
│       └── Footer.jsx
├── public/
│   └── tools/
│       └── spend-analyzer/
│           └── index.html      # Standalone Spend Analyzer tool
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

A client-side financial transaction analysis tool available at `/tools/spend-analyzer/`. All processing happens in the browser — no data is sent to any server.

### Features

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
