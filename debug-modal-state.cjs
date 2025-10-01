/**
 * Debug script to check the current modal states in the application
 */

const { chromium } = require('playwright');

async function debugModalState() {
    console.log('🔍 Debugging Modal State...\n');

    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    try {
        // Navigate to app
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
        await page.waitForTimeout(3000);

        // Check for modal overlays
        const overlays = await page.$$('[role="dialog"], .modal, .fixed.inset-0');
        console.log(`📊 Found ${overlays.length} potential modal overlays`);

        for (let i = 0; i < overlays.length; i++) {
            const overlay = overlays[i];
            const isVisible = await overlay.isVisible();
            const className = await overlay.getAttribute('class');
            const role = await overlay.getAttribute('role');
            const zIndex = await overlay.evaluate(el => window.getComputedStyle(el).zIndex);
            
            console.log(`\n🔲 Overlay ${i + 1}:`);
            console.log(`   Visible: ${isVisible}`);
            console.log(`   Class: ${className}`);
            console.log(`   Role: ${role}`);
            console.log(`   Z-Index: ${zIndex}`);
            
            if (isVisible) {
                console.log(`   ⚠️ This overlay is VISIBLE and may be blocking interactions!`);
                
                // Try to get the content
                const textContent = await overlay.textContent();
                if (textContent && textContent.trim()) {
                    console.log(`   Content: ${textContent.substring(0, 100)}...`);
                }
            }
        }

        // Check application store state
        const storeState = await page.evaluate(() => {
            // Try to access the Zustand store state
            if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
                // Try to find the store in React DevTools
                return { message: 'React DevTools available' };
            }
            return { message: 'No store access' };
        });
        
        console.log(`\n📦 Store State: ${storeState.message}`);

        // Check for backdrop elements that might be intercepting clicks
        const backdrops = await page.$$('.backdrop, .modal-backdrop, [aria-modal="true"]');
        console.log(`\n🎭 Found ${backdrops.length} backdrop elements`);
        
        for (let i = 0; i < backdrops.length; i++) {
            const backdrop = backdrops[i];
            const isVisible = await backdrop.isVisible();
            const className = await backdrop.getAttribute('class');
            
            if (isVisible) {
                console.log(`   ⚠️ Backdrop ${i + 1} is visible: ${className}`);
            }
        }

        // Test if tabs are clickable
        const tabs = await page.$$('button:has-text("Writing Studio"), button:has-text("Plot"), button:has-text("Research")');
        console.log(`\n🗂️ Found ${tabs.length} workspace tabs`);
        
        for (let i = 0; i < tabs.length && i < 3; i++) {
            const tab = tabs[i];
            const text = await tab.textContent();
            const isEnabled = await tab.isEnabled();
            const isVisible = await tab.isVisible();
            
            console.log(`   Tab "${text}": Enabled=${isEnabled}, Visible=${isVisible}`);
            
            if (isVisible && isEnabled) {
                try {
                    // Test if we can click it
                    await tab.click({ timeout: 1000 });
                    console.log(`   ✅ Successfully clicked "${text}" tab`);
                } catch (error) {
                    console.log(`   ❌ Failed to click "${text}" tab: ${error.message}`);
                }
            }
        }

        await page.screenshot({ path: './debug-modal-state.png', fullPage: true });
        console.log('\n📸 Screenshot saved as debug-modal-state.png');

    } catch (error) {
        console.error('❌ Debug failed:', error);
    } finally {
        await browser.close();
    }
}

// Run the debug script
debugModalState().then(() => {
    console.log('\n✅ Debug completed!');
}).catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});