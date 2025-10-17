const puppeteer = require('puppeteer');
const path = require('path');

async function analyzeModalStateManagement() {
    console.log('🔍 Starting Modal State Management Analysis...\n');

    let browser;
    try {
        // Launch browser
        browser = await puppeteer.launch({
            headless: false,
            devtools: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });

        // Navigate to the app
        const indexPath = `file://${path.resolve(__dirname, 'index.html')}`;
        console.log(`📁 Loading app from: ${indexPath}`);
        await page.goto(indexPath, { waitUntil: 'networkidle0' });

        console.log('✅ App loaded successfully\n');

        // Test 1: Check if Create Project Modal can be opened
        console.log('🧪 Test 1: Opening Create Project Modal');
        try {
            // Look for the "New Project" button
            await page.waitForSelector('button', { timeout: 5000 });

            // Find the button that says "New Project" or "Create Your First Project"
            const newProjectButton = await page.$x('//button[contains(text(), "New Project") or contains(text(), "Create Your First Project")]');

            if (newProjectButton.length > 0) {
                console.log('   ✅ Found New Project button');
                await newProjectButton[0].click();
                await page.waitForTimeout(500);

                // Check if modal is open
                const modal = await page.$('[data-testid="modal"], .fixed.inset-0, [role="dialog"]');
                if (modal) {
                    console.log('   ✅ Create Project Modal opened successfully');

                    // Check if modal can be closed
                    const closeButton = await page.$('button[aria-label="Close"], button:has-text("Cancel"), .modal-close');
                    if (closeButton) {
                        await closeButton.click();
                        await page.waitForTimeout(500);

                        const modalAfterClose = await page.$('[data-testid="modal"], .fixed.inset-0, [role="dialog"]');
                        if (!modalAfterClose) {
                            console.log('   ✅ Modal closed successfully');
                        } else {
                            console.log('   ❌ Modal did not close properly - PERSISTENT MODAL DETECTED');
                        }
                    } else {
                        console.log('   ⚠️  Close button not found');
                    }
                } else {
                    console.log('   ❌ Create Project Modal did not open - MODAL CREATION BROKEN');
                }
            } else {
                console.log('   ❌ New Project button not found');
            }
        } catch (error) {
            console.log(`   ❌ Error in Create Project Modal test: ${error.message}`);
        }

        // Test 2: Check for multiple modals or overlapping state
        console.log('\n🧪 Test 2: Testing Modal State Conflicts');
        try {
            // Check store state in browser console
            const storeState = await page.evaluate(() => {
                // Access Zustand store if available
                if (window.__ZUSTAND_DEVTOOLS_STORE__) {
                    const state = window.__ZUSTAND_DEVTOOLS_STORE__.getState();
                    return {
                        isCreateModalOpen: state.isCreateModalOpen,
                        isLoading: state.isLoading,
                        generatingVisualFor: state.generatingVisualFor,
                        isGeneratingImage: state.isGeneratingImage,
                        isSuggestingVisual: state.isSuggestingVisual,
                        isAnalyzingChapter: state.isAnalyzingChapter,
                        isResearching: state.isResearching,
                        isFactChecking: state.isFactChecking,
                        researchSidebarOpen: state.researchSidebarOpen
                    };
                }
                return null;
            });

            if (storeState) {
                console.log('   📊 Current store modal/UI state:');
                Object.entries(storeState).forEach(([key, value]) => {
                    const status = value ? '🔴 ACTIVE' : '🟢 INACTIVE';
                    console.log(`      ${key}: ${status}`);
                });

                // Check for potentially problematic states
                const activeStates = Object.entries(storeState).filter(([key, value]) => value).length;
                if (activeStates > 1) {
                    console.log('   ⚠️  Multiple UI states active simultaneously - potential conflict');
                } else if (activeStates === 0) {
                    console.log('   ✅ Clean state - no modal/UI states active');
                } else {
                    console.log('   ✅ Single state active - normal');
                }
            } else {
                console.log('   ⚠️  Could not access store state');
            }
        } catch (error) {
            console.log(`   ❌ Error checking store state: ${error.message}`);
        }

        // Test 3: Test multiple modal open/close cycles
        console.log('\n🧪 Test 3: Testing Modal State Persistence');
        for (let i = 1; i <= 3; i++) {
            try {
                console.log(`   🔄 Modal cycle ${i}/3`);

                // Try to open modal
                const newProjectButton = await page.$x('//button[contains(text(), "New Project") or contains(text(), "Create Your First Project")]');
                if (newProjectButton.length > 0) {
                    await newProjectButton[0].click();
                    await page.waitForTimeout(300);

                    // Check if modal opened
                    const modal = await page.$('[data-testid="modal"], .fixed.inset-0, [role="dialog"]');
                    if (modal) {
                        console.log(`      ✅ Cycle ${i}: Modal opened`);

                        // Try to close modal
                        const closeButton = await page.$('button[aria-label="Close"], button:has-text("Cancel")');
                        if (closeButton) {
                            await closeButton.click();
                            await page.waitForTimeout(300);

                            const modalAfterClose = await page.$('[data-testid="modal"], .fixed.inset-0, [role="dialog"]');
                            if (!modalAfterClose) {
                                console.log(`      ✅ Cycle ${i}: Modal closed`);
                            } else {
                                console.log(`      ❌ Cycle ${i}: Modal persisted after close`);
                                break;
                            }
                        } else {
                            console.log(`      ⚠️  Cycle ${i}: Close button not found`);
                        }
                    } else {
                        console.log(`      ❌ Cycle ${i}: Modal failed to open`);
                    }
                } else {
                    console.log(`      ❌ Cycle ${i}: New Project button not found`);
                }
            } catch (error) {
                console.log(`      ❌ Cycle ${i}: Error - ${error.message}`);
            }
        }

        // Test 4: Check for DOM cleanup
        console.log('\n🧪 Test 4: DOM Modal Cleanup Analysis');
        try {
            const modalElements = await page.$$eval('*', (elements) => {
                return elements.filter(el => {
                    const classList = el.className || '';
                    const id = el.id || '';
                    return classList.includes('modal') ||
                           classList.includes('fixed inset-0') ||
                           id.includes('modal') ||
                           el.getAttribute('role') === 'dialog';
                }).map(el => ({
                    tag: el.tagName,
                    class: el.className,
                    id: el.id,
                    visible: el.offsetParent !== null
                }));
            });

            console.log(`   📊 Found ${modalElements.length} modal-like DOM elements:`);
            modalElements.forEach((el, index) => {
                const visibility = el.visible ? '👁️  VISIBLE' : '👁️‍🗨️ HIDDEN';
                console.log(`      ${index + 1}: ${el.tag} - ${visibility}`);
                if (el.class) console.log(`         Class: ${el.class}`);
                if (el.id) console.log(`         ID: ${el.id}`);
            });

            const visibleModals = modalElements.filter(el => el.visible);
            if (visibleModals.length > 1) {
                console.log('   ❌ Multiple visible modals detected - potential overlay issue');
            } else if (visibleModals.length === 1) {
                console.log('   ⚠️  One modal currently visible');
            } else {
                console.log('   ✅ No visible modals - clean DOM state');
            }
        } catch (error) {
            console.log(`   ❌ Error analyzing DOM cleanup: ${error.message}`);
        }

        // Test 5: Check localStorage persistence
        console.log('\n🧪 Test 5: LocalStorage State Persistence');
        try {
            const persistedState = await page.evaluate(() => {
                const stored = localStorage.getItem('bookcraft-storage');
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        return {
                            hasState: true,
                            stateKeys: Object.keys(parsed.state || {}),
                            modalStates: {
                                isCreateModalOpen: parsed.state?.isCreateModalOpen,
                                isLoading: parsed.state?.isLoading,
                                researchSidebarOpen: parsed.state?.researchSidebarOpen
                            }
                        };
                    } catch (e) {
                        return { hasState: false, error: 'Parse error' };
                    }
                }
                return { hasState: false };
            });

            if (persistedState.hasState) {
                console.log('   📊 LocalStorage state found:');
                console.log(`      Keys: ${persistedState.stateKeys.join(', ')}`);
                console.log('      Modal states in localStorage:');
                Object.entries(persistedState.modalStates).forEach(([key, value]) => {
                    if (value !== undefined) {
                        const status = value ? '🔴 PERSISTED AS ACTIVE' : '🟢 PERSISTED AS INACTIVE';
                        console.log(`        ${key}: ${status}`);
                    }
                });
            } else {
                console.log('   📊 No persisted state found in localStorage');
            }
        } catch (error) {
            console.log(`   ❌ Error checking localStorage: ${error.message}`);
        }

    } catch (error) {
        console.error('💥 Critical error during analysis:', error);
    } finally {
        if (browser) {
            console.log('\n🏁 Analysis complete. Browser will remain open for 10 seconds for inspection...');
            await new Promise(resolve => setTimeout(resolve, 10000));
            await browser.close();
        }
    }
}

// Run the analysis
analyzeModalStateManagement().catch(console.error);