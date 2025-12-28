import React, { useState, useEffect } from 'react';

const NFTExporter: React.FC = () => {
  const [rugP5Source, setRugP5Source] = useState<string | null>(null)
  const [rugAlgoSource, setRugAlgoSource] = useState<string | null>(null)
  const [rugFrameSource, setRugFrameSource] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadSources() {
      const [p5, algo, frame] = await Promise.all([
        fetch('/rug-p5.js').then(r => r.text()),
        fetch('/rug-algo.js').then(r => r.text()),
        fetch('/rug-frame.js').then(r => r.text())
      ])

      if (!cancelled) {
        setRugP5Source(p5)
        setRugAlgoSource(algo)
        setRugFrameSource(frame)
      }
    }

    loadSources()
    return () => { cancelled = true }
  }, [])
  const exportNFT = () => {
    if (!rugP5Source || !rugAlgoSource) {
      alert('JS sources not loaded yet')
      return
    }

    console.log('NFT EXPORTER USING rug-algo.js')
    console.log('rf initial:', typeof window !== 'undefined' && typeof (window as any).rf !== 'undefined' ? (window as any).rf : 'missing')

    // Read data from window.__DOORMAT_DATA__
    const doormatData = typeof window !== 'undefined' ? (window as any).__DOORMAT_DATA__ : null;
    if (!doormatData) {
      console.error('No doormat data available for export');
      return;
    }

    // Generate config script exactly like Solidity
    const configScript = `<script>
window.s = ${doormatData.seed || 42};
window.w = ${doormatData.config?.DOORMAT_WIDTH || 100};
window.h = ${doormatData.config?.DOORMAT_HEIGHT || 100};
window.f = ${doormatData.config?.FRINGE_LENGTH || 10};
window.wp = ${doormatData.config?.WEFT_THICKNESS || 2};
window.wt = ${doormatData.config?.WARP_THICKNESS || 2};
window.sd = ${JSON.stringify(doormatData.stripeData || [])};
window.p = ${JSON.stringify(doormatData.selectedPalette || { name: 'Default', colors: ['#000000', '#FFFFFF'] })};
window.tr = ${JSON.stringify(doormatData.doormatTextRows || [])};
window.tl = ${doormatData.config?.TEXTURE_LEVEL || 0};
window.dl = ${doormatData.config?.DIRT_LEVEL || 0};
window.fl = "${doormatData.config?.FRAME_STYLE || 'None'}";
window.ts = ${doormatData.config?.TEXT_SCALE || 1};
</script>`;


    // Generate complete HTML with scripts in correct order
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Onchain Rug #${doormatData.seed || 42}</title>
  <style>
    body { margin: 0; padding: 0; background: #f0f0f0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    #rug { border: 2px solid #ccc; }
  </style>
</head>
<body>
  <div id="rug"></div>
  ${configScript}
  <script>
new Function(${JSON.stringify(rugP5Source)})();
</script>
  <script>
new Function(${JSON.stringify(rugAlgoSource)})();
</script>
  <script>
new Function(${JSON.stringify(rugFrameSource)})();
</script>
</body>
</html>`;

    // Download the HTML file
    const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
    a.download = `onchain-rug-${doormatData.seed || 42}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  return (
        <button
          onClick={exportNFT}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
      Export NFT HTML
        </button>
  );
};

export default NFTExporter;