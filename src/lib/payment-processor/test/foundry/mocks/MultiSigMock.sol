pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "contracts/PaymentProcessorDataTypes.sol";
import "contracts/IPaymentProcessor.sol";

contract MultiSigMock is ERC1155Holder {

    // bytes4(keccak256("isValidSignature(bytes32,bytes)")
    bytes4 constant internal MAGICVALUE = 0x1626ba7e;

    bool isSignatureValid;

    constructor() {
        isSignatureValid = true;
    }

    fallback() external payable {}
    receive() external payable {}

    function isValidSignature(bytes32 /*_hash*/, bytes memory /*_signature*/) public view returns (bytes4 magicValue) {
        return isSignatureValid ? MAGICVALUE : bytes4(0);
    }

    function setSignaturesInvalid() external {
        isSignatureValid = false;
    }

    function setSignaturesValid() external {
        isSignatureValid = true;
    }

    function setApprovalForAll(TokenProtocols tokenProtocol, address collectionAddress, address operator, bool approval) public {
        if(tokenProtocol == TokenProtocols.ERC721) {
            IERC721(collectionAddress).setApprovalForAll(operator, approval);

        } else if (tokenProtocol == TokenProtocols.ERC1155) {
            IERC1155(collectionAddress).setApprovalForAll(operator, approval);
        }
    }

    function approve(address coinAddress, address spender, uint256 amount) public {
        IERC20(coinAddress).approve(spender, amount);
    }

    function buySingleListing(
        address paymentProcessorAddress,
        MatchedOrder memory saleDetails,
        SignatureECDSA memory signedListing,
        SignatureECDSA memory signedOffer
    ) external {
        IPaymentProcessor(paymentProcessorAddress).buySingleListing{value: saleDetails.offerPrice}(saleDetails, signedListing, signedOffer);
    }

    function buySingleListingCoin(
        address paymentProcessorAddress,
        MatchedOrder memory saleDetails,
        SignatureECDSA memory signedListing,
        SignatureECDSA memory signedOffer
    ) external {
        IPaymentProcessor(paymentProcessorAddress).buySingleListing{value: 0}(saleDetails, signedListing, signedOffer);
    }

    function buyBatchOfListings(
        address paymentProcessorAddress,
        MatchedOrder[] calldata saleDetailsArray,
        SignatureECDSA[] calldata signedListings,
        SignatureECDSA[] calldata signedOffers
    ) external {
        uint256 combinedNativeOfferPrice = 0;
        
        for(uint256 i = 0; i < saleDetailsArray.length; ++i) {
            if(saleDetailsArray[i].paymentCoin == address(0)) {
                combinedNativeOfferPrice += saleDetailsArray[i].offerPrice;
            }
        }

        IPaymentProcessor(paymentProcessorAddress).buyBatchOfListings{value: combinedNativeOfferPrice}(saleDetailsArray, signedListings, signedOffers);
    }

    function sweepCollection(
        address paymentProcessorAddress,
        SignatureECDSA memory signedOffer,
        MatchedOrderBundleBase memory bundleDetails,
        BundledItem[] calldata bundleItems,
        SignatureECDSA[] calldata signedListings
    ) external {
        IPaymentProcessor(paymentProcessorAddress).sweepCollection{
            value: bundleDetails.paymentCoin == address(0) ? bundleDetails.offerPrice : 0}(
            signedOffer, 
            bundleDetails, 
            bundleItems, 
            signedListings);
    }
}