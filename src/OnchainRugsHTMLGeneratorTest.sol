// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./RugScriptyStructs.sol";
import "./IRugScriptyBuilderV2.sol";
import "./IProjectHTMLGenerator.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract OnchainRugsHTMLGeneratorTest is IProjectHTMLGenerator {
    using Strings for uint256;
    
    function generateProjectHTML(
        bytes memory projectData,
        uint256 tokenId,
        address scriptyBuilder,
        address ethfsStorage
    ) external view override returns (string memory html) {
        // For testing, create a simple rug data structure
        // In real implementation, this would decode the projectData
        
        // Create head tags
        RugHTMLTag[] memory headTags = new RugHTMLTag[](1);
        headTags[0].tagOpen = '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OnchainRug #';
        headTags[0].tagContent = bytes(tokenId.toString());
        headTags[0].tagClose = '</title><style>body{display:flex;justify-content:center;align-items:center}#rug{width:800px;height:1200px;background:linear-gradient(45deg,#ff0000,#00ff00,#0000ff);}</style>';

        // Create body tags (3 total: config script, rug algorithm, container div)
        RugHTMLTag[] memory bodyTags = new RugHTMLTag[](3);

        // 1. Configuration script (injects all required variables)
        bodyTags[0].tagContent = bytes(generateConfigScript(tokenId));
        bodyTags[0].tagType = RugHTMLTagType.script;

        // 2. Rug algorithm from EthFS storage
        bodyTags[1].name = "rug-algorithm.js";
        bodyTags[1].contractAddress = ethfsStorage;
        bodyTags[1].contractData = abi.encode("rug-algorithm.js");
        bodyTags[1].tagType = RugHTMLTagType.scriptBase64DataURI;

        // 3. Container div for p5.js canvas (NO manual canvas)
        bodyTags[2].tagOpen = '<div id="rug"></div>';

        // Create HTML request
        RugHTMLRequest memory htmlRequest;
        htmlRequest.headTags = headTags;
        htmlRequest.bodyTags = bodyTags;

        // Generate URL safe HTML
        return IRugScriptyBuilderV2(scriptyBuilder).getHTMLURLSafeString(htmlRequest);
    }

    function generateConfigScript(uint256 tokenId) internal pure returns (string memory) {
        // Build configuration script that injects all required variables
        string memory config = "let s=";
        config = string(abi.encodePacked(config, tokenId.toString()));
        config = string(abi.encodePacked(config, ";let w=800;let h=1200;let f=20;"));
        
        // Add palette (Royal Stewart colors)
        config = string(abi.encodePacked(config, "let p={name:'Royal Stewart',colors:['#e10600','#ffffff','#000000','#ffd700','#007a3d']};"));
        
        // Add text rows (PERFECT RUG)
        config = string(abi.encodePacked(config, "let tr=['PERFECT RUG'];"));
        
        // Add character map (simplified version)
        config = string(abi.encodePacked(config, "let cm={'V':['10001','10001','10001','10001','10001','01010','00100'],'A':['01110','10001','10001','11111','10001','10001','10001'],'L':['10000','10000','10000','10000','10000','10000','11111'],'I':['11111','00100','00100','00100','00100','00100','11111'],'P':['11110','10001','10001','11110','10000','10000','10000'],'O':['01110','10001','10001','10001','10001','10001','01110'],'K':['10001','10010','10100','11000','10100','10010','10001'],'N':['10001','11001','10101','10011','10001','10001','10001'],' ':['00000','00000','00000','00000','00000','00000','00000']};"));
        
        // Add other required variables
        config = string(abi.encodePacked(config, "let wp=3;let wt=2;let ts=1;let tl=0;let dl=0;"));
        
        // Add stripe data (simplified)
        config = string(abi.encodePacked(config, "let sd=[{y:0,h:120,pc:'#000000',sc:null,wt:'s'},{y:120,h:120,pc:'#ffffff',sc:null,wt:'s'},{y:240,h:120,pc:'#007a3d',sc:null,wt:'s'},{y:360,h:120,pc:'#e10600',sc:null,wt:'s'},{y:480,h:120,pc:'#000000',sc:'#e10600',wt:'t'},{y:600,h:120,pc:'#007a3d',sc:null,wt:'t'},{y:720,h:120,pc:'#e10600',sc:null,wt:'s'},{y:840,h:120,pc:'#ffd700',sc:null,wt:'s'},{y:960,h:120,pc:'#000000',sc:null,wt:'t'},{y:1080,h:120,pc:'#ffffff',sc:'#007a3d',wt:'m'}];"));
        
        // Add texture data (empty)
        config = string(abi.encodePacked(config, "let td=[];"));
        
        return config;
    }

    function getRequiredLibraries() external pure override returns (string[] memory libraries) {
        libraries = new string[](1);
        libraries[0] = "rug-algorithm.js";
    }

    function getProjectName() external pure override returns (string memory name) {
        return "OnchainRugsTest";
    }

    function getProjectDescription() external pure override returns (string memory description) {
        return "Test version with container div but no manual canvas - p5.js creates canvas dynamically";
    }
}
