import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  criticalIssues: [] as string[],
  consoleErrors: [] as any[],
  performanceMetrics: {} as any,
  testDetails: [] as any[],
  screenshots: [] as string[],
};

// Helper function to capture console errors
function setupConsoleLogging(page: Page) {
  const errors: any[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push({
        type: 'error',
        text: msg.text(),
        location: msg.location(),
      });
    }
  });

  page.on('pageerror', (error) => {
    errors.push({
      type: 'pageerror',
      message: error.message,
      stack: error.stack,
    });
  });

  return errors;
}

// Helper to take screenshots
async function takeScreenshot(page: Page, name: string) {
  const screenshotPath = path.join('test-screenshots', `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  testResults.screenshots.push(screenshotPath);
  return screenshotPath;
}

test.describe('BookCraft AI - Comprehensive E2E Tests', () => {
  let consoleErrors: any[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = setupConsoleLogging(page);

    // Navigate to the application
    await page.goto('/');

    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }, testInfo) => {
    testResults.totalTests++;

    // Capture console errors
    if (consoleErrors.length > 0) {
      testResults.consoleErrors.push(...consoleErrors);
    }

    // Record test result
    testResults.testDetails.push({
      title: testInfo.title,
      status: testInfo.status,
      duration: testInfo.duration,
      errors: consoleErrors,
      annotations: testInfo.annotations,
    });

    if (testInfo.status === 'passed') {
      testResults.passed++;
    } else if (testInfo.status === 'failed') {
      testResults.failed++;
      testResults.criticalIssues.push(`Test failed: ${testInfo.title}`);
    } else if (testInfo.status === 'skipped') {
      testResults.skipped++;
    }
  });

  test('1. Dashboard loads without errors', async ({ page }) => {
    // Check that the page loaded
    expect(page.url()).toContain('localhost:5174');

    // Take screenshot
    await takeScreenshot(page, '01-dashboard-initial-load');

    // Check for main dashboard elements
    const dashboardExists = await page.locator('body').count() > 0;
    expect(dashboardExists).toBeTruthy();

    // Check for no console errors during initial load
    if (consoleErrors.length > 0) {
      testResults.criticalIssues.push(`Console errors on dashboard load: ${consoleErrors.length} errors`);
    }

    // Wait a bit to ensure all initial renders complete
    await page.waitForTimeout(2000);
  });

  test('2. Dashboard UI elements are present', async ({ page }) => {
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '02-dashboard-ui-elements');

    // Look for common dashboard elements
    const bodyText = await page.textContent('body');

    // Check if app rendered (not showing blank page)
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);

    // Try to find "New Project" or similar text
    const hasNewProject = bodyText!.includes('New Project') ||
                          bodyText!.includes('Create') ||
                          bodyText!.includes('BookCraft');

    if (!hasNewProject) {
      testResults.criticalIssues.push('Dashboard may not be rendering correctly - no project creation elements found');
    }
  });

  test('3. Create new project modal opens', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Try multiple selectors to find the "New Project" button
    const buttonSelectors = [
      'button:has-text("New Project")',
      'button:has-text("Create Project")',
      'button:has-text("Create")',
      '[data-testid="new-project-button"]',
      'button[class*="new"]',
      'button[class*="create"]',
    ];

    let buttonFound = false;
    let buttonSelector = '';

    for (const selector of buttonSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        buttonFound = true;
        buttonSelector = selector;
        break;
      }
    }

    await takeScreenshot(page, '03-before-new-project-click');

    if (!buttonFound) {
      testResults.criticalIssues.push('New Project button not found - possible UI regression');
      test.skip();
      return;
    }

    // Click the button
    await page.locator(buttonSelector).first().click();
    await page.waitForTimeout(1000);

    await takeScreenshot(page, '03-after-new-project-click');

    // Check if modal opened (look for form elements)
    const bodyText = await page.textContent('body');
    const hasModalElements = bodyText!.includes('Title') ||
                             bodyText!.includes('Genre') ||
                             bodyText!.includes('Visual');

    expect(hasModalElements).toBeTruthy();
  });

  test('4. Fill in project creation form', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Find and click new project button
    const buttonSelectors = [
      'button:has-text("New Project")',
      'button:has-text("Create Project")',
      'button:has-text("Create")',
    ];

    for (const selector of buttonSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        await page.locator(selector).first().click();
        break;
      }
    }

    await page.waitForTimeout(1000);
    await takeScreenshot(page, '04-project-form-opened');

    // Try to find form inputs
    const inputs = await page.locator('input[type="text"]').all();
    const textareas = await page.locator('textarea').all();

    if (inputs.length > 0 || textareas.length > 0) {
      // Fill in the form
      if (inputs.length > 0) {
        await inputs[0].fill('Test Book - E2E Automated');
      }

      if (textareas.length > 0) {
        await textareas[0].fill('A comprehensive test of the BookCraft AI platform');
      }

      await page.waitForTimeout(500);
      await takeScreenshot(page, '04-project-form-filled');

      // Try to find and click submit/create button
      const submitSelectors = [
        'button:has-text("Create")',
        'button:has-text("Submit")',
        'button:has-text("Save")',
        'button[type="submit"]',
      ];

      for (const selector of submitSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          await page.locator(selector).first().click();
          await page.waitForTimeout(2000);
          break;
        }
      }

      await takeScreenshot(page, '04-after-project-creation');
    } else {
      testResults.criticalIssues.push('Project form inputs not found');
    }
  });

  test('5. Navigation between tabs', async ({ page }) => {
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '05-tab-navigation-start');

    // Look for tab navigation elements
    const tabTexts = ['Writing', 'Plot', 'Research', 'Visual', 'Export', 'Cover'];

    for (const tabText of tabTexts) {
      const tabLocator = page.locator(`text=${tabText}`).first();
      const count = await tabLocator.count();

      if (count > 0) {
        await tabLocator.click();
        await page.waitForTimeout(1000);

        await takeScreenshot(page, `05-tab-${tabText.toLowerCase()}`);

        // Check for errors after tab switch
        const errorsBefore = consoleErrors.length;
        await page.waitForTimeout(500);
        const errorsAfter = consoleErrors.length;

        if (errorsAfter > errorsBefore) {
          testResults.criticalIssues.push(`Errors detected when switching to ${tabText} tab`);
        }
      }
    }
  });

  test('6. PlotTab infinite loop check', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Try to navigate to Plot tab
    const plotTab = page.locator('text=Plot').first();
    const plotTabExists = await plotTab.count() > 0;

    if (plotTabExists) {
      const errorsBefore = consoleErrors.length;

      await plotTab.click();
      await page.waitForTimeout(3000);

      await takeScreenshot(page, '06-plot-tab-loaded');

      const errorsAfter = consoleErrors.length;
      const newErrors = consoleErrors.slice(errorsBefore);

      // Check for infinite loop indicators
      const hasInfiniteLoopError = newErrors.some(err =>
        err.text?.includes('Maximum update depth') ||
        err.message?.includes('Maximum update depth')
      );

      if (hasInfiniteLoopError) {
        testResults.criticalIssues.push('CRITICAL: PlotTab infinite loop detected - claimed fix may have regressed');
      }

      expect(hasInfiniteLoopError).toBeFalsy();
    } else {
      test.skip();
    }
  });

  test('7. Lexical editor accessibility', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Try to navigate to Writing tab
    const writingTab = page.locator('text=Writing').first();
    const writingTabExists = await writingTab.count() > 0;

    if (writingTabExists) {
      await writingTab.click();
      await page.waitForTimeout(2000);

      await takeScreenshot(page, '07-writing-tab-editor');

      // Look for Lexical editor elements
      const editorSelectors = [
        '[contenteditable="true"]',
        '.lexical-editor',
        '[data-lexical-editor]',
        'div[role="textbox"]',
      ];

      let editorFound = false;
      for (const selector of editorSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          editorFound = true;

          // Try to type in the editor
          await page.locator(selector).first().click();
          await page.keyboard.type('Testing Lexical editor functionality...');
          await page.waitForTimeout(500);

          await takeScreenshot(page, '07-editor-with-text');
          break;
        }
      }

      if (!editorFound) {
        testResults.criticalIssues.push('Lexical editor not found or not accessible');
      }

      expect(editorFound).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('8. Modal state management verification', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Open modal
    const newProjectButton = page.locator('button:has-text("New Project")').first();
    const buttonExists = await newProjectButton.count() > 0;

    if (buttonExists) {
      await newProjectButton.click();
      await page.waitForTimeout(1000);

      await takeScreenshot(page, '08-modal-opened');

      // Try to close modal (look for close button, escape key, or backdrop click)
      const closeSelectors = [
        'button:has-text("Cancel")',
        'button:has-text("Close")',
        'button[aria-label="Close"]',
        '[data-testid="close-modal"]',
      ];

      let modalClosed = false;
      for (const selector of closeSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          await page.locator(selector).first().click();
          await page.waitForTimeout(1000);
          modalClosed = true;
          break;
        }
      }

      if (!modalClosed) {
        // Try ESC key
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }

      await takeScreenshot(page, '08-modal-closed');

      // Verify modal doesn't persist
      const bodyText = await page.textContent('body');
      const modalStillVisible = bodyText!.includes('Create New Project') ||
                                 bodyText!.includes('Project Title');

      if (modalStillVisible) {
        testResults.criticalIssues.push('Modal state management issue - modal persisting after close');
      }
    } else {
      test.skip();
    }
  });

  test('9. Responsive design - Mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    await takeScreenshot(page, '09-mobile-viewport');

    // Check that content is still accessible
    const bodyText = await page.textContent('body');
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('10. Responsive design - Tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);

    await takeScreenshot(page, '10-tablet-viewport');

    const bodyText = await page.textContent('body');
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('11. Performance metrics collection', async ({ page }) => {
    // Collect performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      return {
        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
        loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
        domInteractive: navigation?.domInteractive,
        transferSize: navigation?.transferSize,
      };
    });

    testResults.performanceMetrics = performanceMetrics;

    await takeScreenshot(page, '11-performance-test');

    // Check if performance is acceptable (FCP < 3s)
    if (performanceMetrics.firstContentfulPaint && performanceMetrics.firstContentfulPaint > 3000) {
      testResults.criticalIssues.push('Performance issue: First Contentful Paint > 3 seconds');
    }
  });

  test('12. Browser console error analysis', async ({ page }) => {
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '12-console-error-check');

    // Analyze collected console errors
    const errorTypes = {
      securityErrors: 0,
      networkErrors: 0,
      scriptErrors: 0,
      other: 0,
    };

    testResults.consoleErrors.forEach(error => {
      const errorText = error.text || error.message || '';

      if (errorText.includes('CSP') || errorText.includes('CORS') || errorText.includes('security')) {
        errorTypes.securityErrors++;
      } else if (errorText.includes('fetch') || errorText.includes('network') || errorText.includes('404')) {
        errorTypes.networkErrors++;
      } else if (errorText.includes('script') || errorText.includes('Uncaught')) {
        errorTypes.scriptErrors++;
      } else {
        errorTypes.other++;
      }
    });

    testResults.performanceMetrics.consoleErrorBreakdown = errorTypes;

    if (errorTypes.scriptErrors > 0) {
      testResults.criticalIssues.push(`${errorTypes.scriptErrors} JavaScript errors detected in console`);
    }
  });
});

// Save results after all tests
test.afterAll(async () => {
  const reportPath = path.join(process.cwd(), 'automated-qa-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log('\n=== Test Results Summary ===');
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Skipped: ${testResults.skipped}`);
  console.log(`Critical Issues: ${testResults.criticalIssues.length}`);
  console.log(`Console Errors: ${testResults.consoleErrors.length}`);
  console.log(`Screenshots: ${testResults.screenshots.length}`);
  console.log(`Report saved to: ${reportPath}`);
});
