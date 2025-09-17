// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/////////////////////////////////////////////////////////////////////////////////////////////////
/// ██╗   ██╗ █████╗ ██╗     ██╗██████╗  ██████╗ ██╗  ██╗██╗  ██╗ █████╗ ███╗   ██╗███╗   ██╗ ///
/// ██║   ██║██╔══██╗██║     ██║██╔══██╗██╔═══██╗██║ ██╔╝██║ ██╔╝██╔══██╗████╗  ██║████╗  ██║ ///
/// ██║   ██║███████║██║     ██║██████╔╝██║   ██║█████╔╝ █████╔╝ ███████║██╔██╗ ██║██╔██╗ ██║ ///
/// ╚██╗ ██╔╝██╔══██║██║     ██║██╔═══╝ ██║   ██║██╔═██╗ ██╔═██╗ ██╔══██║██║╚██╗██║██║╚██╗██║ ///
///  ╚████╔╝ ██║  ██║███████╗██║██║     ╚██████╔╝██║  ██╗██║  ██╗██║  ██║██║ ╚████║██║ ╚████║ ///
///   ╚═══╝  ╚═╝  ╚═╝╚══════╝╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝ ///
/////////////////////////////////////////////////////////////////////////////////////////////////

import "lib/openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "lib/openzeppelin-contracts/contracts/utils/Strings.sol";
import "lib/openzeppelin-contracts/contracts/utils/Base64.sol";
import "./OnchainRugsHTMLGenerator.sol";

/**
 * @title OnchainRugs
 * @dev Fully on-chain NFT rug collection with complete p5.js algorithm
 * @author @valipokkann
 * @notice Features: Dynamic aging, text uniqueness, filtered character maps, minified HTML generation
 */
