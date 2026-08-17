import { expect, test } from '@playwright/test';

test('首页按编辑顺序呈现核心内容', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Insight Blog/);
  await expect(page.getByRole('heading', { level: 1, name: /Insight Blog/ })).toBeVisible();
  await expect(page.getByText('写代码，也记录代码之外的事。')).toBeVisible();
  await expect(page.locator('.hero-avatar img')).toHaveAttribute('src', /profile\.jpg$/);

  const socialLinks = page.getByRole('navigation', { name: '站点与社交链接' });
  await expect(socialLinks.getByRole('link', { name: '邮箱：1205605528@qq.com' })).toHaveAttribute('href', 'mailto:1205605528@qq.com');
  const iconOffsets = await socialLinks.locator('a').evaluateAll((links) => links.map((link) => {
    const linkRect = link.getBoundingClientRect();
    const iconRect = link.querySelector('svg')?.getBoundingClientRect();
    return {
      x: Math.abs(linkRect.x + (linkRect.width / 2) - ((iconRect?.x ?? 0) + ((iconRect?.width ?? 0) / 2))),
      y: Math.abs(linkRect.y + (linkRect.height / 2) - ((iconRect?.y ?? 0) + ((iconRect?.height ?? 0) / 2))),
    };
  }));
  iconOffsets.forEach(({ x, y }) => {
    expect(x).toBeLessThanOrEqual(.5);
    expect(y).toBeLessThanOrEqual(.5);
  });

  const sections = await page.locator('main h2').allTextContents();
  expect(sections).toEqual(['最近文章', '近期随记', '选择的项目']);
});

