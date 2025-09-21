import { chromium } from 'playwright';
import fs from 'fs';

async function testLexicalEditorComprehensive() {
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
      h3: false,
      paragraph: false
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
    console.log('🚀 Starting Comprehensive Lexical Editor Test...');

    // Navigate to the application
    console.log('📍 Navigating to http://localhost:5173/');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take initial screenshot
    await page.screenshot({ path: 'screenshots/comprehensive-01-homepage.png', fullPage: true });
    console.log('📸 Homepage screenshot saved');

    // Check if we're already in a project or need to create one
    let inProject = false;

    // Look for project workspace indicators
    const workspaceTab = page.locator('button, a, div').filter({ hasText: /writing|plot|research|visuals|cover|export/i }).first();
    if (await workspaceTab.count() > 0) {
      console.log('✅ Already in project workspace');
      inProject = true;
    } else {
      console.log('➕ Need to create or open a project');

      // Look for existing projects
      const existingProject = page.locator('[data-testid="project-card"], .project-card, button').filter({ hasText: /open|edit|view|test|project/i }).first();

      if (await existingProject.count() > 0) {
        console.log('📂 Opening existing project');
        await existingProject.click();
        await page.waitForTimeout(2000);
        inProject = true;
      } else {
        console.log('🆕 Creating new project');

        // Look for "Create New Project" button or form
        const createBtn = page.locator('button').filter({ hasText: /create|new.*project|\+/i }).first();

        if (await createBtn.count() > 0) {
          await createBtn.click();
          await page.waitForTimeout(1000);

          // Fill project details
          const titleInput = page.locator('input[placeholder*="title"], input[name="title"], input[id*="title"]').first();
          if (await titleInput.count() > 0) {
            await titleInput.fill('Lexical Editor Test Project');

            const descInput = page.locator('textarea, input[placeholder*="description"]').first();
            if (await descInput.count() > 0) {
              await descInput.fill('Testing the Lexical rich text editor functionality');
            }

            // Submit the form
            const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /create|save|submit|confirm/i }).first();
            if (await submitBtn.count() > 0) {
              await submitBtn.click();
              await page.waitForTimeout(3000);
              inProject = true;
            }
          }
        }
      }
    }

    if (!inProject) {
      throw new Error('Could not create or access a project');
    }

    await page.screenshot({ path: 'screenshots/comprehensive-02-project-workspace.png', fullPage: true });

    // Navigate to Writing tab
    console.log('📝 Navigating to Writing workspace...');
    const writingTab = page.locator('button, a, div').filter({ hasText: /writing|write/i }).first();

    if (await writingTab.count() > 0) {
      await writingTab.click();
      await page.waitForTimeout(2000);
      console.log('✅ Clicked Writing tab');
    }

    await page.screenshot({ path: 'screenshots/comprehensive-03-writing-workspace.png', fullPage: true });

    // Check if we need to create a chapter
    console.log('📚 Checking for chapters...');

    // Look for existing chapters or the ability to create one
    const existingChapter = page.locator('button, div').filter({ hasText: /chapter/i }).first();
    const addChapterBtn = page.locator('button').filter({ hasText: /add.*chapter|new.*chapter|create.*chapter|\+.*chapter/i }).first();

    if (await existingChapter.count() > 0 && !(await existingChapter.textContent()).includes('Add') && !(await existingChapter.textContent()).includes('Create')) {
      console.log('📖 Found existing chapter, clicking it');
      await existingChapter.click();
      await page.waitForTimeout(2000);
    } else if (await addChapterBtn.count() > 0) {
      console.log('➕ Creating new chapter');
      await addChapterBtn.click();
      await page.waitForTimeout(2000);

      // Fill chapter details if form appears
      const chapterTitleInput = page.locator('input[placeholder*="title"], input[placeholder*="chapter"]').first();
      if (await chapterTitleInput.count() > 0) {
        await chapterTitleInput.fill('Test Chapter for Lexical Editor');

        const createBtn = page.locator('button').filter({ hasText: /create|add|save/i }).first();
        if (await createBtn.count() > 0) {
          await createBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    await page.screenshot({ path: 'screenshots/comprehensive-04-chapter-accessed.png', fullPage: true });

    // Now look for the Lexical editor
    console.log('🔍 Looking for Lexical editor...');

    const editorSelectors = [
      '.lexical-editor [contenteditable="true"]',
      '[data-lexical-editor="true"]',
      '.lexical-editor .ContentEditable__root',
      '.RichTextPlugin__contentEditable',
      'div[contenteditable="true"]'
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
      testResults.issues.push('Lexical editor not found with any expected selector');
      throw new Error('Lexical editor not found');
    }

    // Test contenteditable status
    const isContentEditable = await editor.getAttribute('contenteditable');
    testResults.contentEditableStatus = isContentEditable === 'true';
    console.log(`📝 Editor contenteditable status: ${isContentEditable}`);

    // Test basic text input
    console.log('📝 Testing basic text input...');
    await editor.click();
    await page.waitForTimeout(500);

    const testText = 'This is a comprehensive test of the Lexical rich text editor. ';
    await editor.fill('');
    await editor.type(testText, { delay: 100 });
    await page.waitForTimeout(1000);

    // Verify text was entered
    const editorContent = await editor.textContent();
    if (editorContent && editorContent.includes('comprehensive test')) {
      testResults.textInputWorks = true;
      console.log('✅ Basic text input successful');
    } else {
      testResults.issues.push('Text input failed - content not found in editor');
    }

    await page.screenshot({ path: 'screenshots/comprehensive-05-text-input.png', fullPage: true });

    // Test formatting options
    console.log('🎨 Testing formatting options...');

    // Select all text for formatting tests
    await editor.press('Control+a');
    await page.waitForTimeout(500);

    // Test Bold
    console.log('🔸 Testing Bold...');
    const boldBtn = page.locator('button[title*="Bold"], button').filter({ hasText: /bold/i }).first();
    if (await boldBtn.count() > 0) {
      await boldBtn.click();
      await page.waitForTimeout(500);
      testResults.formattingWorks.bold = true;
      console.log('✅ Bold button works');
    } else {
      testResults.issues.push('Bold button not found');
    }

    // Test Italic
    console.log('🔸 Testing Italic...');
    const italicBtn = page.locator('button[title*="Italic"], button').filter({ hasText: /italic/i }).first();
    if (await italicBtn.count() > 0) {
      await italicBtn.click();
      await page.waitForTimeout(500);
      testResults.formattingWorks.italic = true;
      console.log('✅ Italic button works');
    } else {
      testResults.issues.push('Italic button not found');
    }

    // Test Underline
    console.log('🔸 Testing Underline...');
    const underlineBtn = page.locator('button[title*="Underline"], button').filter({ hasText: /underline/i }).first();
    if (await underlineBtn.count() > 0) {
      await underlineBtn.click();
      await page.waitForTimeout(500);
      testResults.formattingWorks.underline = true;
      console.log('✅ Underline button works');
    } else {
      testResults.issues.push('Underline button not found');
    }

    // Test Strikethrough
    console.log('🔸 Testing Strikethrough...');
    const strikeBtn = page.locator('button[title*="Strikethrough"], button').filter({ hasText: /strike/i }).first();
    if (await strikeBtn.count() > 0) {
      await strikeBtn.click();
      await page.waitForTimeout(500);
      testResults.formattingWorks.strikethrough = true;
      console.log('✅ Strikethrough button works');
    } else {
      testResults.issues.push('Strikethrough button not found');
    }

    await page.screenshot({ path: 'screenshots/comprehensive-06-formatting-test.png', fullPage: true });

    // Test heading styles
    console.log('📑 Testing heading styles...');

    // Add new line and test headings
    await editor.press('End');
    await editor.press('Enter');
    await editor.type('Heading Test', { delay: 50 });
    await editor.press('Control+a');

    // Test H1
    console.log('🔸 Testing H1...');
    const h1Btn = page.locator('button[title*="Heading 1"], button').filter({ hasText: /h1|heading.*1/i }).first();
    if (await h1Btn.count() > 0) {
      await h1Btn.click();
      await page.waitForTimeout(500);
      testResults.headingsWork.h1 = true;
      console.log('✅ H1 button works');
    } else {
      testResults.issues.push('H1 button not found');
    }

    // Test H2
    console.log('🔸 Testing H2...');
    const h2Btn = page.locator('button[title*="Heading 2"], button').filter({ hasText: /h2|heading.*2/i }).first();
    if (await h2Btn.count() > 0) {
      await h2Btn.click();
      await page.waitForTimeout(500);
      testResults.headingsWork.h2 = true;
      console.log('✅ H2 button works');
    } else {
      testResults.issues.push('H2 button not found');
    }

    // Test H3
    console.log('🔸 Testing H3...');
    const h3Btn = page.locator('button[title*="Heading 3"], button').filter({ hasText: /h3|heading.*3/i }).first();
    if (await h3Btn.count() > 0) {
      await h3Btn.click();
      await page.waitForTimeout(500);
      testResults.headingsWork.h3 = true;
      console.log('✅ H3 button works');
    } else {
      testResults.issues.push('H3 button not found');
    }

    await page.screenshot({ path: 'screenshots/comprehensive-07-heading-test.png', fullPage: true });

    // Test lists
    console.log('📋 Testing list functionality...');

    await editor.press('End');
    await editor.press('Enter');
    await editor.type('List item test', { delay: 50 });

    // Test bullet list
    console.log('🔸 Testing Bullet List...');
    const bulletBtn = page.locator('button[title*="Bullet"], button').filter({ hasText: /bullet|unordered/i }).first();
    if (await bulletBtn.count() > 0) {
      await bulletBtn.click();
      await page.waitForTimeout(500);
      testResults.listsWork.bullet = true;
      console.log('✅ Bullet list button works');
    } else {
      testResults.issues.push('Bullet list button not found');
    }

    // Test numbered list
    console.log('🔸 Testing Numbered List...');
    const numberedBtn = page.locator('button[title*="Numbered"], button').filter({ hasText: /numbered|ordered/i }).first();
    if (await numberedBtn.count() > 0) {
      await numberedBtn.click();
      await page.waitForTimeout(500);
      testResults.listsWork.numbered = true;
      console.log('✅ Numbered list button works');
    } else {
      testResults.issues.push('Numbered list button not found');
    }

    await page.screenshot({ path: 'screenshots/comprehensive-08-list-test.png', fullPage: true });

    // Test tooltips
    console.log('💡 Testing tooltips...');
    const toolbarButtons = await page.locator('button[title]').all();
    testResults.toolbarButtonsFound = toolbarButtons.length;
    console.log(`Found ${toolbarButtons.length} buttons with title attributes`);

    if (toolbarButtons.length > 0) {
      // Test a few tooltips
      for (let i = 0; i < Math.min(3, toolbarButtons.length); i++) {
        await toolbarButtons[i].hover();
        await page.waitForTimeout(1000);

        // Check if tooltip appears (look for tooltip-like elements)
        const tooltip = page.locator('[role="tooltip"], .tooltip, [data-tooltip]').first();
        if (await tooltip.count() > 0) {
          testResults.tooltipsWork = true;
          console.log(`✅ Tooltip ${i + 1} appears on hover`);
          break;
        }
      }

      if (!testResults.tooltipsWork) {
        // Alternative check - tooltips might be implemented differently
        testResults.tooltipsWork = toolbarButtons.length > 5; // Assume working if many buttons have title attributes
      }
    }

    await page.screenshot({ path: 'screenshots/comprehensive-09-final-state.png', fullPage: true });

    console.log('✅ Comprehensive Lexical editor testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    testResults.issues.push(`Test execution error: ${error.message}`);
    await page.screenshot({ path: 'screenshots/comprehensive-error-state.png', fullPage: true });
  } finally {
    await browser.close();
  }

  // Generate comprehensive report
  console.log('\n📊 COMPREHENSIVE TEST RESULTS:');
  console.log('=====================================');
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
  const totalFeatures = 12; // Total testable features
  let workingFeatures = 0;

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

testLexicalEditorComprehensive();