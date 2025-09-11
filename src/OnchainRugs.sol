// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "lib/openzeppelin-contracts/contracts/utils/Strings.sol";
import "lib/openzeppelin-contracts/contracts/utils/Base64.sol";

/**
 * @title OnchainRugs
 * @dev Fully on-chain NFT rug collection with dynamic aging and cleaning mechanics
 * @notice Complete P5.js algorithm embedded in contract, CDN P5.js library
 */
contract OnchainRugs is ERC721, ERC721URIStorage, Ownable {
    using Strings for uint256;
    
    // Constants
    uint256 public constant MAX_SUPPLY = 1111;
    uint256 public constant ROYALTY_PERCENTAGE = 1000; // 10%
    
    // Pricing (in wei)
    uint256 public constant BASE_PRICE = 0.0001 ether; // Any value above 0 for 1 line
    uint256 public constant LINE_2_3_PRICE = 0.00111 ether;
    uint256 public constant LINE_4_5_PRICE = 0.00222 ether;
    
    // Complete P5.js algorithm embedded in contract
    string public constant RUG_ALGORITHM = unicode"function setup(){noiseSeed(seed);window.initPRNG=function(seed){window.prngSeed=seed%2147483647;if(window.prngSeed<=0)window.prngSeed+=2147483646};window.prngNext=function(){window.prngSeed=(window.prngSeed*16807)%2147483647;return(window.prngSeed-1)/2147483646};window.prngRange=function(min,max){return min+window.prngNext()*(max-min)};window.prngChoice=function(array){return array[Math.floor(window.prngNext()*array.length)]};window.initPRNG(seed);let canvas=createCanvas(h+(f*4),w+(f*4));canvas.parent('canvas-container');pixelDensity(2.5);updateTextColors();generateTextData();noLoop()}function updateTextColors(){if(!p||!p.colors)return;let d=p.colors[0],l=p.colors[0],dv=999,lv=-1;for(let hex of p.colors){let c=color(hex),b=(red(c)+green(c)+blue(c))/3;if(b<dv){dv=b;d=hex}if(b>lv){lv=b;l=hex}}dt=lerpColor(color(d),color(0),0.4);lt=lerpColor(color(l),color(255),0.3)}function draw(){background(222,222,222);push();translate(width/2,height/2);rotate(PI/2);translate(-height/2,-width/2);push();translate(f*2,f*2);for(let stripe of sd)drawStripe(stripe);if(stex&&tl>0)drawTextureOverlayWithLevel(Math.floor(tl));pop();drawFringe();if(sdirt&&dl>0)drawDirtOverlay(Math.floor(dl));pop()}function drawStripe(s){let ws=wp+1,we=wt+1;for(let x=0;x<w;x+=ws){for(let y=s.y;y<s.y+s.height;y+=we){let wc=color(s.primaryColor),itp=false;if(td.length>0){for(let tp of td){if(x>=tp.x&&x<tp.x+tp.width&&y>=tp.y&&y<tp.y+tp.height){itp=true;break}}}let r=red(wc)+window.prngRange(-15,15),g=green(wc)+window.prngRange(-15,15),b=blue(wc)+window.prngRange(-15,15);if(itp){const bb=(r+g+b)/3;let tc=bb<128?lt:dt;r=red(tc);g=green(tc);b=blue(tc)}r=constrain(r,0,255);g=constrain(g,0,255);b=constrain(b,0,255);fill(r,g,b);noStroke();let wcv=sin(y*0.05)*0.5;rect(x+wcv,y,wp,we)}}for(let y=s.y;y<s.y+s.height;y+=we){for(let x=0;x<w;x+=ws){let wc=color(s.primaryColor),itp=false;if(td.length>0){for(let tp of td){if(x>=tp.x&&x<tp.x+tp.width&&y>=tp.y&&y<tp.y+tp.height){itp=true;break}}}if(s.weaveType==='mixed'&&s.secondaryColor){if(noise(x*0.1,y*0.1)>0.5)wc=color(s.secondaryColor)}else if(s.weaveType==='textured'){let nv=noise(x*0.05,y*0.05);wc=lerpColor(color(s.primaryColor),color(255),nv*0.15)}let r=red(wc)+window.prngRange(-20,20),g=green(wc)+window.prngRange(-20,20),b=blue(wc)+window.prngRange(-20,20);if(itp){const bb=(r+g+b)/3;let tc=bb<128?lt:dt;r=red(tc);g=green(tc);b=blue(tc)}r=constrain(r,0,255);g=constrain(g,0,255);b=constrain(b,0,255);fill(r,g,b);noStroke();let wcv=cos(x*0.05)*0.5;rect(x,y+wcv,ws,wt)}}for(let y=s.y;y<s.y+s.height;y+=we*2){for(let x=0;x<w;x+=ws*2){fill(0,0,0,40);noStroke();rect(x+1,y+1,ws-2,we-2)}}for(let y=s.y+we;y<s.y+s.height;y+=we*2){for(let x=ws;x<w;x+=ws*2){fill(255,255,255,30);noStroke();rect(x,y,ws-1,we-1)}}}function drawTextureOverlayWithLevel(tl){const hi=tl===1?30:80,ri=tl===1?20:40,rt=tl===1?0.6:0.5;push();blendMode(MULTIPLY);for(let x=0;x<w;x+=2){for(let y=0;y<h;y+=2){let nv=noise(x*0.02,y*0.02),i=map(nv,0,1,0,hi);fill(0,0,0,i);noStroke();rect(x,y,2,2)}}for(let x=0;x<w;x+=6){for(let y=0;y<h;y+=6){let rn=noise(x*0.03,y*0.03);if(rn>rt){fill(255,255,255,ri);noStroke();rect(x,y,6,6)}else if(rn<(1-rt)){fill(0,0,0,ri*0.8);noStroke();rect(x,y,6,6)}}}if(tl===2){for(let x=0;x<w;x+=8){for(let y=0;y<h;y+=8){let wn=noise(x*0.01,y*0.01);if(wn>0.7){fill(0,0,0,15);noStroke();rect(x,y,8,2)}}}}pop()}function drawDirtOverlay(dl){const di=dl===1?0.5:1.0,doo=dl===1?30:60;push();translate(f*2,f*2);for(let x=0;x<w;x+=3){for(let y=0;y<h;y+=3){const dn=window.prngRange(0,1),dt=0.85*di;if(dn>dt){const ds=window.prngRange(1,4),da=window.prngRange(doo*0.5,doo),dr=window.prngRange(60,90),dg=window.prngRange(40,60),db=window.prngRange(20,40);fill(dr,dg,db,da);noStroke();ellipse(x,y,ds,ds)}}}for(let i=0;i<15*di;i++){const sx=window.prngRange(0,w),sy=window.prngRange(0,h),ss=window.prngRange(8,20),sa=window.prngRange(doo*0.3,doo*0.7),sr=window.prngRange(40,70),sg=window.prngRange(25,45),sb=window.prngRange(15,30);fill(sr,sg,sb,sa);noStroke();ellipse(sx,sy,ss,ss)}for(let x=0;x<w;x+=2){for(let y=0;y<h;y+=2){const ed=Math.min(x,y,w-x,h-y);if(ed<10){const edirt=window.prngRange(0,1);if(edirt>0.7*di){const ea=window.prngRange(10,25);fill(80,50,20,ea);noStroke();rect(x,y,2,2)}}}}pop()}function drawFringe(){drawFringeSection(f*2,f,w,f,'top');drawFringeSection(f*2,f*2+h,w,f,'bottom');drawSelvedgeEdges()}function drawFringeSection(x,y,w,h,side){let fs=w/12,sw=w/fs;for(let i=0;i<fs;i++){let sx=x+i*sw;if(!p||!p.colors)return;let sc=window.prngChoice(p.colors);for(let j=0;j<12;j++){let tx=sx+window.prngRange(-sw/6,sw/6),sy=side==='top'?y+h:y,ey=side==='top'?y:y+h,wa=window.prngRange(1,4),wf=window.prngRange(0.2,0.8),d=window.prngChoice([-1,1]),ci=window.prngRange(0.5,2.0),tl=window.prngRange(0.8,1.2),fc=color(sc),r=red(fc)*0.7,g=green(fc)*0.7,b=blue(fc)*0.7;stroke(r,g,b);strokeWeight(window.prngRange(0.5,1.2));noFill();beginShape();for(let t=0;t<=1;t+=0.1){let yp=lerp(sy,ey,t*tl),xo=sin(t*PI*wf)*wa*t*d*ci;xo+=window.prngRange(-1,1);if(window.prngNext()<0.3)xo+=window.prngRange(-2,2);vertex(tx+xo,yp)}endShape()}}}function drawSelvedgeEdges(){let ws=wt+1,iff=true,il=false;for(let s of sd){for(let y=s.y;y<s.y+s.height;y+=ws){if(iff){iff=false;continue}if(s===sd[sd.length-1]&&y+ws>=s.y+s.height){il=true;continue}let sc=color(s.primaryColor);if(s.secondaryColor&&s.weaveType==='mixed'){let sc2=color(s.secondaryColor),bf=noise(y*0.1)*0.5+0.5;sc=lerpColor(sc,sc2,bf)}let r=red(sc)*0.8,g=green(sc)*0.8,b=blue(sc)*0.8;fill(r,g,b);noStroke();let rad=wt*window.prngRange(1.2,1.8),cx=f*2+window.prngRange(-2,2),cy=f*2+y+wt/2+window.prngRange(-1,1),sa=HALF_PI+window.prngRange(-0.2,0.2),ea=-HALF_PI+window.prngRange(-0.2,0.2);drawTexturedSelvedgeArc(cx,cy,rad,sa,ea,r,g,b,'left')}}let ifwr=true,ilwr=false;for(let s of sd){for(let y=s.y;y<s.y+s.height;y+=ws){if(ifwr){ifwr=false;continue}if(s===sd[sd.length-1]&&y+ws>=s.y+s.height){ilwr=true;continue}let sc=color(s.primaryColor);if(s.secondaryColor&&s.weaveType==='mixed'){let sc2=color(s.secondaryColor),bf=noise(y*0.1)*0.5+0.5;sc=lerpColor(sc,sc2,bf)}let r=red(sc)*0.8,g=green(sc)*0.8,b=blue(sc)*0.8;fill(r,g,b);noStroke();let rad=wt*window.prngRange(1.2,1.8),cx=f*2+w+window.prngRange(-2,2),cy=f*2+y+wt/2+window.prngRange(-1,1),sa=-HALF_PI+window.prngRange(-0.2,0.2),ea=HALF_PI+window.prngRange(-0.2,0.2);drawTexturedSelvedgeArc(cx,cy,rad,sa,ea,r,g,b,'right')}}}function drawTexturedSelvedgeArc(cx,cy,rad,sa,ea,r,g,b,s){let tc=max(6,floor(rad/1.2)),ts=rad/tc;for(let i=0;i<tc;i++){let tr=rad-(i*ts),trr,trg,tb;if(i%2===0){trr=constrain(r+25,0,255);trg=constrain(g+25,0,255);tb=constrain(b+25,0,255)}else{trr=constrain(r-20,0,255);trg=constrain(g-20,0,255);tb=constrain(b-20,0,255)}trr=constrain(trr+window.prngRange(-10,10),0,255);trg=constrain(trg+window.prngRange(-10,10),0,255);tb=constrain(tb+window.prngRange(-10,10),0,255);fill(trr,trg,tb,88);let tx=cx+window.prngRange(-1,1),ty=cy+window.prngRange(-1,1),tsa=sa+window.prngRange(-0.1,0.1),tea=ea+window.prngRange(-0.1,0.1);arc(tx,ty,tr*2,tr*2,tsa,tea)}for(let i=0;i<3;i++){let dr=rad*(0.3+i*0.2),da=180-(i*40),drr=constrain(r+(i%2===0?15:-15),0,255),dg=constrain(g+(i%2===0?15:-15),0,255),db=constrain(b+(i%2===0?15:-15),0,255);fill(drr,dg,db,da*0.7);let dx=cx+window.prngRange(-0.5,0.5),dy=cy+window.prngRange(-0.5,0.5),dsa=sa+window.prngRange(-0.05,0.05),dea=ea+window.prngRange(-0.05,0.05);arc(dx,dy,dr*2,dr*2,dsa,dea)}fill(r*0.6,g*0.6,b*0.6,70);let so=s==='left'?1:-1;arc(cx+so,cy+1,rad*2,rad*2,sa,ea);noFill();arc(cx,cy,rad*0.5,rad*0.5,sa,ea);for(let i=0;i<8;i++){let da=window.prngRange(sa,ea),dr=rad*window.prngRange(0.2,0.7),dx=cx+cos(da)*dr,dy=cy+sin(da)*dr;if(i%2===0){fill(r+20,g+20,b+20,120)}else{fill(r-15,g-15,b-15,120)}noStroke();ellipse(dx,dy,window.prngRange(1.5,3.5),window.prngRange(1.5,3.5))}}function generateTextData(){td=[];const trr=tr||[];if(!trr||trr.length===0)return;const netr=trr.filter(row=>row&&row.trim()!=='');if(netr.length===0)return;const ws=wp+1,we=wt+1,sw=ws*ts,se=we*ts,cw=7*sw,ch=5*se,s=se,rs=cw*1.5,trw=netr.length*cw+(netr.length-1)*rs,bsx=(w-trw)/2;let cri=0;for(let ri=0;ri<trr.length;ri++){const rt=trr[ri];if(!rt||rt.trim()==='')continue;const tw=cw,th=rt.length*(ch+s)-s,sx=bsx+cri*(cw+rs),sy=(h-th)/2;for(let i=0;i<rt.length;i++){const c=rt.charAt(i),cy=sy+(rt.length-1-i)*(ch+s),cp=generateCharacterPixels(c,sx,cy,tw,ch);td.push(...cp)}cri++}}function generateCharacterPixels(c,x,y,w,h){const p=[];const ws=wp+1,we=wt+1,sw=ws*ts,se=we*ts,cd=cm[c.toUpperCase()]||cm[' '],nr=cd.length,nc=cd[0].length;for(let r=0;r<nr;r++){for(let col=0;col<nc;col++){if(cd[r][col]==='1'){const ncol=r,nrow=nc-1-col;p.push({x:x+ncol*sw,y:y+nrow*se,width:sw,height:se})}}}return p}";
    
    // Rug data storage
    struct RugData {
        uint256 seed;
        string palette;
        string[] textRows;
        string characterMap;
        uint256 mintTime;
        uint256 warpThickness;
        bool showDirt;
        uint8 dirtLevel;
        bool showTexture;
        uint8 textureLevel;
    }
    
    // Aging data storage
    struct AgingData {
        uint256 lastCleaned;
        uint256 lastSalePrice;
        bool isDirty;
        uint8 dirtLevel;
        bool hasTexture;
        uint8 textureLevel;
    }
    
    // State variables
    uint256 private _tokenIdCounter;
    mapping(uint256 => RugData) public rugs;
    mapping(uint256 => AgingData) public agingData;
    mapping(string => bool) public usedTextHashes;
    
    // Events
    event RugMinted(uint256 indexed tokenId, uint256 seed, string[] textRows);
    event RugCleaned(uint256 indexed tokenId, uint256 cost);
    event TextUsed(string indexed textHash);
    
    constructor() ERC721("Onchain Rugs", "RUG") Ownable(msg.sender) {}
    
    /**
     * @dev Mint a new rug with complete data from website
     * @param textRows Array of text lines for the rug
     * @param palette JSON string of selected palette
     * @param stripeData JSON string of generated stripe patterns
     * @param characterMap JSON string of used characters only
     * @param warpThickness Weave thickness parameter
     */
    function mintWithText(
        string[] memory textRows,
        uint256 seed,
        string memory palette,
        string memory characterMap,
        uint256 warpThickness,
        bool showDirt,
        uint8 dirtLevel,
        bool showTexture,
        uint8 textureLevel
    ) external payable {
        require(_tokenIdCounter < MAX_SUPPLY, "Max supply reached");
        
        // Calculate and validate pricing
        uint256 price = calculateMintingPrice(textRows);
        require(msg.value >= price, "Insufficient payment");
        
        // Check text uniqueness
        require(isTextAvailable(textRows), "Text already used");
        
        // Mark text as used
        markTextAsUsed(textRows);
        
        // Use provided seed (no need to generate)
        
        // Get current token ID
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Store rug data
        rugs[tokenId] = RugData({
            seed: seed,
            palette: palette,
            textRows: textRows,
            characterMap: characterMap,
            mintTime: block.timestamp,
            warpThickness: warpThickness,
            showDirt: showDirt,
            dirtLevel: dirtLevel,
            showTexture: showTexture,
            textureLevel: textureLevel
        });
        
        // Initialize aging data
        agingData[tokenId] = AgingData({
            lastCleaned: 0,
            lastSalePrice: 0,
            isDirty: false,
            dirtLevel: 0,
            hasTexture: false,
            textureLevel: 0
        });
        
        // Mint NFT
        _safeMint(msg.sender, tokenId);
        
        emit RugMinted(tokenId, seed, textRows);
    }
    
    /**
     * @dev Calculate minting price based on text lines
     * @param textRows Array of text lines
     * @return Total price in wei
     */
    function calculateMintingPrice(string[] memory textRows) 
        public 
        pure 
        returns (uint256) 
    {
        uint256 totalPrice = BASE_PRICE; // Base price for any mint
        
        if (textRows.length <= 1) return totalPrice; // Just base price
        
        for (uint256 i = 1; i < textRows.length; i++) {
            if (i == 1 || i == 2) { // Lines 2-3
                totalPrice += LINE_2_3_PRICE;
            } else if (i == 3 || i == 4) { // Lines 4-5
                totalPrice += LINE_4_5_PRICE;
            }
        }
        
        return totalPrice;
    }
    
    /**
     * @dev Generate deterministic seed from text and minter
     * @param textRows Array of text lines
     * @param minter Address of the minter
     * @return Deterministic seed
     */
    function generateSeed(string[] memory textRows, address minter) 
        internal 
        pure 
        returns (uint256) 
    {
        bytes32 hash = keccak256(abi.encode(textRows, minter));
        return uint256(hash);
    }
    
    /**
     * @dev Check if text is available (not used before)
     * @param textRows Array of text lines
     * @return True if text is available
     */
    function isTextAvailable(string[] memory textRows) 
        public 
        view 
        returns (bool) 
    {
        string memory textHash = hashTextLines(textRows);
        return !usedTextHashes[textHash];
    }
    
    /**
     * @dev Mark text as used
     * @param textRows Array of text lines
     */
    function markTextAsUsed(string[] memory textRows) internal {
        string memory textHash = hashTextLines(textRows);
        usedTextHashes[textHash] = true;
        emit TextUsed(textHash);
    }
    
    /**
     * @dev Hash text lines to ensure uniqueness
     * @param textRows Array of text lines
     * @return Hash of the text lines
     */
    function hashTextLines(string[] memory textRows) 
        internal 
        pure 
        returns (string memory) 
    {
        bytes32 hash = keccak256(abi.encode(textRows));
        return Strings.toHexString(uint256(hash));
    }
    
    /**
     * @dev Calculate current aging state
     * @param tokenId Token ID
     * @return showDirt Whether to show dirt overlay
     * @return dirtLevel Current dirt level (0-2)
     * @return showTexture Whether to show texture overlay
     * @return textureLevel Current texture level (0-2)
     */
    function calculateAgingState(uint256 tokenId) 
        public 
        view 
        returns (bool showDirt, uint8 dirtLevel, bool showTexture, uint8 textureLevel) 
    {
        RugData memory rug = rugs[tokenId];
        AgingData memory aging = agingData[tokenId];
        
        uint256 currentTime = block.timestamp;
        uint256 timeSinceMint = currentTime - rug.mintTime;
        uint256 timeSinceCleaned = aging.lastCleaned > 0 ? currentTime - aging.lastCleaned : timeSinceMint;
        
        // Dirt Logic
        if (timeSinceCleaned > 7 days) {
            showDirt = true;
            dirtLevel = 2; // Heavy dirt
        } else if (timeSinceCleaned > 3 days) {
            showDirt = true;
            dirtLevel = 1; // Light dirt
        } else {
            showDirt = false;
            dirtLevel = 0; // Clean
        }
        
        // Texture Logic
        if (timeSinceMint > 30 days) {
            showTexture = true;
            textureLevel = 2; // Heavy texture
        } else if (timeSinceMint > 7 days) {
            showTexture = true;
            textureLevel = 1; // Moderate texture
        } else {
            showTexture = false;
            textureLevel = 0; // Smooth
        }
    }
    
    /**
     * @dev Generate complete HTML with embedded algorithm and NFT data
     * @param tokenId Token ID
     * @return Complete HTML as data URI
     */
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override(ERC721, ERC721URIStorage) 
        returns (string memory) 
    {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        
        RugData memory rug = rugs[tokenId];
        (bool showDirt, uint8 dirtLevel, bool showTexture, uint8 textureLevel) = calculateAgingState(tokenId);
        
        // Encode text rows as JavaScript array
        string memory textArray = encodeTextRows(rug.textRows);
        
        // Generate complete HTML
        string memory html = string(abi.encodePacked(
            '<!DOCTYPE html><html><head>',
            '<meta charset="UTF-8">',
            '<meta name="viewport" content="width=device-width,initial-scale=1">',
            '<title>Onchain Rug #', tokenId.toString(), '</title>',
            '<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>',
            '<style>body{margin:0;padding:0;background:#f0f0f0;display:flex;justify-content:center;align-items:center;min-height:100vh}</style>',
            '</head><body><div id="canvas-container"></div><script>',
            
            // Algorithm (same for all NFTs)
            RUG_ALGORITHM,
            
            // This NFT's specific data
            'let seed = ', rug.seed.toString(), ';',
            'let p = ', rug.palette, ';',
            'let sd = ', rug.stripeData, ';',
            'let tr = ', textArray, ';',
            'let cm = ', rug.characterMap, ';',
            'let wp = ', rug.warpThickness.toString(), ';',
            'let sdirt = ', showDirt ? 'true' : 'false', ';',
            'let dl = ', uint256(dirtLevel).toString(), ';',
            'let stex = ', showTexture ? 'true' : 'false', ';',
            'let tl = ', uint256(textureLevel).toString(), ';',
            
            // Initialize with this NFT's data
            'noiseSeed(seed); window.initPRNG(seed);',
            '</script></body></html>'
        ));
        
        // Return as data URI
        return string(abi.encodePacked(
            'data:text/html;base64,',
            Base64.encode(bytes(html))
        ));
    }
    
    /**
     * @dev Encode text rows as JavaScript array
     * @param textRows Array of text rows
     * @return JavaScript array string
     */
    function encodeTextRows(string[] memory textRows) 
        internal 
        pure 
        returns (string memory) 
    {
        if (textRows.length == 0) {
            return "[]";
        }
        
        string memory result = "[";
        for (uint256 i = 0; i < textRows.length; i++) {
            if (i > 0) {
                result = string(abi.encodePacked(result, ","));
            }
            result = string(abi.encodePacked(result, '"', textRows[i], '"'));
        }
        result = string(abi.encodePacked(result, "]"));
        
        return result;
    }
    
    /**
     * @dev Clean a rug (reset dirt level)
     * @param tokenId Token ID
     */
    function cleanRug(uint256 tokenId) external payable {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        
        uint256 cleaningCost = getCleaningCost(tokenId);
        require(msg.value >= cleaningCost, "Insufficient payment for cleaning");
        
        AgingData storage aging = agingData[tokenId];
        aging.lastCleaned = block.timestamp;
        aging.isDirty = false;
        aging.dirtLevel = 0;
        
        emit RugCleaned(tokenId, cleaningCost);
    }
    
    /**
     * @dev Get cleaning cost for a rug
     * @param tokenId Token ID
     * @return Cleaning cost in wei
     */
    function getCleaningCost(uint256 tokenId) public view returns (uint256) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        
        RugData memory rug = rugs[tokenId];
        uint256 timeSinceMint = block.timestamp - rug.mintTime;
        
        // Free for first 30 days, then paid
        if (timeSinceMint < 30 days) {
            return 0; // Free cleaning
        } else {
            return 0.1 ether; // Paid cleaning (TBD)
        }
    }
    
    /**
     * @dev Handle laundering (higher sale price cleans rug)
     * @param tokenId Token ID
     * @param newPrice New sale price
     */
    function handleLaundering(uint256 tokenId, uint256 newPrice) external {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        
        AgingData storage aging = agingData[tokenId];
        
        // If new price is higher than last sale, clean the rug
        if (newPrice > aging.lastSalePrice) {
            aging.lastCleaned = block.timestamp;
            aging.lastSalePrice = newPrice;
            aging.isDirty = false;
            aging.dirtLevel = 0;
        }
    }
    
    /**
     * @dev Get current supply
     * @return Current number of minted tokens
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Withdraw contract balance
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    // Required overrides
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
