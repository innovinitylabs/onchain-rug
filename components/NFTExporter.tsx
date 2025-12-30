import React from 'react';

const NFTExporter: React.FC = () => {
  const exportNFT = () => {
    // Read data from window.__DOORMAT_DATA__
    const doormatData = typeof window !== 'undefined' ? (window as any).__DOORMAT_DATA__ : null;
    if (!doormatData) {
      console.error('No doormat data available for export');
      return;
    }

    const seed = doormatData.seed || 42;
    const width = 800; // Fixed dimensions like onchain
    const height = 1200; // Fixed dimensions like onchain
    const fringe = 30; // Fixed fringe like onchain
    const weft = 8; // Fixed weft like onchain
    const warp = doormatData.config?.WEFT_THICKNESS || 2; // This varies
    const stripeData = doormatData.stripeData || [];
    const palette = doormatData.selectedPalette || { name: 'Default', colors: ['#000000', '#FFFFFF'] };
    const characterMap = doormatData.characterMap || {};
    const textRows = doormatData.doormatTextRows || [];
    const textureLevel = doormatData.config?.TEXTURE_LEVEL || 0;
    const dirtLevel = doormatData.config?.DIRT_LEVEL || 0;
    const frameLevel = doormatData.config?.FRAME_STYLE || 'None';

    // Map frame level to code like onchain generator
    const mapFrameLevelToCode = (frameLevel: string) => {
      if (frameLevel === 'Gold') return 'G';
      if (frameLevel === 'Bronze') return 'B';
      if (frameLevel === 'Silver') return 'S';
      if (frameLevel === 'Diamond') return 'D';
      return '';
    };

    const frameCode = mapFrameLevelToCode(frameLevel);

    // Read the original JavaScript files
    const fs = require('fs');
    const rugP5Content = fs.readFileSync('data/rug-p5.js', 'utf8');
    const rugAlgoContent = fs.readFileSync('data/rug-algo.js', 'utf8');
    const rugFrameContent = fs.readFileSync('data/rug-frame.js', 'utf8');

    // Generate metadata config exactly like onchain generator
    const rugConfig = `let w=${width},h=${height},f=${fringe},wt=${weft},wp=${warp},ts=2,lt,dt,p='${JSON.stringify(palette)}',sd='${JSON.stringify(stripeData)}',tr=${JSON.stringify(textRows)},td=[],s=${seed},cm='${JSON.stringify(characterMap)}',tl=${textureLevel},dl=${dirtLevel},fl="${frameCode}";p=JSON.parse(p);sd=JSON.parse(sd);cm=JSON.parse(cm);`;

    // Generate HTML with exact same structure as onchain generator
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>OnchainRug #${seed}</title>
  <style>body{display:flex;justify-content:center;align-items:center}#defaultCanvas0{width:100%!important;height:auto!important;}</style>
</head>
<body>
<!-- 1. p5.js library -->
<script>
${rugP5Content}
</script>

<!-- 2. Container div for p5.js canvas -->
<div id="rug"></div>

<!-- 3. NFT-specific configuration script -->
<script>
${rugConfig}
</script>

<!-- 4. Algorithm script -->
<script>
${rugAlgoContent}
</script>

<!-- 5. Frame script (only if has frame) -->
${frameCode ? `<script>
${rugFrameContent}
</script>` : ''}
</body>
</html>`;

    // Download the HTML file
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onchain-rug-${seed}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={exportNFT}>
      Export NFT
    </button>
  );
};

export default NFTExporter;