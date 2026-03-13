# Claude Instructions — brettfagan.github.io

## Git / PR Workflow
**Always use feature branches and PRs. Never commit directly to `main`.**

1. **Before starting any new task**, sync main first: `git checkout main && git pull`
2. Create a branch: `git checkout -b feat/short-description` (use `feat/`, `fix/`, or `chore/` prefix)
3. Make changes and commit with conventional commit messages (`feat:`, `fix:`, `chore:` lowercase)
4. Push: `git push -u origin <branch>`
5. Open a PR: `gh pr create --title "..." --body "..."`
6. User reviews and merges — merge to `main` triggers auto-deploy to Vercel

**Warning signal:** If `git push` (to a branch you've already pushed before) outputs `[new branch]` instead of updating the existing remote branch, stop immediately — the remote branch was likely deleted after a merge. Run `git checkout main && git pull` and create a fresh branch before continuing. Note: `[new branch]` is expected and correct on the *first* push of a brand-new branch (`git push -u origin <branch>`) — that is not a warning.

## Codex Review
Codex (chatgpt-codex-connector[bot]) automatically reviews every PR. **All Codex feedback must be addressed before the PR is merged.**

Fetch inline comments with:
```
gh api repos/brettfagan/brettfagan.github.io/pulls/<number>/comments | jq '[.[] | select(.user.login | contains("codex")) | {path, line: .original_line, body}]'
```

For each comment:
- Read the flagged file and line to understand the current code
- Determine if the issue is still present (it may be moot if later code changed the area)
- If still present, fix it in the same branch before requesting merge
- If moot or already resolved, note why and move on

Priority badges: **P1** (orange) = blocking, fix immediately; **P2** (yellow) = important, fix before merge.

## Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS v4 + shadcn/ui, deployed to Vercel
- **Backend:** Supabase (auth, Postgres DB, Edge Functions)
- **Charts:** Recharts
- **Auth:** Google OAuth via Supabase (no passwords)
- **Deploy:** Vercel (auto-deploys on push to `main`)

## Project Structure
```
src/tools/spend-analyzer/     # Main app
  SpendAnalyzer.jsx           # Root component, state management
  components/                 # UI components
  context/                    # React context providers (Auth, Categories, CatRules, DetailLabels)
  lib/
    supabase.js               # Supabase client
    parse.js                  # normPlaid(), parseCSV(), guessCat()
    constants.js              # CARDS array, CAT_COLORS, EXCLUDED, SUBCATEGORIES
supabase/functions/           # Edge Functions (Deno/TypeScript)
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
| `cat_rules` | Regex-based categorization rules (renamed from `csv_rules`) |
| `detail_labels` | Human-readable subcategory labels |
| `plaid_connections` | Saved Plaid access tokens (RLS scoped) |
| `budget_items` | Monthly budget targets per category/subcategory |
| `partner_invites` | Pending partner invite tokens |
| `partner_access` | Active partner links (owner ↔ partner user IDs) |

## Supabase Edge Functions
- Secrets are set in Supabase dashboard, never in code or `.env`
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` are auto-injected — do not set manually
- Use the user's JWT (`Authorization` header) to create a scoped Supabase client inside functions — this enforces RLS automatically

<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:

Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.

Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.

Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.

Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>
