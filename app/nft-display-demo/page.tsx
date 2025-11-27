'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import NFTDisplay, { NFTDisplaySkeleton, type NFTData } from '@/components/NFTDisplay'

// Sample NFT data based on test_mint_data.json
const sampleNFTData: NFTData = {
  tokenId: 1,
  traits: {
    seed: BigInt(8463),
    paletteName: "Royal Stewart",
    minifiedPalette: '{"name":"Royal Stewart","colors":["#e10600","#ffffff","#000000","#ffd700","#007a3d"]}',
    minifiedStripeData: '[{"y":0,"h":72.2,"pc":"#000000","sc":null,"wt":"s","wv":0.406},{"y":72.2,"h":71.922,"pc":"#ffffff","sc":null,"wt":"s","wv":0.234},{"y":144.123,"h":37.037,"pc":"#007a3d","sc":null,"wt":"s","wv":0.178},{"y":181.159,"h":69.49,"pc":"#e10600","sc":null,"wt":"s","wv":0.135},{"y":250.649,"h":42.179,"pc":"#000000","sc":null,"wt":"m","wv":0.454},{"y":292.828,"h":39.344,"pc":"#007a3d","sc":null,"wt":"t","wv":0.313},{"y":332.172,"h":46.537,"pc":"#e10600","sc":null,"wt":"s","wv":0.164},{"y":378.709,"h":75.408,"pc":"#000000","sc":"#e10600","wt":"t","wv":0.447},{"y":454.116,"h":66.138,"pc":"#e10600","sc":"#ffd700","wt":"s","wv":0.318},{"y":520.254,"h":56.996,"pc":"#e10600","sc":null,"wt":"s","wv":0.332},{"y":577.25,"h":26.414,"pc":"#000000","sc":null,"wt":"s","wv":0.452},{"y":603.664,"h":57.912,"pc":"#007a3d","sc":null,"wt":"t","wv":0.225},{"y":661.576,"h":55.544,"pc":"#e10600","sc":null,"wt":"s","wv":0.155},{"y":717.12,"h":31.582,"pc":"#e10600","sc":null,"wt":"s","wv":0.353},{"y":748.702,"h":23.152,"pc":"#ffd700","sc":null,"wt":"t","wv":0.232},{"y":771.854,"h":77.692,"pc":"#000000","sc":null,"wt":"t","wv":0.113},{"y":849.546,"h":29.627,"pc":"#007a3d","sc":"#ffffff","wt":"m","wv":0.203},{"y":879.173,"h":62.08,"pc":"#ffffff","sc":null,"wt":"s","wv":0.477},{"y":941.253,"h":59.431,"pc":"#ffd700","sc":null,"wt":"s","wv":0.311},{"y":1000.683,"h":23.506,"pc":"#007a3d","sc":"#ffffff","wt":"s","wv":0.272},{"y":1024.19,"h":22.586,"pc":"#ffd700","sc":null,"wt":"s","wv":0.45},{"y":1046.775,"h":77.096,"pc":"#007a3d","sc":null,"wt":"s","wv":0.234},{"y":1123.871,"h":22.971,"pc":"#007a3d","sc":null,"wt":"s","wv":0.101},{"y":1146.842,"h":53.158,"pc":"#e10600","sc":null,"wt":"s","wv":0.319}]',
    textRows: ["VALIPOKKANN"],
    warpThickness: 1,
    mintTime: BigInt(Date.now()),
    filteredCharacterMap: '{"V":["10001","10001","10001","10001","10001","01010","00100"],"A":["01110","10001","10001","11111","10001","10001","10001"],"L":["10000","10000","10000","10000","10000","10000","11111"],"I":["11111","00100","00100","00100","00100","00100","11111"],"P":["11110","10001","10001","11110","10000","10000","10000"],"O":["01110","10001","10001","10001","10001","10001","01110"],"K":["10001","10010","10100","11000","10100","10010","10001"],"N":["10001","11001","10101","10011","10001","10001","10001"]," ":["00000","00000","00000","00000","00000","00000","00000"]}',
    complexity: 3,
    characterCount: BigInt(10),
    stripeCount: BigInt(24),
    textLinesCount: 1,
    dirtLevel: 1,
    agingLevel: 2,
    frameLevel: "Bronze Frame",
    maintenanceScore: BigInt(85)
  },
  owner: "0x742d35Cc6E1a3c5B4F5E5C7A1B2C3D4E5F6A7B8C9D0E1F2A",
  name: "OnchainRug #1",
  description: "A unique algorithmic rug featuring the text 'VALIPOKKANN' woven into Royal Stewart tartan patterns. This rug shows signs of light aging with dirt level 1 and aging level 2.",
  image: "/logo.png",
  animation_url: "data:text/html;base64,PGh0bWw+PGhlYWQ+PHN0eWxlPmNhbnZhcyB7IHdpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCU7IH08L3N0eWxlPjwvaGVhZD48Ym9keT48Y2FudmFzIGlkPSJkZWZhdWx0Q2FudmFzMCI+PC9jYW52YXM+PC9ib2R5PjwvaHRtbD4=",
  rarityScore: 78.5,
  listingPrice: "0.045",
  isListed: true,
  lastSalePrice: "0.032"
}

