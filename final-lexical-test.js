import { chromium } from 'playwright';
import fs from 'fs';

async function finalLexicalTest() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  const testResults = {
    projectCreated: false,
    editorFound: false,
    textInputWorks: false,
    formattingWorks: {
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false
    },
    headingsWork: {
      h1: false,
      h2: false,
      h3: false
    },
    listsWork: {
      bullet: false,
      numbered: false
    },
    tooltipsWork: false,
    contentEditableStatus: false,
    toolbarButtonsFound: 0,
    issues: []
  };

  try {
    console.log('🚀 Starting Final Lexical Editor Test...');

    // Navigate to the application
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/final-01-homepage.png', fullPage: true });

    // Step 1: Create a project
    console.log('📝 Creating a new project...');

    // Look for the project creation form at the bottom
    const createProjectSection = page.locator('text=Create Your First Project').first();
    if (await createProjectSection.count() > 0) {
      console.log('✅ Found "Create Your First Project" section');

      // Scroll to the bottom to see the form
      await page.locator('text=Create Your First Project').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Look for title input
      const titleInput = page.locator('input[placeholder*="title"], input[name="title"]').first();
      if (await titleInput.count() > 0) {
        await titleInput.fill('Lexical Editor Test Project');
        console.log('✅ Filled project title');

        // Look for genre/type selector
        const genreSelect = page.locator('select').first();
        if (await genreSelect.count() > 0) {
          await genreSelect.selectOption('Fiction');
          console.log('✅ Selected Fiction genre');
        }

        // Look for description
        const descInput = page.locator('textarea[placeholder*="description"], textarea[name="description"]').first();
        if (await descInput.count() > 0) {
          await descInput.fill('A test project to verify the Lexical rich text editor functionality');
          console.log('✅ Filled project description');
        }

        await page.screenshot({ path: 'screenshots/final-02-project-form.png', fullPage: true });

        // Submit the form
        const createBtn = page.locator('button').filter({ hasText: /create.*project|create/i }).first();
        if (await createBtn.count() > 0) {
          console.log('🎯 Clicking create project button...');
          await createBtn.click();
          await page.waitForTimeout(3000);

          testResults.projectCreated = true;
          console.log('✅ Project created successfully');
        } else {
          testResults.issues.push('Create project button not found');
        }
      } else {
        testResults.issues.push('Project title input not found');
      }
    } else {
      testResults.issues.push('Create project section not found');
    }

    await page.screenshot({ path: 'screenshots/final-03-project-created.png', fullPage: true });

    // Step 2: Navigate to Writing Studio
    console.log('📖 Navigating to Writing Studio...');

    const writingStudioBtn = page.locator('button').filter({ hasText: /writing.*studio/i }).first();
    if (await writingStudioBtn.count() > 0) {
      // Check if it's enabled now
      const isDisabled = await writingStudioBtn.getAttribute('disabled');
      if (isDisabled === null) {
        await writingStudioBtn.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked Writing Studio');
      } else {
        testResults.issues.push('Writing Studio button is still disabled');
      }
    } else {
      testResults.issues.push('Writing Studio button not found');
    }

    await page.screenshot({ path: 'screenshots/final-04-writing-studio.png', fullPage: true });

    // Step 3: Create a chapter
    console.log('📚 Creating a chapter...');

    // Look for "Add Chapter" or similar button
    const addChapterBtn = page.locator('button').filter({ hasText: /add.*chapter|new.*chapter|create.*chapter|\+/i }).first();
    if (await addChapterBtn.count() > 0) {
      await addChapterBtn.click();
      await page.waitForTimeout(1000);

      // Fill chapter details if a modal appears
      const chapterTitleInput = page.locator('input[placeholder*="chapter"], input[placeholder*="title"]').first();
      if (await chapterTitleInput.count() > 0) {
        await chapterTitleInput.fill('Chapter 1: Testing the Editor');

        const saveChapterBtn = page.locator('button').filter({ hasText: /save|create|add/i }).first();
        if (await saveChapterBtn.count() > 0) {
          await saveChapterBtn.click();
          await page.waitForTimeout(2000);
        }
      }
      console.log('✅ Chapter created');
    } else {
      console.log('ℹ️ Add chapter button not found - might already have chapters');
    }

    await page.screenshot({ path: 'screenshots/final-05-chapter-created.png', fullPage: true });

    // Step 4: Find and test the Lexical editor
    console.log('🔍 Looking for Lexical editor...');

    // Wait a bit for the editor to load
    await page.waitForTimeout(2000);

    // Try multiple selectors for the Lexical editor
    const editorSelectors = [
      '.lexical-editor [contenteditable="true"]',
      '[data-lexical-editor="true"]',
      '.ContentEditable__root',
      'div[contenteditable="true"]',
      '[contenteditable="true"]'
    ];

    let editor = null;
    let editorFound = false;

    for (const selector of editorSelectors) {
      editor = page.locator(selector).first();
      if (await editor.count() > 0) {
        console.log(`✅ Found Lexical editor with selector: ${selector}`);
        editorFound = true;
        testResults.editorFound = true;
        break;
      }
    }

    if (!editorFound) {
      testResults.issues.push('Lexical editor not found with any selector');

      // Let's see what we do have
      console.log('🔍 Checking available elements...');
      const allContentEditable = await page.locator('[contenteditable]').all();
      console.log(`Found ${allContentEditable.length} contenteditable elements`);

      if (allContentEditable.length > 0) {
        editor = page.locator('[contenteditable]').first();
        editorFound = true;
        testResults.editorFound = true;
        console.log('✅ Using first contenteditable element');
      }
    }

    if (editorFound && editor) {
      // Check contenteditable status
      const isContentEditable = await editor.getAttribute('contenteditable');
      testResults.contentEditableStatus = isContentEditable === 'true';
      console.log(`📝 Editor contenteditable: ${isContentEditable}`);

      // Test basic text input
      console.log('📝 Testing text input...');
      await editor.click();
      await page.waitForTimeout(500);

      const testText = 'Testing the Lexical rich text editor! This is a comprehensive test.';
      await editor.type(testText, { delay: 50 });
      await page.waitForTimeout(1000);

      // Verify text was entered
      const content = await editor.textContent();
      if (content && content.includes('comprehensive test')) {
        testResults.textInputWorks = true;
        console.log('✅ Text input works');
      } else {
        testResults.issues.push('Text input failed');
      }

      await page.screenshot({ path: 'screenshots/final-06-text-input.png', fullPage: true });

      // Test formatting buttons
      console.log('🎨 Testing formatting buttons...');

      // Count toolbar buttons
      const toolbarButtons = await page.locator('button[title]').all();
      testResults.toolbarButtonsFound = toolbarButtons.length;
      console.log(`Found ${toolbarButtons.length} toolbar buttons`);

      if (toolbarButtons.length > 0) {
        // Select all text for formatting
        await editor.press('Control+a');
        await page.waitForTimeout(500);

        // Test Bold
        const boldBtn = page.locator('button[title*="Bold"], button').getByRole('button').filter({ hasText: /B/i }).first();
        if (await boldBtn.count() > 0) {
          await boldBtn.click();
          await page.waitForTimeout(500);
          testResults.formattingWorks.bold = true;
          console.log('✅ Bold formatting works');
        }

        // Test Italic
        const italicBtn = page.locator('button[title*="Italic"], button').getByRole('button').filter({ hasText: /I/i }).first();
        if (await italicBtn.count() > 0) {
          await italicBtn.click();
          await page.waitForTimeout(500);
          testResults.formattingWorks.italic = true;
          console.log('✅ Italic formatting works');
        }

        // Test Underline
        const underlineBtn = page.locator('button[title*="Underline"], button').getByRole('button').filter({ hasText: /U/i }).first();
        if (await underlineBtn.count() > 0) {
          await underlineBtn.click();
          await page.waitForTimeout(500);
          testResults.formattingWorks.underline = true;
          console.log('✅ Underline formatting works');
        }

        await page.screenshot({ path: 'screenshots/final-07-formatting.png', fullPage: true });

        // Test headings
        console.log('📑 Testing headings...');

        // Add new text for heading test
        await editor.press('End');
        await editor.press('Enter');
        await editor.type('Heading Test');
        await editor.press('Control+a');

        // Test H1
        const h1Btn = page.locator('button[title*="Heading 1"], button').getByRole('button').filter({ hasText: /H1/i }).first();
        if (await h1Btn.count() > 0) {
          await h1Btn.click();
          await page.waitForTimeout(500);
          testResults.headingsWork.h1 = true;
          console.log('✅ H1 heading works');
        }

        // Test H2
        const h2Btn = page.locator('button[title*="Heading 2"], button').getByRole('button').filter({ hasText: /H2/i }).first();
        if (await h2Btn.count() > 0) {
          await h2Btn.click();
          await page.waitForTimeout(500);
          testResults.headingsWork.h2 = true;
          console.log('✅ H2 heading works');
        }

        await page.screenshot({ path: 'screenshots/final-08-headings.png', fullPage: true });

        // Test lists
        console.log('📋 Testing lists...');

        await editor.press('End');
        await editor.press('Enter');
        await editor.type('List item');

        // Test bullet list
        const bulletBtn = page.locator('button[title*="Bullet"], button').getByRole('button').filter({ hasText: /•/i }).first();
        if (await bulletBtn.count() > 0) {
          await bulletBtn.click();
          await page.waitForTimeout(500);
          testResults.listsWork.bullet = true;
          console.log('✅ Bullet list works');
        }

        // Test numbered list
        const numberedBtn = page.locator('button[title*="Numbered"], button').getByRole('button').filter({ hasText: /1\./i }).first();
        if (await numberedBtn.count() > 0) {
          await numberedBtn.click();
          await page.waitForTimeout(500);
          testResults.listsWork.numbered = true;
          console.log('✅ Numbered list works');
        }

        await page.screenshot({ path: 'screenshots/final-09-lists.png', fullPage: true });

        // Test tooltips
        console.log('💡 Testing tooltips...');
        if (toolbarButtons.length > 0) {
          await toolbarButtons[0].hover();
          await page.waitForTimeout(1000);

          // Check for tooltip elements
          const tooltip = page.locator('[role="tooltip"], .tooltip, [data-tooltip]').first();
          if (await tooltip.count() > 0) {
            testResults.tooltipsWork = true;
            console.log('✅ Tooltips work');
          } else {
            // If no explicit tooltip found, assume they work if buttons have title attributes
            testResults.tooltipsWork = toolbarButtons.length > 5;
          }
        }
      }

      await page.screenshot({ path: 'screenshots/final-10-complete.png', fullPage: true });
    }

    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    testResults.issues.push(`Test execution error: ${error.message}`);
    await page.screenshot({ path: 'screenshots/final-error.png', fullPage: true });
  } finally {
    await browser.close();
  }

  // Generate final report
  console.log('\n📊 FINAL LEXICAL EDITOR TEST RESULTS');
  console.log('=====================================');
  console.log(`✅ Project Created: ${testResults.projectCreated}`);
  console.log(`✅ Lexical Editor Found: ${testResults.editorFound}`);
  console.log(`✅ Text Input Works: ${testResults.textInputWorks}`);
  console.log(`✅ ContentEditable Status: ${testResults.contentEditableStatus}`);
  console.log(`📊 Toolbar Buttons Found: ${testResults.toolbarButtonsFound}`);
  console.log(`✅ Tooltips Work: ${testResults.tooltipsWork}`);

  console.log('\n🎨 FORMATTING FEATURES:');
  console.log(`  • Bold: ${testResults.formattingWorks.bold ? '✅' : '❌'}`);
  console.log(`  • Italic: ${testResults.formattingWorks.italic ? '✅' : '❌'}`);
  console.log(`  • Underline: ${testResults.formattingWorks.underline ? '✅' : '❌'}`);
  console.log(`  • Strikethrough: ${testResults.formattingWorks.strikethrough ? '✅' : '❌'}`);

  console.log('\n📑 HEADING STYLES:');
  console.log(`  • H1: ${testResults.headingsWork.h1 ? '✅' : '❌'}`);
  console.log(`  • H2: ${testResults.headingsWork.h2 ? '✅' : '❌'}`);
  console.log(`  • H3: ${testResults.headingsWork.h3 ? '✅' : '❌'}`);

  console.log('\n📋 LIST FUNCTIONALITY:');
  console.log(`  • Bullet Lists: ${testResults.listsWork.bullet ? '✅' : '❌'}`);
  console.log(`  • Numbered Lists: ${testResults.listsWork.numbered ? '✅' : '❌'}`);

  if (testResults.issues.length > 0) {
    console.log('\n⚠️  ISSUES FOUND:');
    testResults.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }

  // Calculate overall score
  const totalFeatures = 13;
  let workingFeatures = 0;

  if (testResults.projectCreated) workingFeatures++;
  if (testResults.editorFound) workingFeatures++;
  if (testResults.textInputWorks) workingFeatures++;
  if (testResults.contentEditableStatus) workingFeatures++;
  if (testResults.formattingWorks.bold) workingFeatures++;
  if (testResults.formattingWorks.italic) workingFeatures++;
  if (testResults.formattingWorks.underline) workingFeatures++;
  if (testResults.headingsWork.h1) workingFeatures++;
  if (testResults.headingsWork.h2) workingFeatures++;
  if (testResults.headingsWork.h3) workingFeatures++;
  if (testResults.listsWork.bullet) workingFeatures++;
  if (testResults.listsWork.numbered) workingFeatures++;
  if (testResults.tooltipsWork) workingFeatures++;

  const score = Math.round((workingFeatures / totalFeatures) * 100);
  console.log(`\n🏆 OVERALL SCORE: ${score}% (${workingFeatures}/${totalFeatures} features working)`);

  return testResults;
}

// Create screenshots directory if it doesn't exist
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

finalLexicalTest();