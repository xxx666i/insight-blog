import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const common = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  publishedAt: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  lang: z.string().default('zh-CN'),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: ({ image }) => common.extend({
    title: z.string(),
    description: z.string(),
    updatedAt: z.coerce.date().optional(),
    cover: image().optional(),
    math: z.boolean().default(false),
    mermaid: z.boolean().default(false),
    codeLicense: z.string().optional(),
  }),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
  schema: common.extend({
    title: z.string().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: ({ image }) => common.extend({
    title: z.string(),
    summary: z.string(),
    status: z.enum(['in-progress', 'completed', 'archived']),
    featured: z.boolean().default(false),
    period: z.string().optional(),
    role: z.string().optional(),
    technologies: z.array(z.string()).default([]),
    image: image().optional(),
    externalUrl: z.url().optional(),
    sourceUrl: z.url().optional(),
  }),
});

export const collections = { posts, notes, projects };
