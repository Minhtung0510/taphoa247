const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require(path.join(__dirname, '..', 'frontend', 'node_modules', 'playwright'));

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1200, height: 2000 },
      deviceScaleFactor: 2,
    });

    const htmlPath = pathToFileURL(path.join(__dirname, 'poster_taphoa247_pro.html')).href;
    await page.goto(htmlPath, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.addStyleTag({ content: '.toolbar { display: none !important; }' });

    const element = await page.locator('#capture-poster');
    const dateStamp = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    await element.screenshot({ path: path.join(__dirname, `taphoa247_ai_tiktok_${dateStamp}.png`) });
    console.log('SUCCESS: AI-focused TikTok poster rendered from poster_taphoa247_pro.html. Verify product price and stock before posting.');
    await browser.close();
  } catch (err) {
    console.error('Error rendering poster:', err);
  }
})();
