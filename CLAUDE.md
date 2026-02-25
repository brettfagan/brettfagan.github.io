# Claude Instructions — brettfagan.github.io

## Git / PR Workflow
**Always use feature branches and PRs. Never commit directly to `main`.**

1. Create a branch: `git checkout -b feat/short-description` (use `feat/`, `fix/`, or `chore/` prefix)
2. Make changes and commit with conventional commit messages (`feat:`, `fix:`, `chore:` lowercase)
3. Push: `git push -u origin <branch>`
4. Open a PR: `gh pr create --title "..." --body "..."`
5. User reviews and merges — merge to `main` triggers auto-deploy to GitHub Pages

## Tech Stack
- **Frontend:** React 18 + Vite, deployed to GitHub Pages
- **Backend:** Supabase (auth, Postgres DB, Edge Functions)
- **Charts:** Recharts
- **Auth:** Google OAuth via Supabase (no passwords)
- **Deploy:** GitHub Actions → GitHub Pages on push to `main`

## Project Structure
```
src/tools/spend-analyzer/     # Main app
  SpendAnalyzer.jsx           # Root component, state management
  components/                 # UI components
  context/                    # React context providers (Auth, Categories, CsvRules, DetailLabels)
  lib/
    supabase.js               # Supabase client
    parse.js                  # normPlaid(), parseCSV(), guessCat()
    constants.js              # CARDS array, CAT_COLORS, EXCLUDED, SUBCATEGORIES
supabase/functions/           # Edge Functions (Deno/TypeScript)
.github/workflows/            # CI/CD
```

## Key Patterns
- All Supabase queries include `.eq('user_id', user.id)` — required for RLS
- Card IDs from the hardcoded `CARDS` constant are used as keys in `loadedData`; dynamic sources (e.g. Plaid API connections) use the card name as the key — `handleAnalyze` falls back to `id` as label when not in `CARDS`
- Supabase project ID: `ufnpwuygtgfdruvxadpm`
- Edge Function secrets (never in client code): `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV`

## Database Tables
| Table | Purpose |
|-------|---------|
| `imported_transactions` | Main transaction store |
| `categories` | User-defined category config |
| `csv_rules` | Regex-based CSV categorization rules |
| `detail_labels` | Human-readable subcategory labels |
| `plaid_connections` | Saved Plaid access tokens (RLS scoped) |

## Supabase Edge Functions
- Secrets are set in Supabase dashboard, never in code or `.env`
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` are auto-injected — do not set manually
- Use the user's JWT (`Authorization` header) to create a scoped Supabase client inside functions — this enforces RLS automatically
