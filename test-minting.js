const { chromium } = require('playwright');

async function testMinting() {
  const browser = await chromium.launch({ 
    headless: false, // Set to true to run headless
    slowMo: 1000 // Slow down actions for debugging
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen to console messages
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  
  // Listen to page errors
  page.on('pageerror', error => {
    console.error(`[PAGE ERROR] ${error.message}`);
  });
  
  try {
    console.log('🚀 Starting minting test...');
    
    // Navigate to the generator page
    await page.goto('http://localhost:3000/generator');
    console.log('✅ Page loaded');
    
    // Wait for the page to be ready
    await page.waitForLoadState('networkidle');
    console.log('✅ Page ready');
    
    // Check if the mint button exists
    const mintButton = await page.locator('button:has-text("Mint Rug")').first();
    const buttonExists = await mintButton.isVisible();
    console.log(`✅ Mint button visible: ${buttonExists}`);
    
    if (buttonExists) {
      // Get button text
      const buttonText = await mintButton.textContent();
      console.log(`✅ Button text: "${buttonText}"`);
      
      // Check if button is disabled
      const isDisabled = await mintButton.isDisabled();
      console.log(`✅ Button disabled: ${isDisabled}`);
      
      // Try to click the button
      if (!isDisabled) {
        console.log('🔄 Attempting to click mint button...');
        await mintButton.click();
        console.log('✅ Button clicked');
        
        // Wait a bit to see what happens
        await page.waitForTimeout(3000);
        
        // Check for any alerts or error messages
        const alerts = await page.evaluate(() => {
          // Check if there are any error messages in the DOM
          const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
          return Array.from(errorElements).map(el => el.textContent);
        });
        
        if (alerts.length > 0) {
          console.log('⚠️ Found error elements:', alerts);
        }
        
      } else {
        console.log('❌ Button is disabled, cannot test minting');
      }
    } else {
      console.log('❌ Mint button not found');
    }
    
    // Check for any status messages
    const statusMessages = await page.evaluate(() => {
      const statusElements = document.querySelectorAll('[class*="status"], [class*="Status"]');
      return Array.from(statusElements).map(el => el.textContent);
    });
    
    if (statusMessages.length > 0) {
      console.log('📊 Status messages:', statusMessages);
    }
    
    // Wait a bit more to see any final state
    await page.waitForTimeout(2000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testMinting().catch(console.error);
