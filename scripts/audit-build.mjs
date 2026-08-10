import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { parseHTML } from 'linkedom';

const root = resolve('dist');
const base = (process.env.EXPECTED_BASE || '/').replace(/\/$/, '') || '/';
const failures = [];

const expected = [
  'index.html',
  'posts/index.html',
  'posts/welcome/index.html',
  'notes/index.html',
  'notes/quiet-interface/index.html',
  'projects/index.html',
  'projects/personal-archive/index.html',
  'search-index.json',
  'rss.xml',
  'sitemap-index.xml',
  'og/site.png',
];

for (const file of expected) {
  if (!existsSync(join(root, file))) failures.push(`缺少构建产物：${file}`);
}

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function resolvesInternal(url) {
  if (!url || /^(https?:|mailto:|tel:|data:|#)/.test(url)) return true;
  const withoutQuery = decodeURIComponent(url.split(/[?#]/)[0]);
  if (!withoutQuery.startsWith('/')) return true;
  if (base !== '/' && !withoutQuery.startsWith(`${base}/`) && withoutQuery !== base) return false;
  let local = base === '/' ? withoutQuery : withoutQuery.slice(base.length);
  local = local.replace(/^\//, '');
  const target = join(root, local);
  return existsSync(target) || existsSync(join(target, 'index.html')) || existsSync(`${target}.html`);
}

const htmlFiles = walk(root).filter((file) => file.endsWith('.html'));
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const { document } = parseHTML(html);
  const label = relative(root, file).split(sep).join('/');
  const h1s = document.querySelectorAll('h1');
  if (h1s.length !== 1) failures.push(`${label} 应有且仅有一个 h1，实际为 ${h1s.length}`);
  if (document.body.textContent.includes('本地草稿')) failures.push(`${label} 泄露了草稿内容`);
  for (const element of document.querySelectorAll('[href], [src]')) {
    const url = element.getAttribute('href') || element.getAttribute('src') || '';
    if (!resolvesInternal(url)) failures.push(`${label} 中的内部链接无法解析：${url}`);
  }
}

const searchIndex = JSON.parse(readFileSync(join(root, 'search-index.json'), 'utf8'));
if (searchIndex.length !== 4) failures.push(`搜索索引应包含 4 条示例内容，实际为 ${searchIndex.length}`);
if (!readFileSync(join(root, 'rss.xml'), 'utf8').includes('这个网站从一个很朴素的愿望开始')) {
  failures.push('RSS 未包含文章全文');
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log(`静态产物巡检通过：${htmlFiles.length} 个 HTML 页面，基路径 ${base}`);
