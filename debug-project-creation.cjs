/**
 * Debug script to test project creation workflow and modal issues
 */

const { chromium } = require('playwright');

async function debugProjectCreation() {
    console.log('🔍 Debugging Project Creation Workflow...\n');

    const browser = await chromium.launch({ headless: false, slowMo: 1000 });
    const page = await browser.newPage();

    try {
        // Navigate to app
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
        await page.waitForTimeout(3000);

        console.log('📍 Initial state - checking for overlays');
        const initialOverlays = await page.$$('[role="dialog"]');
        console.log(`   Found ${initialOverlays.length} modal overlays initially`);

        // Try to click "New Project" button
        console.log('\n📝 Attempting to create a new project...');
        
        const newProjectButton = await page.$('button:has-text("New Project")') || 
                                await page.$('button:has-text("Create Your First Project")');
        
        if (newProjectButton) {
            await newProjectButton.click();
            await page.waitForTimeout(2000);
            
            console.log('📍 After clicking New Project button');
            const afterClickOverlays = await page.$$('[role="dialog"]');
            console.log(`   Found ${afterClickOverlays.length} modal overlays after click`);
            
            // Check if project creation modal opened
            const modal = await page.$('[role="dialog"]');
            if (modal) {
                const modalVisible = await modal.isVisible();
                const modalContent = await modal.textContent();
                console.log(`   Modal visible: ${modalVisible}`);
                console.log(`   Modal contains: ${modalContent.substring(0, 100)}...`);
                
                // Fill the form if visible
                const titleInput = await page.$('input[name="title"], input#title');
                if (titleInput) {
                    console.log('   ✅ Title input found, filling form...');
                    await titleInput.fill('Debug Test Project');
                    
                    // Try to submit
                    const submitButton = await page.$('button[type="submit"], button:has-text("Create")');
                    if (submitButton) {
                        console.log('   🔧 Forcing submit button click...');
                        await submitButton.click({ force: true });
                        await page.waitForTimeout(3000);
                        
                        console.log('📍 After submitting project form');
                        const postSubmitOverlays = await page.$$('[role="dialog"]');
                        console.log(`   Found ${postSubmitOverlays.length} modal overlays after submit`);
                        
                        // Take screenshot
                        await page.screenshot({ path: './debug-after-project-creation.png', fullPage: true });
                        console.log('   📸 Screenshot: debug-after-project-creation.png');
                    } else {
                        console.log('   ❌ No submit button found');
                    }
                } else {
                    console.log('   ❌ No title input found - form fields missing!');
                    
                    // Check what fields are available
                    const inputs = await page.$$('input, textarea, select');
                    console.log(`   Found ${inputs.length} form elements in modal:`);
                    for (let i = 0; i < inputs.length; i++) {
                        const input = inputs[i];
                        const name = await input.getAttribute('name');
                        const id = await input.getAttribute('id');
                        const placeholder = await input.getAttribute('placeholder');
                        console.log(`     ${i + 1}. name="${name}" id="${id}" placeholder="${placeholder}"`);
                    }
                }
            } else {
                console.log('   ❌ No modal found after clicking New Project');
            }
            
        } else {
            console.log('❌ New Project button not found');
        }
        
        // Now test workspace tab navigation
        console.log('\n🗂️ Testing workspace tab navigation...');
        
        const tabs = ['Writing Studio', 'Plot', 'Research', 'Visuals'];
        for (const tabName of tabs) {
            const tab = await page.$(`button:has-text("${tabName}")`);
            if (tab) {
                const isEnabled = await tab.isEnabled();
                console.log(`   ${tabName}: ${isEnabled ? 'Enabled' : 'Disabled'}`);
                
                if (isEnabled) {
                    try {
                        await tab.click();
                        await page.waitForTimeout(1000);
                        
                        // Check if modal appeared after clicking tab
                        const tabClickOverlays = await page.$$('[role="dialog"]');
                        if (tabClickOverlays.length > 0) {
                            console.log(`     ⚠️ ${tabClickOverlays.length} modal overlays appeared after clicking ${tabName}!`);
                            
                            for (let i = 0; i < tabClickOverlays.length; i++) {
                                const overlay = tabClickOverlays[i];
                                const className = await overlay.getAttribute('class');
                                const isVisible = await overlay.isVisible();
                                console.log(`       Overlay ${i + 1}: visible=${isVisible}, class="${className}"`);
                            }
                        } else {
                            console.log(`     ✅ ${tabName} clicked successfully, no modal overlays`);
                        }
                        
                    } catch (error) {
                        console.log(`     ❌ Failed to click ${tabName}: ${error.message}`);
                    }
                }
            }
        }

        await page.screenshot({ path: './debug-final-state.png', fullPage: true });
        console.log('\n📸 Final screenshot: debug-final-state.png');

    } catch (error) {
        console.error('❌ Debug failed:', error);
        await page.screenshot({ path: './debug-error-state.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

// Run the debug script
debugProjectCreation().then(() => {
    console.log('\n✅ Debug completed!');
}).catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});