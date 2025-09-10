
// doormat.ts - Full TypeScript conversion from p5.js JavaScript

import p5 from "p5";

// --- External globals ---
declare const colorPalettes: { name: string; colors: string[] }[];
declare function getPaletteRarity(name: string): string;
declare const characterMap: Record<string, string[]>;

declare global {
  interface Window {
    DOORMAT_CONFIG?: Record<string, number>;
    stripeData?: Stripe[];
    doormatTextRows?: string[];
    selectedPalette?: { name: string; colors: string[] };
    updateTraitsFromSketch?: () => void;
    generateDoormatCore?: (seed: number) => void;
    generateTextDataInSketch?: () => void;
    clearTextDataInSketch?: () => void;
    textData?: TextPixel[];
  }
}

interface Stripe {
  y: number;
  height: number;
  primaryColor: string;
  secondaryColor: string | null;
  weaveType: "solid" | "textured" | "mixed";
  warpVariation: number;
}

interface TextPixel {
  x: number;
  y: number;
  width: number;
  height: number;
}

// --- Config ---
let doormatWidth = window.DOORMAT_CONFIG?.DOORMAT_WIDTH || 800;
let doormatHeight = window.DOORMAT_CONFIG?.DOORMAT_HEIGHT || 1200;
let fringeLength = window.DOORMAT_CONFIG?.FRINGE_LENGTH || 30;
let currentSeed = 42;
let warpThickness = 2;
let weftThickness = window.DOORMAT_CONFIG?.WEFT_THICKNESS || 8;
let TEXT_SCALE = window.DOORMAT_CONFIG?.TEXT_SCALE || 2;
let MAX_CHARS = window.DOORMAT_CONFIG?.MAX_CHARS || 11;

let lightTextColor: p5.Color;
let darkTextColor: p5.Color;

let selectedPalette: { name: string; colors: string[] };
let stripeData: Stripe[] = [];
let doormatTextRows: string[] = [];
let textData: TextPixel[] = [];

