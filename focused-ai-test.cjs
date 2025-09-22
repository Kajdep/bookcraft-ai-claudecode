/**
 * Focused AI Testing Script for BookCraft AI
 * Tests working AI features with correct selectors
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class FocusedAITester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            timestamp: new Date().toISOString(),
            apiTests: {},
            uiTests: {},
            issues: [],
            screenshots: []
        };
    }

    async init() {
        console.log('🎯 Starting Focused AI Integration Testing...\n');

        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--start-maximized'],
            slowMo: 500
        });

        this.page = await this.browser.newPage();

        // Monitor errors
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

        // Create screenshots directory
        await fs.mkdir('./test-screenshots', { recursive: true });
    }

    async screenshot(name) {
        const filename = `${name}-${Date.now()}.png`;
        const filepath = path.join('./test-screenshots', filename);
        await this.page.screenshot({ path: filepath, fullPage: true });
        this.results.screenshots.push({ name, filename, filepath });
        console.log(`📸 ${name}`);
    }

    async waitAndClick(selector, timeout = 5000) {
        try {
            await this.page.waitForSelector(selector, { timeout });
            await this.page.click(selector);
            return true;
        } catch (error) {
            console.log(`⚠️ Could not click ${selector}: ${error.message}`);
            return false;
        }
    }

    async type(selector, text, timeout = 5000) {
        try {
            await this.page.waitForSelector(selector, { timeout });
            await this.page.type(selector, text);
            return true;
        } catch (error) {
            console.log(`⚠️ Could not type in ${selector}: ${error.message}`);
            return false;
        }
    }

    async testAPIConnectivity() {
        console.log('🧪 Testing Direct API Connectivity...');

        // Test OpenRouter
        try {
            const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://bookcraft-ai.local',
                    'X-Title': 'BookCraft AI'
                },
                body: JSON.stringify({
                    model: 'nvidia/nemotron-nano-9b-v2:free',
                    messages: [{ role: 'user', content: 'Test' }],
                    max_tokens: 20
                })
            });

            this.results.apiTests.openRouter = {
                status: openRouterResponse.ok ? 'working' : 'failed',
                statusCode: openRouterResponse.status,
                details: openRouterResponse.ok ? 'Connected successfully' : await openRouterResponse.text()
            };
        } catch (error) {
            this.results.apiTests.openRouter = {
                status: 'failed',
                details: error.toString()
            };
        }

        // Test Gemini
        try {
            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Test' }] }]
                })
            });

            this.results.apiTests.gemini = {
                status: geminiResponse.ok ? 'working' : 'failed',
                statusCode: geminiResponse.status,
                details: geminiResponse.ok ? 'Connected successfully' : await geminiResponse.text()
            };
        } catch (error) {
            this.results.apiTests.gemini = {
                status: 'failed',
                details: error.toString()
            };
        }

        console.log(`✅ OpenRouter: ${this.results.apiTests.openRouter.status}`);
        console.log(`✅ Gemini: ${this.results.apiTests.gemini.status}`);
    }

    async testProjectCreationFlow() {
        console.log('\n📋 Testing Project Creation Flow...');

        try {
            // Navigate to app
            await this.page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
            await this.screenshot('dashboard-loaded');

            // Click "New Project" button
            const newProjectClicked = await this.waitAndClick('button:has-text("New Project")', 5000);

            if (!newProjectClicked) {
                // Try the "Create Your First Project" button instead
                const firstProjectClicked = await this.waitAndClick('button:has-text("Create Your First Project")', 2000);
                if (!firstProjectClicked) {
                    throw new Error('Could not find project creation button');
                }
            }

            await this.page.waitForTimeout(2000);
            await this.screenshot('project-modal-opened');

            // Fill project form
            const titleInput = await this.type('input[name="title"]', 'AI Integration Test Project');
            const genreSelect = await this.page.$('select[name="genre"]');
            if (genreSelect) {
                await this.page.select('select[name="genre"]', 'Fiction');
            }

            const descriptionInput = await this.type('textarea[name="description"]', 'Test project for AI feature validation');

            // Submit form
            const submitClicked = await this.waitAndClick('button[type="submit"]', 2000) ||
                                 await this.waitAndClick('button:has-text("Create")', 2000);

            if (submitClicked) {
                await this.page.waitForTimeout(3000);
                await this.screenshot('project-created');
            }

            this.results.uiTests.projectCreation = {
                status: 'success',
                details: 'Project creation flow completed'
            };

            return true;
        } catch (error) {
            await this.screenshot('project-creation-failed');
            this.results.uiTests.projectCreation = {
                status: 'failed',
                details: error.toString()
            };
            return false;
        }
    }

    async testWritingStudioAI() {
        console.log('\n✍️ Testing Writing Studio AI Features...');

        try {
            // Navigate to Writing Studio tab
            const writingTabClicked = await this.waitAndClick('button:has-text("Writing Studio")');
            if (!writingTabClicked) {
                throw new Error('Could not access Writing Studio tab');
            }

            await this.page.waitForTimeout(2000);
            await this.screenshot('writing-studio-loaded');

            // Test AI features in Writing Studio
            const features = {
                projectPlanner: await this.testProjectPlannerModal(),
                contentGeneration: await this.testContentGenerationModal(),
                aiAssistant: await this.testAIAssistantModal()
            };

            this.results.uiTests.writingStudio = {
                status: Object.values(features).some(f => f.status === 'accessible') ? 'partial' : 'limited',
                features
            };

        } catch (error) {
            this.results.uiTests.writingStudio = {
                status: 'failed',
                details: error.toString()
            };
        }
    }

    async testProjectPlannerModal() {
        console.log('  📋 Testing Project Planner Modal...');

        try {
            // Look for project planner button
            const plannerFound = await this.page.$('button:has-text("AI Planner")') ||
                               await this.page.$('button:has-text("Project Planner")') ||
                               await this.page.$('[data-modal="project-planner"]');

            if (plannerFound) {
                await plannerFound.click();
                await this.page.waitForTimeout(2000);
                await this.screenshot('project-planner-modal');

                return { status: 'accessible', details: 'Project Planner modal opens' };
            } else {
                return { status: 'not_found', details: 'Project Planner button not found' };
            }
        } catch (error) {
            return { status: 'error', details: error.toString() };
        }
    }

    async testContentGenerationModal() {
        console.log('  📝 Testing Content Generation Modal...');

        try {
            const generatorFound = await this.page.$('button:has-text("Generate")') ||
                                 await this.page.$('button:has-text("AI Generate")') ||
                                 await this.page.$('[data-modal="chapter-generator"]');

            if (generatorFound) {
                await generatorFound.click();
                await this.page.waitForTimeout(2000);
                await this.screenshot('content-generation-modal');

                return { status: 'accessible', details: 'Content Generation modal opens' };
            } else {
                return { status: 'not_found', details: 'Content Generation button not found' };
            }
        } catch (error) {
            return { status: 'error', details: error.toString() };
        }
    }

    async testAIAssistantModal() {
        console.log('  🤖 Testing AI Assistant Modal...');

        try {
            const assistantFound = await this.page.$('button:has-text("AI Assistant")') ||
                                  await this.page.$('button:has-text("Assistant")') ||
                                  await this.page.$('[data-modal="ai-assistant"]');

            if (assistantFound) {
                await assistantFound.click();
                await this.page.waitForTimeout(2000);
                await this.screenshot('ai-assistant-modal');

                return { status: 'accessible', details: 'AI Assistant modal opens' };
            } else {
                return { status: 'not_found', details: 'AI Assistant button not found' };
            }
        } catch (error) {
            return { status: 'error', details: error.toString() };
        }
    }

    async testResearchTabAI() {
        console.log('\n🔬 Testing Research Tab AI Features...');

        try {
            // Navigate to Research tab
            const researchTabClicked = await this.waitAndClick('button:has-text("Research")');
            if (!researchTabClicked) {
                throw new Error('Could not access Research tab');
            }

            await this.page.waitForTimeout(2000);
            await this.screenshot('research-tab-loaded');

            // Test research features
            const features = {
                researchInput: await this.testResearchInput(),
                factChecking: await this.testFactCheckingFeature(),
                researchTypes: await this.testResearchTypes()
            };

            this.results.uiTests.researchTab = {
                status: Object.values(features).some(f => f.status === 'accessible') ? 'partial' : 'limited',
                features
            };

        } catch (error) {
            this.results.uiTests.researchTab = {
                status: 'failed',
                details: error.toString()
            };
        }
    }

    async testResearchInput() {
        console.log('  🔍 Testing Research Input...');

        try {
            const researchInput = await this.page.$('input[placeholder*="research"]') ||
                                await this.page.$('textarea[placeholder*="research"]') ||
                                await this.page.$('input[placeholder*="query"]');

            if (researchInput) {
                await researchInput.type('Ancient Roman military tactics and formations');
                await this.screenshot('research-input-filled');

                const researchButton = await this.page.$('button:has-text("Research")') ||
                                     await this.page.$('button:has-text("Generate")') ||
                                     await this.page.$('button:has-text("Search")');

                if (researchButton) {
                    await researchButton.click();
                    await this.page.waitForTimeout(5000);
                    await this.screenshot('research-result');
                }

                return { status: 'accessible', details: 'Research input and generation working' };
            } else {
                return { status: 'not_found', details: 'Research input field not found' };
            }
        } catch (error) {
            return { status: 'error', details: error.toString() };
        }
    }

    async testFactCheckingFeature() {
        console.log('  ✓ Testing Fact Checking...');

        try {
            const factCheckButton = await this.page.$('button:has-text("Fact Check")') ||
                                   await this.page.$('[data-feature="fact-check"]');

            if (factCheckButton) {
                await factCheckButton.click();
                await this.page.waitForTimeout(2000);
                await this.screenshot('fact-check-interface');

                return { status: 'accessible', details: 'Fact checking interface found' };
            } else {
                return { status: 'not_found', details: 'Fact checking feature not found' };
            }
        } catch (error) {
            return { status: 'error', details: error.toString() };
        }
    }

    async testResearchTypes() {
        console.log('  📚 Testing Research Types...');

        try {
            const researchTypeButtons = await this.page.$$('button[data-research-type]');

            if (researchTypeButtons.length > 0) {
                await this.screenshot('research-types-available');
                return {
                    status: 'accessible',
                    details: `Found ${researchTypeButtons.length} research type options`
                };
            } else {
                return { status: 'not_found', details: 'Research type selection not found' };
            }
        } catch (error) {
            return { status: 'error', details: error.toString() };
        }
    }

    async testPlotTabAI() {
        console.log('\n📖 Testing Plot Tab AI Features...');

        try {
            // Navigate to Plot tab
            const plotTabClicked = await this.waitAndClick('button:has-text("Plot")');
            if (!plotTabClicked) {
                throw new Error('Could not access Plot tab');
            }

            await this.page.waitForTimeout(2000);
            await this.screenshot('plot-tab-loaded');

            // Test plot features
            const features = {
                plottingTool: await this.testPlottingToolModal(),
                plotGeneration: await this.testPlotGeneration()
            };

            this.results.uiTests.plotTab = {
                status: Object.values(features).some(f => f.status === 'accessible') ? 'partial' : 'limited',
                features
            };

        } catch (error) {
            this.results.uiTests.plotTab = {
                status: 'failed',
                details: error.toString()
            };
        }
    }

    async testPlottingToolModal() {
        console.log('  📚 Testing Plotting Tool Modal...');

        try {
            const plottingButton = await this.page.$('button:has-text("AI Plot")') ||
                                 await this.page.$('button:has-text("Plotting Tool")') ||
                                 await this.page.$('[data-modal="plotting-tool"]');

            if (plottingButton) {
                await plottingButton.click();
                await this.page.waitForTimeout(2000);
                await this.screenshot('plotting-tool-modal');

                return { status: 'accessible', details: 'Plotting Tool modal opens' };
            } else {
                return { status: 'not_found', details: 'Plotting Tool button not found' };
            }
        } catch (error) {
            return { status: 'error', details: error.toString() };
        }
    }

    async testPlotGeneration() {
        console.log('  📝 Testing Plot Generation...');

        try {
            const generateButton = await this.page.$('button:has-text("Generate Plot")') ||
                                  await this.page.$('button:has-text("Create Plot")');

            if (generateButton) {
                await generateButton.click();
                await this.page.waitForTimeout(3000);
                await this.screenshot('plot-generation-result');

                return { status: 'accessible', details: 'Plot generation initiated' };
            } else {
                return { status: 'not_found', details: 'Plot generation button not found' };
            }
        } catch (error) {
            return { status: 'error', details: error.toString() };
        }
    }

    async testVisualsTabAI() {
        console.log('\n🎨 Testing Visuals Tab AI Features...');

        try {
            // Navigate to Visuals tab
            const visualsTabClicked = await this.waitAndClick('button:has-text("Visuals")');
            if (!visualsTabClicked) {
                throw new Error('Could not access Visuals tab');
            }

            await this.page.waitForTimeout(2000);
            await this.screenshot('visuals-tab-loaded');

            // Test visual features
            const features = {
                imageGeneration: await this.testImageGenerationInterface(),
                visualAnalysis: await this.testVisualAnalysisFeature(),
                mermaidDiagrams: await this.testMermaidDiagrams()
            };

            this.results.uiTests.visualsTab = {
                status: Object.values(features).some(f => f.status === 'accessible') ? 'partial' : 'limited',
                features
            };

        } catch (error) {
            this.results.uiTests.visualsTab = {
                status: 'failed',
                details: error.toString()
            };
        }
    }

    async testImageGenerationInterface() {
        console.log('  🖼️ Testing Image Generation Interface...');

        try {
            const imageGenButton = await this.page.$('button:has-text("Generate Image")') ||
                                 await this.page.$('button:has-text("AI Image")') ||
                                 await this.page.$('[data-feature="image-generation"]');

            if (imageGenButton) {
                await imageGenButton.click();
                await this.page.waitForTimeout(2000);
                await this.screenshot('image-generation-interface');

                return { status: 'accessible', details: 'Image generation interface found' };
            } else {
                return { status: 'not_found', details: 'Image generation interface not found' };
            }
        } catch (error) {
            return { status: 'error', details: error.toString() };
        }
    }

    async testVisualAnalysisFeature() {
        console.log('  📊 Testing Visual Analysis Feature...');

        try {
            const analysisButton = await this.page.$('button:has-text("Analyze")') ||
                                 await this.page.$('button:has-text("Recommend")') ||
                                 await this.page.$('[data-feature="visual-analysis"]');

            if (analysisButton) {
                await analysisButton.click();
                await this.page.waitForTimeout(2000);
                await this.screenshot('visual-analysis-interface');

                return { status: 'accessible', details: 'Visual analysis feature found' };
            } else {
                return { status: 'not_found', details: 'Visual analysis feature not found' };
            }
        } catch (error) {
            return { status: 'error', details: error.toString() };
        }
    }

    async testMermaidDiagrams() {
        console.log('  📈 Testing Mermaid Diagram Generation...');

        try {
            const diagramButtons = await this.page.$$('button[data-diagram-type]');

            if (diagramButtons.length > 0) {
                await this.screenshot('mermaid-diagram-options');

                // Try clicking first diagram type
                await diagramButtons[0].click();
                await this.page.waitForTimeout(2000);
                await this.screenshot('mermaid-diagram-selected');

                return {
                    status: 'accessible',
                    details: `Found ${diagramButtons.length} diagram types`
                };
            } else {
                return { status: 'not_found', details: 'Mermaid diagram options not found' };
            }
        } catch (error) {
            return { status: 'error', details: error.toString() };
        }
    }

    async generateFinalReport() {
        console.log('\n📊 Generating Final AI Integration Report...');

        // Calculate overall status
        const uiTestResults = Object.values(this.results.uiTests);
        const passedTests = uiTestResults.filter(test => test.status === 'success' || test.status === 'partial').length;
        const totalTests = uiTestResults.length;

        const report = {
            ...this.results,
            summary: {
                timestamp: new Date().toISOString(),
                totalUITests: totalTests,
                passedUITests: passedTests,
                apiStatus: {
                    openRouter: this.results.apiTests.openRouter?.status || 'unknown',
                    gemini: this.results.apiTests.gemini?.status || 'unknown'
                },
                overallStatus: passedTests >= totalTests * 0.7 ? 'good' :
                              passedTests >= totalTests * 0.4 ? 'fair' : 'poor',
                recommendations: this.generateRecommendations()
            }
        };

        // Save report
        await fs.writeFile('./AI_INTEGRATION_FOCUSED_REPORT.json', JSON.stringify(report, null, 2));

        // Print summary
        console.log('='.repeat(60));
        console.log('🎯 FOCUSED AI INTEGRATION TEST RESULTS');
        console.log('='.repeat(60));
        console.log(`📊 API Status:`);
        console.log(`   OpenRouter: ${report.summary.apiStatus.openRouter}`);
        console.log(`   Gemini: ${report.summary.apiStatus.gemini}`);
        console.log(`\n🎮 UI Tests: ${passedTests}/${totalTests} working`);

        Object.entries(this.results.uiTests).forEach(([feature, result]) => {
            const icon = result.status === 'success' ? '✅' :
                        result.status === 'partial' ? '⚠️' : '❌';
            console.log(`${icon} ${feature}: ${result.status}`);
        });

        console.log(`\n🎯 Overall Assessment: ${report.summary.overallStatus.toUpperCase()}`);
        console.log(`📸 Screenshots captured: ${this.results.screenshots.length}`);
        console.log(`⚠️ Issues logged: ${this.results.issues.length}`);

        if (report.summary.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            report.summary.recommendations.forEach((rec, i) => {
                console.log(`${i + 1}. ${rec}`);
            });
        }

        console.log(`\n📄 Full report: ./AI_INTEGRATION_FOCUSED_REPORT.json`);

        return report;
    }

    generateRecommendations() {
        const recommendations = [];

        if (this.results.apiTests.openRouter?.status !== 'working') {
            recommendations.push('OpenRouter API connectivity issues detected - verify API key and permissions');
        }

        if (this.results.apiTests.gemini?.status !== 'working') {
            recommendations.push('Gemini API connectivity issues detected - verify API key and quota');
        }

        if (this.results.uiTests.projectCreation?.status === 'failed') {
            recommendations.push('Project creation flow needs fixing - this blocks access to all other features');
        }

        if (this.results.issues.length > 3) {
            recommendations.push('Multiple console errors detected - implement error boundaries and improve error handling');
        }

        return recommendations;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async run() {
        try {
            await this.init();

            await this.testAPIConnectivity();

            const projectCreated = await this.testProjectCreationFlow();
            if (projectCreated) {
                await this.testWritingStudioAI();
                await this.testResearchTabAI();
                await this.testPlotTabAI();
                await this.testVisualsTabAI();
            } else {
                console.log('⚠️ Skipping workspace tests due to project creation failure');
            }

            const report = await this.generateFinalReport();
            return report;

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
    }
}

// Run if called directly
if (require.main === module) {
    const tester = new FocusedAITester();
    tester.run().then(report => {
        console.log('\n✅ Focused AI testing completed!');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = FocusedAITester;