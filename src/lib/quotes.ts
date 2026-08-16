import { Contract, JsonRpcProvider } from "ethers";
import type { ChainConfig, ChainKey } from "../wallet/chains";

/** An asset a bonding curve can be priced in. `address: ""` means the chain's native ETH. */
export interface QuoteAsset {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

export const NATIVE_QUOTE: QuoteAsset = {
  address: "",
  symbol: "ETH",
  name: "Ethereum",
  decimals: 18,
};

export function isNativeQuote(quote: QuoteAsset): boolean {
  return quote.address === "";
}

/**
 * Tokenized stocks (RWA) live on the Robinhood Chain as plain ERC20s, so a curve can be
 * priced in them. Addresses verified on-chain (`symbol()` / `decimals()`) before listing;
 * the testnet has no stock tokens, so pairs there are ETH-only.
 */
export const RWA_QUOTES: Record<ChainKey, QuoteAsset[]> = {
  mainnet: [
    { address: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9", symbol: "AAPL", name: "Apple", decimals: 18 },
    { address: "0x322F0929c4625eD5bAd873c95208D54E1c003b2d", symbol: "TSLA", name: "Tesla", decimals: 18 },
    { address: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC", symbol: "NVDA", name: "NVIDIA", decimals: 18 },
    { address: "0xe93237C50D904957Cf27E7B1133b510C669c2e74", symbol: "MSFT", name: "Microsoft", decimals: 18 },
    { address: "0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3", symbol: "GOOGL", name: "Alphabet Class A", decimals: 18 },
    { address: "0x12f190a9F9d7D37a250758b26824B97CE941bF54", symbol: "AMZN", name: "Amazon", decimals: 18 },
    { address: "0xc0D6457C16Cc70d6790Dd43521C899C87ce02f35", symbol: "META", name: "Meta Platforms", decimals: 18 },
    { address: "0x6330D8C3178a418788dF01a47479c0ce7CCF450b", symbol: "COIN", name: "Coinbase", decimals: 18 },
    { address: "0x86923f96303D656E4aa86D9d42D1e57ad2023fdC", symbol: "AMD", name: "AMD", decimals: 18 },
    { address: "0x894E1EC2D74FFE5AEF8Dc8A9e84686acCB964F2A", symbol: "PLTR", name: "Palantir", decimals: 18 },
    { address: "0x117cc2133c37B721F49dE2A7a74833232B3B4C0C", symbol: "SPY", name: "S&P 500 ETF", decimals: 18 },
    { address: "0xD5f3879160bc7c32ebb4dC785F8a4F505888de68", symbol: "QQQ", name: "Invesco QQQ", decimals: 18 },
  ],
  testnet: [],
};

/** Pairs offered in the launch form: native ETH first, then the chain's stock tokens. */
export function quoteOptions(chain: ChainConfig): QuoteAsset[] {
  return [NATIVE_QUOTE, ...RWA_QUOTES[chain.key]];
}

const ERC20_META_ABI = [
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
] as const;

/** Resolve a quote address to a displayable asset, reading the chain for unlisted ones. */
export async function resolveQuote(chain: ChainConfig, address: string): Promise<QuoteAsset> {
  if (!address || address === "0x0000000000000000000000000000000000000000") return NATIVE_QUOTE;
  const known = RWA_QUOTES[chain.key].find((q) => q.address.toLowerCase() === address.toLowerCase());
  if (known) return known;
  try {
    const c = new Contract(address, ERC20_META_ABI, new JsonRpcProvider(chain.rpcUrls[0], chain.chainIdDec));
    const [symbol, name, decimals] = await Promise.all([
      c.symbol() as Promise<string>,
      c.name() as Promise<string>,
      c.decimals() as Promise<bigint>,
    ]);
    return { address, symbol, name, decimals: Number(decimals) };
  } catch {
    return { address, symbol: "TOKEN", name: "Unknown quote asset", decimals: 18 };
  }
}

export async function quoteBalanceOf(
  chain: ChainConfig,
  quote: QuoteAsset,
  account: string,
): Promise<bigint> {
  const rpc = new JsonRpcProvider(chain.rpcUrls[0], chain.chainIdDec);
  if (isNativeQuote(quote)) return rpc.getBalance(account);
  const c = new Contract(quote.address, ERC20_META_ABI, rpc);
  return (await c.balanceOf(account)) as bigint;
}

export { ERC20_META_ABI };
