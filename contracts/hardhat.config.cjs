require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        // OpenZeppelin's ERC721 path needs the cancun `mcopy` opcode; Robinhood Chain
        // (Arbitrum Orbit) executes it on mainnet and testnet alike.
        settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "cancun" },
      },
    ],
    overrides: {
      // the artwork lives on-chain, so trade a little runtime gas for deployable bytecode
      "contracts/PlopsNFT.sol": {
        version: "0.8.24",
        settings: { optimizer: { enabled: true, runs: 1 }, evmVersion: "cancun" },
      },
    },
  },
  networks: {
    // Robinhood Chain testnet (Arbitrum Orbit L2 on Sepolia)
    robinhoodTestnet: {
      url: "https://rpc.testnet.chain.robinhood.com/rpc",
      chainId: 46630,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
    // Robinhood Chain mainnet (Arbitrum Orbit L2)
    robinhoodMainnet: {
      url: "https://rpc.mainnet.chain.robinhood.com",
      chainId: 4663,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
};