// --- p5 sketch ---
const sketch = (p: p5) => {

  function updateTextColors() {
    if (!selectedPalette || !selectedPalette.colors) return;
    let darkest = selectedPalette.colors[0];
    let lightest = selectedPalette.colors[0];
    let darkestVal = 999, lightestVal = -1;
    for (let hex of selectedPalette.colors) {
      let c = p.color(hex);
      let bright = (p.red(c) + p.green(c) + p.blue(c)) / 3;
      if (bright < darkestVal) { darkestVal = bright; darkest = hex; }
      if (bright > lightestVal) { lightestVal = bright; lightest = hex; }
    }
    darkTextColor = p.lerpColor(p.color(darkest), p.color(0), 0.4);
    lightTextColor = p.lerpColor(p.color(lightest), p.color(255), 0.3);
  }

  function initializePalette() {
    if (!selectedPalette) {
      selectedPalette = colorPalettes[0];
    }
    window.selectedPalette = selectedPalette;
    updateTextColors();
  }

  function selectPaletteByRarity() {
    const rarityWeights = { Common: 60, Uncommon: 25, Rare: 11, Epic: 8, Legendary: 4 };
    const rarityRoll = p.random(100);
    let selectedRarity: string;

    if (rarityRoll < rarityWeights.Legendary) selectedRarity = "Legendary";
    else if (rarityRoll < rarityWeights.Legendary + rarityWeights.Epic) selectedRarity = "Epic";
    else if (rarityRoll < rarityWeights.Legendary + rarityWeights.Epic + rarityWeights.Rare) selectedRarity = "Rare";
    else if (rarityRoll < rarityWeights.Legendary + rarityWeights.Epic + rarityWeights.Rare + rarityWeights.Uncommon) selectedRarity = "Uncommon";
    else selectedRarity = "Common";

    const palettesOfRarity = colorPalettes.filter(palette => getPaletteRarity(palette.name) === selectedRarity);
    if (palettesOfRarity.length === 0) {
      return p.random(colorPalettes.filter(palette => getPaletteRarity(palette.name) === "Common"));
    }
    return p.random(palettesOfRarity);
  }

  p.setup = () => {
    const canvas = p.createCanvas(doormatHeight + fringeLength * 4, doormatWidth + fringeLength * 4);
    canvas.parent("canvas-container");
    p.pixelDensity(2.5);
    initializePalette();
    p.noLoop();
  };

  window.generateDoormatCore = (seed: number) => {
    currentSeed = seed;
    p.randomSeed(seed);
    p.noiseSeed(seed);
    warpThickness = p.random([1, 2]);
    selectedPalette = selectPaletteByRarity();
    window.selectedPalette = selectedPalette;
    updateTextColors();
    generateStripeData();
    window.stripeData = stripeData;
    p.redraw();
    if (typeof window.updateTraitsFromSketch === "function") {
      setTimeout(() => window.updateTraitsFromSketch?.(), 100);
    }
  };

  function generateStripeData() {
    stripeData = [];
    let totalHeight = doormatHeight;
    let currentY = 0;
    if (!selectedPalette || !selectedPalette.colors) initializePalette();
    let densityType = p.random();
    let minHeight: number, maxHeight: number;
    if (densityType < 0.2) { minHeight = 15; maxHeight = 35; }
    else if (densityType < 0.4) { minHeight = 50; maxHeight = 90; }
    else { minHeight = 20; maxHeight = 80; }

    while (currentY < totalHeight) {
      let stripeHeight: number;
      if (densityType >= 0.4) {
        let variationType = p.random();
        if (variationType < 0.3) stripeHeight = p.random(minHeight, minHeight + 20);
        else if (variationType < 0.6) stripeHeight = p.random(minHeight + 15, maxHeight - 15);
        else stripeHeight = p.random(maxHeight - 25, maxHeight);
      } else {
        stripeHeight = p.random(minHeight, maxHeight);
      }
      if (currentY + stripeHeight > totalHeight) stripeHeight = totalHeight - currentY;

      let primaryColor = p.random(selectedPalette.colors);
      let hasSecondaryColor = p.random() < 0.15;
      let secondaryColor = hasSecondaryColor ? p.random(selectedPalette.colors) : null;

      let weaveRand = p.random();
      let weaveType: "solid" | "textured" | "mixed";
      if (weaveRand < 0.6) weaveType = "solid";
      else if (weaveRand < 0.8) weaveType = "textured";
      else weaveType = "mixed";

      stripeData.push({ y: currentY, height: stripeHeight, primaryColor, secondaryColor, weaveType, warpVariation: p.random(0.1, 0.5) });
      currentY += stripeHeight;
    }
  }

  p.draw = () => {
    p.background(245, 242, 238);
    p.push();
    p.translate(p.width / 2, p.height / 2);
    p.rotate(p.PI / 2);
    p.translate(-p.height / 2, -p.width / 2);
    p.push();
    p.translate(fringeLength * 2, fringeLength * 2);
    for (let stripe of stripeData) drawStripe(stripe);
    drawTextureOverlay();
    p.pop();
    drawFringe();
    p.pop();
  };

  function drawStripe(stripe: Stripe) {
    let warpSpacing = warpThickness + 1;
    let weftSpacing = weftThickness + 1;
    for (let x = 0; x < doormatWidth; x += warpSpacing) {
      for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
        let warpColor = p.color(stripe.primaryColor);
        let isTextPixel = textData.some(tp => x >= tp.x && x < tp.x + tp.width && y >= tp.y && y < tp.y + tp.height);
        let r = p.red(warpColor) + p.random(-15, 15);
        let g = p.green(warpColor) + p.random(-15, 15);
        let b = p.blue(warpColor) + p.random(-15, 15);
        if (isTextPixel) {
          const bgBrightness = (r + g + b) / 3;
          let tc = bgBrightness < 128 ? lightTextColor : darkTextColor;
          r = p.red(tc); g = p.green(tc); b = p.blue(tc);
          p.fill(0, 0, 0, 120);
          p.noStroke();
          p.rect(x - 1, y - 1, warpThickness + 2, weftSpacing + 2);
        }
        r = p.constrain(r, 0, 255);
        g = p.constrain(g, 0, 255);
        b = p.constrain(b, 0, 255);
        p.fill(r, g, b);
        p.noStroke();
        let warpCurve = p.sin(y * 0.05) * 0.5;
        p.rect(x + warpCurve, y, warpThickness, weftSpacing);
      }
    }
    // (continued: draw weft, interlacing, highlights) ...
  }

  function drawTextureOverlay() {
    p.push();
    p.blendMode(p.MULTIPLY);
    for (let x = 0; x < doormatWidth; x += 2) {
      for (let y = 0; y < doormatHeight; y += 2) {
        let noiseVal = p.noise(x * 0.02, y * 0.02);
        let hatchingIntensity = p.map(noiseVal, 0, 1, 0, 50);
        p.fill(0, 0, 0, hatchingIntensity);
        p.noStroke();
        p.rect(x, y, 2, 2);
      }
    }
    p.pop();
  }

  function drawFringe() {
    drawFringeSection(fringeLength * 2, fringeLength, doormatWidth, fringeLength, "top");
    drawFringeSection(fringeLength * 2, fringeLength * 2 + doormatHeight, doormatWidth, fringeLength, "bottom");
    drawSelvedgeEdges();
  }

  function drawFringeSection(x: number, y: number, w: number, h: number, side: "top" | "bottom") {
    let fringeStrands = w / 12;
    let strandWidth = w / fringeStrands;
    for (let i = 0; i < fringeStrands; i++) {
      let strandX = x + i * strandWidth;
      if (!selectedPalette || !selectedPalette.colors) initializePalette();
      let strandColor = p.random(selectedPalette.colors);
      for (let j = 0; j < 12; j++) {
        let threadX = strandX + p.random(-strandWidth / 6, strandWidth / 6);
        let startY = side === "top" ? y + h : y;
        let endY = side === "top" ? y : y + h;
        let waveAmplitude = p.random(1, 4);
        let waveFreq = p.random(0.2, 0.8);
        let direction = p.random([-1, 1]);
        let curlIntensity = p.random(0.5, 2.0);
        let threadLength = p.random(0.8, 1.2);
        let fringeColor = p.color(strandColor);
        let r = p.red(fringeColor) * 0.7;
        let g = p.green(fringeColor) * 0.7;
        let b = p.blue(fringeColor) * 0.7;
        p.stroke(r, g, b);
        p.strokeWeight(p.random(0.5, 1.2));
        p.noFill();
        p.beginShape();
        for (let t = 0; t <= 1; t += 0.1) {
          let yPos = p.lerp(startY, endY, t * threadLength);
          let xOffset = p.sin(t * p.PI * waveFreq) * waveAmplitude * t * direction * curlIntensity;
          xOffset += p.random(-1, 1);
          if (p.random() < 0.3) xOffset += p.random(-2, 2);
          p.vertex(threadX + xOffset, yPos);
        }
        p.endShape();
      }
    }
  }

  function drawSelvedgeEdges() {
    // TODO: port full selvedge edge drawing code with drawTexturedSelvedgeArc
  }

  function generateTextData() {
    textData = [];
    const textRows = window.doormatTextRows || doormatTextRows || [];
    if (!textRows || textRows.length === 0) return;
    const warpSpacing = warpThickness + 1;
    const weftSpacing = weftThickness + 1;
    const scaledWarp = warpSpacing * TEXT_SCALE;
    const scaledWeft = weftSpacing * TEXT_SCALE;
    const charWidth = 7 * scaledWarp;
    const charHeight = 5 * scaledWeft;
    const spacing = scaledWeft;
    const rowSpacing = charWidth * 1.5;
    const totalRowsWidth = textRows.length * charWidth + (textRows.length - 1) * rowSpacing;
    const baseStartX = (doormatWidth - totalRowsWidth) / 2;
    for (let rowIndex = 0; rowIndex < textRows.length; rowIndex++) {
      const doormatText = textRows[rowIndex];
      if (!doormatText) continue;
      const textHeight = doormatText.length * (charHeight + spacing) - spacing;
      const startX = baseStartX + rowIndex * (charWidth + rowSpacing);
      const startY = (doormatHeight - textHeight) / 2;
      for (let i = 0; i < doormatText.length; i++) {
        const char = doormatText.charAt(i);
        const charY = startY + (doormatText.length - 1 - i) * (charHeight + spacing);
        const charPixels = generateCharacterPixels(char, startX, charY, charWidth, charHeight);
        textData.push(...charPixels);
      }
    }
  }

  function generateCharacterPixels(char: string, x: number, y: number, width: number, height: number): TextPixel[] {
    const pixels: TextPixel[] = [];
    const warpSpacing = warpThickness + 1;
    const weftSpacing = weftThickness + 1;
    const scaledWarp = warpSpacing * TEXT_SCALE;
    const scaledWeft = weftSpacing * TEXT_SCALE;
    const charDef = characterMap[char] || characterMap[" "];
    const numRows = charDef.length;
    const numCols = charDef[0].length;
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        if (charDef[row][col] === "1") {
          const newCol = row;
          const newRow = numCols - 1 - col;
          pixels.push({ x: x + newCol * scaledWarp, y: y + newRow * scaledWeft, width: scaledWarp, height: scaledWeft });
        }
      }
    }
    return pixels;
  }

  window.generateTextDataInSketch = () => { generateTextData(); window.textData = textData; };
  window.clearTextDataInSketch = () => { textData = []; window.textData = textData; };
};

new p5(sketch);
