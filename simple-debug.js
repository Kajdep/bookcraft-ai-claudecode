import { chromium } from '@playwright/test';

async function simpleDebug() {
  console.log('🔍 Simple debugging of Lexical issue...');

  const browser = await chromium.launch({ headless: false, devtools: true });
  const page = await browser.newPage();

  // Track all errors
  const errors = [];
  page.on('console', (msg) => {
    const text = msg.text();
    console.log(`[${msg.type().toUpperCase()}] ${text}`);
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });

  page.on('pageerror', (error) => {
    console.error(`PAGE ERROR: ${error.message}`);
    errors.push(`Page Error: ${error.message}`);
  });

  try {
    // Navigate to app
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    // Wait a bit for any initial errors to surface
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'simple-debug-initial.png' });

    // Check what's currently on screen
    const pageContent = await page.textContent('body');
    console.log('Page contains:', pageContent.substring(0, 200) + '...');

    // Look for key elements
    const hasRoot = await page.locator('#root').count() > 0;
    const hasMain = await page.locator('main, [role="main"]').count() > 0;
    const hasNav = await page.locator('nav, [role="navigation"]').count() > 0;

    console.log(`Elements found: root=${hasRoot}, main=${hasMain}, nav=${hasNav}`);

    // Check for any visible buttons that might lead to the editor
    const buttons = await page.locator('button').allTextContents();
    console.log('Available buttons:', buttons.slice(0, 10));

    // Look specifically for Writing/Editor related elements
    const writingElements = await page.locator(':has-text("Writing"), :has-text("Editor"), :has-text("Chapter")').count();
    console.log(`Writing-related elements: ${writingElements}`);

    if (writingElements > 0) {
      const writingButton = page.locator('button:has-text("Writing"), [aria-label*="Writing"]').first();
      if (await writingButton.isVisible()) {
        console.log('✅ Found Writing button, clicking...');
        await writingButton.click();
        await page.waitForTimeout(2000);

        // Check for Lexical editor
        const lexicalEditor = await page.locator('[data-testid="lexical-content-editable"], .lexical-editor').count();
        console.log(`Lexical editor elements after clicking Writing: ${lexicalEditor}`);

        await page.screenshot({ path: 'simple-debug-after-writing.png' });
      }
    }

    // Final error summary
    console.log(`\n📊 SUMMARY:`);
    console.log(`Total errors: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Errors:', errors);
    }

    // Keep browser open for manual inspection
    console.log('\n⏳ Browser will stay open for manual inspection (30 seconds)...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await browser.close();
  }
}

simpleDebug().catch(console.error);