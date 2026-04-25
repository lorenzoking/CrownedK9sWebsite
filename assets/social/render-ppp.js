const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SOCIAL_DIR = __dirname;

const VARIANTS = [
  { name: 'premium-puppy-placement-find-my-puppy-4x5',    width: 1080, height: 1350 },
  { name: 'premium-puppy-placement-find-my-puppy-square', width: 1080, height: 1080 },
  { name: 'premium-puppy-placement-find-my-puppy-story',  width: 1080, height: 1920 },
];

(async () => {
  const browser = await chromium.launch();
  for (const v of VARIANTS) {
    const htmlPath = path.join(SOCIAL_DIR, `${v.name}.html`);
    if (!fs.existsSync(htmlPath)) {
      console.warn(`skip (no html): ${v.name}`);
      continue;
    }
    const ctx = await browser.newContext({
      viewport: { width: v.width, height: v.height },
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const pngOut = path.join(SOCIAL_DIR, `${v.name}.png`);
    await page.screenshot({ path: pngOut, type: 'png', fullPage: false, clip: { x: 0, y: 0, width: v.width, height: v.height } });
    console.log(`png  -> ${pngOut}`);

    const pdfOut = path.join(SOCIAL_DIR, `${v.name}.pdf`);
    await page.emulateMedia({ media: 'print' });
    await page.pdf({
      path: pdfOut,
      printBackground: true,
      width: `${v.width}px`,
      height: `${v.height}px`,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      pageRanges: '1',
    });
    console.log(`pdf  -> ${pdfOut}`);

    await ctx.close();
  }
  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });
