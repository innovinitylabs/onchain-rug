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
    
    // Constants (Immutable)
    uint256 public constant MAX_SUPPLY = 1111;
    
    // Upgradeable Parameters (Owner can change)
    uint256 public royaltyPercentage = 1000; // 10% (1000 basis points)
    address public royaltyRecipient;
    
    // Pricing (Owner can adjust) - Low prices for testing
    uint256 public basePrice = 0.0000001 ether;
    uint256 public line2to3Price = 0.0000001 ether;
    uint256 public line4to5Price = 0.0000001 ether;
    uint256 public cleaningCost = 0.0000001 ether;
    
    // Aging System (Owner can adjust)
    uint256 public freeCleaningPeriod = 30 days;
    uint256 public moderateTextureDays = 30 days;
    uint256 public heavyTextureDays = 90 days;
    
    // Art Algorithm (Owner can upgrade) - Proper algorithm from rug-algorithm-ultra-minimal.js
    string public rugAlgorithm = unicode"function setup(){noiseSeed(seed);window.initPRNG=function(seed){window.prngSeed=seed%2147483647;if(window.prngSeed<=0)window.prngSeed+=2147483646};window.prngNext=function(){window.prngSeed=(window.prngSeed*16807)%2147483647;return(window.prngSeed-1)/2147483646};window.prngRange=function(min,max){return min+window.prngNext()*(max-min)};window.prngChoice=function(array){return array[Math.floor(window.prngNext()*array.length)]};window.initPRNG(seed);let canvas=createCanvas(h+(f*4),w+(f*4));canvas.parent('canvas-container');pixelDensity(2.5);updateTextColors();generateTextData();noLoop()}function updateTextColors(){if(!p||!p.colors)return;let d=p.colors[0],l=p.colors[0],dv=999,lv=-1;for(let hex of p.colors){let c=color(hex),b=(red(c)+green(c)+blue(c))/3;if(b<dv){dv=b;d=hex}if(b>lv){lv=b;l=hex}}dt=lerpColor(color(d),color(0),0.4);lt=lerpColor(color(l),color(255),0.3)}function draw(){background(222,222,222);push();translate(width/2,height/2);rotate(PI/2);translate(-height/2,-width/2);push();translate(f*2,f*2);for(let stripe of sd)drawStripe(stripe);if(stex&&tl>0)drawTextureOverlayWithLevel(Math.floor(tl));pop();drawFringe();if(sdirt&&dl>0)drawDirtOverlay(Math.floor(dl));pop()}function drawStripe(s){let ws=wp+1,we=wt+1;for(let x=0;x<w;x+=ws){for(let y=s.y;y<s.y+s.height;y+=we){let wc=color(s.primaryColor),itp=false;if(td.length>0){for(let tp of td){if(x>=tp.x&&x<tp.x+tp.width&&y>=tp.y&&y<tp.y+tp.height){itp=true;break}}}let r=red(wc)+window.prngRange(-15,15),g=green(wc)+window.prngRange(-15,15),b=blue(wc)+window.prngRange(-15,15);if(itp){const bb=(r+g+b)/3;let tc=bb<128?lt:dt;r=red(tc);g=green(tc);b=blue(tc)}r=constrain(r,0,255);g=constrain(g,0,255);b=constrain(b,0,255);fill(r,g,b);noStroke();let wcv=sin(y*0.05)*0.5;rect(x+wcv,y,wp,we)}}for(let y=s.y;y<s.y+s.height;y+=we){for(let x=0;x<w;x+=ws){let wc=color(s.primaryColor),itp=false;if(td.length>0){for(let tp of td){if(x>=tp.x&&x<tp.x+tp.width&&y>=tp.y&&y<tp.y+tp.height){itp=true;break}}}if(s.weaveType==='mixed'&&s.secondaryColor){if(noise(x*0.1,y*0.1)>0.5)wc=color(s.secondaryColor)}else if(s.weaveType==='textured'){let nv=noise(x*0.05,y*0.05);wc=lerpColor(color(s.primaryColor),color(255),nv*0.15)}let r=red(wc)+window.prngRange(-20,20),g=green(wc)+window.prngRange(-20,20),b=blue(wc)+window.prngRange(-20,20);if(itp){const bb=(r+g+b)/3;let tc=bb<128?lt:dt;r=red(tc);g=green(tc);b=blue(tc)}r=constrain(r,0,255);g=constrain(g,0,255);b=constrain(b,0,255);fill(r,g,b);noStroke();let wcv=cos(x*0.05)*0.5;rect(x,y+wcv,ws,wt)}}for(let y=s.y;y<s.y+s.height;y+=we*2){for(let x=0;x<w;x+=ws*2){fill(0,0,0,40);noStroke();rect(x+1,y+1,ws-2,we-2)}}for(let y=s.y+we;y<s.y+s.height;y+=we*2){for(let x=ws;x<w;x+=ws*2){fill(255,255,255,30);noStroke();rect(x,y,ws-1,we-1)}}}function drawTextureOverlayWithLevel(tl){const hi=tl===1?30:80,ri=tl===1?20:40,rt=tl===1?0.6:0.5;push();blendMode(MULTIPLY);for(let x=0;x<w;x+=2){for(let y=0;y<h;y+=2){let nv=noise(x*0.02,y*0.02),i=map(nv,0,1,0,hi);fill(0,0,0,i);noStroke();rect(x,y,2,2)}}for(let x=0;x<w;x+=6){for(let y=0;y<h;y+=6){let rn=noise(x*0.03,y*0.03);if(rn>rt){fill(255,255,255,ri);noStroke();rect(x,y,6,6)}else if(rn<(1-rt)){fill(0,0,0,ri*0.8);noStroke();rect(x,y,6,6)}}}if(tl===2){for(let x=0;x<w;x+=8){for(let y=0;y<h;y+=8){let wn=noise(x*0.01,y*0.01);if(wn>0.7){fill(0,0,0,15);noStroke();rect(x,y,8,2)}}}}pop()}function drawDirtOverlay(dl){const di=dl===1?0.5:1.0,doo=dl===1?30:60;push();translate(f*2,f*2);for(let x=0;x<w;x+=3){for(let y=0;y<h;y+=3){const dn=window.prngRange(0,1),dt=0.85*di;if(dn>dt){const ds=window.prngRange(1,4),da=window.prngRange(doo*0.5,doo),dr=window.prngRange(60,90),dg=window.prngRange(40,60),db=window.prngRange(20,40);fill(dr,dg,db,da);noStroke();ellipse(x,y,ds,ds)}}}for(let i=0;i<15*di;i++){const sx=window.prngRange(0,w),sy=window.prngRange(0,h),ss=window.prngRange(8,20),sa=window.prngRange(doo*0.3,doo*0.7),sr=window.prngRange(40,70),sg=window.prngRange(25,45),sb=window.prngRange(15,30);fill(sr,sg,sb,sa);noStroke();ellipse(sx,sy,ss,ss)}for(let x=0;x<w;x+=2){for(let y=0;y<h;y+=2){const ed=Math.min(x,y,w-x,h-y);if(ed<10){const edirt=window.prngRange(0,1);if(edirt>0.7*di){const ea=window.prngRange(10,25);fill(80,50,20,ea);noStroke();rect(x,y,2,2)}}}}pop()}function drawFringe(){drawFringeSection(f*2,f,w,f,'top');drawFringeSection(f*2,f*2+h,w,f,'bottom');drawSelvedgeEdges()}function drawFringeSection(x,y,w,h,side){let fs=w/12,sw=w/fs;for(let i=0;i<fs;i++){let sx=x+i*sw;if(!p||!p.colors)return;let sc=window.prngChoice(p.colors);for(let j=0;j<12;j++){let tx=sx+window.prngRange(-sw/6,sw/6),sy=side==='top'?y+h:y,ey=side==='top'?y:y+h,wa=window.prngRange(1,4),wf=window.prngRange(0.2,0.8),d=window.prngChoice([-1,1]),ci=window.prngRange(0.5,2.0),tl=window.prngRange(0.8,1.2),fc=color(sc),r=red(fc)*0.7,g=green(fc)*0.7,b=blue(fc)*0.7;stroke(r,g,b);strokeWeight(window.prngRange(0.5,1.2));noFill();beginShape();for(let t=0;t<=1;t+=0.1){let yp=lerp(sy,ey,t*tl),xo=sin(t*PI*wf)*wa*t*d*ci;xo+=window.prngRange(-1,1);if(window.prngNext()<0.3)xo+=window.prngRange(-2,2);vertex(tx+xo,yp)}endShape()}}}function drawSelvedgeEdges(){let ws=wt+1,iff=true,il=false;for(let s of sd){for(let y=s.y;y<s.y+s.height;y+=ws){if(iff){iff=false;continue}if(s===sd[sd.length-1]&&y+ws>=s.y+s.height){il=true;continue}let sc=color(s.primaryColor);if(s.secondaryColor&&s.weaveType==='mixed'){let sc2=color(s.secondaryColor),bf=noise(y*0.1)*0.5+0.5;sc=lerpColor(sc,sc2,bf)}let r=red(sc)*0.8,g=green(sc)*0.8,b=blue(sc)*0.8;fill(r,g,b);noStroke();let rad=wt*window.prngRange(1.2,1.8),cx=f*2+window.prngRange(-2,2),cy=f*2+y+wt/2+window.prngRange(-1,1),sa=HALF_PI+window.prngRange(-0.2,0.2),ea=-HALF_PI+window.prngRange(-0.2,0.2);drawTexturedSelvedgeArc(cx,cy,rad,sa,ea,r,g,b,'left')}}let ifwr=true,ilwr=false;for(let s of sd){for(let y=s.y;y<s.y+s.height;y+=ws){if(ifwr){ifwr=false;continue}if(s===sd[sd.length-1]&&y+ws>=s.y+s.height){ilwr=true;continue}let sc=color(s.primaryColor);if(s.secondaryColor&&s.weaveType==='mixed'){let sc2=color(s.secondaryColor),bf=noise(y*0.1)*0.5+0.5;sc=lerpColor(sc,sc2,bf)}let r=red(sc)*0.8,g=green(sc)*0.8,b=blue(sc)*0.8;fill(r,g,b);noStroke();let rad=wt*window.prngRange(1.2,1.8),cx=f*2+w+window.prngRange(-2,2),cy=f*2+y+wt/2+window.prngRange(-1,1),sa=-HALF_PI+window.prngRange(-0.2,0.2),ea=HALF_PI+window.prngRange(-0.2,0.2);drawTexturedSelvedgeArc(cx,cy,rad,sa,ea,r,g,b,'right')}}}function drawTexturedSelvedgeArc(cx,cy,rad,sa,ea,r,g,b,s){let tc=max(6,floor(rad/1.2)),ts=rad/tc;for(let i=0;i<tc;i++){let tr=rad-(i*ts),trr,trg,tb;if(i%2===0){trr=constrain(r+25,0,255);trg=constrain(g+25,0,255);tb=constrain(b+25,0,255)}else{trr=constrain(r-20,0,255);trg=constrain(g-20,0,255);tb=constrain(b-20,0,255)}trr=constrain(trr+window.prngRange(-10,10),0,255);trg=constrain(trg+window.prngRange(-10,10),0,255);tb=constrain(tb+window.prngRange(-10,10),0,255);fill(trr,trg,tb,88);let tx=cx+window.prngRange(-1,1),ty=cy+window.prngRange(-1,1),tsa=sa+window.prngRange(-0.1,0.1),tea=ea+window.prngRange(-0.1,0.1);arc(tx,ty,tr*2,tr*2,tsa,tea)}for(let i=0;i<3;i++){let dr=rad*(0.3+i*0.2),da=180-(i*40),drr=constrain(r+(i%2===0?15:-15),0,255),dg=constrain(g+(i%2===0?15:-15),0,255),db=constrain(b+(i%2===0?15:-15),0,255);fill(drr,dg,db,da*0.7);let dx=cx+window.prngRange(-0.5,0.5),dy=cy+window.prngRange(-0.5,0.5),dsa=sa+window.prngRange(-0.05,0.05),dea=ea+window.prngRange(-0.05,0.05);arc(dx,dy,dr*2,dr*2,dsa,dea)}fill(r*0.6,g*0.6,b*0.6,70);let so=s==='left'?1:-1;arc(cx+so,cy+1,rad*2,rad*2,sa,ea);noFill();arc(cx,cy,rad*0.5,rad*0.5,sa,ea);for(let i=0;i<8;i++){let da=window.prngRange(sa,ea),dr=rad*window.prngRange(0.2,0.7),dx=cx+cos(da)*dr,dy=cy+sin(da)*dr;if(i%2===0){fill(r+20,g+20,b+20,120)}else{fill(r-15,g-15,b-15,120)}noStroke();ellipse(dx,dy,window.prngRange(1.5,3.5),window.prngRange(1.5,3.5))}}function generateTextData(){td=[];const trr=tr||[];if(!trr||trr.length===0)return;const netr=trr.filter(row=>row&&row.trim()!=='');if(netr.length===0)return;const ws=wp+1,we=wt+1,sw=ws*ts,se=we*ts,cw=7*sw,ch=5*se,s=se,rs=cw*1.5,trw=netr.length*cw+(netr.length-1)*rs,bsx=(w-trw)/2;let cri=0;for(let ri=0;ri<trr.length;ri++){const rt=trr[ri];if(!rt||rt.trim()==='')continue;const tw=cw,th=rt.length*(ch+s)-s,sx=bsx+cri*(cw+rs),sy=(h-th)/2;for(let i=0;i<rt.length;i++){const c=rt.charAt(i),cy=sy+(rt.length-1-i)*(ch+s),cp=generateCharacterPixels(c,sx,cy,tw,ch);td.push(...cp)}cri++}}function generateCharacterPixels(c,x,y,w,h){const p=[];const ws=wp+1,we=wt+1,sw=ws*ts,se=we*ts,cd=window.characterMap[c.toUpperCase()]||window.characterMap[' '],nr=cd.length,nc=cd[0].length;for(let r=0;r<nr;r++){for(let col=0;col<nc;col++){if(cd[r][col]==='1'){const ncol=r,nrow=nc-1-col;p.push({x:x+ncol*sw,y:y+nrow*se,width:sw,height:se})}}}return p}";
    
    // Global Character Map (stored once in contract, referenced by all NFTs)
    string public globalCharacterMap = unicode"{\"A\":[\"01110\",\"10001\",\"10001\",\"11111\",\"10001\",\"10001\",\"10001\"],\"B\":[\"11110\",\"10001\",\"10001\",\"11110\",\"10001\",\"10001\",\"11110\"],\"C\":[\"01111\",\"10000\",\"10000\",\"10000\",\"10000\",\"10000\",\"01111\"],\"D\":[\"11110\",\"10001\",\"10001\",\"10001\",\"10001\",\"10001\",\"11110\"],\"E\":[\"11111\",\"10000\",\"10000\",\"11110\",\"10000\",\"10000\",\"11111\"],\"F\":[\"11111\",\"10000\",\"10000\",\"11110\",\"10000\",\"10000\",\"10000\"],\"G\":[\"01111\",\"10000\",\"10000\",\"10011\",\"10001\",\"10001\",\"01111\"],\"H\":[\"10001\",\"10001\",\"10001\",\"11111\",\"10001\",\"10001\",\"10001\"],\"I\":[\"11111\",\"00100\",\"00100\",\"00100\",\"00100\",\"00100\",\"11111\"],\"J\":[\"11111\",\"00001\",\"00001\",\"00001\",\"00001\",\"10001\",\"01110\"],\"K\":[\"10001\",\"10010\",\"10100\",\"11000\",\"10100\",\"10010\",\"10001\"],\"L\":[\"10000\",\"10000\",\"10000\",\"10000\",\"10000\",\"10000\",\"11111\"],\"M\":[\"10001\",\"11011\",\"10101\",\"10001\",\"10001\",\"10001\",\"10001\"],\"N\":[\"10001\",\"11001\",\"10101\",\"10011\",\"10001\",\"10001\",\"10001\"],\"O\":[\"01110\",\"10001\",\"10001\",\"10001\",\"10001\",\"10001\",\"01110\"],\"P\":[\"11110\",\"10001\",\"10001\",\"11110\",\"10000\",\"10000\",\"10000\"],\"Q\":[\"01110\",\"10001\",\"10001\",\"10001\",\"10101\",\"10010\",\"01101\"],\"R\":[\"11110\",\"10001\",\"10001\",\"11110\",\"10100\",\"10010\",\"10001\"],\"S\":[\"01111\",\"10000\",\"10000\",\"01110\",\"00001\",\"00001\",\"11110\"],\"T\":[\"11111\",\"00100\",\"00100\",\"00100\",\"00100\",\"00100\",\"00100\"],\"U\":[\"10001\",\"10001\",\"10001\",\"10001\",\"10001\",\"10001\",\"01110\"],\"V\":[\"10001\",\"10001\",\"10001\",\"10001\",\"10001\",\"01010\",\"00100\"],\"W\":[\"10001\",\"10001\",\"10001\",\"10001\",\"10101\",\"11011\",\"10001\"],\"X\":[\"10001\",\"10001\",\"01010\",\"00100\",\"01010\",\"10001\",\"10001\"],\"Y\":[\"10001\",\"10001\",\"01010\",\"00100\",\"00100\",\"00100\",\"00100\"],\"Z\":[\"11111\",\"00001\",\"00010\",\"00100\",\"01000\",\"10000\",\"11111\"],\" \":[\"00000\",\"00000\",\"00000\",\"00000\",\"00000\",\"00000\",\"00000\"],\"0\":[\"01110\",\"10001\",\"10011\",\"10101\",\"11001\",\"10001\",\"01110\"],\"1\":[\"00100\",\"01100\",\"00100\",\"00100\",\"00100\",\"00100\",\"01110\"],\"2\":[\"01110\",\"10001\",\"00001\",\"00010\",\"00100\",\"01000\",\"11111\"],\"3\":[\"01110\",\"10001\",\"00001\",\"00110\",\"00001\",\"10001\",\"01110\"],\"4\":[\"00010\",\"00110\",\"01010\",\"10010\",\"11111\",\"00010\",\"00010\"],\"5\":[\"11111\",\"10000\",\"10000\",\"11110\",\"00001\",\"00001\",\"11110\"],\"6\":[\"01110\",\"10000\",\"10000\",\"11110\",\"10001\",\"10001\",\"01110\"],\"7\":[\"11111\",\"00001\",\"00010\",\"00100\",\"01000\",\"01000\",\"01000\"],\"8\":[\"01110\",\"10001\",\"10001\",\"01110\",\"10001\",\"10001\",\"01110\"],\"9\":[\"01110\",\"10001\",\"10001\",\"01111\",\"00001\",\"00001\",\"01110\"]}";
    
    // Emergency Controls
    bool public paused = false;
    
    // Rug data storage (optimized - removed redundant fields)
    struct RugData {
        uint256 seed;           // Generation seed for deterministic art
        string palette;         // JSON string of color palette
        string stripeData;      // JSON string of stripe patterns
        string[] textRows;      // Array of text lines
        uint256 warpThickness;  // Weave thickness parameter
        // ❌ Removed: characterMap (now stored globally in contract)
        // ❌ Removed: mintTime (can be queried from blockchain)
        // ❌ Removed: showDirt, dirtLevel (controlled dynamically)
        // ❌ Removed: showTexture, textureLevel (controlled dynamically)
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
    mapping(uint256 => uint256) public mintTimes; // Token ID → Mint timestamp
    mapping(string => bool) public usedTextHashes;
    
    
    // Events
    event RugMinted(uint256 indexed tokenId, uint256 seed, string[] textRows);
    event RugCleaned(uint256 indexed tokenId, uint256 cost);
    event TextUsed(string indexed textHash);
    event ContractPaused();
    event ContractUnpaused();
    event PricingUpdated(uint256 basePrice, uint256 line2to3Price, uint256 line4to5Price, uint256 cleaningCost);
    event AgingUpdated(uint256 freeCleaningPeriod, uint256 moderateTextureDays, uint256 heavyTextureDays);
    event ArtAlgorithmUpdated();
    event RoyaltyUpdated(uint256 percentage, address recipient);
    
    constructor() ERC721("Onchain Rugs", "RUG") Ownable(msg.sender) {
        royaltyRecipient = msg.sender;
    }
    
    // Modifiers
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    /**
     * @dev Mint a new rug with complete data from website
     * @param textRows Array of text lines for the rug
     * @param palette JSON string of selected palette
     * @param stripeData JSON string of generated stripe patterns
     * @param warpThickness Weave thickness parameter
     */
    function mintWithText(
        string[] memory textRows,
        uint256 seed,
        string memory palette,
        string memory stripeData,
        uint256 warpThickness
    ) external payable whenNotPaused {
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
        
        // Store optimized rug data
        rugs[tokenId] = RugData({
            seed: seed,
            palette: palette,
            stripeData: stripeData,
            textRows: textRows,
            warpThickness: warpThickness
            // ❌ Removed: characterMap (now stored globally in contract)
            // ❌ Removed: mintTime (can be queried from blockchain)
            // ❌ Removed: showDirt, dirtLevel (controlled dynamically)
            // ❌ Removed: showTexture, textureLevel (controlled dynamically)
        });
        
        // Store mint time for aging calculations
        mintTimes[tokenId] = block.timestamp;
        
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
        view 
        returns (uint256) 
    {
        uint256 totalPrice = basePrice; // Base price for any mint
        
        if (textRows.length <= 1) return totalPrice; // Just base price
        
        for (uint256 i = 1; i < textRows.length; i++) {
            if (i == 1 || i == 2) { // Lines 2-3
                totalPrice += line2to3Price;
            } else if (i == 3 || i == 4) { // Lines 4-5
                totalPrice += line4to5Price;
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
        AgingData memory aging = agingData[tokenId];
        
        uint256 currentTime = block.timestamp;
        uint256 timeSinceMint = currentTime - mintTimes[tokenId];
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
        if (timeSinceMint > heavyTextureDays) {
            showTexture = true;
            textureLevel = 2; // Heavy texture
        } else if (timeSinceMint > moderateTextureDays) {
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
        
        // Use embedded rendering
        RugData memory rug = rugs[tokenId];
        (bool showDirt, uint8 dirtLevel, bool showTexture, uint8 textureLevel) = calculateAgingState(tokenId);
        
        // Encode text rows as JavaScript array
        string memory textArray = encodeTextRows(rug.textRows);
        
        // Generate complete HTML
        string memory html = string.concat(
            '<!DOCTYPE html><html><head>',
            '<meta charset="UTF-8">',
            '<meta name="viewport" content="width=device-width,initial-scale=1">',
            '<title>Onchain Rug #', tokenId.toString(), '</title>',
            '<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>',
            '<style>body{margin:0;padding:0;background:#f0f0f0;display:flex;justify-content:center;align-items:center;min-height:100vh}</style>',
            '</head><body><div id="canvas-container"></div><script>',
            
            // Constants and variables (like doormat-nft-9667.html)
            'let w=800,h=1200,f=30,wt=8,wp=', rug.warpThickness.toString(), ',ts=2,mc=11,lt,dt,p=', rug.palette, ',sd=', rug.stripeData, ',tr=', textArray, ',td=[],sdirt=', showDirt ? 'true' : 'false', ',dl=', uint256(dirtLevel).toString(), ',stex=', showTexture ? 'true' : 'false', ',tl=', uint256(textureLevel).toString(), ',seed=', rug.seed.toString(), ';',
            'window.characterMap=', globalCharacterMap, ';let cm=window.characterMap;',
            
            // Algorithm (same for all NFTs)
            rugAlgorithm,
            
            // Initialize with this NFT's data (seed is already set in variables above)
            '</script></body></html>'
        );
        
        // Create JSON metadata
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Onchain Rug #',
                        tokenId.toString(),
                        '", "description": "A unique generative rug NFT with dynamic aging mechanics.", "external_url": "https://onchainrugs.com/rug/',
                        tokenId.toString(),
                        '", "image": "https://onchainrugs.com/thumbnails/',
                        tokenId.toString(),
                        '.png", "animation_url": "',
                        string.concat(
                            'data:text/html;base64,',
                            Base64.encode(bytes(html))
                        ),
                        '", "attributes": [',
                        _getRugAttributes(tokenId),
                        "]}"
                    )
                )
            )
        );
        
        return string(abi.encodePacked("data:application/json;base64,", json));
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
                result = string.concat(result, ",");
            }
            result = string.concat(result, '"', textRows[i], '"');
        }
        result = string.concat(result, "]");
        
        return result;
    }
    
    /**
     * @dev Get rug attributes for metadata
     * @param tokenId Token ID
     * @return The rug attributes string
     */
    function _getRugAttributes(uint256 tokenId) internal view returns (string memory) {
        RugData memory rug = rugs[tokenId];
        (bool showDirt, uint8 dirtLevel, bool showTexture, uint8 textureLevel) = calculateAgingState(tokenId);
        uint256 mintTime = mintTimes[tokenId];
        string memory attributes = "";
        
        // Add text line count attribute
        attributes = string.concat(
            attributes,
            string(
                abi.encodePacked(
                    '{"trait_type": "Text Lines", "value": ',
                    Strings.toString(rug.textRows.length),
                    '},'
                )
            )
        );
        
        // Add dirt level attribute
        if (showDirt) {
            attributes = string.concat(
                attributes,
                string(
                    abi.encodePacked(
                        '{"trait_type": "Dirt Level", "value": ',
                        Strings.toString(dirtLevel),
                        '},'
                    )
                )
            );
        }
        
        // Add texture level attribute
        if (showTexture) {
            attributes = string.concat(
                attributes,
                string(
                    abi.encodePacked(
                        '{"trait_type": "Texture Level", "value": ',
                        Strings.toString(textureLevel),
                        '},'
                    )
                )
            );
        }
        
        // Add age attribute
        uint256 age = (block.timestamp - mintTime) / 1 days;
        attributes = string.concat(
            attributes,
            string(
                abi.encodePacked(
                    '{"trait_type": "Age (Days)", "value": ',
                    Strings.toString(age),
                    '}'
                )
            )
        );
        
        return attributes;
    }
    
    
    /**
     * @dev Clean a rug (reset dirt level)
     * @param tokenId Token ID
     */
    function cleanRug(uint256 tokenId) external payable whenNotPaused {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        
        uint256 cost = getCleaningCost(tokenId);
        require(msg.value >= cost, "Insufficient payment for cleaning");
        
        AgingData storage aging = agingData[tokenId];
        aging.lastCleaned = block.timestamp;
        aging.isDirty = false;
        aging.dirtLevel = 0;
        
        // Refurbish texture to moderate level (Level 1)
        aging.hasTexture = true;
        aging.textureLevel = 1;
        
        emit RugCleaned(tokenId, cleaningCost);
    }
    
    /**
     * @dev Get cleaning cost for a rug
     * @param tokenId Token ID
     * @return Cleaning cost in wei
     */
    function getCleaningCost(uint256 tokenId) public view returns (uint256) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        
        uint256 timeSinceMint = block.timestamp - mintTimes[tokenId];
        
        // Free for first period, then paid
        if (timeSinceMint < freeCleaningPeriod) {
            return 0; // Free cleaning
        } else {
            return cleaningCost; // Paid cleaning
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
            
            // Laundering makes texture smooth (Level 0)
            aging.hasTexture = false;
            aging.textureLevel = 0;
        }
    }
    
    /**
     * @dev Get current supply
     * @return Current number of minted tokens
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    
    //////////////////////////////////////////////////////////////
    // Owner Functions - Parameter Management
    //////////////////////////////////////////////////////////////
    
    /**
     * @dev Pause the contract (emergency stop)
     */
    function pause() external onlyOwner {
        paused = true;
        emit ContractPaused();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        paused = false;
        emit ContractUnpaused();
    }
    
    /**
     * @dev Update pricing parameters
     * @param _basePrice New base price
     * @param _line2to3Price New price for lines 2-3
     * @param _line4to5Price New price for lines 4-5
     * @param _cleaningCost New cleaning cost
     */
    function updatePricing(
        uint256 _basePrice,
        uint256 _line2to3Price,
        uint256 _line4to5Price,
        uint256 _cleaningCost
    ) external onlyOwner {
        basePrice = _basePrice;
        line2to3Price = _line2to3Price;
        line4to5Price = _line4to5Price;
        cleaningCost = _cleaningCost;
        emit PricingUpdated(_basePrice, _line2to3Price, _line4to5Price, _cleaningCost);
    }
    
    /**
     * @dev Update aging system parameters
     * @param _freeCleaningPeriod New free cleaning period
     * @param _moderateTextureDays New moderate texture days
     * @param _heavyTextureDays New heavy texture days
     */
    function updateAging(
        uint256 _freeCleaningPeriod,
        uint256 _moderateTextureDays,
        uint256 _heavyTextureDays
    ) external onlyOwner {
        freeCleaningPeriod = _freeCleaningPeriod;
        moderateTextureDays = _moderateTextureDays;
        heavyTextureDays = _heavyTextureDays;
        emit AgingUpdated(_freeCleaningPeriod, _moderateTextureDays, _heavyTextureDays);
    }
    
    /**
     * @dev Update the art algorithm
     * @param _newAlgorithm New P5.js algorithm
     */
    function updateArtAlgorithm(string calldata _newAlgorithm) external onlyOwner {
        rugAlgorithm = _newAlgorithm;
        emit ArtAlgorithmUpdated();
    }
    
    /**
     * @dev Update the global character map
     * @param _newCharacterMap New character map JSON
     */
    function updateCharacterMap(string calldata _newCharacterMap) external onlyOwner {
        globalCharacterMap = _newCharacterMap;
        emit ArtAlgorithmUpdated(); // Reuse event for character map updates
    }
    
    /**
     * @dev Update royalty settings
     * @param _percentage New royalty percentage (in basis points)
     * @param _recipient New royalty recipient
     */
    function updateRoyalties(uint256 _percentage, address _recipient) external onlyOwner {
        require(_percentage <= 1000, "Royalty cannot exceed 10%");
        require(_recipient != address(0), "Invalid recipient");
        royaltyPercentage = _percentage;
        royaltyRecipient = _recipient;
        emit RoyaltyUpdated(_percentage, _recipient);
    }
    
    /**
     * @dev Withdraw contract balance
     */
    function withdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
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
