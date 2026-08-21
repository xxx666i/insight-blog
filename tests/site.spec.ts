import { expect, test } from '@playwright/test';

test('首页按编辑顺序呈现核心内容', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Insight Blog/);
  await expect(page.getByRole('heading', { level: 1, name: /Insight Blog/ })).toBeVisible();
  await expect(page.getByText('写代码，也记录代码之外的事。')).toBeVisible();
  await expect(page.getByText('INSIGHT BLOG / PERSONAL ARCHIVE', { exact: true })).toHaveCount(0);
  const avatar = page.locator('.hero-avatar');
  await expect(avatar.locator('img')).toHaveAttribute('src', /profile\.jpg$/);
  const avatarPresentation = await avatar.evaluate((element) => ({
    width: element.getBoundingClientRect().width,
    marker: getComputedStyle(element, '::after').content,
  }));
  expect(avatarPresentation.width).toBeCloseTo(156, 0);
  expect(avatarPresentation.marker).toBe('none');

  const socialLinks = page.getByRole('navigation', { name: '站点与社交链接' });
  await expect(socialLinks.getByRole('link', { name: '邮箱：1205605528@qq.com' })).toHaveAttribute('href', 'mailto:1205605528@qq.com');
  await expect(socialLinks.getByRole('link', { name: '哔哩哔哩个人空间' })).toHaveAttribute('href', 'https://space.bilibili.com/19556203?spm_id_from=333.1007.0.0');
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
  expect(sections).toEqual(['近期文章', '随记', '当前项目']);
  await expect(page.getByRole('heading', { level: 2, name: '近期文章' }).getByRole('link')).toHaveAttribute('href', /\/posts\/$/);
  await expect(page.getByRole('heading', { level: 2, name: '随记' }).getByRole('link')).toHaveAttribute('href', /\/notes\/$/);
  await expect(page.getByRole('heading', { level: 2, name: '当前项目' }).getByRole('link')).toHaveAttribute('href', /\/projects\/$/);
  await expect(page.getByRole('link', { name: '查看全部文章' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: '查看全部随记' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: '查看项目档案' })).toHaveCount(0);
  await expect(page.getByText('阅读全文', { exact: true })).toHaveCount(0);
  await expect(page.locator('.row-arrow, .project-open')).toHaveCount(0);
  await expect(page.locator('main').getByText('↗', { exact: true })).toHaveCount(0);
  await expect(page.locator('.notes-section .tag-list')).toHaveCount(0);

  const noteClamp = await page.locator('.notes-section .note-copy > p').first().evaluate((element) => getComputedStyle(element).webkitLineClamp);
  expect(noteClamp).toBe('4');

  const firstNote = page.locator('.note-item').first();
  const firstNoteBox = await firstNote.boundingBox();
  expect(firstNoteBox).not.toBeNull();
  await firstNote.click({ position: { x: (firstNoteBox?.width ?? 40) - 12, y: 12 } });
  await expect(page).toHaveURL(/\/notes\/first-note\/$/);
});

test('首页在五组个人强调色中随机选择并保持标题一致', async ({ page }) => {
  const palettes = ['ume', 'amber', 'jade', 'ocean', 'iris'];
  await page.goto('/');

  const selected = await page.locator('html').getAttribute('data-home-accent');
  expect(palettes).toContain(selected);

  const readHeroColors = () => page.locator('.hero').evaluate((hero) => {
    const name = hero.querySelector<HTMLElement>('.hero-name');
    const role = hero.querySelector<HTMLElement>('.hero-role code');
    const caret = hero.querySelector<HTMLElement>('.typing-caret');
    const probe = document.createElement('span');
    probe.style.color = 'var(--hero-accent)';
    hero.append(probe);
    const result = {
      accent: getComputedStyle(probe).color,
      name: name ? getComputedStyle(name).color : '',
      role: role ? getComputedStyle(role).color : '',
      caret: caret ? getComputedStyle(caret).backgroundColor : '',
    };
    probe.remove();
    return result;
  });

  const colors: Array<{ accent: string; name: string; role: string; caret: string }> = [];
  for (const palette of palettes) {
    await page.locator('html').evaluate((root, value) => {
      (root as HTMLElement).dataset.homeAccent = value;
    }, palette);
    await expect.poll(async () => {
      const color = await readHeroColors();
      return color.name === color.accent && color.role === color.accent && color.caret === color.accent;
    }).toBe(true);
    colors.push(await readHeroColors());
  }

  expect(new Set(colors.map(({ accent }) => accent)).size).toBe(5);
  for (const color of colors) {
    expect(color.name).toBe(color.accent);
    expect(color.role).toBe(color.accent);
    expect(color.caret).toBe(color.accent);
  }
});

