import { chromium } from 'playwright';
import fs from 'fs';

async function manualLexicalTest() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1200,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    console.log('🚀 Starting Manual Lexical Editor Test...');

    // Navigate to the application
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('📍 Page loaded, taking screenshot...');
    await page.screenshot({ path: 'screenshots/manual-01-loaded.png', fullPage: true });

    // Look for the "Create New Project" section
    console.log('🔍 Looking for create project elements...');

    // First, let's see what's available on the page
    const allButtons = await page.locator('button').all();
    console.log(`Found ${allButtons.length} buttons on the page`);

    for (let i = 0; i < Math.min(5, allButtons.length); i++) {
      const text = await allButtons[i].textContent();
      console.log(`Button ${i + 1}: "${text}"`);
    }

    // Look for project creation form
    const projectTitleInput = page.locator('input[placeholder*="title"], input[placeholder*="Title"]').first();

    if (await projectTitleInput.count() > 0) {
      console.log('📝 Found project title input, filling it...');
      await projectTitleInput.fill('Manual Test Project');

      const genreSelect = page.locator('select').first();
      if (await genreSelect.count() > 0) {
        await genreSelect.selectOption('Fiction');
      }

      const descTextarea = page.locator('textarea').first();
      if (await descTextarea.count() > 0) {
        await descTextarea.fill('Testing the Lexical rich text editor manually');
      }

      await page.screenshot({ path: 'screenshots/manual-02-form-filled.png', fullPage: true });

      // Submit the form
      const createBtn = page.locator('button').filter({ hasText: /create/i }).first();
      if (await createBtn.count() > 0) {
        console.log('🎯 Clicking create project button...');
        await createBtn.click();
        await page.waitForTimeout(3000);

        await page.screenshot({ path: 'screenshots/manual-03-project-created.png', fullPage: true });
      }
    }

    // Now look for writing tab/workspace
    console.log('📝 Looking for writing workspace...');
    const writingElements = await page.locator('*').filter({ hasText: /writing|write/i }).all();
    console.log(`Found ${writingElements.length} elements with "writing" text`);

    for (let i = 0; i < Math.min(3, writingElements.length); i++) {
      const text = await writingElements[i].textContent();
      const tagName = await writingElements[i].evaluate(el => el.tagName);
      console.log(`Writing element ${i + 1} (${tagName}): "${text}"`);
    }

    // Click on writing tab if found
    const writingTab = page.locator('button, a').filter({ hasText: /writing/i }).first();
    if (await writingTab.count() > 0) {
      console.log('🎯 Clicking writing tab...');
      await writingTab.click();
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'screenshots/manual-04-writing-tab.png', fullPage: true });
    }

    // Look for chapter elements
    console.log('📚 Looking for chapter elements...');
    const chapterElements = await page.locator('*').filter({ hasText: /chapter/i }).all();
    console.log(`Found ${chapterElements.length} elements with "chapter" text`);

    // Try to add a chapter
    const addChapterBtn = page.locator('button').filter({ hasText: /add.*chapter|new.*chapter|\+/i }).first();
    if (await addChapterBtn.count() > 0) {
      console.log('➕ Adding a chapter...');
      await addChapterBtn.click();
      await page.waitForTimeout(2000);

      // Fill chapter details if form appears
      const chapterTitle = page.locator('input').filter({ hasNot: page.locator('[readonly]') }).first();
      if (await chapterTitle.count() > 0) {
        await chapterTitle.fill('Test Chapter');

        const saveBtn = page.locator('button').filter({ hasText: /save|create|add/i }).first();
        if (await saveBtn.count() > 0) {
          await saveBtn.click();
          await page.waitForTimeout(2000);
        }
      }

      await page.screenshot({ path: 'screenshots/manual-05-chapter-added.png', fullPage: true });
    }

    // Now look for the Lexical editor more broadly
    console.log('🔍 Searching for any text editing area...');

    // Check for any contenteditable elements
    const editableElements = await page.locator('[contenteditable="true"]').all();
    console.log(`Found ${editableElements.length} contenteditable elements`);

    if (editableElements.length > 0) {
      console.log('✅ Found contenteditable element(s)');
      const editor = page.locator('[contenteditable="true"]').first();

      // Test basic functionality
      await editor.click();
      await editor.type('Testing the Lexical editor functionality!', { delay: 100 });

      await page.screenshot({ path: 'screenshots/manual-06-editor-test.png', fullPage: true });

      // Look for toolbar
      const toolbar = page.locator('.lexical-editor, [class*="toolbar"], [class*="Toolbar"]').first();
      if (await toolbar.count() > 0) {
        console.log('🛠️ Found toolbar area');

        const toolbarButtons = await page.locator('button[title]').all();
        console.log(`Found ${toolbarButtons.length} toolbar buttons with tooltips`);

        // Test a few buttons
        if (toolbarButtons.length > 0) {
          console.log('🔸 Testing toolbar buttons...');

          // Select text first
          await editor.press('Control+a');
          await page.waitForTimeout(500);

          // Try bold button
          const boldBtn = page.locator('button').filter({ hasText: /bold/i }).or(page.locator('button[title*="Bold"]')).first();
          if (await boldBtn.count() > 0) {
            await boldBtn.click();
            console.log('✅ Clicked bold button');
          }

          await page.screenshot({ path: 'screenshots/manual-07-formatting-test.png', fullPage: true });
        }
      }
    } else {
      console.log('❌ No contenteditable elements found');

      // Let's check what elements we do have
      console.log('🔍 Checking all input elements...');
      const inputs = await page.locator('input, textarea').all();
      console.log(`Found ${inputs.length} input/textarea elements`);

      for (let i = 0; i < Math.min(5, inputs.length); i++) {
        const placeholder = await inputs[i].getAttribute('placeholder');
        const type = await inputs[i].getAttribute('type');
        console.log(`Input ${i + 1}: type="${type}", placeholder="${placeholder}"`);
      }
    }

    // Final screenshot
    await page.screenshot({ path: 'screenshots/manual-final.png', fullPage: true });

    console.log('✅ Manual test completed');

  } catch (error) {
    console.error('❌ Manual test failed:', error.message);
    await page.screenshot({ path: 'screenshots/manual-error.png', fullPage: true });
  } finally {
    // Keep browser open for manual inspection
    console.log('🔍 Browser kept open for manual inspection...');
    console.log('Press Ctrl+C to close when done.');

    // Wait indefinitely
    await new Promise(() => {});
  }
}

// Create screenshots directory if it doesn't exist
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

manualLexicalTest();