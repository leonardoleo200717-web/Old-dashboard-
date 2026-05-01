const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  try {
    await page.waitForSelector('#root', { timeout: 3000 });
    const content = await page.evaluate(() => document.getElementById('root').innerHTML);
    console.log('ROOT CONTENT:', content.substring(0, 100));
  } catch (e) {
    console.log('Error waiting:', e.message);
  }
  await browser.close();
})();
