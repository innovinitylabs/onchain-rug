// HTML Interface Functions - Bridge between UI and doormat generator
// Handles user interactions, text processing, and global function exposure

// Text embedding functions
function addTextToDoormatInSketch(textRows) {
    // Handle both single string and array of strings
    if (typeof textRows === 'string') {
        textRows = [textRows];
    }
    
    // Clean each text row
    const maxChars = window.DOORMAT_CONFIG?.MAX_CHARS || 11;
    window.doormatTextRows = textRows.map(text => 
        text.toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, maxChars)
    ).filter(text => text.length > 0); // Remove empty rows
    
    // Call the generator to update text data and redraw
    if (typeof window.generateTextDataInSketch === 'function') {
        window.generateTextDataInSketch();
    }
    if (typeof redraw === 'function') {
        redraw();
    }
}

function clearTextFromDoormat() {
    window.doormatTextRows = [];
    
    // Call the generator to clear text data and redraw
    if (typeof window.clearTextDataInSketch === 'function') {
        window.clearTextDataInSketch();
    }
    if (typeof redraw === 'function') {
        redraw();
    }
}

function getCurrentPalette() {
    return window.selectedPalette;
}

// Global function to be called from HTML - wrapper for the main generator
function generateDoormat(seed) {
    // Call the core generator function
    if (typeof window.generateDoormatCore === 'function') {
        window.generateDoormatCore(seed);
    }
}

// Interface function to trigger trait updates
function updateTraitsFromSketch() {
    if (typeof window.calculateTraits === 'function') {
        const traits = window.calculateTraits();
        if (typeof window.updateTraitsDisplay === 'function') {
            window.updateTraitsDisplay(traits);
        }
    }
}

// Make the functions globally available for HTML to call
if (typeof window !== 'undefined') {
    window.addTextToDoormatInSketch = addTextToDoormatInSketch;
    window.clearTextFromDoormat = clearTextFromDoormat;
    window.getCurrentPalette = getCurrentPalette;
    window.generateDoormat = generateDoormat;
    window.updateTraitsFromSketch = updateTraitsFromSketch;
}
