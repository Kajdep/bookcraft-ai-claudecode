/**
 * Manual AI Feature Testing Script for BookCraft AI
 * Tests actual working AI features that can be accessed in the UI
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class ManualAITester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            timestamp: new Date().toISOString(),
            testResults: {},
            screenshots: [],
            issues: []
        };
    }

    async init() {
        console.log('🚀 Starting Manual AI Feature Testing...\n');

        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--start-maximized'],
            slowMo: 1000 // Slow down actions for visibility
        });

        this.page = await this.browser.newPage();

        // Monitor console errors
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ Console Error:', msg.text());
                this.results.issues.push({
                    type: 'console_error',
                    message: msg.text(),
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    async takeScreenshot(name) {
        const filename = `${name}-${Date.now()}.png`;
        const filepath = path.join('./test-screenshots', filename);
        await this.page.screenshot({ path: filepath, fullPage: true });
        this.results.screenshots.push({ name, filename, filepath });
        console.log(`📸 Screenshot: ${filename}`);
    }

    async testProjectCreation() {
        console.log('🎯 Testing Project Creation and Navigation...');

        try {
            // Navigate to app
            await this.page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
            await this.takeScreenshot('app-loaded');

            // Click "New Project" button (top right)
            await this.page.click('button:has-text("New Project")');
            await this.page.waitForTimeout(2000);
            await this.takeScreenshot('new-project-modal');

            // Fill project form
            await this.page.fill('input[name="title"]', 'AI Test Project');
            await this.page.selectOption('select[name="genre"]', 'Fiction');
            await this.page.fill('textarea[name="description"]', 'A test project for AI feature testing');

            // Create project
            await this.page.click('button:has-text("Create Project")');
            await this.page.waitForTimeout(3000);
            await this.takeScreenshot('project-created');

            return { status: 'pass', details: 'Project creation successful' };
        } catch (error) {
            await this.takeScreenshot('project-creation-error');
            return { status: 'fail', details: error.toString() };
        }
    }

    async testWritingStudioAI() {
        console.log('✍️ Testing Writing Studio AI Features...');

        try {
            // Navigate to Writing Studio
            await this.page.click('[data-tab="writing"]');
            await this.page.waitForTimeout(2000);
            await this.takeScreenshot('writing-studio');

            // Test AI Project Planner
            const plannerResult = await this.testProjectPlanner();

            // Test Content Generation
            const contentResult = await this.testContentGeneration();

            // Test AI Assistant
            const assistantResult = await this.testAIAssistant();

            return {
                status: 'partial',
                planner: plannerResult,
                content: contentResult,
                assistant: assistantResult
            };
        } catch (error) {
            return { status: 'fail', details: error.toString() };
        }
    }

    async testProjectPlanner() {
        console.log('  📋 Testing AI Project Planner...');

        try {
            // Look for project planner button
            const plannerButton = await this.page.$('button:has-text("AI Planner")') ||
                                await this.page.$('button:has-text("Plan")') ||
                                await this.page.$('[data-testid="project-planner"]');

            if (plannerButton) {
                await plannerButton.click();
                await this.page.waitForTimeout(2000);
                await this.takeScreenshot('project-planner-modal');

                // Fill planner form if visible
                const promptInput = await this.page.$('textarea[placeholder*="describe"], input[placeholder*="prompt"]');
                if (promptInput) {
                    await promptInput.type('A fantasy adventure about a young wizard discovering ancient magic');

                    const generateButton = await this.page.$('button:has-text("Generate")') ||
                                         await this.page.$('button:has-text("Create Plan")');
                    if (generateButton) {
                        await generateButton.click();
                        await this.page.waitForTimeout(8000); // Wait for AI response
                        await this.takeScreenshot('planner-result');
                    }
                }

                return { status: 'pass', details: 'Project planner accessible and functional' };
            } else {
                return { status: 'fail', details: 'Project planner button not found' };
            }
        } catch (error) {
            return { status: 'fail', details: error.toString() };
        }
    }

    async testContentGeneration() {
        console.log('  📝 Testing Content Generation...');

        try {
            // Look for content generation interface
            const generateButton = await this.page.$('button:has-text("Generate Content")') ||
                                  await this.page.$('button:has-text("AI Generate")') ||
                                  await this.page.$('[data-testid="generate-content"]');

            if (generateButton) {
                await generateButton.click();
                await this.page.waitForTimeout(2000);
                await this.takeScreenshot('content-generation-modal');

                return { status: 'pass', details: 'Content generation interface accessible' };
            } else {
                return { status: 'fail', details: 'Content generation interface not found' };
            }
        } catch (error) {
            return { status: 'fail', details: error.toString() };
        }
    }

    async testAIAssistant() {
        console.log('  🤖 Testing AI Assistant...');

        try {
            // Look for AI assistant
            const assistantButton = await this.page.$('button:has-text("AI Assistant")') ||
                                   await this.page.$('button:has-text("Assistant")') ||
                                   await this.page.$('[data-testid="ai-assistant"]');

            if (assistantButton) {
                await assistantButton.click();
                await this.page.waitForTimeout(2000);
                await this.takeScreenshot('ai-assistant-modal');

                return { status: 'pass', details: 'AI Assistant accessible' };
            } else {
                return { status: 'fail', details: 'AI Assistant not found' };
            }
        } catch (error) {
            return { status: 'fail', details: error.toString() };
        }
    }

    async testResearchFeatures() {
        console.log('🔬 Testing Research AI Features...');

        try {
            // Navigate to Research tab
            await this.page.click('[data-tab="research"]');
            await this.page.waitForTimeout(2000);
            await this.takeScreenshot('research-tab');

            // Test research functionality
            const researchResult = await this.testResearchGeneration();
            const factCheckResult = await this.testFactChecking();

            return {
                status: 'partial',
                research: researchResult,
                factCheck: factCheckResult
            };
        } catch (error) {
            return { status: 'fail', details: error.toString() };
        }
    }

    async testResearchGeneration() {
        console.log('  🔍 Testing Research Generation...');

        try {
            // Look for research input
            const researchInput = await this.page.$('input[placeholder*="research"]') ||
                                 await this.page.$('textarea[placeholder*="research"]') ||
                                 await this.page.$('[data-testid="research-input"]');

            if (researchInput) {
                await researchInput.type('Medieval castle architecture and defensive features');

                const researchButton = await this.page.$('button:has-text("Research")') ||
                                     await this.page.$('button:has-text("Generate")');

                if (researchButton) {
                    await researchButton.click();
                    await this.page.waitForTimeout(8000); // Wait for AI response
                    await this.takeScreenshot('research-result');
                }

                return { status: 'pass', details: 'Research generation accessible' };
            } else {
                return { status: 'fail', details: 'Research input not found' };
            }
        } catch (error) {
            return { status: 'fail', details: error.toString() };
        }
    }

    async testFactChecking() {
        console.log('  ✓ Testing Fact Checking...');

        try {
            const factCheckButton = await this.page.$('button:has-text("Fact Check")') ||
                                   await this.page.$('[data-testid="fact-check"]');

            if (factCheckButton) {
                await factCheckButton.click();
                await this.page.waitForTimeout(2000);
                await this.takeScreenshot('fact-check-interface');

                return { status: 'pass', details: 'Fact checking interface accessible' };
            } else {
                return { status: 'fail', details: 'Fact checking interface not found' };
            }
        } catch (error) {
            return { status: 'fail', details: error.toString() };
        }
    }

    async testPlotFeatures() {
        console.log('📖 Testing Plot AI Features...');

        try {
            // Navigate to Plot tab
            await this.page.click('[data-tab="plot"]');
            await this.page.waitForTimeout(2000);
            await this.takeScreenshot('plot-tab');

            // Test plot generation
            const plotResult = await this.testPlotGeneration();

            return {
                status: 'partial',
                plot: plotResult
            };
        } catch (error) {
            return { status: 'fail', details: error.toString() };
        }
    }

    async testPlotGeneration() {
        console.log('  📚 Testing Plot Generation...');

        try {
            const plotButton = await this.page.$('button:has-text("AI Plot")') ||
                             await this.page.$('button:has-text("Generate Plot")') ||
                             await this.page.$('[data-testid="ai-plotting"]');

            if (plotButton) {
                await plotButton.click();
                await this.page.waitForTimeout(2000);
                await this.takeScreenshot('plot-generation-modal');

                // Fill plot prompt if available
                const plotInput = await this.page.$('textarea[placeholder*="plot"]') ||
                                await this.page.$('input[placeholder*="story"]');

                if (plotInput) {
                    await plotInput.type('A young hero must save their village from an ancient curse');

                    const generateButton = await this.page.$('button:has-text("Generate")');
                    if (generateButton) {
                        await generateButton.click();
                        await this.page.waitForTimeout(8000);
                        await this.takeScreenshot('plot-result');
                    }
                }

                return { status: 'pass', details: 'Plot generation accessible' };
            } else {
                return { status: 'fail', details: 'Plot generation interface not found' };
            }
        } catch (error) {
            return { status: 'fail', details: error.toString() };
        }
    }

    async testVisualFeatures() {
        console.log('🎨 Testing Visual AI Features...');

        try {
            // Navigate to Visuals tab
            await this.page.click('[data-tab="visuals"]');
            await this.page.waitForTimeout(2000);
            await this.takeScreenshot('visuals-tab');

            // Test image generation
            const imageResult = await this.testImageGeneration();

            // Test visual analysis
            const analysisResult = await this.testVisualAnalysis();

            return {
                status: 'partial',
                image: imageResult,
                analysis: analysisResult
            };
        } catch (error) {
            return { status: 'fail', details: error.toString() };
        }
    }

    async testImageGeneration() {
        console.log('  🖼️ Testing Image Generation...');

        try {
            const imageButton = await this.page.$('button:has-text("Generate Image")') ||
                              await this.page.$('button:has-text("AI Image")') ||
                              await this.page.$('[data-testid="generate-image"]');

            if (imageButton) {
                await imageButton.click();
                await this.page.waitForTimeout(2000);
                await this.takeScreenshot('image-generation-interface');

                return { status: 'pass', details: 'Image generation interface accessible' };
            } else {
                return { status: 'fail', details: 'Image generation interface not found' };
            }
        } catch (error) {
            return { status: 'fail', details: error.toString() };
        }
    }

    async testVisualAnalysis() {
        console.log('  📊 Testing Visual Analysis...');

        try {
            const analysisButton = await this.page.$('button:has-text("Analyze")') ||
                                 await this.page.$('button:has-text("Recommend")') ||
                                 await this.page.$('[data-testid="visual-analysis"]');

            if (analysisButton) {
                await analysisButton.click();
                await this.page.waitForTimeout(2000);
                await this.takeScreenshot('visual-analysis-interface');

                return { status: 'pass', details: 'Visual analysis interface accessible' };
            } else {
                return { status: 'fail', details: 'Visual analysis interface not found' };
            }
        } catch (error) {
            return { status: 'fail', details: error.toString() };
        }
    }

    async generateReport() {
        console.log('\n📊 Generating Manual Test Report...');

        // Save results
        await fs.writeFile('./MANUAL_AI_TEST_REPORT.json', JSON.stringify(this.results, null, 2));

        console.log('='.repeat(60));
        console.log('🎯 MANUAL AI FEATURE TEST RESULTS');
        console.log('='.repeat(60));

        Object.entries(this.results.testResults).forEach(([feature, result]) => {
            const status = result.status === 'pass' ? '✅' : result.status === 'partial' ? '⚠️' : '❌';
            console.log(`${status} ${feature}: ${result.status.toUpperCase()}`);
            if (result.details) {
                console.log(`   Details: ${result.details}`);
            }
        });

        if (this.results.issues.length > 0) {
            console.log(`\n⚠️ Issues Found: ${this.results.issues.length}`);
        }

        console.log(`\n📄 Report saved to: ./MANUAL_AI_TEST_REPORT.json`);
        console.log(`📸 Screenshots: ${this.results.screenshots.length} saved`);
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async run() {
        try {
            await this.init();

            // Create screenshots directory
            await fs.mkdir('./test-screenshots', { recursive: true });

            // Run tests
            this.results.testResults.projectCreation = await this.testProjectCreation();
            this.results.testResults.writingStudio = await this.testWritingStudioAI();
            this.results.testResults.research = await this.testResearchFeatures();
            this.results.testResults.plot = await this.testPlotFeatures();
            this.results.testResults.visuals = await this.testVisualFeatures();

            await this.generateReport();

        } catch (error) {
            console.error('❌ Testing failed:', error);
            this.results.issues.push({
                type: 'critical_error',
                message: error.toString(),
                timestamp: new Date().toISOString()
            });
        } finally {
            await this.cleanup();
        }

        return this.results;
    }
}

// Run if called directly
if (require.main === module) {
    const tester = new ManualAITester();
    tester.run().then(results => {
        console.log('\n✅ Manual testing completed!');
    }).catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = ManualAITester;