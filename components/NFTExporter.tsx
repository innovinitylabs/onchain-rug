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
  // Load the exact same content as tokenURI uses
  const rugP5Content = `let _p5={ctx:null,canvas:null,width:0,height:0,fillStyle:null,strokeStyle:"#000",doFill:!0,doStroke:!0,blend:"source-over",stack:[],pixelDensity:1};function createCanvas(e,t){let l=document.createElement("canvas");_p5.width=e,_p5.height=t,document.querySelector("#defaultCanvas0")|| (l.id="defaultCanvas0");let r=_p5.pixelDensity||1;return l.width=Math.floor(e*r),l.height=Math.floor(t*r),l.style.width=e+"px",l.style.height=t+"px",_p5.canvas=l,_p5.ctx=l.getContext("2d"),_p5.ctx.setTransform(1,0,0,1,0,0),_p5.ctx.scale(r,r),Object.defineProperty(window,"width",{get:()=>_p5.width}),Object.defineProperty(window,"height",{get:()=>_p5.height}),document.body.appendChild(l),{elt:l,parent:function(e){let t="string"==typeof e?document.getElementById(e):e;t&&t.appendChild(l)}}}let _noLoop=!1;function noLoop(){_noLoop=!0,window.noLoopCalled=!0}function pixelDensity(e){_p5.pixelDensity=e,_p5.canvas&&(_p5.canvas.width=Math.floor(_p5.width*e),_p5.canvas.height=Math.floor(_p5.height*e),_p5.canvas.style.width=_p5.width+"px",_p5.canvas.style.height=_p5.height+"px",_p5.ctx.setTransform(1,0,0,1,0,0),_p5.ctx.scale(e,e))}function background(e,t,l,r){if(_p5.ctx){if(_p5.ctx.save(),"string"==typeof e){_p5.ctx.globalAlpha=1,_p5.ctx.fillStyle=e,_p5.ctx.fillRect(0,0,_p5.width,_p5.height),_p5.ctx.restore();return}void 0===r&&(r=255),_p5.ctx.globalAlpha=r/255,_p5.ctx.fillStyle=\`rgb(\${e},\${t},\${l})\`,_p5.ctx.fillRect(0,0,_p5.width,_p5.height),_p5.ctx.restore()}}function _hexToLevels(e){if(3===(e=String(e).replace("#","").trim()).length&&(e=e.split("").map(e=>e+e).join("")),6!==e.length)return null;let t=parseInt(e.slice(0,2),16),l=parseInt(e.slice(2,4),16),r=parseInt(e.slice(4,6),16);return[t,l,r,255]}function color(e,t,l,r){if("object"==typeof e&&null!==e&&"levels"in e)return e;if("string"==typeof e){let o=_hexToLevels(e);if(o){let[n,p,i,c]=o;return{levels:[n,p,i,c],toString:()=>c<255?\`rgba(\${n},\${p},\${i},\${c/255})\`:\`rgb(\${n},\${p},\${i})\`}}let a=e.match(/rgba?\\(([^)]+)\\)/);if(a){let s=a[1].split(",").map(e=>e.trim()),f=Number(s[0])||0,d=Number(s[1])||0,u=Number(s[2])||0,h=s[3]?Math.round(255*Number(s[3])):255;return{levels:[f,d,u,h],toString:()=>h<255?\`rgba(\${f},\${d},\${u},\${h/255})\`:\`rgb(\${f},\${d},\${u})\`}}return{levels:[0,0,0,255],toString:()=>e}}return void 0===t&&(t=e,l=e),void 0===r&&(r=255),{levels:[e,t,l,r],toString:()=>r<255?\`rgba(\${e},\${t},\${l},\${r/255})\`:\`rgb(\${e},\${t},\${l})\`}}function fill(e,t,l,r){if(_p5.doFill=!0,"object"==typeof e&&e.levels){_p5.fillStyle=e.toString();return}if("string"==typeof e&&void 0===t){_p5.fillStyle=color(e).toString();return}void 0===r&&(r=255),_p5.fillStyle=r<255?\`rgba(\${e},\${t},\${l},\${r/255})\`:\`rgb(\${e},\${t},\${l})\`}function noFill(){_p5.doFill=!1}function stroke(e,t,l,r){if(_p5.doStroke=!0,"object"==typeof e&&e.levels){_p5.strokeStyle=e.toString();return}if("string"==typeof e&&void 0===t){_p5.strokeStyle=color(e).toString();return}void 0===r&&(r=255),_p5.strokeStyle=r<255?\`rgba(\${e},\${t},\${l},\${r/255})\`:\`rgb(\${e},\${t},\${l})\`}function noStroke(){_p5.doStroke=!1}function strokeWeight(e){_p5.ctx&&(_p5.ctx.lineWidth=e)}function blendMode(e){_p5.blend=e,_p5.ctx&&(_p5.ctx.globalCompositeOperation=e||"source-over")}function rect(e,t,l,r){_p5.ctx&&(_p5.ctx.save(),_p5.ctx.globalCompositeOperation=_p5.blend,_p5.doFill&&_p5.fillStyle&&(_p5.ctx.fillStyle=_p5.fillStyle,_p5.ctx.fillRect(e,t,l,r)),_p5.doStroke&&_p5.strokeStyle&&(_p5.ctx.strokeStyle=_p5.strokeStyle,_p5.ctx.strokeRect(e,t,l,r)),_p5.ctx.restore())}function ellipse(e,t,l,r){_p5.ctx&&(_p5.ctx.save(),_p5.ctx.globalCompositeOperation=_p5.blend,_p5.ctx.beginPath(),_p5.ctx.ellipse(e,t,l/2,r/2,0,0,2*Math.PI),_p5.doFill&&_p5.fillStyle&&(_p5.ctx.fillStyle=_p5.fillStyle,_p5.ctx.fill()),_p5.doStroke&&_p5.strokeStyle&&(_p5.ctx.strokeStyle=_p5.strokeStyle,_p5.ctx.stroke()),_p5.ctx.restore())}function arc(e,t,l,r,o,n){_p5.ctx&&(_p5.ctx.save(),_p5.ctx.globalCompositeOperation=_p5.blend,_p5.ctx.beginPath(),_p5.ctx.ellipse(e,t,l/2,r/2,0,o,n),_p5.doFill&&_p5.fillStyle&&(_p5.ctx.fillStyle=_p5.fillStyle,_p5.ctx.fill()),_p5.doStroke&&_p5.strokeStyle&&(_p5.ctx.strokeStyle=_p5.strokeStyle,_p5.ctx.stroke()),_p5.ctx.restore())}let _shp=null;function beginShape(){_shp=[]}function vertex(e,t){_shp&&_shp.push([e,t])}function endShape(e=!1){if(!_p5.ctx||!_shp||_shp.length<2){_shp=null;return}_p5.ctx.save(),_p5.ctx.globalCompositeOperation=_p5.blend,_p5.ctx.beginPath(),_p5.ctx.moveTo(_shp[0][0],_shp[0][1]);for(let t=1;t<_shp.length;++t)_p5.ctx.lineTo(_shp[t][0],_shp[t][1]);e&&_p5.ctx.closePath(),_p5.doFill&&_p5.fillStyle&&(_p5.ctx.fillStyle=_p5.fillStyle,_p5.ctx.fill()),_p5.doStroke&&_p5.strokeStyle&&(_p5.ctx.strokeStyle=_p5.strokeStyle,_p5.ctx.stroke()),_p5.ctx.restore(),_shp=null}function push(){_p5.ctx&&(_p5.ctx.save(),_p5.stack.push({fillStyle:_p5.fillStyle,strokeStyle:_p5.strokeStyle,doFill:_p5.doFill,doStroke:_p5.doStroke,blend:_p5.blend,lineWidth:_p5.ctx.lineWidth}))}function pop(){if(!_p5.ctx)return;_p5.ctx.restore();let e=_p5.stack.pop();e&&(_p5.fillStyle=e.fillStyle,_p5.strokeStyle=e.strokeStyle,_p5.doFill=e.doFill,_p5.doStroke=e.doStroke,_p5.blend=e.blend,_p5.ctx&&(_p5.ctx.globalCompositeOperation=_p5.blend),_p5.ctx&&e.lineWidth&&(_p5.ctx.lineWidth=e.lineWidth))}function translate(e,t){_p5.ctx&&_p5.ctx.translate(e,t)}function rotate(e){_p5.ctx&&_p5.ctx.rotate(e)}function red(e){return e&&e.levels?e.levels[0]:0}function green(e){return e&&e.levels?e.levels[1]:0}function blue(e){return e&&e.levels?e.levels[2]:0}function lerp(e,t,l){return e+(t-e)*l}function lerpColor(e,t,l){let r=e&&e.levels?e.levels:[0,0,0,255],o=t&&t.levels?t.levels:[0,0,0,255];return color(lerp(r[0],o[0],l),lerp(r[1],o[1],l),lerp(r[2],o[2],l),Math.round(lerp(r[3],o[3],l)))}function map(e,t,l,r,o){return(e-t)/(l-t)*(o-r)+r}function constrain(e,t,l){return Math.max(t,Math.min(l,e))}const PI=Math.PI,HALF_PI=Math.PI/2;function sin(e){return Math.sin(e)}function cos(e){return Math.cos(e)}function max(...e){return Math.max(...e)}function floor(e){return Math.floor(e)}let _n=null,_ns=4095,_no=4,_nf=.5;function noiseSeed(e){_n=[];let t=e>>>0,l=()=>(t=(1664525*t+1013904223)%4294967296)/4294967296;for(let r=0;r<_ns+1;r++)_n[r]=l()}function noise(e,t=0,l=0){if(null===_n){_n=[];for(let r=0;r<_ns+1;r++)_n[r]=Math.random()}e<0&&(e=-e),t<0&&(t=-t),l<0&&(l=-l);let o=Math.floor(e),n=Math.floor(t),p=Math.floor(l),i=e-o,c=t-n,a=l-p,s=0,f=.5,d,u,h;for(let x=0;x<_no;x++){let S=(o&_ns)+(n&_ns)*157+(p&_ns)*113,$=fade(i),y=fade(c);d=lerp(lerp(_n[S&_ns],_n[S+1&_ns],$),lerp(_n[S+157&_ns],_n[S+158&_ns],$),y),u=lerp(lerp(_n[S+113&_ns],_n[S+114&_ns],$),lerp(_n[S+113+157&_ns],_n[S+113+158&_ns],$),y),s+=(h=lerp(d,u,fade(a)))*f,f*=_nf,o<<=1,n<<=1,c*=2,p<<=1,a*=2,(i*=2)>=1&&(o++,i--),c>=1&&(n++,c--),a>=1&&(p++,a--)}return s}function fade(e){return e*e*e*(e*(6*e-15)+10)}let _r=Math.random;function randomSeed(e){let t=e>>>0;_r=function(){return(t=(1664525*t+1013904223)%4294967296)/4294967296}}function random(e,t){return Array.isArray(e)?e[Math.floor(_r()*e.length)]:void 0===t?void 0===e?_r():_r()*e:e+_r()*(t-e)}window.createCanvas=createCanvas,window.noLoop=noLoop,window.pixelDensity=pixelDensity,window.background=background,window.fill=fill,window.noFill=noFill,window.stroke=stroke,window.noStroke=noStroke,window.strokeWeight=strokeWeight,window.blendMode=blendMode,window.rect=rect,window.ellipse=ellipse,window.arc=arc,window.beginShape=beginShape,window.vertex=vertex,window.endShape=endShape,window.push=push,window.pop=pop,window.translate=translate,window.rotate=rotate,window.color=color,window.lerp=lerp,window.lerpColor=lerpColor,window.map=map,window.constrain=constrain,window.noise=noise,window.noiseSeed=noiseSeed,window.PI=PI,window.HALF_PI=HALF_PI,window.sin=sin,window.cos=cos,window.max=max,window.floor=floor,window.red=red,window.green=green,window.blue=blue,window.random=random,window.randomSeed=randomSeed,window.MULTIPLY="multiply",window.SCREEN="screen",window.OVERLAY="overlay",window.DARKEST="darken",window.LIGHTEST="lighten",window.addEventListener("load",()=>{if("function"==typeof window.setup)try{window.setup()}catch(e){console.error("setup() error",e)}if("function"==typeof window.draw){if(_noLoop)try{window.draw()}catch(t){console.error("draw() error",t)}else{let l=()=>{try{window.draw()}catch(e){console.error("draw() error",e)}requestAnimationFrame(l)};l()}}});`;

  const rugAlgoContent = `function setup(){noiseSeed(s),window.d=function($){window.prngSeed=$%2147483647,window.prngSeed<=0&&(window.prngSeed+=2147483646)},window.b=function(){return window.prngSeed=16807*window.prngSeed%2147483647,(window.prngSeed-1)/2147483646},window.a=function($,t){return $+window.b()*(t-$)},window.c=function($){return $[Math.floor(window.b()*$.length)]},window.d(s);const R=h+4*f,F=w+4*f;createCanvas(R+2*55,F+2*55).parent("rug");window.rW=R,window.rH=F,pixelDensity(2.5),u(),gtd(),noLoop()}function u(){if(!p||!p.colors)return;let $=p.colors[0],t=p.colors[0],e=999,l=-1;for(const o of p.colors){const r=color(o),_=(red(r)+green(r)+blue(r))/3;_<e&&(e=_,$=o),_>l&&(l=_,t=o)}dt=lerpColor(color($),color(0),.4),lt=lerpColor(color(t),color(255),.3),window.x=function(r,g,b){r/=255,g/=255,b/=255,r=r>.04045?Math.pow((r+.055)/1.055,2.4):r/12.92,g=g>.04045?Math.pow((g+.055)/1.055,2.4):g/12.92,b=b>.04045?Math.pow((b+.055)/1.055,2.4):b/12.92;return{x:r*.4124+g*.3576+b*.1805,y:r*.2126+g*.7152+b*.0722,z:r*.0193+g*.1192+b*.9505}},window.y=function(x,y,z){x/=0.95047,y/=1,z/=1.08883;const f=t=>t>Math.pow(6/29,3)?Math.pow(t,1/3):(1/3)*Math.pow(29/6,2)*t+4/29;return{L:116*f(y)-16,a:500*(f(x)-f(y)),b:200*(f(y)-f(z))}},window.z=function(c){const{x,y,z}=window.x(red(c),green(c),blue(c));return window.y(x,y,z)},window.e=function(l1,l2){const{L:L1,a:a1,b:b1}=l1,{L:L2,a:a2,b:b2}=l2,dL=L2-L1,LB=(L1+L2)/2,C1=Math.sqrt(a1*a1+b1*b1),C2=Math.sqrt(a2*a2+b2*b2),CB=(C1+C2)/2,a1p=a1*(1+.5*(Math.sqrt(Math.pow(CB,7)/(Math.pow(CB,7)+Math.pow(25,7))))),a2p=a2*(1+.5*(Math.sqrt(Math.pow(CB,7)/(Math.pow(CB,7)+Math.pow(25,7))))),C1p=Math.sqrt(a1p*a1p+b1*b1),C2p=Math.sqrt(a2p*a2p+b2*b2),CBp=(C1p+C2p)/2,dC=C2p-C1p,h1p=Math.atan2(b1,a1p)*180/Math.PI,h2p=Math.atan2(b2,a2p)*180/Math.PI,dh=Math.abs(h1p-h2p)<=180?h2p-h1p:h2p-h1p>180?h2p-h1p-360:h2p-h1p+360,dH=2*Math.sqrt(C1p*C2p)*Math.sin(dh*Math.PI/360),HB=Math.abs(h1p-h2p)<=180?(h1p+h2p)/2:h1p+h2p>=360?(h1p+h2p)/2:(h1p+h2p+360)/2,T=1-.17*Math.cos(HB*Math.PI/180-30)+.24*Math.cos(2*HB*Math.PI/180)+.32*Math.cos(3*HB*Math.PI/180+6)-.2*Math.cos(4*HB*Math.PI/180-63),SL=1+(.015*Math.pow(LB-50,2))/Math.sqrt(20+Math.pow(LB-50,2)),SC=1+.045*CBp,SH=1+.015*CBp*T,RT=-Math.sin(2*(HB*Math.PI/180-55)*Math.PI/180)*(2*Math.sqrt(Math.pow(CBp,7)/(Math.pow(CBp,7)+Math.pow(25,7)))),tL=dL/SL,tC=dC/SC,tH=dH/SH;return Math.sqrt(tL*tL+tC*tC+tH*tH+RT*tC*tH)},window.p=function(a,b){const lab1=window.z(a),lab2=window.z(b);return window.e(lab1,lab2)},window.g=function($,A,C,U){const s=[],r=2;for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++){if(dx===0&&dy===0)continue;const X=A+dx,Y=C+dy;if(Y<$.y||Y>=$.y+$.h||X<0||X>=w)continue;let W=color($.pc);noise(X*.1,Y*.1)>.5&&(W=color($.sc));s.push(W)}s.length===0&&s.push(color($.pc));const L=c=>{const v=t=>{const h=t/255;return h<=.03928?h/12.92:Math.pow((h+.055)/1.055,2.4)},RR=v(red(c)),G=v(green(c)),B=v(blue(c));return.2126*RR+.7152*G+.0722*B},CR=(a,b)=>{const A=L(a),B=L(b),l=Math.max(A,B),d=Math.min(A,B);return(l+.05)/(d+.05)},P=color($.pc),S=color($.sc),T=20,D=c=>window.p(c,P)>T&&window.p(c,S)>T,k=[],K=new Set,M=c=>{const m=Math.round(red(c))+'-'+Math.round(green(c))+'-'+Math.round(blue(c));!K.has(m)&&(K.add(m),k.push(c))},q=[];p.colors&&p.colors.forEach(c=>q.push(color(c)));const u=new Set,O=Math.round(red(P))+'-'+Math.round(green(P))+'-'+Math.round(blue(P)),Q=Math.round(red(S))+'-'+Math.round(green(S))+'-'+Math.round(blue(S));u.add(O),u.add(Q);const I=[];q.forEach(c=>{const m=Math.round(red(c))+'-'+Math.round(green(c))+'-'+Math.round(blue(c));!u.has(m)&&I.push(c)});I.forEach(c=>{const l=(red(c)+green(c)+blue(c))/(3*255),d=l>.7?.15:l>.4?.2:.25,V=lerpColor(c,color(0,0,0),d);M(V)});k.length===0&&q.forEach(c=>{const l=(red(c)+green(c)+blue(c))/(3*255),d=l>.7?.15:l>.4?.2:.25,V=lerpColor(c,color(0,0,0),d);M(V)});const E=o=>{let B=o[0],F=-1;o.forEach(c=>{let m=Infinity,N=Infinity;s.forEach(W=>{const RR=CR(c,W);RR<m&&(m=RR);const p=window.p(c,W);p<N&&(N=p)});const w=.7,W=.3,Z=Math.min(N/50,1),J=Math.min(m/7,1),H=w*Z+W*J;H>F&&(F=H,B=c)});return{B:B,F:F}};let{B:B,F:F}=E(k);const G=.6;if(F<G&&q.length>0){const H=[];q.forEach(c=>{const l=(red(c)+green(c)+blue(c))/(3*255),d=l>.7?.15:l>.4?.2:.25,V=lerpColor(c,color(0,0,0),d);H.push(V);const i=l<.3?.2:l<.6?.15:.1,J=lerpColor(c,color(255,255,255),i);H.push(J);const R=red(c)/255,G=green(c)/255,B=blue(c)/255,C=(R+G+B)/3,E=C>.5?Math.max(0,R-.4):Math.min(1,R+.4),F=C>.5?Math.max(0,G-.4):Math.min(1,G+.4),K=C>.5?Math.max(0,B-.4):Math.min(1,B+.4);H.push(color(E*255,F*255,K*255))});B=E(H).B}return B}}function draw(){noStroke();fill(222,222,222);rect(0,0,width,height);push();translate(width/2,height/2);rotate(PI/2);translate(-rH/2,-rW/2);push();translate(2*f,2*f);for(const $ of sd)ds($);tl>0&&dtol(Math.floor(tl));pop();df();dl>0&&ddo(Math.floor(dl));dRF(w,h);pop()}function ds($){const t=wp+1,e=wt+1;for(let l=0;l<w;l+=t)for(let o=$.y;o<$.y+$.h;o+=e){let r=color($.pc),_=!1;if(td.length>0){for(const n of td)if(l>=n.x&&l<n.x+n.width&&o>=n.y&&o<n.y+n.height){_=!0;break}}let i=red(r)+window.a(-15,15),a=green(r)+window.a(-15,15),c=blue(r)+window.a(-15,15);if(_){const d=(i+a+c)/3,g=d<128?lt:dt;i=red(g),a=green(g),c=blue(g)}i=constrain(i,0,255),a=constrain(a,0,255),c=constrain(c,0,255),fill(i,a,c),noStroke();rect(l+.5*sin(.05*o),o,wp,e)}for(let y=$.y;y<$.y+$.h;y+=e)for(let b=0;b<w;b+=t){let m=color($.pc),S=!1;if(td.length>0){for(const x of td)if(b>=x.x&&b<x.x+x.width&&y>=x.y&&y<x.y+x.height){S=!0;break}}if("m"===$.wt&&$.sc)noise(.1*b,.1*y)>.5&&(m=color($.sc));else if("t"===$.wt){const k=noise(.05*b,.05*y);m=lerpColor(color($.pc),color(255),.15*k)}let A=red(m)+window.a(-20,20),C=green(m)+window.a(-20,20),U=blue(m)+window.a(-20,20);if(S){fill(0,0,0,120);noStroke();const v=.5*cos(.05*b);rect(b+.5,y+v+.5,t,wt);let q;if("m"===$.wt&&$.sc)q=window.g($,b,y,U);else{const d=(A+C+U)/3;q=d<128?lt:dt}A=red(q),C=green(q),U=blue(q)}A=constrain(A,0,255),C=constrain(C,0,255),U=constrain(U,0,255),fill(A,C,U),noStroke();const v=.5*cos(.05*b);rect(b,y+v,t,wt)}for(let z=$.y;z<$.y+$.h;z+=2*e)for(let B=0;B<w;B+=2*t)fill(0,0,0,40),noStroke(),rect(B+1,z+1,t-2,e-2);for(let D=$.y+e;D<$.y+$.h;D+=2*e)for(let E=t;E<w;E+=2*t)fill(255,255,255,30),noStroke(),rect(E,D,t-1,e-1)}function dto(){push(),blendMode(MULTIPLY);for(let $=0;$<w;$+=2)for(let t=0;t<h;t+=2){let e;fill(0,0,0,map(noise(.02*$,.02*t),0,1,0,50)),noStroke(),rect($,t,2,2)}for(let l=0;l<w;l+=6)for(let o=0;o<h;o+=6){const r=noise(.03*l,.03*o);r>.6?(fill(255,255,255,25),noStroke(),rect(l,o,6,6)):r<.4&&(fill(0,0,0,20),noStroke(),rect(l,o,6,6))}pop()}function dtol($){const t=10+19*$,e=5+10*$,l=.7-.05*$;push(),blendMode(MULTIPLY);for(let o=0;o<w;o+=2)for(let r=0;r<h;r+=2){let _;fill(0,0,0,map(noise(.02*o,.02*r),0,1,0,t)),noStroke(),rect(o,r,2,2)}for(let n=0;n<w;n+=6)for(let i=0;i<h;i+=6){const a=noise(.03*n,.03*i);a>l?(fill(255,255,255,e),noStroke(),rect(n,i,6,6)):a<1-l&&(fill(0,0,0,.8*e),noStroke(),rect(n,i,6,6))}if($>=4)for(let c=0;c<w;c+=8)for(let d=0;d<h;d+=8)noise(.01*c,.01*d)>.7&&(fill(0,0,0,15),noStroke(),rect(c,d,8,2));if($>=7)for(let g=0;g<w;g+=4)for(let y=0;y<h;y+=4)noise(.005*g,.005*y)>.8&&(fill(0,0,0,25),noStroke(),rect(g,y,4,1));if($>=9)for(let y=0;y<w;y+=12)for(let b=0;b<h;b+=12)noise(.002*y,.002*b)>.75&&(fill(0,0,0,35),noStroke(),rect(y,b,12,1));pop()}function ddo($){const t=1===$?.5:1,e=1===$?30:60;push(),translate(2*f,2*f);for(let l=0;l<w;l+=3)for(let o=0;o<h;o+=3){const r=window.a(0,1),_=.85*t;if(r>_){const n=window.a(1,4),i=window.a(.5*e,e),a=window.a(60,90),c=window.a(40,60),d=window.a(20,40);fill(a,c,d,i),noStroke(),ellipse(l,o,n,n)}}for(let g=0;g<15*t;g++){const y=window.a(0,w),b=window.a(0,h),m=window.a(8,20),S=window.a(.3*e,.7*e),x=window.a(40,70),k=window.a(25,45),A=window.a(15,30);fill(x,k,A,S),noStroke(),ellipse(y,b,m,m)}for(let C=0;C<w;C+=2)for(let U=0;U<h;U+=2){const j=Math.min(C,U,w-C,h-U);if(j<10){const q=window.a(0,1);if(q>.7*t){const v=window.a(10,25);fill(80,50,20,v),noStroke(),rect(C,U,2,2)}}}pop()}function df(){dfs(2*f,f,w,f,"top"),dfs(2*f,2*f+h+1,w,f,"bottom"),dse()}function dfs($,t,e,l,o){const r=e/12,_=e/r;for(let n=0;n<r;n++){const i=$+n*_;if(!p||!p.colors)return;const a=window.c(p.colors);for(let c=0;c<12;c++){const d=i+window.a(-_/6,_/6),g="top"===o?t+l:t,y="top"===o?t:t+l,b=window.a(1,4),m=window.a(.2,.8),S=window.c([-1,1]),x=window.a(.5,2),k=window.a(.8,1.2),A=color(a),C=.7*red(A),U=.7*green(A),j=.7*blue(A);stroke(C,U,j),strokeWeight(window.a(.5,1.2)),noFill(),beginShape();for(let q=0;q<=1;q+=.1){let v=lerp(g,y,q*k),z=sin(q*PI*m)*b*q*S*x;z+=window.a(-1,1),.3>window.b()&&(z+=window.a(-2,2)),vertex(d+z,v)}endShape()}}}function dse(){const $=wt+1;function t(t){const e="left"===t?0:w,l="left"===t?0:PI;for(const o of sd)for(let r=o.y;r<o.y+o.h;r+=$){if(r===o.y||o===sd[sd.length-1]&&r+$>=o.y+o.h)continue;let _=color(o.pc);if(o.sc&&"m"===o.wt){const n=color(o.sc);_=lerpColor(_,n,.5*noise(.1*r)+.5)}const i=.8*red(_),a=.8*green(_),c=.8*blue(_);fill(i,a,c),noStroke();let d=wt*window.a(1.2,1.8),g=2*f+e+window.a(-2,2),y=2*f+r+wt/2+window.a(-1,1),b;dtsa(g,y,d,l+HALF_PI+window.a(-.2,.2),l-HALF_PI+window.a(-.2,.2),i,a,c,t)}}t("left"),t("right")}function dtsa($,t,e,l,o,r,_,n,i){const a=max(6,floor(e/1.2)),c=e/a;for(let d=0;d<a;d++){let g=e-d*c,y,b,m;d%2==0?(y=constrain(r+25,0,255),b=constrain(_+25,0,255),m=constrain(n+25,0,255)):(y=constrain(r-20,0,255),b=constrain(_-20,0,255),m=constrain(n-20,0,255)),fill(y,b,m,88),arc($,t,2*g,2*g,l,o)}fill(.6*r,.6*_,.6*n,70),arc($+("left"===i?1:-1),t+1,2*e,2*e,l,o);for(let S=0;S<5;S++){const x=window.a(l,o),k=e*window.a(.2,.7),A=$+cos(x)*k,C=t+sin(x)*k;fill(r,_,n,120),ellipse(A,C,window.a(1.5,3.5),window.a(1.5,3.5))}}function gtd(){td=[];const $=tr||[];if(!$||0===$.length)return;const t=$.filter($=>$&&""!==$.trim());if(0===t.length)return;let e=wp+1,l=wt+1,o=e*ts,r=l*ts,_=7*o,n=5*r,i=r,a=1.5*_,c=t.length*_+(t.length-1)*a,d=(w-c)/2,g=0;for(let y=0;y<$.length;y++){const b=$[y];if(!b||""===b.trim())continue;const m=_,S=b.length*(n+i)-i,x=d+g*(_+a),k=(h-S)/2;for(let A=0;A<b.length;A++){const C=b.charAt(A),U=k+(b.length-1-A)*(n+i),j=gcp(C,x,U,m,n);td.push(...j)}g++}}function gcp($,t,e,l,o){const r=[],_=wp+1,n=wt+1,i=_*ts,a=n*ts,c=cm[$.toUpperCase()]||cm[" "],d=c.length,g=c[0].length;for(let y=0;y<d;y++)for(let b=0;b<g;b++)if("1"===c[y][b]){const m=y,S=g-1-b;r.push({x:t+m*i,y:e+S*a,width:i,height:a})}return r}`;

  const rugFrameContent = `function dRF(a,b){if(!fl||fl==="None")return;push();let c=34,d=16,e=55+c+d;translate(-e,-e);push();translate(2*f,2*f);let w0=a+2*e,h0=b+2*e;let pG=[color(255,215,40),color(212,175,55),color(160,120,40)],pB=[color(205,127,50),color(150,80,30),color(110,60,20)],pS=[color(230,230,230),color(192,192,192),color(130,130,130)],pP=[color(229,228,226),color(200,200,210),color(180,180,190)],pD=[color(185,242,255),color(220,250,255),color(255,255,255)];let pal={G:pG,B:pB,S:pS,P:pP,D:pG},palette=pal[fl];let params={motifStep:44,motifSize:18,cornerSize:48},motifR=params.motifSize/2;let motifPalette=fl==="D"?pD:palette;function drawConcentricRects(n,s,f0,f1,wS,wE,lF){for(let i=0;i<n;i++){let t=i/(n-1),lt=lF?lF(t):t,col=lerpColor(f0,f1,lt);noFill();stroke(col);let sw=lerp(wS,wE,t),inset=s+i+sw/2;rect(inset,inset,w0-2*inset,h0-2*inset),strokeWeight(sw)}}function drawMotif(x,y,ex,ey,ax,ay,as,ae){if(fl==="D")fill(motifPalette[0]);else noFill();stroke(motifPalette[0]);strokeWeight(2.2);ellipse(x,y,ex,ey);noFill();stroke(motifPalette[2]);strokeWeight(2.2);arc(ax,ay,motifR*1.1,motifR*1.1,as,ae)}drawConcentricRects(c,0,palette[2],palette[0],4,1,t=>0.2+0.7*(1-t));drawConcentricRects(d,c,palette[1],palette[2],2,.8,t=>t*0.7+0.3);let edges=[{pos:c/2,isHorizontal:!0,arcOffset:motifR*0.1,arcAngles:[PI*1.05,PI*2-0.05],range:[c/2+params.cornerSize,w0-c/2-params.cornerSize]},{pos:h0-c/2,isHorizontal:!0,arcOffset:-motifR*0.1,arcAngles:[.05,PI-.05],range:[c/2+params.cornerSize,w0-c/2-params.cornerSize]},{pos:c/2,isHorizontal:!1,arcOffset:motifR*0.1,arcAngles:[PI*1.55,PI*2.45],range:[c/2+params.cornerSize,h0-c/2-params.cornerSize]},{pos:w0-c/2,isHorizontal:!1,arcOffset:-motifR*0.1,arcAngles:[PI*.55,PI*1.45],range:[c/2+params.cornerSize,h0-c/2-params.cornerSize]}];for(let edge of edges)for(let coord=edge.range[0];coord<edge.range[1];coord+=params.motifStep){let ex=edge.isHorizontal?coord:edge.pos,ey=edge.isHorizontal?edge.pos:coord,ew=edge.isHorizontal?params.motifSize:params.motifSize*0.7,eh=edge.isHorizontal?params.motifSize*0.7:params.motifSize,ax=edge.isHorizontal?coord:edge.pos+edge.arcOffset,ay=edge.isHorizontal?edge.pos+edge.arcOffset:coord;drawMotif(ex,ey,ew,eh,ax,ay,edge.arcAngles[0],edge.arcAngles[1])}let sInset=0+c+d+4;noFill();stroke(40,30,10,60);strokeWeight(3.2);rect(sInset,sInset,w0-2*sInset,h0-2*sInset);pop();pop();}`;
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

  const createNFTHTML = (s: number, palette: any, stripeData: any[], textRows: string[], characterMap: any) => {
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

    // Only create character map if there are actually used characters
    if (usedChars.size > 0) {
      usedChars.forEach(char => {
        if (characterMap[char]) {
          optimizedCharacterMap[char] = characterMap[char];
        }
      });
      // Include space as fallback only when there are text characters
      if (characterMap[' ']) {
        optimizedCharacterMap[' '] = characterMap[' '];
      }
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

    const shortenedStripeData = stripeData.map(stripe => ({
      y: truncateTo3Decimals(stripe.y),               // Truncate y values for consistency (potential chars saved)
      h: truncateTo3Decimals(stripe.height),           // 17 digits → 3 digits (14 chars saved)
      pc: stripe.primaryColor,            // primaryColor → pc (10 chars saved)
      sc: stripe.secondaryColor,          // secondaryColor → sc (12 chars saved)
      wt: stripe.weaveType,               // Already shortened in generator
      wv: truncateTo3Decimals(stripe.warpVariation)    // 16 digits → 3 digits (13 chars saved)
    }));

    // Debug: Log what we're actually passing to the template
      // Function called with parameters (logging removed for production)
    //   return `<!DOCTYPE html>
    //   <html lang="en">
    //   <head>
    //       <meta charset="UTF-8">
    //       <meta name="viewport" content="width=device-width, initial-scale=1.0">
    //       <title>Doormat NFT #${s}</title>
    //       <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>
    //       <style>
    //           body {
    //               margin: 0;
    //               padding: 20px;
    //               background: #f0f0f0;
    //               font-family: monospace;
    //               display: flex;
    //               justify-content: center;
    //               align-items: center;
    //               min-height: 100vh;
    //           }
    //           .nft-container {
    //               text-align: center;
    //           }
    //           .nft-info {
    //               margin-bottom: 20px;
    //               color: #333;
    //           }
    //           .nft-s {
    //               font-weight: bold;
    //               color: #0066cc;
    //           }
              
    //       </style>
    //   </head>
    //   <body>
    //       <div class="nft-container">
    //           <div class="nft-info">
    //               <h2>Doormat NFT #<span class="nft-s">${s}</span></h2>
    //           </div>
    //           <div id="canvas-container"></div>
    //       </div>
      
    //       <script>
    //           // Hardcoded constants (never change in the algorithm)
    //           let doormatWidth = 800;
    //           let doormatHeight = 1200;
    //           let fringeLength = 30;
    //           let weftThickness = 8;
    //           let warpThickness = ${currentWarpThickness}; // Only this changes dynamically
    //           let TEXT_SCALE = 2;
    //           let MAX_CHARS = 11;
              
      
    //           // Colors
    //   let lightTextColor, darkTextColor;
      
      
    //           // Embedded current state (following original pattern)
    //           let selectedPalette = ${JSON.stringify(palette)};
    //           let stripeData = ${JSON.stringify(stripeData)};
    //           let doormatTextRows = ${JSON.stringify(textRows)};
    //           let textData = [];
              
    //           // Dirt and texture state (captured from generator)
    //           let showDirt = ${showDirt};
    //           let dirtLevel = ${dirtLevel};
    //           let showTexture = ${showTexture};
    //           let textureLevel = ${textureLevel};
              
    //           // Embedded character map (only used characters)
    //           const characterMap = ${JSON.stringify(usedChars)};
      
      
      
    //   function setup() {
    //               // Initialize deterministic PRNG to recreate the exact same doormat
    //       // Note: PRNG is initialized in the generation phase, not here
    //       noiseSeed(${s});
          
    //       // Initialize deterministic PRNG for drawing operations
    //       // This ensures the exported NFT uses the same deterministic system
    //       window.d = function(s) {
    //           // Simple LCG implementation for exported HTML
    //           window.prngSeed = s % 2147483647;
    //           if (window.prngSeed <= 0) window.prngSeed += 2147483646;
    //       };
          
    //       window.b = function() {
    //           window.prngSeed = (window.prngSeed * 16807) % 2147483647;
    //           return (window.prngSeed - 1) / 2147483646;
    //       };
          
    //       window.a = function(min, max) {
    //           return min + window.b() * (max - min);
    //       };
          
    //       window.c = function(array) {
    //           return array[Math.floor(window.b() * array.length)];
    //       };
          
    //       // Initialize with the s
    //       window.d(${s});
          
    //               // Create canvas with swapped dimensions for 90-degree rotation
    //               let canvas = createCanvas(doormatHeight + (fringeLength * 4), doormatWidth + (fringeLength * 4));
    //               canvas.parent('canvas-container');
                  
    //               // Set high DPR for crisp rendering on high-DPI displays
    //               pixelDensity(2.5);
                  
    //               // Initialize text colors
    //       updateTextColors();
                  
    //               // Generate text data
    //       generateTextData();
          
    //               noLoop();
                  
    //           }
              
    //           function updateTextColors() {
    //               if (!selectedPalette || !selectedPalette.colors) return;
                  
    //               let darkest = selectedPalette.colors[0];
    //               let lightest = selectedPalette.colors[0];
    //               let darkestVal = 999, lightestVal = -1;
                  
    //               for (let hex of selectedPalette.colors) {
    //                   let c = color(hex);
    //                   let bright = (red(c) + green(c) + blue(c)) / 3;
    //                   if (bright < darkestVal) { darkestVal = bright; darkest = hex; }
    //                   if (bright > lightestVal) { lightestVal = bright; lightest = hex; }
    //               }
                  
    //               // Make text colors more prominent
    //               darkTextColor = lerpColor(color(darkest), color(0), 0.4);
    //               lightTextColor = lerpColor(color(lightest), color(255), 0.3);
    //   }
      
    //   function draw() {
    //               // Use a background that won't create visible bands after rotation
    //               background(222, 222, 222);
          
    //               // Rotate canvas 90 degrees clockwise
    //       push();
    //       translate(width/2, height/2);
    //       rotate(PI/2);
    //       translate(-height/2, -width/2);
          
    //               // Draw the main doormat area
    //       push();
    //               // Center the doormat within the larger canvas buffer
    //       translate(fringeLength * 2, fringeLength * 2);
          
    //               // Draw stripes
    //               for (let stripe of stripeData) {
    //                   drawStripe(stripe);
    //               }
                  
    //               // Add overall texture overlay if enabled (using captured state)
    //               if (showTexture && textureLevel > 0) {
    //                   drawTextureOverlayWithLevel(Math.floor(textureLevel));
    //               }
                  
    //       pop();
          
    //               // Draw fringe with adjusted positioning for larger canvas
    //       drawFringe();
                  
    //               // Draw dirt overlay if enabled (using captured state)
    //               if (showDirt && dirtLevel > 0) {
    //                   drawDirtOverlay(Math.floor(dirtLevel));
    //               }
                  
    //               pop(); // End rotation
    //           }
              
    //           function drawStripe(stripe) {
    //               // Create a proper plain weave structure like the diagram
    //               let warpSpacing = warpThickness + 1; // Space between warp threads
    //               let weftSpacing = weftThickness + 1; // Space between weft threads
                  
    //               // First, draw the warp threads (vertical) as the foundation
    //               for (let x = 0; x < doormatWidth; x += warpSpacing) {
    //                   for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
    //                       let warpColor = color(stripe.primaryColor);
                          
    //                       // Check if this position should be modified for text
    //                       let isTextPixel = false;
    //                       if (textData.length > 0) {
    //                           for (let textPixel of textData) {
    //                               if (x >= textPixel.x && x < textPixel.x + textPixel.width &&
    //                                   y >= textPixel.y && y < textPixel.y + textPixel.height) {
    //                                   isTextPixel = true;
    //                                   break;
    //                               }
    //                           }
    //                       }
                          
    //                       // Add subtle variation to warp threads
    //                       let r = red(warpColor) + window.a(-15, 15);
    //                       let g = green(warpColor) + window.a(-15, 15);
    //                       let b = blue(warpColor) + window.a(-15, 15);
                          
    //                       // Modify color for text pixels (vertical lines use weft thickness)
    //                       if (isTextPixel) {
    //                           const bgBrightness = (r + g + b) / 3;
    //                           let tc = bgBrightness < 128 ? lightTextColor : darkTextColor;
    //                           r = red(tc); g = green(tc); b = blue(tc);
    //                       }
                          
    //                       r = constrain(r, 0, 255);
    //                       g = constrain(g, 0, 255);
    //                       b = constrain(b, 0, 255);
                          
    //                       fill(r, g, b);
    //                       noStroke();
                          
    //                       // Draw warp thread with slight curve for natural look
    //                       let warpCurve = sin(y * 0.05) * 0.5;
    //                       rect(x + warpCurve, y, warpThickness, weftSpacing);
    //                   }
    //               }
                  
    //               // Now draw the weft threads (horizontal) that interlace with warp
    //               for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
    //                   for (let x = 0; x < doormatWidth; x += warpSpacing) {
    //                       let weftColor = color(stripe.primaryColor);
                          
    //                       // Check if this position should be modified for text
    //                       let isTextPixel = false;
    //                       if (textData.length > 0) {
    //                           for (let textPixel of textData) {
    //                               if (x >= textPixel.x && x < textPixel.x + textPixel.width &&
    //                                   y >= textPixel.y && y < textPixel.y + textPixel.height) {
    //                                   isTextPixel = true;
    //                                   break;
    //                               }
    //                           }
    //                       }
                          
    //                       // Add variation based on weave type
    //                       if (stripe.weaveType === 'mixed' && stripe.secondaryColor) {
    //                           if (noise(x * 0.1, y * 0.1) > 0.5) {
    //                               weftColor = color(stripe.secondaryColor);
    //                           }
    //                       } else if (stripe.weaveType === 'textured') {
    //                           let noiseVal = noise(x * 0.05, y * 0.05);
    //                           weftColor = lerpColor(color(stripe.primaryColor), color(255), noiseVal * 0.15);
    //                       }
                          
    //                       // Add fabric irregularities
    //                       let r = red(weftColor) + window.a(-20, 20);
    //                       let g = green(weftColor) + window.a(-20, 20);
    //                       let b = blue(weftColor) + window.a(-20, 20);
                          
    //                       // Modify color for text pixels (horizontal lines use warp thickness)
    //                       if (isTextPixel) {
    //                           const bgBrightness = (r + g + b) / 3;
    //                           let tc = bgBrightness < 128 ? lightTextColor : darkTextColor;
    //                           r = red(tc); g = green(tc); b = blue(tc);
    //                       }
                          
    //                       r = constrain(r, 0, 255);
    //                       g = constrain(g, 0, 255);
    //                       b = constrain(b, 0, 255);
                          
    //                       fill(r, g, b);
    //                       noStroke();
                          
    //                       // Draw weft thread with slight curve
    //                       let weftCurve = cos(x * 0.05) * 0.5;
    //                       rect(x, y + weftCurve, warpSpacing, weftThickness);
    //                   }
    //               }
                  
    //               // Add the interlacing effect - make some threads appear to go over/under
    //               for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing * 2) {
    //                   for (let x = 0; x < doormatWidth; x += warpSpacing * 2) {
    //                       // Create shadow effect for threads that appear to go under
    //                       fill(0, 0, 0, 40);
    //                       noStroke();
    //                       rect(x + 1, y + 1, warpSpacing - 2, weftSpacing - 2);
    //                   }
    //               }
                  
    //               // Add subtle highlights for threads that appear to go over
    //               for (let y = stripe.y + weftSpacing; y < stripe.y + stripe.height; y += weftSpacing * 2) {
    //                   for (let x = warpSpacing; x < doormatWidth; x += warpSpacing * 2) {
    //                       fill(255, 255, 255, 30);
    //                       noStroke();
    //                       rect(x, y, warpSpacing - 1, weftSpacing - 1);
    //                   }
    //       }
    //   }
      
    //   function drawTextureOverlay() {
    //               push();
    //               blendMode(MULTIPLY);
                  
    //               // Fine texture
    //               for (let x = 0; x < doormatWidth; x += 2) {
    //                   for (let y = 0; y < doormatHeight; y += 2) {
    //                       let noiseValue = noise(x * 0.02, y * 0.02);
    //                       let alpha = map(noiseValue, 0, 1, 0, 50);
    //                       fill(0, 0, 0, alpha);
    //                       noStroke();
    //                       rect(x, y, 2, 2);
    //                   }
    //               }
                  
    //               // Coarse texture
    //               for (let x = 0; x < doormatWidth; x += 6) {
    //                   for (let y = 0; y < doormatHeight; y += 6) {
    //                       let noiseValue = noise(x * 0.03, y * 0.03);
    //                       if (noiseValue > 0.6) {
    //                           fill(255, 255, 255, 25);
    //                           noStroke();
    //                           rect(x, y, 6, 6);
    //                       } else if (noiseValue < 0.4) {
    //                           fill(0, 0, 0, 20);
    //                           noStroke();
    //                           rect(x, y, 6, 6);
    //                       }
    //                   }
    //               }
                  
    //               pop();
    //   }
      
    //   // Enhanced texture overlay with time-based intensity levels
    //   function drawTextureOverlayWithLevel(textureLevel) {
    //       // Texture intensity based on level (1 = 7 days, 2 = 30 days)
    //       const hatchingIntensity = textureLevel === 1 ? 30 : 80;  // More intense after 30 days
    //       const reliefIntensity = textureLevel === 1 ? 20 : 40;    // More relief after 30 days
    //       const reliefThreshold = textureLevel === 1 ? 0.6 : 0.5;  // Lower threshold = more relief
          
    //       push();
    //       blendMode(MULTIPLY);
          
    //       // Create hatching effect with variable intensity (same as generator)
    //       for (let x = 0; x < doormatWidth; x += 2) {
    //           for (let y = 0; y < doormatHeight; y += 2) {
    //               let noiseVal = noise(x * 0.02, y * 0.02);
    //               let intensity = map(noiseVal, 0, 1, 0, hatchingIntensity);
                  
    //               fill(0, 0, 0, intensity);
    //               noStroke();
    //               rect(x, y, 2, 2);
    //           }
    //       }
          
    //       // Add relief texture for worn areas (same as generator)
    //       for (let x = 0; x < doormatWidth; x += 6) {
    //           for (let y = 0; y < doormatHeight; y += 6) {
    //               let reliefNoise = noise(x * 0.03, y * 0.03);
    //               if (reliefNoise > reliefThreshold) {
    //                   fill(255, 255, 255, reliefIntensity);
    //                   noStroke();
    //                   rect(x, y, 6, 6);
    //               } else if (reliefNoise < (1 - reliefThreshold)) {
    //                   fill(0, 0, 0, reliefIntensity * 0.8);
    //                   noStroke();
    //                   rect(x, y, 6, 6);
    //               }
    //           }
    //       }
          
    //       // Add additional wear patterns for 30-day level (same as generator)
    //       if (textureLevel === 2) {
    //           for (let x = 0; x < doormatWidth; x += 8) {
    //               for (let y = 0; y < doormatHeight; y += 8) {
    //                   let wearNoise = noise(x * 0.01, y * 0.01);
    //                   if (wearNoise > 0.7) {
    //                       fill(0, 0, 0, 15);
    //                       noStroke();
    //                       rect(x, y, 8, 2); // Horizontal wear lines
    //                   }
    //               }
    //           }
    //       }
          
    //       pop();
    //   }
      
    //   // DIRT OVERLAY SYSTEM - Dynamic dirt accumulation based on time and maintenance
    //   function drawDirtOverlay(dirtLevel) {
    //       // Dirt intensity based on level (0 = clean, 1 = 50% dirty, 2 = full dirty)
    //       const dirtIntensity = dirtLevel === 1 ? 0.5 : 1.0;
    //       const dirtOpacity = dirtLevel === 1 ? 30 : 60;
          
    //       // Create dirt pattern using PRNG for consistency
    //       push();
    //       translate(fringeLength * 2, fringeLength * 2);
          
    //       // Draw dirt spots and stains
    //       for (let x = 0; x < doormatWidth; x += 3) {
    //           for (let y = 0; y < doormatHeight; y += 3) {
    //               // Use PRNG for consistent dirt pattern
    //               const dirtNoise = window.a(0, 1);
    //               const dirtThreshold = 0.85 * dirtIntensity; // Higher threshold = less dirt
                  
    //               if (dirtNoise > dirtThreshold) {
    //                   // Create dirt spot
    //                   const dirtSize = window.a(1, 4);
    //                   const dirtAlpha = window.a(dirtOpacity * 0.5, dirtOpacity);
                      
    //                   // Brown/dark dirt color
    //                   const dirtR = window.a(60, 90);
    //                   const dirtG = window.a(40, 60);
    //                   const dirtB = window.a(20, 40);
                      
    //                   fill(dirtR, dirtG, dirtB, dirtAlpha);
    //                   noStroke();
    //                   ellipse(x, y, dirtSize, dirtSize);
    //               }
    //           }
    //       }
          
    //       // Add larger dirt stains for more realistic effect
    //       for (let i = 0; i < 15 * dirtIntensity; i++) {
    //           const stainX = window.a(0, doormatWidth);
    //           const stainY = window.a(0, doormatHeight);
    //           const stainSize = window.a(8, 20);
    //           const stainAlpha = window.a(dirtOpacity * 0.3, dirtOpacity * 0.7);
              
    //           // Darker stain color
    //           const stainR = window.a(40, 70);
    //           const stainG = window.a(25, 45);
    //           const stainB = window.a(15, 30);
              
    //           fill(stainR, stainG, stainB, stainAlpha);
    //           noStroke();
    //           ellipse(stainX, stainY, stainSize, stainSize);
    //       }
          
    //       // Add edge wear and tear
    //       for (let x = 0; x < doormatWidth; x += 2) {
    //           for (let y = 0; y < doormatHeight; y += 2) {
    //               // Check if near edges
    //               const edgeDistance = Math.min(x, y, doormatWidth - x, doormatHeight - y);
    //               if (edgeDistance < 10) {
    //                   const edgeDirt = window.a(0, 1);
    //                   if (edgeDirt > 0.7 * dirtIntensity) {
    //                       const edgeAlpha = window.a(10, 25);
    //                       fill(80, 50, 20, edgeAlpha);
    //                       noStroke();
    //                       rect(x, y, 2, 2);
    //                   }
    //               }
    //           }
    //       }
          
    //       pop();
    //   }
      
    //   function drawFringe() {
    //               // Top fringe (warp ends)
    //               // Top fringe - adjusted for larger canvas buffer
    //               drawFringeSection(fringeLength * 2, fringeLength, doormatWidth, fringeLength, 'top');
                  
    //               // Bottom fringe - adjusted for larger canvas buffer
    //               drawFringeSection(fringeLength * 2, fringeLength * 2 + doormatHeight, doormatWidth, fringeLength, 'bottom');
                  
    //               // Draw selvedge edges (weft loops) on left and right sides
    //               drawSelvedgeEdges();
    //   }
      
    //   function drawSelvedgeEdges() {
    //               let weftSpacing = weftThickness + 1;
    //               let isFirst = true;
    //               let isLast = false;
                  
    //               // Left selvedge edge - flowing semicircular weft threads
    //               for (let stripe of stripeData) {
    //                   for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
    //                       // Skip the very first and very last weft threads of the entire doormat
    //                       if (isFirst) {
    //                           isFirst = false;
    //                           continue;
    //                       }
                          
    //                       // Check if this is the last weft thread
    //                       if (stripe === stripeData[stripeData.length - 1] && y + weftSpacing >= stripe.y + stripe.height) {
    //                           isLast = true;
    //                           continue; // Skip this last weft thread instead of breaking
    //                       }
                          
    //                       // Get the color from the current stripe
    //                       let selvedgeColor = color(stripe.primaryColor);
                          
    //                       // Check if there's a secondary color for blending
    //                       if (stripe.secondaryColor && stripe.weaveType === 'mixed') {
    //                           let secondaryColor = color(stripe.secondaryColor);
    //                           // Blend the colors based on noise for variation
    //                           let blendFactor = noise(y * 0.1) * 0.5 + 0.5;
    //                           selvedgeColor = lerpColor(selvedgeColor, secondaryColor, blendFactor);
    //                       }
                          
    //                       let r = red(selvedgeColor) * 0.8;
    //                       let g = green(selvedgeColor) * 0.8;
    //                       let b = blue(selvedgeColor) * 0.8;
                          
    //                       fill(r, g, b);
    //                       noStroke();
                          
    //                       let radius = weftThickness * window.a(1.2, 1.8); // Vary size slightly
    //                       let centerX = fringeLength * 2 + window.a(-2, 2); // Slight position variation
    //                       let centerY = fringeLength * 2 + y + weftThickness/2 + window.a(-1, 1); // Slight vertical variation
                          
    //                       // Vary the arc angles for more natural look
    //                       let startAngle = HALF_PI + window.a(-0.2, 0.2);
    //                       let endAngle = -HALF_PI + window.a(-0.2, 0.2);
                          
    //                       // Draw textured semicircle with individual thread details
    //                       drawTexturedSelvedgeArc(centerX, centerY, radius, startAngle, endAngle, r, g, b, 'left');
    //                   }
    //               }
                  
    //               // Right selvedge edge - flowing semicircular weft threads
    //               let isFirstWeftRight = true;
    //               let isLastWeftRight = false;
                  
    //               for (let stripe of stripeData) {
    //                   for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
    //                       // Skip the very first and very last weft threads of the entire doormat
    //                       if (isFirstWeftRight) {
    //                           isFirstWeftRight = false;
    //                           continue;
    //                       }
                          
    //                       // Check if this is the last weft thread
    //                       if (stripe === stripeData[stripeData.length - 1] && y + weftSpacing >= stripe.y + stripe.height) {
    //                           isLastWeftRight = true;
    //                           continue; // Skip this last weft thread instead of breaking
    //                       }
                          
    //                       // Get the color from the current stripe
    //                       let selvedgeColor = color(stripe.primaryColor);
                          
    //                       // Check if there's a secondary color for blending
    //                       if (stripe.secondaryColor && stripe.weaveType === 'mixed') {
    //                           let secondaryColor = color(stripe.secondaryColor);
    //                           // Blend the colors based on noise for variation
    //                           let blendFactor = noise(y * 0.1) * 0.5 + 0.5;
    //                           selvedgeColor = lerpColor(selvedgeColor, secondaryColor, blendFactor);
    //                       }
                          
    //                       let r = red(selvedgeColor) * 0.8;
    //                       let g = green(selvedgeColor) * 0.8;
    //                       let b = blue(selvedgeColor) * 0.8;
                          
    //                       fill(r, g, b);
    //                       noStroke();
                          
    //                       let radius = weftThickness * window.a(1.2, 1.8); // Vary size slightly
    //                       let centerX = fringeLength * 2 + doormatWidth + window.a(-2, 2); // Slight position variation
    //                       let centerY = fringeLength * 2 + y + weftThickness/2 + window.a(-1, 1); // Slight vertical variation
                          
    //                       // Vary the arc angles for more natural look
    //                       let startAngle = -HALF_PI + window.a(-0.2, 0.2);
    //                       let endAngle = HALF_PI + window.a(-0.2, 0.2);
                          
    //                       // Draw textured semicircle with individual thread details
    //                       drawTexturedSelvedgeArc(centerX, centerY, radius, startAngle, endAngle, r, g, b, 'right');
    //                   }
    //               }
    //           }
              
    //           function drawTexturedSelvedgeArc(centerX, centerY, radius, startAngle, endAngle, r, g, b, side) {
    //               // Draw a realistic textured selvedge arc with visible woven texture
    //               let threadCount = max(6, floor(radius / 1.2)); // More threads for visible texture
    //               let threadSpacing = radius / threadCount;
                  
    //               // Draw individual thread arcs to create visible woven texture
    //               for (let i = 0; i < threadCount; i++) {
    //                   let threadRadius = radius - (i * threadSpacing);
                      
    //                   // Create distinct thread colors for visible texture
    //                   let threadR, threadG, threadB;
                      
    //                   if (i % 2 === 0) {
    //                       // Lighter threads
    //                       threadR = constrain(r + 25, 0, 255);
    //                       threadG = constrain(g + 25, 0, 255);
    //                       threadB = constrain(b + 25, 0, 255);
    //                   } else {
    //                       // Darker threads
    //                       threadR = constrain(r - 20, 0, 255);
    //                       threadG = constrain(g - 20, 0, 255);
    //                       threadB = constrain(b - 20, 0, 255);
    //                   }
                      
    //                   // Add some random variation for natural look
    //                   threadR = constrain(threadR + window.a(-10, 10), 0, 255);
    //                   threadG = constrain(threadG + window.a(-10, 10), 0, 255);
    //                   threadB = constrain(threadB + window.a(-10, 10), 0, 255);
                      
    //                   fill(threadR, threadG, threadB, 88); // More transparent for better blending
                      
    //                   // Draw individual thread arc with slight position variation
    //                   let threadX = centerX + window.a(-1, 1);
    //                   let threadY = centerY + window.a(-1, 1);
    //                   let threadStartAngle = startAngle + window.a(-0.1, 0.1);
    //                   let threadEndAngle = endAngle + window.a(-0.1, 0.1);
                      
    //                   arc(threadX, threadY, threadRadius * 2, threadRadius * 2, threadStartAngle, threadEndAngle);
    //               }
                  
    //               // Add a few more detailed texture layers
    //               for (let i = 0; i < 3; i++) {
    //                   let detailRadius = radius * (0.3 + i * 0.2);
    //                   let detailAlpha = 180 - (i * 40);
                      
    //                   // Create contrast for visibility
    //                   let detailR = constrain(r + (i % 2 === 0 ? 15 : -15), 0, 255);
    //                   let detailG = constrain(g + (i % 2 === 0 ? 15 : -15), 0, 255);
    //                   let detailB = constrain(b + (i % 2 === 0 ? 15 : -15), 0, 255);
                      
    //                   fill(detailR, detailG, detailB, detailAlpha * 0.7); // More transparent detail layers
                      
    //                   let detailX = centerX + window.a(-0.5, 0.5);
    //                   let detailY = centerY + window.a(-0.5, 0.5);
    //                   let detailStartAngle = startAngle + window.a(-0.05, 0.05);
    //                   let detailEndAngle = endAngle + window.a(-0.05, 0.05);
                      
    //                   arc(detailX, detailY, detailRadius * 2, detailRadius * 2, detailStartAngle, detailEndAngle);
    //               }
                  
    //               // Add subtle shadow for depth
    //               fill(r * 0.6, g * 0.6, b * 0.6, 70); // More transparent shadow
    //               let shadowOffset = side === 'left' ? 1 : -1;
    //               arc(centerX + shadowOffset, centerY + 1, radius * 2, radius * 2, startAngle, endAngle);
                  
    //               // Add small transparent hole in the center
    //               noFill();
    //               arc(centerX, centerY, radius * 0.5, radius * 0.5, startAngle, endAngle);
                  
    //               // Add visible texture details - small bumps and knots
    //               for (let i = 0; i < 8; i++) {
    //                   let detailAngle = window.a(startAngle, endAngle);
    //                   let detailRadius = radius * window.a(0.2, 0.7);
    //                   let detailX = centerX + cos(detailAngle) * detailRadius;
    //                   let detailY = centerY + sin(detailAngle) * detailRadius;
                      
    //                   // Alternate between light and dark for visible contrast
    //                   if (i % 2 === 0) {
    //                       fill(r + 20, g + 20, b + 20, 120); // More transparent light bumps
    //                   } else {
    //                       fill(r - 15, g - 15, b - 15, 120); // More transparent dark bumps
    //                   }
                      
    //                   noStroke();
    //                   ellipse(detailX, detailY, window.a(1.5, 3.5), window.a(1.5, 3.5));
    //               }
    //           }
              
    //           function drawFringeSection(x, y, w, h, side) {
    //               let fringeStrands = w / 12; // More fringe strands for thinner threads
    //               let strandWidth = w / fringeStrands;
                  
    //               for (let i = 0; i < fringeStrands; i++) {
    //                   let strandX = x + i * strandWidth;
                      
    //                   // Safety check for selectedPalette
    //                   if (!selectedPalette || !selectedPalette.colors) {
    //                       return;
    //                   }
                      
    //                   let strandColor = window.c(selectedPalette.colors);
                      
    //                   // Draw individual fringe strand with thin threads
    //                   for (let j = 0; j < 12; j++) { // More but thinner threads per strand
    //                       let threadX = strandX + window.a(-strandWidth/6, strandWidth/6);
    //                       let startY = side === 'top' ? y + h : y;
    //                       let endY = side === 'top' ? y : y + h;
                          
    //                       // Add natural curl/wave to the fringe with more variation
    //                       let waveAmplitude = window.a(1, 4);
    //                       let waveFreq = window.a(0.2, 0.8);
                          
    //                       // Randomize the direction and intensity for each thread
    //                       let direction = window.c([-1, 1]); // Random left or right direction
    //                       let curlIntensity = window.a(0.5, 2.0);
    //                       let threadLength = window.a(0.8, 1.2); // Vary thread length
                          
    //                       // Use darker version of strand color for fringe
    //                       let fringeColor = color(strandColor);
    //                       let r = red(fringeColor) * 0.7;
    //                       let g = green(fringeColor) * 0.7;
    //                       let b = blue(fringeColor) * 0.7;
                          
    //                       stroke(r, g, b);
    //                       strokeWeight(window.a(0.5, 1.2)); // Vary thread thickness
                          
    //                       noFill();
    //                       beginShape();
    //                       for (let t = 0; t <= 1; t += 0.1) {
    //                           let yPos = lerp(startY, endY, t * threadLength);
    //                           let xOffset = sin(t * PI * waveFreq) * waveAmplitude * t * direction * curlIntensity;
    //                           // Add more randomness and natural variation
    //                           xOffset += window.a(-1, 1);
    //                           // Add occasional kinks and bends
    //                           if (window.b() < 0.3) {
    //                               xOffset += window.a(-2, 2);
    //                           }
    //                           vertex(threadX + xOffset, yPos);
    //                       }
    //                       endShape();
    //                   }
    //               }
    //   }
      
    //   function generateTextData() {
    //       textData = [];
    //               const textRows = doormatTextRows || [];
    //               if (!textRows || textRows.length === 0) return;
                  
    //               // Filter out empty text rows (same as live generator)
    //               const nonEmptyTextRows = textRows.filter(row => row && row.trim() !== '');
    //               if (nonEmptyTextRows.length === 0) return;
                  
    //               const warpSpacing = warpThickness + 1;
    //               const weftSpacing = weftThickness + 1;
    //               const scaledWarp = warpSpacing * TEXT_SCALE;
    //               const scaledWeft = weftSpacing * TEXT_SCALE;
                  
    //               // Character dimensions based on thread spacing (EXACT same as live generator)
    //               const charWidth = 7 * scaledWarp; // width after rotation (7 columns)
    //               const charHeight = 5 * scaledWeft; // height after rotation (5 rows)
    //               const spacing = scaledWeft; // vertical gap between stacked characters
                  
    //               // Calculate spacing between rows (horizontal spacing after rotation)
    //               const rowSpacing = charWidth * 1.5; // Space between rows
                  
    //               // Calculate total width needed for all NON-EMPTY rows
    //               const totalRowsWidth = nonEmptyTextRows.length * charWidth + (nonEmptyTextRows.length - 1) * rowSpacing;
                  
    //               // Calculate starting X position to center all NON-EMPTY rows
    //               const baseStartX = (doormatWidth - totalRowsWidth) / 2;
                  
    //               let currentRowIndex = 0;
    //               for (let rowIndex = 0; rowIndex < textRows.length; rowIndex++) {
    //                   const rowText = textRows[rowIndex];
    //                   if (!rowText || rowText.trim() === '') continue; // Skip empty rows
                      
    //                   // Calculate text dimensions for this row
    //                   const textWidth = charWidth;
    //                   const textHeight = rowText.length * (charHeight + spacing) - spacing;
                      
    //                   // Position for this NON-EMPTY row (left to right becomes after rotation)
    //                   const startX = baseStartX + currentRowIndex * (charWidth + rowSpacing);
    //                   const startY = (doormatHeight - textHeight) / 2;
                      
    //                   // Generate character data vertically bottom-to-top for this row
    //                   for (let i = 0; i < rowText.length; i++) {
    //                       const char = rowText.charAt(i);
    //                       const charY = startY + (rowText.length - 1 - i) * (charHeight + spacing);
    //                       const charPixels = generateCharacterPixels(char, startX, charY, textWidth, charHeight);
    //                       textData.push(...charPixels);
    //                   }
                      
    //                   currentRowIndex++; // Only increment for non-empty rows
    //               }
    //           }
              
              
    //           function generateCharacterPixels(char, x, y, width, height) {
    //               const pixels = [];
    //               const warpSpacing = warpThickness + 1;
    //               const weftSpacing = weftThickness + 1;
    //               const scaledWarp = warpSpacing * TEXT_SCALE;
    //               const scaledWeft = weftSpacing * TEXT_SCALE;
      
    //               // Character definitions - use the EXACT same format as live generator
    //               const charDef = characterMap[char.toUpperCase()] || characterMap[' '];
      
    //               const numRows = charDef.length;
    //               const numCols = charDef[0].length;
      
    //               // Rotate 90° CCW: newX = col, newY = numRows - 1 - row
    //               for (let row = 0; row < numRows; row++) {
    //                   for (let col = 0; col < numCols; col++) {
    //                       if (charDef[row][col] === '1') {
    //                           // Rotate 180°: flip both axes
    //                           const newCol = row;
    //                           const newRow = numCols - 1 - col;
    //                           pixels.push({
    //                               x: x + newCol * scaledWarp,
    //                               y: y + newRow * scaledWeft,
    //                               width: scaledWarp,
    //                               height: scaledWeft
    //                           });
    //                       }
    //                   }
    //               }
      
    //               return pixels;
    //           }
    //       </script>
    //   </body>
    //   </html>`;
    //     };
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Onchain Rug #${s}</title><script>${rugP5Content}</script><style>body{display:flex;justify-content:center;align-items:center}#defaultCanvas0{width:100%!important;height:auto!important;}</style></head><body><div id="rug"></div><script>let w=800,h=1200,f=30,wt=8,wp=${currentWarpThickness},ts=2,lt,dt,p=${JSON.stringify(palette)},sd=${JSON.stringify(shortenedStripeData)},tr=${JSON.stringify(textRows)},td=[],dl=0,tl=0,s=${s},cm=${JSON.stringify(optimizedCharacterMapFinal)},fl="None";
${rugAlgoContent}
${rugFrameContent}
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
