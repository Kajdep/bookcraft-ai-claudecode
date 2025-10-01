import { chromium } from '@playwright/test';

async function debugLexicalEditor() {
  console.log('🔍 Starting Playwright debugging of Lexical editor...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console logs and errors
  const errors = [];
  page.on('console', (msg) => {
    console.log(`🖥️  Console [${msg.type()}]: ${msg.text()}`);
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    console.error(`❌ Page Error: ${error.message}`);
    errors.push(`Page Error: ${error.message}`);
  });

  try {
    // Navigate to the app
    console.log('🌐 Navigating to BookCraft AI...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    // Wait for React to load
    await page.waitForSelector('#root', { timeout: 10000 });
    console.log('✅ App root loaded');

    // Take initial screenshot
    await page.screenshot({ path: 'debug-1-initial.png', fullPage: true });

    // Check if there's a project already or if we need to create one
    const hasProject = await page.locator('[data-testid="project-workspace"], .project-workspace').count() > 0;

    if (!hasProject) {
      console.log('📝 No project found, creating one...');

      // Look for new project button
      const newProjectButton = await page.getByRole('button', { name: /new project|create/i }).first();
      if (await newProjectButton.isVisible()) {
        await newProjectButton.click();
        console.log('✅ Clicked new project button');

        await page.waitForTimeout(1000);

        // Fill project form
        await page.fill('input[name="name"], input[placeholder*="name"]', 'Debug Test Project');
        await page.fill('textarea[name="description"], textarea[placeholder*="description"]', 'Testing Lexical editor functionality');

        // Submit
        await page.click('button[type="submit"], button:has-text("Create")');
        await page.waitForTimeout(2000);
        console.log('✅ Project created');
      }
    }

    // Navigate to Writing tab
    console.log('📝 Navigating to Writing Desk...');
    const writingTab = page.locator('button:has-text("Writing"), [aria-label*="Writing"]').first();
    if (await writingTab.isVisible()) {
      await writingTab.click();
      await page.waitForTimeout(1000);
      console.log('✅ Clicked Writing tab');
    }

    await page.screenshot({ path: 'debug-2-writing-tab.png', fullPage: true });

    // Check if we need to create a chapter
    const hasChapters = await page.locator('.chapter-list, [data-testid="chapter"]').count() > 0;

    if (!hasChapters) {
      console.log('📖 Creating a chapter...');

      const addChapterBtn = page.getByRole('button', { name: /add chapter|new chapter/i }).first();
      if (await addChapterBtn.isVisible()) {
        await addChapterBtn.click();
        await page.waitForTimeout(1000);
        console.log('✅ Added chapter');
      }
    }

    await page.screenshot({ path: 'debug-3-with-chapter.png', fullPage: true });

    // Now look for the Lexical editor
    console.log('🔍 Looking for Lexical editor components...');

    // Check for ContentEditable
    const contentEditable = page.locator('[data-testid="lexical-content-editable"]').first();
    const isVisible = await contentEditable.isVisible().catch(() => false);

    if (isVisible) {
      console.log('✅ Lexical ContentEditable found and visible!');

      // Try to interact with it
      await contentEditable.click();
      await page.type('[data-testid="lexical-content-editable"]', 'Hello, testing Lexical editor!');
      console.log('✅ Successfully typed in the editor!');

    } else {
      console.log('❌ Lexical ContentEditable not found or not visible');

      // Check for error boundary
      const errorBoundary = await page.locator('.error-boundary, [data-error-boundary]').count();
      if (errorBoundary > 0) {
        const errorText = await page.locator('.error-boundary, [data-error-boundary]').first().textContent();
        console.log('🚨 Error Boundary active:', errorText);
      }

      // Check for any elements containing "error"
      const errorElements = await page.locator(':has-text("error")').allTextContents();
      if (errorElements.length > 0) {
        console.log('🚨 Found error messages:', errorElements.slice(0, 3));
      }
    }

    // Check for toolbar
    const toolbar = await page.locator('.lexical-editor .toolbar, [role="toolbar"]').count();
    console.log(`📊 Toolbar elements found: ${toolbar}`);

    // Check for any Lexical-related classes
    const lexicalElements = await page.locator('[class*="lexical"], [data-lexical]').count();
    console.log(`📊 Elements with lexical classes: ${lexicalElements}`);

    // Final screenshot
    await page.screenshot({ path: 'debug-4-final.png', fullPage: true });

    // Summarize findings
    console.log('\n📋 DEBUGGING SUMMARY:');
    console.log(`- Lexical ContentEditable visible: ${isVisible}`);
    console.log(`- Toolbar elements: ${toolbar}`);
    console.log(`- Lexical elements: ${lexicalElements}`);
    console.log(`- JavaScript errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n🚨 ERRORS FOUND:');
      errors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
    }

    console.log('\n📸 Screenshots saved: debug-1-initial.png, debug-2-writing-tab.png, debug-3-with-chapter.png, debug-4-final.png');

    // Keep browser open for manual inspection
    console.log('\n🔍 Browser will remain open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await browser.close();
  }
}

debugLexicalEditor().catch(console.error);