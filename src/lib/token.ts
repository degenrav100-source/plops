import {
  BrowserProvider,
  Contract,
  ContractFactory,
  JsonRpcProvider,
  type Eip1193Provider as EthersEip1193Provider,
  type InterfaceAbi,
  type JsonFragment,
} from "ethers";
import { PLOPS_TOKEN_ABI, PLOPS_TOKEN_BYTECODE } from "../contracts/PlopsBondingToken";
import { PLOPS_QUOTED_ABI, PLOPS_QUOTED_BYTECODE } from "../contracts/PlopsQuotedToken";
import type { Eip1193Provider } from "../wallet/types";
import type { ChainConfig } from "../wallet/chains";
import { NATIVE_QUOTE, resolveQuote, isNativeQuote, ERC20_META_ABI, type QuoteAsset } from "./quotes";

export interface DeployParams {
  name: string;
  symbol: string;
  description: string;
  imageURI: string;
  twitter: string;
  telegram: string;
  website: string;
}

export interface TokenData {
  address: string;
  name: string;
  symbol: string;
  description: string;
  imageURI: string;
  twitter: string;
  telegram: string;
  website: string;
  creator: string;
  totalSupply: bigint;
  /** Curve reserve in quote base units (virtual + real). */
  quoteReserve: bigint;
  tokenReserve: bigint;
  /** Quote base units actually redeemable by sellers. */
  realQuoteReserve: bigint;
  /** Price in quote base units per whole token. */
  priceWei: bigint;
  userBalance: bigint;
  /** Asset the curve is priced in — native ETH or a tokenized stock. */
  quote: QuoteAsset;
}

function browserProvider(provider: Eip1193Provider): BrowserProvider {
  return new BrowserProvider(provider as unknown as EthersEip1193Provider, "any");
}

/**
 * Both curve flavours share every read name except the reserve/quote accessors, so
 * one merged ABI can read either. Constructors and repeated fragments are dropped —
 * ethers rejects duplicate definitions.
 */
