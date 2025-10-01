const { chromium } = require('@playwright/test');

async function testAIFeatures() {
    let browser;
    
    try {
        console.log('🚀 Starting AI Features Test...');
        
        browser = await chromium.launch({ 
            headless: false, 
            slowMo: 1000,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
        });
        
        const page = await browser.newPage();
        await page.goto('http://localhost:5174');
        
        // Wait for app to load
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        console.log('✅ App loaded successfully');
        
        // Create a project first
        console.log('📝 Creating a test project...');
        
        const createButton = await page.locator('[data-testid="create-project-btn"], button:has-text("Create Project"), button:has-text("New Project")').first();
        if (await createButton.isVisible({ timeout: 5000 })) {
            await createButton.click();
            await page.waitForTimeout(2000);
            
            // Fill project details
            await page.fill('input[name="title"], input[id="title"], input[placeholder*="title" i]', 'AI Test Project');
            await page.waitForTimeout(1000);
            
            // Submit form - use force click to bypass overlay issues
            const submitBtn = await page.locator('button[type="submit"], button:has-text("Create")').first();
            try {
                await submitBtn.click({ force: true, timeout: 5000 });
            } catch (error) {
                console.log('Regular click failed, trying alternative methods...');
                // Try clicking with force at specific coordinates
                const box = await submitBtn.boundingBox();
                if (box) {
                    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { force: true });
                }
            }
            await page.waitForTimeout(3000);
        }
        
        // Check if we can navigate to a workspace area
        console.log('🔍 Looking for workspace/chapter editor...');
        
        // Try to find tabs or navigation elements
        const tabs = await page.locator('[role="tablist"], [data-testid*="tab"], a:has-text("Chapter"), button:has-text("Chapter")').all();
        if (tabs.length > 0) {
            console.log(`Found ${tabs.length} potential navigation elements`);
            // Try to click the first one
            await tabs[0].click();
            await page.waitForTimeout(2000);
        }
        
        // Look for AI-related buttons and features
        console.log('🤖 Checking AI features visibility...');
        
        const aiFeatures = [
            'Generate',
            'Assistant', 
            'AI',
            'SparklesIcon',
            'Clean & Format',
            'Visual Analysis',
            'Chapter Structure'
        ];
        
        const results = {};
        
        for (const feature of aiFeatures) {
            try {
                const element = await page.locator(`button:has-text("${feature}"), [aria-label*="${feature}"], [title*="${feature}"]`).first();
                const isVisible = await element.isVisible({ timeout: 2000 });
                results[feature] = {
                    visible: isVisible,
                    count: await page.locator(`button:has-text("${feature}"), [aria-label*="${feature}"], [title*="${feature}"]`).count()
                };
                console.log(`${isVisible ? '✅' : '❌'} ${feature}: ${isVisible ? 'Visible' : 'Not found'} (${results[feature].count} elements)`);
            } catch (error) {
                results[feature] = { visible: false, error: error.message };
                console.log(`❌ ${feature}: Error - ${error.message}`);
            }
        }
        
        // Take screenshot
        await page.screenshot({ path: 'ai-features-test.png', fullPage: true });
        console.log('📸 Screenshot saved: ai-features-test.png');
        
        // Check if workspace is accessible
        console.log('📊 Checking workspace accessibility...');
        
        const workspaceElements = await page.locator('.workspace, [class*="workspace"], [data-testid*="workspace"], [role="main"]').all();
        console.log(`Found ${workspaceElements.length} workspace-like elements`);
        
        // Check for lexical editor
        const editorElements = await page.locator('[contenteditable="true"], .lexical-editor, [class*="editor"]').all();
        console.log(`Found ${editorElements.length} editor elements`);
        
        // Summary
        console.log('\n📋 AI Features Test Summary:');
        console.log('============================');
        
        const visibleFeatures = Object.entries(results).filter(([_, data]) => data.visible).length;
        const totalFeatures = Object.keys(results).length;
        
        console.log(`AI Features Visible: ${visibleFeatures}/${totalFeatures}`);
        console.log(`Workspace Elements: ${workspaceElements.length}`);
        console.log(`Editor Elements: ${editorElements.length}`);
        
        if (visibleFeatures === 0) {
            console.log('\n🔍 Detailed Analysis:');
            console.log('No AI features visible. This could mean:');
            console.log('1. Modal overlay blocking interactions');
            console.log('2. Workspace not accessible after project creation');
            console.log('3. Components not rendering due to missing dependencies');
            console.log('4. State management issues preventing UI updates');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the test
testAIFeatures().catch(console.error);