test('三态主题会保存选择', async ({ page, isMobile }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: /选择主题/ });
  const menu = page.getByRole('menu', { name: '选择主题' });
  await expect(toggle).toHaveAttribute('data-preference', 'system');
  await expect(toggle.locator('[data-theme-icon="system"]')).toBeVisible();
  await expect(toggle.locator('[data-theme-icon="light"]')).toBeHidden();
  await expect(toggle.locator('[data-theme-icon="dark"]')).toBeHidden();
  await expect(menu).toBeHidden();
  if (isMobile) await toggle.click();
  else await toggle.hover();
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitemradio')).toHaveCount(3);
  await menu.getByRole('menuitemradio', { name: /浅色/ }).click();
  await expect(toggle).toHaveAttribute('data-preference', 'light');
  await expect(toggle.locator('[data-theme-icon="light"]')).toBeVisible();
  await expect(toggle.locator('[data-theme-icon="system"]')).toBeHidden();
  await expect(page.locator('[data-theme-option="light"]')).toHaveAttribute('aria-checked', 'true');
  if (isMobile) await toggle.click();
  else await toggle.hover();
  await menu.getByRole('menuitemradio', { name: /深色/ }).click();
  await expect(toggle).toHaveAttribute('data-preference', 'dark');
  await expect(toggle.locator('[data-theme-icon="dark"]')).toBeVisible();
  await expect(toggle.locator('[data-theme-icon="light"]')).toBeHidden();
  await page.reload();
  await expect(toggle).toHaveAttribute('data-preference', 'dark');
  await expect(toggle.locator('[data-theme-icon="dark"]')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('站内导航不会重播主题图标入场动画', async ({ page, isMobile }) => {
  test.skip(Boolean(isMobile), '桌面导航栏用于验证主题图标的页面切换稳定性');
  await page.addInitScript(() => {
    const themeAnimationStarts: string[] = [];
    Object.assign(window, { themeAnimationStarts });
    document.addEventListener('animationstart', (event) => {
      if ((event.target as Element | null)?.closest('[data-theme-icon]')) {
        themeAnimationStarts.push(event.animationName);
      }
    }, true);
  });

  await page.goto('/');
  await page.getByRole('link', { name: '文章', exact: true }).click();
  await expect(page).toHaveURL(/\/posts\/$/);

  const replayedAnimations = await page.evaluate(() => (
    (window as typeof window & { themeAnimationStarts: string[] }).themeAnimationStarts
  ));
  expect(replayedAnimations).toEqual([]);
});

test('保存的主题在站内导航首帧直接显示正确图标', async ({ page, isMobile }) => {
  test.skip(Boolean(isMobile), '桌面导航栏用于验证主题图标的页面切换首帧');
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('insight-blog-theme', 'light'));
  await page.addInitScript(() => {
    const themeIconFrames: string[] = [];
    Object.assign(window, { themeIconFrames });
    const captureThemeIcon = () => {
      const visibleIcon = [...document.querySelectorAll<HTMLElement>('[data-theme-icon]')]
        .find((icon) => getComputedStyle(icon).display !== 'none')?.dataset.themeIcon;
      if (visibleIcon && themeIconFrames.at(-1) !== visibleIcon) themeIconFrames.push(visibleIcon);
    };
    new MutationObserver(captureThemeIcon).observe(document, {
      attributes: true,
      attributeFilter: ['data-preference'],
      childList: true,
      subtree: true,
    });
  });

  await page.getByRole('link', { name: '文章', exact: true }).click();
  await expect(page).toHaveURL(/\/posts\/$/);
  await expect(page.locator('[data-theme-icon="light"]')).toBeVisible();
  const themeIconFrames = await page.evaluate(() => (
    (window as typeof window & { themeIconFrames: string[] }).themeIconFrames
  ));
  expect(themeIconFrames).toEqual(['light']);
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
  await expect(popularTags.first()).toBeVisible();
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
  const tocContainer = isMobile ? page.locator('details.toc-mobile') : page.getByLabel('文章目录');
  await expect(tocContainer.locator('.toc-depth-3 span')).toHaveCount(0);
  const sectionFontSize = await tocContainer.locator('.toc-depth-2 a').first().evaluate((link) => getComputedStyle(link).fontSize);
  const subsectionFontSize = await tocContainer.locator('.toc-depth-3 a').first().evaluate((link) => getComputedStyle(link).fontSize);
  expect(subsectionFontSize).toBe(sectionFontSize);
  if (isMobile) {
    await expect(page.locator('details.toc-mobile')).toBeVisible();
    await expect(page.locator('details.toc-mobile .toc-depth-3')).toContainText('发布与草稿');
  } else {
    await expect(page.getByLabel('文章目录')).toBeVisible();
    await expect(page.getByLabel('文章目录').locator('.toc-depth-3')).toContainText('发布与草稿');
    const alignment = await page.locator('.article-page').evaluate(() => {
      const wordmarkText = document.querySelector('.wordmark-text')?.getBoundingClientRect();
      const heading = document.querySelector('.article-heading')?.getBoundingClientRect();
      const meta = document.querySelector('.article-meta')?.getBoundingClientRect();
      const insight = document.querySelector('.article-insight')?.getBoundingClientRect();
      const content = document.querySelector('.article-content')?.getBoundingClientRect();
      const grid = document.querySelector('.article-grid')?.getBoundingClientRect();
      const toc = document.querySelector('.toc')?.getBoundingClientRect();
      const pagination = document.querySelector('.post-pagination')?.getBoundingClientRect();
      const codeLicense = document.querySelector('.code-license')?.getBoundingClientRect();
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
        paginationX: pagination?.x,
        paginationWidth: pagination?.width,
        codeLicenseX: codeLicense?.x,
      };
    });
    expect(Math.abs((alignment.wordmarkTextX ?? 0) - (alignment.headingX ?? 0))).toBeLessThan(6);
    expect(Math.abs((alignment.headingX ?? 0) - (alignment.contentX ?? 0))).toBeLessThan(1);
    expect(alignment.contentWidth).toBeGreaterThan(900);
    expect(alignment.contentToTocGap).toBeLessThanOrEqual(57);
    expect(Math.abs((alignment.gridRight ?? 0) - (alignment.tocRight ?? 0))).toBeLessThan(1);
    expect(alignment.tocWidth).toBeLessThanOrEqual(160);
    expect(alignment.insightGap).toBeLessThanOrEqual(22);
    expect(Math.abs((alignment.contentX ?? 0) - (alignment.paginationX ?? 0))).toBeLessThan(1);
    expect(Math.abs((alignment.contentWidth ?? 0) - (alignment.paginationWidth ?? 0))).toBeLessThan(1);
    expect(Math.abs((alignment.contentX ?? 0) - (alignment.codeLicenseX ?? 0))).toBeLessThan(1);
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
  const adjacentPosts = page.getByRole('navigation', { name: '相邻文章' });
  await expect(adjacentPosts).toBeVisible();
  await expect(adjacentPosts.getByRole('link')).toHaveCount(1);
  await expect(adjacentPosts.getByRole('link', { name: /下一篇.*为安静而设计/ })).toBeVisible();
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

test('三类归档统一总数层级并保持紧凑页脚', async ({ page, isMobile }) => {
  const archives = [
    { path: '/posts/', title: '文章', count: 5, unit: '篇' },
    { path: '/notes/', title: '随记', count: 6, unit: '条' },
    { path: '/projects/', title: '项目', count: 3, unit: '个' },
  ];

  const countStyles: string[] = [];
  for (const archive of archives) {
    await page.goto(archive.path);
    const header = page.locator('.archive-header');
    const title = header.getByRole('heading', { level: 1, name: archive.title });
    const count = header.locator('.archive-count');
    await expect(title).toBeVisible();
    await expect(count).toHaveAttribute('aria-label', `共 ${archive.count} ${archive.unit}`);
    const inlineOrder = await header.locator('.archive-title-line').evaluate((line) => {
      const titleRect = line.querySelector('h1')?.getBoundingClientRect();
      const countRect = line.querySelector('.archive-count')?.getBoundingClientRect();
      return { titleRight: titleRect?.right ?? 0, countLeft: countRect?.left ?? 0 };
    });
    expect(inlineOrder.countLeft).toBeGreaterThanOrEqual(inlineOrder.titleRight);
    countStyles.push(await count.evaluate((element) => getComputedStyle(element).fontSize));
  }
  expect(new Set(countStyles).size).toBe(1);

  await page.goto('/projects/');
  await expect(page.locator('.status-count')).toHaveText(['共 1 个', '共 1 个', '共 1 个']);

  await page.goto('/posts/');
  const filterLabel = page.locator('.tag-filter > span');
  await expect(filterLabel).toHaveCSS('font-size', '12px');
  await expect(filterLabel).toHaveCSS('font-weight', '600');

  await page.goto('/notes/');
  const noteSummary = page.locator('.note-timeline .note-letter-copy').first();
  await expect(noteSummary).toHaveCSS('font-size', isMobile ? '14px' : '15px');
  await expect(page.locator('.note-year-header h2')).toHaveText(['2026', '2025', '2024']);
  await expect(page.locator('.note-year-header > span')).toHaveText(['4条', '1条', '1条']);
  await expect(page.locator('.note-year-header > span').first()).toHaveCSS('font-size', '13px');
  const yearCountRightGap = await page.locator('.note-year-header').first().evaluate((header) => {
    const headerRect = header.getBoundingClientRect();
    const count = header.querySelector('.year-count')?.getBoundingClientRect();
    return headerRect.right - (count?.right ?? 0);
  });
  expect(yearCountRightGap).toBeCloseTo(0, 0);
  const archiveCountTypography = await page.locator('.archive-count').evaluate((element) => ({
    family: getComputedStyle(element).fontFamily,
    size: getComputedStyle(element).fontSize,
    weight: getComputedStyle(element).fontWeight,
  }));
  const yearCountTypography = await page.locator('.year-count').first().evaluate((element) => ({
    family: getComputedStyle(element).fontFamily,
    size: getComputedStyle(element).fontSize,
    weight: getComputedStyle(element).fontWeight,
  }));
  expect(yearCountTypography).toEqual(archiveCountTypography);
  await expect(page.getByText('ANNO', { exact: true })).toHaveCount(0);
  await expect(page.locator('.note-timeline .tag-list')).toHaveCount(0);
  const firstNoteDate = page.locator('.note-timeline-date').first();
  await expect(firstNoteDate.locator('.date-month')).toHaveText('八月');
  await expect(firstNoteDate.locator('.date-weekday')).toHaveText('周四');
  const weekdayColors = await firstNoteDate.locator('.date-weekday').evaluate((element) => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-text-interactive)';
    element.append(probe);
    const result = { actual: getComputedStyle(element).color, expected: getComputedStyle(probe).color };
    probe.remove();
    return result;
  });
  expect(weekdayColors.actual).toBe(weekdayColors.expected);
  await expect(firstNoteDate.locator('.date-day')).toHaveText('06');

  if (!isMobile) {
    const timelineStyle = await page.locator('.note-timeline-line').first().evaluate((element) => ({
      width: getComputedStyle(element).width,
      color: getComputedStyle(element).backgroundColor,
    }));
    expect(timelineStyle.width).toBe('1px');
    expect(timelineStyle.color).not.toBe('rgba(0, 0, 0, 0)');
  }

  const noteDateAlignment = await page.locator('.note-timeline-item').first().evaluate((item) => {
    const itemRect = item.getBoundingClientRect();
    const dayRect = item.querySelector<HTMLElement>('.date-day')?.getBoundingClientRect();
    const dot = getComputedStyle(item, '::before');
    return {
      dayCenter: (dayRect?.top ?? 0) + ((dayRect?.height ?? 0) / 2),
      dotCenter: itemRect.top + Number.parseFloat(dot.top) + (Number.parseFloat(dot.height) / 2),
    };
  });
  expect(Math.abs(noteDateAlignment.dayCenter - noteDateAlignment.dotCenter)).toBeLessThanOrEqual(1);

  if (!isMobile) {
    const firstNoteCard = page.locator('.note-letter').first();
    const idleY = (await firstNoteCard.boundingBox())?.y ?? 0;
    await page.locator('.note-timeline-item').first().hover();
    await page.waitForTimeout(220);
    const hoverY = (await firstNoteCard.boundingBox())?.y ?? 0;
    expect(idleY - hoverY).toBeCloseTo(2, 0);
    await expect(firstNoteCard).not.toHaveCSS('box-shadow', 'none');
  }

  await page.goto('/notes/quiet-interface/');
  const layout = await page.evaluate(() => {
    const footer = document.querySelector('.site-footer')?.getBoundingClientRect();
    const mainStyle = getComputedStyle(document.querySelector('body > main') as Element);
    return { footerHeight: footer?.height ?? 0, bodyDisplay: getComputedStyle(document.body).display, mainGrow: mainStyle.flexGrow };
  });
  expect(layout.bodyDisplay).toBe('flex');
  expect(layout.mainGrow).toBe('1');
  expect(layout.footerHeight).toBeLessThanOrEqual(isMobile ? 110 : 80);
});

