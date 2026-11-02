import { test, expect } from '@playwright/test';

const user = { id: 999999, name: 'Auth Regression', email: 'auth@example.test', role: 'customer' };

test('login, logout and reopen starts a clean form', async ({ page }) => {
  await page.route('**/auth/login', route => route.fulfill({ json: { success: true, data: { token: 'test-only', user } } }));
  await page.route('**/auth/logout', route => route.fulfill({ json: { success: true } }));
  await page.goto('/');
  await page.getByTitle('Đăng nhập tài khoản', { exact: true }).click();
  await page.getByRole('button', { name: 'Email & Mật Khẩu' }).click();
  await page.locator('input[type="text"]').last().fill(user.email);
  await page.locator('input[type="password"]').fill('test-password');
  await page.getByRole('button', { name: 'Đăng Nhập Ngay', exact: true }).click();
  await page.getByTitle(user.name, { exact: true }).click();
  await page.getByRole('button', { name: 'Đăng Xuất' }).click();
  await page.getByTitle('Đăng nhập tài khoản', { exact: true }).click();
  await page.getByRole('button', { name: 'Email & Mật Khẩu' }).click();
  await expect(page.getByText('Đăng nhập thành công!', { exact: true })).toHaveCount(0);
  await expect(page.locator('input[type="password"]')).toHaveValue('');
  await expect(page.locator('input[type="text"]').last()).toHaveValue('');
});

test('Discord callback loads assets and exchanges the code once', async ({ page }) => {
  let exchanges = 0;
  const failedAssets: string[] = [];
  page.on('response', response => {
    if (response.url().includes('/_next/static/') && response.status() >= 400) failedAssets.push(response.url());
  });
  await page.addInitScript(() => sessionStorage.setItem('discord_oauth_state', 'regression-state'));
  await page.route('**/auth/discord/callback', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    exchanges++;
    expect(route.request().postDataJSON()).toMatchObject({ code: 'test-code', state: 'regression-state' });
    await route.fulfill({ json: { success: true, data: { token: 'test-only', user } } });
  });
  await page.route('**/orders*', route => route.fulfill({ json: { success: true, data: [] } }));
  await page.goto('/auth/discord/callback?code=test-code&state=regression-state');
  await expect(page).toHaveURL(/\/lich-su-don-hang/);
  await expect(page.getByTitle(user.name, { exact: true })).toBeVisible();
  expect(exchanges).toBe(1);
  expect(failedAssets).toEqual([]);
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(5, 10, 20)');
});

test('customer denied admin access keeps session after returning and reloading', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('auth-seeded')) {
      localStorage.setItem('dtff_auth_token', 'customer-test-token');
      sessionStorage.setItem('auth-seeded', 'yes');
    }
  });
  await page.route('**/auth/me', route => route.fulfill({ json: { success: true, data: user } }));
  await page.route('**/admin/bootstrap', route => route.fulfill({ status: 403, json: { success: false } }));
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Trang Không Tồn Tại' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('dtff_auth_token'))).toBe('customer-test-token');
  await page.getByRole('link', { name: 'Quay về trang chủ' }).click();
  await expect(page.getByTitle(user.name, { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByTitle(user.name, { exact: true })).toBeVisible();
});

test('public banner settings display and refresh on focus', async ({ page }) => {
  let bannerText = 'Thông báo kiểm thử mới';
  await page.route('**/store/settings', route => route.fulfill({ json: { success: true, data: {
    banner_active: true, banner_text: bannerText, banner_gift_code: 'PUBLICGIFT',
  } } }));
  await page.goto('/');
  await expect(page.getByText(bannerText, { exact: true }).first()).toBeVisible();
  bannerText = 'Thông báo đã cập nhật';
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByText(bannerText, { exact: true }).first()).toBeVisible();
});

test('admin user directory searches and opens details', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('dtff_auth_token', 'admin-test'));
  await page.route('**/auth/me', route => route.fulfill({ json: { success: true, data: { ...user, role: 'admin', is_admin: true } } }));
  await page.route('**/admin/bootstrap', route => route.fulfill({ json: { success: true, data: {} } }));
  await page.route('**/admin/users?*', route => route.fulfill({ json: { success: true, data: { data: [{ ...user, created_at: '2026-11-01T00:00:00Z', email_verified_at: null, discord_id: '123456789', orders_count: 3 }], total: 1, current_page: 1, last_page: 1 } } }));
  await page.goto('/admin');
  await page.getByRole('button', { name: /Quản Lý Người Dùng/ }).click();
  await expect(page.getByRole('heading', { name: 'Khách hàng & người dùng' })).toBeVisible();
  await page.getByLabel('Tìm người dùng').fill('Auth');
  const request = page.waitForRequest(r => r.url().includes('/admin/users?search=Auth'));
  await page.getByRole('button', { name: 'Lọc', exact: true }).click();
  await request;
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).click();
  const accountDetails = page.getByRole('dialog', { name: /Thông tin tài khoản/ });
  await expect(accountDetails.getByText('Discord ID', { exact: true })).toBeVisible();
  await expect(accountDetails.getByText('123456789', { exact: true })).toBeVisible();
});

test('admin can submit create, edit and confirmed delete forms', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('dtff_auth_token', 'admin-test'));
  await page.route('**/auth/me', r => r.fulfill({ json: { success: true, data: { ...user, role: 'admin' } } }));
  await page.route('**/admin/bootstrap', r => r.fulfill({ json: { success: true, data: {} } }));
  await page.route('**/admin/users?*', r => r.fulfill({ json: { success: true, data: { data: [{ ...user, created_at: '2026-11-01T00:00:00Z', orders_count: 0 }], total: 1, last_page: 1 } } }));
  const methods: string[] = [];
  await page.route(/\/admin\/users(?:\/\d+)?$/, r => { methods.push(r.request().method()); return r.fulfill({ json: { success: true } }); });
  await page.goto('/admin');
  await page.getByRole('button', { name: /Quản Lý Người Dùng/ }).click();
  await page.getByRole('button', { name: /Thêm người dùng/ }).click();
  await page.getByLabel('Tên', { exact: true }).fill('New Customer');
  await page.getByLabel('Email', { exact: true }).fill('new@example.test');
  await page.getByLabel('Mật khẩu mới').fill('test-password');
  await page.getByRole('button', { name: 'Lưu tài khoản' }).click();
  await expect(page.getByText('Đã lưu người dùng.')).toBeVisible();
  await page.getByRole('button', { name: 'Sửa', exact: true }).click();
  await page.getByLabel('Tên', { exact: true }).fill('Updated Customer');
  await page.getByRole('button', { name: 'Lưu tài khoản' }).click();
  await expect(page.getByText('Đã lưu người dùng.')).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Xóa', exact: true }).click();
  await expect(page.getByText('Đã xóa người dùng.')).toBeVisible();
  expect(methods).toEqual(['POST', 'PUT', 'DELETE']);
});

test('Discord admin callback routes to admin control center', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('discord_oauth_state', 'admin-state'));
  await page.route('**/auth/discord/callback', r => r.request().method() === 'POST'
    ? r.fulfill({ json: { success: true, data: { token: 'admin-token', user: { ...user, role: 'admin', is_admin: true } } } })
    : r.continue());
  await page.route('**/auth/me', r => r.fulfill({ json: { success: true, data: { ...user, role: 'admin', is_admin: true } } }));
  await page.route('**/admin/bootstrap', r => r.fulfill({ json: { success: true, data: {} } }));
  await page.goto('/auth/discord/callback?code=admin-code&state=admin-state');
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('button', { name: /Quản Lý Người Dùng/ })).toBeVisible();
});
