import { chromium } from 'playwright';

async function inspectPageStructure() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(2000);

    console.log('🔍 Inspecting page structure...');

    // Get all form elements
    const inputs = await page.locator('input').all();
    console.log(`\nFound ${inputs.length} input elements:`);
    for (let i = 0; i < inputs.length; i++) {
      const type = await inputs[i].getAttribute('type');
      const placeholder = await inputs[i].getAttribute('placeholder');
      const name = await inputs[i].getAttribute('name');
      const id = await inputs[i].getAttribute('id');
      console.log(`  Input ${i + 1}: type="${type}", placeholder="${placeholder}", name="${name}", id="${id}"`);
    }

    const textareas = await page.locator('textarea').all();
    console.log(`\nFound ${textareas.length} textarea elements:`);
    for (let i = 0; i < textareas.length; i++) {
      const placeholder = await textareas[i].getAttribute('placeholder');
      const name = await textareas[i].getAttribute('name');
      console.log(`  Textarea ${i + 1}: placeholder="${placeholder}", name="${name}"`);
    }

    const selects = await page.locator('select').all();
    console.log(`\nFound ${selects.length} select elements:`);
    for (let i = 0; i < selects.length; i++) {
      const name = await selects[i].getAttribute('name');
      console.log(`  Select ${i + 1}: name="${name}"`);
    }

    const buttons = await page.locator('button').all();
    console.log(`\nFound ${buttons.length} button elements:`);
    for (let i = 0; i < Math.min(10, buttons.length); i++) {
      const text = await buttons[i].textContent();
      const disabled = await buttons[i].getAttribute('disabled');
      console.log(`  Button ${i + 1}: "${text}" (disabled: ${disabled !== null})`);
    }

    // Check for any contenteditable elements
    const editables = await page.locator('[contenteditable]').all();
    console.log(`\nFound ${editables.length} contenteditable elements`);

    console.log('\n📸 Taking screenshot of current state...');
    await page.screenshot({ path: 'screenshots/inspect-page.png', fullPage: true });

    // Try to manually create a project using browser console
    console.log('\n🔧 Attempting to interact with the page manually...');

    // Let's check the page title and URL
    const title = await page.title();
    const url = page.url();
    console.log(`Page title: "${title}"`);
    console.log(`Page URL: "${url}"`);

    // Let's see what React components are in the page
    const htmlContent = await page.content();
    console.log('\n📄 Checking if React is loaded...');
    console.log(`Page contains React: ${htmlContent.includes('react')}`);
    console.log(`Page contains data-reactroot: ${htmlContent.includes('data-reactroot')}`);

    // Check for any error messages in console
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));

    await page.waitForTimeout(2000);

    if (logs.length > 0) {
      console.log('\n📝 Console messages:');
      logs.forEach((log, i) => console.log(`  ${i + 1}. ${log}`));
    }

    console.log('\nInspection complete. Browser will stay open for manual inspection.');
    console.log('Press Ctrl+C to close.');

    // Keep browser open
    await new Promise(() => {});

  } catch (error) {
    console.error('Error:', error);
  }
}

inspectPageStructure();