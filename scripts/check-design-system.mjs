import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';

const root = resolve('.');
const sourceRoot = join(root, 'src');
const tokenPath = join(sourceRoot, 'design-system', 'tokens.css');
const foundationPath = join(sourceRoot, 'design-system', 'foundations.css');
const globalPath = join(sourceRoot, 'styles', 'global.css');
const failures = [];
const warnings = [];

const tokens = readFileSync(tokenPath, 'utf8');
const foundations = readFileSync(foundationPath, 'utf8');
const globalCss = readFileSync(globalPath, 'utf8');

const requiredTokens = [
  '--color-bg-canvas',
  '--color-bg-raised',
  '--color-text-heading',
  '--color-text-primary',
  '--color-text-secondary',
  '--color-border',
  '--color-overlay',
  '--color-search-highlight',
  '--color-text-interactive',
  '--color-scrollbar-thumb',
  '--color-accent',
  '--color-info',
  '--color-success',
  '--color-warning',
  '--color-error',
  '--font-sans',
  '--font-serif',
  '--font-mono',
  '--font-wordmark',
  '--text-copy-14',
  '--text-copy-14--line-height',
  '--text-title-28',
  '--text-title-28--line-height',
  '--radius-md',
  '--shadow-whisper',
  '--shadow-overlay',
  '--duration-base',
  '--ease-standard',
];

for (const token of requiredTokens) {
  if (!tokens.includes(`${token}:`)) failures.push(`Missing required token: ${token}`);
}

if (!globalCss.includes('../design-system/index.css')) {
  failures.push('Missing global import: ../design-system/index.css');
}

for (const requiredFont of [
  'noto-serif-sc-chinese-simplified-400-normal.woff2',
  'noto-serif-sc-chinese-simplified-500-normal.woff2',
]) {
  if (!foundations.includes(requiredFont)) failures.push(`Missing bundled font source: ${requiredFont}`);
}

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const runtimeFiles = walk(sourceRoot).filter((file) => {
  if (file.startsWith(join(sourceRoot, 'design-system'))) return false;
  if (file.includes(`${sep}pages${sep}og${sep}`)) return false;
  return ['.astro', '.css'].includes(extname(file));
});

for (const file of runtimeFiles) {
  const source = readFileSync(file, 'utf8');
  const label = relative(root, file).split(sep).join('/');

  if (/#[0-9a-f]{3,8}\b/gi.test(source) || /rgba?\s*\(/gi.test(source)) {
    failures.push(`${label}: raw color found; add or use an Insight color token`);
  }

  for (const match of source.matchAll(/font-family\s*:\s*([^;}\n]+)/gi)) {
    const value = match[1].trim();
    if (!value.includes('var(--font-') && value !== 'inherit') {
      failures.push(`${label}: font-family must use an Insight font role (${value})`);
    }
  }

  const hardcodedType = source.match(/font-size\s*:\s*(?:clamp\([^)]*\d+(?:\.\d+)?px[^)]*\)|\d+(?:\.\d+)?px)/gi) ?? [];
  if (hardcodedType.length) warnings.push(`${label}: ${hardcodedType.length} hardcoded type size(s) remain`);
}

if (warnings.length) {
  console.warn(`Insight design system migration notes:\n${warnings.map((warning) => `- ${warning}`).join('\n')}`);
}

if (failures.length) {
  console.error(`Insight design system check failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
  process.exit(1);
}

console.log(`Insight design system check passed (${requiredTokens.length} contract tokens, ${runtimeFiles.length} runtime files).`);
