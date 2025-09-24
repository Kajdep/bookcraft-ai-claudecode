const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class PerformanceAuditor {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            bundleAnalysis: {},
            startupPerformance: {},
            componentPerformance: {},
            memoryUsage: {},
            networkMetrics: {},
            realUserMetrics: {},
            recommendations: []
        };
    }

    async initialize() {
        this.browser = await chromium.launch({
            headless: false,
            args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        });
        this.page = await this.browser.newPage();

        // Enable performance monitoring
        await this.page.context().grantPermissions(['microphone', 'camera']);

        // Inject performance monitoring scripts
        await this.page.addInitScript(() => {
            window.performanceMetrics = {
                loadStart: performance.now(),
                componentMounts: [],
                renderTimes: [],
                memorySnapshots: []
            };

            // Monitor component mount times
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.entryType === 'measure') {
                        window.performanceMetrics.renderTimes.push({
                            name: entry.name,
                            duration: entry.duration,
                            startTime: entry.startTime
                        });
                    }
                });
            });
            observer.observe({ entryTypes: ['measure'] });

            // Memory monitoring
            if (performance.memory) {
                setInterval(() => {
                    window.performanceMetrics.memorySnapshots.push({
                        timestamp: performance.now(),
                        used: performance.memory.usedJSHeapSize,
                        total: performance.memory.totalJSHeapSize,
                        limit: performance.memory.jsHeapSizeLimit
                    });
                }, 1000);
            }
        });
    }

    async analyzeBundleSize() {
        console.log('📦 Analyzing bundle composition...');

        const distPath = path.join(__dirname, 'dist', 'assets');
        const files = fs.readdirSync(distPath);

        let totalSize = 0;
        const fileAnalysis = [];

        for (const file of files) {
            const filePath = path.join(distPath, file);
            const stats = fs.statSync(filePath);
            const sizeKB = (stats.size / 1024).toFixed(2);
            totalSize += stats.size;

            fileAnalysis.push({
                name: file,
                size: stats.size,
                sizeKB: parseFloat(sizeKB),
                type: file.includes('.js') ? 'JavaScript' :
                      file.includes('.css') ? 'CSS' : 'Other'
            });
        }

        // Sort by size
        fileAnalysis.sort((a, b) => b.size - a.size);

        this.results.bundleAnalysis = {
            totalSizeKB: (totalSize / 1024).toFixed(2),
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
            files: fileAnalysis,
            largestFiles: fileAnalysis.slice(0, 10),
            jsSize: fileAnalysis
                .filter(f => f.type === 'JavaScript')
                .reduce((sum, f) => sum + f.size, 0),
            cssSize: fileAnalysis
                .filter(f => f.type === 'CSS')
                .reduce((sum, f) => sum + f.size, 0)
        };

        // Bundle size recommendations
        if (totalSize > 2 * 1024 * 1024) { // > 2MB
            this.results.recommendations.push({
                category: 'Bundle Size',
                severity: 'High',
                issue: 'Bundle size exceeds 2MB, which may impact loading performance',
                suggestion: 'Consider code splitting, lazy loading, and tree shaking'
            });
        }

        // Check for large individual files
        const largeFiles = fileAnalysis.filter(f => f.size > 500 * 1024); // > 500KB
        if (largeFiles.length > 0) {
            this.results.recommendations.push({
                category: 'Bundle Optimization',
                severity: 'Medium',
                issue: `${largeFiles.length} files exceed 500KB`,
                suggestion: 'Break down large chunks using dynamic imports',
                files: largeFiles.map(f => f.name)
            });
        }
    }

    async measureStartupPerformance() {
        console.log('🚀 Measuring application startup performance...');

        const startTime = Date.now();

        // Start development server if not running
        await this.startDevServer();

        // Navigate and measure initial load
        const response = await this.page.goto('http://localhost:5173', {
            waitUntil: 'networkidle'
        });

        const loadTime = Date.now() - startTime;

        // Get Core Web Vitals
        const webVitals = await this.page.evaluate(() => {
            return new Promise((resolve) => {
                const vitals = {};

                // LCP (Largest Contentful Paint)
                new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    vitals.lcp = lastEntry.startTime;
                }).observe({ type: 'largest-contentful-paint', buffered: true });

                // FID (First Input Delay) - will be measured on interaction
                new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const firstEntry = entries[0];
                    vitals.fid = firstEntry.processingStart - firstEntry.startTime;
                }).observe({ type: 'first-input', buffered: true });

                // CLS (Cumulative Layout Shift)
                let clsValue = 0;
                new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    }
                    vitals.cls = clsValue;
                }).observe({ type: 'layout-shift', buffered: true });

                // FCP (First Contentful Paint)
                new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const firstEntry = entries[0];
                    vitals.fcp = firstEntry.startTime;
                }).observe({ type: 'paint', buffered: true });

                setTimeout(() => resolve(vitals), 2000);
            });
        });

        // Get navigation timing
        const navigationTiming = await this.page.evaluate(() => {
            const timing = performance.getEntriesByType('navigation')[0];
            return {
                domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
                domComplete: timing.domComplete - timing.navigationStart,
                loadComplete: timing.loadEventEnd - timing.navigationStart,
                networkTime: timing.responseEnd - timing.requestStart,
                renderTime: timing.domComplete - timing.responseEnd
            };
        });

        this.results.startupPerformance = {
            totalLoadTime: loadTime,
            webVitals,
            navigationTiming,
            status: response.status()
        };

        // Performance recommendations based on metrics
        if (webVitals.lcp > 2500) {
            this.results.recommendations.push({
                category: 'Core Web Vitals',
                severity: 'High',
                issue: `LCP (${webVitals.lcp}ms) exceeds recommended 2.5s`,
                suggestion: 'Optimize largest content element, preload critical resources'
            });
        }

        if (webVitals.fcp > 1800) {
            this.results.recommendations.push({
                category: 'Core Web Vitals',
                severity: 'Medium',
                issue: `FCP (${webVitals.fcp}ms) exceeds recommended 1.8s`,
                suggestion: 'Minimize main thread blocking, optimize critical rendering path'
            });
        }

        if (webVitals.cls > 0.1) {
            this.results.recommendations.push({
                category: 'Core Web Vitals',
                severity: 'Medium',
                issue: `CLS (${webVitals.cls}) exceeds recommended 0.1`,
                suggestion: 'Set size attributes on images, avoid inserting content above existing content'
            });
        }
    }

    async measureComponentPerformance() {
        console.log('⚛️ Measuring component rendering performance...');

        // Test component mounting and rendering times
        await this.page.evaluate(() => {
            performance.mark('component-test-start');
        });

        // Wait for app to be ready
        await this.page.waitForSelector('[data-testid="main-layout"], .min-h-screen', { timeout: 10000 });

        // Test modal opening performance
        const createProjectButton = await this.page.$('text="New Project"');
        if (createProjectButton) {
            await this.page.evaluate(() => performance.mark('modal-open-start'));
            await createProjectButton.click();
            await this.page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 }).catch(() => null);
            await this.page.evaluate(() => {
                performance.mark('modal-open-end');
                performance.measure('modal-open-time', 'modal-open-start', 'modal-open-end');
            });
        }

        // Test navigation performance
        const tabs = await this.page.$$('[role="tab"], .tab');
        if (tabs.length > 0) {
            for (let i = 0; i < Math.min(3, tabs.length); i++) {
                await this.page.evaluate((index) => performance.mark(`tab-switch-${index}-start`), i);
                await tabs[i].click();
                await this.page.waitForTimeout(100);
                await this.page.evaluate((index) => {
                    performance.mark(`tab-switch-${index}-end`);
                    performance.measure(`tab-switch-${index}`, `tab-switch-${index}-start`, `tab-switch-${index}-end`);
                }, i);
            }
        }

        // Get all performance measurements
        const measurements = await this.page.evaluate(() => {
            const measures = performance.getEntriesByType('measure');
            return measures.map(measure => ({
                name: measure.name,
                duration: measure.duration,
                startTime: measure.startTime
            }));
        });

        this.results.componentPerformance = {
            measurements,
            modalOpenTime: measurements.find(m => m.name === 'modal-open-time')?.duration || null,
            tabSwitchTimes: measurements.filter(m => m.name.includes('tab-switch'))
        };

        // Component performance recommendations
        const slowComponents = measurements.filter(m => m.duration > 100);
        if (slowComponents.length > 0) {
            this.results.recommendations.push({
                category: 'Component Performance',
                severity: 'Medium',
                issue: `${slowComponents.length} components have render times > 100ms`,
                suggestion: 'Optimize rendering with React.memo, useMemo, useCallback',
                components: slowComponents
            });
        }
    }

    async measureMemoryUsage() {
        console.log('🧠 Measuring memory usage patterns...');

        const initialMemory = await this.page.evaluate(() => {
            if (performance.memory) {
                return {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                };
            }
            return null;
        });

        // Simulate user interactions to check for memory leaks
        await this.simulateUserInteractions();

        const finalMemory = await this.page.evaluate(() => {
            if (performance.memory) {
                return {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                };
            }
            return null;
        });

        // Get memory snapshots
        const memorySnapshots = await this.page.evaluate(() => {
            return window.performanceMetrics?.memorySnapshots || [];
        });

        this.results.memoryUsage = {
            initial: initialMemory,
            final: finalMemory,
            growth: finalMemory && initialMemory ?
                finalMemory.used - initialMemory.used : 0,
            snapshots: memorySnapshots,
            gcCount: await this.page.evaluate(() => {
                return performance.getEntriesByType('gc').length;
            })
        };

        // Memory leak detection
        if (finalMemory && initialMemory) {
            const growthMB = (finalMemory.used - initialMemory.used) / (1024 * 1024);
            if (growthMB > 10) { // > 10MB growth
                this.results.recommendations.push({
                    category: 'Memory Management',
                    severity: 'High',
                    issue: `Memory usage increased by ${growthMB.toFixed(2)}MB during testing`,
                    suggestion: 'Check for memory leaks, properly cleanup event listeners and subscriptions'
                });
            }
        }
    }

    async testLargeProjectHandling() {
        console.log('📚 Testing large project handling...');

        // Create a large project with many chapters
        await this.page.evaluate(() => {
            const store = window.__BOOKCRAFT_STORE__;
            if (store) {
                // Add a project with many chapters
                store.getState().addProject({
                    title: 'Performance Test Project',
                    genre: 'Fiction',
                    visualStyle: 'Modern'
                });

                // Add 50 chapters
                for (let i = 0; i < 50; i++) {
                    store.getState().addChapter();
                }
            }
        });

        const renderStart = Date.now();
        await this.page.waitForTimeout(2000); // Wait for renders to complete
        const renderTime = Date.now() - renderStart;

        // Test scrolling performance
        const scrollStart = Date.now();
        await this.page.evaluate(() => {
            window.scrollBy(0, 1000);
        });
        await this.page.waitForTimeout(100);
        const scrollTime = Date.now() - scrollStart;

        this.results.largeProjectPerformance = {
            renderTime,
            scrollTime,
            chapterCount: 50
        };

        if (renderTime > 1000) {
            this.results.recommendations.push({
                category: 'Large Dataset Performance',
                severity: 'Medium',
                issue: `Large project rendering took ${renderTime}ms`,
                suggestion: 'Implement virtualization for large lists, use React.memo for list items'
            });
        }
    }

    async testAutoSavePerformance() {
        console.log('💾 Testing auto-save performance impact...');

        const performanceStart = performance.now();

        // Simulate typing in the editor
        const editor = await this.page.$('[contenteditable="true"], textarea, input[type="text"]');
        if (editor) {
            await this.page.evaluate(() => performance.mark('autosave-test-start'));

            // Type content that would trigger auto-save
            await editor.type('This is a test of auto-save performance. '.repeat(10));

            await this.page.waitForTimeout(2000); // Wait for any debounced saves

            await this.page.evaluate(() => {
                performance.mark('autosave-test-end');
                performance.measure('autosave-test', 'autosave-test-start', 'autosave-test-end');
            });
        }

        const autoSaveMetrics = await this.page.evaluate(() => {
            const measure = performance.getEntriesByName('autosave-test')[0];
            return measure ? { duration: measure.duration } : null;
        });

        this.results.autoSavePerformance = autoSaveMetrics;

        if (autoSaveMetrics && autoSaveMetrics.duration > 500) {
            this.results.recommendations.push({
                category: 'Auto-save Performance',
                severity: 'Medium',
                issue: `Auto-save operations taking ${autoSaveMetrics.duration}ms`,
                suggestion: 'Optimize state updates, implement better debouncing, use incremental saves'
            });
        }
    }

    async testAIOperationPerformance() {
        console.log('🤖 Testing AI operation performance...');

        // Mock AI operations to test UI responsiveness
        await this.page.evaluate(() => {
            // Override AI service to simulate slow operations
            if (window.__AI_SERVICE__) {
                const originalGenerate = window.__AI_SERVICE__.generateContent;
                window.__AI_SERVICE__.generateContent = async (...args) => {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
                    return originalGenerate?.(...args) || 'Mock content';
                };
            }
        });

        // Test AI generation UI responsiveness
        const aiButton = await this.page.$('text="Generate", [data-testid="ai-generate"]');
        if (aiButton) {
            await this.page.evaluate(() => performance.mark('ai-operation-start'));
            await aiButton.click();
            await this.page.waitForTimeout(100);
            await this.page.evaluate(() => {
                performance.mark('ai-operation-end');
                performance.measure('ai-operation-ui', 'ai-operation-start', 'ai-operation-end');
            });
        }

        const aiMetrics = await this.page.evaluate(() => {
            const measure = performance.getEntriesByName('ai-operation-ui')[0];
            return measure ? { duration: measure.duration } : null;
        });

        this.results.aiOperationPerformance = aiMetrics;
    }

    async simulateUserInteractions() {
        // Simulate typical user workflow
        await this.page.mouse.move(100, 100);
        await this.page.mouse.click(100, 100);

        // Try to interact with common elements
        const buttons = await this.page.$$('button');
        for (let i = 0; i < Math.min(5, buttons.length); i++) {
            await buttons[i].click();
            await this.page.waitForTimeout(100);
        }

        // Scroll around
        await this.page.mouse.wheel(0, 500);
        await this.page.waitForTimeout(200);
        await this.page.mouse.wheel(0, -500);
    }

    async startDevServer() {
        // Check if dev server is already running
        try {
            const response = await fetch('http://localhost:5173');
            if (response.ok) return;
        } catch (e) {
            // Server not running, start it
            console.log('Starting development server...');
            const { spawn } = require('child_process');
            const server = spawn('npm', ['run', 'dev'], {
                detached: true,
                stdio: 'ignore'
            });
            server.unref();

            // Wait for server to start
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                bundleSize: `${this.results.bundleAnalysis.totalSizeMB}MB`,
                loadTime: `${this.results.startupPerformance?.totalLoadTime || 'N/A'}ms`,
                lcp: `${this.results.startupPerformance?.webVitals?.lcp || 'N/A'}ms`,
                memoryGrowth: this.results.memoryUsage?.growth ?
                    `${(this.results.memoryUsage.growth / (1024 * 1024)).toFixed(2)}MB` : 'N/A',
                recommendations: this.results.recommendations.length
            },
            details: this.results,
            prioritizedRecommendations: this.results.recommendations
                .sort((a, b) => {
                    const severityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
                    return severityOrder[b.severity] - severityOrder[a.severity];
                })
        };

        // Write detailed report
        const reportPath = path.join(__dirname, 'performance-audit-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        console.log('\n' + '='.repeat(80));
        console.log('📊 PERFORMANCE AUDIT REPORT');
        console.log('='.repeat(80));
        console.log(`📦 Bundle Size: ${report.summary.bundleSize}`);
        console.log(`🚀 Load Time: ${report.summary.loadTime}`);
        console.log(`🎯 LCP: ${report.summary.lcp}`);
        console.log(`🧠 Memory Growth: ${report.summary.memoryGrowth}`);
        console.log(`⚠️  Recommendations: ${report.summary.recommendations}`);
        console.log('\n📋 TOP RECOMMENDATIONS:');

        report.prioritizedRecommendations.slice(0, 5).forEach((rec, index) => {
            console.log(`${index + 1}. [${rec.severity}] ${rec.category}: ${rec.issue}`);
            console.log(`   💡 ${rec.suggestion}\n`);
        });

        console.log(`📄 Detailed report saved to: ${reportPath}`);
        console.log('='.repeat(80));

        return report;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async runFullAudit() {
        try {
            await this.initialize();
            await this.analyzeBundleSize();
            await this.measureStartupPerformance();
            await this.measureComponentPerformance();
            await this.measureMemoryUsage();
            await this.testLargeProjectHandling();
            await this.testAutoSavePerformance();
            await this.testAIOperationPerformance();

            return this.generateReport();
        } catch (error) {
            console.error('Performance audit failed:', error);
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// Run the audit
if (require.main === module) {
    const auditor = new PerformanceAuditor();
    auditor.runFullAudit()
        .then(report => {
            console.log('Performance audit completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('Audit failed:', error);
            process.exit(1);
        });
}

module.exports = PerformanceAuditor;