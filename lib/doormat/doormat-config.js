// Doormat Configuration Constants
// Shared constants used across the application

// Wrap in IIFE to prevent global scope pollution
(function() {
    // Canvas dimensions
    const DOORMAT_WIDTH = 800;
    const DOORMAT_HEIGHT = 1200;
    const FRINGE_LENGTH = 30;

    // Thread specifications
    const WEFT_THICKNESS = 8;
    const TEXT_SCALE = 2;

    // Text constraints
    const MAX_CHARS = 11;
    const MAX_TEXT_ROWS = 5;

    // Export these constants globally through window object only
    if (typeof window !== 'undefined') {
        window.DOORMAT_CONFIG = {
            DOORMAT_WIDTH,
            DOORMAT_HEIGHT,
            FRINGE_LENGTH,
            WEFT_THICKNESS,
            TEXT_SCALE,
            MAX_CHARS,
            MAX_TEXT_ROWS
        };
    }
})();
