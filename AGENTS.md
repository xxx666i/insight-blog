# Insight Blog Agent Guide

## Project

Insight Blog is Xiaoxin's Git-driven, fully static personal blog. It is published at `https://xxx666i.github.io/insight-blog/`.

## Setup and Checks

- Use Node.js 24 and pnpm 10.30.2.
- Install with `pnpm install --frozen-lockfile`.
- Run locally with `pnpm dev`.
- Run `pnpm check` for Astro and TypeScript diagnostics.
- Run `pnpm test` for the production build, artifact audit, and Playwright tests.
- Run `pnpm test:pages` after URL, asset, routing, or deployment changes.

## Stack

Astro 6, TypeScript 6, Content Collections, Markdown/MDX, Tailwind CSS 4, Playwright, GitHub Actions, and GitHub Pages.

## Structure and Conventions

- `src/content/posts/`: long-form posts.
- `src/content/notes/`: short notes; titles are optional.
- `src/content/projects/`: project records.
- Keep each entry in its own directory with an `index.md` or `index.mdx` file and colocated assets.
- Use stable lowercase kebab-case slugs. Do not change a published slug without an explicit redirect plan.
- `draft: true` content must stay out of production pages, search, RSS, and Sitemap output.
- Site identity and navigation belong in `src/config.ts`; collection fields belong in `src/content.config.ts`.
- Use the existing `withBase()` helper or Astro base URL for internal links. Production is served from `/insight-blog/`.

## Package and Release Rules

- pnpm is the only package manager. Commit `pnpm-lock.yaml`; do not add npm or Yarn lockfiles.
- Do not edit generated directories: `.astro/`, `dist/`, `node_modules/`, `test-results/`, or `playwright-report/`.
- Work on a short-lived branch, open a Pull Request, and merge into `main` only after checks pass.
- A push to `main` deploys the public GitHub Pages site through `.github/workflows/deploy.yml`.
