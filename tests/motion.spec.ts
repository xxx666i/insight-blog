import { expect, test } from '@playwright/test';

test('below-fold content reveals once and remains readable on return', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('.project-item').first();
  await expect(section).toHaveAttribute('data-reveal-state', 'pending');
  await expect(section).toHaveCSS('opacity', '0');
  await section.scrollIntoViewIfNeeded();
  await expect(section).toHaveCSS('opacity', '1');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(section).toHaveCSS('opacity', '1');
  await section.scrollIntoViewIfNeeded();
  await expect(section).toHaveCSS('opacity', '1');
});

test('keyboard focus reveals a pending link without requiring pointer scrolling', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('.project-item').first();
  await expect(card).toHaveAttribute('data-reveal-state', 'pending');
  await card.locator('a').focus();
  await expect(card.locator('a')).toBeFocused();
  await expect(card).toHaveCSS('opacity', '1');
});

test('reduced motion and printing expose all content', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('.project-item').first();
  await expect(card).toHaveAttribute('data-reveal-state', 'pending');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(card).toHaveCSS('opacity', '1');
  await expect(page.locator('.hero-subtitle')).toHaveCSS('animation-delay', '0s');
  await page.reload();
  await expect(card).toHaveCSS('opacity', '1');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload();
  await expect(card).toHaveAttribute('data-reveal-state', 'pending');
  await page.emulateMedia({ media: 'print' });
  await expect(card).toHaveCSS('opacity', '1');
});

test('content and project links work without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/');
  const card = page.locator('.project-item').first();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveCSS('opacity', '1');
  await card.locator('a').click();
  await expect(page).toHaveURL(/\/projects\/.+/);
  await context.close();
});

test('project glow responds to a mouse and stays disabled for reduced motion', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Mouse tracking is intentionally desktop-only');
  await page.goto('/');
  const card = page.locator('.project-item').first();
  await card.hover({ position: { x: 100, y: 70 } });
  await expect(card.locator('.project-glow')).toHaveCSS('opacity', '1');
  await expect(card).toHaveAttribute('data-glow', '');
  await page.mouse.move(0, 0);
  await expect(card.locator('.project-glow')).toHaveCSS('opacity', '0');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await card.hover();
  await expect(card.locator('.project-glow')).toHaveCSS('opacity', '0');
});

test('copy feedback follows actual clipboard success or failure', async ({ page, isMobile }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (value: string) => {
        if (sessionStorage.getItem('deny-copy')) throw new Error('Clipboard denied');
        sessionStorage.setItem('copied-text', value);
      } },
    });
  });
  await page.goto('/posts/welcome/');
  const copy = page.getByRole('button', { name: '复制代码', exact: true }).first();
  await copy.click();
  await expect(copy).toHaveText('已复制');
  const code = await copy.locator('..').locator('..').locator('pre').textContent();
  expect(await page.evaluate(() => sessionStorage.getItem('copied-text'))).toBe(code);
  await expect(copy).toHaveText('复制');
  await page.evaluate(() => sessionStorage.setItem('deny-copy', '1'));
  await copy.click();
  await expect(copy).toHaveText('复制失败');
  await expect(copy).toHaveAttribute('data-copy-state', 'error');
  if (!isMobile) await page.locator('.toc').hover();
  const share = page.getByRole('button', { name: '复制文章链接', exact: true });
  await share.click();
  await expect(share).toContainText('复制失败');
  await page.evaluate(() => sessionStorage.removeItem('deny-copy'));
  await share.click();
  await expect(share).toContainText('已复制');
  expect(await page.evaluate(() => sessionStorage.getItem('copied-text'))).toBe(page.url());
});

test('capture motion surfaces', async ({ page, isMobile }) => {
  test.skip(!process.env.CAPTURE_MOTION, 'Optional visual inspection');
  const device = isMobile ? 'mobile' : 'desktop';
  await page.goto('/');
  await expect(page.locator('.hero-meta')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: `.scratch/motion-home-${device}.png` });
  const card = page.locator('.project-item').first();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveCSS('opacity', '1');
  if (!isMobile) {
    await card.hover({ position: { x: 150, y: 80 } });
    await expect(card.locator('.project-glow')).toHaveCSS('opacity', '1');
  }
  await page.screenshot({ path: `.scratch/motion-projects-${device}.png` });
});