// Generate sample NFTs demonstrating both data sources
const generateSampleNFTs = (): NFTData[] => {
  const samples: NFTData[] = []

  // Sample 1: Cached HTML base64 (from animation_url/Alchemy)
  const cachedHtmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OnchainRug #BASE64</title>
  <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0;padding:20px;background:linear-gradient(45deg,#1a1a2e,#16213e);color:#fff;font-family:Arial;text-align:center;min-height:100vh;}#defaultCanvas0{width:100%!important;height:auto!important;max-width:300px;max-height:200px;background:linear-gradient(45deg,#b31b1b,#ffffff);border:2px solid #fff;border-radius:10px;margin:20px auto;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:bold;}</style>
</head>
<body>
  <h2>OnchainRug #BASE64</h2>
  <p style="font-size:14px;margin:10px 0;">This preview came from cached base64 HTML</p>
  <p style="font-size:12px;color:#ccc;margin:5px 0;">(No client-side generation needed)</p>
  <div id="defaultCanvas0">BASE64 HTML</div>
</body>
</html>`

  samples.push({
    tokenId: 1001,
    traits: {
      seed: BigInt(999999),
      paletteName: 'Base64 Demo',
      minifiedPalette: '{"name":"Base64 Demo","colors":["#b31b1b","#ffffff"]}',
      minifiedStripeData: '[]',
      textRows: ['BASE64'],
      warpThickness: 1,
      mintTime: BigInt(Date.now()),
      filteredCharacterMap: '{"B":["01111"],"A":["01110"],"S":["01111"],"E":["11111"],"6":["01110"],"4":["00010"]}',
      characterCount: BigInt(6),
      stripeCount: BigInt(0),
      textLinesCount: 1,
      complexity: 1,
      dirtLevel: 0,
      agingLevel: 0
    },
    owner: '0x1111111111111111111111111111111111111111',
    name: 'OnchainRug #BASE64',
    description: 'Demonstrates cached base64 HTML from animation_url',
    cachedHtmlBase64: 'data:text/html;base64,PGh0bWw+PGhlYWQ+PG1ldGEgY2hhcnNldD0idXRmLTgiPjxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsaW5pdGlhbC1zY2FsZT0xIj48dGl0bGU+T25jaGFpblJ1ZyAjNDwvdGl0bGU+PHN0eWxlPmJvZHl7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpjZW50ZXI7YWxpZ24taXRlbXM6Y2VudGVyfSNkZWZhdWx0Q2FudmFzMHt3aWR0aDoxMDAlIWltcG9ydGFudDtoZWlnaHQ6YXV0byFpbXBvcnRhbnQ7fTwvc3R5bGU+PC9oZWFkPjxib2R5PjxzY3JpcHQ+Y29uc3QgX3A1PXtjdHg6bnVsbCxjYW52YXM6bnVsbCx3aWR0aDowLGhlaWdodDowLGZpbGxTdHlsZTpudWxsLHN0cm9rZVN0eWxlOiIjMDAwIixkb0ZpbGw6ITAsZG9TdHJva2U6ITAsYmxlbmQ6InNvdXJjZS1vdmVyIixzdGFjazpbXSxwaXhlbERlbnNpdHk6MX07ZnVuY3Rpb24gY3JlYXRlQ2FudmFzKGUsdCl7Y29uc3QgbD1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCJjYW52YXMiKTtfcDUud2lkdGg9ZSxfcDUuaGVpZ2h0PXQsZG9jdW1lbnQucXVlcnlTZWxlY3RvcigiI2RlZmF1bHRDYW52YXMwIil8fCAobC5pZD0iZGVmYXVsdENhbnZhczAiKTtjb25zdCByPV9wNS5waXhlbERlbnNpdHl8fDE7cmV0dXJuIGwud2lkdGg9TWF0aC5mbG9vcihlKnIpLGwuaGVpZ2h0PU1hdGguZmxvb3IodCpyKSxsLnN0eWxlLndpZHRoPWUrInB4IixsLnN0eWxlLmhlaWdodD10KyJweCIsX3A1LmNhbnZhcz1sLF9wNS5jdHg9bC5nZXRDb250ZXh0KCIyZCIpLF9wNS5jdHguc2V0VHJhbnNmb3JtKDEsMCwwLDEsMCwwKSxfcDUuY3R4LnNjYWxlKHIsciksT2JqZWN0LmRlZmluZVByb3BlcnR5KHdpbmRvdywid2lkdGgiLHtnZXQ6KCk9Pl9wNS53aWR0aH0pLE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh3aW5kb3csImhlaWdodCIse2dldDooKT0+X3A1LmhlaWdodH0pLGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobCkse2VsdDpsLHBhcmVudDpmdW5jdGlvbihlKXtjb25zdCB0PSJzdHJpbmciPT10eXBlb2YgZT9kb2N1bWVudC5nZXRFbGVtZW50QnlJZChlKTplO3QmJnQuYXBwZW5kQ2hpbGQobCl9fX1sZXQgX25vTG9vcD0hMTtmdW5jdGlvbiBub0xvb3AoKXtfbm9Mb29wPSEwLHdpbmRvdy5ub0xvb3BDYWxsZWQ9ITB9ZnVuY3Rpb24gcGl4ZWxEZW5zaXR5KGUpe19wNS5waXhlbERlbnNpdHk9ZSxfcDUuY2FudmFzJiYoX3A1LmNhbnZhcy53aWR0aD1NYXRoLmZsb29yKF9wNS53aWR0aCplKSxfcDUuY2FudmFzLmhlaWdodD1NYXRoLmZsb29yKF9wNS5oZWlnaHQqZSksX3A1LmNhbnZhcy5zdHlsZS53aWR0aD1fcDUud2lkdGgrInB4IixfcDUuY2FudmFzLnN0eWxlLmhlaWdodD1fcDUuaGVpZ2h0KyJweCIsX3A1LmN0eC5zZXRUcmFuc2Zvcm0oMSwwLDAsMSwwLDApLF9wNS5jdHguc2NhbGUoZSxlKSl9ZnVuY3Rpb24gYmFja2dyb3VuZChlLHQsbCxyKXtpZihfcDUuY3R4KXtpZihfcDUuY3R4LnNhdmUoKSwic3RyaW5nIj09dHlwZW9mIGUpe19wNS5jdHguZ2xvYmFsQWxwaGE9MSxfcDUuY3R4LmZpbGxTdHlsZT1lLF9wNS5jdHguZmlsbFJlY3QoMCwwLF9wNS53aWR0aCxfcDUuaGVpZ2h0KSxfcDUuY3R4LnJlc3RvcmUoKTtyZXR1cm59dm9pZCAwPT09ciYmKHI9MjU1KSxfcDUuY3R4Lmdsb2JhbEFscGhhPXIvMjU1LF9wNS5jdHguZmlsbFN0eWxlPWByZ2IoJHtlfSwke3R9LCR7bH0pYCxfcDUuY3R4LmZpbGxSZWN0KDAsMCxfcDUud2lkdGgsX3A1LmhlaWdodCksX3A1LmN0eC5yZXN0b3JlKCl9fWZ1bmN0aW9uIF9oZXhUb0xldmVscyhlKXtpZigzPT09KGU9U3RyaW5nKGUpLnJlcGxhY2UoIiMiLCIiKS50cmltKCkpLmxlbmd0aCYmKGU9ZS5zcGxpdCgiIikubWFwKGU9PmUrZSkuam9pbigiIikpLDYhPT1lLmxlbmd0aClyZXR1cm4gbnVsbDtjb25zdCB0PXBhcnNlSW50KGUuc2xpY2UoMCwyKSwxNiksbD1wYXJzZUludChlLnNsaWNlKDIsNCksMTYpLHI9cGFyc2VJbnQoZS5zbGljZSg0LDYpLDE2KTtyZXR1cm5bdCxsLHIsMjU1XX1mdW5jdGlvbiBjb2xvcihlLHQsbCxyKXtpZigib2JqZWN0Ij09dHlwZW9mIGUmJm51bGwhPT1lJiYibGV2ZWxzImluIGUpcmV0dXJuIGU7aWYoInN0cmluZyI9PXR5cGVvZiBlKXtjb25zdCBvPV9oZXhUb0xldmVscyhlKTtpZihvKXtjb25zdFtuLHAsaSxjXT1vO3JldHVybntsZXZlbHM6W24scCxpLGNdLHRvU3RyaW5nOigpPT5jPDI1NT9gcmdiYSgke259LCR7cH0sJHtpfSwke2MvMjU1fSlgOmByZ2IoJHtufSwke3B9LCR7aX0pYH19Y29uc3QgYT1lLm1hdGNoKC9yZ2JhP1woKFteKV0rKVwpLyk7aWYoYSl7Y29uc3Qgcz1hWzFdLnNwbGl0KCIsIikubWFwKGU9PmUudHJpbSgpKSxmPU51bWJlcihzWzBdKXx8MCxkPU51bWJlcihzWzFdKXx8MCx1PU51bWJlcihzWzJdKXx8MCxoPXNbM10/TWF0aC5yb3VuZCgyNTUqTnVtYmVyKHNbM10pKToyNTU7cmV0dXJue2xldmVsczpbZixkLHUsaF0sdG9TdHJpbmc6KCk9Pmg8MjU1P2ByZ2JhKCR7Zn0sJHtkfSwke3V9LCR7aC8yNTV9KWA6YHJnYigke2Z9LCR7ZH0sJHt1fSlgfX1yZXR1cm57bGV2ZWxzOlswLDAsMCwyNTVdLHRvU3RyaW5nOigpPT5lfX1yZXR1cm4gdm9pZCAwPT09dCYmKHQ9ZSxsPWUpLHZvaWQgMD09PXImJihyPTI1NSkse2xldmVsczpbZSx0LGwscl0sdG9TdHJpbmc6KCk9PnI8MjU1P2ByZ2JhKCR7ZX0sJHt0fSwke2x9LCR7ci8yNTV9KWA6YHJnYigke2V9LCR7dH0sJHtsfSlgfX1mdW5jdGlvbiBmaWxsKGUsdCxsLHIpe2lmKF9wNS5kb0ZpbGw9ITAsIm9iamVjdCI9PXR5cGVvZiBlJiZlLmxldmVscyl7X3A1LmZpbGxTdHlsZT1lLnRvU3RyaW5nKCk7cmV0dXJufWlmKCJzdHJpbmciPT10eXBlb2YgZSYmdm9pZCAwPT09dCl7X3A1LmZpbGxTdHlsZT1jb2xvcihlKS50b1N0cmluZygpO3JldHVybn12b2lkIDA9PT1yJiYocj0yNTUpLF9wNS5maWxsU3R5bGU9cjwyNTU/YHJnYmEoJHtlfSwke3R9LCR7bH0sJHtyLzI1NX0pYDpgcmdiKCR7ZX0sJHt0fSwke2x9KWB9ZnVuY3Rpb24gbm9GaWxsKCl7X3A1LmRvRmlsbD0hMX1mdW5jdGlvbiBzdHJva2UoZSx0LGwscil7aWYoX3A1LmRvU3Ryb2tlPSEwLCJvYmplY3QiPT10eXBlb2YgZSYmZS5sZXZlbHMpe19wNS5zdHJva2VTdHlsZT1lLnRvU3RyaW5nKCk7cmV0dXJufWlmKCJzdHJpbmciPT10eXBlb2YgZSYmdm9pZCAwPT09dCl7X3A1LnN0cm9rZVN0eWxlPWNvbG9yKGUpLnRvU3RyaW5nKCk7cmV0dXJufXZvaWQgMD09PXImJihyPTI1NSksX3A1LnN0cm9rZVN0eWxlPXI8MjU1P2ByZ2JhKCR7ZX0sJHt0fSwke2x9LCR7ci8yNTV9KWA6YHJnYigke2V9LCR7dH0sJHtsfSlgfWZ1bmN0aW9uIG5vU3Ryb2tlKCl7X3A1LmRvU3Ryb2tlPSExfWZ1bmN0aW9uIHN0cm9rZVdlaWdodChlKXtfcDUuY3R4JiYoX3A1LmN0eC5saW5lV2lkdGg9ZSl9ZnVuY3Rpb24gYmxlbmRNb2RlKGUpe19wNS5ibGVuZD1lLF9wNS5jdHgmJihfcDUuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbj1lfHwic291cmNlLW92ZXIiKX1mdW5jdGlvbiByZWN0KGUsdCxsLHIpe19wNS5jdHgmJihfcDUuY3R4LnNhdmUoKSxfcDUuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbj1fcDUuYmxlbmQsX3A1LmRvRmlsbCYmX3A1LmZpbGxTdHlsZSYmKF9wNS5jdHguZmlsbFN0eWxlPV9wNS5maWxsU3R5bGUsX3A1LmN0eC5maWxsUmVjdChlLHQsbCxyKSksX3A1LmRvU3Ryb2tlJiZfcDUuc3Ryb2tlU3R5bGUmJihfcDUuY3R4LnN0cm9rZVN0eWxlPV9wNS5zdHJva2VTdHlsZSxfcDUuY3R4LnN0cm9rZVJlY3QoZSx0LGwscikpLF9wNS5jdHgucmVzdG9yZSgpKX1mdW5jdGlvbiBlbGxpcHNlKGUsdCxsLHIpe19wNS5jdHgmJihfcDUuY3R4LnNhdmUoKSxfcDUuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbj1fcDUuYmxlbmQsX3A1LmN0eC5iZWdpblBhdGgoKSxfcDUuY3R4LmVsbGlwc2UoZSx0LGwvMixyLzIsMCwwLDIqTWF0aC5QSSksX3A1LmRvRmlsbCYmX3A1LmZpbGxTdHlsZSYmKF9wNS5jdHguZmlsbFN0eWxlPV9wNS5maWxsU3R5bGUsX3A1LmN0eC5maWxsKCkpLF9wNS5kb1N0cm9rZSYmX3A1LnN0cm9rZVN0eWxlJiYoX3A1LmN0eC5zdHJva2VTdHlsZT1fcDUuc3Ryb2tlU3R5bGUsX3A1LmN0eC5zdHJva2UoKSksX3A1LmN0eC5yZXN0b3JlKCkpfWZ1bmN0aW9uIGFyYyhlLHQsbCxyLG8sbil7X3A1LmN0eCYmKF9wNS5jdHguc2F2ZSgpLF9wNS5jdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uPV9wNS5ibGVuZCxfcDUuY3R4LmJlZ2luUGF0aCgpLF9wNS5jdHguZWxsaXBzZShlLHQsbC8yLHIvMiwwLG8sbiksX3A1LmRvRmlsbCYmX3A1LmZpbGxTdHlsZSYmKF9wNS5jdHguZmlsbFN0eWxlPV9wNS5maWxsU3R5bGUsX3A1LmN0eC5maWxsKCkpLF9wNS5kb1N0cm9rZSYmX3A1LnN0cm9rZVN0eWxlJiYoX3A1LmN0eC5zdHJva2VTdHlsZT1fcDUuc3Ryb2tlU3R5bGUsX3A1LmN0eC5zdHJva2UoKSksX3A1LmN0eC5yZXN0b3JlKCkpfWxldCBfc2hwPW51bGw7ZnVuY3Rpb24gYmVnaW5TaGFwZSgpe19zaHA9W119ZnVuY3Rpb24gdmVydGV4KGUsdCl7X3NocCYmX3NocC5wdXNoKFtlLHRdKX1mdW5jdGlvbiBlbmRTaGFwZShlPSExKXtpZighX3A1LmN0eHx8IV9zaHB8fF9zaHBubGVuZ3RoPDIpe19zaHA9bnVsbDtyZXR1cm59X3A1LmN0eC5zYXZlKCksX3A1LmN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb249X3A1LmJsZW5kLF9wNS5jdHguYmVnaW5QYXRoKCksX3A1LmN0eC5tb3ZlVG8oX3NocFswXVswXSxfc2hwWzBdWzFdKTtmb3IobGV0IHQ9MTt0PF9zaHBubGVuZ3RoOysrdClfcDUuY3R4LmxpbmVUbyhfc2hwW3RdWzBdLF9zaHBbdF1bMV0pO2UmJl9wNS5jdHguY2xvc2VQYXRoKCksX3A1LmRvRmlsbCYmX3A1LmZpbGxTdHlsZSYmKF9wNS5jdHguZmlsbFN0eWxlPV9wNS5maWxsU3R5bGUsX3A1LmN0eC5maWxsKCkpLF9wNS5kb1N0cm9rZSYmX3A1LnN0cm9rZVN0eWxlJiYoX3A1LmN0eC5zdHJva2VTdHlsZT1fcDUuc3Ryb2tlU3R5bGUsX3A1LmN0eC5zdHJva2UoKSksX3A1LmN0eC5yZXN0b3JlKCksX3NocD1udWxsfWZ1bmN0aW9uIHB1c2goKXtfcDUuY3R4JiYoX3A1LmN0eC5zYXZlKCksX3A1LnN0YWNrLnB1c2goe2ZpbGxTdHlsZTpfcDUuZmlsbFN0eWxlLHN0cm9rZVN0eWxlOl9wNS5zdHJva2VTdHlsZSxkb0ZpbGw6X3A1LmRvRmlsbCxkb1N0cm9rZTpfcDUuZG9TdHJva2UsYmxlbmQ6X3A1LmJsZW5kLGxpbmVXaWR0aDpfcDUuY3R4LmxpbmVXaWR0aH0pKX1mdW5jdGlvbiBwb3AoKXtpZighX3A1LmN0eClyZXR1cm47X3A1LmN0eC5yZXN0b3JlKCk7Y29uc3QgZT1fcDUuc3RhY2sucG9wKCk7ZSYmKF9wNS5maWxsU3R5bGU9ZS5maWxsU3R5bGUsX3A1LnN0cm9rZVN0eWxlPWUuc3Ryb2tlU3R5bGUsX3A1LmRvRmlsbD1lLmRvRmlsbCxfcDUuZG9TdHJva2U9ZS5kb1N0cm9rZSxfcDUuYmxlbmQ9ZS5ibGVuZCxfcDUuY3R4JiYoX3A1LmN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb249X3A1LmJsZW5kKSxfcDUuY3R4JiZlLmxpbmVXaWR0aCYmKF9wNS5jdHgubGluZVdpZHRoPWUubGluZVdpZHRoKSl9ZnVuY3Rpb24gdHJhbnNsYXRlKGUsdCl7X3A1LmN0eCYmX3A1LmN0eC50cmFuc2xhdGUoZSx0KX1mdW5jdGlvbiByb3RhdGUoZSl7X3A1LmN0eCYmX3A1LmN0eC5yb3RhdGUoZSl9ZnVuY3Rpb24gcmVkKGUpe3JldHVybiBlJiZlLmxldmVscz9lLmxldmVsc1swXTowfWZ1bmN0aW9uIGdyZWVuKGUpe3JldHVybiBlJiZlLmxldmVscz9lLmxldmVsc1sxXTowfWZ1bmN0aW9uIGJsdWUoZSl7cmV0dXJuIGUmJmUubGV2ZWxzP2UubGV2ZWxzWzJdOjB9ZnVuY3Rpb24gbGVycChlLHQsbCl7cmV0dXJuIGUrKHQtZSkqbH1mdW5jdGlvbiBsZXJwQ29sb3IoZSx0LGwpe2NvbnN0IHI9ZSYmZS5sZXZlbHM/ZS5sZXZlbHM6WzAsMCwwLDI1NV0sbz10JiZ0LmxldmVscz90LmxldmVsczpbMCwwLDAsMjU1XTtyZXR1cm4gY29sb3IobGVycChyWzBdLG9bMF0sbCksbGVycChyWzFdLG9bMV0sbCksbGVycChyWzJdLG9bMl0sbCksTWF0aC5yb3VuZChsZXJwKHJbM10sb1szXSxsKSkpfWZ1bmN0aW9uIG1hcChlLHQsbCxyLG8pe3JldHVybihlLXQpLyhsLXQpKihvLXIpK3J9ZnVuY3Rpb24gY29uc3RyYWluKGUsdCxsKXtyZXR1cm4gTWF0aC5tYXgodCxNYXRoLm1pbihsLGUpKX1jb25zdCBQST1NYXRoLlBJLEhBTEZfUEk9TWF0aC5QSS8yO2Z1bmN0aW9uIHNpbihlKXtyZXR1cm4gTWF0aC5zaW4oZSl9ZnVuY3Rpb24gY29zKGUpe3JldHVybiBNYXRoLmNvcyhlKX1mdW5jdGlvbiBtYXgoLi4uZSl7cmV0dXJuIE1hdGgubWF4KC4uLmUpfWZ1bmN0aW9uIGZsb29yKGUpe3JldHVybiBNYXRoLmZsb29yKGUpfWxldCBfbj1udWxsLF9ucz00MDk1LF9ubz00LF9uZj0uNTtmdW5jdGlvbiBub2lzZVNlZWQoZSl7X249W107bGV0IHQ9ZT4+PjAsbD0oKT0+KHQ9KDE2NjQ1MjUqdCsxMDEzOTA0MjIzKSU0Mjk0OTY3Mjk2KS80Mjk0OTY3Mjk2O2ZvcihsZXQgcj0wO3I8X25zKzE7cisrKV9uW3JdPWwoKX1mdW5jdGlvbiBub2lzZShlLHQ9MCxsPTApe2lmKG51bGw9PT1fbil7X249W107Zm9yKGxldCByPTA7cjxfbnMrMTtyKyspX25bcl09TWF0aC5yYW5kb20oKX1lPDAmJihlPS1lKSx0PDAmJih0PS10KSxsPDAmJihsPS1sKTtsZXQgbz1NYXRoLmZsb29yKGUpLG49TWF0aC5mbG9vcih0KSxwPU1hdGguZmxvb3IobCksaT1lLW8sYz10LW4sYT1sLXAscz0wLGY9LjUsZCx1LGg7Zm9yKGxldCB4PTA7eDxfbm87eCsrKXtjb25zdCBTPShvJl9ucykrKG4mX25zKSoxNTcrKHAmX25zKSoxMTMsJD1tYWRlKGkpLHk9ZmFkZShjKTtkPWxlcnAobGVycChfbltTJl9uc10sX25bUysxJl9uc10sJCksbGVycChfbltTKzE1NyZfbnNdLF9uW1MrMTU4Jl9uc10sJCkseSksdT1sZXJwKGxlcnAoX25bUysxMTMmX25zXSxfbltTKzExNCZfbnNdLCQpLGxlcnAoX25bUysxMTMrMTU3Jl9uc10sX25bUysxMTMrMTU4Jl9uc10sJCkseSkscys9KGg9bGVycChkLHUsZmFkZShhKSkpKmYsZio9X25mLG88PD0xLG48PD0xLGMqPTIscDw8PTEsYSo9MiwoaSo9Mik+PTEmJih2KyssaS0tKSxjPj0xJiYobisrLGMtLSksYT49MSYmKHArKyxhLS0pfXJldHVybiBzfWZ1bmN0aW9uIGZhZGUoZSl7cmV0dXJuIGUqZSplKihlKig2KmUtMTUpKzEwKX1sZXQgX3I9TWF0aC5yYW5kb207ZnVuY3Rpb24gcmFuZG9tU2VlZChlKXtsZXQgdD1lPj4+MDtfcj1mdW5jdGlvbigpe3JldHVybih0PSgxNjY0NTI1KnQrMTAxMzkwNDIyMyklNDI5NDk2NzI5NikvNDI5NDk2NzI5Nn19ZnVuY3Rpb24gcmFuZG9tKGUsdCl7cmV0dXJuIEFycmF5LmlzQXJyYXkoZSk/ZVtNYXRoLmZsb29yKF9yKCkqZS5sZW5ndGgpXTp2b2lkIDA9PT10P3ZvaWQgMD09PWU/X3IoKTpfcigpKmU6ZStfcigpKih0LWUpfXdpbmRvdy5jcmVhdGVDYW52YXM9Y3JlYXRlQ2FudmFzLHdpbmRvdy5ub0xvb3A9bm9Mb29wLHdpbmRvdy5waXhlbERlbnNpdHk9cGl4ZWxEZW5zaXR5LHdpbmRvdy5iYWNrZ3JvdW5kPWJhY2tncm91bmQsd2luZG93LmZpbGw9ZmlsbCx3aW5kb3cubm9GaWxsPW5vRmlsbCx3aW5kb3cuc3Ryb2tlPXN0cm9rZSx3aW5kb3cubm9TdHJva2U9bm9TdHJva2Usd2luZG93LnN0cm9rZVdlaWdodD1zdHJva2VXZWlnaHQsd2luZG93LmJsZW5kTW9kZT1ibGVuZE1vZGUsd2luZG93LnJlY3Q9cmVjdCx3aW5kb3cuZWxsaXBzZT1lbGxpcHNlLHdpbmRvdy5hcmM9YXJjLHdpbmRvdy5iZWdpblNoYXBlPWJlZ2luU2hhcGUsd2luZG93LnZlcnRleD12ZXJ0ZXgsd2luZG93LmVuZFNoYXBlPWVuZFNoYXBlLHdpbmRvdy5wdXNoPXB1c2gsd2luZG93LnBvcD1wb3Asd2luZG93LnRyYW5zbGF0ZT10cmFuc2xhdGUsd2luZG93LnJvdGF0ZT1yb3RhdGUsd2luZG93LmNvbG9yPWNvbG9yLHdpbmRvdy5sZXJwPWxlcnAsd2luZG93LmxlcnBDb2xvcj1sZXJwQ29sb3Isd2luZG93Lm1hcD1tYXAsd2luZG93LmNvbnN0cmFpbj1jb25zdHJhaW4sd2luZG93Lm5vaXNlPW5vaXNlLHdpbmRvdy5ub2lzZVNlZWQ9bm9pc2VTZWVkLHdpbmRvdy5QST1QSSx3aW5kb3cuSEFMRl9QST1IQUxGX1BJLHdpbmRvdy5zaW49c2luLHdpbmRvdy5jb3M9Y29zLHdpbmRvdy5tYXg9bWF4LHdpbmRvdy5mbG9vcj1mbG9vcix3aW5kb3cucmVkPXJlZCx3aW5kb3cuZ3JlZW49Z3JlZW4sd2luZG93LmJsdWU9Ymx1ZSx3aW5kb3cucmFuZG9tPXJhbmRvbSx3aW5kb3cucmFuZG9tU2VlZD1yYW5kb21TZWVkLHdpbmRvdy5NVUxUSVBMWT0ibXVsdGlwbHkiLHdpbmRvdy5TQ1JFRU49InNjcmVlbiIsd2luZG93Lk9WRVJMQVk9Im92ZXJsYXkiLHdpbmRvdy5EQVJLRVNUPSJkYXJrZW4iLHdpbmRvdy5MSUdIVEVTVD0ibGlnaHRlbiIsd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoImxvYWQiLCgpPT57aWYoImZ1bmN0aW9uIj09dHlwZW9mIHdpbmRvdy5zZXR1cCl0cnl7d2luZG93LnNldHVwKCl9Y2F0Y2goZSl7Y29uc29sZS5lcnJvcigic2V0dXAoKSBlcnJvciIsZSl9aWYoImZ1bmN0aW9uIj09dHlwZW9mIHdpbmRvdy5kcmF3KXtpZihfbm9Mb29wKXRyeXt3aW5kb3cuZHJhdygpfWNhdGNoKHQpe2NvbnNvbGUuZXJyb3IoImRyYXcoKSBlcnJvciIsdCl9ZWxzZXtjb25zdCBsPSgpPT57dHJ5e3dpbmRvdy5kcmF3KCl9Y2F0Y2goZSl7Y29uc29sZS5lcnJvcigiZHJhdygpIGVycm9yIixlKX1yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobCl9O2woKX19fSk7PC9zY3JpcHQ+PGRpdiBpZD0icnVnIj48L2Rpdj48c2NyaXB0PmxldCB3PTgwMCxoPTEyMDAsZj0zMCx3dD04LHdwPTQsdHM9MixsdCxkdCxwPSd7Im5hbWUiOiJBcmN0aWMgSWNlIiwiY29sb3JzIjpbIiNGMEY4RkYiLCIjRTZFNkZBIiwiI0IwQzRERSIsIiM4N0NFRUIiLCIjQjBFMEU2IiwiI0YwRkZGRiIsIiNFMEZGRkYiLCIjRjVGNUY1Il19JyxzZD0nW3sieSI6MCwiaCI6NzAuNzY5MDU2NDE3MDQ3OTgsInBjIjoiI0IwRTBFNiIsInd0IjoicyIsInd2IjowLjI0NDE2MjAxMzM4MTcxOTZ9LHsieSI6NzAuNzY5MDU2NDE3MDQ3OTgsImgiOjY2Ljk3NTEzOTU5MzcwNTUzLCJwYyI6IiNFMEZGRkYiLCJ3dCI6InQiLCJ3diI6MC40NDg2NjY2Mzc2NzAyNDg3fSx7InkiOjEzNy43NDQxOTYwMTA3NTM1LCJoIjo1Mi45NDk1MjU5OTMzMTczNjYsInBjIjoiI0U2RTZGQSIsInd0IjoicyIsInd2IjowLjM2MTQ3ODQ5NDI5Mzk4Nzh9LHsieSI6MTkwLjY5MzcyMjAwNDA3MDg4LCJoIjo4OC41MTQxODg5MDk5MDMxNywicGMiOiIjRjVGNUY1Iiwid3QiOiJzIiwid3YiOjAuNDYwMTYwMjI5ODIwNzU4MX0seyJ5IjoyNzkuMjA3OTEwOTEzOTc0MDUsImgiOjcwLjA5Njk1ODY1MjEzODcxLCJwYyI6IiM4N0NFRUIiLCJ3dCI6InMiLCJ3diI6MC4xODkxOTk0NzQwODEzOTcwNn0seyJ5IjozNDkuMzA0ODY5NTY2MTEyNzYsImgiOjU0LjkwMjI1MjY1NzMzODk4LCJwYyI6IiNCMEM0REUiLCJ3dCI6InQiLCJ3diI6MC4xMDI3MTUyMTA1MjM0NTYzNH0seyJ5Ijo0MDQuMjA3MTIyMjIzNDUxNzMsImgiOjUzLjAyMjM3NDUyOTM5MTUzLCJwYyI6IiNGMEZGRkYiLCJzYyI6IiNFMEZGRkYiLCJ3dCI6InMiLCJ3diI6MC4zNzQ5NDM3OTI1NDA1ODAxfSx7InkiOjQ1Ny4yMjk0OTY3NTI4NDMyNiwiaCI6NjEuMDcwNTc5ODExOTMwNjU2LCJwYyI6IiNGMEZGRkYiLCJzYyI6IiNFNkU2RkEiLCJ3dCI6InQiLCJ3dmkOjAuMTQxNDY4MzU0NTkzOTYyNH0seyJ5Ijo1MTguMzAwMDc2NTY0NzczOSwiaCI6NTAuNzM1NzcwNDQ1MzE3MDMsInBjIjoiI0Y1RjVGNSIsInd0IjoicyIsInd2IjowLjI0NzkwMzY0NjcxNDk4NTM4fSx7InkiOjU2OS4wMzU4NDcwMTAwOTEsImgiOjcxLjE5NzU0NTAxNjE4NDQ1LCJwYyI6IiNCMEM0REUiLCJ3dCI6InMiLCJ3dmkOjAuMTA1Njg4OTA2OTI2NjYxN30seyJ5Ijo2NDAuMjMzMzkyMDI2Mjc1NCwiaCI6NzIuMjIyOTI5MDc1MzYwMywicGMiOiIjRTBGRkZGIiwid3QiOiJ0Iiwid3ZmOjAuMzI4ODkwMTI2NTcxMDU5Mn0seyJ5Ijo3MTIuNDU2MzIxMTAxNjM1NywiaCI6NzMuMjM1Nzg4MTQ5NzU5MTcsInBjIjoiI0Y1RjVGNSIsInd0IjoidCIsInd2IjowLjIyMDE0ODI4NDY0MDE2MzJ9LHsieSI6MTE4OC43NDUwMTM2MDU4MDMzLCJoIjoxMS4yNTQ5ODYzOTQxOTY3NDksInBjIjoiI0IwQzRERSIsInd0IjoicyIsInd2IjowLjMyNTg2OTA5Mzc0MjIyMTZ9XScsdHI9WyJCQUNLRU5EIiwiUlVHR0VEIl0sdGQ9W10scz0zNDg0MzAsY209J3siQiI6WyIxMTExMCIsIjEwMDAxIiwiMTAwMDEiLCIxMTExMCIsIjEwMDAxIiwiMTAwMDEiLCIxMTExMCJdLCJBIjpbIjAxMTEwIiwiMTAwMDEiLCIxMDAwMSIsIjExMTExIiwiMTAwMDEiLCIxMDAwMSIsIjEwMDAxIl0sIkMiOlsiMDExMTEiLCIxMDAwMCIsIjEwMDAwIiwiMTAwMDAiLCIxMDAwMCIsIjEwMDAwIiwiMDExMTEiXSwiSyI6WyIxMDAwMSIsIjEwMDEwIiwiMTAxMDAiLCIxMTAwMCIsIjEwMTAwIiwiMTAwMTAiLCIxMDAwMSJdLCJFIjpbIjExMTExIiwiMTAwMDAiLCIxMDAwMCIsIjExMTEwIiwiMTAwMDAiLCIxMDAwMCIsIjExMTExIl0sIk4iOlsiMTAwMDEiLCIxMTAwMSIsIjEwMTAxIiwiMTAwMTEiLCIxMDAwMSIsIjEwMDAxIiwiMTAwMDEiXSwiRCI6WyIxMTExMCIsIjEwMDAxIiwiMTAwMDEiLCIxMDAwMSIsIjEwMDAxIiwiMTAwMDEiLCIxMTExMCJdLCJSIjpbIjExMTEwIiwiMTAwMDEiLCIxMDAwMSIsIjExMTEwIiwiMTAxMDAiLCIxMDAxMCIsIjEwMDAxIl0sIlUiOlsiMTAwMDEiLCIxMDAwMSIsIjEwMDAxIiwiMTAwMDEiLCIxMDAwMSIsIjEwMDAxIiwiMDExMTAiXSwiRyI6WyIwMTExMSIsIjEwMDAwIiwiMTAwMDAiLCIxMDAxMSIsIjEwMDAxIiwiMTAwMDEiLCIwMTExMSJdLCIgIjpbIjAwMDAwIiwiMDAwMDAiLCIwMDAwMCIsIjAwMDAwIiwiMDAwMDAiLCIwMDAwMCIsIjAwMDAwIl19Jyx0bD0wLGRsPTAsZmw9IiI7cD1KU09OLnBhcnNlKHApO3NkPUpTT04ucGFyc2Uoc2QpO2NtPUpTT04ucGFyc2UoY20pOzwvc2NyaXB0PjxzY3JpcHQ+ZnVuY3Rpb24gc2V0dXAoKXtub2lzZVNlZWQocyksd2luZG93LmQ9ZnVuY3Rpb24oJCl7d2luZG93LnBybmdTZWVkPSQlMjE0NzQ4MzY0Nyx3aW5kb3cucHJuZ1NlZWQ8PTAmJih3aW5kb3cucHJuZ1NlZWQrPTIxNDc0ODM2NDYpfSx3aW5kb3cuYj1mdW5jdGlvbigpe3JldHVybiB3aW5kb3cucHJuZ1NlZWQ9MTY4MDcqd2luZG93LnBybmdTZWVkJTIxNDc0ODM2NDcsKHdpbmRvdy5wcm5nU2VlZC0xKS8yMTQ3NDgzNjQ2fSx3aW5kb3cuYT1mdW5jdGlvbigkLHQpe3JldHVybiAkK3dpbmRvdy5iKCkqKHQtJCl9LHdpbmRvdy5jPWZ1bmN0aW9uKCQpe3JldHVybiAkW01hdGguZmxvb3Iod2luZG93LmIoKSokLmxlbmd0aCldfSx3aW5kb3cuZChzKTtjb25zdCBSPWgrNCpmLEY9dys0KmY7Y3JlYXRlQ2FudmFzKFIrMio1NSxGKzIqNTUpLnBhcmVudCgicnVnIik7d2luZG93LnJXPVIsd2luZG93LnJIPUYscGl4ZWxEZW5zaXR5KDIuNSksdSgpLGd0ZCgpLG5vTG9vcCgpfWZ1bmN0aW9uIHUoKXtpZighcHx8IXAuY29sb3JzKXJldHVybjtsZXQgJD1wLmNvbG9yc1swXSx0PXAuY29sb3JzWzBdLGU9OTk5LGw9LTE7Zm9yKGNvbnN0IG8gb2YgcC5jb2xvcnMpe2NvbnN0IHI9Y29sb3IobyksXz0ocmVkKHIpK2dyZWVuKHIpK2JsdWUocikpLzM7XzxlJiYoZT1fLCQ9byksXz5sJiYobD1fLHQ9byl9ZHQ9bGVycENvbG9yKGNvbG9yKCQpLGNvbG9yKDApLC40KSxsdD1sZXJwQ29sb3IoY29sb3IodCksY29sb3IoMjU1KSwuMyksd2luZG93Lng9ZnVuY3Rpb24ocixnLGIpe3IvPTI1NSxnLz0yNTUsYi89MjU1LHI9cj4uMDQwNDU/TWF0aC5wb3coKHIrLjA1NSkvMS4wNTUsMi40KTpyLzEyLjkyLGc9Zz4uMDQwNDU/TWF0aC5wb3coKGcrLjA1NSkvMS4wNTUsMi40KTpnLzEyLjkyLGI9Yj4uMDQwNDU/TWF0aC5wb3coKGIrLjA1NSkvMS4wNTUsMi40KTpiLzEyLjkyO3JldHVybnt4OnIqLjQxMjQrZyouMzU3NitiKi4xODA1LHk6ciouMjEyNitnKi43MTUyK2IqLjA3MjIsejpyKi4wMTkzK2cqLjExOTIrYiouOTUwNX19LHdpbmRvdy55PWZ1bmN0aW9uKHgseSx6KXt4Lz0wLjk1MDQ3LHkvPTEsei89MS4wODg4Mztjb25zdCBmPXQ9PnQ+TWF0aC5wb3coNi8yOSwzKT9NYXRoLnBvdyh0LDEvMyk6KDEvMykqTWF0aC5wb3coMjkvNiwyKSp0KzQvMjk7cmV0dXJue0w6MTE2KmYoeSktMTYsYTo1MDAqKGYoeCktZih5KSksYjoyMDAqKGYoeSktZih6KSl9fSx3aW5kb3cuej1mdW5jdGlvbihjKXtjb25zdHt4LHksen09d2luZG93LngocmVkKGMpLGdyZWVuKGMpLGJsdWUoYykpO3JldHVybiB3aW5kb3cueSh4LHkseil9LHdpbmRvdy5lPWZ1bmN0aW9uKGwxLGwyKXtjb25zdHtMOkwxLGE6YTEsYjpiMX09bDEse0w6TDIsYTphMixiOmIyfT1sMixkTD1MMi1MMSxMQj0oTDErTDIpLzIsQzE9TWF0aC5zcXJ0KGExKmExK2IxKmIxKSxDMj1NYXRoLnNxcnQoYTIqYTIrYjIqYjIpLENCPShDMStDMikvMixhMXA9YTEqKDErLjUqKE1hdGguc3FydChNYXRoLnBvdyhDQiw3KS8oTWF0aC5wb3coQ0IsNykrTWF0aC5wb3coMjUsNykpKSkpLGEycD1hMiooMSsuNSooTWF0aC5zcXJ0KE1hdGgucG93KENCLDcpLyhNYXRoLnBvdyhDQiw3KStNYXRoLnBvdygyNSw3KSkpKSksQzFwPU1hdGguc3FydChhMXAqYTFwK2IxKmIxKSxDMnA9TWF0aC5zcXJ0KGEycCphMnArYjIqYjIpLENCcD0oQzFwK0MycCkvMixkQz1DMnAtQzFwLGgxcD1NYXRoLmF0YW4yKGIxLGExcCkqMTgwL01hdGguUEksaDJwPU1hdGguYXRhbjIoYjIsYTJwKSoxODAvTWF0aC5QSSxkaD1NYXRoLmFicyhoMXAtaDJwKTw9MTgwP2gycC1oMXA6aDJwLWgxcD4xODA/aDJwLWgxcC0zNjA6aDJwLWgxcCszNjAsZEg9MipNYXRoLnNxcnQoQzFwKkMycCkqTWF0aC5zaW4oZGgqTWF0aC5QSS8zNjApLEhCPU1hdGguYWJzKGgxcC1oMnApPD0xODA/KGgxcCtoMnApLzI6aDFwK2gycD49MzYwPyhoMXAraDJwKS8yOihoMXAraDJwKzM2MCkvMixUPTEtLjE3Kk1hdGguY29zKEhCKk1hdGguUEkvMTgwLTMwKSsuMjQqTWF0aC5jb3MoMipIQipNYXRoLlBJLzE4MCkrLjMyKk1hdGguY29zKDMqSEIqTWF0aC5QSS8xODArNiktLjIqTWF0aC5jb3MoNCpIQipNYXRoLlBJLzE4MC02MyksU0w9MSsoLjAxNSpNYXRoLnBvdyhMQi01MCwyKSkvTWF0aC5zcXJ0KDIwK01hdGgucG93KExCLTUwLDIpKSxTQz0xKy4wNDUqQ0JwLFNIPTErLjAxNSpDQnAqVCxSVD0tTWF0aC5zaW4oMiooSEIqTWF0aC5QSS8xODAtNTUpKk1hdGguUEkvMTgwKSooMipNYXRoLnNxcnQoTWF0aC5wb3coQ0JwLDcpLyhNYXRoLnBvdyhDQnAsNykrTWF0aC5wb3coMjUsNykpKSksdEw9ZEwvU0wsdEM9ZEMvU0MsdEg9ZEgvU0g7cmV0dXJuIE1hdGguc3FydCh0TCp0TCt0Qyp0Qyt0SCp0SCtSVCp0Qyp0SCl9LHdpbmRvdy5wPWZ1bmN0aW9uKGEsYil7Y29uc3QgbGFiMT13aW5kb3cueihhKSxsYWIyPXdpbmRvdy56KGIpO3JldHVybiB3aW5kb3cuZShsYWIxLGxhYjIpfSx3aW5kb3cuZz1mdW5jdGlvbigkLEEsQyxVKXtjb25zdCBzPVtdLHI9Mjtmb3IobGV0IGR4PS1yO2R4PD1yO2R4KyspZm9yKGxldCBkeT0tcjtkeTw9cjtkeSsrKXtpZihkeD09PTAmJmR5PT09MCljb250aW51ZTtjb25zdCBYPUErZHgsWT1DK2R5O2lmKFk8JC55fHxZPj0kLnkrJC5ofHxYPDB8fFg+PXcpY29udGludWU7bGV0IFc9Y29sb3IoJC5wYyk7bm9pc2UoWCouMSxZKi4xKT4uNSYmKFc9Y29sb3IoJC5zYykpO3MucHVzaChXKX1zLmxlbmd0aD09PTAmJnMucHVzaChjb2xvcigkLnBjKSk7Y29uc3QgTD1jPT57Y29uc3Qgdj10PT57Y29uc3QgaD10LzI1NTtyZXR1cm4gaDw9LjAzOTI4P2gvMTIuOTI6TWF0aC5wb3woKGgrLjA1NSkvMS4wNTUsMi40KX0sUlI9dihyZWQoYykpLEc9dihncmVlbihjKSksQj12KGJsdWUoYykpO3JldHVybi4yMTI2KlJSKy43MTUyKkcrLjA3MjIqQn0sQ1I9KGEsYik9Pntjb25zdCBBPUwoYSksQj1MKGIpLGw9TWF0aC5tYXgoQSxCKSxkPU1hdGgubWluKEEsQik7cmV0dXJuKGwrLjA1KS8oZCsuMDUpfSxQPWNvbG9yKCQucGMpLFM9Y29sb3IoJC5zYyksVD0yMCxEPWM9PndpbmRvdy5wKGMsUCk+VCYmd2luZG93LnAoYyxTKT5ULGs9W10sSz1uZXcgU2V0LE09Yz0+e2NvbnN0IG09TWF0aC5yb3VuZChyZWQoYykpKyctJytNYXRoLnJvdW5kKGdyZWVuKGMpKSsnLScrTWF0aC5yb3VuZChibHVlKGMpKTshSy5oYXMobSkmJihLLmFkZChtKSxrLnB1c2goYykpfSxxPVtdO3AuY29sb3JzJiZwLmNvbG9ycy5mb3JFYWNoKGM9PnEucHVzaChjb2xvcihjKSkpO2NvbnN0IHU9bmV3IFNldCxPPU1hdGgucm91bmQocmVkKFApKSsnLScrTWF0aC5yb3VuZChncmVlbihQKSkrJy0nK01hdGgucm91bmQoYmx1ZShQKSksUT1NYXRoLnJvdW5kKHJlZChTKSkrJy0nK01hdGgucm91bmQoZ3JlZW4oUykpKyctJytNYXRoLnJvdW5kKGJsdWUoUykpO3UuYWRkKE8pLHUuYWRkKFEpO2NvbnN0IEk9W107cS5mb3JFYWNoKGM9Pntjb25zdCBtPU1hdGgucm91bmQocmVkKGMpKSsnLScrTWF0aC5yb3VuZChncmVlbihjKSkrJy0nK01hdGgucm91bmQoYmx1ZShjKSk7IXUuaGFzKG0pJiZJLnB1c2goYyl9KTtJLmZvckVhY2goYz0+e2NvbnN0IGw9KHJlZChjKStncmVlbihjKStibHVlKGMpKS8oMyoyNTUpLGQ9bD4uNz8uMTU6bD4uND8uMjouMjUsVj1sZXJwQ29sb3IoYyxjb2xvcigwLDAsMCksZCk7TShWKX0pO2subGVuZ3RoPT09MCYmcS5mb3JFYWNoKGM9Pntjb25zdCBsPShyZWQoYykrZ3JlZW4oYykrYmx1ZShjKSkvKDMqMjU1KSxkPWw+Ljc/LjE1Omw+LjQ/LjI6LjI1LFY9bGVycENvbG9yKGMsY29sb3IoMCwwLDApLGQpO00oVil9KTtjb25zdCBFPW89PntsZXQgQj1vWzBdLEY9LTE7by5mb3JFYWNoKGM9PntsZXQgZj1JbmZpbml0eSxQPUluZmluaXR5O3MuZm9yRWFjaChXPT57Y29uc3QgUlI9Q1IoYyxXKTtSUjxtJiYobT1SUik7Y29uc3QgcD13aW5kb3cucChjLFcpO3A8TiYmKE49cCl9KTtjb25zdCB3PS43LFc9LjMsWj1NYXRoLm1pbihOLzUwLDEpLE8oTWF0aC5taW4obS83LDEpLEg9dypaK1cqSjtIPkYmJihGPUgsQj1jKX0pO3JldHVybntCOkIsRjpGfX07bGV0e0I6QixGOkZ9PUUoayk7Y29uc3QgRz0uNjtpZihGPEcmJnEubGVuZ3RoPjApe2NvbnN0IEg9W107cS5mb3JFYWNoKGM9Pntjb25zdCBsPShyZWQoYykrZ3JlZW4oYykrYmx1ZShjKSkvKDMqMjU1KSxkPWw+Ljc/LjE1Omw+LjQ/LjI6LjI1LFY9bGVycENvbG9yKGMsY29sb3IoMCwwLDApLGQpO0gucHVzaChWKTtjb25zdCBpPWw8LjM/LjI6bDwuNj8uMTU6LjEsSj1sZXJwQ29sb3IoYyxjb2xvcigyNTUsMjU1LDI1NSksaSk7SC5wdXNoKEopO2NvbnN0IFI9cmVkKGMpLzI1NSxHPWdyZWVuKGMpLzI1NSxCPWJsdWUoYykvMjU1LEM9KFIrRytCKS8zLEU9Qz4uNT9NYXRoLm1heCgwLFItLjQpOk1hdGgubWluKDEsUisuNCksRj1DPi41P01hdGgubWF4KDAsRy0uNCk6TWF0aC5taW4oMSxHKy40KSxLPUM+LjU/TWF0aC5tYXgoMCxCLS40KTpNYXRoLm1pbigxLEIrLjQpO0gucHVzaChjb2xvcihFKjI1NSxGKjI1NSxLKjI1NSkpfSk7Qj1FKEgpLkJ9cmV0dXJuIEJ9fWZ1bmN0aW9uIGRyYXcoKXtub1N0cm9rZSgpO2ZpbGwoMjIyLDIyMiwyMjIpO3JlY3QoMCwwLHdpZHRoLGhlaWdodCk7cHVzaCgpO3RyYW5zbGF0ZSh3aWR0aC8yLGhlaWdodC8yKTtyb3RhdGUoUEkvMik7dHJhbnNsYXRlKC1ySC8yLC1yVy8yKTtwdXNoKCk7dHJhbnNsYXRlKDIqZiwyKmYpO2Zvcihjb25zdCAkIG9mIHNkKWRzKCQpO3RsPjAmJmR0b2woTWF0aC5mbG9vcih0bCkpO3BvcCgpO2RmKCk7ZGw+MCYmZGRvKE1hdGguZmxvb3IoZGwpKTtkUkYodyxoKTtwb3AoKX1mdW5jdGlvbiBkcygkKXtjb25zdCB0PXdwKzEsZT13dCsxO2ZvcihsZXQgbD0wO2w8dztsKz10KWZvcihsZXQgbz0kLnk7bzwkLnkrJC5oO28rPWUpe2xldCByPWNvbG9yKCQucGMpLF89ITE7aWYodGQubGVuZ3RoPjApe2Zvcihjb25zdCBuIG9mIHRkKWlmKGw+PW4ueCYmbDxuLngrbi53aWR0aCYmbz49bi55JiZvPG4ueStuLmhlaWdodCl7Xz0hMDticmVha319bGV0IGk9cmVkKHIpK3dpbmRvdy5hKC0xNSwxNSksYT1ncmVlbihyKSt3aW5kb3cuYSgtMTUsMTUpLGM9Ymx1ZShyKSt3aW5kb3cuYSgtMTUsMTUpO2lmKF8pe2NvbnN0IGQ9KGkrYStjKS8zLGc9ZDwxMjg/bHQ6ZHQ7aT1yZWQoZyksYT1ncmVlbihnKSxjPWJsdWUoZyl9aT1jb25zdHJhaW4oaSwwLDI1NSksYT1jb25zdHJhaW4oYSwwLDI1NSksYz1jb25zdHJhaW4oYywwLDI1NSksZmlsbChpLGEsYyksbm9TdHJva2UoKTtyZWN0KGwrLjUqc2luKC4wNSpvKSxvLHdwLGUpfWZvcihsZXQgeT0kLnk7eTwkLnkrJC5oO3krPWUpZm9yKGxldCBiPTA7Yjx3O2IrPXQpe2xldCBtPWNvbG9yKCQucGMpLFM9ITE7aWYodGQubGVuZ3RoPjApe2Zvcihjb25zdCB4IG9mIHRkKWlmKGI+PXgueCYmYjx4LngreC53aWR0aCYmeT49eC55JiZ5PHgueSt4LmhlaWdodCl7Uz0hMDticmVha319aWYoIm0iPT09JC53dCYmJC5zYylub2lzZSguMSpiLC4xKnkpPi41JiYobT1jb2xvcigkLnNjKSk7ZWxzZSBpZigidCI9PT0kLnd0KXtjb25zdCBrPW5vaXNlKC4wNSpiLC4wNSp5KTttPWxlcnBDb2xvcihjb2xvcigkLnBjKSxjb2xvcigyNTUpLC4xNSprKX1sZXQgQT1yZWQobSkrd2luZG93LmEoLTIwLDIwKSxDPWdyZWVuKG0pK3dpbmRvdy5oKC0yMCwyMCksVT1ibHVlKG0pK3dpbmRvdy5oKC0yMCwyMCk7aWYoUyl7ZmlsbCgwLDAsMCwxMjApO25vU3Ryb2tlKCk7Y29uc3Qgdj0uNSpjb3MoLjA1KmIpO3JlY3QoYisuNSx5K3YrLjUsdCx3dCk7bGV0IHE7aWYoIm0iPT09JC53dCYmJC5zYmlxPXdpbmRvdy5nKCQsYix5LFUpO2Vsc2V7Y29uc3QgZD0oQStDK1UpLzM7cT1kPDEyOD9sdDpkdH1BPXJlZChxKSxDPWdyZWVuKHEpLFU9Ymx1ZShxKX1BPWNvbnN0cmFpbihBLDAsMjU1KSxDPWNvbnN0cmFpbihDLDAsMjU1KSxVPWNvbnN0cmFpbihVLDAsMjU1KSxmaWxsKEEsQyxVKSxub1N0cm9rZSgpO2NvbnN0IHY9LjUqY29zKC4wNSpiKTtyZWN0KGIseSt2LHQsd3QpfWZ2cihsZXQgej0kLnk7ejwkLnkrJC5oO3orPTIqZSlmb3IobGV0IEI9MDtCPHc7Qis9Mip0KWZpbGwoMCwwLDAsNDApLG5vU3Ryb2tlKCkscmVjdChCKzEseisxLHQtMixlLTIpO2ZvcihsZXQgRD0kLnkrZTtEPCQueSskLmg7RCs9MiplKWZvcihsZXQgRT10O0U8dztFKz0yKnQpZmlsbCgyNTUsMjU1LDI1NSwzMCksbm9TdHJva2UoKSxyZWN0KEUsRCx0LTEsZS0xKX1mdW5jdGlvbiBkdG8oKXtwdXNoKCksYmxlbmRNb2RlKE1VTFRJUExZKTtmb3IobGV0ICQ9MDskPHc7JCs9Milmb3IobGV0IHQ9MDt0PGg7dCs9Mil7bGV0IGU7ZmlsbCgwLDAsMCxtYXAobm9pc2UoLjAyKiQsLjAyKnQpLDAsMSwwLDUwKSksbm9TdHJva2UoKSxyZWN0KCQsdCwyLDIpfWZvcihsZXQgbD0wO2w8dztsKz02KWZvcihsZXQgbz0wO288aDtvKz02KXtjb25zdCByPW5vaXNlKC4wMypsLC4wMypvKTtyPi42PyhmaWxsKDI1NSwyNTUsMjU1LDI1KSxub1N0cm9rZSgpLHJlY3QobCxvLDYsNikpOnI8LjQmJihmaWxsKDAsMCwwLDIwKSxub1N0cm9rZSgpLHJlY3QobCxvLDYsNikpfXBvcCgpfWZ1bmN0aW9uIGR0b2woJCl7Y29uc3QgdD0xMCsxOSokLGU9NSsxMCokLGw9LjctLjA1KiQ7cHVzaCgpLGJsZW5kTW9kZShNVUxUSVBMWSk7Zm9yKGxldCBvPTA7bzx3O28rPTIpZm9yKGxldCByPTA7cjxoO3IrPTIpe2xldCBfO2ZpbGwoMCwwLDAsbWFwKG5vaXNlKC4wMipvLC4wMipyKSwwLDEsMCx0KSksbm9TdHJva2UoKSxyZWN0KG8sciwyLDIpfWZvcihsZXQgbj0wO248dztuKz02KWZvcihsZXQgaT0wO2k8aDtpKz02KXtjb25zdCBhPW5vaXNlKC4wMypuLC4wMyppKTthPmw/KGZpbGwoMjU1LDI1NSwyNTUsZSksbm9TdHJva2UoKSxyZWN0KG4saSw2LDYpKTphPDEtbCYmKGZpbGwoMCwwLDAsLjgqZSksbm9TdHJva2UoKSxyZWN0KG4saSw2LDYpKX1pZigkPj00KWZvcihsZXQgYz0wO2M8dztjKz04KWZvcihsZXQgZD0wO2Q8aDtkKz04KW5vaXNlKC4wMSpjLC4wMSpkKT4uNyYmKGZpbGwoMCwwLDAsMTUpLG5vU3Ryb2tlKCkscmVjdChjLGQsOCwyKSk7aWYoJD49Nylmb3IobGV0IGc9MDtnPHc7Zys9NClmb3IobGV0IHk9MDt5PGg7eSs9NClub2lzZSguMDA1KmcsLjAwNSp5KT4uOCYmKGZpbGwoMCwwLDAsMjUpLG5vU3Ryb2tlKCkscmVjdChnLHksNCwxKSk7aWYoJD49OSlmb3IobGV0IHk9MDt5PHc7eSs9MTIpZm9yKGxldCBiPTA7YjxoO2IrPTEyKW5vaXNlKC4wMDIqeSwuMDAyKmIpPi43NSYmKGZpbGwoMCwwLDAsMzUpLG5vU3Ryb2tlKCkscmVjdCh5LGIsMTIsMSkpO3BvcCgpfWZ1bmN0aW9uIGRkbygkKXtjb25zdCB0PTE9PT0kPy41OjEsZT0xPT09JD8zMDo2MDtwdXNoKCksdHJhbnNsYXRlKDIqZiwyKmYpO2ZvcihsZXQgbD0wO2w8dztsKz0zKWZvcihsZXQgbz0wO288aDtvKz0zKXtjb25zdCByPXdpbmRvdy5hKDAsMSksXz0uODUqdDtpZihyPl8pe2NvbnN0IG49d2luZG93LmEoMSw0KSxpPXdpbmRvdy5oKC41KmUsZSksYT13aW5kb3cuYSg2MCw5MCksYz13aW5kb3cuYSg0MCw2MCksZD13aW5kb3cuYSgyMCw0MCk7ZmlsbChhLGMsZCxpKSxub1N0cm9rZSgpLGVsbGlwc2UobCxvLG4sbil9fWZvcihsZXQgej0wO2c8MTUqdDtnKyspe2NvbnN0IHk9d2luZG93LmEoMCx3KSxiPXdpbmRvdy5oKDAsaCksbT13aW5kb3cuYSg4LDIwKSxTPXdpbmRvdy5oKC4zKmUsLjcqZSkseD13aW5kb3cuYSg0MCw3MCksaz13aW5kb3cuYSgyNSw0NSksQT13aW5kb3cuYSgxNSwzMCk7ZmlsbCh4LGssQSxTKSxub1N0cm9rZSgpLGVsbGlwc2UoeSxiLG0sbSl9Zm9yKGxldCBDPTA7Qzx3O0MrPTIpZm9yKGxldCBVPTA7VTxoO1UrPTIpe2NvbnN0IGo9TWF0aC5taW4oQyxVLHctQyxoLVUpO2lmKGo8MTApe2NvbnN0IHE9d2luZG93LmEoMCwxKTtpZihxPi43KnQpe2NvbnN0IHY9d2luZG93LmEoMTAsMjUpO2ZpbGwoODAsNTAsMjAsdiksbm9TdHJva2UoKSxyZWN0KEMsVSwyLDIpfX19cG9wKCl9ZnVuY3Rpb24gZGYoKXtkZnMoMipmLGYsdyxmLCJ0b3AiKSxkZnMoMipmLDIqZitoKzEsdyxmLCJib3R0b20iKSxkc2UoKX1mdW5jdGlvbiBkZnMoJCx0LGUsbCxvKXtjb25zdCByPWUvMTIsXz1lL3I7Zm9yKGxldCBuPTA7bjxyO24rKyl7Y29uc3QgaT0kK24qXztpZighcHx8IXAuY29sb3JzKXJldHVybjtjb25zdCBhPXdpbmRvdy5jKHAuY29sb3JzKTtmb3IobGV0IGM9MDtjPDEyO2MrKyl7Y29uc3QgZD1pK3dpbmRvdy5oKC1fLzYsXy82KSxnPSJ0b3AiPT09bz90K2w6dCx5PSJ0b3AiPT09bz90OnQrbCxiPXdpbmRvdy5oKDEsNCksbT13aW5kb3cuYSguMiwuOCksUz13aW5kb3cuYyhbLTEsMV0pLHg9d2luZG93LmEoLjUsMiksaz13aW5kb3cuYSguOCwxLjIpLEE9Y29sb3IoYSksQz0uNypyZWQoQSksVT0uNypncmVlbihBKSxqPS43KmJsdWUoQSk7c3Ryb2tlKEMsVSxqKSxzdHJva2VXZWlnaHQod2luZG93LmEoLjUsMS4yKSksbm9GaWxsKCksYmVnaW5TaGFwZSgpO2ZvcihsZXQgcT0wO3E8PTE7cSs9LjEpe2xldCB2PWxlcnAoZyx5LHEqayksej1zaW4ocSpQSSptKSpiKnEqUyp4O3orPXdpbmRvdy5oKC0xLDEpLC4zPndpbmRvdy5iKCkmJih6Kz13aW5kb3cuYSgtMiwyKSksdmVydGV4KGQreix2KX1lbmRTaGFwZSgpfX19ZnVuY3Rpb24gZHNlKCl7Y29uc3QgJD13dCsxO2Z1bmN0aW9uIHQodCl7Y29uc3QgZT0ibGVmdCI9PT10PzA6dyxsPSJsZWZ0Ij09PXQ/MDpQSTtmb3IoY29uc3QgbyBvZiBzZClmb3IobGV0IHI9by55O3I8by55K28uaDtyKz0kKXtpZihyPT09by55fHxvPT09c2Rbc2QubGVuZ3RoLTFdJiZyKyQ+PW8ueStvLmgpY29udGludWU7bGV0IF89Y29sb3Ioby5wYyk7aWYoby5zYyYmIm0iPT09by53dCl7Y29uc3Qgbj1jb2xvcihvLnNjKTtfPWxlcnBDb2xvcihfLG4sLjUqbm9pc2UoLjEqcikrLjUpfWNvbnN0IGk9LjgqcmVkKF8pLGE9LjgqZ3JlZW4oXyksYz0uOCpibHVlKF8pO2ZpbGwoaSxhLGMpLG5vU3Ryb2tlKCk7bGV0IGQ9d3Qqd2luZG93LmEoMS4yLDEuOCksZz0yKmYrZSt3aW5kb3cuYSgtMiwyKSx5PTIqZityK3d0LzIrd2luZG93LmEoLTEsMSksYjtkdHNhKGcseSxkLGwrSEFMRl9QSSt3aW5kb3cuYSgtLjIsLjIpLGwtSEFMRl9QSSt3aW5kb3cuYSgtLjIsLjIpLGksYSxjLHQpfX10KCJsZWZ0IiksdCgicmlnaHQiKX1mdW5jdGlvbiBkdHNhKCQsdCxlLGwsbyxyLF8sbixpKXtjb25zdCBhPW1heCg2LGZsb29yKGUvMS4yKSksYz1lL2E7Zm9yKGxldCBkPTA7ZDxhO2QrKyl7bGV0IGc9ZS1kKmMseSxiLG07ZCUyPT0wPyh5PWNvbnN0cmFpbihyKzI1LDAsMjU1KSxiPWNvbnN0cmFpbihfKzI1LDAsMjU1KSxtPWNvbnN0cmFpbihuKzI1LDAsMjU1KSk6KHk9Y29uc3RyYWluKHItMjAsMCwyNTUpLGI9Y29uc3RyYWluKF8tMjAsMCwyNTUpLG09Y29uc3RyYWluKG4tMjAsMCwyNTUpKSxmaWxsKHksYixtLDg4KSxhcmMoJCx0LDIqZywyKmcsbCxvKX1maWxsKC42KnIsLjYqXywuNipuLDcwKSxhcmMoJCsoImxlZnQiPT09aT8xOi0xKSx0KzEsMiplLDIqZSxsLG8pO2ZvcihsZXQgUz0wO1M8NTtTKyspe2NvbnN0IHg9d2luZG93LmEobCxvKSxrPWUqd2luZG93LmEoLjIsLjcpLEE9JCtjb3MoeCkqayxDPXQrc2luKHgpKms7ZmlsbChyLF8sbiwxMjApLGVsbGlwc2UoQSxDLHdpbmRvdy5oKDEuNSwzLjUpLHdpbmRvdy5oKDEuNSwzLjUpKX19ZnVuY3Rpb24gZ3RkKCl7dGQ9W107Y29uc3QgJD10cnx8W107aWYoISR8fDA9PT0kLmxlbmd0aClyZXR1cm47Y29uc3QgdD0kLmZpbHRlcigkPT4kJiYiIiE9PSQudHJpbSgpKTtpZigwPT09dC5sZW5ndGgpcmV0dXJuO2xldCBlPXdwKzEsbD13dCsxLG89ZSp0cyxyPWwqdHMsXz03Km8sbj01KnIsaT1yLGE9MS41Kl8sYz10Lmxlbmd0aCpfKyh0Lmxlbmd0aC0xKSphLGQ9KHctYykvMixnPTA7Zm9yKGxldCB5PTA7eTwkLmxlbmd0aDt5Kyspe2NvbnN0IGI9JFt5XTtpZighYnx8IiI9PT1iLnRyaW0oKSljb250aW51ZTtjb25zdCBtPV8sUz1iLmxlbmd0aCoobitpKS1pLHg9ZCtnKihfK2EpLGs9KGgtUykvMjtmb3IobGV0IEE9MDtBPGIubGVuZ3RoO0ErKyl7Y29uc3QgQz1iLmNoYXJBdChBKSxVPWsrKGIubGVuZ3RoLTEtQSkqKG4raSksaj1nY3AoQyx4LFUsbSxuKTt0ZC5wdXNoKC4uLmopfWcrK319ZnVuY3Rpb24gZ2NwKCQsdCxlLGwsbyl7Y29uc3Qgcj1bXSxfPXdwKzEsbj13dCsxLGk9Xyp0cyxhPW4qdHMsYz1jbVskLnRvVXBwZXJDYXNlKCldfHxjbVsiICJdLGQ9Yy5sZW5ndGgsZz1jWzBdLmxlbmd0aDtmb3IobGV0IHk9MDt5PGQ7eSsrKWZvcihsZXQgYj0wO2I8ZztiKyspaWYoIjEiPT09Y1t5XVtiXSl7Y29uc3QgbT15LFM9Zy0xLWI7ci5wdXNoKHt4OnQrbSppLHk6ZStTKmEsd2lkdGg6aSxoZWlnaHQ6YX0pfXJldHVybiByfTwvc2NyaXB0PjwvYm9keT48L2h0bWw+'
  })

  // Sample 2: Traits data (from Redis) - will generate HTML client-side
  samples.push({
    tokenId: 1002,
    traits: {
      seed: BigInt(348430),
      paletteName: 'Arctic Ice',
      minifiedPalette: '{"name":"Arctic Ice","colors":["#F0F8FF","#E6E6FA","#B0C4DE","#87CEEB","#B0E0E6","#F0FFFF","#E0FFFF","#F5F5F5"]}',
      minifiedStripeData: '[{"y":0,"h":70.76905641704798,"pc":"#B0E0E6","wt":"s","wv":0.2441620133817196},{"y":70.76905641704798,"h":66.97513959370553,"pc":"#E0FFFF","wt":"t","wv":0.4486666376702487},{"y":137.7441960107535,"h":52.949525993317366,"pc":"#E6E6FA","wt":"s","wv":0.3614784942939878},{"y":190.69372200407088,"h":88.51418890990317,"pc":"#F5F5F5","wt":"s","wv":0.4601602298207581},{"y":279.20791091397405,"h":70.09695865213871,"pc":"#87CEEB","wt":"s","wv":0.18919947408139706},{"y":349.30486956611276,"h":54.90225265733898,"pc":"#B0C4DE","wt":"t","wv":0.10271521052345634},{"y":404.20712222345173,"h":53.02237452939153,"pc":"#F0FFFF","sc":"#E0FFFF","wt":"s","wv":0.3749437925405801},{"y":457.22949675284326,"h":61.070579811930656,"pc":"#F0FFFF","sc":"#E6E6FA","wt":"t","wv":0.14146835459396245},{"y":518.3000765647739,"h":50.73577044531703,"pc":"#F5F5F5","wt":"s","wv":0.24790364671498538},{"y":569.035847010091,"h":71.19754501618445,"pc":"#B0C4DE","wt":"s","wv":0.10568890692666173},{"y":640.2333920262754,"h":72.2229290753603,"pc":"#E0FFFF","wt":"t","wv":0.3288901265710592},{"y":712.4563211016357,"h":73.23578814975917,"pc":"#F5F5F5","wt":"t","wv":0.2201482846401632},{"y":785.6921092513949,"h":81.7917856760323,"pc":"#E0FFFF","wt":"s","wv":0.257676356099546},{"y":867.4838949274272,"h":83.10637858696282,"pc":"#F0F8FF","wt":"s","wv":0.11601038286462427},{"y":950.59027351439,"h":67.69649278372526,"pc":"#B0E0E6","sc":"#F0FFFF","wt":"t","wv":0.15098334243521094},{"y":1018.2867662981153,"h":84.24941586330533,"pc":"#87CEEB","sc":"#B0C4DE","wt":"s","wv":0.12075226726010442},{"y":1102.5361821614206,"h":86.20883144438267,"pc":"#E0FFFF","wt":"s","wv":0.2798375692218542},{"y":1188.7450136058033,"h":11.254986394196749,"pc":"#B0C4DE","wt":"s","wv":0.3258690937422216}]',
      textRows: ['BACKEND', 'RUGGED'],
      warpThickness: 4,
      mintTime: BigInt(Date.now()),
      filteredCharacterMap: '{"B":["11110","10001","10001","11110","10001","10001","11110"],"A":["01110","10001","10001","11111","10001","10001","10001"],"C":["01111","10000","10000","10000","10000","10000","01111"],"K":["10001","10010","10100","11000","10100","10010","10001"],"E":["11111","10000","10000","11110","10000","10000","11111"],"N":["10001","11001","10101","10011","10001","10001","10001"],"D":["11110","10001","10001","10001","10001","10001","11110"],"R":["11110","10001","10001","11110","10100","10010","10001"],"U":["10001","10001","10001","10001","10001","10001","01110"],"G":["01111","10000","10000","10011","10001","10001","01111"]," ":["00000","00000","00000","00000","00000","00000","00000"]}',
      characterCount: BigInt(12),
      stripeCount: BigInt(18),
      textLinesCount: 2,
      complexity: 3,
      dirtLevel: 0,
      agingLevel: 0,
      frameLevel: ''
    },
    owner: '0x2222222222222222222222222222222222222222',
    name: 'OnchainRug #REAL',
    description: 'Demonstrates real client-side HTML generation with actual rug data'
    // No cachedHtmlBase64 - will generate from traits using real values
  })


  return samples
}

export default function NFTDisplayDemoPage() {
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [showControls, setShowControls] = useState(true)
  const [interactive, setInteractive] = useState(true)
  const [sampleNFTs] = useState(() => generateSampleNFTs())

  const handleViewDetails = (nftData: NFTData) => {
    console.log('View details for NFT:', nftData)
    alert(`Viewing details for ${nftData.name}`)
  }

  const handleFavoriteToggle = (tokenId: number) => {
    console.log('Toggle favorite for NFT:', tokenId)
  }

  const handleRefreshData = (tokenId: number) => {
    console.log('Refresh data for NFT:', tokenId)
  }

  const handleCopyLink = (tokenId: number) => {
    console.log('Copy link for NFT:', tokenId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              NFT Display Component Demo
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Modular NFT preview component supporting two data sources:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">📦 Base64 HTML (from animation_url)</h3>
                <p className="text-sm text-blue-600">Direct display of cached HTML from blockchain/Alchemy</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">⚙️ Real Traits Data (from Redis)</h3>
                <p className="text-sm text-green-600">Client-side HTML generation using real p5.js scripts and actual rug data</p>
              </div>
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Component Controls</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value as 'small' | 'medium' | 'large')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="small">Small (200px)</option>
                  <option value="medium">Medium (320px)</option>
                  <option value="large">Large (480px)</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showControls"
                  checked={showControls}
                  onChange={(e) => setShowControls(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="showControls" className="text-sm font-medium text-gray-700">
                  Show Controls
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="interactive"
                  checked={interactive}
                  onChange={(e) => setInteractive(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="interactive" className="text-sm font-medium text-gray-700">
                  Interactive
                </label>
              </div>
            </div>
          </motion.div>

          {/* Single NFT Demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Single NFT Display</h2>

            <div className="flex justify-center">
              <NFTDisplay
                nftData={sampleNFTData}
                size={size}
                showControls={showControls}
                interactive={interactive}
                onFavoriteToggle={handleFavoriteToggle}
                onRefreshData={handleRefreshData}
                onCopyLink={handleCopyLink}
              />
            </div>
          </motion.div>

          {/* Grid Demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">NFT Grid Display</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sampleNFTs.map((nft, index) => (
                <motion.div
                  key={nft.tokenId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <NFTDisplay
                    nftData={nft}
                    size="medium"
                    showControls={showControls}
                    interactive={interactive}
                    onFavoriteToggle={handleFavoriteToggle}
                    onRefreshData={handleRefreshData}
                    onCopyLink={handleCopyLink}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Skeleton Demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Skeleton Loading States</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }, (_, i) => (
                <NFTDisplaySkeleton key={i} size="medium" />
              ))}
            </div>
          </motion.div>

          {/* Code Example */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="mt-12 bg-gray-900 rounded-xl p-6"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Usage Example</h2>

            <pre className="text-green-400 text-sm overflow-x-auto">
{`import NFTDisplay from '@/components/NFTDisplay'

<NFTDisplay
  nftData={nftData}
  size="medium"
  showControls={true}
  showTraits={true}
  interactive={true}
  onViewDetails={(nft) => console.log('View:', nft)}
  onFavoriteToggle={(tokenId) => console.log('Favorite:', tokenId)}
  onRefreshData={(tokenId) => console.log('Refresh:', tokenId)}
  onCopyLink={(tokenId) => console.log('Copy link:', tokenId)}
/>`}
            </pre>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
