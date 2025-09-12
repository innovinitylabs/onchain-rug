#!/usr/bin/env python3
"""
Simple test script to debug the contract download issue.
Run this with your API key to test the download functionality.
"""

import os
import sys
import json
import requests

def test_download(api_key, contract_address, chain="base"):
    """Test downloading a contract with debugging info."""
    
    chains = {
        "base": "https://api.basescan.org/api",
        "ethereum": "https://api.etherscan.io/api"
    }
    
    if chain not in chains:
        print(f"Error: Unsupported chain '{chain}'")
        return False
    
    url = chains[chain]
    print(f"Testing download from {chain.upper()}")
    print(f"Contract: {contract_address}")
    print(f"API Key: {api_key[:8]}..." if api_key else "No API key")
    print(f"URL: {url}")
    print("-" * 50)
    
    # Prepare API request
    params = {
        "module": "contract",
        "action": "getsourcecode", 
        "address": contract_address
    }
    if api_key:
        params["apikey"] = api_key
    
    try:
        print("Making API request...")
        response = requests.get(url, params=params, timeout=30)
        print(f"Response status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"API Response status: {data.get('status')}")
        print(f"API Response message: {data.get('message')}")
        
        if data["status"] != "1":
            print(f"API Error: {data.get('message', 'Unknown error')}")
            print(f"Full response: {json.dumps(data, indent=2)}")
            return False
        
        result = data["result"][0]
        src = result["SourceCode"]
        
        print(f"Contract Name: {result.get('ContractName', 'Unknown')}")
        print(f"Compiler Version: {result.get('CompilerVersion', 'Unknown')}")
        print(f"Source Code Length: {len(src) if src else 0}")
        
        if not src or src.strip() == "":
            print("No source code available")
            return False
        
        # Check source code format
        src = src.strip()
        print(f"Source starts with: {src[:50]}...")
        print(f"Source ends with: ...{src[-50:]}")
        
        # Test JSON parsing
        if src.startswith("{") and src.endswith("}"):
            print("Source appears to be JSON format")
            try:
                parsed = json.loads(src)
                print(f"JSON parsing successful")
                print(f"JSON keys: {list(parsed.keys())}")
                if "sources" in parsed:
                    print(f"Multi-file contract with {len(parsed['sources'])} files")
                    for path in list(parsed['sources'].keys())[:3]:  # Show first 3 files
                        print(f"  - {path}")
                else:
                    print("No 'sources' key found in JSON")
            except json.JSONDecodeError as e:
                print(f"JSON parsing failed: {e}")
                print(f"First 200 chars: {src[:200]}")
        elif src.startswith("{{") and src.endswith("}}"):
            print("Source appears to be flattened JSON format")
            try:
                normalized = src[1:-1]
                parsed = json.loads(normalized)
                print(f"Flattened JSON parsing successful")
                print(f"JSON keys: {list(parsed.keys())}")
            except json.JSONDecodeError as e:
                print(f"Flattened JSON parsing failed: {e}")
        else:
            print("Source appears to be single Solidity file")
        
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python test_download.py <api_key> <contract_address> [chain]")
        print("Example: python test_download.py YOUR_API_KEY 0x185fbb7597ef4a2f55faf70302e196e642c4a673 base")
        sys.exit(1)
    
    api_key = sys.argv[1]
    contract_address = sys.argv[2]
    chain = sys.argv[3] if len(sys.argv) > 3 else "base"
    
    success = test_download(api_key, contract_address, chain)
    if success:
        print("\n✅ Test successful! The contract can be downloaded.")
    else:
        print("\n❌ Test failed. Check the error messages above.")
