#!/usr/bin/env node

/**
 * Lexical Editor Debug Script
 * Tests the Lexical editor component by accessing it via headless browser
 */

import puppeteer from 'puppeteer';

async function debugLexicalEditor() {
  console.log('🔍 Starting Lexical editor debugging...');

  let browser;
  let page;

  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();

    // Capture console logs and errors
    page.on('console', (msg) => {
      console.log(`🖥️  Console ${msg.type()}: ${msg.text()}`);
    });

    page.on('pageerror', (error) => {
      console.error(`❌ Page Error: ${error.message}`);
    });

    page.on('requestfailed', (request) => {
      console.error(`🚫 Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Navigate to the app
    console.log('🌐 Navigating to http://localhost:5173/');
    await page.goto('http://localhost:5173/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for the app to load
    console.log('⏳ Waiting for app to load...');
    await page.waitForSelector('[data-testid="app-root"], #root', { timeout: 10000 });

    // Check if we need to create a project first
    const needsProject = await page.$('.text-center') !== null;
    if (needsProject) {
      console.log('📝 Creating a new project...');

      // Look for new project button
      const newProjectBtn = await page.$('button:has-text("New Project"), button[aria-label*="New"], button[title*="New"]');
      if (newProjectBtn) {
        await newProjectBtn.click();
        await page.waitForTimeout(1000);

        // Fill project form if modal appears
        await page.type('input[placeholder*="Project"], input[placeholder*="Name"], input[name="name"]', 'Debug Test Project');
        await page.type('textarea[placeholder*="Description"], textarea[name="description"]', 'Testing Lexical editor');

        // Submit form
        const submitBtn = await page.$('button[type="submit"], button:has-text("Create")');
        if (submitBtn) {
          await submitBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    // Navigate to Writing Desk
    console.log('📝 Navigating to Writing Desk...');
    const writingTab = await page.$('button:has-text("Writing"), [data-tab="writing"], [aria-label*="Writing"]');
    if (writingTab) {
      await writingTab.click();
      await page.waitForTimeout(1000);
    }

    // Look for chapter creation if no chapters exist
    const noChapters = await page.$('.text-center:has-text("Select a Chapter")') !== null;
    if (noChapters) {
      console.log('📖 Creating a chapter...');

      const addChapterBtn = await page.$('button:has-text("Add Chapter"), button[title*="Add"]');
      if (addChapterBtn) {
        await addChapterBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // Wait for the Lexical editor to appear
    console.log('🔍 Looking for Lexical editor...');

    try {
      // Check for the ContentEditable element
      const contentEditable = await page.waitForSelector('[data-testid="lexical-content-editable"], [contenteditable="true"]', { timeout: 5000 });

      if (contentEditable) {
        console.log('✅ Lexical editor ContentEditable found!');

        // Test clicking and typing in the editor
        await contentEditable.click();
        await page.type('[data-testid="lexical-content-editable"], [contenteditable="true"]', 'Hello, testing Lexical editor!');

        console.log('✅ Successfully typed in the editor!');

        // Check for toolbar
        const toolbar = await page.$('.lexical-editor .toolbar, [role="toolbar"]');
        if (toolbar) {
          console.log('✅ Toolbar found!');
        } else {
          console.log('⚠️  Toolbar not found');
        }

      } else {
        console.log('❌ Lexical editor not found');
      }

    } catch (timeoutError) {
      console.log('❌ Timeout waiting for Lexical editor');

      // Check for error boundary
      const errorBoundary = await page.$('.error-boundary, [data-error-boundary]');
      if (errorBoundary) {
        const errorText = await errorBoundary.textContent();
        console.log('🚨 Error Boundary detected:', errorText);
      }

      // Check for any error messages
      const errorMessages = await page.$$eval('*', (elements) =>
        elements
          .filter(el => el.textContent && el.textContent.includes('error'))
          .map(el => el.textContent)
          .slice(0, 5)
      );

      if (errorMessages.length > 0) {
        console.log('🚨 Error messages found:', errorMessages);
      }
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: 'lexical-debug-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved as lexical-debug-screenshot.png');

    // Get all JavaScript errors that occurred
    const jsErrors = await page.evaluate(() => {
      return window.errors || [];
    });

    console.log('🔍 Debug complete. Check the screenshot and console output above.');

    // Keep browser open for manual inspection
    console.log('🔍 Browser will remain open for manual inspection. Press Ctrl+C to close.');
    await new Promise(() => {}); // Keep running

  } catch (error) {
    console.error('❌ Debug script error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Error tracking
if (typeof window !== 'undefined') {
  window.errors = [];
  window.addEventListener('error', (error) => {
    window.errors.push({
      message: error.message,
      filename: error.filename,
      lineno: error.lineno,
      colno: error.colno,
      stack: error.error?.stack
    });
  });
}

debugLexicalEditor().catch(console.error);