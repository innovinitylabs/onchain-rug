// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "contracts/PaymentProcessor.sol";

contract DeployPaymentProcessor is Script {
    address private immutable weth = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    address private immutable usdc = address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);
    address private immutable usdt = address(0xdAC17F958D2ee523a2206206994597C13D831ec7);
    address private immutable dai = address(0x6B175474E89094C44Da98b954EedeAC495271d0F);
    uint32 private immutable pushPaymentGasLimit = 2_300;

    function run() public {

        bytes32 saltValue = bytes32(vm.envUint("CREATE2_SALT"));

        address[] memory defaultPaymentMethods = new address[](4);
        defaultPaymentMethods[0] = weth;
        defaultPaymentMethods[1] = usdc;
        defaultPaymentMethods[2] = usdt;
        defaultPaymentMethods[3] = dai;

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