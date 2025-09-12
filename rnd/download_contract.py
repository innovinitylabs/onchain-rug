#!/usr/bin/env python3
"""
Contract Source Code Downloader

This script downloads verified smart contract source code from various blockchain explorers
for feasibility research and analysis.

Usage:
    python download_contract.py <contract_address> [chain]

Examples:
    python download_contract.py 0x185fbb7597ef4a2f55faf70302e196e642c4a673 base
    python download_contract.py 0xA0b86a33E6441b8c4C8C0e4b8b8c4C8C0e4b8b8c4
"""

import os
import json
import requests
import pathlib
import sys
import argparse
from typing import Dict, Optional

# Load environment variables from .env file
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

# API endpoints for different chains using Etherscan V2 API
CHAINS = {
    "ethereum": {
        "name": "Ethereum",
        "chainid": 1,
        "url": "https://api.etherscan.io/v2/api",
        "explorer": "https://etherscan.io"
    },
    "base": {
        "name": "Base",
        "chainid": 8453,
        "url": "https://api.etherscan.io/v2/api",
        "explorer": "https://basescan.org"
    },
    "polygon": {
        "name": "Polygon",
        "chainid": 137,
        "url": "https://api.etherscan.io/v2/api",
        "explorer": "https://polygonscan.com"
    },
    "arbitrum": {
        "name": "Arbitrum",
        "chainid": 42161,
        "url": "https://api.etherscan.io/v2/api",
        "explorer": "https://arbiscan.io"
    },
    "optimism": {
        "name": "Optimism",
        "chainid": 10,
        "url": "https://api.etherscan.io/v2/api",
        "explorer": "https://optimistic.etherscan.io"
    },
    "avalanche": {
        "name": "Avalanche",
        "chainid": 43114,
        "url": "https://api.etherscan.io/v2/api",
        "explorer": "https://snowtrace.io"
    },
    "bsc": {
        "name": "BNB Smart Chain",
        "chainid": 56,
        "url": "https://api.etherscan.io/v2/api",
        "explorer": "https://bscscan.com"
    },
    "linea": {
        "name": "Linea",
        "chainid": 59144,
        "url": "https://api.etherscan.io/v2/api",
        "explorer": "https://lineascan.build"
    },
    "scroll": {
        "name": "Scroll",
        "chainid": 534352,
        "url": "https://api.etherscan.io/v2/api",
        "explorer": "https://scrollscan.com"
    },
    "blast": {
        "name": "Blast",
        "chainid": 81457,
        "url": "https://api.etherscan.io/v2/api",
        "explorer": "https://blastscan.io"
    }
}

def get_api_key() -> Optional[str]:
    """Get API key from environment variable."""
    api_key = os.getenv("ETHERSCAN_API_KEY")
    if not api_key:
        print("Warning: ETHERSCAN_API_KEY environment variable not set.")
        print("Some API calls may be rate-limited without an API key.")
        print("Get your free API key from: https://etherscan.io/apis")
    else:
        print(f"Using API key: {api_key[:8]}...")
    return api_key