test('三态主题会保存选择', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: /点击切换主题/ });
  await expect(toggle).toHaveAttribute('data-preference', 'system');
  await expect(toggle.locator('[data-theme-icon="system"]')).toBeVisible();
  await expect(toggle.locator('[data-theme-icon="light"]')).toBeHidden();
  await expect(toggle.locator('[data-theme-icon="dark"]')).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('data-preference', 'light');
  await expect(toggle.locator('[data-theme-icon="light"]')).toBeVisible();
  await expect(toggle.locator('[data-theme-icon="system"]')).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('data-preference', 'dark');
  await expect(toggle.locator('[data-theme-icon="dark"]')).toBeVisible();
  await expect(toggle.locator('[data-theme-icon="light"]')).toBeHidden();
  await page.reload();
  await expect(toggle).toHaveAttribute('data-preference', 'dark');
  await expect(toggle.locator('[data-theme-icon="dark"]')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('快捷键搜索覆盖文章、随记和项目', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
  const dialog = page.getByRole('dialog', { name: '搜索档案' });
  await expect(dialog).toBeVisible();
  const dialogPresentation = await dialog.evaluate((element) => ({
    top: element.getBoundingClientRect().top,
    backdropFilter: getComputedStyle(element, '::backdrop').backdropFilter,
    backdropColor: getComputedStyle(element, '::backdrop').backgroundColor,
  }));
  expect(dialogPresentation.top).toBeLessThan(150);
  expect(dialogPresentation.backdropFilter).toBe('none');
  expect(dialogPresentation.backdropColor).not.toBe('rgba(0, 0, 0, 0)');
  const backdropChannels = dialogPresentation.backdropColor.match(/[\d.]+/g)?.map(Number) ?? [];
  expect(backdropChannels.at(-1)).toBeGreaterThan(0.5);
  await expect(dialog.getByRole('button', { name: '关闭搜索' })).toHaveCount(0);
  const searchbox = dialog.getByRole('searchbox');
  await expect(searchbox).toBeFocused();
  const popularTags = dialog.locator('.search-tags button');
  expect(await popularTags.count()).toBeGreaterThan(0);
  expect(await popularTags.count()).toBeLessThanOrEqual(10);
  const tagRows = await popularTags.evaluateAll((buttons) => new Set(buttons.map((button) => (button as HTMLElement).offsetTop)).size);
  expect(tagRows).toBe(1);
  const tagsToggle = dialog.locator('.search-tags-toggle');
  await expect(tagsToggle).toBeVisible();
  await tagsToggle.click();
  await expect(tagsToggle).toHaveAttribute('aria-expanded', 'true');
  const expandedTagRows = await popularTags.evaluateAll((buttons) => new Set(buttons.map((button) => (button as HTMLElement).offsetTop)).size);
  expect(expandedTagRows).toBeGreaterThan(1);
  await tagsToggle.click();
  await expect(tagsToggle).toHaveAttribute('aria-expanded', 'false');
  await dialog.getByRole('button', { name: /搜索标签 Astro/ }).click();
  await expect(searchbox).toHaveValue('Astro');
  await expect(dialog.getByText(/找到 \d+ 条结果/)).toBeVisible();
  await expect(dialog.getByRole('link', { name: /欢迎来到 Insight Blog/ })).toBeVisible();
  await expect(dialog.getByRole('link', { name: /Insight Blog 个人档案/ })).toBeVisible();
  const highlightedMatch = dialog.locator('mark').filter({ hasText: 'Astro' }).first();
  await expect(highlightedMatch).toBeVisible();
  const highlightPresentation = await highlightedMatch.evaluate((element) => ({
    backgroundColor: getComputedStyle(element).backgroundColor,
    boxShadow: getComputedStyle(element).boxShadow,
  }));
  expect(highlightPresentation.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(highlightPresentation.boxShadow).not.toBe('none');
});

test('时光页汇总跨年档案并复用页头搜索', async ({ page }) => {
  await page.goto('/timeline/');
  await expect(page.getByRole('heading', { level: 2, name: '2026' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: '2025' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: '2024' })).toBeVisible();
  await expect(page.locator('.month-group li')).toHaveCount(14);
  await expect(page.locator('[data-year-progress]')).toHaveText(/^\d+$/);
  await expect(page.locator('[data-day-progress-whole]')).toHaveText(/^\d+$/);
  await expect(page.locator('[data-day-progress-decimal]')).toHaveText(/^\d{2}$/);
  await expect(page.getByRole('link', { name: '欢迎来到 Insight Blog' })).toBeVisible();
  await expect(page.getByRole('link', { name: '从一个足够小的版本开始' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Insight Blog 个人档案' })).toBeVisible();
  await expect(page.locator('.timeline-search')).toHaveCount(0);
  await expect(page.getByText('疏', { exact: true })).toHaveCount(0);
  await expect(page.getByText('密', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: '打开搜索' }).click();
  const dialog = page.getByRole('dialog', { name: '搜索档案' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('searchbox')).toBeFocused();
});

test('长文章提供目录、代码操作和扩展内容', async ({ page, isMobile }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (value: string) => sessionStorage.setItem('copied-article-link', value) },
    });
  });
  await page.goto('/posts/welcome/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('欢迎来到 Insight Blog');
  await expect(page.locator('.article-rail')).toHaveCount(0);
  await expect(page.locator('.article-insight-label')).toContainText('关键洞察');
  await expect(page.locator('.article-header .article-insight')).toBeVisible();
  await expect(page.locator('.article-content .article-insight')).toHaveCount(0);
  await expect(page.getByText('为什么要重新搭建一个由 Git 管理的个人网站，以及这里接下来会保存什么。')).toBeVisible();
  if (isMobile) {
    await expect(page.locator('details.toc-mobile')).toBeVisible();
  } else {
    await expect(page.getByLabel('文章目录')).toBeVisible();
    const alignment = await page.locator('.article-page').evaluate(() => {
      const wordmarkText = document.querySelector('.wordmark-text')?.getBoundingClientRect();
      const heading = document.querySelector('.article-heading')?.getBoundingClientRect();
      const meta = document.querySelector('.article-meta')?.getBoundingClientRect();
      const insight = document.querySelector('.article-insight')?.getBoundingClientRect();
      const content = document.querySelector('.article-content')?.getBoundingClientRect();
      const grid = document.querySelector('.article-grid')?.getBoundingClientRect();
      const toc = document.querySelector('.toc')?.getBoundingClientRect();
      return {
        wordmarkTextX: wordmarkText?.x,
        headingX: heading?.x,
        contentX: content?.x,
        contentWidth: content?.width,
        contentToTocGap: (toc?.x ?? 0) - (content?.right ?? 0),
        gridRight: grid?.right,
        tocRight: toc?.right,
        tocWidth: toc?.width,
        insightGap: (insight?.y ?? 0) - (meta?.bottom ?? 0),
      };
    });
    expect(Math.abs((alignment.wordmarkTextX ?? 0) - (alignment.headingX ?? 0))).toBeLessThan(6);
    expect(Math.abs((alignment.headingX ?? 0) - (alignment.contentX ?? 0))).toBeLessThan(1);
    expect(alignment.contentWidth).toBeGreaterThan(900);
    expect(alignment.contentToTocGap).toBeLessThanOrEqual(57);
    expect(Math.abs((alignment.gridRight ?? 0) - (alignment.tocRight ?? 0))).toBeLessThan(1);
    expect(alignment.tocWidth).toBeLessThanOrEqual(160);
    expect(alignment.insightGap).toBeLessThanOrEqual(22);
  }
  const likeButton = page.getByRole('button', { name: '点赞本文' });
  await expect(likeButton).toBeVisible();
  const likeLabel = likeButton.locator('.action-label');
  await expect(likeLabel).toHaveCSS('opacity', '0');
  expect(await likeButton.locator('.action-count').evaluate((count) => getComputedStyle(count).fontSize))
    .toBe(await likeLabel.evaluate((label) => getComputedStyle(label).fontSize));
  if (!isMobile) {
    await likeButton.hover();
    await expect(likeLabel).toHaveCSS('opacity', '1');
  }
  await likeButton.click();
  await expect(page.getByRole('button', { name: '取消点赞' })).toHaveAttribute('aria-pressed', 'true');
  const shareButton = page.getByRole('button', { name: '复制文章链接' });
  await expect(shareButton).toBeVisible();
  await shareButton.click();
  await expect(shareButton).toContainText('已复制');
  expect(await page.evaluate(() => sessionStorage.getItem('copied-article-link'))).toBe(page.url());
  await expect(page.getByRole('button', { name: '复制代码' }).first()).toBeVisible();
  await expect(page.getByText('本文代码示例许可：MIT')).toBeVisible();
  await expect(page.getByRole('navigation', { name: '相邻文章' })).toBeVisible();
  await expect(page.locator('.mermaid')).toBeVisible();
});

test('详情页按标题数量显示大纲并保持正文基线', async ({ page, isMobile }) => {
  await page.goto('/posts/designing-for-calm/');
  if (isMobile) {
    await expect(page.locator('details.toc-mobile li')).toHaveCount(2);
  } else {
    await expect(page.getByLabel('文章目录').locator('li')).toHaveCount(2);
  }

  await page.goto('/notes/quiet-interface/');
  await expect(page.locator('.toc-label')).toHaveCount(0);
  if (isMobile) {
    await expect(page.locator('details.toc-mobile')).toHaveCount(0);
    await expect(page.locator('.toc-actions-mobile')).toBeVisible();
  } else {
    await expect(page.getByRole('complementary', { name: '文章操作' })).toBeVisible();
    const positions = await page.locator('.article-page').evaluate(() => ({
      headingX: document.querySelector('.article-heading')?.getBoundingClientRect().x,
      contentX: document.querySelector('.article-content')?.getBoundingClientRect().x,
    }));
    expect(Math.abs((positions.headingX ?? 0) - (positions.contentX ?? 0))).toBeLessThan(1);
  }
});

test('归档路由与无题随记保持可访问', async ({ page }) => {
  await page.goto('/notes/quiet-interface/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/随记/);
  await expect(page.getByText('安静的界面并不等于没有性格')).toBeVisible();
  await page.goto('/projects/personal-archive/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Insight Blog 个人档案');
  await expect(page.getByText('进行中')).toBeVisible();
});

test('移动端使用紧凑导航', async ({ page, isMobile }) => {
  test.skip(!isMobile, '仅在移动端项目运行');
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: '主导航' })).toBeHidden();
  await page.getByLabel('打开导航').click();
  await expect(page.getByRole('navigation', { name: '移动端导航' })).toBeVisible();
  await expect(page.getByRole('link', { name: '文章' }).last()).toBeVisible();
});

