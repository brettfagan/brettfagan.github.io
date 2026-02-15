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
