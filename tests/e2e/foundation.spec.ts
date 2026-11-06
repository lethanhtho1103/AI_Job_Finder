import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('trang chủ tiếng Việt có điều hướng, responsive, SSR và accessibility', async ({
  page,
  browser,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  const html = await response!.text();
  expect(html.includes('<style id="antd-cssinjs"')).toBe(true);
  expect(html.includes('Tìm việc có')).toBe(true);
  const serverContext = await browser.newContext({ javaScriptEnabled: false });
  const serverPage = await serverContext.newPage();
  await serverPage.goto('/');
  await expect(
    serverPage.getByRole('link', { name: 'Khám phá cách hoạt động' }),
  ).toHaveCSS('background-color', 'rgb(15, 118, 110)');
  await serverContext.close();
  await expect(page).toHaveTitle('AI Job Finder — Tìm việc có định hướng');
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Tìm việc có',
  );
  await expect(
    page.getByText('Sản phẩm đang phát triển', { exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Bỏ qua đến nội dung' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await page.getByRole('link', { name: 'Khám phá cách hoạt động' }).click();
  await expect(page).toHaveURL(/#cach-hoat-dong$/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollbarColor,
    ),
  ).not.toBe('auto');
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe('auto');
  await page.screenshot({
    path: `test-results/home-${test.info().project.name}.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test('health công khai có hợp đồng ổn định', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toContain('no-store');
  expect(await response.json()).toEqual({
    status: 'ok',
    service: 'ai-job-finder',
  });
});

test('trang 404 cho phép trở về trang chủ', async ({ page }) => {
  const response = await page.goto('/trang-khong-ton-tai');
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole('heading', { name: 'Không tìm thấy trang' }),
  ).toBeVisible();
  await expect(page).toHaveTitle('Không tìm thấy trang | AI Job Finder');
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.getByRole('link', { name: 'Về trang chủ' }).click();
  await expect(page).toHaveURL('/');
});