test('文章归档使用靠左的日期时间轴', async ({ page, isMobile }) => {
  test.skip(Boolean(isMobile), '移动端隐藏日期时间轴以保持紧凑');

  await page.goto('/posts/');
  const yearGroup = page.locator('.year-group').first();
  const timeline = yearGroup.locator('.post-timeline.has-sequence');
  await expect(timeline).toBeVisible();
  await expect(timeline.locator('.row-index')).toHaveCount(0);
  await expect(timeline.locator('.timeline-date')).toHaveText(['08/07', '07/18', '03/21']);

  const layout = await yearGroup.evaluate((group) => {
    const timelineElement = group.querySelector<HTMLElement>('.post-timeline.has-sequence');
    const rows = timelineElement?.querySelectorAll<HTMLElement>('.post-row');
    const line = rows?.[0] ? getComputedStyle(rows[0], '::before') : null;
    const lastLine = rows?.length ? getComputedStyle(rows[rows.length - 1], '::before') : null;
    const firstDate = rows?.[0]?.querySelector<HTMLElement>('.timeline-date')?.getBoundingClientRect();
    const firstRow = rows?.[0]?.getBoundingClientRect();
    const groupRect = group.getBoundingClientRect();
    const timelineRect = timelineElement?.getBoundingClientRect();
    return {
      offset: (timelineRect?.left ?? 0) - groupRect.left,
      lineWidth: line?.width,
      lineColor: line?.backgroundColor,
      lineHeight: Number.parseFloat(line?.height ?? '0'),
      firstRowHeight: rows?.[0]?.getBoundingClientRect().height ?? 0,
      lastLineContent: lastLine?.content,
      lineStart: (firstRow?.top ?? 0) + Number.parseFloat(line?.top ?? '0'),
      dateCenter: (firstDate?.top ?? 0) + ((firstDate?.height ?? 0) / 2),
    };
  });

  expect(layout.offset).toBeLessThanOrEqual(112);
  expect(layout.lineWidth).toBe('1px');
  expect(layout.lineColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(layout.lineHeight).toBeCloseTo(layout.firstRowHeight, 0);
  expect(layout.lastLineContent).toBe('none');
  expect(layout.lineStart).toBeCloseTo(layout.dateCenter, 0);
  const firstDot = await timeline.locator('.post-row').first().evaluate((row) => {
    const dot = getComputedStyle(row, '::after');
    return { width: dot.width, color: dot.backgroundColor, radius: dot.borderRadius };
  });
  expect(firstDot.width).toBe('9px');
  expect(firstDot.color).not.toBe('rgba(0, 0, 0, 0)');
  expect(firstDot.radius).toBe('50%');
});

test('首页近期文章保留序号时间轴', async ({ page, isMobile }) => {
  test.skip(Boolean(isMobile), '移动端隐藏序号时间轴以保持紧凑');

  await page.goto('/');
  const timeline = page.locator('.writing-section .post-timeline.has-sequence');
  await expect(timeline.locator('.row-index')).toHaveCount(3);
  await expect(timeline.locator('.timeline-date')).toHaveCount(0);
  const rows = timeline.locator('.post-row');
  await expect(rows).toHaveCount(3);
  expect(await rows.nth(0).evaluate((row) => getComputedStyle(row, '::before').width)).toBe('1px');
  expect(await rows.nth(0).evaluate((row) => getComputedStyle(row, '::after').width)).toBe('9px');
  expect(await rows.nth(2).evaluate((row) => getComputedStyle(row, '::before').content)).toBe('none');
});

test('首页与三类主总览统一使用文章详情正文宽度并居中', async ({ page, isMobile }) => {
  test.skip(Boolean(isMobile), '移动端由页面边距自然约束内容宽度');

  await page.goto('/posts/welcome/');
  const reference = await page.locator('.article-header').evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, center: rect.left + (rect.width / 2) };
  });

  const surfaces = [
    { path: '/', selectors: ['.hero', '.home-content'] },
    { path: '/posts/', selectors: ['.posts-page'] },
    { path: '/notes/', selectors: ['.notes-page'] },
    { path: '/projects/', selectors: ['.projects-page'] },
  ];

  for (const surface of surfaces) {
    await page.goto(surface.path);
    for (const selector of surface.selectors) {
      const geometry = await page.locator(selector).evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, center: rect.left + (rect.width / 2) };
      });
      expect(geometry.width).toBeCloseTo(reference.width, 0);
      expect(geometry.center).toBeCloseTo(reference.center, 0);
    }
  }
});

