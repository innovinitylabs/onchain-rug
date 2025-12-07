// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "contracts/PaymentProcessor.sol";

contract DeployPaymentProcessor is Script {
    address private immutable wmatic = address(0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889);
    uint32 private immutable pushPaymentGasLimit = 2_300;

    function run() public {

        bytes32 saltValue = bytes32(vm.envUint("CREATE2_SALT"));

        address[] memory defaultPaymentMethods = new address[](1);
        defaultPaymentMethods[0] = wmatic;

        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        PaymentProcessor paymentProcessor = 
            new PaymentProcessor{salt: saltValue}(
                vm.addr(deployerPrivateKey),
                pushPaymentGasLimit,
                defaultPaymentMethods
            );
        console.log("Payment Processor: ", address(paymentProcessor));

        vm.stopBroadcast();
    }
}