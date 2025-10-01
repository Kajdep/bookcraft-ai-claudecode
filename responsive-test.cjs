/**
 * Quick Responsive Design Test for BookCraft AI
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;

async function testResponsive() {
    console.log('📱 Starting Responsive Design Test...\n');

    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500 
    });
    const page = await browser.newPage();

    const results = {
        viewports: [],
        issues: []
    };

    // Test different screen sizes
    const viewports = [
        { name: 'Desktop Large', width: 1920, height: 1080 },
        { name: 'Desktop Medium', width: 1366, height: 768 },
        { name: 'Tablet Portrait', width: 768, height: 1024 },
        { name: 'Tablet Landscape', width: 1024, height: 768 },
        { name: 'Mobile Large', width: 414, height: 896 },
        { name: 'Mobile Medium', width: 375, height: 667 },
        { name: 'Mobile Small', width: 320, height: 568 }
    ];

    await fs.mkdir('./test-screenshots/responsive', { recursive: true });

    for (const viewport of viewports) {
        console.log(`🔍 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
        
        try {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
            await page.waitForTimeout(2000);
            
            // Take screenshot
            await page.screenshot({ 
                path: `./test-screenshots/responsive/${viewport.name.toLowerCase().replace(/\s+/g, '-')}.png`,
                fullPage: true 
            });

            // Basic layout tests
            const header = await page.$('header');
            const mainContent = await page.$('main, .main-content');
            const horizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
            
            const result = {
                name: viewport.name,
                width: viewport.width,
                height: viewport.height,
                hasHeader: !!header,
                hasMainContent: !!mainContent,
                hasHorizontalScroll: horizontalScroll,
                status: (header && mainContent && !horizontalScroll) ? 'pass' : 'fail'
            };

            if (horizontalScroll) {
                results.issues.push(`${viewport.name}: Horizontal scroll detected`);
            }

            results.viewports.push(result);
            
            console.log(`   ${result.status === 'pass' ? '✅' : '❌'} ${result.status.toUpperCase()}`);
            if (result.hasHorizontalScroll) {
                console.log('   ⚠️ Horizontal scroll detected');
            }

        } catch (error) {
            console.log(`   ❌ Error testing ${viewport.name}: ${error.message}`);
            results.issues.push(`${viewport.name}: ${error.message}`);
        }
    }

    await browser.close();

    // Generate summary
    const passedViewports = results.viewports.filter(v => v.status === 'pass').length;
    const totalViewports = results.viewports.length;
    
    console.log('\n' + '='.repeat(50));
    console.log('📱 RESPONSIVE DESIGN TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${passedViewports}/${totalViewports} viewports`);
    console.log(`⚠️ Issues: ${results.issues.length}`);
    
    if (results.issues.length > 0) {
        console.log('\n🐛 Issues Found:');
        results.issues.forEach((issue, i) => {
            console.log(`   ${i + 1}. ${issue}`);
        });
    }

    // Save detailed results
    await fs.writeFile('./RESPONSIVE_TEST_RESULTS.json', JSON.stringify(results, null, 2));
    console.log('\n📄 Full results saved to: ./RESPONSIVE_TEST_RESULTS.json');
    console.log('📸 Screenshots saved to: ./test-screenshots/responsive/');

    return results;
}

// Run the test
testResponsive().then(results => {
    const passRate = (results.viewports.filter(v => v.status === 'pass').length / results.viewports.length) * 100;
    console.log(`\n🎯 Overall Responsive Score: ${Math.round(passRate)}%`);
    
    if (passRate >= 80) {
        console.log('✅ Responsive design test PASSED');
        process.exit(0);
    } else {
        console.log('⚠️ Responsive design test needs attention');
        process.exit(1);
    }
}).catch(error => {
    console.error('❌ Responsive test failed:', error);
    process.exit(1);
});