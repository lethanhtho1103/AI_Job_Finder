import { test, expect } from '@playwright/test';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import AxeBuilder from '@axe-core/playwright';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getAdminSeedOptions, seedAdmin } from '../../prisma/seed-admin';
import { developmentAdminPassword } from '../../prisma/development-admin';
import { verifyPassword } from '../../src/server/auth/password';

const databaseUrl = process.env.TEST_DATABASE_URL;
test.describe('authentication với PostgreSQL thật', () => {
  test.skip(
    !databaseUrl,
    'Cần TEST_DATABASE_URL trỏ tới PostgreSQL local kiểm thử riêng.',
  );
  test.describe.configure({ mode: 'serial' });
  let pool: Pool;
  let database: PrismaClient;
  test.beforeAll(async () => {
    const url = new URL(databaseUrl!);
    if (
      !['127.0.0.1', 'localhost'].includes(url.hostname) ||
      url.pathname !== '/ai_job_finder_test'
    ) {
      throw new Error(
        'E2E chỉ được ghi/xóa dữ liệu trên database local ai_job_finder_test.',
      );
    }
    pool = new Pool({ connectionString: databaseUrl });
    database = new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl }),
    });
  });
  test.beforeEach(async () => {
    await pool.query('DELETE FROM "AuthRateLimit"');
  });
  test.afterAll(async () => {
    await database?.$disconnect();
    await pool?.end();
  });

  test('seed Admin idempotent, hash an toàn, không reset hoặc nâng quyền tài khoản có sẵn', async () => {
    const options = getAdminSeedOptions(
      { NODE_ENV: 'development' },
      developmentAdminPassword,
    );
    await seedAdmin(database, options);
    const before = await database.user.findUniqueOrThrow({
      where: { usernameKey: 'admin' },
    });
    await seedAdmin(database, options);
    const after = await database.user.findUniqueOrThrow({
      where: { usernameKey: 'admin' },
    });
    expect(after.id).toBe(before.id);
    expect(after.passwordHash).toBe(before.passwordHash);
    expect(after.updatedAt).toEqual(before.updatedAt);
    expect(after.role).toBe('Administrator');
    expect(after.passwordHash).not.toBe(developmentAdminPassword);
    expect(
      await verifyPassword(developmentAdminPassword, after.passwordHash),
    ).toBe(true);
    expect(await database.user.count({ where: { usernameKey: 'admin' } })).toBe(
      1,
    );
    await expect(
      seedAdmin(database, {
        password: 'Strong-Password-2026!',
        developmentOnly: false,
        production: true,
      }),
    ).rejects.toThrow('Admin Development bị chặn');
    await database.user.update({
      where: { id: before.id },
      data: { role: 'User' },
    });
    try {
      await expect(seedAdmin(database, options)).rejects.toThrow(
        'không tự nâng quyền',
      );
    } finally {
      await database.user.update({
        where: { id: before.id },
        data: { role: 'Administrator' },
      });
    }
  });

  test('đăng ký, username trùng hoa thường, role User, login/logout và thu hồi token', async ({
    page,
  }) => {
    const username = `User_${randomUUID().replaceAll('-', '').slice(0, 12)}`;
    const password = 'My-Password-2026!';
    await page.goto('/register');
    await page.getByLabel('Tên đăng nhập', { exact: true }).fill(username);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
    await page.getByLabel('Xác nhận mật khẩu', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
    await expect(page).toHaveURL(/\/login\?registered=1$/);
    await expect(
      page.getByText('Đăng ký thành công. Bạn có thể đăng nhập ngay.'),
    ).toBeVisible();
    const user = await database.user.findUniqueOrThrow({
      where: { usernameKey: username.toLowerCase() },
    });
    expect(user.role).toBe('User');
    expect(user.passwordHash).not.toBe(password);
    expect(await verifyPassword(password, user.passwordHash)).toBe(true);
    const duplicate = await page.request.post('/api/auth/register', {
      headers: { Origin: 'http://127.0.0.1:3100' },
      data: {
        username: username.toUpperCase(),
        password,
        confirmPassword: password,
      },
    });
    expect(duplicate.status()).toBe(409);
    await page
      .getByLabel('Tên đăng nhập', { exact: true })
      .fill(username.toUpperCase());
    await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
    await page
      .getByRole('button', { name: 'Hiện mật khẩu', exact: true })
      .click();
    await expect(page.getByLabel('Mật khẩu', { exact: true })).toHaveAttribute(
      'type',
      'text',
    );
    await page
      .getByRole('button', { name: 'Ẩn mật khẩu', exact: true })
      .click();
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page).toHaveURL('/dashboard');
    await expect(
      page.getByRole('heading', { name: `Xin chào, ${username}.` }),
    ).toBeVisible();
    const sessionResponse = await page.request.get('/api/auth/session');
    const session = await sessionResponse.json();
    expect(session.user).toEqual({ id: user.id, username, role: 'User' });
    expect(JSON.stringify(session)).not.toContain('password');
    const { csrfToken } = await (
      await page.request.get('/api/auth/csrf')
    ).json();
    const updated = await page.request.post('/api/auth/session', {
      data: {
        csrfToken,
        data: { user: { id: randomUUID(), role: 'Administrator' } },
      },
    });
    expect((await updated.json()).user).toEqual({
      id: user.id,
      username,
      role: 'User',
    });
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((cookie) =>
      cookie.name.endsWith('next-auth.session-token'),
    )!;
    expect(sessionCookie.httpOnly).toBe(true);
    expect(sessionCookie.sameSite).toBe('Lax');
    const replayCookie = `${sessionCookie.name}=${sessionCookie.value}`;
    await page.goto('/login');
    await expect(page).toHaveURL('/dashboard');
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await expect(page).toHaveURL('/login');
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
    const replay = await page.request.get('/api/auth/session', {
      headers: { Cookie: replayCookie },
    });
    expect((await replay.json()).user).toBeUndefined();
    expect(
      await database.authSession.count({ where: { userId: user.id } }),
    ).toBe(0);
    await page.getByLabel('Tên đăng nhập', { exact: true }).fill(username);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page).toHaveURL('/dashboard');
    await database.authSession.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(0) },
    });
    await page.reload();
    await expect(page).toHaveURL('/login');
  });

  test('validation client/server, không cho tự chọn Administrator và không tạo user khi dữ liệu sai', async ({
    page,
  }) => {
    await page.goto('/register');
    await page.getByLabel('Tên đăng nhập', { exact: true }).fill('ab');
    await page.getByLabel('Mật khẩu', { exact: true }).fill('short');
    await page
      .getByLabel('Xác nhận mật khẩu', { exact: true })
      .fill('different');
    await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
    await expect(
      page.getByText('Tên đăng nhập cần từ 3 đến 32 ký tự.'),
    ).toBeVisible();
    await expect(page.getByText('Mật khẩu cần ít nhất 8 ký tự.')).toBeVisible();
    await expect(page.getByText('Mật khẩu xác nhận chưa khớp.')).toBeVisible();
    const base = {
      username: `Safe_${randomUUID().slice(0, 8)}`,
      password: 'Safe-Password-2026!',
      confirmPassword: 'Safe-Password-2026!',
    };
    for (const data of [
      { ...base, password: 'short' },
      { ...base, confirmPassword: 'wrong' },
      { ...base, role: 'Administrator' },
    ]) {
      expect(
        (
          await page.request.post('/api/auth/register', {
            headers: { Origin: 'http://127.0.0.1:3100' },
            data,
          })
        ).status(),
      ).toBe(400);
    }
    expect(
      await database.user.count({
        where: { usernameKey: base.username.toLowerCase() },
      }),
    ).toBe(0);
    expect(
      (
        await page.request.post('/api/auth/register', {
          headers: { Origin: 'https://untrusted.example' },
          data: base,
        })
      ).status(),
    ).toBe(403);
  });

  test('sai mật khẩu và truy cập khi chưa đăng nhập', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
    await page
      .getByLabel('Tên đăng nhập', { exact: true })
      .fill('unknown_user');
    await page.getByLabel('Mật khẩu', { exact: true }).fill('wrong-password');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(
      page.getByText('Tên đăng nhập hoặc mật khẩu không đúng.'),
    ).toBeVisible();
    expect(
      (await (await page.request.get('/api/auth/session')).json()).user,
    ).toBeUndefined();
    await expect(page.getByLabel('Mật khẩu', { exact: true })).toHaveValue('');
  });

  test('admin mặc định đăng nhập được ở Development, bị chặn ở Production', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Tên đăng nhập', { exact: true }).fill('admin');
    await page
      .getByLabel('Mật khẩu', { exact: true })
      .fill(developmentAdminPassword);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    if (process.env.AUTH_E2E_DEVELOPMENT === '1') {
      await expect(page).toHaveURL('/dashboard');
      await expect(
        page.getByText('Quản trị viên', { exact: true }),
      ).toBeVisible();
      expect(
        (await (await page.request.get('/api/auth/session')).json()).user.role,
      ).toBe('Administrator');
    } else {
      await expect(
        page.getByText('Tên đăng nhập hoặc mật khẩu không đúng.'),
      ).toBeVisible();
      expect(
        (await (await page.request.get('/api/auth/session')).json()).user,
      ).toBeUndefined();
    }
  });

  test('rate limit và CSRF của login/register không thể bỏ qua', async ({
    request,
  }) => {
    const missingCsrf = await request.post('/api/auth/callback/credentials', {
      form: {
        username: 'admin',
        password: developmentAdminPassword,
        json: 'true',
      },
    });
    expect(missingCsrf.headers()['set-cookie'] ?? '').not.toContain(
      'session-token',
    );
    expect(
      (await (await request.get('/api/auth/session')).json()).user,
    ).toBeUndefined();
    const { csrfToken } = await (await request.get('/api/auth/csrf')).json();
    for (let attempt = 0; attempt < 11; attempt++) {
      const result = await request.post('/api/auth/callback/credentials', {
        form: {
          username: 'rate_limited_user',
          password: 'wrong',
          csrfToken,
          json: 'true',
        },
      });
      const body = await result.json();
      if (attempt === 10) expect(body.url).toContain('RATE_LIMITED');
    }
    for (let attempt = 0; attempt < 6; attempt++) {
      const result = await request.post('/api/auth/register', {
        headers: { Origin: 'http://127.0.0.1:3100' },
        data: {},
      });
      expect(result.status()).toBe(attempt === 5 ? 429 : 400);
    }
  });

  test('login/register responsive, có label, keyboard và accessibility', async ({
    page,
  }) => {
    for (const route of ['/login', '/register']) {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.getByLabel('Mật khẩu', { exact: true }).focus();
      await page.keyboard.press('Tab');
      await expect(
        page
          .getByRole('button', { name: 'Hiện mật khẩu', exact: true })
          .first(),
      ).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(
        page.getByLabel('Mật khẩu', { exact: true }),
      ).toHaveAttribute('type', 'text');
      await page.screenshot({
        path: `test-results/${route.slice(1)}-${test.info().project.name}.png`,
        fullPage: true,
      });
    }
  });
});
