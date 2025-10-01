const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting Quick AI Features Validation...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Create project
    await page.click('button:has-text("New Project")');
    await page.fill('#title', 'AI Test Project');
    await page.selectOption('#genre', 'Fantasy');
    await page.selectOption('#visualStyle', 'Professional');
    await page.fill('#description', 'Test project for AI validation');
    await page.click('button:has-text("Create Project")');
    
    // Wait for modal to close and workspace to load
    await page.waitForTimeout(3000);
    
    console.log('✅ Project created');
    
    // Check if we're in workspace with project name visible
    const projectName = await page.locator('text=AI Test Project').first();
    if (await projectName.count() > 0) {
      console.log('✅ Project workspace loaded');
    } else {
      console.log('❌ Project workspace not found');
      await page.screenshot({ path: 'workspace-error.png' });
      return;
    }
    
    // Check if default chapter exists
    const defaultChapter = page.locator('text=Chapter 1');
    if (await defaultChapter.count() > 0) {
      console.log('✅ Default chapter exists');
      
      // Click on chapter to select it
      await defaultChapter.click();
      await page.waitForTimeout(1000);
      
      // Check AI tools section
      const aiToolsSection = page.locator('text=AI Tools');
      if (await aiToolsSection.count() > 0) {
        console.log('✅ AI Tools section found');
        
        // Check specific AI buttons
        const aiButtons = [
          'Chapter Structure',
          'Visual Analysis', 
          'Clean & Format',
          'Generate',
          'Assistant'
        ];
        
        let foundButtons = 0;
        for (const buttonText of aiButtons) {
          const button = page.locator(`button:has-text("${buttonText}")`);
          if (await button.count() > 0) {
            console.log(`✅ Found AI button: ${buttonText}`);
            foundButtons++;
          } else {
            console.log(`❌ Missing AI button: ${buttonText}`);
          }
        }
        
        console.log(`📊 AI Buttons: ${foundButtons}/5 found`);
        
        if (foundButtons >= 4) {
          console.log('🎉 AI FEATURES VALIDATION: SUCCESS');
        } else {
          console.log('⚠️ AI FEATURES VALIDATION: PARTIAL');
        }
        
      } else {
        console.log('❌ AI Tools section not found');
      }
      
    } else {
      console.log('❌ Default chapter not found');
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'ai-validation-final.png', 
      fullPage: true 
    });
    console.log('📸 Final screenshot saved');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();