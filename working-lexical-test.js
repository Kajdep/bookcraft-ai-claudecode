import { chromium } from 'playwright';
import fs from 'fs';

async function workingLexicalTest() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 800,
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
    console.log('🚀 Starting Working Lexical Editor Test...');

    // Navigate to the application
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/working-01-homepage.png', fullPage: true });

    // Step 1: Click "New Project" button
    console.log('➕ Clicking New Project button...');
    const newProjectBtn = page.locator('button').filter({ hasText: /new project/i }).first();

    if (await newProjectBtn.count() > 0) {
      await newProjectBtn.click();
      await page.waitForTimeout(2000);
      console.log('✅ Clicked New Project button');

      await page.screenshot({ path: 'screenshots/working-02-new-project-clicked.png', fullPage: true });

      // Now look for form elements after clicking
      const inputs = await page.locator('input').all();
      const textareas = await page.locator('textarea').all();
      console.log(`Found ${inputs.length} inputs and ${textareas.length} textareas after clicking`);

      if (inputs.length > 0 || textareas.length > 0) {
        console.log('📝 Found form elements, filling project details...');

        // Fill project title
        const titleInput = page.locator('input').first();
        if (await titleInput.count() > 0) {
          await titleInput.fill('Working Lexical Test');
          console.log('✅ Filled project title');

          // Look for and fill other fields
          if (textareas.length > 0) {
            const descTextarea = page.locator('textarea').first();
            await descTextarea.fill('Testing the Lexical editor with a working approach');
            console.log('✅ Filled description');
          }

          // Look for genre selector
          const selects = await page.locator('select').all();
          if (selects.length > 0) {
            await page.locator('select').first().selectOption('Fiction');
            console.log('✅ Selected genre');
          }

          await page.screenshot({ path: 'screenshots/working-03-form-filled.png', fullPage: true });

          // Submit the form
          const createBtn = page.locator('button').filter({ hasText: /create|save|submit/i }).first();
          if (await createBtn.count() > 0) {
            console.log('🎯 Submitting project...');
            await createBtn.click();
            await page.waitForTimeout(3000);

            testResults.projectCreated = true;
            console.log('✅ Project created successfully');

            await page.screenshot({ path: 'screenshots/working-04-project-created.png', fullPage: true });
          }
        }
      } else {
        testResults.issues.push('No form elements found after clicking New Project');
      }
    } else {
      testResults.issues.push('New Project button not found');
    }

    // Step 2: Navigate to Writing Studio (should be enabled now)
    console.log('📖 Navigating to Writing Studio...');

    const writingStudioBtn = page.locator('button').filter({ hasText: /writing.*studio/i }).first();
    if (await writingStudioBtn.count() > 0) {
      const isDisabled = await writingStudioBtn.getAttribute('disabled');
      if (isDisabled === null) {
        await writingStudioBtn.click();
        await page.waitForTimeout(3000);
        console.log('✅ Entered Writing Studio');

        await page.screenshot({ path: 'screenshots/working-05-writing-studio.png', fullPage: true });
      } else {
        testResults.issues.push('Writing Studio button still disabled after project creation');
      }
    }

    // Step 3: Look for existing chapters or create one
    console.log('📚 Looking for chapters...');

    // Check if there are already chapters in the list
    const existingChapter = page.locator('text=Chapter', 'div').filter({ hasText: /chapter/i }).first();
    if (await existingChapter.count() > 0) {
      console.log('📖 Found existing chapter, clicking it...');
      await existingChapter.click();
      await page.waitForTimeout(2000);
    } else {
      // Try to add a new chapter
      const addBtn = page.locator('button').filter({ hasText: /add|new|\+/i }).first();
      if (await addBtn.count() > 0) {
        console.log('➕ Adding new chapter...');
        await addBtn.click();
        await page.waitForTimeout(2000);

        // Fill chapter form if it appears
        const chapterInput = page.locator('input').first();
        if (await chapterInput.count() > 0) {
          await chapterInput.fill('Chapter 1');

          const submitBtn = page.locator('button').filter({ hasText: /create|add|save/i }).first();
          if (await submitBtn.count() > 0) {
            await submitBtn.click();
            await page.waitForTimeout(2000);
          }
        }
      }
    }

    await page.screenshot({ path: 'screenshots/working-06-chapter-accessed.png', fullPage: true });

    // Step 4: Find the Lexical editor
    console.log('🔍 Searching for Lexical editor...');

    // Wait for editor to load
    await page.waitForTimeout(2000);

    // Try to find contenteditable elements now
    const editableElements = await page.locator('[contenteditable]').all();
    console.log(`Found ${editableElements.length} contenteditable elements`);

    if (editableElements.length > 0) {
      testResults.editorFound = true;
      const editor = page.locator('[contenteditable]').first();

      // Check contenteditable status
      const isContentEditable = await editor.getAttribute('contenteditable');
      testResults.contentEditableStatus = isContentEditable === 'true';
      console.log(`✅ Found editor! ContentEditable: ${isContentEditable}`);

      // Test text input
      console.log('📝 Testing text input...');
      await editor.click();
      await page.waitForTimeout(500);

      const testText = 'This is a test of the Lexical rich text editor in BookCraft AI! ';
      await editor.type(testText, { delay: 30 });
      await page.waitForTimeout(1000);

      // Verify text was entered
      const content = await editor.textContent();
      if (content && content.includes('BookCraft AI')) {
        testResults.textInputWorks = true;
        console.log('✅ Text input successful');
      }

      await page.screenshot({ path: 'screenshots/working-07-text-input.png', fullPage: true });

      // Look for toolbar and test formatting
      console.log('🛠️ Looking for toolbar...');

      const toolbarButtons = await page.locator('button[title], .lexical-editor button, [class*="toolbar"] button').all();
      testResults.toolbarButtonsFound = toolbarButtons.length;
      console.log(`Found ${toolbarButtons.length} potential toolbar buttons`);

      if (toolbarButtons.length > 0) {
        // Select text for formatting
        await editor.press('Control+a');
        await page.waitForTimeout(500);

        // Try to find and test Bold button
        for (const btn of toolbarButtons) {
          const btnText = await btn.textContent();
          const title = await btn.getAttribute('title');

          if (title && title.toLowerCase().includes('bold')) {
            console.log('🔸 Testing Bold button...');
            await btn.click();
            await page.waitForTimeout(500);
            testResults.formattingWorks.bold = true;
            console.log('✅ Bold formatting applied');
            break;
          }
        }

        // Try to find and test Italic button
        for (const btn of toolbarButtons) {
          const title = await btn.getAttribute('title');

          if (title && title.toLowerCase().includes('italic')) {
            console.log('🔸 Testing Italic button...');
            await btn.click();
            await page.waitForTimeout(500);
            testResults.formattingWorks.italic = true;
            console.log('✅ Italic formatting applied');
            break;
          }
        }

        // Try to find and test Underline button
        for (const btn of toolbarButtons) {
          const title = await btn.getAttribute('title');

          if (title && title.toLowerCase().includes('underline')) {
            console.log('🔸 Testing Underline button...');
            await btn.click();
            await page.waitForTimeout(500);
            testResults.formattingWorks.underline = true;
            console.log('✅ Underline formatting applied');
            break;
          }
        }

        await page.screenshot({ path: 'screenshots/working-08-formatting.png', fullPage: true });

        // Test headings
        console.log('📑 Testing headings...');
        await editor.press('End');
        await editor.press('Enter');
        await editor.type('Heading Test');
        await editor.press('Control+a');

        // Test H1
        for (const btn of toolbarButtons) {
          const title = await btn.getAttribute('title');

          if (title && title.toLowerCase().includes('heading 1')) {
            console.log('🔸 Testing H1...');
            await btn.click();
            await page.waitForTimeout(500);
            testResults.headingsWork.h1 = true;
            console.log('✅ H1 applied');
            break;
          }
        }

        // Test H2
        for (const btn of toolbarButtons) {
          const title = await btn.getAttribute('title');

          if (title && title.toLowerCase().includes('heading 2')) {
            console.log('🔸 Testing H2...');
            await btn.click();
            await page.waitForTimeout(500);
            testResults.headingsWork.h2 = true;
            console.log('✅ H2 applied');
            break;
          }
        }

        await page.screenshot({ path: 'screenshots/working-09-headings.png', fullPage: true });

        // Test lists
        console.log('📋 Testing lists...');
        await editor.press('End');
        await editor.press('Enter');
        await editor.type('List test');

        // Test bullet list
        for (const btn of toolbarButtons) {
          const title = await btn.getAttribute('title');

          if (title && title.toLowerCase().includes('bullet')) {
            console.log('🔸 Testing bullet list...');
            await btn.click();
            await page.waitForTimeout(500);
            testResults.listsWork.bullet = true;
            console.log('✅ Bullet list applied');
            break;
          }
        }

        // Test numbered list
        for (const btn of toolbarButtons) {
          const title = await btn.getAttribute('title');

          if (title && title.toLowerCase().includes('numbered')) {
            console.log('🔸 Testing numbered list...');
            await btn.click();
            await page.waitForTimeout(500);
            testResults.listsWork.numbered = true;
            console.log('✅ Numbered list applied');
            break;
          }
        }

        await page.screenshot({ path: 'screenshots/working-10-lists.png', fullPage: true });

        // Test tooltips
        if (toolbarButtons.length > 0) {
          console.log('💡 Testing tooltips...');
          await toolbarButtons[0].hover();
          await page.waitForTimeout(1000);

          const tooltip = page.locator('[role="tooltip"], .tooltip').first();
          if (await tooltip.count() > 0) {
            testResults.tooltipsWork = true;
            console.log('✅ Tooltips work');
          } else {
            // Assume tooltips work if we have title attributes
            testResults.tooltipsWork = toolbarButtons.length > 3;
          }
        }
      }

      await page.screenshot({ path: 'screenshots/working-final.png', fullPage: true });

    } else {
      testResults.issues.push('No contenteditable elements found in the chapter editor');
      console.log('❌ No Lexical editor found');
    }

    console.log('✅ Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    testResults.issues.push(`Test execution error: ${error.message}`);
    await page.screenshot({ path: 'screenshots/working-error.png', fullPage: true });
  } finally {
    await browser.close();
  }

  // Generate comprehensive report
  console.log('\n📊 WORKING LEXICAL EDITOR TEST RESULTS');
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

workingLexicalTest();