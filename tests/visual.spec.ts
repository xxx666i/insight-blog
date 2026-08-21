import { expect, test } from '@playwright/test';

test('capture visual review surfaces', async ({ browser }) => {
  test.skip(!process.env.CAPTURE_VISUALS, '仅在人工视觉检查时截图');

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await desktop.goto('/');
  await expect(desktop.getByRole('heading', { level: 1 })).toBeVisible();
  await desktop.waitForTimeout(900);
  await desktop.screenshot({ path: '.scratch/home-desktop.png', fullPage: true });
  await desktop.getByRole('button', { name: /选择主题/ }).hover();
  await expect(desktop.getByRole('menu', { name: '选择主题' })).toBeVisible();
  await desktop.screenshot({ path: '.scratch/theme-menu-desktop.png' });
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

  await desktop.goto('/tags/建站/');
  await expect(desktop.locator('.tag-result').first()).toBeVisible();
  await desktop.waitForTimeout(300);
  await desktop.screenshot({ path: '.scratch/tag-desktop.png', fullPage: true });

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

test('capture archive interaction surfaces', async ({ browser }) => {
  test.skip(!process.env.CAPTURE_VISUALS, '仅在人工视觉检查时截图');

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const mobile = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1 });

  await desktop.goto('/notes/');
  await expect(desktop.locator('.archive-count')).toBeVisible();
  await desktop.waitForTimeout(700);
  await desktop.screenshot({ path: '.scratch/notes-archive-desktop.png', fullPage: true });
  await desktop.locator('.note-timeline-item:has(.untitled-link)').hover();
  await desktop.waitForTimeout(240);
  await desktop.screenshot({ path: '.scratch/notes-untitled-hover-desktop.png' });
  await desktop.evaluate(() => window.scrollTo({ top: 520, behavior: 'instant' }));
  await desktop.screenshot({ path: '.scratch/scrollbar-desktop.png' });

  await desktop.goto('/posts/');
  await expect(desktop.locator('.archive-count')).toBeVisible();
  await desktop.waitForTimeout(700);
  await desktop.screenshot({ path: '.scratch/posts-archive-desktop.png', fullPage: true });

  await desktop.goto('/projects/');
  await expect(desktop.locator('.archive-count')).toBeVisible();
  await desktop.waitForTimeout(700);
  await desktop.screenshot({ path: '.scratch/projects-archive-desktop.png', fullPage: true });

  await desktop.goto('/notes/quiet-interface/');
  await expect(desktop.locator('.site-footer')).toBeVisible();
  await desktop.waitForTimeout(700);
  await desktop.screenshot({ path: '.scratch/note-detail-desktop.png', fullPage: true });

  await mobile.goto('/notes/');
  await expect(mobile.locator('.archive-count')).toBeVisible();
  await mobile.waitForTimeout(700);
  await mobile.screenshot({ path: '.scratch/notes-archive-mobile.png', fullPage: true });

  await mobile.goto('/notes/quiet-interface/');
  await expect(mobile.locator('.site-footer')).toBeVisible();
  await mobile.waitForTimeout(700);
  await mobile.screenshot({ path: '.scratch/note-detail-mobile.png', fullPage: true });

  await desktop.close();
  await mobile.close();
});
