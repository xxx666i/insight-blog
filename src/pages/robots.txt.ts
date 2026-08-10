import type { APIRoute } from 'astro';
import { canonical, withBase } from '../lib/url';

export const GET: APIRoute = () => new Response(
  `User-agent: *\nAllow: ${withBase('/')}\nSitemap: ${canonical('sitemap-index.xml')}\n`,
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
);
