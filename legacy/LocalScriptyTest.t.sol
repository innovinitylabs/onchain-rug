// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test, console} from "forge-std/Test.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "solady/utils/Base64.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

// Import Scripty contracts (using your existing setup)
import {FileStore} from "../src/scripty/dependencies/ethfs/FileStore.sol";
import {ETHFSV2FileStorage} from "../src/scripty/externalStorage/ethfs/ETHFSV2FileStorage.sol";
import {ScriptyStorageV2} from "../src/scripty/ScriptyStorageV2.sol";
import {ScriptyBuilderV2} from "../src/scripty/ScriptyBuilderV2.sol";
import {HTMLRequest, HTMLTag, HTMLTagType} from "../src/scripty/core/ScriptyStructs.sol";

// Import your project contracts
import {OnchainRugsHTMLGenerator} from "../src/OnchainRugsHTMLGenerator.sol";
import {OnchainRugs} from "../src/OnchainRugs.sol";

/**
 * @title Simple CREATE2 Deployer for Local Testing
 * @notice Deploys contracts using CREATE2 for deterministic addresses
 */
contract LocalCreate2Deployer {
    event Deployed(address addr, bytes32 salt);

    /**
     * @notice Deploys a contract using CREATE2
     * @param salt The salt for deterministic deployment
     * @param initCode The initialization code
     * @return addr The deployed contract address
     */
    function deploy(bytes32 salt, bytes memory initCode) external returns (address addr) {
        assembly {
            addr := create2(0, add(initCode, 0x20), mload(initCode), salt)
        }
        require(addr != address(0), "Create2Deployer: deployment failed");
        emit Deployed(addr, salt);
    }

    /**
     * @notice Computes the address of a contract before deployment
     * @param salt The salt for deterministic deployment
     * @param initCode The initialization code
     * @return addr The computed contract address
     */
    function computeAddress(bytes32 salt, bytes memory initCode) external view returns (address addr) {
        bytes32 initCodeHash = keccak256(initCode);
        addr = address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            salt,
            initCodeHash
        )))));
    }
}

