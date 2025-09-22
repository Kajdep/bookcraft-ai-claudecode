import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WorkspaceQATest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            testStartTime: new Date().toISOString(),
            tabs: {},
            navigation: {},
            overall: {},
            screenshots: [],
            errors: []
        };
    }

    async setup() {
        console.log('🚀 Starting BookCraft AI Workspace QA Test Suite');
        this.browser = await chromium.launch({
            headless: false,
            slowMo: 1000 // Slow down for better observation
        });
        this.page = await this.browser.newPage();

        // Set viewport for consistent testing
        await this.page.setViewportSize({ width: 1920, height: 1080 });

        // Listen for console errors
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                this.results.errors.push({
                    type: 'console',
                    message: msg.text(),
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Listen for page errors
        this.page.on('pageerror', error => {
            this.results.errors.push({
                type: 'page',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        });
    }

    async navigateToApp() {
        console.log('📱 Navigating to BookCraft AI application');
        await this.page.goto('http://localhost:5173');
        await this.page.waitForTimeout(2000);

        // Take initial screenshot
        await this.takeScreenshot('00-initial-load');
    }

    async createTestProject() {
        console.log('📝 Creating test project');
        try {
            // Look for "New Project" button or similar
            const newProjectButton = await this.page.waitForSelector('button:has-text("New Project")', { timeout: 5000 });
            await newProjectButton.click();
            await this.page.waitForTimeout(1000);

            // Fill project details (if modal appears)
            const titleInput = await this.page.locator('input[placeholder*="title"], input[name="title"]').first();
            if (await titleInput.isVisible()) {
                await titleInput.fill('QA Test Project');
            }

            const genreSelect = await this.page.locator('select, [role="combobox"]').first();
            if (await genreSelect.isVisible()) {
                await genreSelect.selectOption({ index: 1 });
            }

            // Submit the form
            const createButton = await this.page.locator('button:has-text("Create"), button[type="submit"]').first();
            if (await createButton.isVisible()) {
                await createButton.click();
                await this.page.waitForTimeout(2000);
            }

            await this.takeScreenshot('01-project-created');
            this.results.overall.projectCreation = 'success';
        } catch (error) {
            console.log('⚠️ Project creation failed, checking for existing project');
            this.results.overall.projectCreation = 'failed';
            this.results.errors.push({
                type: 'project-creation',
                message: error.message,
                timestamp: new Date().toISOString()
            });

            // Try to click on an existing project
            try {
                const existingProject = await this.page.locator('[data-testid="project-card"], .project-card, button:has-text("Open"), button:has-text("Continue")').first();
                if (await existingProject.isVisible()) {
                    await existingProject.click();
                    await this.page.waitForTimeout(2000);
                    this.results.overall.projectCreation = 'used-existing';
                }
            } catch (fallbackError) {
                console.log('❌ No existing project found either');
            }
        }
    }

    async testWorkspaceTab(tabName, tabSelector) {
        console.log(`🧪 Testing ${tabName} tab`);
        const testResult = {
            name: tabName,
            accessible: false,
            functional: false,
            issues: [],
            features: {},
            loadTime: 0
        };

        try {
            const startTime = Date.now();

            // Click the tab
            const tabButton = await this.page.locator(tabSelector);
            await tabButton.click();
            await this.page.waitForTimeout(2000);

            testResult.accessible = true;
            testResult.loadTime = Date.now() - startTime;

            // Take screenshot of the tab
            await this.takeScreenshot(`tab-${tabName.toLowerCase().replace(/\s+/g, '-')}`);

            // Test specific functionality based on tab
            await this.testTabSpecificFeatures(tabName, testResult);

            testResult.functional = testResult.issues.length === 0;

        } catch (error) {
            testResult.issues.push(`Failed to access tab: ${error.message}`);
            this.results.errors.push({
                type: 'tab-access',
                tab: tabName,
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }

        this.results.tabs[tabName] = testResult;
        return testResult;
    }

    async testTabSpecificFeatures(tabName, testResult) {
        switch (tabName) {
            case 'Writing Studio':
                await this.testWritingStudioFeatures(testResult);
                break;
            case 'Plot':
                await this.testPlotTabFeatures(testResult);
                break;
            case 'Research':
                await this.testResearchTabFeatures(testResult);
                break;
            case 'Visuals':
                await this.testVisualsWorkspaceFeatures(testResult);
                break;
            case 'Cover Creator':
                await this.testCoverCreatorFeatures(testResult);
                break;
            case 'Export':
                await this.testExportTabFeatures(testResult);
                break;
            case 'KDP Calculator':
                await this.testKDPCalculatorFeatures(testResult);
                break;
            case 'Material':
                await this.testMaterialTabFeatures(testResult);
                break;
        }
    }

    async testWritingStudioFeatures(testResult) {
        try {
            // Check for Lexical editor
            const editor = await this.page.locator('[contenteditable="true"], .lexical-editor, [role="textbox"]').first();
            testResult.features.lexicalEditor = await editor.isVisible();

            // Check for chapter management
            const chapterElements = await this.page.locator('[data-testid="chapter"], .chapter-item, button:has-text("Chapter")').count();
            testResult.features.chapterManagement = chapterElements > 0;

            // Check for AI tools
            const aiButtons = await this.page.locator('button:has-text("AI"), [data-testid="ai-assistant"]').count();
            testResult.features.aiTools = aiButtons > 0;

            if (!testResult.features.lexicalEditor) {
                testResult.issues.push('Lexical editor not found or not accessible');
            }

        } catch (error) {
            testResult.issues.push(`Writing Studio test error: ${error.message}`);
        }
    }

    async testPlotTabFeatures(testResult) {
        try {
            // Check for plot points
            const plotPoints = await this.page.locator('[data-testid="plot-point"], .plot-point, .timeline-item').count();
            testResult.features.plotPoints = plotPoints >= 0;

            // Check for add plot point button
            const addButton = await this.page.locator('button:has-text("Add"), button:has-text("Plot"), button[data-testid="add-plot-point"]').first();
            testResult.features.addPlotPoint = await addButton.isVisible();

            // Check for AI plotting tool
            const aiPlotButton = await this.page.locator('button:has-text("AI Plot"), [data-testid="ai-plotting"]').first();
            testResult.features.aiPlotting = await aiPlotButton.isVisible();

            // Test for infinite loop (check console errors)
            await this.page.waitForTimeout(3000);
            const recentErrors = this.results.errors.filter(e =>
                e.timestamp > new Date(Date.now() - 5000).toISOString() &&
                e.message.includes('Maximum update depth')
            );

            if (recentErrors.length > 0) {
                testResult.issues.push('Infinite loop detected - Maximum update depth exceeded');
            }

        } catch (error) {
            testResult.issues.push(`Plot Tab test error: ${error.message}`);
        }
    }

    async testResearchTabFeatures(testResult) {
        try {
            // Check for research tools
            const researchTools = await this.page.locator('button:has-text("Research"), [data-testid="research-tool"]').count();
            testResult.features.researchTools = researchTools > 0;

            // Check for folder organization
            const folders = await this.page.locator('[data-testid="folder"], .folder-item').count();
            testResult.features.folderOrganization = folders >= 0;

            // Check for AI research
            const aiResearch = await this.page.locator('button:has-text("AI Research"), [data-testid="ai-research"]').first();
            testResult.features.aiResearch = await aiResearch.isVisible();

        } catch (error) {
            testResult.issues.push(`Research Tab test error: ${error.message}`);
        }
    }

    async testVisualsWorkspaceFeatures(testResult) {
        try {
            // Check for visual library
            const visualLibrary = await this.page.locator('[data-testid="visual-library"], .visual-grid').first();
            testResult.features.visualLibrary = await visualLibrary.isVisible();

            // Check for image generation
            const generateButton = await this.page.locator('button:has-text("Generate"), button:has-text("Create Image")').first();
            testResult.features.imageGeneration = await generateButton.isVisible();

            // Check for mermaid diagrams
            const mermaidElements = await this.page.locator('.mermaid, [data-testid="mermaid"]').count();
            testResult.features.mermaidDiagrams = mermaidElements >= 0;

        } catch (error) {
            testResult.issues.push(`Visuals Workspace test error: ${error.message}`);
        }
    }

    async testCoverCreatorFeatures(testResult) {
        try {
            // Check for cover design interface
            const coverDesign = await this.page.locator('[data-testid="cover-design"], .cover-creator-canvas').first();
            testResult.features.coverDesign = await coverDesign.isVisible();

            // Check for template selection
            const templates = await this.page.locator('[data-testid="template"], .template-option').count();
            testResult.features.templates = templates > 0;

        } catch (error) {
            testResult.issues.push(`Cover Creator test error: ${error.message}`);
        }
    }

    async testExportTabFeatures(testResult) {
        try {
            // Check for export options
            const exportButtons = await this.page.locator('button:has-text("Export"), button:has-text("PDF"), button:has-text("EPUB")').count();
            testResult.features.exportOptions = exportButtons > 0;

            // Check for format selection
            const formatOptions = await this.page.locator('select, [role="radiogroup"], input[type="radio"]').count();
            testResult.features.formatSelection = formatOptions > 0;

        } catch (error) {
            testResult.issues.push(`Export Tab test error: ${error.message}`);
        }
    }

    async testKDPCalculatorFeatures(testResult) {
        try {
            // Check for calculator interface
            const calculator = await this.page.locator('[data-testid="kdp-calculator"], input[type="number"]').first();
            testResult.features.calculator = await calculator.isVisible();

            // Check for calculation inputs
            const inputs = await this.page.locator('input[type="number"], input[type="text"]').count();
            testResult.features.calculationInputs = inputs > 0;

        } catch (error) {
            testResult.issues.push(`KDP Calculator test error: ${error.message}`);
        }
    }

    async testMaterialTabFeatures(testResult) {
        try {
            // Check for material organization
            const materials = await this.page.locator('[data-testid="material"], .material-item').count();
            testResult.features.materialOrganization = materials >= 0;

            // Check for upload functionality
            const uploadButton = await this.page.locator('button:has-text("Upload"), input[type="file"]').first();
            testResult.features.uploadFunctionality = await uploadButton.isVisible();

        } catch (error) {
            testResult.issues.push(`Material Tab test error: ${error.message}`);
        }
    }

    async testTabNavigation() {
        console.log('🔄 Testing tab navigation and persistence');
        const navigationTest = {
            smoothTransitions: true,
            dataPersistence: true,
            issues: []
        };

        try {
            const tabs = [
                { name: 'Writing Studio', selector: 'button:has-text("Writing Studio")' },
                { name: 'Plot', selector: 'button:has-text("Plot")' },
                { name: 'Research', selector: 'button:has-text("Research")' }
            ];

            for (let i = 0; i < tabs.length; i++) {
                const tab = tabs[i];
                const startTime = Date.now();

                await this.page.locator(tab.selector).click();
                await this.page.waitForTimeout(1000);

                const loadTime = Date.now() - startTime;
                if (loadTime > 3000) {
                    navigationTest.issues.push(`${tab.name} took ${loadTime}ms to load (>3s)`);
                    navigationTest.smoothTransitions = false;
                }
            }

        } catch (error) {
            navigationTest.issues.push(`Navigation test error: ${error.message}`);
            navigationTest.smoothTransitions = false;
        }

        this.results.navigation = navigationTest;
        return navigationTest;
    }

    async takeScreenshot(name) {
        try {
            const screenshotPath = path.join(__dirname, 'qa-screenshots', `${name}.png`);

            // Create directory if it doesn't exist
            const dir = path.dirname(screenshotPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            await this.page.screenshot({
                path: screenshotPath,
                fullPage: true
            });

            this.results.screenshots.push({
                name,
                path: screenshotPath,
                timestamp: new Date().toISOString()
            });

            console.log(`📸 Screenshot saved: ${name}.png`);
        } catch (error) {
            console.log(`❌ Failed to take screenshot ${name}: ${error.message}`);
        }
    }

    async runFullTestSuite() {
        try {
            await this.setup();
            await this.navigateToApp();
            await this.createTestProject();

            // Test all workspace tabs
            const tabTests = [
                { name: 'Writing Studio', selector: 'button:has-text("Writing Studio")' },
                { name: 'Plot', selector: 'button:has-text("Plot")' },
                { name: 'Research', selector: 'button:has-text("Research")' },
                { name: 'Material', selector: 'button:has-text("Material")' },
                { name: 'Visuals', selector: 'button:has-text("Visuals")' },
                { name: 'Cover Creator', selector: 'button:has-text("Cover Creator")' },
                { name: 'KDP Calculator', selector: 'button:has-text("KDP Calculator")' },
                { name: 'Export', selector: 'button:has-text("Export")' }
            ];

            for (const tab of tabTests) {
                await this.testWorkspaceTab(tab.name, tab.selector);
                await this.page.waitForTimeout(1000);
            }

            // Test navigation
            await this.testTabNavigation();

            // Generate summary
            this.generateSummary();

        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.results.overall.testSuiteFailed = true;
            this.results.errors.push({
                type: 'test-suite',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    generateSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 BOOKCRAFT AI WORKSPACE QA TEST SUMMARY');
        console.log('='.repeat(60));

        const totalTabs = Object.keys(this.results.tabs).length;
        const accessibleTabs = Object.values(this.results.tabs).filter(tab => tab.accessible).length;
        const functionalTabs = Object.values(this.results.tabs).filter(tab => tab.functional).length;

        console.log(`\n🏷️  OVERVIEW:`);
        console.log(`   Total Tabs Tested: ${totalTabs}`);
        console.log(`   Accessible Tabs: ${accessibleTabs}/${totalTabs}`);
        console.log(`   Functional Tabs: ${functionalTabs}/${totalTabs}`);
        console.log(`   Total Errors: ${this.results.errors.length}`);
        console.log(`   Screenshots Captured: ${this.results.screenshots.length}`);

        console.log(`\n📋 TAB DETAILS:`);
        Object.entries(this.results.tabs).forEach(([name, result]) => {
            const status = result.accessible ? (result.functional ? '✅' : '⚠️') : '❌';
            console.log(`   ${status} ${name}: ${result.accessible ? 'Accessible' : 'Not Accessible'} | ${result.functional ? 'Functional' : 'Issues Found'}`);

            if (result.issues.length > 0) {
                result.issues.forEach(issue => {
                    console.log(`      - ${issue}`);
                });
            }
        });

        if (this.results.navigation.issues.length > 0) {
            console.log(`\n🔄 NAVIGATION ISSUES:`);
            this.results.navigation.issues.forEach(issue => {
                console.log(`   - ${issue}`);
            });
        }

        console.log(`\n🖼️  SCREENSHOTS:`);
        this.results.screenshots.forEach(screenshot => {
            console.log(`   📸 ${screenshot.name} - ${screenshot.path}`);
        });

        // Save detailed report
        const reportPath = path.join(__dirname, 'qa-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);

        console.log('\n' + '='.repeat(60));
    }
}

// Run the test suite
const qaTest = new WorkspaceQATest();
qaTest.runFullTestSuite().catch(console.error);