test('进入随记总览和详情时视口槽位与居中容器保持稳定', async ({ page, isMobile }) => {
  test.skip(Boolean(isMobile), '桌面经典滚动条会占用布局宽度');

  await page.addInitScript(() => {
    const frames: Array<{ clientWidth: number; headerRight: number }> = [];
    Object.assign(window, { __layoutFrames: frames });
    let frame = 0;
    const sample = () => {
      const header = document.querySelector<HTMLElement>('.header-inner')?.getBoundingClientRect();
      frames.push({ clientWidth: document.documentElement.clientWidth, headerRight: header?.right ?? 0 });
      frame += 1;
      if (frame < 90) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });

  const measure = () => page.evaluate(() => {
    const header = document.querySelector<HTMLElement>('.header-inner')?.getBoundingClientRect();
    const mainShell = document.querySelector<HTMLElement>('.home-content, .notes-page, .article-header')?.getBoundingClientRect();
    return {
      clientWidth: document.documentElement.clientWidth,
      innerWidth: window.innerWidth,
      gutter: getComputedStyle(document.documentElement).scrollbarGutter,
      headerRight: header?.right ?? 0,
      mainCenter: (mainShell?.left ?? 0) + ((mainShell?.width ?? 0) / 2),
    };
  });
  const readFrames = () => page.evaluate(() => (
    (window as typeof window & { __layoutFrames: Array<{ clientWidth: number; headerRight: number }> }).__layoutFrames
  ));

  await page.goto('/');
  const home = await measure();
  await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '随记' }).click();
  await page.waitForTimeout(300);
  const archive = await measure();
  const archiveFrames = await readFrames();
  await page.locator('.note-timeline-item').first().click();
  await page.waitForTimeout(300);
  const detail = await measure();
  const detailFrames = await readFrames();

  expect(new Set([home.clientWidth, archive.clientWidth, detail.clientWidth]).size).toBe(1);
  expect(new Set([home.headerRight, archive.headerRight, detail.headerRight]).size).toBe(1);
  expect(new Set([home.mainCenter, archive.mainCenter, detail.mainCenter]).size).toBe(1);
  for (const frames of [archiveFrames, detailFrames]) {
    expect(new Set(frames.map(({ clientWidth }) => clientWidth)).size).toBe(1);
    expect(new Set(frames.filter(({ headerRight }) => headerRight > 0).map(({ headerRight }) => headerRight)).size).toBeLessThanOrEqual(1);
  }
  expect([home.gutter, archive.gutter, detail.gutter]).toEqual(['stable', 'stable', 'stable']);
  expect(home.innerWidth).toBe(archive.innerWidth);
  expect(archive.innerWidth).toBe(detail.innerWidth);
});

