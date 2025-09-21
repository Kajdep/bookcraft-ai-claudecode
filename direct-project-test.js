import { chromium } from 'playwright';
import fs from 'fs';

async function directProjectTest() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    console.log('🚀 Starting Direct Project Test...');

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Since we already have a project, let's try to click directly on it
    console.log('📂 Looking for existing project...');

    // Look for project cards or links
    const projectElement = page.locator('div, button').filter({ hasText: /working.*lexical|test.*project/i }).first();

    if (await projectElement.count() === 0) {
      // Try more generic selectors
      const projectCards = await page.locator('[class*="project"], [data-testid*="project"]').all();
      console.log(`Found ${projectCards.length} potential project elements`);

      if (projectCards.length > 0) {
        console.log('🎯 Clicking first project...');
        await projectCards[0].click();
        await page.waitForTimeout(3000);
      } else {
        // Try clicking on any clickable element in the project area
        const clickableProject = page.locator('text="Working Lexical Test"').first();
        if (await clickableProject.count() > 0) {
          await clickableProject.click();
          await page.waitForTimeout(3000);
        }
      }
    } else {
      console.log('🎯 Clicking on project...');
      await projectElement.click();
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: 'screenshots/direct-01-project-clicked.png', fullPage: true });

    // Now check if we're in the project workspace
    const workspaceIndicators = await page.locator('text="Writing", text="Plot", text="Research"').all();
    console.log(`Found ${workspaceIndicators.length} workspace indicators`);

    if (workspaceIndicators.length > 0) {
      console.log('✅ Successfully entered project workspace!');

      // Look for Writing tab
      const writingTab = page.locator('button, a').filter({ hasText: /writing/i }).first();
      if (await writingTab.count() > 0) {
        const isEnabled = await writingTab.getAttribute('disabled') === null;
        if (isEnabled) {
          console.log('📝 Clicking Writing tab...');
          await writingTab.click();
          await page.waitForTimeout(2000);

          await page.screenshot({ path: 'screenshots/direct-02-writing-tab.png', fullPage: true });

          // Now look for the Lexical editor
          console.log('🔍 Looking for Lexical editor...');
          await page.waitForTimeout(2000);

          const contentEditables = await page.locator('[contenteditable]').all();
          console.log(`Found ${contentEditables.length} contenteditable elements`);

          if (contentEditables.length > 0) {
            console.log('✅ Found Lexical editor!');

            const editor = page.locator('[contenteditable]').first();

            // Test basic functionality
            await editor.click();
            await editor.type('SUCCESS! The Lexical editor is working!');

            await page.screenshot({ path: 'screenshots/direct-03-editor-working.png', fullPage: true });

            // Look for toolbar
            const toolbar = page.locator('.lexical-editor, [class*="toolbar"]').first();
            if (await toolbar.count() > 0) {
              console.log('🛠️ Found toolbar!');

              const buttons = await page.locator('button[title]').all();
              console.log(`Found ${buttons.length} toolbar buttons`);

              await page.screenshot({ path: 'screenshots/direct-04-toolbar-found.png', fullPage: true });
            }

            console.log('🎉 LEXICAL EDITOR TEST SUCCESSFUL!');
            return {
              success: true,
              editorFound: true,
              toolbarFound: buttons.length > 0
            };
          } else {
            console.log('❌ No contenteditable elements found');
          }
        } else {
          console.log('❌ Writing tab is disabled');
        }
      } else {
        console.log('❌ Writing tab not found');
      }
    } else {
      console.log('❌ Not in project workspace');
    }

    await page.screenshot({ path: 'screenshots/direct-final.png', fullPage: true });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/direct-error.png', fullPage: true });
  } finally {
    // Keep browser open for inspection
    console.log('🔍 Keeping browser open for inspection...');
    console.log('Press Ctrl+C to close');
    await new Promise(() => {});
  }
}

if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

directProjectTest();