const CURVE_ABI: InterfaceAbi = (() => {
  const seen = new Set<string>();
  const out: JsonFragment[] = [];
  for (const f of [...PLOPS_TOKEN_ABI, ...PLOPS_QUOTED_ABI] as readonly JsonFragment[]) {
    if (f.type === "constructor") continue;
    const key = `${f.type}:${f.name}:${(f.inputs ?? []).map((i) => i.type).join(",")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
})();

async function quoteAddressOf(chain: ChainConfig, address: string): Promise<string> {
  const rpc = new JsonRpcProvider(chain.rpcUrls[0], chain.chainIdDec);
  const c = new Contract(address, ["function quote() view returns (address)"], rpc);
  try {
    return (await c.quote()) as string;
  } catch {
    return ""; // native-ETH curve: no `quote()` on the contract
  }
}

/** Deploy a new bonding-curve token from the connected wallet. Optionally seed an initial buy. */
export async function deployToken(
  provider: Eip1193Provider,
  params: DeployParams,
  initialBuyWei: bigint,
): Promise<{ address: string; txHash: string }> {
  const signer = await browserProvider(provider).getSigner();
  const creator = await signer.getAddress();
  const factory = new ContractFactory(PLOPS_TOKEN_ABI, PLOPS_TOKEN_BYTECODE, signer);
  const meta = [
    params.description,
    params.imageURI,
    params.twitter,
    params.telegram,
    params.website,
  ];
  const contract = await factory.deploy(params.name, params.symbol, creator, meta, {
    value: initialBuyWei,
  });
  const deployTx = contract.deploymentTransaction();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  return { address, txHash: deployTx?.hash ?? "" };
}

/**
 * Deploy a curve priced in an ERC20 quote asset, then (optionally) make the creator's
 * seed buy. Used only when the chain has no launch index yet — the factory does both
 * in a single transaction.
 */
export async function deployQuotedToken(
  provider: Eip1193Provider,
  params: DeployParams,
  quote: QuoteAsset,
  virtualQuote: bigint,
  initialBuy: bigint,
): Promise<{ address: string; txHash: string }> {
  const signer = await browserProvider(provider).getSigner();
  const creator = await signer.getAddress();
  const deployer = new ContractFactory(PLOPS_QUOTED_ABI, PLOPS_QUOTED_BYTECODE, signer);
  const meta = [
    params.description,
    params.imageURI,
    params.twitter,
    params.telegram,
    params.website,
  ];
  const contract = await deployer.deploy(
    params.name,
    params.symbol,
    creator,
    quote.address,
    virtualQuote,
    meta,
  );
  const deployTx = contract.deploymentTransaction();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  if (initialBuy > 0n) await buyToken(provider, address, initialBuy, 300, quote);
  return { address, txHash: deployTx?.hash ?? "" };
}

/** Read all token + curve state via the chain RPC (independent of the wallet's current network). */
export async function readToken(
  chain: ChainConfig,
  address: string,
  account?: string,
): Promise<TokenData> {
  const rpc = new JsonRpcProvider(chain.rpcUrls[0], chain.chainIdDec);
  const c = new Contract(address, CURVE_ABI, rpc);
  const quoteAddr = await quoteAddressOf(chain, address);
  const quoted = quoteAddr !== "";
  const [
    name,
    symbol,
    description,
    imageURI,
    twitter,
    telegram,
    website,
    creator,
    totalSupply,
    quoteReserve,
    tokenReserve,
    realQuoteReserve,
    priceWei,
    quote,
  ] = await Promise.all([
    c.name() as Promise<string>,
    c.symbol() as Promise<string>,
    c.description() as Promise<string>,
    c.imageURI() as Promise<string>,
    c.twitter() as Promise<string>,
    c.telegram() as Promise<string>,
    c.website() as Promise<string>,
    c.creator() as Promise<string>,
    c.totalSupply() as Promise<bigint>,
    (quoted ? c.quoteReserve() : c.ethReserve()) as Promise<bigint>,
    c.tokenReserve() as Promise<bigint>,
    (quoted ? c.realQuoteReserve() : c.realEthReserve()) as Promise<bigint>,
    c.currentPrice() as Promise<bigint>,
    quoted ? resolveQuote(chain, quoteAddr) : Promise.resolve(NATIVE_QUOTE),
  ]);
  let userBalance = 0n;
  if (account) userBalance = (await c.balanceOf(account)) as bigint;
  return {
    address,
    name,
    symbol,
    description,
    imageURI,
    twitter,
    telegram,
    website,
    creator,
    totalSupply,
    quoteReserve,
    tokenReserve,
    realQuoteReserve,
    priceWei,
    userBalance,
    quote,
  };
}

export interface TokenBrief {
  address: string;
  symbol: string;
  imageURI: string;
}

/** Just enough to render a token chip — two calls instead of the thirteen `readToken` makes. */
export async function readTokenBrief(chain: ChainConfig, address: string): Promise<TokenBrief> {
  const rpc = new JsonRpcProvider(chain.rpcUrls[0], chain.chainIdDec);
  const c = new Contract(address, PLOPS_TOKEN_ABI, rpc);
  const [symbol, imageURI] = await Promise.all([
    c.symbol() as Promise<string>,
    c.imageURI() as Promise<string>,
  ]);
  return { address, symbol, imageURI };
}

export async function quoteBuy(
  chain: ChainConfig,
  address: string,
  quoteIn: bigint,
): Promise<bigint> {
  const rpc = new JsonRpcProvider(chain.rpcUrls[0], chain.chainIdDec);
  const c = new Contract(address, PLOPS_TOKEN_ABI, rpc);
  const [tokensOut] = (await c.quoteBuy(quoteIn)) as [bigint, bigint];
  return tokensOut;
}

export async function quoteSell(
  chain: ChainConfig,
  address: string,
  tokenIn: bigint,
): Promise<bigint> {
  const rpc = new JsonRpcProvider(chain.rpcUrls[0], chain.chainIdDec);
  const c = new Contract(address, PLOPS_TOKEN_ABI, rpc);
  const [ethOut] = (await c.quoteSell(tokenIn)) as [bigint, bigint];
  return ethOut;
}

function applySlippageDown(amount: bigint, slippageBps: number): bigint {
  return amount - (amount * BigInt(slippageBps)) / 10_000n;
}

/**
 * Approve `spender` for `amount` of an ERC20 quote asset when the current allowance
 * is short. Returns the approval hash, or "" when no approval was needed.
 */
export async function ensureQuoteAllowance(
  provider: Eip1193Provider,
  quote: QuoteAsset,
  spender: string,
  amount: bigint,
): Promise<string> {
  if (isNativeQuote(quote) || amount === 0n) return "";
  const signer = await browserProvider(provider).getSigner();
  const owner = await signer.getAddress();
  const erc20 = new Contract(
    quote.address,
    [...ERC20_META_ABI, "function approve(address,uint256) returns (bool)"],
    signer,
  );
  const current = (await erc20.allowance(owner, spender)) as bigint;
  if (current >= amount) return "";
  const tx = await erc20.approve(spender, amount);
  await tx.wait();
  return tx.hash as string;
}

/**
 * Buy tokens from the curve. Quotes on-chain, then applies slippage protection.
 * Stock-quoted curves are paid in ERC20 units, so they need an allowance first.
 */
export async function buyToken(
  provider: Eip1193Provider,
  address: string,
  amountIn: bigint,
  slippageBps = 300,
  quote: QuoteAsset = NATIVE_QUOTE,
): Promise<string> {
  const signer = await browserProvider(provider).getSigner();
  if (isNativeQuote(quote)) {
    const c = new Contract(address, PLOPS_TOKEN_ABI, signer);
    const [tokensOut] = (await c.quoteBuy(amountIn)) as [bigint, bigint];
    const tx = await c.buy(applySlippageDown(tokensOut, slippageBps), { value: amountIn });
    await tx.wait();
    return tx.hash as string;
  }
  await ensureQuoteAllowance(provider, quote, address, amountIn);
  const c = new Contract(address, PLOPS_QUOTED_ABI, signer);
  const [tokensOut] = (await c.quoteBuy(amountIn)) as [bigint, bigint];
  const tx = await c.buy(amountIn, applySlippageDown(tokensOut, slippageBps));
  await tx.wait();
  return tx.hash as string;
}

/** Sell tokens back to the curve. No ERC-20 approval needed — the token contract moves its own units. */
export async function sellToken(
  provider: Eip1193Provider,
  address: string,
  tokenInWei: bigint,
  slippageBps = 300,
): Promise<string> {
  const signer = await browserProvider(provider).getSigner();
  const c = new Contract(address, PLOPS_TOKEN_ABI, signer);
  const [amountOut] = (await c.quoteSell(tokenInWei)) as [bigint, bigint];
  const minOut = applySlippageDown(amountOut, slippageBps);
  const tx = await c.sell(tokenInWei, minOut);
  await tx.wait();
  return tx.hash as string;
}
