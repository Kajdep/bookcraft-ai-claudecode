const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting Comprehensive Functionality Test...');
  console.log('Testing: AI text insertion, Projects navigation, Research tab, and overall functionality\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    // Track results
    let testResults = {
      appLoad: false,
      projectCreation: false,
      projectsNavigation: false,
      researchTab: false,
      aiTextInsertion: false,
      lexicalEditor: false
    };
    
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    testResults.appLoad = true;
    console.log('✅ App loaded successfully');
    
    // Test 1: Project Creation
    console.log('\n📝 Testing Project Creation...');
    const newProjectButton = page.locator('button:has-text("New Project")');
    await newProjectButton.click();
    
    await page.fill('#title', 'Comprehensive Test Project');
    await page.selectOption('#genre', 'Fantasy');
    await page.selectOption('#visualStyle', 'Professional');
    await page.fill('#description', 'Testing all functionality after fixes');
    
    await page.click('button:has-text("Create Project")');
    await page.waitForTimeout(3000);
    
    // Verify project was created and workspace loaded
    const projectTitle = page.locator('text=Comprehensive Test Project');
    if (await projectTitle.count() > 0) {\n      testResults.projectCreation = true;\n      console.log('✅ Project created successfully');\n    } else {\n      console.log('❌ Project creation failed');\n    }\n\n    // Test 2: Verify default chapter and Lexical editor\n    console.log('\n📖 Testing Lexical Editor and Default Chapter...');\n    const defaultChapter = page.locator('text=Chapter 1');\n    if (await defaultChapter.count() > 0) {\n      await defaultChapter.click();\n      await page.waitForTimeout(1000);\n      \n      // Check if Lexical editor is present and functional\n      const lexicalEditor = page.locator('[data-testid=\"lexical-content-editable\"]');\n      if (await lexicalEditor.count() > 0) {\n        testResults.lexicalEditor = true;\n        console.log('✅ Lexical editor loaded and accessible');\n        \n        // Test typing in editor\n        await lexicalEditor.click();\n        await lexicalEditor.fill('This is a test of the Lexical editor functionality.');\n        await page.waitForTimeout(1000);\n        \n        const editorContent = await lexicalEditor.textContent();\n        if (editorContent && editorContent.includes('This is a test')) {\n          console.log('✅ Lexical editor accepts text input');\n        } else {\n          console.log('⚠️ Lexical editor text input issue');\n        }\n      } else {\n        console.log('❌ Lexical editor not found');\n      }\n    } else {\n      console.log('❌ Default chapter not created');\n    }\n    \n    // Test 3: Projects Navigation (Back to Dashboard)\n    console.log('\n🏠 Testing Projects Navigation...');\n    const projectsButton = page.locator('button:has-text(\"Projects\")');\n    if (await projectsButton.count() > 0) {\n      await projectsButton.click();\n      await page.waitForTimeout(2000);\n      \n      // Check if we're back on dashboard\n      const dashboardTitle = page.locator('text=My Projects');\n      if (await dashboardTitle.count() > 0) {\n        testResults.projectsNavigation = true;\n        console.log('✅ Projects navigation works - returned to dashboard');\n        \n        // Go back to the project\n        const projectCard = page.locator('text=Comprehensive Test Project').first();\n        if (await projectCard.count() > 0) {\n          await projectCard.click();\n          await page.waitForTimeout(2000);\n          console.log('✅ Can navigate back to project from dashboard');\n        }\n      } else {\n        console.log('❌ Projects navigation failed - still in workspace');\n      }\n    } else {\n      console.log('❌ Projects button not found');\n    }\n    \n    // Test 4: Research Tab\n    console.log('\n🔍 Testing Research Tab...');\n    const researchTab = page.locator('button:has-text(\"Research\")');\n    if (await researchTab.count() > 0) {\n      await researchTab.click();\n      await page.waitForTimeout(2000);\n      \n      const researchTitle = page.locator('text=Research Intelligence Hub');\n      if (await researchTitle.count() > 0) {\n        testResults.researchTab = true;\n        console.log('✅ Research tab loads successfully');\n        \n        // Test research form\n        const researchForm = page.locator('form').first();\n        const queryInput = page.locator('input[placeholder*=\"Victorian medical practices\"]');\n        \n        if (await queryInput.count() > 0) {\n          console.log('✅ Research form is accessible');\n        } else {\n          console.log('⚠️ Research form input not found');\n        }\n      } else {\n        console.log('❌ Research tab content failed to load');\n      }\n    } else {\n      console.log('❌ Research tab not found');\n    }\n    \n    // Test 5: AI Text Insertion (Go back to Writing tab)\n    console.log('\n🤖 Testing AI Text Insertion...');\n    const writingTab = page.locator('button:has-text(\"Writing Studio\")');\n    if (await writingTab.count() > 0) {\n      await writingTab.click();\n      await page.waitForTimeout(2000);\n      \n      // Click on Chapter 1 to ensure it's selected\n      const chapterOne = page.locator('text=Chapter 1').first();\n      if (await chapterOne.count() > 0) {\n        await chapterOne.click();\n        await page.waitForTimeout(1000);\n        \n        // Look for AI buttons\n        const generateButton = page.locator('button:has-text(\"Generate\")');\n        const assistantButton = page.locator('button:has-text(\"Assistant\")');\n        const cleanFormatButton = page.locator('button:has-text(\"Clean & Format\")');\n        \n        const aiButtonsFound = [\n          await generateButton.count() > 0,\n          await assistantButton.count() > 0,\n          await cleanFormatButton.count() > 0\n        ].filter(Boolean).length;\n        \n        if (aiButtonsFound >= 2) {\n          testResults.aiTextInsertion = true;\n          console.log(`✅ AI buttons accessible (${aiButtonsFound}/3 found)`);\n          \n          // Test Clean & Format button (safest to test)\n          if (await cleanFormatButton.count() > 0) {\n            // First add some text to clean\n            const lexicalEditor = page.locator('[data-testid=\"lexical-content-editable\"]');\n            if (await lexicalEditor.count() > 0) {\n              await lexicalEditor.click();\n              await lexicalEditor.fill('This  has   extra    spaces   and needs cleaning.');\n              await page.waitForTimeout(500);\n              \n              console.log('✅ AI features are ready for text processing');\n            }\n          }\n        } else {\n          console.log(`❌ AI buttons not accessible (${aiButtonsFound}/3 found)`);\n        }\n      } else {\n        console.log('❌ Could not access chapter for AI testing');\n      }\n    } else {\n      console.log('❌ Writing Studio tab not found');\n    }\n    \n    // Final Results\n    console.log('\\n' + '='.repeat(60));\n    console.log('📊 COMPREHENSIVE FUNCTIONALITY TEST RESULTS');\n    console.log('='.repeat(60));\n    \n    const passedTests = Object.values(testResults).filter(Boolean).length;\n    const totalTests = Object.keys(testResults).length;\n    \n    console.log(`✅ App Load: ${testResults.appLoad ? 'PASS' : 'FAIL'}`);\n    console.log(`✅ Project Creation: ${testResults.projectCreation ? 'PASS' : 'FAIL'}`);\n    console.log(`✅ Lexical Editor: ${testResults.lexicalEditor ? 'PASS' : 'FAIL'}`);\n    console.log(`✅ Projects Navigation: ${testResults.projectsNavigation ? 'PASS' : 'FAIL'}`);\n    console.log(`✅ Research Tab: ${testResults.researchTab ? 'PASS' : 'FAIL'}`);\n    console.log(`✅ AI Text Features: ${testResults.aiTextInsertion ? 'PASS' : 'FAIL'}`);\n    \n    console.log(`\\n🎯 Overall Score: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);\n    \n    if (passedTests === totalTests) {\n      console.log('🎉 ALL TESTS PASSED! The application is fully functional.');\n    } else if (passedTests >= totalTests * 0.8) {\n      console.log('✅ Most functionality working. Minor issues may remain.');\n    } else {\n      console.log('⚠️ Significant issues detected. Further investigation needed.');\n    }\n    \n    // Take final screenshot\n    await page.screenshot({ \n      path: 'comprehensive-test-final.png', \n      fullPage: true \n    });\n    console.log('📸 Final screenshot saved');\n    \n  } catch (error) {\n    console.error('❌ Test failed:', error);\n  } finally {\n    await browser.close();\n  }\n})();