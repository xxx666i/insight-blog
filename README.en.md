# Insight Blog

[简体中文](./README.md) · [English](./README.en.md)

Xiaoxin's Git-driven personal blog. Astro Content Collections keep posts, notes, and projects in the repository, while static generation provides a simple, fast, and portable publishing workflow.

- Live site: [https://xxx666i.github.io/insight-blog/](https://xxx666i.github.io/insight-blog/)
- Repository: [xxx666i/insight-blog](https://github.com/xxx666i/insight-blog)

## Features

- Typed content collections for posts, notes, and projects, validated with Zod;
- Markdown and MDX with GFM, math, Mermaid, and footnotes;
- Dual-theme Shiki highlighting with filenames, line numbers, highlighted lines, and diffs;
- Tag archives, local full-text search, related posts, and reading-time estimates;
- RSS, Sitemap, robots.txt, and generated Open Graph images;
- Light, dark, and system theme preferences;
- Responsive layouts, mobile navigation, and a custom 404 page;
- Static-output auditing and Playwright acceptance tests for desktop and mobile;
- Automated verification and GitHub Pages deployment through GitHub Actions.

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | Astro 6, TypeScript 6, vanilla JavaScript |
| Content | Astro Content Collections, Markdown, MDX, Zod |
| Styling | Tailwind CSS 4, scoped Astro CSS, Noto Serif SC |
| Markdown | Remark GFM, Remark Math, KaTeX, Mermaid, Shiki |
| Site output | RSS, Sitemap, Satori, Resvg |
| Testing | Astro Check, custom build audit, Playwright |
| Tooling | Node.js 24, pnpm 10.30.2, GitHub Actions, GitHub Pages |

The site is fully static and requires no backend service, database, or CMS.

## Quick Start

### Requirements

- Node.js 24;
- pnpm 10.30.2, pinned through the `packageManager` field.

Corepack can provision the matching pnpm version:

```bash
corepack enable
corepack install
```

### Install and Run

```bash
git clone git@github.com:xxx666i/insight-blog.git
cd insight-blog
pnpm install --frozen-lockfile
pnpm dev
```

Open [http://localhost:4321](http://localhost:4321). Press `Ctrl + C` to stop the development server.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the local development server |
| `pnpm check` | Run Astro and TypeScript diagnostics |
| `pnpm build` | Generate the static site in `dist/` |
| `pnpm preview` | Preview the production build locally |
| `pnpm test:routes` | Audit output files, internal links, drafts, and the search index |
| `pnpm test:e2e` | Run desktop and mobile Playwright tests |
| `pnpm test` | Run diagnostics, build, output audit, and E2E tests |
| `pnpm test:pages` | Verify the `/insight-blog/` GitHub Pages base path |

To use another development port:

```bash
pnpm dev -- --port 4322
```

## Project Structure

```text
.
├─ .github/workflows/       # CI and GitHub Pages deployment
├─ public/                  # Static assets copied as-is
├─ scripts/                 # Build-output and Pages-path audits
├─ src/
│  ├─ components/           # Reusable UI components
│  ├─ content/              # Posts, notes, and project content
│  ├─ layouts/              # Page and article layouts
│  ├─ lib/                  # Content queries and URL helpers
│  ├─ pages/                # Astro routes and resource endpoints
│  ├─ styles/               # Global design tokens and styles
│  ├─ config.ts             # Site identity, author, avatar, and navigation
│  └─ content.config.ts     # Content Collection schemas
├─ tests/                   # Playwright acceptance tests
├─ astro.config.mjs         # Astro, Markdown, and build configuration
└─ pnpm-lock.yaml           # Reproducible dependency lockfile
```

## Content Management

| Type | Directory | Purpose |
| --- | --- | --- |
| Posts | `src/content/posts/` | Complete long-form writing |
| Notes | `src/content/notes/` | Short fragments and observations |
| Projects | `src/content/projects/` | Project context, trade-offs, and outcomes |

Keep each entry in its own directory with an `index.md` or `index.mdx` file and colocated images. Use a stable lowercase kebab-case `slug`; avoid changing published slugs because they define permanent URLs.

### Create a Post

```md
---
slug: my-first-post
title: My First Post
description: A one-sentence description of the post.
publishedAt: 2026-08-12
tags:
  - Astro
draft: true
lang: en
math: false
mermaid: false
---

Start writing here.
```

Posts also support `updatedAt`, `cover`, and `codeLicense`.

### Create a Note

```md
---
slug: a-small-thought
publishedAt: 2026-08-12
tags:
  - Notes
draft: true
lang: en
---

A thought that does not need to become a full article.
```

The `title` field is optional for notes.

### Create a Project

Projects require `title`, `summary`, and `status`. Valid status values are `in-progress`, `completed`, and `archived`.

Optional project fields include `featured`, `period`, `role`, `technologies`, `image`, `externalUrl`, and `sourceUrl`.

### Drafts and Publishing

Entries with `draft: true` remain visible during local development but are excluded from production pages, search, RSS, and Sitemap output. Change the field to `false`, run `pnpm test`, and merge the change into `main` through a Pull Request to publish it.

## Markdown Extensions

Math and Mermaid rendering must also be enabled in post frontmatter:

```yaml
math: true
mermaid: true
```

Code fences accept display metadata:

````md
```ts title="src/example.ts" showLineNumbers {2}
const ready = true;
console.log(ready);
```
````

## Customization

Edit [`src/config.ts`](./src/config.ts) to change the site title, author identity, GitHub URL, contact email, avatar, About-page content, and primary navigation. The avatar is currently empty, so the UI displays a reserved placeholder. Use either an absolute external URL or a static asset URL that accounts for the deployment base path.

## Testing and Quality Gates

Before opening a Pull Request, run:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm test:pages
```

`pnpm test` runs type diagnostics, builds 15 HTML pages, validates internal links and search/RSS output, and exercises the site in desktop and mobile browsers. `pnpm test:pages` rebuilds the site and validates the GitHub Pages subpath.

## Deployment

The workflow in [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) performs the following steps:

1. Pull Requests run diagnostics, builds, and browser acceptance tests;
2. pushes or merges to `main` repeat verification;
3. the official Astro action builds the static artifact;
4. GitHub Pages publishes it at `https://xxx666i.github.io/insight-blog/`.

`INSIGHT_BLOG_PAGES_BUILD` is an internal workflow flag that enables the `/insight-blog/` base path.

Astro also accepts `PUBLIC_SITE_URL=https://example.com` at build time, which selects that site URL and the `/` base path. To use it in GitHub Actions, explicitly pass the variable through the workflow and complete DNS and domain verification in GitHub Pages settings.

## FAQ

### Can `node_modules` be deleted?

Yes. It is ignored local output. Restore it with `pnpm install --frozen-lockfile`.

### Why is `pnpm-lock.yaml` the only dependency lockfile?

pnpm is the project's only package manager. Do not generate or commit `package-lock.json` or `yarn.lock`, because multiple lockfiles can produce different local and CI dependency trees.

### Why can Pages links fail when local development works?

GitHub Project Pages serves the site from `/insight-blog/`. Internal links should use the existing `withBase()` helper or Astro's configured base path instead of assuming root deployment.

## Copyright

Original writing and images are all rights reserved by default. Code samples are available under a separate license only when their frontmatter explicitly defines `codeLicense`.
