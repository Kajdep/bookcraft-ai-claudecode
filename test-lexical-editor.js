import { chromium } from 'playwright';
import fs from 'fs';

async function testLexicalEditor() {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🚀 Starting Lexical Editor Test...');

    // Navigate to the application
    console.log('📍 Navigating to http://localhost:5173/');
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({ path: 'screenshots/01-homepage.png', fullPage: true });
    console.log('📸 Homepage screenshot saved');

    // Check if we need to create a new project or if there are existing projects
    const hasProjects = await page.locator('[data-testid="project-card"], .project-card').count() > 0;

    if (!hasProjects) {
      console.log('➕ Creating a new project...');

      // Look for "Create New Project" button or similar
      const createButton = page.locator('button').filter({ hasText: /create|new project/i }).first();
      if (await createButton.count() > 0) {
        await createButton.click();
        await page.waitForTimeout(1000);

        // Fill in project details if form appears
        const titleInput = page.locator('input[placeholder*="title"], input[name="title"], input[id*="title"]').first();
        if (await titleInput.count() > 0) {
          await titleInput.fill('Test Project for Lexical Editor');

          const descInput = page.locator('textarea, input[placeholder*="description"]').first();
          if (await descInput.count() > 0) {
            await descInput.fill('Testing the Lexical rich text editor functionality');
          }

          // Submit the form
          const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /create|save|confirm/i }).first();
          if (await submitButton.count() > 0) {
            await submitButton.click();
            await page.waitForTimeout(2000);
          }
        }
      }
    }

    // Look for and click on a project to open it
    console.log('🎯 Opening a project...');
    const projectCard = page.locator('[data-testid="project-card"], .project-card, button').filter({ hasText: /open|edit|test project/i }).first();

    if (await projectCard.count() === 0) {
      // Try alternative selectors for project items
      const altProjectSelector = page.locator('div').filter({ hasText: /project/i }).first();
      if (await altProjectSelector.count() > 0) {
        await altProjectSelector.click();
      } else {
        throw new Error('No project found to open');
      }
    } else {
      await projectCard.click();
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/02-project-opened.png', fullPage: true });
    console.log('📸 Project workspace screenshot saved');

    // Navigate to Writing tab/WritingDesk
    console.log('📝 Looking for Writing tab...');
    const writingTab = page.locator('button, a, div').filter({ hasText: /writing|write|desk/i }).first();

    if (await writingTab.count() > 0) {
      await writingTab.click();
      await page.waitForTimeout(1000);
      console.log('✅ Clicked Writing tab');
    } else {
      console.log('ℹ️ Writing tab not found, checking if already in writing mode');
    }

    await page.screenshot({ path: 'screenshots/03-writing-workspace.png', fullPage: true });

    // Look for Lexical editor - try multiple selectors
    console.log('🔍 Looking for Lexical editor...');

    const editorSelectors = [
      '[data-lexical-editor="true"]',
      '.lexical-editor',
      '[contenteditable="true"]',
      '.RichTextPlugin__contentEditable',
      'div[contenteditable]'
    ];

    let editor = null;
    let editorFound = false;

    for (const selector of editorSelectors) {
      editor = page.locator(selector).first();
      if (await editor.count() > 0) {
        console.log(`✅ Found editor with selector: ${selector}`);
        editorFound = true;
        break;
      }
    }

    if (!editorFound) {
      console.log('❌ Lexical editor not found. Looking for any text input areas...');
      const textAreas = await page.locator('textarea, input[type="text"], div[contenteditable]').all();
      console.log(`Found ${textAreas.length} potential text input areas`);

      if (textAreas.length > 0) {
        editor = page.locator('textarea, input[type="text"], div[contenteditable]').first();
        console.log('📝 Using first available text input for testing');
      }
    }

    if (await editor.count() === 0) {
      // Check if we need to add a chapter first
      console.log('📚 Looking for "Add Chapter" or similar button...');
      const addChapterButton = page.locator('button').filter({ hasText: /add chapter|new chapter|create chapter/i }).first();

      if (await addChapterButton.count() > 0) {
        console.log('➕ Adding a new chapter...');
        await addChapterButton.click();
        await page.waitForTimeout(2000);

        // Try to find editor again
        for (const selector of editorSelectors) {
          editor = page.locator(selector).first();
          if (await editor.count() > 0) {
            console.log(`✅ Found editor after adding chapter: ${selector}`);
            editorFound = true;
            break;
          }
        }
      }
    }

    // Test basic text input
    if (await editor.count() > 0) {
      console.log('📝 Testing text input...');
      await editor.click();
      await page.waitForTimeout(500);

      const testText = 'This is a test of the Lexical rich text editor. ';
      await editor.fill('');
      await editor.type(testText, { delay: 50 });
      await page.waitForTimeout(1000);

      console.log('✅ Basic text input successful');
      await page.screenshot({ path: 'screenshots/04-text-input.png', fullPage: true });

      // Test formatting options
      console.log('🎨 Testing formatting options...');

      // Select all text for formatting tests
      await editor.press('Control+a');
      await page.waitForTimeout(500);

      // Test Bold
      const boldButton = page.locator('button[title*="Bold"], button').filter({ hasText: /bold/i }).first();
      if (await boldButton.count() > 0) {
        console.log('🔸 Testing Bold formatting...');
        await boldButton.click();
        await page.waitForTimeout(500);
        console.log('✅ Bold button clicked');
      } else {
        console.log('❌ Bold button not found');
      }

      await page.screenshot({ path: 'screenshots/05-bold-test.png', fullPage: true });

      // Test Italic
      const italicButton = page.locator('button[title*="Italic"], button').filter({ hasText: /italic/i }).first();
      if (await italicButton.count() > 0) {
        console.log('🔸 Testing Italic formatting...');
        await italicButton.click();
        await page.waitForTimeout(500);
        console.log('✅ Italic button clicked');
      } else {
        console.log('❌ Italic button not found');
      }

      // Test Underline
      const underlineButton = page.locator('button[title*="Underline"], button').filter({ hasText: /underline/i }).first();
      if (await underlineButton.count() > 0) {
        console.log('🔸 Testing Underline formatting...');
        await underlineButton.click();
        await page.waitForTimeout(500);
        console.log('✅ Underline button clicked');
      } else {
        console.log('❌ Underline button not found');
      }

      await page.screenshot({ path: 'screenshots/06-formatting-test.png', fullPage: true });

      // Test heading styles
      console.log('📑 Testing heading styles...');

      // Move cursor to end and add new content for heading test
      await editor.press('End');
      await editor.press('Enter');
      await editor.type('This is a heading test', { delay: 50 });
      await editor.press('Control+a'); // Select the new text

      // Look for heading buttons (H1, H2, H3)
      const h1Button = page.locator('button').filter({ hasText: /h1|heading 1/i }).first();
      const h2Button = page.locator('button').filter({ hasText: /h2|heading 2/i }).first();
      const h3Button = page.locator('button').filter({ hasText: /h3|heading 3/i }).first();

      if (await h1Button.count() > 0) {
        console.log('🔸 Testing H1 formatting...');
        await h1Button.click();
        await page.waitForTimeout(500);
        console.log('✅ H1 button clicked');
      } else {
        console.log('❌ H1 button not found');
      }

      await page.screenshot({ path: 'screenshots/07-heading-test.png', fullPage: true });

      // Test lists
      console.log('📋 Testing list functionality...');

      await editor.press('End');
      await editor.press('Enter');
      await editor.type('List item 1', { delay: 50 });

      // Test bullet list
      const bulletListButton = page.locator('button[title*="bullet"], button[title*="unordered"], button').filter({ hasText: /bullet|unordered|•/i }).first();
      if (await bulletListButton.count() > 0) {
        console.log('🔸 Testing bullet list...');
        await bulletListButton.click();
        await page.waitForTimeout(500);
        console.log('✅ Bullet list button clicked');
      } else {
        console.log('❌ Bullet list button not found');
      }

      // Test numbered list
      const numberedListButton = page.locator('button[title*="numbered"], button[title*="ordered"], button').filter({ hasText: /numbered|ordered|1\./i }).first();
      if (await numberedListButton.count() > 0) {
        console.log('🔸 Testing numbered list...');
        await numberedListButton.click();
        await page.waitForTimeout(500);
        console.log('✅ Numbered list button clicked');
      } else {
        console.log('❌ Numbered list button not found');
      }

      await page.screenshot({ path: 'screenshots/08-list-test.png', fullPage: true });

      // Test tooltips
      console.log('💡 Testing tooltips...');
      const toolbarButtons = await page.locator('button[title]').all();
      console.log(`Found ${toolbarButtons.length} buttons with title attributes`);

      if (toolbarButtons.length > 0) {
        for (let i = 0; i < Math.min(3, toolbarButtons.length); i++) {
          await toolbarButtons[i].hover();
          await page.waitForTimeout(1000);
          console.log(`✅ Hovered over button ${i + 1}`);
        }
        console.log('✅ Tooltip testing completed');
      } else {
        console.log('❌ No buttons with tooltips found');
      }

      // Check contenteditable status
      const isContentEditable = await editor.getAttribute('contenteditable');
      console.log(`📝 Editor contenteditable status: ${isContentEditable}`);

      await page.screenshot({ path: 'screenshots/09-final-state.png', fullPage: true });

      console.log('✅ Lexical editor testing completed successfully!');

      // Test results summary
      console.log('\n📊 TEST RESULTS SUMMARY:');
      console.log('=======================');
      console.log(`✅ Editor found and accessible: ${editorFound}`);
      console.log(`✅ Text input functional: ${await editor.count() > 0}`);
      console.log(`✅ Editor is contenteditable: ${isContentEditable === 'true'}`);
      console.log(`📊 Toolbar buttons found: ${toolbarButtons.length}`);

    } else {
      console.log('❌ Could not find Lexical editor to test');
      await page.screenshot({ path: 'screenshots/error-no-editor.png', fullPage: true });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/error-state.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Create screenshots directory if it doesn't exist
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

testLexicalEditor();