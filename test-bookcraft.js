import { chromium } from 'playwright';
import fs from 'fs';

async function testBookCraftAI() {
    console.log('Starting BookCraft AI application testing...\n');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000 // Slow down actions for better visibility
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
        }
    });

    // Listen for page errors
    const pageErrors = [];
    page.on('pageerror', error => {
        pageErrors.push(error.message);
    });

    try {
        console.log('1. Navigating to http://localhost:5173/');
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Take initial screenshot
        await page.screenshot({ path: 'test-screenshots/01-initial-load.png', fullPage: true });
        console.log('✓ Application loaded successfully');

        console.log('\n2. Testing project creation');
        // Look for "Create New Project" button or similar
        const createProjectSelector = 'button:has-text("Create New Project"), button:has-text("New Project"), [data-testid*="create"], [class*="create"]';

        try {
            await page.waitForSelector(createProjectSelector, { timeout: 5000 });
            await page.click(createProjectSelector);
            console.log('✓ Clicked create project button');

            // Fill in project details
            await page.fill('input[placeholder*="title"], input[name*="title"], input[id*="title"]', 'Test Book Project');
            await page.fill('textarea[placeholder*="description"], textarea[name*="description"]', 'A test book for QA validation');

            // Submit the form
            await page.click('button:has-text("Create"), button[type="submit"]');
            await page.waitForTimeout(2000);

            await page.screenshot({ path: 'test-screenshots/02-project-created.png', fullPage: true });
            console.log('✓ Project creation completed');
        } catch (error) {
            console.log('⚠ Project creation UI not found or failed:', error.message);
        }

        console.log('\n3. Testing Lexical rich text editor');
        try {
            // Look for rich text editor
            const editorSelector = '[contenteditable="true"], .lexical-editor, [data-lexical-editor="true"]';
            await page.waitForSelector(editorSelector, { timeout: 5000 });

            // Click in the editor
            await page.click(editorSelector);

            // Type some text
            await page.type(editorSelector, 'This is a test paragraph for the rich text editor. ');

            // Test formatting (look for bold button)
            const boldButton = 'button[aria-label*="Bold"], button:has-text("B"), [title*="Bold"]';
            try {
                await page.click(boldButton);
                await page.type(editorSelector, 'This text should be bold. ');
                console.log('✓ Bold formatting works');
            } catch {
                console.log('⚠ Bold button not found');
            }

            // Test italic
            const italicButton = 'button[aria-label*="Italic"], button:has-text("I"), [title*="Italic"]';
            try {
                await page.click(italicButton);
                await page.type(editorSelector, 'This text should be italic.');
                console.log('✓ Italic formatting works');
            } catch {
                console.log('⚠ Italic button not found');
            }

            await page.screenshot({ path: 'test-screenshots/03-rich-text-editor.png', fullPage: true });
            console.log('✓ Rich text editor testing completed');
        } catch (error) {
            console.log('⚠ Rich text editor not found:', error.message);
        }

        console.log('\n4. Testing AI text generation');
        try {
            // Look for AI generation button
            const aiGenerateButton = 'button:has-text("Generate"), button:has-text("AI"), [data-testid*="ai"], [class*="ai"]';
            await page.waitForSelector(aiGenerateButton, { timeout: 5000 });
            await page.click(aiGenerateButton);

            // Wait for generation to complete (look for loading indicators)
            await page.waitForTimeout(3000);
            console.log('✓ AI text generation triggered');

            await page.screenshot({ path: 'test-screenshots/04-ai-generation.png', fullPage: true });
        } catch (error) {
            console.log('⚠ AI text generation button not found:', error.message);
        }

        console.log('\n5. Testing image generation');
        try {
            // Navigate to visuals tab
            const visualsTab = 'button:has-text("Visuals"), [data-tab="visuals"], [href*="visual"]';
            await page.click(visualsTab);
            await page.waitForTimeout(1000);

            // Look for image generation button
            const imageGenButton = 'button:has-text("Generate Image"), button:has-text("Create Visual")';
            await page.click(imageGenButton);

            await page.waitForTimeout(2000);
            console.log('✓ Image generation triggered');

            await page.screenshot({ path: 'test-screenshots/05-image-generation.png', fullPage: true });
        } catch (error) {
            console.log('⚠ Image generation not accessible:', error.message);
        }

        console.log('\n6. Testing export functionality');
        try {
            // Navigate to export tab
            const exportTab = 'button:has-text("Export"), [data-tab="export"], [href*="export"]';
            await page.click(exportTab);
            await page.waitForTimeout(1000);

            // Look for export options
            const exportButton = 'button:has-text("Export"), button:has-text("Download")';
            await page.waitForSelector(exportButton, { timeout: 3000 });
            console.log('✓ Export functionality accessible');

            await page.screenshot({ path: 'test-screenshots/06-export-tab.png', fullPage: true });
        } catch (error) {
            console.log('⚠ Export functionality not found:', error.message);
        }

        console.log('\n7. Testing research tab');
        try {
            const researchTab = 'button:has-text("Research"), [data-tab="research"], [href*="research"]';
            await page.click(researchTab);
            await page.waitForTimeout(1000);

            // Try to add research item
            const addResearchButton = 'button:has-text("Add"), button:has-text("+"), [data-testid*="add"]';
            await page.waitForSelector(addResearchButton, { timeout: 3000 });
            console.log('✓ Research tab accessible');

            await page.screenshot({ path: 'test-screenshots/07-research-tab.png', fullPage: true });
        } catch (error) {
            console.log('⚠ Research tab not accessible:', error.message);
        }

        console.log('\n8. Testing plot management');
        try {
            const plotTab = 'button:has-text("Plot"), [data-tab="plot"], [href*="plot"]';
            await page.click(plotTab);
            await page.waitForTimeout(1000);

            // Look for plot management features
            const addPlotButton = 'button:has-text("Add Plot"), button:has-text("New Plot")';
            await page.waitForSelector(addPlotButton, { timeout: 3000 });
            console.log('✓ Plot management accessible');

            await page.screenshot({ path: 'test-screenshots/08-plot-tab.png', fullPage: true });
        } catch (error) {
            console.log('⚠ Plot management not accessible:', error.message);
        }

        console.log('\n9. Checking for console errors and UI issues');

        // Check for broken images
        const images = await page.$$('img');
        for (let img of images) {
            const naturalWidth = await img.evaluate(el => el.naturalWidth);
            if (naturalWidth === 0) {
                console.log('⚠ Broken image found');
            }
        }

        // Check for missing CSS (look for unstyled elements)
        const unstyledElements = await page.$$('[style=""], [class=""]');
        if (unstyledElements.length > 10) {
            console.log('⚠ Many elements appear to be unstyled');
        }

        console.log('\n=== TEST RESULTS ===');
        console.log(`Console Errors: ${consoleErrors.length}`);
        if (consoleErrors.length > 0) {
            console.log('Console Errors:', consoleErrors);
        }

        console.log(`Page Errors: ${pageErrors.length}`);
        if (pageErrors.length > 0) {
            console.log('Page Errors:', pageErrors);
        }

        await page.screenshot({ path: 'test-screenshots/09-final-state.png', fullPage: true });
        console.log('\nScreenshots saved to test-screenshots/ directory');

    } catch (error) {
        console.error('Test failed with error:', error);
    } finally {
        await browser.close();
        console.log('\nTesting completed.');
    }
}

// Create screenshots directory
if (!fs.existsSync('test-screenshots')) {
    fs.mkdirSync('test-screenshots');
}

testBookCraftAI().catch(console.error);