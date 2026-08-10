import rss from '@astrojs/rss';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import { getPosts } from '../lib/content';
import { siteConfig } from '../config';
import { withBase } from '../lib/url';

const parser = new MarkdownIt({ html: false, linkify: true, typographer: true });

export async function GET(context: { site?: URL }) {
  const posts = await getPosts();
  return rss({
    title: siteConfig.name,
    description: siteConfig.description,
    site: context.site!,
    customData: '<language>zh-CN</language><copyright>All rights reserved.</copyright>',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: withBase(`posts/${post.id}/`),
      categories: post.data.tags,
      content: sanitizeHtml(parser.render(post.body ?? ''), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'figure', 'figcaption']),
        allowedAttributes: { a: ['href', 'title'], img: ['src', 'alt', 'title'] },
      }),
    })),
  });
}
