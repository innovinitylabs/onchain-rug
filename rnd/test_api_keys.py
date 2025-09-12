#!/usr/bin/env python3
"""
Test API keys across different blockchain explorers
"""

import os
import requests
import pathlib

def load_env_file():
    """Load environment variables from .env file if it exists."""
    env_file = pathlib.Path(__file__).parent / ".env"
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

def test_api_key(chain_name, url, api_key):
    """Test if API key works for a specific chain."""
    print(f"\n🔍 Testing {chain_name.upper()}")
    print(f"URL: {url}")
    print(f"API Key: {api_key[:8]}..." if api_key else "No API key")
    
    # Test with a simple API call
    params = {
        "module": "account",
        "action": "balance",
        "address": "0x0000000000000000000000000000000000000000",  # Zero address
        "tag": "latest"
    }
    if api_key:
        params["apikey"] = api_key
    
    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if data.get("status") == "1":
            print(f"✅ API key works for {chain_name}")
            return True
        else:
            print(f"❌ API key error: {data.get('message', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"❌ Network error: {e}")
        return False

def main():
    load_env_file()
    
    api_key = os.getenv("ETHERSCAN_API_KEY")
    if not api_key:
        print("❌ No ETHERSCAN_API_KEY found in environment")
        return
    
    chains = {
        "Ethereum": "https://api.etherscan.io/api",
        "Base": "https://api.basescan.org/api",
        "Polygon": "https://api.polygonscan.com/api",
        "Arbitrum": "https://api.arbiscan.io/api",
        "Optimism": "https://api-optimistic.etherscan.io/api"
    }
    
    print("🧪 Testing API key across different chains...")
    
    working_chains = []
    for chain_name, url in chains.items():
        if test_api_key(chain_name, url, api_key):
            working_chains.append(chain_name)
    
    print(f"\n📊 Results:")
    print(f"✅ Working chains: {', '.join(working_chains) if working_chains else 'None'}")
    print(f"❌ Non-working chains: {', '.join(set(chains.keys()) - set(working_chains)) if working_chains else ', '.join(chains.keys())}")
    
    if not working_chains:
        print("\n💡 Suggestions:")
        print("1. Verify your API key is correct")
        print("2. Check if your API key has access to all chains")
        print("3. Some chains might require separate API keys")

if __name__ == "__main__":
    main()
