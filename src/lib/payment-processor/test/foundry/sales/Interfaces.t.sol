pragma solidity 0.8.9;

import "./PaymentProcessorSaleScenarioBase.t.sol";

contract Interfaces is PaymentProcessorSaleScenarioBase {

    function test_supportERC165() public {
        assertTrue(paymentProcessor.supportsInterface(type(IERC165).interfaceId));
    }

    function test_supportIPaymentProcessor() public {
        assertTrue(paymentProcessor.supportsInterface(type(IPaymentProcessor).interfaceId));
    }
}