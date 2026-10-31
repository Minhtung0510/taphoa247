const { chromium } = require('c:/Users/Administrator/Desktop/Test/frontend/node_modules/playwright');
const path = require('path');

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1200, height: 1600 },
      deviceScaleFactor: 2,
    });

    const htmlPath = 'file:///' + path.resolve('c:/Users/Administrator/Desktop/Test/Poster/poster_taphoa247_pro.html').replace(/\\/g, '/');
    await page.goto(htmlPath, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const element = await page.locator('#capture-poster');
    await element.screenshot({ path: 'C:/Users/Administrator/Desktop/Test/Poster/taphoa247_poster_marketing.png' });
    console.log('SUCCESS: Updated poster rendered to PNG!');
    await browser.close();
  } catch (err) {
    console.error('Error rendering poster:', err);
  }
})();
