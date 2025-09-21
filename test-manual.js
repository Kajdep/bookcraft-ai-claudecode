import { chromium } from 'playwright';
import fs from 'fs';

async function manualTest() {
    console.log('Starting manual BookCraft AI inspection...\n');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 500
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });

    const page = await context.newPage();

    // Listen for console errors
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
            console.log('Console Error:', msg.text());
        }
    });

    // Listen for page errors
    const pageErrors = [];
    page.on('pageerror', error => {
        pageErrors.push(error.message);
        console.log('Page Error:', error.message);
    });

    try {
        console.log('1. Navigating to http://localhost:5173/');
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);

        // Take initial screenshot
        await page.screenshot({ path: 'test-screenshots/initial.png', fullPage: true });

        // Get page title
        const title = await page.title();
        console.log('Page title:', title);

        // Get all visible buttons
        console.log('\nVisible buttons on page:');
        const buttons = await page.$$eval('button', buttons =>
            buttons.map(btn => ({
                text: btn.textContent?.trim(),
                className: btn.className,
                id: btn.id,
                visible: btn.offsetParent !== null
            })).filter(btn => btn.visible && btn.text)
        );

        buttons.forEach((btn, i) => {
            console.log(`  ${i + 1}. "${btn.text}" (class: ${btn.className})`);
        });

        // Get all input fields
        console.log('\nVisible input fields:');
        const inputs = await page.$$eval('input, textarea', inputs =>
            inputs.map(input => ({
                type: input.type,
                placeholder: input.placeholder,
                name: input.name,
                id: input.id,
                visible: input.offsetParent !== null
            })).filter(input => input.visible)
        );

        inputs.forEach((input, i) => {
            console.log(`  ${i + 1}. Type: ${input.type}, Placeholder: "${input.placeholder}"`);
        });

        // Check for navigation/tabs
        console.log('\nLooking for navigation elements:');
        const navElements = await page.$$eval('nav, [role="navigation"], [class*="nav"], [class*="tab"]', elements =>
            elements.map(el => ({
                tagName: el.tagName,
                className: el.className,
                text: el.textContent?.trim().substring(0, 100)
            }))
        );

        navElements.forEach((nav, i) => {
            console.log(`  ${i + 1}. ${nav.tagName}: "${nav.text}" (class: ${nav.className})`);
        });

        // Look for main content areas
        console.log('\nMain content areas:');
        const mainElements = await page.$$eval('main, [role="main"], [class*="main"], [class*="content"]', elements =>
            elements.map(el => ({
                tagName: el.tagName,
                className: el.className,
                text: el.textContent?.trim().substring(0, 50)
            }))
        );

        mainElements.forEach((main, i) => {
            console.log(`  ${i + 1}. ${main.tagName}: "${main.text}" (class: ${main.className})`);
        });

        // Check for editor elements
        console.log('\nLooking for editor elements:');
        const editorElements = await page.$$eval('[contenteditable], [class*="editor"], [class*="lexical"]', elements =>
            elements.map(el => ({
                tagName: el.tagName,
                className: el.className,
                contentEditable: el.contentEditable
            }))
        );

        editorElements.forEach((editor, i) => {
            console.log(`  ${i + 1}. ${editor.tagName}: contentEditable=${editor.contentEditable} (class: ${editor.className})`);
        });

        console.log('\n=== ERROR SUMMARY ===');
        console.log(`Console Errors: ${consoleErrors.length}`);
        console.log(`Page Errors: ${pageErrors.length}`);

        if (consoleErrors.length > 0) {
            console.log('\nConsole Errors:');
            consoleErrors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
        }

        if (pageErrors.length > 0) {
            console.log('\nPage Errors:');
            pageErrors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
        }

        // Wait for user to observe
        console.log('\nWaiting 10 seconds for manual observation...');
        await page.waitForTimeout(10000);

    } catch (error) {
        console.error('Test failed with error:', error);
    } finally {
        await browser.close();
        console.log('\nInspection completed.');
    }
}

// Create screenshots directory
if (!fs.existsSync('test-screenshots')) {
    fs.mkdirSync('test-screenshots');
}

manualTest().catch(console.error);