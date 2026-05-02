const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('response', response => {
    if (!response.ok()) {
      console.log('HTTP ERROR:', response.status(), response.url());
    }
  });
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  const rootHtml = await page.evaluate(() => document.getElementById('root').innerHTML);
  if (rootHtml.trim() === '') {
    console.log('ROOT IS EMPTY');
  } else {
    console.log('ROOT IS NOT EMPTY');
    // Click on Annual tab
    const tabs = await page.$$('button');
    for (let tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text && text.includes('Annual')) {
        await tab.click();
        await new Promise(r => setTimeout(r, 2000));
        console.log('CLICKED ANNUAL');
        break;
      }
    }
  }
  
  await browser.close();
})();
