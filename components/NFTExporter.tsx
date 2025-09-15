import React, { useState } from 'react';
import { initPRNG, getPRNG, createDerivedPRNG } from '@/lib/DeterministicPRNG';

interface NFTExporterProps {
  currentSeed: number;
  currentPalette: any;
  currentStripeData: any[];
  textRows: string[];
  characterMap: any;
}

const NFTExporter: React.FC<NFTExporterProps> = ({
  currentSeed,
  currentPalette,
  currentStripeData,
  textRows,
  characterMap,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  // Add default values and null checks
  const safeSeed = currentSeed || 42;
  const safePalette = currentPalette || { name: 'Default', colors: ['#000000', '#FFFFFF'] };
  const safeStripeData = currentStripeData || [];
  const safeTextRows = textRows || [];

  // Calculate basic traits for NFT metadata (rarity handled at generation time and by marketplace indexers)
  const calculateTraitsInGenerator = (palette: any, stripeData: any[], textRows: string[]) => {
    const textLines = textRows.filter(row => row && row.trim() !== '').length;
    const totalCharacters = textRows.reduce((sum, row) => sum + row.length, 0);
    const stripeCount = stripeData.length;
    const paletteName = palette ? palette.name : "Unknown";
    const currentWarpThickness = (window as any).warpThickness || 2;

    // Calculate stripe complexity
    let complexityScore = 0;
    let solidCount = 0;
    for (const stripe of stripeData) {
      if (stripe.weaveType === 'mixed') complexityScore += 2;
      else if (stripe.weaveType === 'textured') complexityScore += 1.5;
      else solidCount++;
      if (stripe.secondaryColor) complexityScore += 1;
    }
    const solidRatio = solidCount / stripeData.length;
    const normalizedComplexity = complexityScore / (stripeData.length * 3);
    let stripeComplexity = "Basic";
    if (solidRatio > 0.9) stripeComplexity = "Basic";
    else if (solidRatio > 0.75 && normalizedComplexity < 0.15) stripeComplexity = "Simple";
    else if (solidRatio > 0.6 && normalizedComplexity < 0.3) stripeComplexity = "Moderate";
    else if (normalizedComplexity < 0.5) stripeComplexity = "Complex";
    else stripeComplexity = "Very Complex";

    // Return basic trait values for metadata (no rarity calculation)
    return {
      textLines: textLines,
      totalCharacters: totalCharacters,
      paletteName: paletteName,
      stripeCount: stripeCount,
      stripeComplexity: stripeComplexity,
      warpThickness: currentWarpThickness
    };
  };

  const exportNFT = async () => {
    setIsExporting(true);

    try {
      // Use the passed props instead of global variables
      const currentPalette = safePalette;
      const currentStripeData = safeStripeData;
      
      // Get the full character map from global doormatData (since it's now stored globally in contract)
      const fullCharacterMap = (typeof window !== 'undefined' && (window as any).doormatData?.characterMap) || {};
      
      // Create the NFT HTML content with current live data (no traits display)
        const nftHTML = createNFTHTML(safeSeed, currentPalette, currentStripeData, safeTextRows, fullCharacterMap);
      
      // Debug logging removed for production
      
      // Create and download the file
      const blob = new Blob([nftHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `doormat-nft-${safeSeed}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting NFT:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const createNFTHTML = (seed: number, palette: any, stripeData: any[], textRows: string[], characterMap: any) => {
    // 🔥 ULTRA-OPTIMIZATION: Extract only used characters from textRows
    const usedChars = new Set<string>();
    textRows.forEach(row => {
      if (row && row.trim()) {
        row.toUpperCase().split('').forEach(char => {
          usedChars.add(char);
        });
      }
    });

    // Debug: Log extracted characters
    console.log('Text rows:', textRows);
    console.log('Extracted characters:', Array.from(usedChars));
    console.log('Character map keys:', Object.keys(characterMap));

    // Create minimal character map with only used characters
    const optimizedCharacterMap: any = {};
    usedChars.forEach(char => {
      if (characterMap[char]) {
        optimizedCharacterMap[char] = characterMap[char];
      }
    });
    // Always include space as fallback
    if (characterMap[' ']) {
      optimizedCharacterMap[' '] = characterMap[' '];
    }

    const optimizedCharacterMapFinal = optimizedCharacterMap;

    // Debug: Log final optimized character map
    console.log('Optimized character map keys:', Object.keys(optimizedCharacterMapFinal));
    console.log('Optimized character map size:', JSON.stringify(optimizedCharacterMapFinal).length);
    console.log('Full character map size:', JSON.stringify(characterMap).length);
    console.log('Space saved:', JSON.stringify(characterMap).length - JSON.stringify(optimizedCharacterMapFinal).length, 'characters');

    // Get the actual current warpThickness from the live generator
    const currentWarpThickness = (window as any).warpThickness || 2;

    // 🔥 ULTRA-OPTIMIZATION: Truncate decimals and shorten property names
    const truncateTo3Decimals = (value) => {
      return Math.round(value * 1000) / 1000;
    };

    const shortenWeaveType = (weaveType) => {
      const mapping = { 'solid': 's', 'mixed': 'm', 'textured': 't' };
      return mapping[weaveType] || weaveType; // Fallback for safety
    };

    const shortenedStripeData = stripeData.map(stripe => ({
      y: truncateTo3Decimals(stripe.y),               // Truncate y values for consistency (potential chars saved)
      h: truncateTo3Decimals(stripe.height),           // 17 digits → 3 digits (14 chars saved)
      pc: stripe.primaryColor,            // primaryColor → pc (10 chars saved)
      sc: stripe.secondaryColor,          // secondaryColor → sc (12 chars saved)
      wt: shortenWeaveType(stripe.weaveType),         // "solid" → "s", "mixed" → "m", "textured" → "t" (4-7 chars saved)
      wv: truncateTo3Decimals(stripe.warpVariation)    // 16 digits → 3 digits (13 chars saved)
    }));

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Onchain Rug #${seed}</title><script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script><style>body{display:flex;justify-content:center;align-items:center}#defaultCanvas0{width:100%!important;height:auto!important;}</style></head><body><div id="rug"></div><script>let w=800,h=1200,f=30,wt=8,wp=${currentWarpThickness},ts=2,lt,dt,p=${JSON.stringify(palette)},sd=${JSON.stringify(shortenedStripeData)},tr=${JSON.stringify(textRows)},td=[],dl=0,tl=0,s=${seed};
    window.characterMap=${JSON.stringify(optimizedCharacterMapFinal)};let cm=window.characterMap;
function setup(){noiseSeed(${seed});window.d=function(seed){window.prngSeed=seed%2147483647;if(window.prngSeed<=0)window.prngSeed+=2147483646};window.b=function(){window.prngSeed=(window.prngSeed*16807)%2147483647;return(window.prngSeed-1)/2147483646};window.a=function(min,max){return min+window.b()*(max-min)};window.c=function(array){return array[Math.floor(window.b()*array.length)]};window.d(${seed});let canvas=createCanvas(h+(f*4),w+(f*4));canvas.parent('rug');pixelDensity(2.5);u();gtd();noLoop()}
function u(){if(!p||!p.colors)return;let d=p.colors[0],l=p.colors[0],dv=999,lv=-1;for(let hex of p.colors){let c=color(hex),b=(red(c)+green(c)+blue(c))/3;if(b<dv){dv=b;d=hex}if(b>lv){lv=b;l=hex}}dt=lerpColor(color(d),color(0),0.4);lt=lerpColor(color(l),color(255),0.3)}
function draw(){background(222,222,222);push();translate(width/2,height/2);rotate(PI/2);translate(-height/2,-width/2);push();translate(f*2,f*2);for(let stripe of sd)ds(stripe);if(tl>0)dtol(Math.floor(tl));pop();df();if(dl>0)ddo(Math.floor(dl));pop()} 
function ds(s){let ws=wp+1,we=wt+1;for(let x=0;x<w;x+=ws){for(let y=s.y;y<s.y+s.h;y+=we){let wc=color(s.pc),itp=false;if(td.length>0){for(let tp of td){if(x>=tp.x&&x<tp.x+tp.width&&y>=tp.y&&y<tp.y+tp.height){itp=true;break}}}let r=red(wc)+window.a(-15,15),g=green(wc)+window.a(-15,15),b=blue(wc)+window.a(-15,15);if(itp){const bb=(r+g+b)/3;let tc=bb<128?lt:dt;r=red(tc);g=green(tc);b=blue(tc)}r=constrain(r,0,255);g=constrain(g,0,255);b=constrain(b,0,255);fill(r,g,b);noStroke();let wcv=sin(y*0.05)*0.5;rect(x+wcv,y,wp,we)}}for(let y=s.y;y<s.y+s.h;y+=we){for(let x=0;x<w;x+=ws){let wc=color(s.pc),itp=false;if(td.length>0){for(let tp of td){if(x>=tp.x&&x<tp.x+tp.width&&y>=tp.y&&y<tp.y+tp.height){itp=true;break}}}if(s.wt==='m'&&s.sc){if(noise(x*0.1,y*0.1)>0.5)wc=color(s.sc)}else if(s.wt==='t'){let nv=noise(x*0.05,y*0.05);wc=lerpColor(color(s.pc),color(255),nv*0.15)}let r=red(wc)+window.a(-20,20),g=green(wc)+window.a(-20,20),b=blue(wc)+window.a(-20,20);if(itp){const bb=(r+g+b)/3;let tc=bb<128?lt:dt;r=red(tc);g=green(tc);b=blue(tc)}r=constrain(r,0,255);g=constrain(g,0,255);b=constrain(b,0,255);fill(r,g,b);noStroke();let wcv=cos(x*0.05)*0.5;rect(x,y+wcv,ws,wt)}}for(let y=s.y;y<s.y+s.h;y+=we*2){for(let x=0;x<w;x+=ws*2){fill(0,0,0,40);noStroke();rect(x+1,y+1,ws-2,we-2)}}for(let y=s.y+we;y<s.y+s.h;y+=we*2){for(let x=ws;x<w;x+=ws*2){fill(255,255,255,30);noStroke();rect(x,y,ws-1,we-1)}}}
function dto(){push();blendMode(MULTIPLY);for(let x=0;x<w;x+=2){for(let y=0;y<h;y+=2){let nv=noise(x*0.02,y*0.02),a=map(nv,0,1,0,50);fill(0,0,0,a);noStroke();rect(x,y,2,2)}}for(let x=0;x<w;x+=6){for(let y=0;y<h;y+=6){let nv=noise(x*0.03,y*0.03);if(nv>0.6){fill(255,255,255,25);noStroke();rect(x,y,6,6)}else if(nv<0.4){fill(0,0,0,20);noStroke();rect(x,y,6,6)}}}pop()}
function dtol(tl){const hi=tl===1?30:tl===2?80:120,ri=tl===1?20:tl===2?40:60,rt=tl===1?0.6:tl===2?0.5:0.4;push();blendMode(MULTIPLY);for(let x=0;x<w;x+=2){for(let y=0;y<h;y+=2){let nv=noise(x*0.02,y*0.02),i=map(nv,0,1,0,hi);fill(0,0,0,i);noStroke();rect(x,y,2,2)}}for(let x=0;x<w;x+=6){for(let y=0;y<h;y+=6){let rn=noise(x*0.03,y*0.03);if(rn>rt){fill(255,255,255,ri);noStroke();rect(x,y,6,6)}else if(rn<(1-rt)){fill(0,0,0,ri*0.8);noStroke();rect(x,y,6,6)}}}if(tl>=2){for(let x=0;x<w;x+=8){for(let y=0;y<h;y+=8){let wn=noise(x*0.01,y*0.01);if(wn>0.7){fill(0,0,0,15);noStroke();rect(x,y,8,2)}}}}if(tl>=3){for(let x=0;x<w;x+=4){for(let y=0;y<h;y+=4){let wn=noise(x*0.005,y*0.005);if(wn>0.8){fill(0,0,0,25);noStroke();rect(x,y,4,1)}}}}pop()}
function ddo(dl){const di=dl===1?0.5:1.0,doo=dl===1?30:60;push();translate(f*2,f*2);for(let x=0;x<w;x+=3){for(let y=0;y<h;y+=3){const dn=window.a(0,1),dt=0.85*di;if(dn>dt){const ds=window.a(1,4),da=window.a(doo*0.5,doo),dr=window.a(60,90),dg=window.a(40,60),db=window.a(20,40);fill(dr,dg,db,da);noStroke();ellipse(x,y,ds,ds)}}}for(let i=0;i<15*di;i++){const sx=window.a(0,w),sy=window.a(0,h),ss=window.a(8,20),sa=window.a(doo*0.3,doo*0.7),sr=window.a(40,70),sg=window.a(25,45),sb=window.a(15,30);fill(sr,sg,sb,sa);noStroke();ellipse(sx,sy,ss,ss)}for(let x=0;x<w;x+=2){for(let y=0;y<h;y+=2){const ed=Math.min(x,y,w-x,h-y);if(ed<10){const edirt=window.a(0,1);if(edirt>0.7*di){const ea=window.a(10,25);fill(80,50,20,ea);noStroke();rect(x,y,2,2)}}}}pop()}
function df(){dfs(f*2,f,w,f,'top');dfs(f*2,f*2+h,w,f,'bottom');dse()}
function dfs(x,y,w,h,side){let fs=w/12,sw=w/fs;for(let i=0;i<fs;i++){let sx=x+i*sw;if(!p||!p.colors)return;let sc=window.c(p.colors);for(let j=0;j<12;j++){let tx=sx+window.a(-sw/6,sw/6),sy=side==='top'?y+h:y,ey=side==='top'?y:y+h,wa=window.a(1,4),wf=window.a(0.2,0.8),d=window.c([-1,1]),ci=window.a(0.5,2.0),tl=window.a(0.8,1.2),fc=color(sc),r=red(fc)*0.7,g=green(fc)*0.7,b=blue(fc)*0.7;stroke(r,g,b);strokeWeight(window.a(0.5,1.2));noFill();beginShape();for(let t=0;t<=1;t+=0.1){let yp=lerp(sy,ey,t*tl),xo=sin(t*PI*wf)*wa*t*d*ci;xo+=window.a(-1,1);if(window.b()<0.3)xo+=window.a(-2,2);vertex(tx+xo,yp)}endShape()}}}
function dse(){let ws=wt+1;function rs(side){const xo=side==='left'?0:w,ao=side==='left'?0:PI;for(let s of sd){for(let y=s.y;y<s.y+s.h;y+=ws){if(y===s.y)continue;if(s===sd[sd.length-1]&&y+ws>=s.y+s.h)continue;let sc=color(s.pc);if(s.sc&&s.wt==='m'){let sc2=color(s.sc),bf=noise(y*0.1)*0.5+0.5;sc=lerpColor(sc,sc2,bf)}let r=red(sc)*0.8,g=green(sc)*0.8,b=blue(sc)*0.8;fill(r,g,b);noStroke();let rad=wt*window.a(1.2,1.8),cx=f*2+xo+window.a(-2,2),cy=f*2+y+wt/2+window.a(-1,1),sa=ao+HALF_PI+window.a(-0.2,0.2),ea=ao-HALF_PI+window.a(-0.2,0.2);dtsa(cx,cy,rad,sa,ea,r,g,b,side)}}}rs('left');rs('right')}
function dtsa(cx,cy,rad,sa,ea,r,g,b,s){let tc=max(6,floor(rad/1.2)),ts=rad/tc;for(let i=0;i<tc;i++){let tr=rad-(i*ts),trr,trg,tb;if(i%2===0){trr=constrain(r+25,0,255);trg=constrain(g+25,0,255);tb=constrain(b+25,0,255)}else{trr=constrain(r-20,0,255);trg=constrain(g-20,0,255);tb=constrain(b-20,0,255)}fill(trr,trg,tb,88);arc(cx,cy,tr*2,tr*2,sa,ea)}fill(r*0.6,g*0.6,b*0.6,70);let so=s==='left'?1:-1;arc(cx+so,cy+1,rad*2,rad*2,sa,ea);for(let i=0;i<5;i++){let da=window.a(sa,ea),dr=rad*window.a(0.2,0.7),dx=cx+cos(da)*dr,dy=cy+sin(da)*dr;fill(r,g,b,120);ellipse(dx,dy,window.a(1.5,3.5),window.a(1.5,3.5))}}
function gtd(){td=[];const trr=tr||[];if(!trr||trr.length===0)return;const netr=trr.filter(row=>row&&row.trim()!=='');if(netr.length===0)return;const ws=wp+1,we=wt+1,sw=ws*ts,se=we*ts,cw=7*sw,ch=5*se,s=se,rs=cw*1.5,trw=netr.length*cw+(netr.length-1)*rs,bsx=(w-trw)/2;let cri=0;for(let ri=0;ri<trr.length;ri++){const rt=trr[ri];if(!rt||rt.trim()==='')continue;const tw=cw,th=rt.length*(ch+s)-s,sx=bsx+cri*(cw+rs),sy=(h-th)/2;for(let i=0;i<rt.length;i++){const c=rt.charAt(i),cy=sy+(rt.length-1-i)*(ch+s),cp=gcp(c,sx,cy,tw,ch);td.push(...cp)}cri++}}
function gcp(c,x,y,w,h){const p=[];const ws=wp+1,we=wt+1,sw=ws*ts,se=we*ts,cd=cm[c.toUpperCase()]||cm[' '],nr=cd.length,nc=cd[0].length;for(let r=0;r<nr;r++){for(let col=0;col<nc;col++){if(cd[r][col]==='1'){const ncol=r,nrow=nc-1-col;p.push({x:x+ncol*sw,y:y+nrow*se,width:sw,height:se})}}}return p}
    </script>
</body>
</html>`;

  // ===== FULL SOPHISTICATED ALGORITHM FROM FRONTEND =====
  // This now includes all the advanced features like:
  // - Rarity-based palette selection
  // - Complex stripe generation with density patterns
  // - Advanced dirt and texture overlays
  // - Sophisticated text embedding
  // - Character map generation
  };

  return (
    <div className="bg-gray-700 p-4 rounded-lg">
      <h3 className="text-green-400 font-mono text-lg mb-3">NFT Exporter</h3>
      <div className="space-y-3">
        <div className="text-gray-300 text-sm">
          <p><strong>Seed:</strong> {safeSeed}</p>
          <p><strong>Palette:</strong> {safePalette?.name || 'Custom'}</p>
          <p><strong>Text:</strong> {safeTextRows.join(', ') || 'None'}</p>
      </div>
        <button
          onClick={exportNFT}
          disabled={isExporting}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-mono py-2 px-4 rounded transition-colors"
        >
          {isExporting ? 'Exporting...' : 'Export NFT'}
        </button>
      </div>
    </div>
  );
};

export default NFTExporter;