def get_contract_creator(chain_info: dict, addr: str, api_key: Optional[str] = None) -> Optional[dict]:
    """Get contract creator and creation transaction hash."""
    params = {
        "chainid": chain_info["chainid"],
        "module": "contract",
        "action": "getcontractcreation",
        "contractaddresses": addr
    }
    if api_key:
        params["apikey"] = api_key
    
    try:
        response = requests.get(chain_info["url"], params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        if data["status"] == "1" and data["result"]:
            return data["result"][0]
        return None
    except Exception:
        return None

def download_contract(chain: str, chain_info: dict, addr: str, api_key: Optional[str] = None) -> bool:
    """
    Download contract source code from the specified chain.
    
    Args:
        chain: Chain name (e.g., 'ethereum', 'base')
        chain_info: Chain information dictionary with url, chainid, etc.
        addr: Contract address
        api_key: Optional API key for rate limiting
        
    Returns:
        True if successful, False otherwise
    """
    print(f"[{chain.upper()}] Downloading contract {addr}...")
    
    # Prepare API request using V2 API with chainid
    params = {
        "chainid": chain_info["chainid"],
        "module": "contract",
        "action": "getsourcecode", 
        "address": addr
    }
    if api_key:
        params["apikey"] = api_key
    
    try:
        response = requests.get(chain_info["url"], params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        if data["status"] != "1":
            print(f"[{chain.upper()}] API Error: {data.get('message', 'Unknown error')}")
            print(f"[{chain.upper()}] Full response: {data}")
            return False
            
        result = data["result"][0]
        src = result["SourceCode"]
        
        if not src or src.strip() == "":
            print(f"[{chain.upper()}] No verified source code available for {addr}")
            print(f"[{chain.upper()}] Check manually: {chain_info['explorer']}/address/{addr}")
            return False
        
        # Create output folder
        folder = pathlib.Path(f"contracts/{chain}-{addr}")
        folder.mkdir(parents=True, exist_ok=True)
        
        # Get contract creator information
        creator_info = get_contract_creator(chain_info, addr, api_key)
        
        # Save contract metadata
        metadata = {
            "address": addr,
            "chain": chain,
            "contract_name": result.get("ContractName", "Unknown"),
            "compiler_version": result.get("CompilerVersion", "Unknown"),
            "optimization_used": result.get("OptimizationUsed", "Unknown"),
            "runs": result.get("Runs", "Unknown"),
            "constructor_arguments": result.get("ConstructorArguments", ""),
            "library": result.get("Library", ""),
            "license_type": result.get("LicenseType", "Unknown"),
            "proxy": result.get("Proxy", "0"),
            "implementation": result.get("Implementation", ""),
            "swarm_source": result.get("SwarmSource", ""),
            "abi": result.get("ABI", ""),
            "source_code": "Downloaded successfully",
            "creator": creator_info.get("contractCreator", "") if creator_info else "",
            "creation_tx_hash": creator_info.get("txHash", "") if creator_info else ""
        }
        
        with open(folder / "metadata.json", "w") as f:
            json.dump(metadata, f, indent=2)
        
        # Also save ABI separately if available
        abi = result.get("ABI")
        if abi and abi != "Contract source code not verified":
            try:
                abi_json = json.loads(abi) if isinstance(abi, str) else abi
                with open(folder / "abi.json", "w") as f:
                    json.dump(abi_json, f, indent=2)
                print(f"[{chain.upper()}] ✓ ABI saved to abi.json")
            except json.JSONDecodeError:
                print(f"[{chain.upper()}] Warning: Could not parse ABI")
        
        src = src.strip()
        
        # Handle multi-file JSON format (standard JSON input)
        try:
            # Try to parse as JSON first
            if src.startswith("{") and src.endswith("}"):
                print(f"[{chain.upper()}] Attempting to parse as JSON...")
                parsed = json.loads(src)
                if "sources" in parsed:
                    print(f"[{chain.upper()}] Multi-file contract detected")
                    for path, obj in parsed["sources"].items():
                        content = obj.get("content") if isinstance(obj, dict) else obj
                        if content:
                            out_file = folder / path
                            out_file.parent.mkdir(parents=True, exist_ok=True)
                            out_file.write_text(content, encoding='utf-8')
                            print(f"[{chain.upper()}] ✓ {out_file}")
                    return True
        except json.JSONDecodeError as e:
            print(f"[{chain.upper()}] JSON parse error: {e}")
            print(f"[{chain.upper()}] Source preview: {src[:200]}...")
            pass
        
        # Handle flattened JSON format ({{...}})
        try:
            if src.startswith("{{") and src.endswith("}}"):
                # Remove outer braces
                normalized = src[1:-1]
                parsed = json.loads(normalized)
                if "sources" in parsed:
                    print(f"[{chain.upper()}] Flattened multi-file contract detected")
                    for path, obj in parsed["sources"].items():
                        content = obj.get("content") if isinstance(obj, dict) else obj
                        if content:
                            out_file = folder / path
                            out_file.parent.mkdir(parents=True, exist_ok=True)
                            out_file.write_text(content, encoding='utf-8')
                            print(f"[{chain.upper()}] ✓ {out_file}")
                    return True
        except json.JSONDecodeError:
            pass
        
        # Fallback: single file
        print(f"[{chain.upper()}] Single-file contract detected")
        contract_name = result.get("ContractName", "Contract")
        out_file = folder / f"{contract_name}.sol"
        out_file.write_text(src, encoding='utf-8')
        print(f"[{chain.upper()}] ✓ {out_file}")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"[{chain.upper()}] Network error: {e}")
        return False
    except Exception as e:
        print(f"[{chain.upper()}] Error: {e}")
        return False

def main():
    # Load environment variables from .env file
    load_env_file()
    
    parser = argparse.ArgumentParser(
        description="Download verified smart contract source code",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s 0x185fbb7597ef4a2f55faf70302e196e642c4a673 base
  %(prog)s 0xA0b86a33E6441b8c4C8C0e4b8b8c4C8C0e4b8b8c4
  %(prog)s 0x1234567890123456789012345678901234567890 --all-chains
        """
    )
    
    parser.add_argument("address", help="Contract address to download")
    parser.add_argument("chain", nargs="?", help="Blockchain to check (default: ethereum)")
    parser.add_argument("--all-chains", action="store_true", 
                       help="Try downloading from all supported chains")
    parser.add_argument("--list-chains", action="store_true",
                       help="List all supported chains and exit")
    
    args = parser.parse_args()
    
    if args.list_chains:
        print("Supported chains:")
        for key, info in CHAINS.items():
            print(f"  {key:12} - {info['name']}")
        return
    
    # Validate address format
    addr = args.address
    if not addr.startswith("0x") or len(addr) != 42:
        print("Error: Invalid contract address format. Must be 42 characters starting with 0x")
        sys.exit(1)
    
    # Get API key
    api_key = get_api_key()
    
    # Determine which chains to check
    if args.all_chains:
        chains_to_check = list(CHAINS.keys())
    else:
        chain = args.chain or "ethereum"
        if chain not in CHAINS:
            print(f"Error: Unsupported chain '{chain}'")
            print("Supported chains:", ", ".join(CHAINS.keys()))
            sys.exit(1)
        chains_to_check = [chain]
    
    # Download from each chain
    success_count = 0
    for chain in chains_to_check:
        if download_contract(chain, CHAINS[chain], addr, api_key):
            success_count += 1
    
    print(f"\nSummary: Successfully downloaded from {success_count}/{len(chains_to_check)} chains")
    
    if success_count == 0:
        print("\nNo verified source code found. This could mean:")
        print("- Contract is not verified on any of the checked chains")
        print("- Contract address is incorrect")
        print("- Contract is deployed on a different chain")
        sys.exit(1)

if __name__ == "__main__":
    main()
