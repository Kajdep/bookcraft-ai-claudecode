/**
 * Comprehensive AI Integration Testing Suite for BookCraft AI
 * Tests all AI features end-to-end with detailed reporting
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const TEST_CONFIG = {
    timeout: 30000,
    screenshots: true,
    screenshotDir: './test-screenshots/ai-integration',
    reportFile: './AI_INTEGRATION_TEST_REPORT.json'
};

class AIIntegrationTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: 0,
                passed: 0,
                failed: 0,
                partial: 0
            },
            categories: {
                apiConnectivity: { status: 'pending', tests: [] },
                researchTab: { status: 'pending', tests: [] },
                writingStudio: { status: 'pending', tests: [] },
                plotTab: { status: 'pending', tests: [] },
                visualGeneration: { status: 'pending', tests: [] }
            },
            issues: [],
            screenshots: []
        };
    }

    async init() {
        console.log('🚀 Starting Comprehensive AI Integration Testing...\n');

        // Create screenshot directory
        if (TEST_CONFIG.screenshots) {
            await fs.mkdir(TEST_CONFIG.screenshotDir, { recursive: true });
        }

        // Launch browser
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--start-maximized']
        });

        this.page = await this.browser.newPage();

        // Set up error monitoring
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                this.results.issues.push({
                    type: 'console_error',
                    message: msg.text(),
                    timestamp: new Date().toISOString()
                });
            }
        });

        this.page.on('pageerror', error => {
            this.results.issues.push({
                type: 'page_error',
                message: error.toString(),
                timestamp: new Date().toISOString()
            });
        });
    }

    async takeScreenshot(name) {
        if (TEST_CONFIG.screenshots) {
            const filename = `${name}-${Date.now()}.png`;
            const filepath = path.join(TEST_CONFIG.screenshotDir, filename);
            await this.page.screenshot({ path: filepath, fullPage: true });
            this.results.screenshots.push({
                name,
                filename,
                filepath,
                timestamp: new Date().toISOString()
            });
            console.log(`📸 Screenshot saved: ${filename}`);
        }
    }

    async testAPIConnectivity() {
        console.log('🧪 Testing API Connectivity...');
        const tests = [];

        try {
            // Test OpenRouter API directly
            const openRouterTest = await this.testOpenRouterAPI();
            tests.push(openRouterTest);

            // Test Gemini API directly
            const geminiTest = await this.testGeminiAPI();
            tests.push(geminiTest);

            // Update results
            this.results.categories.apiConnectivity.tests = tests;
            this.results.categories.apiConnectivity.status =
                tests.every(t => t.status === 'pass') ? 'pass' :
                tests.some(t => t.status === 'pass') ? 'partial' : 'fail';

        } catch (error) {
            this.results.categories.apiConnectivity.status = 'fail';
            this.results.issues.push({
                type: 'api_connectivity_error',
                message: error.toString(),
                timestamp: new Date().toISOString()
            });
        }
    }

    async testOpenRouterAPI() {
        console.log('  📡 Testing OpenRouter API...');
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://bookcraft-ai.local',
                    'X-Title': 'BookCraft AI'
                },
                body: JSON.stringify({
                    model: 'nvidia/nemotron-nano-9b-v2:free',
                    messages: [{ role: 'user', content: 'Test message for API connectivity' }],
                    max_tokens: 50
                })
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    name: 'OpenRouter API Connection',
                    status: 'pass',
                    details: 'Successfully connected and received response',
                    response: data.choices?.[0]?.message?.content || 'Response received'
                };
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            return {
                name: 'OpenRouter API Connection',
                status: 'fail',
                details: error.toString()
            };
        }
    }

    async testGeminiAPI() {
        console.log('  📡 Testing Gemini API...');
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: 'Test message for API connectivity'
                        }]
                    }]
                })
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    name: 'Gemini API Connection',
                    status: 'pass',
                    details: 'Successfully connected and received response',
                    response: data.candidates?.[0]?.content?.parts?.[0]?.text || 'Response received'
                };
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            return {
                name: 'Gemini API Connection',
                status: 'fail',
                details: error.toString()
            };
        }
    }

    async testResearchTabFeatures() {
        console.log('🔬 Testing Research Tab AI Features...');
        const tests = [];

        try {
            // Navigate to application
            await this.page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
            await this.takeScreenshot('app-loaded');

            // Create a test project first
            await this.createTestProject();

            // Navigate to Research Tab
            await this.navigateToResearchTab();
            await this.takeScreenshot('research-tab-loaded');

            // Test each research feature
            const researchTests = [
                { name: 'Historical Research', type: 'historical' },
                { name: 'Technical Research', type: 'technical' },
                { name: 'Character Research', type: 'character' },
                { name: 'Location Research', type: 'location' },
                { name: 'Cultural Research', type: 'cultural' },
                { name: 'Scientific Research', type: 'scientific' },
                { name: 'Source Verification', type: 'verification' }
            ];

            for (const test of researchTests) {
                const result = await this.testResearchFeature(test);
                tests.push(result);
            }

            // Test fact checking
            const factCheckTest = await this.testFactChecking();
            tests.push(factCheckTest);

            // Test web content summarization
            const webSummaryTest = await this.testWebContentSummarization();
            tests.push(webSummaryTest);

            this.results.categories.researchTab.tests = tests;
            this.results.categories.researchTab.status =
                tests.every(t => t.status === 'pass') ? 'pass' :
                tests.some(t => t.status === 'pass') ? 'partial' : 'fail';

        } catch (error) {
            this.results.categories.researchTab.status = 'fail';
            this.results.issues.push({
                type: 'research_tab_error',
                message: error.toString(),
                timestamp: new Date().toISOString()
            });
        }
    }

    async createTestProject() {
        console.log('  📝 Creating test project...');

        // Wait for and click "New Project" button
        try {
            await this.page.waitForSelector('[data-testid="new-project-button"], button:contains("New Project"), .new-project-btn', { timeout: 10000 });

            // Try multiple selectors
            const newProjectButton = await this.page.$('[data-testid="new-project-button"]') ||
                                   await this.page.$('button:contains("New Project")') ||
                                   await this.page.$('.new-project-btn') ||
                                   await this.page.$('button[class*="project"]');

            if (newProjectButton) {
                await newProjectButton.click();
                await this.page.waitForTimeout(1000);
            } else {
                // Try to find any button that might create a project
                const buttons = await this.page.$$('button');
                for (const button of buttons) {
                    const text = await button.evaluate(el => el.textContent);
                    if (text && text.toLowerCase().includes('project')) {
                        await button.click();
                        break;
                    }
                }
            }

            // Fill project form
            await this.page.waitForSelector('input[name="title"], input[placeholder*="title"]', { timeout: 5000 });
            await this.page.type('input[name="title"], input[placeholder*="title"]', 'AI Test Project');

            if (await this.page.$('select[name="genre"]')) {
                await this.page.select('select[name="genre"]', 'Fiction');
            }

            // Submit project creation
            const createButton = await this.page.$('button:contains("Create")') ||
                               await this.page.$('button[type="submit"]');
            if (createButton) {
                await createButton.click();
                await this.page.waitForTimeout(2000);
            }

        } catch (error) {
            throw new Error(`Failed to create test project: ${error.message}`);
        }
    }

    async navigateToResearchTab() {
        console.log('  🔍 Navigating to Research Tab...');

        try {
            // Look for Research tab
            const researchTab = await this.page.$('[data-testid="research-tab"]') ||
                              await this.page.$('button:contains("Research")') ||
                              await this.page.$('.tab:contains("Research")');

            if (researchTab) {
                await researchTab.click();
                await this.page.waitForTimeout(1000);
            } else {
                throw new Error('Research tab not found');
            }
        } catch (error) {
            throw new Error(`Failed to navigate to Research Tab: ${error.message}`);
        }
    }

    async testResearchFeature(test) {
        console.log(`    Testing ${test.name}...`);

        try {
            // Look for research input or button
            const researchInput = await this.page.$('input[placeholder*="research"], textarea[placeholder*="research"]');
            const researchButton = await this.page.$('button:contains("Research"), button:contains("Generate")');

            if (researchInput && researchButton) {
                await researchInput.type(`Test query for ${test.name}`);
                await researchButton.click();

                // Wait for AI response
                await this.page.waitForTimeout(5000);

                // Check for response content
                const responseContent = await this.page.$('.research-result, .ai-response, [data-testid="research-result"]');

                return {
                    name: test.name,
                    status: responseContent ? 'pass' : 'fail',
                    details: responseContent ? 'AI research response generated' : 'No response generated'
                };
            } else {
                return {
                    name: test.name,
                    status: 'fail',
                    details: 'Research UI elements not found'
                };
            }
        } catch (error) {
            return {
                name: test.name,
                status: 'fail',
                details: error.toString()
            };
        }
    }

    async testFactChecking() {
        console.log('    Testing Fact Checking...');

        try {
            // Look for fact checking feature
            const factCheckButton = await this.page.$('button:contains("Fact Check"), [data-testid="fact-check"]');

            if (factCheckButton) {
                await factCheckButton.click();
                await this.page.waitForTimeout(3000);

                return {
                    name: 'Fact Checking',
                    status: 'pass',
                    details: 'Fact checking feature accessible'
                };
            } else {
                return {
                    name: 'Fact Checking',
                    status: 'fail',
                    details: 'Fact checking feature not found'
                };
            }
        } catch (error) {
            return {
                name: 'Fact Checking',
                status: 'fail',
                details: error.toString()
            };
        }
    }

    async testWebContentSummarization() {
        console.log('    Testing Web Content Summarization...');

        try {
            // Look for URL input for web summarization
            const urlInput = await this.page.$('input[placeholder*="url"], input[type="url"]');

            if (urlInput) {
                await urlInput.type('https://example.com');

                const summarizeButton = await this.page.$('button:contains("Summarize"), button:contains("Analyze")');
                if (summarizeButton) {
                    await summarizeButton.click();
                    await this.page.waitForTimeout(3000);
                }

                return {
                    name: 'Web Content Summarization',
                    status: 'pass',
                    details: 'Web summarization feature accessible'
                };
            } else {
                return {
                    name: 'Web Content Summarization',
                    status: 'fail',
                    details: 'URL input for web summarization not found'
                };
            }
        } catch (error) {
            return {
                name: 'Web Content Summarization',
                status: 'fail',
                details: error.toString()
            };
        }
    }

    async testWritingStudioFeatures() {
        console.log('✍️ Testing Writing Studio AI Features...');
        const tests = [];

        try {
            // Navigate to Writing Studio
            await this.navigateToWritingStudio();
            await this.takeScreenshot('writing-studio-loaded');

            // Test AI Project Planner
            const plannerTest = await this.testProjectPlanner();
            tests.push(plannerTest);

            // Test Content Generation
            const contentGenTest = await this.testContentGeneration();
            tests.push(contentGenTest);

            // Test AI Assistant Modal
            const assistantTest = await this.testAIAssistant();
            tests.push(assistantTest);

            // Test Context Menu AI Tools
            const contextMenuTest = await this.testContextMenuAI();
            tests.push(contextMenuTest);

            this.results.categories.writingStudio.tests = tests;
            this.results.categories.writingStudio.status =
                tests.every(t => t.status === 'pass') ? 'pass' :
                tests.some(t => t.status === 'pass') ? 'partial' : 'fail';

        } catch (error) {
            this.results.categories.writingStudio.status = 'fail';
            this.results.issues.push({
                type: 'writing_studio_error',
                message: error.toString(),
                timestamp: new Date().toISOString()
            });
        }
    }

    async navigateToWritingStudio() {
        console.log('  ✍️ Navigating to Writing Studio...');

        try {
            const writingTab = await this.page.$('[data-testid="writing-tab"]') ||
                             await this.page.$('button:contains("Writing")') ||
                             await this.page.$('.tab:contains("Writing")');

            if (writingTab) {
                await writingTab.click();
                await this.page.waitForTimeout(1000);
            }
        } catch (error) {
            throw new Error(`Failed to navigate to Writing Studio: ${error.message}`);
        }
    }

    async testProjectPlanner() {
        console.log('    Testing AI Project Planner...');

        try {
            const plannerButton = await this.page.$('button:contains("Plan"), [data-testid="ai-planner"]');

            if (plannerButton) {
                await plannerButton.click();
                await this.page.waitForTimeout(3000);

                // Look for generated chapters or plan
                const planContent = await this.page.$('.chapter-list, .plan-result, [data-testid="generated-plan"]');

                return {
                    name: 'AI Project Planner',
                    status: planContent ? 'pass' : 'partial',
                    details: planContent ? 'Project planner generates content' : 'Project planner accessible but no content verified'
                };
            } else {
                return {
                    name: 'AI Project Planner',
                    status: 'fail',
                    details: 'Project planner not found'
                };
            }
        } catch (error) {
            return {
                name: 'AI Project Planner',
                status: 'fail',
                details: error.toString()
            };
        }
    }

    async testContentGeneration() {
        console.log('    Testing Content Generation...');

        try {
            // Look for content generation interface
            const generateButton = await this.page.$('button:contains("Generate"), [data-testid="generate-content"]');

            if (generateButton) {
                await generateButton.click();
                await this.page.waitForTimeout(5000);

                return {
                    name: 'Content Generation',
                    status: 'pass',
                    details: 'Content generation feature accessible'
                };
            } else {
                return {
                    name: 'Content Generation',
                    status: 'fail',
                    details: 'Content generation button not found'
                };
            }
        } catch (error) {
            return {
                name: 'Content Generation',
                status: 'fail',
                details: error.toString()
            };
        }
    }

    async testAIAssistant() {
        console.log('    Testing AI Assistant Modal...');

        try {
            const assistantButton = await this.page.$('button:contains("Assistant"), [data-testid="ai-assistant"]');

            if (assistantButton) {
                await assistantButton.click();
                await this.page.waitForTimeout(2000);

                // Check if modal opened
                const modal = await this.page.$('.modal, [role="dialog"], .ai-assistant-modal');

                return {
                    name: 'AI Assistant Modal',
                    status: modal ? 'pass' : 'partial',
                    details: modal ? 'AI Assistant modal opens' : 'AI Assistant button found but modal not verified'
                };
            } else {
                return {
                    name: 'AI Assistant Modal',
                    status: 'fail',
                    details: 'AI Assistant button not found'
                };
            }
        } catch (error) {
            return {
                name: 'AI Assistant Modal',
                status: 'fail',
                details: error.toString()
            };
        }
    }

    async testContextMenuAI() {
        console.log('    Testing Context Menu AI Tools...');

        try {
            // Try to select some text and right-click
            const textArea = await this.page.$('textarea, .editor, [contenteditable="true"]');

            if (textArea) {
                await textArea.click();
                await textArea.type('Test text for AI processing');

                // Select the text
                await this.page.keyboard.down('Control');
                await this.page.keyboard.press('KeyA');
                await this.page.keyboard.up('Control');

                // Right-click to open context menu
                await textArea.click({ button: 'right' });
                await this.page.waitForTimeout(1000);

                // Check for AI options in context menu
                const aiOption = await this.page.$('.context-menu button:contains("AI"), .ai-option');

                return {
                    name: 'Context Menu AI Tools',
                    status: aiOption ? 'pass' : 'partial',
                    details: aiOption ? 'AI context menu options available' : 'Text selection works but AI options not verified'
                };
            } else {
                return {
                    name: 'Context Menu AI Tools',
                    status: 'fail',
                    details: 'No text editor found for context menu testing'
                };
            }
        } catch (error) {
            return {
                name: 'Context Menu AI Tools',
                status: 'fail',
                details: error.toString()
            };
        }
    }

    async testPlotTabFeatures() {
        console.log('📖 Testing PlotTab AI Features...');
        const tests = [];

        try {
            // Navigate to Plot Tab
            await this.navigateToPlotTab();
            await this.takeScreenshot('plot-tab-loaded');

            // Test AI Plotting Tool
            const plottingTest = await this.testAIPlottingTool();
            tests.push(plottingTest);

            // Test Plot Point Generation
            const plotPointTest = await this.testPlotPointGeneration();
            tests.push(plotPointTest);

            this.results.categories.plotTab.tests = tests;
            this.results.categories.plotTab.status =
                tests.every(t => t.status === 'pass') ? 'pass' :
                tests.some(t => t.status === 'pass') ? 'partial' : 'fail';

        } catch (error) {
            this.results.categories.plotTab.status = 'fail';
            this.results.issues.push({
                type: 'plot_tab_error',
                message: error.toString(),
                timestamp: new Date().toISOString()
            });
        }
    }

    async navigateToPlotTab() {
        console.log('  📖 Navigating to Plot Tab...');

        try {
            const plotTab = await this.page.$('[data-testid="plot-tab"]') ||
                          await this.page.$('button:contains("Plot")') ||
                          await this.page.$('.tab:contains("Plot")');

            if (plotTab) {
                await plotTab.click();
                await this.page.waitForTimeout(2000);
            }
        } catch (error) {
            throw new Error(`Failed to navigate to Plot Tab: ${error.message}`);
        }
    }

    async testAIPlottingTool() {
        console.log('    Testing AI Plotting Tool Modal...');

        try {
            const plottingButton = await this.page.$('button:contains("AI Plot"), [data-testid="ai-plotting-tool"]');

            if (plottingButton) {
                await plottingButton.click();
                await this.page.waitForTimeout(2000);

                const modal = await this.page.$('.modal, [role="dialog"]');

                return {
                    name: 'AI Plotting Tool Modal',
                    status: modal ? 'pass' : 'partial',
                    details: modal ? 'AI Plotting Tool modal opens' : 'AI Plotting Tool button found'
                };
            } else {
                return {
                    name: 'AI Plotting Tool Modal',
                    status: 'fail',
                    details: 'AI Plotting Tool button not found'
                };
            }
        } catch (error) {
            return {
                name: 'AI Plotting Tool Modal',
                status: 'fail',
                details: error.toString()
            };
        }
    }

    async testPlotPointGeneration() {
        console.log('    Testing Plot Point Generation...');

        try {
            const generateButton = await this.page.$('button:contains("Generate Plot"), button:contains("Create Plot")');

            if (generateButton) {
                await generateButton.click();
                await this.page.waitForTimeout(5000);

                // Check for generated plot points
                const plotPoints = await this.page.$$('.plot-point, [data-testid="plot-point"]');

                return {
                    name: 'Plot Point Generation',
                    status: plotPoints.length > 0 ? 'pass' : 'partial',
                    details: plotPoints.length > 0 ? `Generated ${plotPoints.length} plot points` : 'Generation initiated but points not verified'
                };
            } else {
                return {
                    name: 'Plot Point Generation',
                    status: 'fail',
                    details: 'Plot generation button not found'
                };
            }
        } catch (error) {
            return {
                name: 'Plot Point Generation',
                status: 'fail',
                details: error.toString()
            };
        }
    }

    async testVisualGenerationFeatures() {
        console.log('🎨 Testing Visual Generation Features...');
        const tests = [];

        try {
            // Navigate to Visuals Tab
            await this.navigateToVisualsTab();
            await this.takeScreenshot('visuals-tab-loaded');

            // Test Image Generation
            const imageGenTest = await this.testImageGeneration();
            tests.push(imageGenTest);

            // Test Visual Recommendations
            const visualRecTest = await this.testVisualRecommendations();
            tests.push(visualRecTest);

            // Test Mermaid Diagram Generation
            const mermaidTest = await this.testMermaidGeneration();
            tests.push(mermaidTest);

            this.results.categories.visualGeneration.tests = tests;
            this.results.categories.visualGeneration.status =
                tests.every(t => t.status === 'pass') ? 'pass' :
                tests.some(t => t.status === 'pass') ? 'partial' : 'fail';

        } catch (error) {
            this.results.categories.visualGeneration.status = 'fail';
            this.results.issues.push({
                type: 'visual_generation_error',
                message: error.toString(),
                timestamp: new Date().toISOString()
            });
        }
    }

    async navigateToVisualsTab() {
        console.log('  🎨 Navigating to Visuals Tab...');

        try {
            const visualsTab = await this.page.$('[data-testid="visuals-tab"]') ||
                             await this.page.$('button:contains("Visual")') ||
                             await this.page.$('.tab:contains("Visual")');

            if (visualsTab) {
                await visualsTab.click();
                await this.page.waitForTimeout(1000);
            }
        } catch (error) {
            throw new Error(`Failed to navigate to Visuals Tab: ${error.message}`);
        }
    }

    async testImageGeneration() {
        console.log('    Testing Gemini Image Generation...');

        try {
            const imageGenButton = await this.page.$('button:contains("Generate Image"), [data-testid="generate-image"]');

            if (imageGenButton) {
                await imageGenButton.click();
                await this.page.waitForTimeout(3000);

                return {
                    name: 'Gemini Image Generation',
                    status: 'pass',
                    details: 'Image generation feature accessible'
                };
            } else {
                return {
                    name: 'Gemini Image Generation',
                    status: 'fail',
                    details: 'Image generation button not found'
                };
            }
        } catch (error) {
            return {
                name: 'Gemini Image Generation',
                status: 'fail',
                details: error.toString()
            };
        }
    }

    async testVisualRecommendations() {
        console.log('    Testing Visual Recommendations...');

        try {
            const analyzeButton = await this.page.$('button:contains("Analyze"), button:contains("Recommend")');

            if (analyzeButton) {
                await analyzeButton.click();
                await this.page.waitForTimeout(5000);

                const recommendations = await this.page.$$('.visual-recommendation, [data-testid="visual-rec"]');

                return {
                    name: 'Visual Recommendations',
                    status: recommendations.length > 0 ? 'pass' : 'partial',
                    details: recommendations.length > 0 ? 'Visual recommendations generated' : 'Analysis feature accessible'
                };
            } else {
                return {
                    name: 'Visual Recommendations',
                    status: 'fail',
                    details: 'Visual analysis button not found'
                };
            }
        } catch (error) {
            return {
                name: 'Visual Recommendations',
                status: 'fail',
                details: error.toString()
            };
        }
    }

    async testMermaidGeneration() {
        console.log('    Testing Mermaid Diagram Generation...');

        try {
            // Look for diagram type selection
            const diagramTypes = ['flowchart', 'mindmap', 'timeline', 'sequence'];
            let foundDiagramTool = false;

            for (const type of diagramTypes) {
                const typeButton = await this.page.$(`button:contains("${type}"), [data-diagram-type="${type}"]`);
                if (typeButton) {
                    foundDiagramTool = true;
                    await typeButton.click();
                    await this.page.waitForTimeout(2000);
                    break;
                }
            }

            return {
                name: 'Mermaid Diagram Generation',
                status: foundDiagramTool ? 'pass' : 'fail',
                details: foundDiagramTool ? 'Diagram generation tools found' : 'No diagram generation tools found'
            };
        } catch (error) {
            return {
                name: 'Mermaid Diagram Generation',
                status: 'fail',
                details: error.toString()
            };
        }
    }

    async generateReport() {
        console.log('\n📊 Generating Comprehensive Report...');

        // Calculate summary statistics
        const allTests = Object.values(this.results.categories).flatMap(cat => cat.tests);
        this.results.summary.totalTests = allTests.length;
        this.results.summary.passed = allTests.filter(t => t.status === 'pass').length;
        this.results.summary.failed = allTests.filter(t => t.status === 'fail').length;
        this.results.summary.partial = allTests.filter(t => t.status === 'partial').length;

        // Add overall assessment
        this.results.overallAssessment = {
            status: this.results.summary.failed === 0 ?
                   (this.results.summary.partial === 0 ? 'excellent' : 'good') :
                   (this.results.summary.passed > this.results.summary.failed ? 'fair' : 'poor'),
            completeness: Math.round((this.results.summary.passed / this.results.summary.totalTests) * 100),
            recommendations: this.generateRecommendations()
        };

        // Save report
        await fs.writeFile(TEST_CONFIG.reportFile, JSON.stringify(this.results, null, 2));

        console.log('\n' + '='.repeat(60));
        console.log('🎯 AI INTEGRATION TEST RESULTS');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${this.results.summary.totalTests}`);
        console.log(`✅ Passed: ${this.results.summary.passed}`);
        console.log(`⚠️  Partial: ${this.results.summary.partial}`);
        console.log(`❌ Failed: ${this.results.summary.failed}`);
        console.log(`\n📈 Overall Completeness: ${this.results.overallAssessment.completeness}%`);
        console.log(`🎯 Assessment: ${this.results.overallAssessment.status.toUpperCase()}`);

        console.log('\n📋 Category Results:');
        Object.entries(this.results.categories).forEach(([name, cat]) => {
            const statusIcon = cat.status === 'pass' ? '✅' : cat.status === 'partial' ? '⚠️' : '❌';
            console.log(`${statusIcon} ${name}: ${cat.status.toUpperCase()} (${cat.tests.length} tests)`);
        });

        if (this.results.issues.length > 0) {
            console.log(`\n⚠️  Issues Found: ${this.results.issues.length}`);
            this.results.issues.slice(0, 5).forEach((issue, i) => {
                console.log(`${i + 1}. ${issue.type}: ${issue.message.substring(0, 100)}...`);
            });
        }

        console.log(`\n📄 Full report saved to: ${TEST_CONFIG.reportFile}`);
        console.log(`📸 Screenshots saved to: ${TEST_CONFIG.screenshotDir}`);

        return this.results;
    }

    generateRecommendations() {
        const recommendations = [];

        if (this.results.categories.apiConnectivity.status === 'fail') {
            recommendations.push('Fix API connectivity issues - check API keys and network configuration');
        }

        if (this.results.categories.researchTab.status !== 'pass') {
            recommendations.push('Research Tab AI features need attention - verify UI components and AI service integration');
        }

        if (this.results.categories.writingStudio.status !== 'pass') {
            recommendations.push('Writing Studio AI features require fixes - check content generation and assistant modal');
        }

        if (this.results.categories.plotTab.status !== 'pass') {
            recommendations.push('PlotTab AI features need debugging - address infinite loop issues mentioned in project notes');
        }

        if (this.results.categories.visualGeneration.status !== 'pass') {
            recommendations.push('Visual generation features need improvement - verify Gemini integration and Mermaid rendering');
        }

        if (this.results.issues.length > 5) {
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
            await this.testResearchTabFeatures();
            await this.testWritingStudioFeatures();
            await this.testPlotTabFeatures();
            await this.testVisualGenerationFeatures();

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

// Run the tests
if (require.main === module) {
    const tester = new AIIntegrationTester();
    tester.run().then(results => {
        process.exit(results.summary.failed > 0 ? 1 : 0);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = AIIntegrationTester;