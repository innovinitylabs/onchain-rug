pragma solidity 0.8.9;

import "./PaymentProcessorSaleScenarioBase.t.sol";

contract Nonces is PaymentProcessorSaleScenarioBase {

    function test_revokeMasterNonceIncrementsMasterNonce(address account) public {
        vm.assume(account != address(0));

        for(uint256 i = 0; i < 10; ++i) {
            uint256 oldMasterNonce = paymentProcessor.masterNonces(account);
            vm.prank(account);
            paymentProcessor.revokeMasterNonce();
            uint256 newMasterNonce = paymentProcessor.masterNonces(account);
            assertEq(newMasterNonce - oldMasterNonce, 1);
        }
    }

    function test_revokeSingleNonce(address account, address marketplace, uint256 startNonce) public {
        vm.assume(account != address(0));
        vm.assume(startNonce < type(uint32).max - 10);

        for(uint256 nonce = startNonce; nonce < startNonce + 10; ++nonce) {
            vm.prank(account);
            paymentProcessor.revokeSingleNonce(marketplace, nonce);
        }
    }

    function test_revertsWhenRevokingAPreviouslyRevokedNonce(address account, address marketplace, uint256 nonce) public {
        vm.assume(account != address(0));

        vm.prank(account);
        paymentProcessor.revokeSingleNonce(marketplace, nonce);

        vm.prank(account);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__SignatureAlreadyUsedOrRevoked()"))));
        paymentProcessor.revokeSingleNonce(marketplace, nonce);
    }
}