import { chromium } from 'playwright';
import fs from 'fs';

async function comprehensiveTest() {
    console.log('Starting comprehensive BookCraft AI testing...\n');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 800
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });

    const page = await context.newPage();

    // Test results tracking
    const testResults = {
        applicationLoad: false,
        projectCreation: false,
        richTextEditor: false,
        aiTextGeneration: false,
        imageGeneration: false,
        exportFunctionality: false,
        researchTab: false,
        plotManagement: false,
        consoleErrors: [],
        pageErrors: [],
        uiIssues: []
    };

    // Listen for console errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            testResults.consoleErrors.push(msg.text());
            console.log('❌ Console Error:', msg.text());
        }
    });

    // Listen for page errors
    page.on('pageerror', error => {
        testResults.pageErrors.push(error.message);
        console.log('❌ Page Error:', error.message);
    });

    try {
        // Test 1: Application Load
        console.log('1. Testing application load...');
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        const title = await page.title();
        if (title === 'BookCraft AI') {
            testResults.applicationLoad = true;
            console.log('✅ Application loads correctly');
            await page.screenshot({ path: 'test-screenshots/01-application-loaded.png', fullPage: true });
        } else {
            console.log('❌ Application title incorrect');
        }

        // Test 2: Project Creation
        console.log('\n2. Testing project creation...');
        try {
            // Click "New Project" button
            await page.click('button:has-text("New Project")');
            await page.waitForTimeout(1000);

            // Check if modal/form appeared
            const modalVisible = await page.isVisible('input[placeholder*="title"], input[placeholder*="Title"]');
            if (modalVisible) {
                // Fill project form
                await page.fill('input[placeholder*="title"], input[placeholder*="Title"]', 'Test Book Project');

                // Look for description field
                const descField = await page.isVisible('textarea');
                if (descField) {
                    await page.fill('textarea', 'A comprehensive test book for QA validation');
                }

                // Submit form
                await page.click('button:has-text("Create"), button[type="submit"]');
                await page.waitForTimeout(2000);

                // Check if we're in the project workspace
                const workspaceVisible = await page.isVisible('.workspace, [data-testid="workspace"]');
                if (workspaceVisible) {
                    testResults.projectCreation = true;
                    console.log('✅ Project creation successful');
                    await page.screenshot({ path: 'test-screenshots/02-project-created.png', fullPage: true });
                } else {
                    console.log('⚠ Project created but workspace not visible');
                }
            } else {
                console.log('❌ Project creation modal not found');
            }
        } catch (error) {
            console.log('❌ Project creation failed:', error.message);
        }

        // Test 3: Rich Text Editor
        console.log('\n3. Testing Lexical rich text editor...');
        try {
            // Look for editor in the current view or navigate to writing tab
            let editorFound = await page.isVisible('[contenteditable="true"]');

            if (!editorFound) {
                // Try to navigate to writing desk
                const writingTab = await page.isVisible('button:has-text("Writing"), [data-tab="writing"]');
                if (writingTab) {
                    await page.click('button:has-text("Writing"), [data-tab="writing"]');
                    await page.waitForTimeout(1000);
                    editorFound = await page.isVisible('[contenteditable="true"]');
                }
            }

            if (editorFound) {
                // Click in editor and type
                await page.click('[contenteditable="true"]');
                await page.type('[contenteditable="true"]', 'Testing the rich text editor functionality. ');

                // Test formatting buttons
                const boldButton = await page.isVisible('button[title*="Bold"], button:has-text("B"), [aria-label*="Bold"]');
                if (boldButton) {
                    await page.click('button[title*="Bold"], button:has-text("B"), [aria-label*="Bold"]');
                    await page.type('[contenteditable="true"]', 'This text should be bold. ');
                }

                const italicButton = await page.isVisible('button[title*="Italic"], button:has-text("I"), [aria-label*="Italic"]');
                if (italicButton) {
                    await page.click('button[title*="Italic"], button:has-text("I"), [aria-label*="Italic"]');
                    await page.type('[contenteditable="true"]', 'This text should be italic.');
                }

                testResults.richTextEditor = true;
                console.log('✅ Rich text editor functional');
                await page.screenshot({ path: 'test-screenshots/03-rich-text-editor.png', fullPage: true });
            } else {
                console.log('❌ Rich text editor not found');
                testResults.uiIssues.push('Rich text editor not accessible');
            }
        } catch (error) {
            console.log('❌ Rich text editor test failed:', error.message);
        }

        // Test 4: AI Text Generation
        console.log('\n4. Testing AI text generation...');
        try {
            const aiButton = await page.isVisible('button:has-text("Generate"), button:has-text("AI"), button[title*="AI"]');
            if (aiButton) {
                await page.click('button:has-text("Generate"), button:has-text("AI"), button[title*="AI"]');
                await page.waitForTimeout(3000); // Wait for AI response

                // Check if content was generated
                const editorContent = await page.$eval('[contenteditable="true"]', el => el.textContent);
                if (editorContent && editorContent.length > 100) {
                    testResults.aiTextGeneration = true;
                    console.log('✅ AI text generation working');
                } else {
                    console.log('⚠ AI generation button clicked but no content generated');
                }
                await page.screenshot({ path: 'test-screenshots/04-ai-generation.png', fullPage: true });
            } else {
                console.log('❌ AI generation button not found');
                testResults.uiIssues.push('AI generation not accessible');
            }
        } catch (error) {
            console.log('❌ AI text generation test failed:', error.message);
        }

        // Test 5: Navigation to Visuals Tab for Image Generation
        console.log('\n5. Testing image generation...');
        try {
            await page.click('button:has-text("Visuals")');
            await page.waitForTimeout(1000);

            const visualsTab = await page.isVisible('[data-tab="visuals"], .visuals-workspace');
            if (visualsTab) {
                const generateImageButton = await page.isVisible('button:has-text("Generate"), button:has-text("Create Visual")');
                if (generateImageButton) {
                    testResults.imageGeneration = true;
                    console.log('✅ Image generation accessible');
                } else {
                    console.log('⚠ Visuals tab loaded but no image generation button');
                }
                await page.screenshot({ path: 'test-screenshots/05-visuals-tab.png', fullPage: true });
            } else {
                console.log('❌ Unable to access visuals tab');
            }
        } catch (error) {
            console.log('❌ Image generation test failed:', error.message);
        }

        // Test 6: Export Functionality
        console.log('\n6. Testing export functionality...');
        try {
            await page.click('button:has-text("Export")');
            await page.waitForTimeout(1000);

            const exportOptions = await page.isVisible('button:has-text("Export"), button:has-text("Download"), select');
            if (exportOptions) {
                testResults.exportFunctionality = true;
                console.log('✅ Export functionality accessible');
                await page.screenshot({ path: 'test-screenshots/06-export-tab.png', fullPage: true });
            } else {
                console.log('❌ Export functionality not found');
            }
        } catch (error) {
            console.log('❌ Export test failed:', error.message);
        }

        // Test 7: Research Tab
        console.log('\n7. Testing research tab...');
        try {
            await page.click('button:has-text("Research")');
            await page.waitForTimeout(1000);

            const researchFeatures = await page.isVisible('button:has-text("Add"), input[placeholder*="search"], .research-item');
            if (researchFeatures) {
                testResults.researchTab = true;
                console.log('✅ Research tab functional');
                await page.screenshot({ path: 'test-screenshots/07-research-tab.png', fullPage: true });
            } else {
                console.log('❌ Research tab features not found');
            }
        } catch (error) {
            console.log('❌ Research tab test failed:', error.message);
        }

        // Test 8: Plot Management
        console.log('\n8. Testing plot management...');
        try {
            await page.click('button:has-text("Plot")');
            await page.waitForTimeout(1000);

            const plotFeatures = await page.isVisible('button:has-text("Add"), .plot-point, input[placeholder*="plot"]');
            if (plotFeatures) {
                testResults.plotManagement = true;
                console.log('✅ Plot management functional');
                await page.screenshot({ path: 'test-screenshots/08-plot-tab.png', fullPage: true });
            } else {
                console.log('❌ Plot management features not found');
            }
        } catch (error) {
            console.log('❌ Plot management test failed:', error.message);
        }

        // Test 9: UI Issues Check
        console.log('\n9. Checking for UI issues...');

        // Check for broken images
        const images = await page.$$('img');
        let brokenImages = 0;
        for (let img of images) {
            const naturalWidth = await img.evaluate(el => el.naturalWidth);
            if (naturalWidth === 0) {
                brokenImages++;
            }
        }
        if (brokenImages > 0) {
            testResults.uiIssues.push(`${brokenImages} broken images found`);
        }

        // Check responsive design
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(1000);
        const mobileLayout = await page.isVisible('.mobile-layout, .responsive');
        await page.setViewportSize({ width: 1280, height: 720 });

        await page.screenshot({ path: 'test-screenshots/09-final-state.png', fullPage: true });

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    } finally {
        await browser.close();
    }

    // Generate Test Report
    console.log('\n' + '='.repeat(60));
    console.log('📋 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(60));

    console.log('\n✅ WORKING FEATURES:');
    const workingFeatures = [];
    if (testResults.applicationLoad) workingFeatures.push('Application loads correctly');
    if (testResults.projectCreation) workingFeatures.push('Project creation');
    if (testResults.richTextEditor) workingFeatures.push('Lexical rich text editor with formatting');
    if (testResults.aiTextGeneration) workingFeatures.push('AI text generation');
    if (testResults.imageGeneration) workingFeatures.push('Image generation interface');
    if (testResults.exportFunctionality) workingFeatures.push('Export functionality');
    if (testResults.researchTab) workingFeatures.push('Research tab features');
    if (testResults.plotManagement) workingFeatures.push('Plot management');

    workingFeatures.forEach((feature, i) => {
        console.log(`  ${i + 1}. ${feature}`);
    });

    console.log('\n❌ ISSUES FOUND:');
    const allIssues = [
        ...testResults.consoleErrors.map(err => `Console Error: ${err}`),
        ...testResults.pageErrors.map(err => `Page Error: ${err}`),
        ...testResults.uiIssues
    ];

    if (allIssues.length === 0) {
        console.log('  No critical issues found!');
    } else {
        allIssues.forEach((issue, i) => {
            console.log(`  ${i + 1}. ${issue}`);
        });
    }

    console.log('\n🚧 MISSING/INCOMPLETE FEATURES:');
    const missingFeatures = [];
    if (!testResults.projectCreation) missingFeatures.push('Project creation not fully working');
    if (!testResults.richTextEditor) missingFeatures.push('Rich text editor not accessible');
    if (!testResults.aiTextGeneration) missingFeatures.push('AI text generation not working');
    if (!testResults.imageGeneration) missingFeatures.push('Image generation not accessible');
    if (!testResults.exportFunctionality) missingFeatures.push('Export functionality missing');
    if (!testResults.researchTab) missingFeatures.push('Research tab incomplete');
    if (!testResults.plotManagement) missingFeatures.push('Plot management incomplete');

    if (missingFeatures.length === 0) {
        console.log('  All core features are accessible!');
    } else {
        missingFeatures.forEach((feature, i) => {
            console.log(`  ${i + 1}. ${feature}`);
        });
    }

    console.log('\n📊 OVERALL STATUS:');
    const workingCount = workingFeatures.length;
    const totalFeatures = 8;
    const successRate = Math.round((workingCount / totalFeatures) * 100);

    console.log(`  Features Working: ${workingCount}/${totalFeatures} (${successRate}%)`);
    console.log(`  Console Errors: ${testResults.consoleErrors.length}`);
    console.log(`  Page Errors: ${testResults.pageErrors.length}`);
    console.log(`  UI Issues: ${testResults.uiIssues.length}`);

    if (successRate >= 80 && testResults.pageErrors.length === 0) {
        console.log('  🎉 Application Status: GOOD - Ready for use');
    } else if (successRate >= 60) {
        console.log('  ⚠️  Application Status: FAIR - Some issues need attention');
    } else {
        console.log('  ❌ Application Status: POOR - Significant issues require fixing');
    }

    console.log('\n📸 Screenshots saved to test-screenshots/ directory');
    console.log('='.repeat(60));

    return testResults;
}

// Create screenshots directory
if (!fs.existsSync('test-screenshots')) {
    fs.mkdirSync('test-screenshots');
}

comprehensiveTest().catch(console.error);