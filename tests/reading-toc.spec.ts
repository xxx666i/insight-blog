import { expect, test, type Page } from '@playwright/test';

async function pointAtBody(page: Page) {
  const point = await page.locator('.article-content .prose').evaluate((body) => {
    const bounds = body.getBoundingClientRect();
    return { x: bounds.left + bounds.width / 2, y: (Math.max(180, bounds.top) + Math.min(innerHeight - 32, bounds.bottom)) / 2 };
  });
  await page.mouse.move(point.x, point.y);
}

async function scrollToMiddle(page: Page) {
  await page.locator('.article-content .prose').evaluate((body) => {
    const bounds = body.getBoundingClientRect();
    window.scrollTo({ top: scrollY + bounds.top + (bounds.height - innerHeight) / 2, behavior: 'instant' });
  });
}

async function readMiddle(page: Page) {
  await scrollToMiddle(page);
  await pointAtBody(page);
  await expect(page.locator('.toc-panel')).toHaveCSS('opacity', '0');
}

const bulgeX = (page: Page) => page.locator('.toc-thread-progress').evaluate((element) => {
  const path = element as SVGPathElement;
  return path.getPointAtLength(path.getTotalLength() / 2).x;
});

test.describe('desktop reading rail', () => {
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(isMobile, 'The touch layout retains its native expandable directory');
    await page.goto('/posts/welcome/');
    await expect(page.locator('.mermaid svg')).toBeVisible();
  });

  test('shows the outline outside the body and for keyboard navigation without moving the article', async ({ page }) => {
    const toc = page.locator('.toc');
    const panel = toc.locator('.toc-panel');
    await readMiddle(page);
    const before = await page.locator('.prose').boundingBox();
    await toc.hover();
    await expect(panel).toHaveCSS('opacity', '1');
    await expect(toc.getByRole('link', { name: /为什么是一个独立网站/ })).toBeVisible();
    await page.mouse.move(30, 100);
    await expect(panel).toHaveCSS('opacity', '1');
    await pointAtBody(page);
    await expect(panel).toHaveCSS('opacity', '0');
    await page.keyboard.press('Tab');
    await toc.focus();
    await expect(panel).toHaveCSS('opacity', '1');
    await page.keyboard.press('Tab');
    await expect(toc.locator('[data-toc-link]').first()).toBeFocused();
    expect((await page.locator('.prose').boundingBox())?.x).toBe(before?.x);
    expect((await page.locator('.prose').boundingBox())?.width).toBe(before?.width);
  });

  test('keeps the outline at 0% and 100% even over the body, and tracks a stationary pointer on scroll', async ({ page }) => {
    const panel = page.locator('.toc-panel');
    const progress = page.locator('[data-reading-progress]');
    await pointAtBody(page);
    await expect(progress).toHaveText('0%');
    await expect(panel).toHaveCSS('opacity', '1');
    // No mouse movement: scrolling the body under the pointer must switch modes too.
    await scrollToMiddle(page);
    await expect(panel).toHaveCSS('opacity', '0');
    await page.locator('.prose').evaluate((body) => {
      window.scrollTo({ top: scrollY + body.getBoundingClientRect().bottom - innerHeight + 24, behavior: 'instant' });
    });
    await pointAtBody(page);
    await expect(progress).toHaveText('100%');
    await expect(panel).toHaveCSS('opacity', '1');
  });

  test('clicking an anchor updates the current chapter and bottom reaches 100%', async ({ page }) => {
    const toc = page.locator('.toc');
    await toc.hover();
    const link = toc.locator('[data-toc-link]').nth(2);
    const href = await link.getAttribute('href');
    await link.click();
    await expect.poll(() => decodeURIComponent(page.url())).toContain(href);
    await expect(link).toHaveAttribute('aria-current', 'location');
    await expect(toc.locator('[data-reading-title]')).toHaveText('用 Git 写作');
    // A link focused by a mouse click must not keep the outline open on return to the body.
    await pointAtBody(page);
    await expect(toc.locator('.toc-panel')).toHaveCSS('opacity', '0');
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await expect(toc.locator('[data-reading-progress]')).toHaveText('100%');
    await expect(toc.locator('[data-toc-link]').last()).toHaveAttribute('aria-current', 'location');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect(toc.locator('[data-reading-progress]')).toHaveText('0%');
    await expect(toc.locator('[data-toc-link]').first()).toHaveAttribute('aria-current', 'location');
  });

  test('the progress segment bulges in both scroll directions and returns to a shallow curve', async ({ page }) => {
    const sample = (delta: number) => page.evaluate(async (top) => {
      const path = document.querySelector<SVGPathElement>('.toc-thread-progress')!;
      window.scrollBy({ top, behavior: 'instant' });
      const xs: number[] = [];
      for (let i = 0; i < 24; i++) {
        await new Promise(requestAnimationFrame);
        xs.push(path.getPointAtLength(path.getTotalLength() / 2).x);
      }
      return xs;
    }, delta);
    await readMiddle(page);
    await expect(page.locator('.toc-thread-cursor')).toHaveCount(0);
    await expect.poll(() => bulgeX(page)).toBeCloseTo(20, 1);
    const resting = await bulgeX(page);
    for (const delta of [160, -160]) {
      expect(Math.max(...await sample(delta))).toBeGreaterThan(resting + 2);
      await expect.poll(() => bulgeX(page)).toBeCloseTo(resting, 1);
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect((await sample(160)).every((x) => Math.abs(x - resting) < .1)).toBeTruthy();
  });

  test('measures late content changes and retains the current chapter after reload', async ({ page }) => {
    const toc = page.locator('.toc');
    await toc.hover();
    await toc.locator('[data-toc-link]').nth(1).click();
    await expect(toc.locator('[data-reading-title]')).toHaveText('内容如何组织');
    await page.reload();
    await expect(toc.locator('[data-reading-title]')).toHaveText('内容如何组织');
    await page.evaluate(() => {
      const spacer = document.createElement('div');
      spacer.style.height = '1000px';
      document.querySelector('.prose')!.append(spacer);
    });
    await toc.hover();
    const subsection = toc.locator('[data-toc-link]').nth(3);
    await subsection.click();
    await expect(subsection).toHaveAttribute('aria-current', 'location');
    await expect(toc.locator('[data-reading-title]')).toHaveText('发布与草稿');
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await expect(toc.locator('[data-reading-progress]')).toHaveText('100%');
  });

  test('capture expanded, compact and bent rail', async ({ page }) => {
    test.skip(!process.env.CAPTURE_TOC, 'Optional visual inspection');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await readMiddle(page);
    await page.locator('.toc').hover();
    await expect(page.locator('.toc-panel')).toHaveCSS('opacity', '1');
    await page.screenshot({ path: '.scratch/toc-expanded.png' });
    await pointAtBody(page);
    await expect(page.locator('.toc-panel')).toHaveCSS('opacity', '0');
    await expect(page.locator('.toc-thread')).toHaveCSS('transform', 'none');
    await expect.poll(() => bulgeX(page)).toBeCloseTo(20, 1);
    await page.screenshot({ path: '.scratch/toc-compact.png' });
    await page.evaluate(async () => {
      window.scrollBy({ top: 300, behavior: 'instant' });
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
    await page.screenshot({ path: '.scratch/toc-bent.png' });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.screenshot({ path: '.scratch/toc-dark.png' });
  });
});

test('touch and no-JavaScript layouts keep the ordinary directory available', async ({ page, browser, baseURL, isMobile }) => {
  await page.goto('/posts/welcome/');
  if (isMobile) {
    await expect(page.locator('.toc')).not.toBeVisible();
    await page.locator('.toc-mobile summary').click();
    await expect(page.locator('.toc-mobile a').first()).toBeVisible();
  }
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
  const plain = await context.newPage();
  await plain.goto('/posts/welcome/');
  await expect(plain.locator('.toc-panel')).toBeVisible();
  await expect(plain.locator('.toc-rail')).not.toBeVisible();
  await plain.locator('.toc [data-toc-link]').first().click();
  await expect.poll(() => decodeURIComponent(plain.url())).toContain('#为什么是一个独立网站');
  await context.close();
});