test('文字型入口统一交互色且无标题随记具备悬停反馈', async ({ page, isMobile }) => {
  test.skip(Boolean(isMobile), '桌面悬停用于验证文字入口反馈');

  const expectInteractiveHover = async (targetSelector: string, hoverSelector: string) => {
    const target = page.locator(targetSelector).first();
    const idle = await target.evaluate((element) => getComputedStyle(element).color);
    await page.locator(hoverSelector).first().hover();
    await page.waitForTimeout(240);
    const colors = await target.evaluate((element) => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--color-text-interactive)';
      element.append(probe);
      const result = { actual: getComputedStyle(element).color, expected: getComputedStyle(probe).color };
      probe.remove();
      return result;
    });
    expect(colors.actual).toBe(colors.expected);
    expect(colors.actual).not.toBe(idle);
  };

  await page.goto('/notes/');
  await expectInteractiveHover('.note-timeline-item:has(.untitled-link) .note-letter-copy', '.note-timeline-item:has(.untitled-link)');

  await page.goto('/posts/');
  await expectInteractiveHover('.post-row h3 a', '.post-row');

  await page.goto('/projects/');
  await expectInteractiveHover('.project-item h3 a', '.project-item');

  await page.goto('/tags/建站/');
  await expectInteractiveHover('.tag-result h2 a', '.tag-result');

  await page.goto('/');
  await expectInteractiveHover('.site-footer a', '.site-footer a');
});

