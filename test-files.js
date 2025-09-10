const fs = require('fs');

console.log('🧪 Testing Minimal P5.js and Ultra-Minimal Algorithm Compatibility\n');

// Test Algorithm File
try {
  const algorithm = fs.readFileSync('data/rug-algorithm-ultra-minimal.js', 'utf8');
  console.log('✅ Algorithm file loaded successfully');
  console.log('   File size:', algorithm.length, 'bytes');
  
  // Test if it's valid JavaScript
  new Function(algorithm);
  console.log('✅ Algorithm syntax is valid JavaScript');
  
  // Check if it contains the expected function
  if (algorithm.includes('function generateRugHTML')) {
    console.log('✅ Contains generateRugHTML function');
  } else {
    console.log('❌ Missing generateRugHTML function');
  }
  
  // Check key features
  const features = [
    'getUsedCharacters',
    'JSON.stringify',
    'noiseSeed',
    'window.initPRNG',
    'createCanvas',
    'drawStripe',
    'drawFringe',
    'generateTextData'
  ];
  
  const foundFeatures = features.filter(feature => algorithm.includes(feature));
  console.log('✅ Found features:', foundFeatures.join(', '));
  
} catch (error) {
  console.error('❌ Algorithm Error:', error.message);
}

console.log('');

// Test Minimal P5.js File
try {
  const p5minimal = fs.readFileSync('data/p5-minimal.js', 'utf8');
  console.log('✅ Minimal P5.js file loaded successfully');
  console.log('   File size:', p5minimal.length, 'bytes');
  
  // Test if it's valid JavaScript
  new Function(p5minimal);
  console.log('✅ Minimal P5.js syntax is valid JavaScript');
  
  // Check if it contains key P5.js functions
  const keyFunctions = [
    'createCanvas', 'background', 'fill', 'rect', 'noStroke', 
    'push', 'pop', 'translate', 'rotate', 'ellipse', 'arc',
    'beginShape', 'endShape', 'vertex', 'stroke', 'strokeWeight',
    'noFill', 'color', 'red', 'green', 'blue', 'constrain',
    'lerpColor', 'noise', 'sin', 'cos', 'PI', 'HALF_PI',
    'map', 'lerp', 'blendMode', 'MULTIPLY'
  ];
  
  const foundFunctions = keyFunctions.filter(func => p5minimal.includes(func));
  console.log('✅ Found P5.js functions:', foundFunctions.length + '/' + keyFunctions.length);
  
  if (foundFunctions.length === keyFunctions.length) {
    console.log('✅ All required P5.js functions present');
  } else {
    const missing = keyFunctions.filter(func => !p5minimal.includes(func));
    console.log('❌ Missing functions:', missing.join(', '));
  }
  
} catch (error) {
  console.error('❌ P5.js Error:', error.message);
}

console.log('\n🎯 COMPATIBILITY TEST SUMMARY:');
console.log('📁 Algorithm file: data/rug-algorithm-ultra-minimal.js');
console.log('📁 P5.js file: data/p5-minimal.js');
console.log('📁 Test files: test-minimal-p5.html, test-minimal-p5-inline.html');
console.log('\n💡 To test in browser:');
console.log('   1. Open test-minimal-p5-inline.html in browser');
console.log('   2. Check console for test results');
console.log('   3. Verify the rug renders correctly');
