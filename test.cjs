const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('response', response => {
  if (response.status() === 404) {
    console.log('404 Not Found:', response.url());
  }
});
  page.on('requestfailed', request => console.log('BROWSER REQUEST FAILED:', request.url(), request.failure()?.errorText));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 1000));
  try {
    const fab = await page.$('button.group');
    if (fab) {
      console.log('Clicking FAB');
      await fab.click();
      console.log('FAB Clicked');
    } else {
      console.log('FAB NOT FOUND');
    }
  } catch (e) {
    console.log('Error clicking', e);
  }
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
