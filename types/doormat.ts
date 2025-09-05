// Types for doormat-related data structures

export interface ColorPalette {
  name: string;
  colors: string[];
  description?: string;
}

export interface RugTraits {
  rarity: string;
  complexity: number;
  colorVariety: number;
  textDensity: number;
  patternType: string;
  borderStyle: string;
}

export interface DoormatConfig {
  WARP_THICKNESS: number;
  MAX_CHARS: number;
  CANVAS_WIDTH: number;
  CANVAS_HEIGHT: number;
  DOORMAT_WIDTH: number;
  DOORMAT_HEIGHT: number;
  FRINGE_LENGTH: number;
  WEFT_THICKNESS: number;
  TEXT_SCALE: number;
}

export interface TextData {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
}

export interface StripeData {
  y: number;
  height: number;
  color: string;
  pattern: string;
}

// Global window interface extensions
declare global {
  interface Window {
    // P5.js functions
    p5: any;
    randomSeed: (seed: number) => () => number;
    noiseSeed: (seed: number) => void;
    noise: (x: number, y?: number, z?: number) => number;
    blendMode: (mode: string) => void;
    saveCanvas: (canvas: any, filename: string) => void;
    createCanvas: (width: number, height: number) => any;
    background: (r: number, g?: number, b?: number, a?: number) => void;
    fill: (r: number, g?: number, b?: number, a?: number) => void;
    noFill: () => void;
    stroke: (r: number, g?: number, b?: number, a?: number) => void;
    noStroke: () => void;
    strokeWeight: (weight: number) => void;
    rect: (x: number, y: number, w: number, h: number) => void;
    ellipse: (x: number, y: number, w: number, h: number) => void;
    line: (x: number, y: number, x2: number, y2: number) => void;
    arc: (x: number, y: number, w: number, h: number, start: number, stop: number) => void;
    beginShape: () => void;
    vertex: (x: number, y: number) => void;
    endShape: () => void;
    text: (str: string, x: number, y: number) => void;
    textSize: (size: number) => void;
    textAlign: (alignX: string, alignY?: string) => void;
    push: () => void;
    pop: () => void;
    translate: (x: number, y: number) => void;
    rotate: (angle: number) => void;
    scale: (s: number) => void;
    random: (min?: number, max?: number) => number;
    map: (value: number, start1: number, stop1: number, start2: number, stop2: number) => number;
    constrain: (n: number, low: number, high: number) => number;
    dist: (x1: number, y1: number, x2: number, y2: number) => number;
    sin: (angle: number) => number;
    cos: (angle: number) => number;
    PI: number;
    TWO_PI: number;
    HALF_PI: number;
    max: (...args: number[]) => number;
    min: (...args: number[]) => number;
    abs: (n: number) => number;
    floor: (n: number) => number;
    ceil: (n: number) => number;
    round: (n: number) => number;
    MULTIPLY: string;
    ADD: string;
    SUBTRACT: string;
    DARKEST: string;
    LIGHTEST: string;
    DIFFERENCE: string;
    EXCLUSION: string;
    OVERLAY: string;
    SOFT_LIGHT: string;
    HARD_LIGHT: string;
    COLOR_DODGE: string;
    COLOR_BURN: string;
    SCREEN: string;
    BLEND: string;
    color: (r: number, g: number, b: number, a?: number) => any;
    red: (c: any) => number;
    green: (c: any) => number;
    blue: (c: any) => number;
    lerpColor: (c1: any, c2: any, amt: number) => any;
    lerp: (start: number, stop: number, amt: number) => number;
    redraw: () => void;
    loop: () => void;
    noLoop: () => void;
    frameRate: (fps: number) => void;
    pixelDensity: (density: number) => void;
    width: number;
    height: number;
    windowWidth: number;
    windowHeight: number;
    
    // Doormat-specific functions and data
    generateDoormatCore: (seed: number) => void;
    generateDoormat: (seed: number) => void;
    draw: () => void;
    setup: () => void;
    initializePalette: () => void;
    addTextToDoormatInSketch: (texts: string[]) => void;
    clearTextFromDoormat: () => void;
    getCurrentPalette: () => ColorPalette | null;
    calculateTraits: () => RugTraits | null;
    generateTextDataInSketch: () => void;
    clearTextDataInSketch: () => void;
    DOORMAT_CONFIG: DoormatConfig;
    selectedPalette: ColorPalette | null;
    stripeData: StripeData[];
    doormatTextRows: string[];
    textData: TextData[];
    
    // Doormat dimension variables
    doormatWidth: number;
    doormatHeight: number;
    fringeLength: number;
    currentSeed: number;
    warpThickness: number;
    weftThickness: number;
    TEXT_SCALE: number;
    MAX_CHARS: number;
    lightTextColor: any;
    darkTextColor: any;
    
    // Character mapping
    characterMap: Record<string, string>;
    colorPalettes: ColorPalette[];
  }
}
