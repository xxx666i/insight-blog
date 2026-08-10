import { getCollection, type CollectionEntry } from 'astro:content';

export const isPublished = (entry: { data: { draft: boolean } }) =>
  import.meta.env.DEV || !entry.data.draft;

export const sortNewest = <T extends { data: { publishedAt: Date } }>(entries: T[]) =>
  [...entries].sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());

export async function getPosts() {
  return sortNewest((await getCollection('posts')).filter(isPublished));
}

export async function getNotes() {
  return sortNewest((await getCollection('notes')).filter(isPublished));
}

export async function getProjects() {
  return sortNewest((await getCollection('projects')).filter(isPublished));
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function plainText(markdown = '') {
  return markdown
    .replace(/^---[\s\S]*?---/m, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~\-|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function excerpt(markdown = '', length = 120) {
  const text = plainText(markdown);
  return text.length > length ? `${text.slice(0, length).trim()}…` : text;
}

export function readingMinutes(markdown = '') {
  const text = plainText(markdown);
  const cjk = (text.match(/[\u3400-\u9fff]/g) ?? []).length;
  const words = (text.replace(/[\u3400-\u9fff]/g, ' ').match(/[A-Za-z0-9]+/g) ?? []).length;
  return Math.max(1, Math.ceil(cjk / 350 + words / 220));
}

export function uniqueTags(entries: Array<{ data: { tags: string[] } }>) {
  return [...new Set(entries.flatMap((entry) => entry.data.tags))].sort((a, b) =>
    a.localeCompare(b, 'zh-CN'),
  );
}

export function relatedPosts(
  current: CollectionEntry<'posts'>,
  posts: CollectionEntry<'posts'>[],
  limit = 3,
) {
  const tags = new Set(current.data.tags);
  return posts
    .filter((post) => post.id !== current.id)
    .map((post) => ({
      post,
      score: post.data.tags.reduce((sum, tag) => sum + Number(tags.has(tag)), 0),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.post.data.publishedAt.valueOf() - a.post.data.publishedAt.valueOf())
    .slice(0, limit)
    .map(({ post }) => post);
}
