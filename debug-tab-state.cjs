const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Debugging Tab State Issues...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ App loaded');
    
    // Create project
    await page.click('button:has-text("New Project")');
    await page.fill('#title', 'Debug Test Project');
    await page.selectOption('#genre', 'Fantasy');
    await page.selectOption('#visualStyle', 'Professional');
    await page.click('button:has-text("Create Project")');
    await page.waitForTimeout(3000);
    
    console.log('✅ Project created');
    
    // Check initial tab states (use sidebar navigation buttons)
    const sidebar = page.locator('aside nav');
    const writingTabInitial = sidebar.locator('button:has-text("Writing Studio")');
    const researchTabInitial = sidebar.locator('button:has-text("Research")').first();
    
    console.log(`📊 Initial Writing Studio disabled: ${await writingTabInitial.isDisabled()}`);
    console.log(`📊 Initial Research disabled: ${await researchTabInitial.isDisabled()}`);
    
    // Navigate to Projects (Dashboard)
    console.log('\n🏠 Navigating to Projects...');
    const projectsButton = sidebar.locator('button:has-text("Projects")');
    await projectsButton.click();
    await page.waitForTimeout(2000);
    
    // Check if we're on dashboard
    const dashboardTitle = page.locator('text=My Projects');
    console.log(`📊 On Dashboard: ${await dashboardTitle.count() > 0}`);
    
    // Navigate back to project
    console.log('\n🔄 Navigating back to project...');
    const openProjectButton = page.locator('button:has-text("Open Project")');
    await openProjectButton.click();
    await page.waitForTimeout(3000);
    
    // Check tab states after navigation
    const writingTabAfter = sidebar.locator('button:has-text("Writing Studio")');
    const researchTabAfter = sidebar.locator('button:has-text("Research")').first();
    
    console.log(`📊 After nav Writing Studio disabled: ${await writingTabAfter.isDisabled()}`);
    console.log(`📊 After nav Research disabled: ${await researchTabAfter.isDisabled()}`);
    
    // Check if project info is shown
    const currentProject = page.locator('text=Current Project');
    console.log(`📊 Current Project shown: ${await currentProject.count() > 0}`);
    
    // Try to click Research tab specifically  
    console.log('\n🔍 Testing Research tab click...');
    try {
      await researchTabAfter.click({ timeout: 3000 });
      await page.waitForTimeout(1000);
      
      const researchTitle = page.locator('text=Research Intelligence Hub');
      console.log(`📊 Research content loaded: ${await researchTitle.count() > 0}`);
      
      const pleaseSelectProject = page.locator('text=Please select a project');
      console.log(`📊 "Please select project" shown: ${await pleaseSelectProject.count() > 0}`);
      
    } catch (error) {
      console.log(`❌ Research tab click failed: ${error.message}`);
    }
    
    await page.screenshot({ 
      path: 'debug-tab-state-final.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot saved');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await browser.close();
  }
})();