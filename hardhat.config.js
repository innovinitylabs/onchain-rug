require("@nomicfoundation/hardhat-ethers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
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
      chainId: 1337,
    },
    shapeSepolia: {
      url: "https://sepolia-rpc.shape.xyz",
      chainId: 11011,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
    },
    shapeMainnet: {
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
