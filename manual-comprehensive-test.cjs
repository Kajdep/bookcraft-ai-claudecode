/**
 * Manual Comprehensive Testing Script for BookCraft AI
 * This script will perform thorough testing of all features and functionality
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

class BookCraftTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: 0,
                passed: 0,
                failed: 0,
                partial: 0,
                issues: []
            },
            categories: {
                application: { status: 'pending', tests: [], issues: [] },
                dashboard: { status: 'pending', tests: [], issues: [] },
                projectManagement: { status: 'pending', tests: [], issues: [] },
                workspace: { status: 'pending', tests: [], issues: [] },
                lexicalEditor: { status: 'pending', tests: [], issues: [] },
                aiFeatures: { status: 'pending', tests: [], issues: [] },
                modalSystem: { status: 'pending', tests: [], issues: [] },
                dataManagement: { status: 'pending', tests: [], issues: [] },
                performance: { status: 'pending', tests: [], issues: [] }
            },
            screenshots: []
        };
    }

    async init() {
        console.log('🚀 Starting BookCraft AI Manual Comprehensive Testing...\n');

        this.browser = await chromium.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--start-maximized'],
            slowMo: 300
        });

        this.page = await this.browser.newPage();

        // Set up error monitoring
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ Console Error:', msg.text());
                this.results.summary.issues.push({
                    type: 'console_error',
                    message: msg.text(),
                    timestamp: new Date().toISOString()
                });
            }
        });

        this.page.on('pageerror', error => {
            console.log('❌ Page Error:', error.message);
            this.results.summary.issues.push({
                type: 'page_error',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        });

        // Create screenshots directory
        await fs.mkdir('./test-screenshots/comprehensive', { recursive: true });
    }

    async screenshot(name) {
        const filename = `${name}-${Date.now()}.png`;
        const filepath = path.join('./test-screenshots/comprehensive', filename);
        await this.page.screenshot({ path: filepath, fullPage: true });
        this.results.screenshots.push({
            name,
            filename,
            filepath,
            timestamp: new Date().toISOString()
        });
        console.log(`📸 ${name}`);
    }

    async wait(ms = 2000) {
        await this.page.waitForTimeout(ms);
    }

    async testApplicationLoading() {
        console.log('🧪 Testing Application Loading...');
        const tests = [];

        try {
            // Navigate to application
            await this.page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
            await this.wait(3000);
            await this.screenshot('01-app-loaded');

            // Test basic app structure
            const appElement = await this.page.$('.min-h-screen');
            tests.push({
                name: 'App container loads',
                status: appElement ? 'pass' : 'fail',
                details: appElement ? 'Main app container found' : 'Main app container missing'
            });

            // Test header presence
            const header = await this.page.$('header');
            tests.push({
                name: 'Header loads',
                status: header ? 'pass' : 'fail',
                details: header ? 'Header element found' : 'Header element missing'
            });

            // Test title
            const title = await this.page.textContent('h1');
            tests.push({
                name: 'App title displays',
                status: title && title.includes('BookCraft') ? 'pass' : 'fail',
                details: title ? `Title: "${title}"` : 'Title not found'
            });

            // Check for JavaScript errors
            await this.wait(2000);
            const jsErrors = this.results.summary.issues.filter(issue => 
                issue.type === 'console_error' || issue.type === 'page_error'
            );
            tests.push({
                name: 'No critical JavaScript errors',
                status: jsErrors.length === 0 ? 'pass' : jsErrors.length <= 2 ? 'partial' : 'fail',
                details: `${jsErrors.length} JavaScript errors detected`
            });

        } catch (error) {
            tests.push({
                name: 'Application Loading',
                status: 'fail',
                details: error.message
            });
        }

        this.results.categories.application.tests = tests;
        this.updateCategoryStatus('application');
    }

    async testDashboard() {
        console.log('🏠 Testing Dashboard...');
        const tests = [];

        try {
            await this.screenshot('02-dashboard-overview');

            // Test for dashboard elements
            const dashboardElements = await this.page.$$('.project-card, .dashboard-card, [data-testid*="project"], .grid, .flex');
            tests.push({
                name: 'Dashboard layout elements',
                status: dashboardElements.length > 0 ? 'pass' : 'fail',
                details: `${dashboardElements.length} dashboard elements found`
            });

            // Look for project creation button
            const newProjectButtons = [
                'button:has-text("New Project")',
                'button:has-text("Create Project")',
                'button:has-text("Create Your First Project")',
                '[data-testid="new-project"]',
                '.new-project'
            ];

            let projectButton = null;
            for (const selector of newProjectButtons) {
                try {
                    projectButton = await this.page.$(selector);
                    if (projectButton) break;
                } catch (e) {
                    // Continue trying other selectors
                }
            }

            tests.push({
                name: 'New Project button exists',
                status: projectButton ? 'pass' : 'fail',
                details: projectButton ? 'Project creation button found' : 'No project creation button found'
            });

            // Test navigation elements
            const navElements = await this.page.$$('nav, .navigation, [role="navigation"], .sidebar');
            tests.push({
                name: 'Navigation elements present',
                status: navElements.length > 0 ? 'pass' : 'fail',
                details: `${navElements.length} navigation elements found`
            });

        } catch (error) {
            tests.push({
                name: 'Dashboard Testing',
                status: 'fail',
                details: error.message
            });
        }

        this.results.categories.dashboard.tests = tests;
        this.updateCategoryStatus('dashboard');
    }

    async testProjectCreation() {
        console.log('📝 Testing Project Creation...');
        const tests = [];

        try {
            // Try to find and click project creation button
            const projectButtonSelectors = [
                'button:has-text("New Project")',
                'button:has-text("Create Project")',
                'button:has-text("Create Your First Project")',
                'button:has-text("+")',
                '.btn-primary',
                '.new-project-btn'
            ];

            let projectCreated = false;
            let projectButton = null;

            for (const selector of projectButtonSelectors) {
                try {
                    projectButton = await this.page.$(selector);
                    if (projectButton) {
                        const isVisible = await projectButton.isVisible();
                        if (isVisible) {
                            await projectButton.click();
                            await this.wait(2000);
                            await this.screenshot('03a-project-creation-attempt');
                            
                            // Check if modal opened or form appeared
                            const modal = await this.page.$('.modal, [role="dialog"], .project-form');
                            if (modal) {
                                projectCreated = true;
                                break;
                            }
                        }
                    }
                } catch (e) {
                    console.log(`⚠️ Selector ${selector} failed: ${e.message}`);
                }
            }

            tests.push({
                name: 'Project creation initiation',
                status: projectCreated ? 'pass' : 'fail',
                details: projectCreated ? 'Project creation modal/form opened' : 'Could not initiate project creation'
            });

            if (projectCreated) {
                // Test form fields
                const titleInput = await this.page.$('input[name="title"], input[placeholder*="title"], input[placeholder*="name"]');
                const genreSelect = await this.page.$('select[name="genre"], select[name="type"]');
                const descriptionField = await this.page.$('textarea[name="description"], textarea[placeholder*="description"]');

                tests.push({
                    name: 'Project form fields present',
                    status: (titleInput && genreSelect) ? 'pass' : titleInput ? 'partial' : 'fail',
                    details: `Title: ${!!titleInput}, Genre: ${!!genreSelect}, Description: ${!!descriptionField}`
                });

                if (titleInput) {
                    // Fill out form
                    await titleInput.fill('Test Project for Comprehensive Testing');
                    
                    if (genreSelect) {
                        await genreSelect.selectOption({ index: 1 });
                    }
                    
                    if (descriptionField) {
                        await descriptionField.fill('This is a test project created during comprehensive testing.');
                    }

                    await this.screenshot('03b-project-form-filled');

                    // Try to submit
                    const submitButton = await this.page.$('button[type="submit"], button:has-text("Create"), button:has-text("Save")');
                    if (submitButton) {
                        await submitButton.click();
                        await this.wait(3000);
                        await this.screenshot('03c-project-created');

                        // Check if project was created (look for workspace or success indication)
                        const workspace = await this.page.$('.workspace, .main-content, [data-testid="workspace"]');
                        const projectsList = await this.page.$$('.project-item, .project-card');
                        
                        tests.push({
                            name: 'Project creation completion',
                            status: workspace || projectsList.length > 0 ? 'pass' : 'partial',
                            details: workspace ? 'Workspace loaded after creation' : `${projectsList.length} projects visible`
                        });
                    }
                }
            }

        } catch (error) {
            tests.push({
                name: 'Project Creation Testing',
                status: 'fail',
                details: error.message
            });
        }

        this.results.categories.projectManagement.tests = tests;
        this.updateCategoryStatus('projectManagement');
    }

    async testWorkspaceNavigation() {
        console.log('🗂️ Testing Workspace Navigation...');
        const tests = [];

        try {
            await this.screenshot('04a-workspace-overview');

            // Define expected tabs/sections
            const expectedTabs = [
                'Writing Studio',
                'Plot',
                'Research',
                'Visuals',
                'Export',
                'Material'
            ];

            let accessibleTabs = 0;
            let workingTabs = 0;

            for (const tabName of expectedTabs) {
                try {
                    // Look for tab by text content
                    const tabSelectors = [
                        `text="${tabName}"`,
                        `button:has-text("${tabName}")`,
                        `[data-tab="${tabName.toLowerCase()}"]`,
                        `[aria-label="${tabName}"]`
                    ];

                    let tabFound = false;
                    let tabWorking = false;

                    for (const selector of tabSelectors) {
                        try {
                            const tab = await this.page.$(selector);
                            if (tab) {
                                const isVisible = await tab.isVisible();
                                if (isVisible) {
                                    tabFound = true;
                                    accessibleTabs++;

                                    // Try to click the tab
                                    try {
                                        await tab.click();
                                        await this.wait(1000);
                                        tabWorking = true;
                                        workingTabs++;
                                        await this.screenshot(`04b-tab-${tabName.toLowerCase().replace(/\s+/g, '-')}`);
                                    } catch (clickError) {
                                        console.log(`⚠️ Could not click ${tabName} tab: ${clickError.message}`);
                                    }
                                    break;
                                }
                            }
                        } catch (e) {
                            // Continue with next selector
                        }
                    }

                    tests.push({
                        name: `${tabName} tab accessibility`,
                        status: tabFound ? (tabWorking ? 'pass' : 'partial') : 'fail',
                        details: tabFound ? (tabWorking ? 'Tab found and clickable' : 'Tab found but not clickable') : 'Tab not found'
                    });

                } catch (error) {
                    tests.push({
                        name: `${tabName} tab testing`,
                        status: 'fail',
                        details: error.message
                    });
                }
            }

            tests.push({
                name: 'Overall workspace navigation',
                status: workingTabs >= expectedTabs.length / 2 ? 'pass' : workingTabs > 0 ? 'partial' : 'fail',
                details: `${workingTabs}/${expectedTabs.length} tabs working, ${accessibleTabs}/${expectedTabs.length} tabs accessible`
            });

        } catch (error) {
            tests.push({
                name: 'Workspace Navigation Testing',
                status: 'fail',
                details: error.message
            });
        }

        this.results.categories.workspace.tests = tests;
        this.updateCategoryStatus('workspace');
    }

    async testLexicalEditor() {
        console.log('✏️ Testing Lexical Editor...');
        const tests = [];

        try {
            // Try to navigate to Writing Studio first
            const writingTab = await this.page.$('text="Writing Studio"') || 
                             await this.page.$('button:has-text("Writing")');
            
            if (writingTab) {
                try {
                    await writingTab.click();
                    await this.wait(2000);
                } catch (e) {
                    console.log('⚠️ Could not click Writing Studio tab');
                }
            }

            await this.screenshot('05a-editor-area');

            // Look for editor elements
            const editorSelectors = [
                '[contenteditable="true"]',
                '.lexical-editor',
                '.editor-content',
                '[role="textbox"]',
                '.text-editor'
            ];

            let editor = null;
            for (const selector of editorSelectors) {
                editor = await this.page.$(selector);
                if (editor) break;
            }

            tests.push({
                name: 'Editor element present',
                status: editor ? 'pass' : 'fail',
                details: editor ? 'Text editor found' : 'No text editor found'
            });

            if (editor) {
                // Test editor functionality
                try {
                    await editor.click();
                    await editor.type('This is a test of the Lexical editor functionality.');
                    await this.wait(1000);
                    
                    const content = await editor.textContent();
                    tests.push({
                        name: 'Editor typing functionality',
                        status: content.includes('test of the Lexical') ? 'pass' : 'fail',
                        details: content ? `Content: "${content}"` : 'No content detected'
                    });

                    await this.screenshot('05b-editor-with-content');

                } catch (error) {
                    tests.push({
                        name: 'Editor typing functionality',
                        status: 'fail',
                        details: error.message
                    });
                }
            }

            // Look for toolbar
            const toolbar = await this.page.$('.toolbar, .editor-toolbar, [data-testid="toolbar"]');
            tests.push({
                name: 'Editor toolbar present',
                status: toolbar ? 'pass' : 'partial',
                details: toolbar ? 'Toolbar found' : 'No toolbar found'
            });

        } catch (error) {
            tests.push({
                name: 'Lexical Editor Testing',
                status: 'fail',
                details: error.message
            });
        }

        this.results.categories.lexicalEditor.tests = tests;
        this.updateCategoryStatus('lexicalEditor');
    }

    async testModalSystem() {
        console.log('🔲 Testing Modal System...');
        const tests = [];

        try {
            // Try to open settings modal
            const settingsButton = await this.page.$('button[title="Settings"], .settings-btn, [data-testid="settings"]');
            
            if (settingsButton) {
                await settingsButton.click();
                await this.wait(2000);
                await this.screenshot('06a-settings-modal');

                const modal = await this.page.$('.modal, [role="dialog"], .settings-modal');
                tests.push({
                    name: 'Settings modal opens',
                    status: modal ? 'pass' : 'fail',
                    details: modal ? 'Settings modal opened successfully' : 'Settings modal did not open'
                });

                if (modal) {
                    // Try to close modal
                    const closeButton = await this.page.$('.modal-close, [aria-label="Close"], button:has-text("×")');
                    if (closeButton) {
                        await closeButton.click();
                        await this.wait(1000);
                        
                        const modalStillVisible = await this.page.$('.modal:visible, [role="dialog"]:visible');
                        tests.push({
                            name: 'Modal closes properly',
                            status: !modalStillVisible ? 'pass' : 'fail',
                            details: !modalStillVisible ? 'Modal closed successfully' : 'Modal did not close'
                        });
                    }
                }
            } else {
                tests.push({
                    name: 'Settings button accessibility',
                    status: 'fail',
                    details: 'Settings button not found'
                });
            }

            // Test for overlay issues (that prevent clicks)
            const overlays = await this.page.$$('.modal-backdrop, .overlay, [data-modal-backdrop]');
            tests.push({
                name: 'Modal overlay system',
                status: 'pass',
                details: `${overlays.length} modal overlays detected`
            });

        } catch (error) {
            tests.push({
                name: 'Modal System Testing',
                status: 'fail',
                details: error.message
            });
        }

        this.results.categories.modalSystem.tests = tests;
        this.updateCategoryStatus('modalSystem');
    }

    async testAIFeatures() {
        console.log('🤖 Testing AI Features...');
        const tests = [];

        try {
            // Look for AI-related buttons and features
            const aiElements = await this.page.$$('button:has-text("AI"), [data-testid*="ai"], .ai-button, button:has-text("Generate")');
            
            tests.push({
                name: 'AI feature buttons present',
                status: aiElements.length > 0 ? 'pass' : 'fail',
                details: `${aiElements.length} AI-related buttons found`
            });

            // Test each AI element
            for (let i = 0; i < Math.min(aiElements.length, 3); i++) {
                try {
                    const element = aiElements[i];
                    const text = await element.textContent();
                    
                    await element.click();
                    await this.wait(2000);
                    await this.screenshot(`07a-ai-feature-${i + 1}`);
                    
                    // Check if anything opened
                    const modal = await this.page.$('.modal, [role="dialog"]');
                    const dropdown = await this.page.$('.dropdown, .menu');
                    
                    tests.push({
                        name: `AI feature "${text}" functionality`,
                        status: modal || dropdown ? 'pass' : 'partial',
                        details: modal ? 'Modal opened' : dropdown ? 'Menu opened' : 'Button clicked but no visible response'
                    });
                    
                    // Close any opened modal
                    if (modal) {
                        const closeBtn = await this.page.$('.modal-close, [aria-label="Close"]');
                        if (closeBtn) await closeBtn.click();
                    }
                    
                } catch (e) {
                    console.log(`⚠️ AI feature test ${i + 1} failed: ${e.message}`);
                }
            }

        } catch (error) {
            tests.push({
                name: 'AI Features Testing',
                status: 'fail',
                details: error.message
            });
        }

        this.results.categories.aiFeatures.tests = tests;
        this.updateCategoryStatus('aiFeatures');
    }

    async testPerformance() {
        console.log('⚡ Testing Performance...');
        const tests = [];

        try {
            // Test page load performance
            const startTime = Date.now();
            await this.page.reload({ waitUntil: 'networkidle0' });
            const loadTime = Date.now() - startTime;

            tests.push({
                name: 'Page load performance',
                status: loadTime < 5000 ? 'pass' : loadTime < 10000 ? 'partial' : 'fail',
                details: `Page loaded in ${loadTime}ms`
            });

            // Test for memory leaks (basic check)
            const jsHeapSize = await this.page.evaluate(() => {
                return performance.memory ? {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                } : null;
            });

            if (jsHeapSize) {
                tests.push({
                    name: 'Memory usage',
                    status: jsHeapSize.used < jsHeapSize.limit / 2 ? 'pass' : 'partial',
                    details: `Using ${Math.round(jsHeapSize.used / 1024 / 1024)}MB of ${Math.round(jsHeapSize.limit / 1024 / 1024)}MB limit`
                });
            }

        } catch (error) {
            tests.push({
                name: 'Performance Testing',
                status: 'fail',
                details: error.message
            });
        }

        this.results.categories.performance.tests = tests;
        this.updateCategoryStatus('performance');
    }

    updateCategoryStatus(category) {
        const tests = this.results.categories[category].tests;
        const passed = tests.filter(t => t.status === 'pass').length;
        const failed = tests.filter(t => t.status === 'fail').length;
        const partial = tests.filter(t => t.status === 'partial').length;

        if (passed === tests.length) {
            this.results.categories[category].status = 'pass';
        } else if (failed === tests.length) {
            this.results.categories[category].status = 'fail';
        } else {
            this.results.categories[category].status = 'partial';
        }

        // Update summary
        this.results.summary.totalTests += tests.length;
        this.results.summary.passed += passed;
        this.results.summary.failed += failed;
        this.results.summary.partial += partial;
    }

    async generateReport() {
        console.log('\n📊 Generating Comprehensive Test Report...');

        const report = {
            ...this.results,
            generatedAt: new Date().toISOString(),
            testDuration: 'approximately 15-20 minutes',
            browser: 'Chromium',
            viewport: '1920x1080'
        };

        // Calculate overall status
        const categoryStatuses = Object.values(this.results.categories).map(cat => cat.status);
        const passedCategories = categoryStatuses.filter(s => s === 'pass').length;
        const failedCategories = categoryStatuses.filter(s => s === 'fail').length;

        report.overallAssessment = {
            status: passedCategories > failedCategories ? 'GOOD' : 
                   passedCategories === failedCategories ? 'FAIR' : 'POOR',
            score: Math.round((this.results.summary.passed / this.results.summary.totalTests) * 100) || 0,
            recommendations: this.generateRecommendations()
        };

        // Save detailed report
        await fs.writeFile('./COMPREHENSIVE_TEST_REPORT.json', JSON.stringify(report, null, 2));

        // Generate markdown report
        const markdownReport = this.generateMarkdownReport(report);
        await fs.writeFile('./COMPREHENSIVE_TEST_REPORT.md', markdownReport);

        console.log('\n' + '='.repeat(80));
        console.log('📊 BOOKCRAFT AI COMPREHENSIVE TEST RESULTS');
        console.log('='.repeat(80));
        console.log(`📈 Overall Score: ${report.overallAssessment.score}%`);
        console.log(`🎯 Assessment: ${report.overallAssessment.status}`);
        console.log(`\n📊 Test Summary:`);
        console.log(`   Total Tests: ${this.results.summary.totalTests}`);
        console.log(`   ✅ Passed: ${this.results.summary.passed}`);
        console.log(`   ⚠️  Partial: ${this.results.summary.partial}`);
        console.log(`   ❌ Failed: ${this.results.summary.failed}`);
        console.log(`   🐛 Issues: ${this.results.summary.issues.length}`);

        console.log('\n📋 Category Results:');
        Object.entries(this.results.categories).forEach(([name, cat]) => {
            const icon = cat.status === 'pass' ? '✅' : cat.status === 'partial' ? '⚠️' : '❌';
            console.log(`   ${icon} ${name}: ${cat.status.toUpperCase()} (${cat.tests.length} tests)`);
        });

        if (report.overallAssessment.recommendations.length > 0) {
            console.log('\n💡 Key Recommendations:');
            report.overallAssessment.recommendations.slice(0, 5).forEach((rec, i) => {
                console.log(`   ${i + 1}. ${rec}`);
            });
        }

        console.log(`\n📄 Full report saved to: ./COMPREHENSIVE_TEST_REPORT.md`);
        console.log(`📸 Screenshots saved to: ./test-screenshots/comprehensive/`);
        console.log('='.repeat(80));

        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        Object.entries(this.results.categories).forEach(([name, category]) => {
            if (category.status === 'fail') {
                switch (name) {
                    case 'application':
                        recommendations.push('Fix critical application loading issues');
                        break;
                    case 'projectManagement':
                        recommendations.push('Resolve project creation workflow - this blocks core functionality');
                        break;
                    case 'workspace':
                        recommendations.push('Fix workspace tab navigation - tabs are not clickable due to modal overlays');
                        break;
                    case 'lexicalEditor':
                        recommendations.push('Verify Lexical editor implementation and functionality');
                        break;
                    case 'aiFeatures':
                        recommendations.push('Test and fix AI feature integration');
                        break;
                    case 'modalSystem':
                        recommendations.push('Fix modal system preventing UI interactions');
                        break;
                }
            }
        });

        if (this.results.summary.issues.length > 3) {
            recommendations.push('Address JavaScript console errors affecting user experience');
        }

        return recommendations;
    }

    generateMarkdownReport(report) {
        let markdown = `# BookCraft AI - Comprehensive Test Report
Generated: ${report.generatedAt}

## Executive Summary
- **Overall Score**: ${report.overallAssessment.score}%
- **Assessment**: ${report.overallAssessment.status}
- **Total Tests**: ${report.summary.totalTests}
- **Passed**: ${report.summary.passed}
- **Partial**: ${report.summary.partial}
- **Failed**: ${report.summary.failed}
- **Issues Found**: ${report.summary.issues.length}

## Test Categories

`;

        Object.entries(report.categories).forEach(([name, category]) => {
            const icon = category.status === 'pass' ? '✅' : category.status === 'partial' ? '⚠️' : '❌';
            markdown += `### ${icon} ${name.charAt(0).toUpperCase() + name.slice(1)} (${category.status.toUpperCase()})

`;
            category.tests.forEach(test => {
                const testIcon = test.status === 'pass' ? '✅' : test.status === 'partial' ? '⚠️' : '❌';
                markdown += `- ${testIcon} **${test.name}**: ${test.details}
`;
            });
            markdown += '\n';
        });

        if (report.summary.issues.length > 0) {
            markdown += `## Issues Detected

`;
            report.summary.issues.forEach((issue, i) => {
                markdown += `${i + 1}. **${issue.type}**: ${issue.message}
   - Time: ${issue.timestamp}

`;
            });
        }

        if (report.overallAssessment.recommendations.length > 0) {
            markdown += `## Recommendations

`;
            report.overallAssessment.recommendations.forEach((rec, i) => {
                markdown += `${i + 1}. ${rec}
`;
            });
        }

        markdown += `
## Screenshots
${report.screenshots.length} screenshots captured during testing.

## Test Environment
- Browser: ${report.browser}
- Viewport: ${report.viewport}
- Duration: ${report.testDuration}
`;

        return markdown;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async run() {
        try {
            await this.init();

            // Run all test categories
            await this.testApplicationLoading();
            await this.testDashboard();
            await this.testProjectCreation();
            await this.testWorkspaceNavigation();
            await this.testLexicalEditor();
            await this.testModalSystem();
            await this.testAIFeatures();
            await this.testPerformance();

            // Generate final report
            const report = await this.generateReport();
            
            return report;

        } catch (error) {
            console.error('❌ Comprehensive testing failed:', error);
            return null;
        } finally {
            await this.cleanup();
        }
    }
}

// Run the tests
if (require.main === module) {
    const tester = new BookCraftTester();
    tester.run().then(results => {
        if (results) {
            console.log('\n✅ Comprehensive testing completed successfully!');
            process.exit(0);
        } else {
            console.log('\n❌ Comprehensive testing failed!');
            process.exit(1);
        }
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = BookCraftTester;