contract OnchainRugs is ERC721, ERC721URIStorage, Ownable {
    using Strings for uint256;

    // ============ CONSTANTS ============
    uint256 public constant MAX_SUPPLY = 1111;

    // ============ STATE VARIABLES ============
    uint256 private _tokenCounter;

    // Updateable Pricing (all start at 0.000001 ETH for testing)
    uint256 public basePrice = 0.000001 ether;
    uint256 public level1CleaningCost = 0.000001 ether;
    uint256 public level2CleaningCost = 0.000001 ether;
    uint256 public fullLaunderingCost = 0.000001 ether;
    uint256 public royaltyPercentage = 1000; // 10%

    // Updateable Aging Time Thresholds
    uint256 public dirtLevel1Days = 3 days;
    uint256 public dirtLevel2Days = 7 days;

    // Emergency Controls
    bool public paused = false;

    // Rug Scripty Contracts
    address public rugScriptyBuilder;
    address public rugEthFSStorage;
    address public onchainRugsHTMLGenerator;

    // ============ STORAGE ============
    struct RugData {
        uint256 seed;
        string paletteName;
        string minifiedPalette;      // Added for HTML generation
        string minifiedStripeData;
        string[] textRows;
        uint8 warpThickness;
        uint256 mintTime;
        string filteredCharacterMap;
        uint8 complexity;
        uint256 characterCount;
        uint256 stripeCount;
    }

    struct AgingData {
        uint256 lastCleaned;
        uint256 lastSalePrice;
    }

    mapping(uint256 => RugData) public rugs;
    mapping(uint256 => AgingData) public agingData;
    mapping(bytes32 => bool) public usedTextHashes;

    // ============ EVENTS ============
    event RugMinted(uint256 indexed tokenId, address indexed owner, string[] textRows, uint256 seed);
    event RugCleaned(uint256 indexed tokenId, address indexed cleaner, uint256 cost, uint8 dirtLevel);
    event RugLaundered(uint256 indexed tokenId, address indexed cleaner, uint256 cost);
    event PricingUpdated(string parameter, uint256 oldValue, uint256 newValue);
    event AgingThresholdsUpdated();

    constructor() ERC721("Onchain Rugs", "RUGS") Ownable(msg.sender) {}

    function updateBasePrice(uint256 p) external onlyOwner {emit PricingUpdated("basePrice",basePrice,p);basePrice=p;}
    function updateCleaningCost(uint8 l,uint256 c) external onlyOwner {if(l==1){emit PricingUpdated("level1CleaningCost",level1CleaningCost,c);level1CleaningCost=c;}else if(l==2){emit PricingUpdated("level2CleaningCost",level2CleaningCost,c);level2CleaningCost=c;}}
    function updateLaunderingCost(uint256 c) external onlyOwner {emit PricingUpdated("fullLaunderingCost",fullLaunderingCost,c);fullLaunderingCost=c;}
    function updateRoyaltyPercentage(uint256 p) external onlyOwner {emit PricingUpdated("royaltyPercentage",royaltyPercentage,p);royaltyPercentage=p;}

    function updateAgingThresholds(uint256 d1,uint256 d2) external onlyOwner {dirtLevel1Days=d1;dirtLevel2Days=d2;emit AgingThresholdsUpdated();}
    function setPaused(bool p) external onlyOwner {paused=p;}

    // Rug Scripty Integration
    function setRugScriptyContracts(
        address _rugScriptyBuilder,
        address _rugEthFSStorage,
        address _onchainRugsHTMLGenerator
    ) external onlyOwner {
        rugScriptyBuilder = _rugScriptyBuilder;
        rugEthFSStorage = _rugEthFSStorage;
        onchainRugsHTMLGenerator = _onchainRugsHTMLGenerator;
    }

    // ============ MINTING FUNCTIONS ============
    function mintRug(
        string[] memory textRows,
        uint256 seed,
        string memory paletteName,
        string memory minifiedStripeData,
        string memory minifiedPalette,
        string memory filteredCharacterMap,
        uint8 warpThickness,
        uint8 complexity,
        uint256 characterCount,
        uint256 stripeCount
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
                msg.sender
            )));
        }

        // Check global text uniqueness
        bytes32 textHash = hashTextRows(textRows);
        require(!usedTextHashes[textHash], "Text already used in collection");
        usedTextHashes[textHash] = true;

        uint256 tokenId = _totalSupply() + 1;

        // Store rug data with minified variables
        rugs[tokenId] = RugData({
            seed: seed,
            paletteName: paletteName,
            minifiedPalette: minifiedPalette,      // Added
            minifiedStripeData: minifiedStripeData,
            textRows: textRows,
            warpThickness: warpThickness,
            mintTime: block.timestamp,
            filteredCharacterMap: filteredCharacterMap,
            complexity: complexity,
            characterCount: characterCount,
            stripeCount: stripeCount
        });

        // Initialize aging data
        agingData[tokenId] = AgingData({
            lastCleaned: block.timestamp,
            lastSalePrice: 0
        });

        _tokenCounter++;
        _safeMint(msg.sender, tokenId);

        emit RugMinted(tokenId, msg.sender, textRows, seed);
    }

    function calculateAgingState(uint256 t) public view returns (uint8 dl) {
        AgingData memory a = agingData[t];
        uint256 ts = block.timestamp - a.lastCleaned;
        if (ts >= dirtLevel2Days) dl = 2;
        else if (ts >= dirtLevel1Days) dl = 1;
    }

    function cleanRug(uint256 t) external payable {
        require(ownerOf(t) == msg.sender, "Not owner");
        uint8 dl = calculateAgingState(t);
        require(dl > 0, "Already clean");
        uint256 c = getCleaningCost(dl);
        require(msg.value >= c, "Insufficient payment");
        agingData[t].lastCleaned = block.timestamp;
        emit RugCleaned(t, msg.sender, c, dl);
    }

    function getCleaningCost(uint8 dl) public view returns(uint256) {
        if (dl == 1) return level1CleaningCost;
        if (dl == 2) return level2CleaningCost;
        return 0;
    }

    function launderRug(uint256 t) external payable {
        require(ownerOf(t) == msg.sender, "Not owner");
        require(msg.value >= fullLaunderingCost, "Insufficient payment");
        agingData[t].lastCleaned = block.timestamp;
        emit RugLaundered(t, msg.sender, msg.value);
    }

    function launderOnSale(uint256 t) external payable {
        require(ownerOf(t) == msg.sender, "Not owner");
        require(msg.value > agingData[t].lastSalePrice, "Sale price must be higher");
        agingData[t].lastSalePrice = msg.value;
        agingData[t].lastCleaned = block.timestamp;
        emit RugLaundered(t, msg.sender, 0);
    }

    function getMintPrice(uint256 tl) public view returns(uint256) {
        return basePrice;
    }

    // ============ TOKEN URI & HTML GENERATION ============
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        require(ownerOf(tokenId) != address(0), "Token does not exist");

        RugData memory rug = rugs[tokenId];
        uint8 dirtLevel = calculateAgingState(tokenId);

        // Use Rug Scripty system - now mandatory
        require(rugScriptyBuilder != address(0), "RugScriptyBuilder not configured");
        require(rugEthFSStorage != address(0), "RugEthFSStorage not configured");
        require(onchainRugsHTMLGenerator != address(0), "OnchainRugsHTMLGenerator not configured");

        // Encode rug data for the HTML generator
        bytes memory encodedRugData = abi.encode(rug);

        string memory html = OnchainRugsHTMLGenerator(onchainRugsHTMLGenerator).generateProjectHTML(
            encodedRugData,
            tokenId,
            rugScriptyBuilder,
            rugEthFSStorage
        );

        // Create JSON metadata
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name":"OnchainRug #', tokenId.toString(),
                        '","description":"OnchainRugs by valipokkann","image":"https://onchainrugs.xyz/logo.png","animation_url":"',
                        html,  // Use HTML directly (already in data:text/html, format)
                        '","attributes":[{"trait_type":"Text Lines","value":"', rug.textRows.length.toString(),
                        '"},{"trait_type":"Character Count","value":"', rug.characterCount.toString(),
                        '"},{"trait_type":"Palette Name","value":"', rug.paletteName,
                        '"},{"trait_type":"Stripe Count","value":"', rug.stripeCount.toString(),
                        '"},{"trait_type":"Complexity","value":"', uint256(rug.complexity).toString(),
                        '"},{"trait_type":"Warp Thickness","value":"', uint256(rug.warpThickness).toString(),
                        '"},{"trait_type":"Dirt Level","value":"', uint256(dirtLevel).toString(),
                        '"}]}'
                    )
                )
            )
        );

        return string.concat("data:application/json;base64,", json);
    }


    function hashTextRows(string[] memory tr) internal pure returns(bytes32) {
        return keccak256(abi.encode(tr));
    }
    function _totalSupply() internal view returns(uint256) {
        return _tokenCounter;
    }

    function totalSupply() external view returns(uint256) {
        return _totalSupply();
    }

    function maxSupply() external pure returns(uint256) {
        return MAX_SUPPLY;
    }

    function burn(uint256 t) external {
        require(ownerOf(t) == msg.sender, "Not owner");
        delete rugs[t];
        delete agingData[t];
        _burn(t);
    }

    function supportsInterface(bytes4 i) public view override(ERC721, ERC721URIStorage) returns(bool) {
        return super.supportsInterface(i);
    }
}
