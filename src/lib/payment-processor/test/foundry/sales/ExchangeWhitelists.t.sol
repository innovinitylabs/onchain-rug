pragma solidity 0.8.9;

import "./PaymentProcessorSaleScenarioBase.t.sol";

contract ExchangeWhitelists is PaymentProcessorSaleScenarioBase {

    function test_revertsWhenWhitelistingAccountForDefaultSecurityPolicy(address account) public {
        vm.assume(account != address(0));
        uint256 defaultSecurityPolicyId = paymentProcessor.DEFAULT_SECURITY_POLICY_ID();
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__CallerDoesNotOwnSecurityPolicy()"))));
        paymentProcessor.whitelistExchange(defaultSecurityPolicyId, account);
        assertFalse(paymentProcessor.isWhitelisted(defaultSecurityPolicyId, account));
    }

    function test_securityPolicyCreatorCanWhitelistAccounts(
        address policyAdmin,
        bool enforceExchangeWhitelist,
        bool enforcePaymentMethodWhitelist,
        bool enforcePricingConstraints,
        bool disablePrivateListings,
        bool disableDelegatedPurchases,
        bool disableEIP1271Signatures,
        bool disableExchangeWhitelistEOABypass,
        uint32 pushPaymentGasLimit,
        string calldata registryName) public {

        address[] memory accounts = new address[](3);
        accounts[0] = address(0x5eadbeef);
        accounts[1] = address(0x6eadbeef);
        accounts[2] = address(0x7eadbeef);

        vm.assume(policyAdmin != address(0));

        vm.startPrank(policyAdmin);
        uint256 securityPolicyId = paymentProcessor.createSecurityPolicy(
            enforceExchangeWhitelist, 
            enforcePaymentMethodWhitelist, 
            enforcePricingConstraints,
            disablePrivateListings, 
            disableDelegatedPurchases, 
            disableEIP1271Signatures, 
            disableExchangeWhitelistEOABypass, 
            pushPaymentGasLimit, 
            registryName);

        for(uint256 i = 0; i < accounts.length; ++i) {
            paymentProcessor.whitelistExchange(securityPolicyId, accounts[i]);
            assertTrue(paymentProcessor.isWhitelisted(securityPolicyId, accounts[i]));
        }

        vm.stopPrank();
    }

    function test_revertsWhenSecurityPolicyCreatorWhitelistsAccountsThatAreAlreadyWhitelisted(
        address policyAdmin,
        bool enforceExchangeWhitelist,
        bool enforcePaymentMethodWhitelist,
        bool enforcePricingConstraints,
        bool disablePrivateListings,
        bool disableDelegatedPurchases,
        bool disableEIP1271Signatures,
        bool disableExchangeWhitelistEOABypass,
        uint32 pushPaymentGasLimit,
        string calldata registryName) public {

        address[] memory accounts = new address[](3);
        accounts[0] = address(0x5eadbeef);
        accounts[1] = address(0x6eadbeef);
        accounts[2] = address(0x7eadbeef);

        vm.assume(policyAdmin != address(0));

        vm.startPrank(policyAdmin);
        uint256 securityPolicyId = paymentProcessor.createSecurityPolicy(
            enforceExchangeWhitelist, 
            enforcePaymentMethodWhitelist, 
            enforcePricingConstraints,
            disablePrivateListings, 
            disableDelegatedPurchases, 
            disableEIP1271Signatures, 
            disableExchangeWhitelistEOABypass, 
            pushPaymentGasLimit, 
            registryName);

        for(uint256 i = 0; i < accounts.length; ++i) {
            paymentProcessor.whitelistExchange(securityPolicyId, accounts[i]);
            assertTrue(paymentProcessor.isWhitelisted(securityPolicyId, accounts[i]));

            vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__ExchangeIsWhitelisted()"))));
            paymentProcessor.whitelistExchange(securityPolicyId, accounts[i]);
        }

        vm.stopPrank();
    }

    function test_revertsWhenSecurityPolicyCreatorWhitelistsZeroAddress(
        address policyAdmin,
        bool enforceExchangeWhitelist,
        bool enforcePaymentMethodWhitelist,
        bool enforcePricingConstraints,
        bool disablePrivateListings,
        bool disableDelegatedPurchases,
        bool disableEIP1271Signatures,
        bool disableExchangeWhitelistEOABypass,
        uint32 pushPaymentGasLimit,
        string calldata registryName) public {

        vm.assume(policyAdmin != address(0));

        vm.startPrank(policyAdmin);
        uint256 securityPolicyId = paymentProcessor.createSecurityPolicy(
            enforceExchangeWhitelist, 
            enforcePaymentMethodWhitelist, 
            enforcePricingConstraints,
            disablePrivateListings, 
            disableDelegatedPurchases, 
            disableEIP1271Signatures, 
            disableExchangeWhitelistEOABypass, 
            pushPaymentGasLimit, 
            registryName);

        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__AddressCannotBeZero()"))));
        paymentProcessor.whitelistExchange(securityPolicyId, address(0));

        vm.stopPrank();
    }

    function test_revertsWhenUnwhitelistingAccountForDefaultSecurityPolicy(address account) public {
        vm.assume(account != address(0));
        uint256 defaultSecurityPolicyId = paymentProcessor.DEFAULT_SECURITY_POLICY_ID();
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__CallerDoesNotOwnSecurityPolicy()"))));
        paymentProcessor.unwhitelistExchange(defaultSecurityPolicyId, account);
        assertFalse(paymentProcessor.isWhitelisted(defaultSecurityPolicyId, account));
    }

    function test_revertsWhenSecurityPolicyCreatorUnwhitelistsAccountsThatAreNotWhitelisted(
        address policyAdmin,
        bool enforceExchangeWhitelist,
        bool enforcePaymentMethodWhitelist,
        bool enforcePricingConstraints,
        bool disablePrivateListings,
        bool disableDelegatedPurchases,
        bool disableEIP1271Signatures,
        bool disableExchangeWhitelistEOABypass,
        uint32 pushPaymentGasLimit,
        string calldata registryName) public {

        address[] memory accounts = new address[](3);
        accounts[0] = address(0x5eadbeef);
        accounts[1] = address(0x6eadbeef);
        accounts[2] = address(0x7eadbeef);

        vm.assume(policyAdmin != address(0));

        vm.startPrank(policyAdmin);
        uint256 securityPolicyId = paymentProcessor.createSecurityPolicy(
            enforceExchangeWhitelist, 
            enforcePaymentMethodWhitelist, 
            enforcePricingConstraints,
            disablePrivateListings, 
            disableDelegatedPurchases, 
            disableEIP1271Signatures, 
            disableExchangeWhitelistEOABypass, 
            pushPaymentGasLimit, 
            registryName);

        for(uint256 i = 0; i < accounts.length; ++i) {
            vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__ExchangeIsNotWhitelisted()"))));
            paymentProcessor.unwhitelistExchange(securityPolicyId, accounts[i]);
        }

        vm.stopPrank();
    }

    function test_securityPolicyCreatorCanUnwhitelistAccounts(
        address policyAdmin,
        bool enforceExchangeWhitelist,
        bool enforcePaymentMethodWhitelist,
        bool enforcePricingConstraints,
        bool disablePrivateListings,
        bool disableDelegatedPurchases,
        bool disableEIP1271Signatures,
        bool disableExchangeWhitelistEOABypass,
        uint32 pushPaymentGasLimit,
        string calldata registryName) public {

        address[] memory accounts = new address[](3);
        accounts[0] = address(0x5eadbeef);
        accounts[1] = address(0x6eadbeef);
        accounts[2] = address(0x7eadbeef);

        vm.assume(policyAdmin != address(0));

        vm.startPrank(policyAdmin);
        uint256 securityPolicyId = paymentProcessor.createSecurityPolicy(
            enforceExchangeWhitelist, 
            enforcePaymentMethodWhitelist, 
            enforcePricingConstraints,
            disablePrivateListings, 
            disableDelegatedPurchases, 
            disableEIP1271Signatures, 
            disableExchangeWhitelistEOABypass, 
            pushPaymentGasLimit, 
            registryName);

        for(uint256 i = 0; i < accounts.length; ++i) {
            paymentProcessor.whitelistExchange(securityPolicyId, accounts[i]);
            assertTrue(paymentProcessor.isWhitelisted(securityPolicyId, accounts[i]));

            paymentProcessor.unwhitelistExchange(securityPolicyId, accounts[i]);
            assertFalse(paymentProcessor.isWhitelisted(securityPolicyId, accounts[i]));
        }

        vm.stopPrank();
    }
}