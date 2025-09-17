import "@nomicfoundation/hardhat-ethers";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainId: 1337,
    },
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
    shapeSepolia: {
      type: "http",
      url: "https://sepolia-rpc.shape.xyz",
      chainId: 11011,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
    },
    shapeMainnet: {
      type: "http",
      url: "https://rpc.shape.xyz",
      chainId: 360,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
    },
  },
  etherscan: {
    apiKey: {
      shapeSepolia: "your-api-key-here",
      shapeMainnet: "your-api-key-here",
    },
    customChains: [
      {
        network: "shapeSepolia",
        chainId: 11011,
        urls: {
          apiURL: "https://sepolia-explorer.shape.xyz/api",
          browserURL: "https://sepolia-explorer.shape.xyz",
        },
      },
      {
        network: "shapeMainnet",
        chainId: 360,
        urls: {
          apiURL: "https://explorer.shape.xyz/api",
          browserURL: "https://explorer.shape.xyz",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};