test('desktop navigation reveals item framing on hover and current state', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop navigation is hidden on compact viewports');
  await page.goto('/');

  const navigation = page.locator('.desktop-nav');
  const currentItem = navigation.locator('a[aria-current="page"]');
  const nextItem = navigation.locator('a').nth(1);

  const transitionProperties = await nextItem.evaluate((element) => getComputedStyle(element).transitionProperty.split(',').map((property) => property.trim()));
  expect(transitionProperties).not.toContain('border-color');

  await expect(navigation).toHaveCSS('border-top-width', '0px');
  await expect(currentItem).toHaveCSS('border-top-style', 'solid');
  const currentBorder = await currentItem.evaluate((element) => getComputedStyle(element).borderTopColor);
  expect(currentBorder).not.toBe('rgba(0, 0, 0, 0)');

  const idleBackground = await nextItem.evaluate((element) => getComputedStyle(element).backgroundColor);
  await expect(nextItem).toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)');
  await nextItem.hover();
  await expect(nextItem).not.toHaveCSS('background-color', idleBackground);
  const hoverBorder = await nextItem.evaluate((element) => getComputedStyle(element).borderTopColor);
  expect(hoverBorder).not.toBe('rgba(0, 0, 0, 0)');

  const activeIndicator = await currentItem.evaluate((element) => {
    const style = getComputedStyle(element, '::after');
    return { height: style.height, backgroundColor: style.backgroundColor };
  });
  expect(activeIndicator.height).toBe('1px');
  expect(activeIndicator.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');

  await nextItem.click();
  await expect(page).toHaveURL(/\/posts\/$/);
  const destinationCurrent = page.locator('.desktop-nav a[aria-current="page"]');
  const destinationBorder = await destinationCurrent.evaluate((element) => getComputedStyle(element).borderTopColor);
  expect(destinationBorder).not.toBe('rgba(0, 0, 0, 0)');
});
