import { expect, test } from '@playwright/test';

test('首页按编辑顺序呈现核心内容', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/DuDuLu/);
  await expect(page.getByRole('heading', { level: 1, name: /DuDuLu/ })).toBeVisible();
  await expect(page.getByText('写代码，也记录代码之外的事。')).toBeVisible();
  await expect(page.getByLabel('头像预留位置')).toBeVisible();

  const sections = await page.locator('main h2').allTextContents();
  expect(sections).toEqual(['最近文章', '近期随记', '选择的项目']);
});

test('三态主题会保存选择', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: /点击切换主题/ });
  await expect(toggle).toHaveAttribute('data-preference', 'system');
  await toggle.click();
  await expect(toggle).toHaveAttribute('data-preference', 'light');
  await toggle.click();
  await expect(toggle).toHaveAttribute('data-preference', 'dark');
  await page.reload();
  await expect(toggle).toHaveAttribute('data-preference', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('快捷键搜索覆盖文章、随记和项目', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
  const dialog = page.getByRole('dialog', { name: '搜索档案' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('searchbox').fill('Astro');
  await expect(dialog.getByText(/找到 \d+ 条结果/)).toBeVisible();
  await expect(dialog.getByRole('link', { name: /欢迎来到 DuDuLu/ })).toBeVisible();
  await expect(dialog.getByRole('link', { name: /DuDuLu 个人档案/ })).toBeVisible();
});

test('长文章提供目录、代码操作和扩展内容', async ({ page, isMobile }) => {
  await page.goto('/posts/welcome/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('欢迎来到 DuDuLu 的新档案');
  if (isMobile) {
    await expect(page.locator('details.toc-mobile')).toBeVisible();
  } else {
    await expect(page.getByLabel('文章目录')).toBeVisible();
  }
  await expect(page.getByRole('button', { name: '复制代码' })).toBeVisible();
  await expect(page.getByText('本文代码示例许可：MIT')).toBeVisible();
  await expect(page.getByRole('navigation', { name: '相邻文章' })).toHaveCount(0);
  await expect(page.locator('.mermaid')).toBeVisible();
});

test('归档路由与无题随记保持可访问', async ({ page }) => {
  await page.goto('/notes/quiet-interface/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/随记/);
  await expect(page.getByText('安静的界面并不等于没有性格')).toBeVisible();
  await page.goto('/projects/personal-archive/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('DuDuLu 个人档案');
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