test('滚动条使用设计系统的窄轨道与主题滑块', async ({ page }) => {
  await page.goto('/notes/');
  const scrollbar = await page.evaluate(() => {
    const root = document.documentElement;
    return {
      firefoxColor: getComputedStyle(root).scrollbarColor,
      width: getComputedStyle(root, '::-webkit-scrollbar').width,
      thumbColor: getComputedStyle(root, '::-webkit-scrollbar-thumb').backgroundColor,
      thumbRadius: getComputedStyle(root, '::-webkit-scrollbar-thumb').borderRadius,
    };
  });
  expect(scrollbar.firefoxColor).not.toBe('auto');
  expect(scrollbar.width).toBe('10px');
  expect(scrollbar.thumbColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(scrollbar.thumbRadius).toBe('999px');
});

test('标签归档使用清晰字号和整行内容入口', async ({ page }) => {
  await page.goto('/tags/建站/');
  const firstResult = page.locator('.tag-result').first();
  const typography = await firstResult.evaluate((result) => ({
    index: getComputedStyle(result.querySelector(':scope > span') as Element).fontSize,
    meta: getComputedStyle(result.querySelector(':scope > div > p:first-child') as Element).fontSize,
    summary: getComputedStyle(result.querySelector(':scope > div > p:last-child') as Element).fontSize,
    tag: getComputedStyle(document.querySelector('.tag-switcher .tag') as Element).fontSize,
  }));
  expect(typography).toEqual({ index: '12px', meta: '12px', summary: '14px', tag: '13px' });
  await expect(firstResult.locator(':scope > a')).toHaveCount(0);
  const resultBox = await firstResult.boundingBox();
  expect(resultBox).not.toBeNull();
  await firstResult.click({ position: { x: (resultBox?.width ?? 40) - 20, y: (resultBox?.height ?? 40) / 2 } });
  await expect(page).toHaveURL(/\/posts\/welcome\/$/);
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
  const currentColors = await currentItem.evaluate((element) => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-text-interactive)';
    element.append(probe);
    const colors = { actual: getComputedStyle(element).color, expected: getComputedStyle(probe).color };
    probe.remove();
    return colors;
  });
  expect(currentColors.actual).toBe(currentColors.expected);

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
