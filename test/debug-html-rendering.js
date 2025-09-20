#!/usr/bin/env node

/**
 * Debug HTML rendering issues
 */

import { readFileSync } from 'fs';

const htmlFile = 'should work now.html';

try {
    console.log('🔍 DEBUGGING HTML RENDERING ISSUES');
    console.log('====================================');

    // Read the HTML file
    const htmlContent = readFileSync(htmlFile, 'utf8');
    console.log('✅ HTML file loaded successfully');
    console.log('File size:', htmlContent.length, 'characters');

    // Check HTML structure
    const scriptTags = htmlContent.match(/<script[^>]*>[\s\S]*?<\/script>/g);
    console.log('\\n📋 HTML Structure Analysis:');
    console.log('- Script tags found:', scriptTags ? scriptTags.length : 0);

    if (scriptTags) {
        scriptTags.forEach((script, index) => {
            console.log(`\\n--- Script ${index + 1} ---`);
            const scriptSize = script.length;
            console.log('Size:', scriptSize, 'characters');

            // Check for key functions
            if (script.includes('createCanvas')) {
                console.log('✅ Contains createCanvas function');
            }
            if (script.includes('setup()')) {
                console.log('✅ Contains setup function');
            }
            if (script.includes('draw()')) {
                console.log('✅ Contains draw function');
            }
            if (script.includes('let _p5=')) {
                console.log('✅ Contains p5.js implementation');
            }
            if (script.includes('let w=') && script.includes('let h=')) {
                console.log('✅ Contains rug configuration');
            }

            // Check for potential issues
            if (script.includes('undefined') || script.includes('null')) {
                console.log('⚠️  Contains undefined/null references');
            }
            if (script.includes('console.error')) {
                console.log('⚠️  Contains error logging');
            }
        });
    }

    // Check for canvas element
    if (htmlContent.includes('<canvas') || htmlContent.includes('createCanvas')) {
        console.log('\\n✅ Canvas creation detected');
    } else {
        console.log('\\n❌ No canvas creation found');
    }

    // Check for div with id="rug"
    if (htmlContent.includes('id="rug"')) {
        console.log('✅ Rug container div found');
    } else {
        console.log('❌ Rug container div missing');
    }

    // Check for event listeners
    if (htmlContent.includes('addEventListener')) {
        console.log('✅ Event listeners found');
    } else {
        console.log('⚠️  No event listeners found');
    }

    // Check for potential JavaScript syntax errors
    console.log('\\n🔍 JavaScript Syntax Check:');

    // Extract JavaScript from scripts
    const jsContent = scriptTags ? scriptTags.join('\\n') : '';

    // Check for common issues
    const issues = [];

    if (jsContent.includes('window.setup') && !jsContent.includes('function setup()')) {
        issues.push('setup() function called but not defined');
    }

    if (jsContent.includes('window.draw') && !jsContent.includes('function draw()')) {
        issues.push('draw() function called but not defined');
    }

    if (!jsContent.includes('createCanvas')) {
        issues.push('No createCanvas call found');
    }

    if (!jsContent.includes('parent("rug")')) {
        issues.push('Canvas not attached to rug container');
    }

    if (issues.length > 0) {
        console.log('❌ Issues found:');
        issues.forEach(issue => console.log('  -', issue));
    } else {
        console.log('✅ No obvious JavaScript issues found');
    }

    console.log('\\n💡 DEBUGGING SUGGESTIONS:');
    console.log('1. Open the HTML file in a browser and check the console for JavaScript errors');
    console.log('2. Check if the canvas element is created in the DOM');
    console.log('3. Verify that the setup() function is called on page load');
    console.log('4. Check if there are any CORS or security issues');
    console.log('5. Try opening the HTML file directly in Chrome/Firefox');

    console.log('\\n🔧 POSSIBLE FIXES:');
    console.log('1. Add console.log statements to debug execution flow');
    console.log('2. Check if all required functions are properly defined');
    console.log('3. Verify that the p5.js implementation is complete');
    console.log('4. Test in different browsers');

} catch (error) {
    console.error('❌ Error reading HTML file:', error.message);
}
