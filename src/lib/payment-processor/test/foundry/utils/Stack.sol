pragma solidity 0.8.9;

contract StackUint256 {
    uint256[] private stack;
    uint256 private capacity;

    constructor (uint256 capacity_) {
        capacity = capacity_;
    }
    
    // Adds a new element at the top of the stack
    function push(uint256 num) public returns(string memory){   
        // Checks if the stack has reached maximum capacity
        if (stack.length == capacity){
            return "Maximum Capacity Reached";
        }
        stack.push(num);
        return "Element Added";
    }
    
    // Removes the latest element from the stack
    function pop() public returns(uint256){   
        uint256 top = peek();
        stack.pop();
        return top;
    }

    // Returns the stack array
    function getStack() public view returns(uint256[] memory){   
        return stack;
    }

    // Returns the size of the stack array
    function getLen() public view returns(uint256){ 
        return stack.length;
    }
    
    // Returns true if the stack has reached maximum capacity
    function isFull() public view returns(bool){  
        if (stack.length == capacity){
            return true;
        }
        return false;
    }
    
    // Returns true if the stack array has no elements
    function isEmpty() public view returns(bool){
        if (stack.length == 0){
            return true;
        }
        return false;
    }
    
    // Returns the latest element of the stack array 
    // if it is not empty
    function peek() public view returns(uint256){
        if (stack.length > 0){
            return (stack[stack.length - 1]);
        }
        revert();
    }
}