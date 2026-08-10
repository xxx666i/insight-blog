import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import {
  transformerMetaHighlight,
  transformerNotationDiff,
  transformerNotationHighlight,
} from '@shikijs/transformers';

const githubRepository = process.env.GITHUB_REPOSITORY ?? 'xxx666i/learningDemo';
const [githubOwner, githubRepo] = githubRepository.split('/');
const customSite = process.env.PUBLIC_SITE_URL?.replace(/\/$/, '');
const isGithubPages = process.env.GITHUB_ACTIONS === 'true' && !customSite;

const codeMetaTransformer = {
  name: 'dudulu:code-meta',
  pre(node) {
    const raw = this.options.meta?.__raw ?? '';
    if (!raw) return;

    node.properties ??= {};
    node.properties['data-meta'] = raw;

    const title = raw.match(/(?:title|filename)=["']([^"']+)["']/)?.[1];
    if (title) node.properties['data-title'] = title;

    if (/showLineNumbers|lineNumbers/.test(raw)) {
      const classes = Array.isArray(node.properties.class)
        ? node.properties.class
        : String(node.properties.class ?? '').split(' ').filter(Boolean);
      classes.push('show-line-numbers');
      node.properties.class = classes;
    }
  },
};

export default defineConfig({
  site: customSite ?? `https://${githubOwner}.github.io`,
  base: isGithubPages ? `/${githubRepo}` : '/',
  trailingSlash: 'always',
  integrations: [mdx(), sitemap()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkGfm, remarkMath],
      rehypePlugins: [
        rehypeKatex,
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: 'wrap' }],
      ],
    }),
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
      transformers: [
        transformerMetaHighlight(),
        transformerNotationHighlight(),
        transformerNotationDiff(),
        codeMetaTransformer,
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      chunkSizeWarningLimit: 1200,
    },
    ssr: {
      external: ['picomatch'],
    },
  },
});
