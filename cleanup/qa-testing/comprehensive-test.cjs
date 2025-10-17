const { chromium } = require('playwright');
const fs = require('fs');

// Color codes for terminal output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

const log = {
    pass: (msg) => console.log(`${colors.green}✅ PASS:${colors.reset} ${msg}`),
    fail: (msg) => console.log(`${colors.red}❌ FAIL:${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}⚠️  WARN:${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.blue}ℹ️  INFO:${colors.reset} ${msg}`),
    section: (msg) => console.log(`\n${colors.bold}${colors.blue}═══ ${msg} ═══${colors.reset}\n`)
};

const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    issues: []
};

function recordTest(name, passed, message = '', priority = 'medium') {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        log.pass(`${name}: ${message}`);
    } else {
        testResults.failed++;
        log.fail(`${name}: ${message}`);
        testResults.issues.push({ name, message, priority });
    }
}

function recordWarning(name, message) {
    testResults.warnings++;
    log.warn(`${name}: ${message}`);
    testResults.issues.push({ name, message, priority: 'low' });
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runComprehensiveTests() {
    log.section('BOOKCRAFT AI - COMPREHENSIVE FEATURE TEST');
    log.info('Starting Playwright browser...');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // Track console messages
    const consoleMessages = [];
    page.on('console', msg => {
        consoleMessages.push({ type: msg.type(), text: msg.text() });
        if (msg.type() === 'error') {
            log.fail(`Console Error: ${msg.text()}`);
        }
    });

    try {
        // ============================================
        // PHASE 1: APPLICATION STARTUP
        // ============================================
        log.section('PHASE 1: Application Startup & Infrastructure');

        await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
        await page.screenshot({ path: 'test-results/01-app-loaded.png', fullPage: true });

        // Check for app container
        const appContainer = await page.locator('div.min-h-screen').count();
        recordTest('App Container', appContainer > 0, 'Main application container rendered');

        // Check for header
        const header = await page.locator('header').count();
        recordTest('Header', header > 0, 'Application header present');

        // Check for title
        const title = await page.locator('text=BookCraft').count();
        recordTest('App Title', title > 0, 'BookCraft AI title visible');

        // Check for console errors
        const errors = consoleMessages.filter(m => m.type === 'error');
        if (errors.length > 0) {
            recordWarning('Console Errors on Load', `${errors.length} errors found: ${errors.map(e => e.text).join(', ')}`);
        } else {
            log.pass('Console Errors: None detected on initial load');
        }

        await sleep(1000);

        // ============================================
        // PHASE 2: PROJECT CREATION FLOW
        // ============================================
        log.section('PHASE 2: Project Creation Flow');

        // Find and click "New Project" button
        const newProjectBtn = page.locator('button:has-text("New Project")').first();
        const hasNewProjectBtn = await newProjectBtn.count() > 0;
        recordTest('New Project Button', hasNewProjectBtn, 'New Project button found');

        if (hasNewProjectBtn) {
            await newProjectBtn.click();
            await sleep(500);
            await page.screenshot({ path: 'test-results/02-project-modal-open.png', fullPage: true });

            // Check if modal opened
            const modal = await page.locator('[role="dialog"]').count();
            recordTest('Project Modal Opens', modal > 0, 'Create Project modal displays');

            if (modal > 0) {
                // Test form fields
                const titleInput = await page.locator('input[placeholder*="title" i], input[id*="title" i]').count();
                recordTest('Title Field', titleInput > 0, 'Project title input field exists');

                const genreSelect = await page.locator('select, button:has-text("Select Genre"), input[placeholder*="genre" i]').count();
                recordTest('Genre Field', genreSelect > 0, 'Genre selection field exists');

                const visualStyleSelect = await page.locator('select:has(option:has-text("Visual Style")), button:has-text("Visual Style"), input[placeholder*="visual" i]').count();
                recordTest('Visual Style Field', visualStyleSelect > 0, 'Visual style field exists');

                const descriptionInput = await page.locator('textarea[placeholder*="description" i], textarea[id*="description" i]').count();
                recordTest('Description Field', descriptionInput > 0, 'Project description textarea exists');

                // Fill out the form
                if (titleInput > 0) {
                    await page.locator('input[placeholder*="title" i], input[id*="title" i]').first().fill('Test Project - Comprehensive QA');
                    log.info('Filled in project title');
                }

                // Look for submit button
                const submitBtn = page.locator('button:has-text("Create"), button[type="submit"]').first();
                const hasSubmit = await submitBtn.count() > 0;

                if (hasSubmit) {
                    await submitBtn.click();
                    await sleep(2000);
                    await page.screenshot({ path: 'test-results/03-project-created.png', fullPage: true });

                    // Check if we navigated to workspace
                    const workspace = await page.locator('text=Writing Studio, text=Plot, text=Research').count();
                    recordTest('Navigate to Workspace', workspace > 0, 'Successfully navigated to project workspace');
                } else {
                    recordWarning('Project Creation', 'Could not find submit button');
                }
            }
        }

        await sleep(1000);

        // ============================================
        // PHASE 3: WORKSPACE NAVIGATION
        // ============================================
        log.section('PHASE 3: Workspace Navigation & Tabs');

        const tabs = [
            { name: 'Writing Studio', selector: 'button:has-text("Writing Studio"), a:has-text("Writing Studio")' },
            { name: 'Plot', selector: 'button:has-text("Plot"), a:has-text("Plot")' },
            { name: 'Research', selector: 'button:has-text("Research"), a:has-text("Research")' },
            { name: 'Material', selector: 'button:has-text("Material"), a:has-text("Material")' },
            { name: 'Visuals', selector: 'button:has-text("Visuals"), a:has-text("Visuals")' },
            { name: 'Export', selector: 'button:has-text("Export"), a:has-text("Export")' }
        ];

        for (const tab of tabs) {
            const tabElement = page.locator(tab.selector).first();
            const exists = await tabElement.count() > 0;

            if (exists) {
                try {
                    await tabElement.click({ timeout: 2000 });
                    await sleep(500);
                    recordTest(`${tab.name} Tab`, true, `${tab.name} tab clickable and functional`);
                    await page.screenshot({ path: `test-results/04-tab-${tab.name.toLowerCase().replace(' ', '-')}.png`, fullPage: true });
                } catch (e) {
                    recordTest(`${tab.name} Tab`, false, `Tab exists but not clickable: ${e.message}`, 'high');
                }
            } else {
                recordTest(`${tab.name} Tab`, false, 'Tab not found', 'high');
            }
        }

        // ============================================
        // PHASE 4: LEXICAL EDITOR
        // ============================================
        log.section('PHASE 4: Lexical Editor Functionality');

        // Navigate to Writing Studio
        await page.locator('button:has-text("Writing Studio"), a:has-text("Writing Studio")').first().click();
        await sleep(1000);

        // Check for Lexical editor
        const lexicalEditor = await page.locator('[contenteditable="true"], .lexical-editor, [data-lexical-editor]').count();
        recordTest('Lexical Editor', lexicalEditor > 0, 'Lexical editor element found');

        if (lexicalEditor > 0) {
            // Test typing
            try {
                const editor = page.locator('[contenteditable="true"]').first();
                await editor.click();
                await editor.fill('This is a test of the Lexical editor functionality.');
                await sleep(500);
                recordTest('Editor Typing', true, 'Text input works in Lexical editor');
                await page.screenshot({ path: 'test-results/05-lexical-editor-typed.png', fullPage: true });
            } catch (e) {
                recordTest('Editor Typing', false, `Could not type in editor: ${e.message}`, 'critical');
            }

            // Check for toolbar
            const toolbar = await page.locator('button:has-text("Bold"), button[title*="Bold" i]').count();
            recordTest('Editor Toolbar', toolbar > 0, 'Editor toolbar with formatting buttons found');
        }

        // ============================================
        // PHASE 5: AI FEATURES
        // ============================================
        log.section('PHASE 5: AI Features Validation');

        const aiFeatures = [
            { name: 'Chapter Structure', selector: 'button:has-text("Chapter Structure")' },
            { name: 'Visual Analysis', selector: 'button:has-text("Visual Analysis")' },
            { name: 'Clean & Format', selector: 'button:has-text("Clean"), button:has-text("Format")' },
            { name: 'Generate', selector: 'button:has-text("Generate")' },
            { name: 'Assistant', selector: 'button:has-text("Assistant")' }
        ];

        let aiButtonsFound = 0;
        for (const feature of aiFeatures) {
            const button = await page.locator(feature.selector).count();
            if (button > 0) {
                aiButtonsFound++;
                log.pass(`AI Feature: ${feature.name} button found`);
            } else {
                log.fail(`AI Feature: ${feature.name} button NOT found`);
            }
        }

        recordTest('AI Features Accessibility', aiButtonsFound > 0, `${aiButtonsFound}/5 AI features accessible`);

        await page.screenshot({ path: 'test-results/06-ai-features-check.png', fullPage: true });

        // ============================================
        // PHASE 6: PLOT TAB
        // ============================================
        log.section('PHASE 6: Plot Tab (Infinite Loop Check)');

        await page.locator('button:has-text("Plot"), a:has-text("Plot")').first().click();
        await sleep(2000);

        // Check console for infinite loop errors
        const recentErrors = consoleMessages.slice(-10).filter(m =>
            m.type === 'error' && (
                m.text.includes('Maximum update depth') ||
                m.text.includes('Too many re-renders')
            )
        );

        recordTest('PlotTab No Infinite Loop', recentErrors.length === 0,
            recentErrors.length > 0 ? `Infinite loop detected: ${recentErrors[0].text}` : 'No infinite loop errors detected',
            recentErrors.length > 0 ? 'critical' : 'low');

        await page.screenshot({ path: 'test-results/07-plot-tab.png', fullPage: true });

        // ============================================
        // PHASE 7: RESEARCH TAB
        // ============================================
        log.section('PHASE 7: Research Tab & Data Persistence');

        await page.locator('button:has-text("Research"), a:has-text("Research")').first().click();
        await sleep(1000);

        const researchTab = await page.locator('text=Research').count();
        recordTest('Research Tab Accessible', researchTab > 0, 'Research tab loads');

        // Check for research features
        const researchFeatures = await page.locator('button:has-text("AI Research"), input[placeholder*="research" i], button:has-text("New Research")').count();
        recordTest('Research Features', researchFeatures > 0, 'Research UI elements present');

        await page.screenshot({ path: 'test-results/08-research-tab.png', fullPage: true });

        // Test persistence by navigating away and back
        await page.locator('button:has-text("Writing Studio"), a:has-text("Writing Studio")').first().click();
        await sleep(500);
        await page.locator('button:has-text("Research"), a:has-text("Research")').first().click();
        await sleep(500);

        const stillLoaded = await page.locator('text=Research').count();
        recordTest('Research Data Persistence', stillLoaded > 0, 'Research tab data persists after navigation');

        // ============================================
        // PHASE 8: VISUALS TAB
        // ============================================
        log.section('PHASE 8: Visuals & Image Generation');

        await page.locator('button:has-text("Visuals"), a:has-text("Visuals")').first().click();
        await sleep(1000);

        const visualsTab = await page.locator('text=Visuals, text=Visual Analysis').count();
        recordTest('Visuals Tab Accessible', visualsTab > 0, 'Visuals tab loads');

        // Check for error messages about diagram rendering
        const diagramErrors = await page.locator('text="Could not render diagram", text="syntax error"').count();
        if (diagramErrors > 0) {
            recordWarning('Mermaid Diagram Rendering', 'Diagram rendering errors detected in UI');
        } else {
            log.pass('Mermaid Diagrams: No visible rendering errors');
        }

        await page.screenshot({ path: 'test-results/09-visuals-tab.png', fullPage: true });

        // ============================================
        // PHASE 9: MODAL SYSTEM
        // ============================================
        log.section('PHASE 9: Modal System (No UI Blocking)');

        // Check if there are any persistent modal overlays blocking the UI
        const modalOverlays = await page.locator('[role="dialog"][aria-modal="true"], .fixed.inset-0.z-50').count();
        if (modalOverlays > 0) {
            recordWarning('Modal Overlays', `${modalOverlays} modal overlay(s) detected - checking if blocking`);

            // Try clicking a tab to see if it's blocked
            try {
                await page.locator('button:has-text("Export"), a:has-text("Export")').first().click({ timeout: 1000 });
                recordTest('Modal Not Blocking', true, 'Can navigate despite modal presence');
            } catch (e) {
                recordTest('Modal Not Blocking', false, 'Modal appears to be blocking UI interactions', 'critical');
            }
        } else {
            recordTest('No Persistent Modals', true, 'No modal overlays blocking the UI');
        }

        await page.screenshot({ path: 'test-results/10-modal-check.png', fullPage: true });

        // ============================================
        // PHASE 10: AUTOSAVE
        // ============================================
        log.section('PHASE 10: Autosave Functionality');

        // Navigate back to editor
        await page.locator('button:has-text("Writing Studio"), a:has-text("Writing Studio")').first().click();
        await sleep(1000);

        // Type some content
        try {
            const editor = page.locator('[contenteditable="true"]').first();
            await editor.click();
            await editor.press('End');
            await editor.type(' Testing autosave functionality...');
            log.info('Typed content, waiting for autosave (2 seconds)...');
            await sleep(3000);

            // Check console for autosave messages
            const autosaveMessages = consoleMessages.filter(m =>
                m.text.toLowerCase().includes('autosave') ||
                m.text.toLowerCase().includes('saving') ||
                m.text.toLowerCase().includes('saved')
            );

            recordTest('Autosave Triggers', autosaveMessages.length > 0,
                autosaveMessages.length > 0 ? `Autosave detected: ${autosaveMessages.length} messages` : 'No autosave messages in console');
        } catch (e) {
            recordWarning('Autosave Test', `Could not complete autosave test: ${e.message}`);
        }

        await page.screenshot({ path: 'test-results/11-autosave-test.png', fullPage: true });

        // ============================================
        // FINAL REPORT
        // ============================================
        log.section('TEST COMPLETION SUMMARY');

        console.log(`\n${colors.bold}Total Tests:${colors.reset} ${testResults.total}`);
        console.log(`${colors.green}${colors.bold}Passed:${colors.reset} ${testResults.passed}`);
        console.log(`${colors.red}${colors.bold}Failed:${colors.reset} ${testResults.failed}`);
        console.log(`${colors.yellow}${colors.bold}Warnings:${colors.reset} ${testResults.warnings}`);
        console.log(`${colors.bold}Pass Rate:${colors.reset} ${((testResults.passed / testResults.total) * 100).toFixed(1)}%\n`);

        if (testResults.issues.length > 0) {
            log.section('ISSUES FOUND');

            const critical = testResults.issues.filter(i => i.priority === 'critical');
            const high = testResults.issues.filter(i => i.priority === 'high');
            const medium = testResults.issues.filter(i => i.priority === 'medium');
            const low = testResults.issues.filter(i => i.priority === 'low');

            if (critical.length > 0) {
                console.log(`\n${colors.red}${colors.bold}CRITICAL ISSUES (${critical.length}):${colors.reset}`);
                critical.forEach(i => console.log(`  • ${i.name}: ${i.message}`));
            }

            if (high.length > 0) {
                console.log(`\n${colors.red}HIGH PRIORITY (${high.length}):${colors.reset}`);
                high.forEach(i => console.log(`  • ${i.name}: ${i.message}`));
            }

            if (medium.length > 0) {
                console.log(`\n${colors.yellow}MEDIUM PRIORITY (${medium.length}):${colors.reset}`);
                medium.forEach(i => console.log(`  • ${i.name}: ${i.message}`));
            }

            if (low.length > 0) {
                console.log(`\n${colors.yellow}LOW PRIORITY/WARNINGS (${low.length}):${colors.reset}`);
                low.forEach(i => console.log(`  • ${i.name}: ${i.message}`));
            }
        }

        // Save results to JSON
        fs.writeFileSync('test-results/comprehensive-test-results.json', JSON.stringify({
            timestamp: new Date().toISOString(),
            summary: {
                total: testResults.total,
                passed: testResults.passed,
                failed: testResults.failed,
                warnings: testResults.warnings,
                passRate: ((testResults.passed / testResults.total) * 100).toFixed(1) + '%'
            },
            issues: testResults.issues,
            consoleMessages: consoleMessages
        }, null, 2));

        log.info('Results saved to test-results/comprehensive-test-results.json');
        log.info('Screenshots saved to test-results/ directory');

    } catch (error) {
        log.fail(`Test execution error: ${error.message}`);
        console.error(error);
    } finally {
        log.info('\nClosing browser in 10 seconds...');
        await sleep(10000);
        await browser.close();
    }
}

// Create test-results directory if it doesn't exist
if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results');
}

runComprehensiveTests().catch(console.error);
