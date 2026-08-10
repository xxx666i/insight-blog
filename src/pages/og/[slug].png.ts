import type { APIRoute, GetStaticPaths } from 'astro';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { html } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';
import { getNotes, getPosts, getProjects } from '../../lib/content';
import { formatDate } from '../../lib/content';
import { siteConfig } from '../../config';

interface OgProps {
  title: string;
  eyebrow: string;
  description: string;
}

type FontFace = { file: string; ranges: Array<[number, number]> };

function parseFontFaces(): FontFace[] {
  const fontRoot = join(process.cwd(), 'node_modules', '@fontsource', 'noto-serif-sc');
  const css = readFileSync(join(fontRoot, '500.css'), 'utf8');
  return [...css.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)].map((match) => {
    const block = match[1];
    const file = block.match(/\.\/files\/([^)'\"]+\.woff)\)/)?.[1] ?? '';
    const rangeText = block.match(/unicode-range:\s*([^;]+);/)?.[1] ?? '';
    const ranges = rangeText.split(',').map((part) => {
      const [start, end = start] = part.trim().replace(/^U\+/i, '').split('-');
      return [Number.parseInt(start, 16), Number.parseInt(end, 16)] as [number, number];
    }).filter(([start]) => Number.isFinite(start));
    return { file: join(fontRoot, 'files', file), ranges };
  }).filter((face) => face.file && face.ranges.length);
}

const fontFaces = parseFontFaces();

function fontsFor(text: string) {
  const points = [...new Set([...text].map((char) => char.codePointAt(0) ?? 0))];
  const matching = fontFaces.filter((face) => points.some((point) => face.ranges.some(([start, end]) => point >= start && point <= end)));
  return matching.map((face) => ({
    name: 'Noto Serif SC',
    data: readFileSync(face.file),
    weight: 500 as const,
    style: 'normal' as const,
  }));
}

export const getStaticPaths: GetStaticPaths = async () => {
  const [posts, notes, projects] = await Promise.all([getPosts(), getNotes(), getProjects()]);
  return [
    {
      params: { slug: 'site' },
      props: { title: siteConfig.name, eyebrow: 'PERSONAL ARCHIVE', description: siteConfig.subtitle },
    },
    ...posts.map((post) => ({
      params: { slug: `post-${post.id}` },
      props: { title: post.data.title, eyebrow: `文章 · ${formatDate(post.data.publishedAt)}`, description: post.data.description },
    })),
    ...notes.map((note) => ({
      params: { slug: `note-${note.id}` },
      props: { title: note.data.title ?? '一则随记', eyebrow: `随记 · ${formatDate(note.data.publishedAt)}`, description: (note.body ?? '').slice(0, 100) },
    })),
    ...projects.map((project) => ({
      params: { slug: `project-${project.id}` },
      props: { title: project.data.title, eyebrow: 'PROJECT CASE STUDY', description: project.data.summary },
    })),
  ];
};

export const GET: APIRoute<OgProps> = async ({ props }) => {
  const text = `${props.title}${props.eyebrow}${props.description}${siteConfig.name}`;
  const markup = html`<div style="display:flex;width:1200px;height:630px;padding:70px 76px;background:#f8f5ef;color:#282421;font-family:'Noto Serif SC';position:relative;">
    <div style="display:flex;position:absolute;left:76px;right:76px;top:56px;height:1px;background:#d4ccc1;"></div>
    <div style="display:flex;position:absolute;left:76px;top:34px;font-family:monospace;font-size:13px;letter-spacing:2px;color:#756d65;">${props.eyebrow}</div>
    <div style="display:flex;flex-direction:column;justify-content:center;width:920px;">
      <div style="display:flex;font-size:64px;line-height:1.35;letter-spacing:-2px;font-weight:500;">${props.title}</div>
      <div style="display:flex;margin-top:24px;width:760px;font-size:23px;line-height:1.65;color:#756d65;">${props.description}</div>
    </div>
    <div style="display:flex;position:absolute;left:76px;bottom:54px;align-items:center;font-size:23px;">DuDuLu<span style="display:flex;width:8px;height:8px;margin:0 0 13px 5px;border-radius:999px;background:#b85869;"></span></div>
    <div style="display:flex;position:absolute;right:76px;bottom:58px;font-family:monospace;font-size:13px;letter-spacing:2px;color:#938a80;">DUDULU / ARCHIVE</div>
  </div>`;

  const svg = await satori(markup as never, {
    width: 1200,
    height: 630,
    fonts: fontsFor(text),
  });
  const png = new Resvg(svg).render().asPng();
  const body = new ArrayBuffer(png.byteLength);
  new Uint8Array(body).set(png);

  return new Response(body, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
