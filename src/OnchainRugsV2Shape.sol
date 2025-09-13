// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "lib/openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "lib/openzeppelin-contracts/contracts/utils/Strings.sol";
import "lib/openzeppelin-contracts/contracts/utils/Base64.sol";

/**
 * @title OnchainRugsV2Shape
 * @dev Fully on-chain NFT rug collection optimized for Shape L2
 * @notice Features: Time-based aging, global text uniqueness, per-NFT character maps
 */
contract OnchainRugsV2Shape is ERC721, ERC721URIStorage, Ownable {
    using Strings for uint256;

    // ============ CONSTANTS ============
    uint256 public constant MAX_SUPPLY = 1111;

    // Aging System Constants
    uint256 public constant DIRT_LEVEL_1_DAYS = 3 days;
    uint256 public constant DIRT_LEVEL_2_DAYS = 7 days;
    uint256 public constant TEXTURE_LEVEL_1_DAYS = 30 days;
    uint256 public constant TEXTURE_LEVEL_2_DAYS = 90 days;

    // ============ STATE VARIABLES ============
    uint256 private _tokenCounter;

    // Upgradeable Parameters (Owner can change)
    uint256 public royaltyPercentage = 1000; // 10% (1000 basis points)
    address public royaltyRecipient;
    uint256 public basePrice = 0.0001 ether;
    uint256 public textLinePrice = 0.00111 ether; // Per line beyond first
    uint256 public cleaningCost = 0.0001 ether; // Cost to clean dirt
    uint256 public launderingCost = 0.0005 ether; // Cost to reset texture aging

    // Emergency Controls
    bool public paused = false;

    // ============ STORAGE ============
    struct RugData {
        uint256 seed;           // Generation seed
        string palette;         // JSON color palette
        string stripeData;      // JSON stripe patterns
        string[] textRows;      // Text content
        uint8 warpThickness;    // Warp thread thickness
        uint256 mintTime;       // When minted
        string characterMap;    // Per-NFT character map (filtered)
    }

    struct AgingData {
        uint256 lastCleaned;    // Last time dirt was cleaned
        uint256 lastSalePrice; // Last sale price (for laundering)
        uint8 textureLevel;    // Persistent texture aging level
    }

    mapping(uint256 => RugData) public rugs;
    mapping(uint256 => AgingData) public agingData;
    mapping(bytes32 => bool) public usedTextHashes; // Global text uniqueness
    mapping(address => uint256) public userRugCount;

    // ============ EVENTS ============
    event RugMinted(uint256 indexed tokenId, address indexed owner, string[] textRows, uint256 seed);
    event RugCleaned(uint256 indexed tokenId, address indexed cleaner, uint256 cost);
    event RugLaundered(uint256 indexed tokenId, address indexed cleaner, uint256 cost);
    event ParametersUpdated(uint256 basePrice, uint256 textLinePrice, uint256 cleaningCost, uint256 launderingCost);

    constructor() ERC721("Onchain Rugs Shape", "RUGS") Ownable(msg.sender) {
        royaltyRecipient = msg.sender;
    }

    // ============ OWNER FUNCTIONS ============
    function setPricing(
        uint256 _basePrice,
        uint256 _textLinePrice,
        uint256 _cleaningCost,
        uint256 _launderingCost
    ) external onlyOwner {
        basePrice = _basePrice;
        textLinePrice = _textLinePrice;
        cleaningCost = _cleaningCost;
        launderingCost = _launderingCost;
        emit ParametersUpdated(_basePrice, _textLinePrice, _cleaningCost, _launderingCost);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }

    // ============ MINTING FUNCTIONS ============
    function mintRugWithParams(
        string[] memory textRows,
        uint256 seed,
        string memory palette,
        string memory stripeData,
        string memory characterMap,
        uint256 warpThickness
    ) external payable {
        require(!paused, "Contract is paused");
        require(_totalSupply() < MAX_SUPPLY, "Max supply reached");
        require(textRows.length > 0 && textRows.length <= 5, "Invalid text length");
        require(warpThickness >= 1 && warpThickness <= 5, "Invalid warp thickness");
        require(msg.value >= getMintPrice(textRows.length), "Insufficient payment");

        // Generate seed if not provided
        if (seed == 0) {
            seed = uint256(keccak256(abi.encodePacked(
                block.timestamp,
                block.prevrandao,
                msg.sender,
                userRugCount[msg.sender]
            )));
        }

        // Check global text uniqueness
        bytes32 textHash = hashTextRows(textRows);
        require(!usedTextHashes[textHash], "Text already used in collection");
        usedTextHashes[textHash] = true;

        uint256 tokenId = _totalSupply() + 1;

        // Store rug data with per-NFT character map
        rugs[tokenId] = RugData({
            seed: seed,
            palette: palette,
            stripeData: stripeData,
            textRows: textRows,
            warpThickness: uint8(warpThickness),
            mintTime: block.timestamp,
            characterMap: characterMap
        });

        // Initialize aging data
        agingData[tokenId] = AgingData({
            lastCleaned: block.timestamp, // Start clean
            lastSalePrice: 0,
            textureLevel: 0
        });

        userRugCount[msg.sender]++;
        _tokenCounter++;
        _safeMint(msg.sender, tokenId);

        emit RugMinted(tokenId, msg.sender, textRows, seed);
    }

    // ============ AGING SYSTEM ============
    function calculateAgingState(uint256 tokenId) public view returns (
        uint8 dirtLevel,
        uint8 textureLevel
    ) {
        RugData memory rug = rugs[tokenId];
        AgingData memory aging = agingData[tokenId];

        uint256 currentTime = block.timestamp;
        uint256 timeSinceLastCleaned = currentTime - aging.lastCleaned;

        // Dirt levels (resets on cleaning)
        if (timeSinceLastCleaned >= DIRT_LEVEL_2_DAYS) {
            dirtLevel = 2; // Full dirt
        } else if (timeSinceLastCleaned >= DIRT_LEVEL_1_DAYS) {
            dirtLevel = 1; // Little dirt
        }

        // Texture levels (persistent after threshold)
        textureLevel = aging.textureLevel;

        // Update texture level based on time (but don't persist automatically)
        if (timeSinceLastCleaned >= TEXTURE_LEVEL_2_DAYS) {
            textureLevel = 2; // Full texture aging
        } else if (timeSinceLastCleaned >= TEXTURE_LEVEL_1_DAYS) {
            textureLevel = 1; // Little texture aging
        }
    }

    // ============ CLEANING & LAUNDERING ============
    function cleanRug(uint256 tokenId) external payable {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        (uint8 dirtLevel, uint8 textureLevel) = calculateAgingState(tokenId);
        require(dirtLevel > 0, "Rug is already clean");

        uint256 cost = cleaningCost;
        require(msg.value >= cost, "Insufficient payment");

        // Reset dirt (cleaning)
        agingData[tokenId].lastCleaned = block.timestamp;

        // Note: Texture aging persists based on requirements

        emit RugCleaned(tokenId, msg.sender, cost);
    }

    function launderRug(uint256 tokenId) external payable {
        require(ownerOf(tokenId) == msg.sender, "Not owner");

        uint256 cost = launderingCost;
        require(msg.value >= cost, "Insufficient payment");

        // Reset texture aging to 0
        agingData[tokenId].textureLevel = 0;
        agingData[tokenId].lastCleaned = block.timestamp;

        emit RugLaundered(tokenId, msg.sender, cost);
    }

    // ============ PRICE CALCULATION ============
    function getMintPrice(uint256 textLines) public view returns (uint256) {
        if (textLines <= 1) return basePrice;
        return basePrice + ((textLines - 1) * textLinePrice);
    }

    // ============ OVERRIDE FUNCTIONS ============
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        require(ownerOf(tokenId) != address(0), "Token does not exist");

        RugData memory rug = rugs[tokenId];
        (uint8 dirtLevel, uint8 textureLevel) = calculateAgingState(tokenId);

        string memory html = generateOptimizedHTML(rug, dirtLevel, textureLevel);

        // Create JSON metadata with HTML in animation_url (OpenSea standard)
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name":"Onchain Rug #', tokenId.toString(),
                        '","description":"A fully on-chain generative rug NFT with aging mechanics","animation_url":"data:text/html;base64,',
                        Base64.encode(bytes(html)),
                        '","attributes":[{"trait_type":"Text Lines","value":"', rug.textRows.length.toString(),
                        '"},{"trait_type":"Warp Thickness","value":"', uint256(rug.warpThickness).toString(),
                        '"},{"trait_type":"Dirt Level","value":"', uint256(dirtLevel).toString(),
                        '"},{"trait_type":"Texture Level","value":"', uint256(textureLevel).toString(),
                        '"}]}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    // ============ HTML GENERATION ============
    function generateOptimizedHTML(
        RugData memory rug,
        uint8 dirtLevel,
        uint8 textureLevel
    ) internal view returns (string memory) {
        string memory jsConfig = string(abi.encodePacked(
            'let seed=', rug.seed.toString(), ';',
            'let tr=', encodeTextRows(rug.textRows), ';',
            'let wt=', uint256(rug.warpThickness).toString(), ';',
            'let p=', rug.palette, ';',
            'let sd=', rug.stripeData, ';',
            'let dl=', uint256(dirtLevel).toString(), ';',
            'let tl=', uint256(textureLevel).toString(), ';',
            'let cm=', rug.characterMap, ';',
            'let stex=', textureLevel > 0 ? 'true' : 'false', ';',
            'let sdirt=', dirtLevel > 0 ? 'true' : 'false', ';'
        ));

        string memory part1 = string(abi.encodePacked(
            '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rug #', rug.seed.toString(),
            '</title><style>body{margin:0;padding:0;background:#f0f0f0;display:flex;justify-content:center;align-items:center;min-height:100vh}canvas{display:block;margin:auto;border:2px solid #ccc;border-radius:8px}</style>',
            '</head><body><div id="canvas-container"></div>',
            '<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>',
            '<script>',
            jsConfig,
            // Ultra-minimal algorithm with PRNG and minimized variables
            'function setup(){noiseSeed(seed);window.prngSeed=seed%2147483647;if(window.prngSeed<=0)window.prngSeed+=2147483646;window.prngNext=function(){window.prngSeed=(window.prngSeed*16807)%2147483647;return(window.prngSeed-1)/2147483646};window.p=function(min,max){if(max===undefined)return min+window.prngNext()*(1-min);return min+window.prngNext()*(max-min)};window.c=function(a){return a[Math.floor(window.prngNext()*a.length)]};createCanvas(h+(f*4),w+(f*4)).parent("canvas-container");pixelDensity(2.5);u();g();noLoop()}let w=800,h=1200,f=30,wt=8,wp=${rug.warpThickness},ts=2,lt,dt,p=${rug.palette},sd=${rug.stripeData},tr=${rug.textRows},td=[],sdirt=${dirtLevel>0},dl=${dirtLevel},stex=${textureLevel>0},tl=${textureLevel},seed=${rug.seed};window.cm=${rug.characterMap};let cm=window.cm;'
        ));

        string memory part2 = string(abi.encodePacked(
            'function u(){if(!p||!p.colors)return;let d=p.colors[0],l=p.colors[0],dv=999,lv=-1;for(let c of p.colors){let b=(red(color(c))+green(color(c))+blue(color(c)))/3;if(b<dv){dv=b;d=c}if(b>lv){lv=b;l=c}}dt=lerpColor(color(d),color(0),0.4);lt=lerpColor(color(l),color(255),0.3)}',
            'function draw(){background(222,222,222);push();translate(width/2,height/2);rotate(PI/2);translate(-height/2,-width/2);push();translate(f*2,f*2);for(let s of sd)dS(s);if(stex&&tl>0)dT(tl);pop();dF();if(sdirt&&dl>0)dD(dl);pop()}',
            'function dS(s){let ws=wp+1,we=wt+1;for(let x=0;x<w;x+=ws)for(let y=s.y;y<s.y+s.height;y+=we){let wc=color(s.primaryColor),it=false;if(td.length)for(let tp of td)if(x>=tp.x&&x<tp.x+tp.width&&y>=tp.y&&y<tp.y+tp.height){it=true;break}let r=red(wc)+p(-15,15),g=green(wc)+p(-15,15),b=blue(wc)+p(-15,15);if(it){let bb=(r+g+b)/3,tc=bb<128?lt:dt;r=red(tc);g=green(tc);b=blue(tc)}fill(constrain(r,0,255),constrain(g,0,255),constrain(b,0,255));rect(x+sin(y*0.05)*0.5,y,wp,we)}for(let y=s.y;y<s.y+s.height;y+=we)for(let x=0;x<w;x+=ws){let wc=color(s.primaryColor),it=false;if(td.length)for(let tp of td)if(x>=tp.x&&x<tp.x+tp.width&&y>=tp.y&&y<tp.y+tp.height){it=true;break}if(s.weaveType==="mixed"&&s.secondaryColor&&p(0,1)>0.5)wc=color(s.secondaryColor);else if(s.weaveType==="textured")wc=lerpColor(color(s.primaryColor),color(255),noise(x*0.05,y*0.05)*0.15);let r=red(wc)+p(-20,20),g=green(wc)+p(-20,20),b=blue(wc)+p(-20,20);if(it){let bb=(r+g+b)/3,tc=bb<128?lt:dt;r=red(tc);g=green(tc);b=blue(tc)}fill(constrain(r,0,255),constrain(g,0,255),constrain(b,0,255));rect(x,y+cos(x*0.05)*0.5,ws,wt)}for(let y=s.y;y<s.y+s.height;y+=we*2)for(let x=0;x<w;x+=ws*2){fill(0,0,0,40);rect(x+1,y+1,ws-2,we-2)}for(let y=s.y+we;y<s.y+s.height;y+=we*2)for(let x=ws;x<w;x+=ws*2){fill(255,255,255,30);rect(x,y,ws-1,we-1)}}',
            'function dT(tl){push();blendMode(MULTIPLY);let hi=tl>1?80:30,ri=tl>1?40:20,rt=tl>1?0.5:0.6;for(let x=0;x<w;x+=2)for(let y=0;y<h;y+=2){fill(0,0,0,map(noise(x*0.02,y*0.02),0,1,0,hi));rect(x,y,2,2)}for(let x=0;x<w;x+=6)for(let y=0;y<h;y+=6){let r=noise(x*0.03,y*0.03);if(r>rt)fill(255,255,255,ri);else if(r<1-rt)fill(0,0,0,ri*0.8);rect(x,y,6,6)}if(tl>1)for(let x=0;x<w;x+=8)for(let y=0;y<h;y+=8)if(noise(x*0.01,y*0.01)>0.7){fill(0,0,0,15);rect(x,y,8,2)}pop()}',
            'function dD(dl){push();translate(f*2,f*2);let di=dl>1?1:0.5,doo=dl>1?60:30;for(let x=0;x<w;x+=3)for(let y=0;y<h;y+=3)if(p(0,1)>0.85*di){fill(p(60,90),p(40,60),p(20,40),p(doo*0.5,doo));ellipse(x,y,p(1,4),p(1,4))}for(let i=0;i<15*di;i++)fill(p(40,70),p(25,45),p(15,30),p(doo*0.3,doo*0.7)),ellipse(p(0,w),p(0,h),p(8,20),p(8,20));for(let x=0;x<w;x+=2)for(let y=0;y<h;y+=2)if(Math.min(x,y,w-x,h-y)<10&&p(0,1)>0.7*di)fill(80,50,20,p(10,25)),rect(x,y,2,2);pop()}',
            'function dF(){dFS(f*2,f,w,f,"top");dFS(f*2,f*2+h,w,f,"bottom");dS()}',
            'function dFS(x,y,w,h,s){let fs=w/12,sw=w/fs;for(let i=0;i<fs;i++){let sx=x+i*sw;if(!p||!p.colors)return;let sc=color(c(p.colors)),r=red(sc)*0.7,g=green(sc)*0.7,b=blue(sc)*0.7;stroke(r,g,b);strokeWeight(p(0.5,1.2));noFill();beginShape();for(let t=0;t<=1;t+=0.1){let yp=lerp(s==="top"?y+h:y,y,t*p(0.8,1.2)),xo=sin(t*PI*p(0.2,0.8))*p(1,4)*t*c([-1,1])*p(0.5,2);if(p(0,1)<0.3)xo+=p(-2,2);vertex(sx+p(-sw/6,sw/6)+xo,yp)}endShape()}}',
            'function dS(){let ws=wt+1;for(let s of sd)for(let y=s.y;y<s.y+s.height;y+=ws){if(y===s.y)continue;let sc=color(s.primaryColor);if(s.secondaryColor&&s.weaveType==="mixed")sc=lerpColor(sc,color(s.secondaryColor),noise(y*0.1)*0.5+0.5);let r=red(sc)*0.8,g=green(sc)*0.8,b=blue(sc)*0.8;fill(r,g,b);let rad=wt*p(1.2,1.8),cx=f*2+p(-2,2),cy=f*2+y+wt/2+p(-1,1);arc(cx,cy,rad*2,rad*2,HALF_PI+p(-0.2,0.2),-HALF_PI+p(-0.2,0.2));cx=f*2+w+p(-2,2);arc(cx,cy,rad*2,rad*2,-HALF_PI+p(-0.2,0.2),HALF_PI+p(-0.2,0.2))}}',
            'function g(){td=[];if(!tr||tr.length===0)return;const netr=tr.filter(r=>r&&r.trim()!=="");if(netr.length===0)return;const ws=wp+1,we=wt+1,sw=ws*ts,se=we*ts,cw=7*sw,ch=5*se,s=se,rs=cw*1.5,trw=netr.length*cw+(netr.length-1)*rs,bsx=(w-trw)/2;for(let ri=0;ri<netr.length;ri++){const rt=netr[ri],tw=cw,th=rt.length*(ch+s)-s,sx=bsx+ri*(cw+rs),sy=(h-th)/2;for(let i=0;i<rt.length;i++){const c=rt.charAt(i),cy=sy+(rt.length-1-i)*(ch+s),cd=cm[c.toUpperCase()]||cm[" "];for(let r=0;r<cd.length;r++)for(let col=0;col<cd[r].length;col++)if(cd[r][col]==="1")td.push({x:sx+r*sw,y:cy+(cd[r].length-1-col)*se,width:sw,height:se})}}}'
        ));

        return string(abi.encodePacked(part1, part2, '</script></body></html>'));
    }

    // ============ UTILITY FUNCTIONS ============
    function hashTextRows(string[] memory textRows) internal pure returns (bytes32) {
        return keccak256(abi.encode(textRows));
    }

    function encodeTextRows(string[] memory textRows) internal pure returns (string memory) {
        if (textRows.length == 0) return "[]";
        string memory result = "[";
        for (uint256 i = 0; i < textRows.length; i++) {
            if (i > 0) result = string(abi.encodePacked(result, ","));
            result = string(abi.encodePacked(result, '"', textRows[i], '"'));
        }
        result = string(abi.encodePacked(result, "]"));
        return result;
    }

    function _totalSupply() internal view returns (uint256) {
        return _tokenCounter;
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply();
    }

    function maxSupply() external pure returns (uint256) {
        return MAX_SUPPLY;
    }

    // ============ AGING PRICE TRACKING ============
    function updateLastSalePrice(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        agingData[tokenId].lastSalePrice = price;
    }

    // ============ SUPPORTING INTERFACES ============
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}