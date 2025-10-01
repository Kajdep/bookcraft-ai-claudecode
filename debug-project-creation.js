import { chromium } from 'playwright';

async function debugProjectCreation() {
  console.log('🔍 Debugging Project Creation Flow');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const page = await browser.newPage();

  // Log all console messages
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  try {
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(3000);

    console.log('\n1. Page loaded, checking elements...');

    // Check New Project button
    const newProjectBtn = page.locator('text="New Project"');
    const btnExists = await newProjectBtn.count() > 0;
    console.log(`New Project button found: ${btnExists}`);

    if (btnExists) {
      console.log('\n2. Clicking New Project...');
      await newProjectBtn.click();
      await page.waitForTimeout(2000);

      // Check modal
      const modal = page.locator('[role="dialog"]');
      const modalVisible = await modal.isVisible();
      console.log(`Modal visible: ${modalVisible}`);

      if (modalVisible) {
        console.log('\n3. Filling form...');

        // Get the title input
        const titleInput = page.locator('input[placeholder*="The Last Voyage"]');
        await titleInput.clear();
        await titleInput.fill('QA Test Project');

        console.log('Title filled');

        // Look for Create Project button
        const createBtn = page.locator('button:has-text("Create Project")');
        const createBtnVisible = await createBtn.isVisible();
        console.log(`Create button visible: ${createBtnVisible}`);

        if (createBtnVisible) {
          console.log('\n4. Clicking Create Project...');
          await createBtn.click();
          await page.waitForTimeout(5000);

          // Check what happened
          const modalStillVisible = await modal.isVisible();
          console.log(`Modal still visible after create: ${modalStillVisible}`);

          // Check if we're in project workspace
          const writingDeskTab = page.locator('text="Writing Desk"');
          const workspaceVisible = await writingDeskTab.isVisible();
          console.log(`Workspace visible: ${workspaceVisible}`);

          // Check URL change
          const currentURL = page.url();
          console.log(`Current URL: ${currentURL}`);

          await page.screenshot({ path: 'test-results/debug-after-create.png', fullPage: true });
        }
      }
    }

    console.log('\n5. Waiting 10 seconds for observation...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

debugProjectCreation().catch(console.error);