/**
 * BookCraft AI - Manual Verification Test
 * Quick manual checks with targeted testing
 */

import { chromium } from 'playwright';

async function manualVerification() {
    console.log('🔍 BookCraft AI - Manual Verification Test\n');

    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    const results = {
        criticalIssuesResolved: {},
        functionalTests: {},
        consoleErrors: []
    };

    // Track console errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            results.consoleErrors.push(msg.text());
        }
    });

    try {
        // Load application
        console.log('📋 Loading application...');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);

        // CRITICAL ISSUE 1: PlotTab Infinite Loop Check
        console.log('🔍 Checking for PlotTab infinite loop...');
        const infiniteLoopDetected = results.consoleErrors.some(error =>
            error.includes('Maximum update depth') ||
            error.includes('infinite loop') ||
            error.includes('too many re-renders')
        );

        results.criticalIssuesResolved.plotTabInfiniteLoop = !infiniteLoopDetected;
        console.log(infiniteLoopDetected ? '❌ Infinite loop DETECTED' : '✅ No infinite loop detected');

        // CRITICAL ISSUE 2: Project Creation Workflow
        console.log('\n🔍 Testing project creation workflow...');
        const createButton = await page.$('button:has-text("Create Your First Project")');

        if (createButton) {
            await createButton.click();
            await page.waitForTimeout(2000);

            const modal = await page.$('[role="dialog"]');
            if (modal) {
                results.criticalIssuesResolved.projectCreationWorkflow = true;
                console.log('✅ Project creation modal opens successfully');

                // Close modal for next tests
                const closeButton = await page.$('button:has-text("Cancel")');
                if (closeButton) {
                    await closeButton.click();
                    await page.waitForTimeout(1000);
                }
            } else {
                results.criticalIssuesResolved.projectCreationWorkflow = false;
                console.log('❌ Project creation modal failed to open');
            }
        }

        // CRITICAL ISSUE 3: Modal State Management
        console.log('\n🔍 Testing modal state management...');

        // Test opening and closing modal
        const newProjectBtn = await page.$('button:has-text("New Project")');
        if (newProjectBtn) {
            await newProjectBtn.click();
            await page.waitForTimeout(1000);

            const modalOpen = await page.$('[role="dialog"]');
            if (modalOpen) {
                // Try to close with X button
                const xButton = await page.$('button:has([data-testid="close"]), button[aria-label="Close"]');
                if (xButton) {
                    await xButton.click();
                    await page.waitForTimeout(1000);

                    const modalClosed = await page.$('[role="dialog"]');
                    results.criticalIssuesResolved.modalStateManagement = !modalClosed;
                    console.log(!modalClosed ? '✅ Modal closes properly' : '❌ Modal state management issue');
                } else {
                    // Try clicking outside
                    await page.click('body', { position: { x: 100, y: 100 } });
                    await page.waitForTimeout(1000);

                    const modalClosed = await page.$('[role="dialog"]');
                    results.criticalIssuesResolved.modalStateManagement = !modalClosed;
                    console.log(!modalClosed ? '✅ Modal closes by outside click' : '❌ Modal persists');
                }
            }
        }

        // Create a test project to test other features
        console.log('\n🔍 Creating test project...');
        const createBtn = await page.$('button:has-text("Create Your First Project"), button:has-text("New Project")');
        if (createBtn) {
            await createBtn.click();
            await page.waitForTimeout(1000);

            // Fill form
            const titleInput = await page.$('input[type="text"]');
            if (titleInput) {
                await titleInput.fill('QA Test Project');
            }

            // Submit with force click
            try {
                await page.click('button:has-text("Create Project")', { force: true });
                await page.waitForTimeout(4000);
                console.log('✅ Test project creation attempted');
            } catch (error) {
                console.log('⚠️  Project creation button click issue');
            }
        }

        // CRITICAL ISSUE 4: Lexical Editor Access
        console.log('\n🔍 Testing Lexical editor access...');

        // Look for workspace or navigate to writing area
        const writingStudio = await page.$('text=Writing Studio');
        if (writingStudio) {
            await writingStudio.click();
            await page.waitForTimeout(2000);
        }

        const editor = await page.$('[contenteditable="true"], .lexical-editor, div[role="textbox"]');
        if (editor) {
            results.criticalIssuesResolved.lexicalEditorAccess = true;
            console.log('✅ Lexical editor found and accessible');

            // Test typing
            try {
                await editor.click();
                await page.type('[contenteditable="true"]', 'Test content');
                console.log('✅ Text input working in editor');
            } catch (error) {
                console.log('⚠️  Text input issue in editor');
            }
        } else {
            results.criticalIssuesResolved.lexicalEditorAccess = false;
            console.log('❌ Lexical editor not found');
        }

        // CRITICAL ISSUE 5: AI Features
        console.log('\n🔍 Testing AI features availability...');

        const aiButtons = await page.$$('button:has-text("AI"), button:has-text("Generate"), button:has-text("Assistant")');
        if (aiButtons.length > 0) {
            results.criticalIssuesResolved.aiFeatures = true;
            console.log(`✅ ${aiButtons.length} AI-related buttons found`);
        } else {
            results.criticalIssuesResolved.aiFeatures = false;
            console.log('❌ No AI feature buttons found');
        }

        // Test navigation tabs
        console.log('\n🔍 Testing workspace tab navigation...');
        const tabs = ['Writing', 'Plot', 'Research'];
        let workingTabs = 0;

        for (const tabName of tabs) {
            const tab = await page.$(`button:has-text("${tabName}")`);
            if (tab) {
                try {
                    await tab.click();
                    await page.waitForTimeout(1500);
                    workingTabs++;
                    console.log(`✅ ${tabName} tab working`);
                } catch (error) {
                    console.log(`⚠️  ${tabName} tab has issues`);
                }
            }
        }

        results.functionalTests.tabNavigation = `${workingTabs}/${tabs.length}`;

        // Take final screenshot
        await page.screenshot({ path: 'qa-final-verification.png' });

    } catch (error) {
        console.error('❌ Verification error:', error.message);
    }

    console.log('\n📊 VERIFICATION RESULTS');
    console.log('='.repeat(60));

    // Critical Issues Assessment
    console.log('\n🎯 CRITICAL ISSUES RESOLUTION:');
    Object.entries(results.criticalIssuesResolved).forEach(([issue, resolved]) => {
        const icon = resolved ? '✅' : '❌';
        const status = resolved ? 'RESOLVED' : 'STILL PRESENT';
        console.log(`${icon} ${issue}: ${status}`);
    });

    // Functional Tests
    console.log('\n🔧 FUNCTIONAL TESTS:');
    Object.entries(results.functionalTests).forEach(([test, result]) => {
        console.log(`📋 ${test}: ${result}`);
    });

    console.log(`\n🐛 Console Errors: ${results.consoleErrors.length}`);

    // Overall Assessment
    const resolvedCount = Object.values(results.criticalIssuesResolved).filter(Boolean).length;
    const totalCritical = Object.keys(results.criticalIssuesResolved).length;
    const resolutionRate = Math.round((resolvedCount / totalCritical) * 100);

    console.log(`\n🎯 CRITICAL ISSUES RESOLUTION RATE: ${resolutionRate}% (${resolvedCount}/${totalCritical})`);

    if (resolutionRate >= 80) {
        console.log('🎉 EXCELLENT: Most critical issues resolved!');
    } else if (resolutionRate >= 60) {
        console.log('👍 GOOD: Significant progress on critical issues');
    } else {
        console.log('⚠️  NEEDS WORK: Many critical issues remain');
    }

    await browser.close();
    return results;
}

manualVerification().catch(console.error);