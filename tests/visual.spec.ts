import { expect, test } from '@playwright/test';

test('capture visual review surfaces', async ({ browser }) => {
  test.skip(!process.env.CAPTURE_VISUALS, '仅在人工视觉检查时截图');

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await desktop.goto('/');
  await expect(desktop.getByRole('heading', { level: 1 })).toBeVisible();
  await desktop.waitForTimeout(900);
  await desktop.screenshot({ path: '.scratch/home-desktop.png', fullPage: true });
  await desktop.getByRole('button', { name: '打开搜索' }).click();
  await expect(desktop.locator('.search-tags button').first()).toBeVisible();
  await desktop.screenshot({ path: '.scratch/search-desktop.png' });
  await desktop.getByRole('button', { name: /搜索标签 Astro/ }).click();
  await expect(desktop.getByRole('dialog', { name: '搜索档案' }).getByRole('link', { name: /欢迎来到 Insight Blog/ })).toBeVisible();
  await desktop.screenshot({ path: '.scratch/search-results-desktop.png' });
  await desktop.keyboard.press('Escape');

  const mobile = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1 });
  await mobile.goto('/');
  await expect(mobile.getByRole('heading', { level: 1 })).toBeVisible();
  await mobile.waitForTimeout(900);
  await mobile.screenshot({ path: '.scratch/home-mobile.png', fullPage: true });
  await mobile.getByRole('button', { name: '打开搜索' }).click();
  await expect(mobile.locator('.search-tags button').first()).toBeVisible();
  await mobile.screenshot({ path: '.scratch/search-mobile.png' });
  await mobile.keyboard.press('Escape');

  await desktop.goto('/posts/welcome/');
  await expect(desktop.locator('.mermaid svg')).toBeVisible();
  await desktop.waitForTimeout(900);
  await desktop.screenshot({ path: '.scratch/article-desktop.png', fullPage: true });
  await desktop.getByRole('button', { name: '点赞本文' }).hover();
  await desktop.waitForTimeout(220);
  await desktop.screenshot({ path: '.scratch/article-actions-hover.png' });

  await desktop.goto('/projects/personal-archive/');
  await expect(desktop.locator('.article-header .article-insight')).toBeVisible();
  await desktop.waitForTimeout(400);
  await desktop.screenshot({ path: '.scratch/project-desktop.png' });

  await mobile.goto('/posts/welcome/');
  await expect(mobile.locator('.article-insight')).toBeVisible();
  await mobile.waitForTimeout(400);
  await mobile.screenshot({ path: '.scratch/article-mobile.png', fullPage: true });

  await desktop.goto('/timeline/');
  await expect(desktop.getByRole('heading', { level: 2, name: '2024' })).toBeVisible();
  await desktop.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '文章' }).hover();
  await desktop.waitForTimeout(300);
  await desktop.screenshot({ path: '.scratch/timeline-desktop.png', fullPage: true });

  await mobile.goto('/timeline/');
  await expect(mobile.getByRole('heading', { level: 2, name: '2024' })).toBeVisible();
  await mobile.waitForTimeout(300);
  await mobile.screenshot({ path: '.scratch/timeline-mobile.png', fullPage: true });

  await desktop.close();
  await mobile.close();
});
