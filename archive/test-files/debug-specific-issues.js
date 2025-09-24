import puppeteer from 'puppeteer';

const TEST_CONFIG = {
    appUrl: 'http://localhost:5173/',
    timeout: 30000,
    headless: false
};

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function debugLexicalEditor(page) {
    console.log('\n🔍 Debugging Lexical Editor Issue...');

    // First, create a project
    console.log('1. Creating a project...');
    const clicked = await page.$$eval('button', buttons => {
        const btn = buttons.find(b => b.textContent?.includes('New Project'));
        if (btn) {
            btn.click();
            return true;
        }
        return false;
    });

    if (!clicked) {
        throw new Error('New Project button not found');
    }

    await delay(1000);
    await page.type('input[id="title"]', 'Debug Test Project');
    await delay(500);

    // Submit the form
    await page.$$eval('button', buttons => {
        const btn = buttons.find(b => b.textContent?.includes('Create Project'));
        if (btn) {
            btn.click();
            return true;
        }
        return false;
    });

    await delay(2000);

    console.log('2. Adding a chapter...');
    // Look for "Add Chapter" button in the Writing Studio
    const addChapterClicked = await page.$$eval('button', buttons => {
        const btn = buttons.find(b => b.textContent?.includes('Add Chapter'));
        if (btn) {
            btn.click();
            return true;
        }
        return false;
    });

    if (addChapterClicked) {
        console.log('✅ Added chapter successfully');
        await delay(1000);
    } else {
        console.log('⚠️ Could not find Add Chapter button');
    }

    console.log('3. Checking for Lexical editor...');

    // Check all possible selectors for the Lexical editor
    const lexicalSelectors = [
        '[data-testid="lexical-content-editable"]',
        '[contenteditable="true"]',
        '.lexical-editor',
        '[role="textbox"]',
        '[aria-multiline="true"]'
    ];

    for (const selector of lexicalSelectors) {
        const found = await page.$(selector);
        if (found) {
            console.log(`✅ Found Lexical editor with selector: ${selector}`);

            // Check if it's visible
            const isVisible = await page.evaluate((sel) => {
                const el = document.querySelector(sel);
                if (!el) return false;
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
            }, selector);

            console.log(`   - Visible: ${isVisible}`);

            if (isVisible) {
                try {
                    await page.click(selector);
                    await page.type(selector, 'Test content in Lexical editor');
                    console.log('✅ Successfully typed in Lexical editor');
                } catch (error) {
                    console.log(`⚠️ Could not type in editor: ${error.message}`);
                }
            }

            return true;
        }
    }

    console.log('❌ No Lexical editor found with any selector');

    // Check the DOM structure
    const domStructure = await page.evaluate(() => {
        const main = document.querySelector('main');
        if (main) {
            return {
                mainHTML: main.innerHTML.substring(0, 500) + '...',
                contentEditables: Array.from(document.querySelectorAll('[contenteditable]')).map(el => ({
                    tagName: el.tagName,
                    contentEditable: el.contentEditable,
                    className: el.className,
                    id: el.id,
                    visible: window.getComputedStyle(el).display !== 'none'
                }))
            };
        }
        return null;
    });

    console.log('DOM Analysis:', JSON.stringify(domStructure, null, 2));
    return false;
}

async function debugResearchTab(page) {
    console.log('\n🔍 Debugging Research Tab Issue...');

    // Click on Research tab
    const researchClicked = await page.$$eval('button', buttons => {
        const btn = buttons.find(b => {
            const text = b.textContent?.trim();
            return text === 'Research' || b.querySelector('span')?.textContent?.trim() === 'Research';
        });
        if (btn) {
            console.log('Found Research button:', btn.textContent);
            btn.click();
            return true;
        }
        return false;
    });

    if (!researchClicked) {
        console.log('❌ Could not find Research tab button');

        // List all buttons to debug
        const allButtons = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button')).map(btn => ({
                text: btn.textContent?.trim(),
                className: btn.className,
                visible: window.getComputedStyle(btn).display !== 'none'
            }));
        });

        console.log('All buttons found:', allButtons);
        return false;
    }

    await delay(1000);

    console.log('✅ Research tab clicked successfully');

    // Check if Research tab loaded
    const researchElements = await page.evaluate(() => {
        return {
            hasResearchHeading: !!document.querySelector('h2')?.textContent?.includes('Research'),
            hasQuickResearchButton: Array.from(document.querySelectorAll('button')).some(b =>
                b.textContent?.includes('Quick Research') || b.textContent?.includes('Research')
            ),
            hasResearchInput: !!document.querySelector('input[placeholder*="research" i]'),
            hasResearchForm: !!document.querySelector('form'),
            allHeadings: Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => h.textContent),
            researchButtons: Array.from(document.querySelectorAll('button')).filter(b =>
                b.textContent?.toLowerCase().includes('research')
            ).map(b => b.textContent)
        };
    });

    console.log('Research Tab Analysis:', JSON.stringify(researchElements, null, 2));

    if (researchElements.hasResearchHeading) {
        console.log('✅ Research tab loaded successfully');
        return true;
    } else {
        console.log('⚠️ Research tab may not have loaded correctly');
        return false;
    }
}

async function debugMainIssues() {
    const browser = await puppeteer.launch({
        headless: TEST_CONFIG.headless,
        devtools: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        // Enable console logging
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

        console.log('🔄 Loading BookCraft AI...');
        await page.goto(TEST_CONFIG.appUrl, { waitUntil: 'networkidle0' });

        console.log('✅ Application loaded');

        // Debug Lexical Editor
        const lexicalWorks = await debugLexicalEditor(page);

        // Take screenshot after lexical test
        await page.screenshot({ path: 'debug-lexical-editor.png', fullPage: true });

        // Debug Research Tab
        const researchWorks = await debugResearchTab(page);

        // Take screenshot after research test
        await page.screenshot({ path: 'debug-research-tab.png', fullPage: true });

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('DEBUGGING SUMMARY');
        console.log('='.repeat(50));
        console.log(`Lexical Editor Working: ${lexicalWorks ? '✅ YES' : '❌ NO'}`);
        console.log(`Research Tab Working: ${researchWorks ? '✅ YES' : '❌ NO'}`);

        if (!lexicalWorks) {
            console.log('\n🔧 LEXICAL EDITOR ISSUES:');
            console.log('- Editor may not be rendering when chapters are present');
            console.log('- Check ChapterEditorView component');
            console.log('- Verify LexicalEditor component mounting');
        }

        if (!researchWorks) {
            console.log('\n🔧 RESEARCH TAB ISSUES:');
            console.log('- Research tab navigation may be failing');
            console.log('- Check tab switching logic in ProjectWorkspace');
            console.log('- Verify ResearchTab component rendering');
        }

    } catch (error) {
        console.error('\n❌ Debug test failed:', error.message);
        const page = (await browser.pages())[0];
        if (page) {
            await page.screenshot({ path: 'debug-error-state.png', fullPage: true });
        }
    } finally {
        await browser.close();
    }
}

debugMainIssues();