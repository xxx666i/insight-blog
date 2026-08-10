import { spawnSync } from 'node:child_process';

const env = {
  ...process.env,
  ASTRO_TELEMETRY_DISABLED: '1',
  DUDULU_PAGES_BUILD: 'true',
  GITHUB_REPOSITORY: 'xxx666i/learningDemo',
};

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const build = spawnSync(npmCommand, ['run', 'build'], { stdio: 'inherit', env, shell: process.platform === 'win32' });
if (build.error) console.error(build.error);
if (build.status !== 0) process.exit(build.status ?? 1);

const audit = spawnSync(process.execPath, ['scripts/audit-build.mjs'], {
  stdio: 'inherit',
  env: { ...env, EXPECTED_BASE: '/learningDemo' },
});
if (audit.error) console.error(audit.error);
process.exit(audit.status ?? 1);
