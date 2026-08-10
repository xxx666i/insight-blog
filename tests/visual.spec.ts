import { expect, test } from '@playwright/test';

test('capture visual review surfaces', async ({ browser }) => {
  test.skip(!process.env.CAPTURE_VISUALS, '仅在人工视觉检查时截图');

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await desktop.goto('/');
  await expect(desktop.getByRole('heading', { level: 1 })).toBeVisible();
  await desktop.waitForTimeout(900);
  await desktop.screenshot({ path: '.scratch/home-desktop.png', fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1 });
  await mobile.goto('/');
  await expect(mobile.getByRole('heading', { level: 1 })).toBeVisible();
  await mobile.waitForTimeout(900);
  await mobile.screenshot({ path: '.scratch/home-mobile.png', fullPage: true });

  await desktop.goto('/posts/welcome/');
  await expect(desktop.locator('.mermaid svg')).toBeVisible();
  await desktop.waitForTimeout(900);
  await desktop.screenshot({ path: '.scratch/article-desktop.png', fullPage: true });

  await desktop.close();
  await mobile.close();
});
