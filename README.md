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

For a user/org site named `brettfagan.github.io`, ensure your default branch is configured for GitHub Pages and deploy from `dist`:

```bash
npm run deploy
```

If you later use this setup for a project site (for example `username.github.io/repo-name`), update `base` in `vite.config.js` to `/repo-name/` before deploying.

## Migrating from a project URL to `brettfagan.github.io`

To serve this at `https://brettfagan.github.io/` (without the repo suffix), confirm all of the following:

1. Your GitHub username is `brettfagan`.
2. The repository name is exactly `brettfagan.github.io`.
3. The Vite `base` is `/` in `vite.config.js`.
4. GitHub Pages is enabled for the published branch.
