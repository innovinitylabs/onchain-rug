// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "contracts/PaymentProcessor.sol";

contract DeployPaymentProcessor is Script {
    address private immutable wmatic = address(0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270);
    address private immutable usdcPoS = address(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174);
    address private immutable usdtPoS = address(0xc2132D05D31c914a87C6611C10748AEb04B58e8F);
    address private immutable daiPoS = address(0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063);
    uint32 private immutable pushPaymentGasLimit = 2_300;

    function run() public {

        bytes32 saltValue = bytes32(vm.envUint("CREATE2_SALT"));

        address[] memory defaultPaymentMethods = new address[](4);
        defaultPaymentMethods[0] = wmatic;
        defaultPaymentMethods[1] = usdcPoS;
        defaultPaymentMethods[2] = usdtPoS;
        defaultPaymentMethods[3] = daiPoS;

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