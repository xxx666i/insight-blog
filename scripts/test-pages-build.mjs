import { spawnSync } from 'node:child_process';

const repository = process.env.GITHUB_REPOSITORY ?? 'xxx666i/insight-blog';
const [owner, repositoryName] = repository.split('/');
const isUserSite = repositoryName.toLowerCase() === `${owner}.github.io`.toLowerCase();
const expectedBase = isUserSite ? '/' : `/${repositoryName}`;

const env = {
  ...process.env,
  ASTRO_TELEMETRY_DISABLED: '1',
  INSIGHT_BLOG_PAGES_BUILD: 'true',
  GITHUB_REPOSITORY: repository,
};

const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const build = spawnSync(pnpmCommand, ['run', 'build'], { stdio: 'inherit', env, shell: process.platform === 'win32' });
if (build.error) console.error(build.error);
if (build.status !== 0) process.exit(build.status ?? 1);

const audit = spawnSync(process.execPath, ['scripts/audit-build.mjs'], {
  stdio: 'inherit',
  env: { ...env, EXPECTED_BASE: expectedBase },
});
if (audit.error) console.error(audit.error);
process.exit(audit.status ?? 1);
