# Insight Design System

This directory is the runtime design contract for Insight Blog. The repository-level
`design-system/` directory is reference material; application code must consume this
directory instead.

## Direction

Insight is a quiet personal archive: warm paper, editorial serif headings, clear
Chinese body text, restrained ume accent, generous whitespace, and precise mono
metadata. Clarity wins over decoration.

## Layers

- `tokens.css` is the single source of truth for color, typography, spacing, shape,
  depth, motion, and layout values.
- `foundations.css` applies global document, accessibility, theme, and motion rules.
- `patterns.css` owns reusable site patterns such as page shells, headings, metadata,
  tags, and empty states.
- `index.css` is the only design-system stylesheet imported by the application.

## Usage rules

1. Prefer semantic tokens such as `--color-text-secondary` and
   `--color-bg-raised`; only design-system internals should choose palette steps.
2. Use the role-based type scale (`--text-copy-14`, `--text-title-24`, etc.) and its
   paired line-height token. Chinese headings cap at weight `500`.
3. Use the four-pixel spacing rhythm and the declared radius, blur, shadow, duration,
   and easing tokens instead of inventing nearby values.
4. Accent is reserved for identity, focus, and selected state. Textual navigation,
   content links, and clickable titles use the brand-ume
   `--color-text-interactive` for hover and current feedback; icon-only controls may
   move to the heading color instead.
5. New cross-page patterns belong in `patterns.css`; page-specific composition stays
   beside the Astro page or component.
6. Do not import or modify the reference `design-system/` to solve an application-only
   styling problem.

## Compatibility aliases

Existing components still use short variables such as `--n-8`, `--ume`, and
`--ring`. They are aliases to the canonical tokens, so the design system is already
the source of truth while migration can happen incrementally. New code should use
the semantic names.

## Fonts

The foundation layer loads only the bundled WOFF2 simplified-Chinese subsets of
Noto Serif SC at weights 400 and 500. The font roles then compose Latin editorial
faces with deterministic CJK fallbacks without shipping unrelated language subsets
or legacy WOFF duplicates:

- `--font-sans`: interface and body copy.
- `--font-serif`: headings and long-form reading.
- `--font-mono`: dates, labels, code, and technical metadata.
- `--font-wordmark`: the Insight Blog identity only.

## Verification

Run `pnpm check:design` after changing the contract. It verifies required tokens,
the runtime import, bundled font imports, and raw color/font-family drift. Existing
hardcoded type sizes are reported as migration warnings until the page sweep is
complete.
