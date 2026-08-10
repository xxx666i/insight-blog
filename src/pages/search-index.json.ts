import type { APIRoute } from 'astro';
import { excerpt, formatDate, getNotes, getPosts, getProjects, plainText } from '../lib/content';
import { withBase } from '../lib/url';

export const GET: APIRoute = async () => {
  const [posts, notes, projects] = await Promise.all([getPosts(), getNotes(), getProjects()]);
  const index = [
    ...posts.map((entry) => ({
      type: 'post',
      title: entry.data.title,
      date: formatDate(entry.data.publishedAt),
      url: withBase(`posts/${entry.id}/`),
      tags: entry.data.tags,
      text: plainText(`${entry.data.description} ${entry.body ?? ''}`),
    })),
    ...notes.map((entry) => ({
      type: 'note',
      title: entry.data.title ?? '无题随记',
      date: formatDate(entry.data.publishedAt),
      url: withBase(`notes/${entry.id}/`),
      tags: entry.data.tags,
      text: excerpt(entry.body, 220),
    })),
    ...projects.map((entry) => ({
      type: 'project',
      title: entry.data.title,
      date: formatDate(entry.data.publishedAt),
      url: withBase(`projects/${entry.id}/`),
      tags: [...entry.data.tags, ...entry.data.technologies],
      text: plainText(`${entry.data.summary} ${entry.body ?? ''}`),
    })),
  ];

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