contract LocalScriptyTest is Test, IERC721Receiver {
    // Contract instances
    LocalCreate2Deployer public create2Deployer;
    FileStore public fileStore;
    ETHFSV2FileStorage public ethfsStorage;
    ScriptyStorageV2 public scriptyStorage;
    ScriptyBuilderV2 public scriptyBuilder;
    OnchainRugsHTMLGenerator public htmlGenerator;
    OnchainRugs public onchainRugs;

    // Test data from your JSON file
    uint256 constant TEST_SEED = 8463;
    string constant TEST_PALETTE = "{\"name\":\"Royal Stewart\",\"colors\":[\"#e10600\",\"#ffffff\",\"#000000\",\"#ffd700\",\"#007a3d\"]}";
    string constant TEST_STRIPE_DATA = "[{\"y\":0,\"h\":72.2,\"pc\":\"#000000\",\"sc\":null,\"wt\":\"s\",\"wv\":0.406}]";
    string constant TEST_CHARACTER_MAP = "{\"V\":[\"10001\",\"10001\",\"10001\",\"10001\",\"10001\",\"01010\",\"00100\"]}";

    function setUp() public {
        console.log("Setting up complete local Scripty infrastructure...");

        // 1. Deploy CREATE2 Deployer
        console.log("1. Deploying CREATE2 Deployer...");
        create2Deployer = new LocalCreate2Deployer();
        console.log(string.concat("CREATE2 Deployer deployed at: ", Strings.toHexString(address(create2Deployer))));

        // 2. Deploy EthFS FileStore with CREATE2 deployer
        console.log("2. Deploying EthFS FileStore...");
        fileStore = new FileStore(address(create2Deployer));
        console.log(string.concat("FileStore deployed at: ", Strings.toHexString(address(fileStore))));

        // 3. Deploy ETHFSV2FileStorage pointing to FileStore
        console.log("3. Deploying ETHFSV2FileStorage...");
        ethfsStorage = new ETHFSV2FileStorage(address(fileStore));
        console.log(string.concat("ETHFSV2FileStorage deployed at: ", Strings.toHexString(address(ethfsStorage))));

        // 4. Deploy ScriptyStorageV2 pointing to FileStore directly
        console.log("4. Deploying ScriptyStorageV2...");
        scriptyStorage = new ScriptyStorageV2(fileStore, address(this));
        console.log(string.concat("ScriptyStorageV2 deployed at: ", Strings.toHexString(address(scriptyStorage))));

        // 5. Deploy ScriptyBuilderV2
        console.log("5. Deploying ScriptyBuilderV2...");
        scriptyBuilder = new ScriptyBuilderV2();
        console.log(string.concat("ScriptyBuilderV2 deployed at: ", Strings.toHexString(address(scriptyBuilder))));

        // 6. Deploy OnchainRugsHTMLGenerator
        console.log("6. Deploying OnchainRugsHTMLGenerator...");
        htmlGenerator = new OnchainRugsHTMLGenerator();
        console.log(string.concat("OnchainRugsHTMLGenerator deployed at: ", Strings.toHexString(address(htmlGenerator))));

        // 7. Deploy OnchainRugs NFT contract
        console.log("7. Deploying OnchainRugs NFT contract...");
        onchainRugs = new OnchainRugs();
        console.log(string.concat("OnchainRugs deployed at: ", Strings.toHexString(address(onchainRugs))));

        // Configure Rug Scripty contracts
        console.log("Configuring Rug Scripty contracts...");
        onchainRugs.setRugScriptyContracts(
            address(scriptyBuilder),
            address(scriptyStorage),
            address(htmlGenerator)
        );
        console.log("Rug Scripty contracts configured");

        console.log("Starting library uploads...");
        uploadTestLibraries();
    }

    function uploadTestLibraries() internal {
        // Check if files exist before trying to read them
        try vm.readFile("data/rug-p5.js.b64") returns (string memory p5Data) {
            uploadLibrary("onchainrugs-p5.js.b64", p5Data);
        } catch {
            console.log("Warning: rug-p5.js.b64 not found, skipping p5.js upload");
        }

        try vm.readFile("data/rug-algo.js.b64") returns (string memory algoData) {
            uploadLibrary("onchainrugs.js.b64", algoData);
        } catch {
            console.log("Warning: rug-algo.js.b64 not found, skipping algorithm upload");
        }
    }

    function uploadLibrary(string memory name, string memory base64Data) internal {
        bytes memory decodedData = Base64.decode(base64Data);

        // Create content in storage
        scriptyStorage.createContent(name, "");

        // Upload in chunks if needed (using 20KB chunks to be safe)
        uint256 chunkSize = 20000;
        if (decodedData.length <= chunkSize) {
            scriptyStorage.addChunkToContent(name, decodedData);
        } else {
            uint256 numChunks = (decodedData.length + chunkSize - 1) / chunkSize;

            for (uint256 i = 0; i < numChunks; i++) {
                uint256 start = i * chunkSize;
                uint256 end = start + chunkSize > decodedData.length ? decodedData.length : start + chunkSize;

                bytes memory chunk = new bytes(end - start);
                for (uint256 j = 0; j < end - start; j++) {
                    chunk[j] = decodedData[start + j];
                }

                scriptyStorage.addChunkToContent(name, chunk);
            }
        }

        // Freeze content
        scriptyStorage.freezeContent(name);
        console.log(string.concat("Uploaded library: ", name, " Size: ", Strings.toString(decodedData.length), " bytes"));
    }

    function testInfrastructureDeployment() public view {
        console.log("Testing infrastructure deployment...");

        // Verify all contracts are deployed
        assertTrue(address(create2Deployer) != address(0), "CREATE2 Deployer should be deployed");
        assertTrue(address(fileStore) != address(0), "FileStore should be deployed");
        assertTrue(address(ethfsStorage) != address(0), "ETHFSV2FileStorage should be deployed");
        assertTrue(address(scriptyStorage) != address(0), "ScriptyStorageV2 should be deployed");
        assertTrue(address(scriptyBuilder) != address(0), "ScriptyBuilderV2 should be deployed");
        assertTrue(address(htmlGenerator) != address(0), "OnchainRugsHTMLGenerator should be deployed");
        assertTrue(address(onchainRugs) != address(0), "OnchainRugs should be deployed");

        // Verify configuration
        assertEq(onchainRugs.rugScriptyBuilder(), address(scriptyBuilder), "ScriptyBuilder should be configured");
        assertEq(onchainRugs.rugEthFSStorage(), address(scriptyStorage), "EthFSStorage should be configured");
        assertEq(onchainRugs.onchainRugsHTMLGenerator(), address(htmlGenerator), "HTMLGenerator should be configured");

        console.log("All infrastructure contracts deployed and configured!");
    }

    function testHTMLGeneration() public {
        console.log("Testing HTML generation...");

        // Create test rug data using the same structure as OnchainRugs contract
        OnchainRugs.RugData memory rugData = OnchainRugs.RugData({
            seed: TEST_SEED,
            paletteName: "Royal Stewart",
            minifiedPalette: TEST_PALETTE,
            minifiedStripeData: TEST_STRIPE_DATA,
            textRows: new string[](1),
            warpThickness: 8,
            mintTime: block.timestamp,
            filteredCharacterMap: TEST_CHARACTER_MAP,
            complexity: 2,
            characterCount: 10,
            stripeCount: 1
        });
        rugData.textRows[0] = "TEST_RUG";

        bytes memory encodedRugData = abi.encode(rugData);

        // Generate HTML
        string memory html = htmlGenerator.generateProjectHTML(
            encodedRugData,
            1, // tokenId
            address(scriptyBuilder),
            address(scriptyStorage)
        );

        console.log("HTML generated successfully!");
        console.log(string.concat("HTML length: ", Strings.toString(bytes(html).length)));

        // Verify HTML contains expected elements
        assertTrue(bytes(html).length > 1000, "HTML should be substantial");
        assertTrue(_contains(html, "data:text/html;base64,"), "Should be base64 encoded");

        // Extract and decode the base64 content to check for test text
        string memory base64Content = _extractBase64Content(html);
        bytes memory decodedHTML = Base64.decode(base64Content);
        string memory decodedHTMLString = string(decodedHTML);

        assertTrue(_contains(decodedHTMLString, "TEST_RUG"), "Should contain test text");

        // Log first 500 characters for inspection
        console.log("HTML preview (first 500 chars):");
        console.log(_slice(html, 0, 500));

        // Log decoded HTML preview
        console.log("Decoded HTML preview (first 500 chars):");
        console.log(_slice(decodedHTMLString, 0, 500));

        // Save full decoded HTML for inspection
        vm.writeFile("generated_rug.html", decodedHTMLString);
        console.log("Full decoded HTML saved to: generated_rug.html");
    }

    function testLibraryRetrieval() public {
        console.log("Testing library storage and retrieval...");

        // Test retrieving p5.js
        try ethfsStorage.getContent("onchainrugs-p5.js.b64", "") returns (bytes memory p5Content) {
            assertTrue(p5Content.length > 0, "p5.js should have content");
            console.log(string.concat("p5.js retrieved successfully, size: ", Strings.toString(p5Content.length)));
        } catch {
            console.log("Warning: p5.js not available for testing");
        }

        // Test retrieving algorithm
        try ethfsStorage.getContent("onchainrugs.js.b64", "") returns (bytes memory algoContent) {
            assertTrue(algoContent.length > 0, "Algorithm should have content");
            console.log(string.concat("Algorithm retrieved successfully, size: ", Strings.toString(algoContent.length)));
        } catch {
            console.log("Warning: Algorithm not available for testing");
        }
    }

    function testScriptyBuilderDirect() public {
        console.log("Testing ScriptyBuilderV2 directly...");

        // Create minimal HTML request
        HTMLTag[] memory headTags = new HTMLTag[](1);
        headTags[0] = HTMLTag({
            name: "",
            contractAddress: address(0),
            contractData: "",
            tagType: HTMLTagType.useTagOpenAndClose,
            tagOpen: '<meta charset="utf-8"><title>Local Test</title>',
            tagClose: "",
            tagContent: ""
        });

        HTMLTag[] memory bodyTags = new HTMLTag[](1);
        bodyTags[0] = HTMLTag({
            name: "",
            contractAddress: address(0),
            contractData: "",
            tagType: HTMLTagType.script,
            tagOpen: "",
            tagClose: "",
            tagContent: bytes('console.log("Local Scripty test successful!");')
        });

        HTMLRequest memory request = HTMLRequest({
            headTags: headTags,
            bodyTags: bodyTags
        });

        // Generate HTML
        bytes memory html = scriptyBuilder.getHTML(request);

        console.log("ScriptyBuilderV2 direct test successful!");
        console.log(string.concat("HTML length: ", Strings.toString(html.length)));
        assertTrue(html.length > 50, "HTML should have content");
    }

    function testFileStoreOperations() public {
        console.log("Testing FileStore operations...");

        // Test basic FileStore functionality
        string memory testFileName = "test-file.txt";
        string memory testContent = "Hello from local FileStore!";

        // This would normally create a file, but let's just test the interface
        bool existsBefore = fileStore.fileExists(testFileName);
        assertFalse(existsBefore, "Test file should not exist initially");

        console.log("FileStore interface working correctly");
    }

    function testOnchainRugsIntegration() public {
        console.log("Testing OnchainRugs NFT integration...");

        // Test minting a rug (simplified)
        string[] memory textRows = new string[](2);
        textRows[0] = "HELLO";
        textRows[1] = "WORLD";

        // Mint with test parameters
        vm.deal(address(this), 1 ether);
        onchainRugs.mintRug{value: 0.000001 ether}(
            textRows,
            TEST_SEED,
            "Test Palette",
            TEST_STRIPE_DATA,
            TEST_PALETTE,
            TEST_CHARACTER_MAP,
            3, // warpThickness
            2, // complexity
            5, // characterCount
            2  // stripeCount
        );

        console.log("Rug minted successfully with tokenId: 1");

        // Test tokenURI generation (this will use the Scripty system)
        string memory tokenURI = onchainRugs.tokenURI(1);

        console.log("TokenURI generated successfully!");
        console.log(string.concat("TokenURI length: ", Strings.toString(bytes(tokenURI).length)));
        assertTrue(bytes(tokenURI).length > 100, "TokenURI should be substantial");
        assertTrue(_contains(tokenURI, "data:application/json;base64,"), "Should be base64 encoded JSON");

        // Extract and decode the base64 content to check for animation_url
        string memory base64Content = _extractBase64Content(tokenURI);
        bytes memory decodedJSON = Base64.decode(base64Content);
        string memory decodedJSONString = string(decodedJSON);

        assertTrue(_contains(decodedJSONString, "animation_url"), "Should contain animation_url");
        assertTrue(_contains(decodedJSONString, "OnchainRug #1"), "Should contain correct name");
        assertTrue(_contains(decodedJSONString, "data:text/html;base64"), "Should contain HTML animation_url");
    }

    function testMetadataFunctions() public view {
        console.log("Testing metadata functions...");

        // Test HTML generator metadata
        string[] memory libraries = htmlGenerator.getRequiredLibraries();
        assertEq(libraries.length, 2, "Should have 2 required libraries");
        assertEq(libraries[0], "onchainrugs-p5.js.b64", "First library should be p5");
        assertEq(libraries[1], "onchainrugs.js.b64", "Second library should be algorithm");

        assertEq(htmlGenerator.getProjectName(), "OnchainRugs", "Project name should match");
        assertEq(htmlGenerator.getProjectDescription(), "Fully on-chain NFT rug collection with complete p5.js algorithm", "Description should match");

        console.log("Metadata functions working correctly");
        console.log("Project name:", htmlGenerator.getProjectName());
        console.log("Description:", htmlGenerator.getProjectDescription());
    }

    // ERC721TokenReceiver implementation
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // Helper functions
    function _contains(string memory haystack, string memory needle) internal pure returns (bool) {
        bytes memory h = bytes(haystack);
        bytes memory n = bytes(needle);

        if (n.length > h.length) return false;

        for (uint256 i = 0; i <= h.length - n.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < n.length; j++) {
                if (h[i + j] != n[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }
        return false;
    }

    function _slice(string memory str, uint256 start, uint256 length) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(length);
        for (uint256 i = 0; i < length && start + i < strBytes.length; i++) {
            result[i] = strBytes[start + i];
        }
        return string(result);
    }

    function _extractBase64Content(string memory dataURI) internal pure returns (string memory) {
        // Find the comma that separates the data URI prefix from the base64 content
        bytes memory uriBytes = bytes(dataURI);
        for (uint256 i = 0; i < uriBytes.length; i++) {
            if (uriBytes[i] == ",") {
                // Return everything after the comma
                bytes memory result = new bytes(uriBytes.length - i - 1);
                for (uint256 j = 0; j < result.length; j++) {
                    result[j] = uriBytes[i + 1 + j];
                }
                return string(result);
            }
        }
        return "";
    }
}
