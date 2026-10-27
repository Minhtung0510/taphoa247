import { test, expect } from '@playwright/test';

test.describe('E-Commerce Gaming Account Website Test Suite', () => {

  test('1. Homepage has correct SEO metadata, H1, JSON-LD schemas and mascot', async ({ page }) => {
    await page.goto('/');

    // Kiểm tra title và metadata
    await expect(page).toHaveTitle(/DTFF SHOP/i);
    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toHaveAttribute('content', /tự động|Valorant|CS2|Steam/i);

    // Kiểm tra H1 duy nhất chuẩn SEO
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText('Shop Bán Acc Game');

    // Kiểm tra JSON-LD (Organization, WebSite)
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();
    expect(count).toBeGreaterThan(0);

    let hasOrg = false;
    let hasWebSite = false;
    for (let i = 0; i < count; i++) {
      const text = await jsonLdScripts.nth(i).textContent();
      if (text && text.includes('Organization')) hasOrg = true;
      if (text && text.includes('WebSite')) hasWebSite = true;
    }
    expect(hasOrg).toBe(true);
    expect(hasWebSite).toBe(true);

    // Kiểm tra Mascot AI hiển thị
    const mascot = page.locator('text=[AI Thu Ngân]');
    await expect(mascot).toBeVisible();
  });

  test('2. Category page and Product detail page render SEO & Product schema', async ({ page }) => {
    // Vào danh mục Valorant
    await page.goto('/valorant');
    await expect(page.locator('h1')).toContainText('Valorant');

    // Kiểm tra danh sách sản phẩm hiển thị
    const productCards = page.locator('a[href^="/valorant/"]');
    const count = await productCards.count();
    expect(count).toBeGreaterThan(0);

    // Vào trang chi tiết sản phẩm đầu tiên
    await productCards.first().click();
    await page.waitForURL(/\/valorant\/.+/);

    // Kiểm tra H1 trang sản phẩm
    const prodH1 = page.locator('h1');
    await expect(prodH1).toBeVisible();

    // Kiểm tra JSON-LD Product & Offer
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const scriptCount = await jsonLdScripts.count();
    let hasProductSchema = false;

    for (let i = 0; i < scriptCount; i++) {
      const content = await jsonLdScripts.nth(i).textContent();
      if (content && content.includes('"@type":"Product"') && content.includes('"@type":"Offer"')) {
        hasProductSchema = true;
        break;
      }
    }
    expect(hasProductSchema).toBe(true);

    // Kiểm tra nút mua ngay hoặc trạng thái tồn kho
    const buyBtn = page.locator('text=/Tạo Mã QR Mua Ngay|Hết hàng tạm thời/');
    await expect(buyBtn).toBeVisible();
  });

  test('3. Dynamic Sitemap and Robots.txt respond correctly', async ({ request }) => {
    // Sitemap XML
    const sitemapRes = await request.get('/sitemap.xml');
    expect(sitemapRes.status()).toBe(200);
    const sitemapText = await sitemapRes.text();
    expect(sitemapText).toContain('<urlset');
    expect(sitemapText).toContain('/valorant');
    expect(sitemapText).toContain('/cs2');
    expect(sitemapText).toContain('/steam');
    expect(sitemapText).toContain('/pubg');

    // Robots TXT
    const robotsRes = await request.get('/robots.txt');
    expect(robotsRes.status()).toBe(200);
    const robotsText = await robotsRes.text();
    expect(robotsText).toContain('Disallow: /admin/');
    expect(robotsText).toContain('Disallow: /checkout');
    expect(robotsText).toContain('Disallow: /don-hang/');
  });

  test('4. Full E2E Flow: Create Order -> PAYMENT_TEST_MODE -> Deliver Acc -> Check Acc -> Warranty', async ({ page }) => {
    // 1. Vào trang checkout
    await page.goto('/checkout');
    await expect(page.locator('h1')).toContainText('Thanh Toán Đơn Hàng');

    // Điền thông tin khách hàng
    await page.fill('input[placeholder="VD: Anh Tuấn"]', 'Playwright Tester');
    await page.fill('input[placeholder="customer@example.com"]', 'tester@gmail.com');

    // Bấm nút "⚡ Tạo Mã QR VietQR Thanh Toán"
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Chờ đơn hàng được tạo và hiển thị QR
    const qrImage = page.locator('img[alt="VietQR MBBank"]');
    await expect(qrImage).toBeVisible({ timeout: 15000 });

    // Kiểm tra hiển thị memo thanh toán
    const memoElement = page.locator('text=ACC-');
    await expect(memoElement.first()).toBeVisible();

    // Kiểm tra nút "Thanh toán thử nghiệm (PAYMENT_TEST_MODE)"
    const testPayBtn = page.locator('button:has-text("PAYMENT_TEST_MODE")');
    await expect(testPayBtn).toBeVisible();

    // Bấm giả lập thanh toán
    await testPayBtn.click();

    // Chờ chuyển hướng sang trang đơn hàng hoàn tất /don-hang/ACC-...
    await page.waitForURL(/\/don-hang\/ACC-.+/, { timeout: 15000 });

    // Kiểm tra trang đơn hàng
    await expect(page.locator('h1')).toContainText('Đơn Hàng:');
    const successBadge = page.locator('text=ĐÃ THANH TOÁN THÀNH CÔNG');
    await expect(successBadge).toBeVisible();

    // Kiểm tra có nút sao chép hoặc ô tài khoản
    const copyTkBtn = page.locator('button:has-text("Sao chép")');
    await expect(copyTkBtn.first()).toBeVisible();

    // Lấy mã đơn hàng từ URL
    const url = page.url();
    const orderCode = url.split('/don-hang/')[1];
    expect(orderCode).toMatch(/^ACC-[A-Z0-9]{8}$/);

    // 2. Kiểm tra trang "Check Acc"
    await page.goto(`/check-acc/${orderCode}`);
    await expect(page.locator('h1')).toContainText('Chi Tiết Tài Khoản Đơn:');
    // Kiểm tra các thành phần phân tích acc (USER, PASS, RANK HIỆN TẠI)
    await expect(page.locator('text=TÀI KHOẢN (USER)')).toBeVisible();
    await expect(page.locator('text=RANK HIỆN TẠI')).toBeVisible();

    // 3. Kiểm tra trang "Bảo Hành"
    await page.goto('/bao-hanh');
    await expect(page.locator('h1')).toContainText('Trung Tâm Bảo Hành');
    // Tra cứu mã đơn vừa mua
    await page.fill('input[placeholder="ACC-..."]', orderCode);
    await page.click('button:has-text("Tra Cứu Đơn Hàng")');

    // Form danh sách tài khoản đủ điều kiện bảo hành hiện ra
    await expect(page.locator('text=Tài Khoản Còn Trong Hạn Bảo Hành')).toBeVisible({ timeout: 10000 });
  });

  test('5. Policy pages load properly and have correct headers', async ({ page }) => {
    await page.goto('/chinh-sach-bao-hanh');
    await expect(page.locator('h1')).toContainText('Chính Sách Bảo Hành');

    await page.goto('/dieu-khoan');
    await expect(page.locator('h1')).toContainText('Điều Khoản Dịch Vụ');

    await page.goto('/lien-he');
    await expect(page.locator('h1')).toContainText('Liên Hệ');
  });

  test('6. Admin dashboard loads and has noindex meta tag', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText('Quản Trị');
    
    // Kiểm tra noindex
    const robotsMeta = page.locator('meta[name="robots"]');
    await expect(robotsMeta).toHaveAttribute('content', /noindex/);
  });
});
