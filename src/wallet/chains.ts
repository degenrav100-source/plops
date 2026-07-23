export type ChainKey = "mainnet" | "testnet";

export interface ChainConfig {
  key: ChainKey;
  chainIdHex: string;
  chainIdDec: number;
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  short: string;
  testnet: boolean;
}

export const CHAINS: Record<ChainKey, ChainConfig> = {
  mainnet: {
    key: "mainnet",
    chainIdHex: "0x1237", // 4663
    chainIdDec: 4663,
    chainName: "Robinhood Chain",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"],
    blockExplorerUrls: ["https://robinhoodchain.blockscout.com"],
    short: "Mainnet",
    testnet: false,
  },
  testnet: {
    key: "testnet",
    chainIdHex: "0xb626", // 46630
    chainIdDec: 46630,
    chainName: "Robinhood Chain Testnet",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://rpc.testnet.chain.robinhood.com/rpc"],
    blockExplorerUrls: ["https://explorer.testnet.chain.robinhood.com"],
    short: "Testnet",
    testnet: true,
  },
};

export const DEFAULT_CHAIN: ChainKey = "testnet";

export function chainByIdHex(idHex: string): ChainConfig | undefined {
  const normalized = idHex.toLowerCase();
  return Object.values(CHAINS).find((c) => c.chainIdHex === normalized);
}

export function explorerTx(chain: ChainConfig, hash: string): string {
  return `${chain.blockExplorerUrls[0]}/tx/${hash}`;
}

export function explorerAddress(chain: ChainConfig, address: string): string {
  return `${chain.blockExplorerUrls[0]}/address/${address}`;
}

export function explorerToken(chain: ChainConfig, address: string): string {
  return `${chain.blockExplorerUrls[0]}/token/${address}`;
}
