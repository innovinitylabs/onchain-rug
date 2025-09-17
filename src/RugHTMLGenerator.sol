// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {RugHTMLRequest, RugHTMLTag, RugHTMLTagType} from "./RugScriptyStructs.sol";
import {IRugScriptyBuilderV2} from "./IRugScriptyBuilderV2.sol";
import {RugEthFSStorage} from "./RugEthFSStorage.sol";

library RugHTMLGenerator {
    using Strings for uint256;
    using Strings for uint8;

    struct RugData {
        uint256 seed;
        string paletteName;
        string minifiedPalette;
        string minifiedStripeData;
        string[] textRows;
        uint8 warpThickness;
        uint256 mintTime;
        string filteredCharacterMap;
        uint8 complexity;
        uint256 characterCount;
        uint256 stripeCount;
    }

    function generateHTML(
        RugData memory rug,
        uint8 dirtLevel,
        uint8 textureLevel,
        uint256 tokenId,
        address scriptyBuilderAddress,
        address ethfsStorageAddress
    ) internal view returns (string memory) {
        // Create head tags
        RugHTMLTag[] memory headTags = new RugHTMLTag[](1);
        headTags[0].tagOpen = '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OnchainRug #';
        headTags[0].tagContent = bytes(tokenId.toString());
        headTags[0].tagClose = '</title><style>body{display:flex;justify-content:center;align-items:center}#defaultCanvas0{width:100%!important;height:auto!important;max-width:800px;max-height:1200px;}</style>';

        // Create body tags (3 total: p5.js, canvas, rug algorithm)
        RugHTMLTag[] memory bodyTags = new RugHTMLTag[](3);

        // 1. p5.js library from EthFS storage
        bodyTags[0].name = "p5.min.js";
        bodyTags[0].contractAddress = ethfsStorageAddress;
        bodyTags[0].contractData = abi.encode("p5.min.js");
        bodyTags[0].tagType = RugHTMLTagType.scriptBase64DataURI;

        // 2. Canvas element
        bodyTags[1].tagOpen = '<div id="rug"><canvas id="defaultCanvas0" width="800" height="1200"></canvas></div>';

        // 3. JavaScript with all the rug logic
        bodyTags[2].tagContent = bytes(jsConfig(rug, dirtLevel, textureLevel));
        bodyTags[2].tagClose = bytes(getJavaScriptAlgorithm());
        bodyTags[2].tagType = RugHTMLTagType.script;

        // Create HTML request
        RugHTMLRequest memory htmlRequest;
        htmlRequest.headTags = headTags;
        htmlRequest.bodyTags = bodyTags;

        // Get URL safe HTML string from scripty builder (for NFT compatibility)
        return IRugScriptyBuilderV2(scriptyBuilderAddress).getHTMLURLSafeString(htmlRequest);
    }

    function jsConfig(
        RugData memory rug,
        uint8 dirtLevel,
        uint8 textureLevel
    ) internal pure returns (string memory) {
        return string.concat(
            'let w=800,h=1200,f=30,wt=8,wp=',
            rug.warpThickness.toString(),
            ',ts=2,lt,dt,p=',
            rug.minifiedPalette,
            ',sd=',
            rug.minifiedStripeData,
            ',tr=',
            encodeTextRows(rug.textRows),
            ',td=[],dl=',
            dirtLevel.toString(),
            ',tl=',
            textureLevel.toString(),
            ',s=',
            rug.seed.toString(),
            ';let cm=',
            formatCharacterMapFromMinified(rug.filteredCharacterMap),
            ';'
        );
    }

    function formatCharacterMapFromMinified(string memory filteredCharacterMap) internal pure returns (string memory) {
       return filteredCharacterMap;
    }

    function encodeTextRows(string[] memory textRows) internal pure returns (string memory) {
        if (textRows.length == 0) return "[]";
        string memory r = "[";
        for (uint256 i = 0; i < textRows.length; i++) {
            if (i > 0) r = string.concat(r, ",");
            r = string.concat(r, '"', textRows[i], '"');
        }
        return string.concat(r, "]");
    }

    function getJavaScriptAlgorithm() internal pure returns (string memory) {
        return string.concat(
        'function setup(){noiseSeed(s);window.d=function(seed){window.prngSeed=seed%2147483647;if(window.prngSeed<=0)window.prngSeed+=2147483646};window.b=function(){window.prngSeed=(window.prngSeed*16807)%2147483647;return(window.prngSeed-1)/2147483646};window.a=function(min,max){return min+window.b()*(max-min)};window.c=function(array){return array[Math.floor(window.b()*array.length)]};window.d(s);let canvas=createCanvas(h+(f*4),w+(f*4));canvas.parent("rug");pixelDensity(2.5);u();gtd();noLoop()}',
        'function u(){if(!p||!p.colors)return;let d=p.colors[0],l=p.colors[0],dv=999,lv=-1;for(let hex of p.colors){let c=color(hex),b=(red(c)+green(c)+blue(c))/3;if(b<dv){dv=b;d=hex}if(b>lv){lv=b;l=hex}}dt=lerpColor(color(d),color(0),0.4);lt=lerpColor(color(l),color(255),0.3)}',
        'function draw(){background(222,222,222);push();translate(width/2,height/2);rotate(PI/2);translate(-height/2,-width/2);push();translate(f*2,f*2);for(let stripe of sd)ds(stripe);if(tl>0)dtol(Math.floor(tl));pop();df();if(dl>0)ddo(Math.floor(dl));pop()} ',
        'function ds(s){let ws=wp+1,we=wt+1;for(let x=0;x<w;x+=ws){for(let y=s.y;y<s.y+s.h;y+=we){let wc=color(s.pc),itp=false;if(td.length>0){for(let tp of td){if(x>=tp.x&&x<tp.x+tp.width&&y>=tp.y&&y<tp.y+tp.height){itp=true;break}}}let r=red(wc)+window.a(-15,15),g=green(wc)+window.a(-15,15),b=blue(wc)+window.a(-15,15);if(itp){const bb=(r+g+b)/3;let tc=bb<128?lt:dt;r=red(tc);g=green(tc);b=blue(tc)}r=constrain(r,0,255);g=constrain(g,0,255);b=constrain(b,0,255);fill(r,g,b);noStroke();let wcv=sin(y*0.05)*0.5;rect(x+wcv,y,wp,we)}}for(let y=s.y;y<s.y+s.h;y+=we){for(let x=0;x<w;x+=ws){let wc=color(s.pc),itp=false;if(td.length>0){for(let tp of td){if(x>=tp.x&&x<tp.x+tp.width&&y>=tp.y&&y<tp.y+tp.height){itp=true;break}}}if(s.wt==="m"&&s.sc){if(noise(x*0.1,y*0.1)>0.5)wc=color(s.sc)}else if(s.wt==="t"){let nv=noise(x*0.05,y*0.05);wc=lerpColor(color(s.pc),color(255),nv*0.15)}let r=red(wc)+window.a(-20,20),g=green(wc)+window.a(-20,20),b=blue(wc)+window.a(-20,20);if(itp){const bb=(r+g+b)/3;let tc=bb<128?lt:dt;r=red(tc);g=green(tc);b=blue(tc)}r=constrain(r,0,255);g=constrain(g,0,255);b=constrain(b,0,255);fill(r,g,b);noStroke();let wcv=cos(x*0.05)*0.5;rect(x,y+wcv,ws,wt)}}for(let y=s.y;y<s.y+s.h;y+=we*2){for(let x=0;x<w;x+=ws*2){fill(0,0,0,40);noStroke();rect(x+1,y+1,ws-2,we-2)}}for(let y=s.y+we;y<s.y+s.h;y+=we*2){for(let x=ws;x<w;x+=ws*2){fill(255,255,255,30);noStroke();rect(x,y,ws-1,we-1)}}}',
        'function dto(){push();blendMode(MULTIPLY);for(let x=0;x<w;x+=2){for(let y=0;y<h;y+=2){let nv=noise(x*0.02,y*0.02),a=map(nv,0,1,0,50);fill(0,0,0,a);noStroke();rect(x,y,2,2)}}for(let x=0;x<w;x+=6){for(let y=0;y<h;y+=6){let nv=noise(x*0.03,y*0.03);if(nv>0.6){fill(255,255,255,25);noStroke();rect(x,y,6,6)}else if(nv<0.4){fill(0,0,0,20);noStroke();rect(x,y,6,6)}}}pop()}',
        'function dtol(tl){const hi=tl===1?30:tl===2?80:120,ri=tl===1?20:tl===2?40:60,rt=tl===1?0.6:tl===2?0.5:0.4;push();blendMode(MULTIPLY);for(let x=0;x<w;x+=2){for(let y=0;y<h;y+=2){let nv=noise(x*0.02,y*0.02),i=map(nv,0,1,0,hi);fill(0,0,0,i);noStroke();rect(x,y,2,2)}}for(let x=0;x<w;x+=6){for(let y=0;y<h;y+=6){let rn=noise(x*0.03,y*0.03);if(rn>rt){fill(255,255,255,ri);noStroke();rect(x,y,6,6)}else if(rn<(1-rt)){fill(0,0,0,ri*0.8);noStroke();rect(x,y,6,6)}}}if(tl>=2){for(let x=0;x<w;x+=8){for(let y=0;y<h;y+=8){let wn=noise(x*0.01,y*0.01);if(wn>0.7){fill(0,0,0,15);noStroke();rect(x,y,8,2)}}}}if(tl>=3){for(let x=0;x<w;x+=4){for(let y=0;y<h;y+=4){let wn=noise(x*0.005,y*0.005);if(wn>0.8){fill(0,0,0,25);noStroke();rect(x,y,4,1)}}}}pop()}',
        'function ddo(dl){const di=dl===1?0.5:1.0,doo=dl===1?30:60;push();translate(f*2,f*2);for(let x=0;x<w;x+=3){for(let y=0;y<h;y+=3){const dn=window.a(0,1),dt=0.85*di;if(dn>dt){const ds=window.a(1,4),da=window.a(doo*0.5,doo),dr=window.a(60,90),dg=window.a(40,60),db=window.a(20,40);fill(dr,dg,db,da);noStroke();ellipse(x,y,ds,ds)}}}for(let i=0;i<15*di;i++){const sx=window.a(0,w),sy=window.a(0,h),ss=window.a(8,20),sa=window.a(doo*0.3,doo*0.7),sr=window.a(40,70),sg=window.a(25,45),sb=window.a(15,30);fill(sr,sg,sb,sa);noStroke();ellipse(sx,sy,ss,ss)}for(let x=0;x<w;x+=2){for(let y=0;y<h;y+=2){const ed=Math.min(x,y,w-x,h-y);if(ed<10){const edirt=window.a(0,1);if(edirt>0.7*di){const ea=window.a(10,25);fill(80,50,20,ea);noStroke();rect(x,y,2,2)}}}}pop()}',
        'function df(){dfs(f*2,f,w,f,"top");dfs(f*2,f*2+h,w,f,"bottom");dse()}',
        'function dfs(x,y,w,h,side){let fs=w/12,sw=w/fs;for(let i=0;i<fs;i++){let sx=x+i*sw;if(!p||!p.colors)return;let sc=window.c(p.colors);for(let j=0;j<12;j++){let tx=sx+window.a(-sw/6,sw/6),sy=side==="top"?y+h:y,ey=side==="top"?y:y+h,wa=window.a(1,4),wf=window.a(0.2,0.8),d=window.c([-1,1]),ci=window.a(0.5,2.0),tl=window.a(0.8,1.2),fc=color(sc),r=red(fc)*0.7,g=green(fc)*0.7,b=blue(fc)*0.7;stroke(r,g,b);strokeWeight(window.a(0.5,1.2));noFill();beginShape();for(let t=0;t<=1;t+=0.1){let yp=lerp(sy,ey,t*tl),xo=sin(t*PI*wf)*wa*t*d*ci;xo+=window.a(-1,1);if(window.b()<0.3)xo+=window.a(-2,2);vertex(tx+xo,yp)}endShape()}}}',
        'function dse(){let ws=wt+1;function rs(side){const xo=side==="left"?0:w,ao=side==="left"?0:PI;for(let s of sd){for(let y=s.y;y<s.y+s.h;y+=ws){if(y===s.y)continue;if(s===sd[sd.length-1]&&y+ws>=s.y+s.h)continue;let sc=color(s.pc);if(s.sc&&s.wt==="m"){let sc2=color(s.sc),bf=noise(y*0.1)*0.5+0.5;sc=lerpColor(sc,sc2,bf)}let r=red(sc)*0.8,g=green(sc)*0.8,b=blue(sc)*0.8;fill(r,g,b);noStroke();let rad=wt*window.a(1.2,1.8),cx=f*2+xo+window.a(-2,2),cy=f*2+y+wt/2+window.a(-1,1),sa=ao+HALF_PI+window.a(-0.2,0.2),ea=ao-HALF_PI+window.a(-0.2,0.2);dtsa(cx,cy,rad,sa,ea,r,g,b,side)}}}rs("left");rs("right")}',
        'function dtsa(cx,cy,rad,sa,ea,r,g,b,s){let tc=max(6,floor(rad/1.2)),ts=rad/tc;for(let i=0;i<tc;i++){let tr=rad-(i*ts),trr,trg,tb;if(i%2===0){trr=constrain(r+25,0,255);trg=constrain(g+25,0,255);tb=constrain(b+25,0,255)}else{trr=constrain(r-20,0,255);trg=constrain(g-20,0,255);tb=constrain(b-20,0,255)}fill(trr,trg,tb,88);arc(cx,cy,tr*2,tr*2,sa,ea)}fill(r*0.6,g*0.6,b*0.6,70);let so=s==="left"?1:-1;arc(cx+so,cy+1,rad*2,rad*2,sa,ea);for(let i=0;i<5;i++){let da=window.a(sa,ea),dr=rad*window.a(0.2,0.7),dx=cx+cos(da)*dr,dy=cy+sin(da)*dr;fill(r,g,b,120);ellipse(dx,dy,window.a(1.5,3.5),window.a(1.5,3.5))}}',
        'function gtd(){td=[];const trr=tr||[];if(!trr||trr.length===0)return;const netr=trr.filter(row=>row&&row.trim()!=="");if(netr.length===0)return;const ws=wp+1,we=wt+1,sw=ws*ts,se=we*ts,cw=7*sw,ch=5*se,s=se,rs=cw*1.5,trw=netr.length*cw+(netr.length-1)*rs,bsx=(w-trw)/2;let cri=0;for(let ri=0;ri<trr.length;ri++){const rt=trr[ri];if(!rt||rt.trim()==="")continue;const tw=cw,th=rt.length*(ch+s)-s,sx=bsx+cri*(cw+rs),sy=(h-th)/2;for(let i=0;i<rt.length;i++){const c=rt.charAt(i),cy=sy+(rt.length-1-i)*(ch+s),cp=gcp(c,sx,cy,tw,ch);td.push(...cp)}cri++}}',
        'function gcp(c,x,y,w,h){const p=[];const ws=wp+1,we=wt+1,sw=ws*ts,se=we*ts,cd=cm[c.toUpperCase()]||cm[" "],nr=cd.length,nc=cd[0].length;for(let r=0;r<nr;r++){for(let col=0;col<nc;col++){if(cd[r][col]==="1"){const ncol=r,nrow=nc-1-col;p.push({x:x+ncol*sw,y:y+nrow*se,width:sw,height:se})}}}return p}'
        );
    }
}
