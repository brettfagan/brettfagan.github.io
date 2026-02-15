# Brett Fagan Portfolio (React + Vite)

A minimal personal landing page built with React and Vite for deployment to GitHub Pages at `brettfagan.github.io`.

## Getting started

```bash
npm install
npm run dev
```

## Build for production

```bash
npm run build
```

## Preview production build

```bash
npm run preview
```

## Deploy to GitHub Pages

This repo includes a GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) that builds and deploys the `dist` output to GitHub Pages whenever `main` is updated.

After merging, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

If you later use this setup for a project site (for example `username.github.io/repo-name`), update `base` in `vite.config.js` to `/repo-name/` before deploying.

## Migrating from a project URL to `brettfagan.github.io`

To serve this at `https://brettfagan.github.io/` (without the repo suffix), confirm all of the following:

1. Your GitHub username is `brettfagan`.
2. The repository name is exactly `brettfagan.github.io`.
3. The Vite `base` is `/` in `vite.config.js`.
4. GitHub Pages is enabled for the published branch.

## Credit card spending analyzer: suggested next steps

Now that the portfolio is live, use a short implementation plan to de-risk the analyzer before you write a lot of code.

### 1) Define MVP scope and success criteria

Decide what "v1 done" means in concrete terms:

- Import support (CSV upload first, API integrations later).
- Automatic categorization rules for common merchants.
- Monthly spending breakdown by category.
- A simple "insights" panel (top categories, unusual month-over-month changes).

Write this down as a checklist so every later decision maps back to MVP.

### 2) Lock in data model + ingestion contract

Standardize raw transaction fields up front (date, merchant, amount, card, category, notes) and define how each issuer CSV maps into this shape. This avoids repeated parser rewrites.

### 3) Build parser + normalization layer first

Implement a deterministic import pipeline:

1. Parse file.
2. Normalize headers and date/amount formats.
3. Deduplicate transactions.
4. Validate required fields.
5. Persist normalized records.

Treat this as a core module with tests because every feature depends on it.

### 4) Ship read-only analytics views next

Before budgets, alerts, or recommendations, get baseline analytics working:

- Total spend by month.
- Category distribution chart.
- Merchant leaderboard.
- Filter by date range/card.

This gives immediate user value and validates your data quality.

### 5) Add categorization quality loop

Support both:

- Rule-based auto-categorization (merchant regex / exact match).
- Manual recategorization in UI.

Every manual fix should improve future imports via saved rules.

### 6) Add guardrails for privacy and trust

Because this is financial data, include:

- Local-first storage where possible.
- Clear data retention/deletion controls.
- Basic encryption-at-rest if backend storage is introduced.
- Transparent disclaimer that this is an analyzer, not financial advice.

### 7) Roadmap after MVP

Once the ingestion + analytics core is stable, prioritize:

- Budget targets + over-budget alerts.
- Recurring subscription detection.
- Simple forecasting and trend projections.
- Optional bank/API sync (Plaid, etc.) behind feature flags.
