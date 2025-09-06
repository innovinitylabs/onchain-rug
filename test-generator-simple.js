const { chromium } = require('playwright');

async function testGenerator() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    console.log('Browser console:', msg.text());
  });
  
  console.log('Navigating to generator page...');
  await page.goto('http://localhost:3000/generator');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  console.log('Page loaded, waiting for initialization...');
  
  // Wait for initialization
  await page.waitForTimeout(8000);
  
  // Check if canvas exists and has content
  const canvas = await page.locator('canvas').first();
  const isVisible = await canvas.isVisible();
  console.log(`Canvas is visible: ${isVisible}`);
  
  if (isVisible) {
    // Get canvas dimensions
    const boundingBox = await canvas.boundingBox();
    console.log('Canvas bounding box:', boundingBox);
    
    // Take a screenshot of the canvas
    await canvas.screenshot({ path: 'test-canvas.png' });
    console.log('Canvas screenshot saved as test-canvas.png');
    
    // Try to get canvas image data to check if it has content
    const hasContent = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return false;
      
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Check if canvas has any non-transparent pixels
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) { // Alpha channel > 0 means non-transparent
          return true;
        }
      }
      return false;
    });
    
    console.log(`Canvas has content: ${hasContent}`);
  }
  
  await browser.close();
}

testGenerator().catch(console.error);
