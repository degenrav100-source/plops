import {
  BrowserProvider,
  Contract,
  ContractFactory,
  JsonRpcProvider,
  type Eip1193Provider as EthersEip1193Provider,
} from "ethers";
import { PLOPS_TOKEN_ABI, PLOPS_TOKEN_BYTECODE } from "../contracts/PlopsBondingToken";
import type { Eip1193Provider } from "../wallet/types";
import type { ChainConfig } from "../wallet/chains";

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
  ethReserve: bigint;
  tokenReserve: bigint;
  realEthReserve: bigint;
  priceWei: bigint;
  userBalance: bigint;
}

function browserProvider(provider: Eip1193Provider): BrowserProvider {
  return new BrowserProvider(provider as unknown as EthersEip1193Provider, "any");
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

/** Read all token + curve state via the chain RPC (independent of the wallet's current network). */
export async function readToken(
  chain: ChainConfig,
  address: string,
  account?: string,
): Promise<TokenData> {
  const rpc = new JsonRpcProvider(chain.rpcUrls[0], chain.chainIdDec);
  const c = new Contract(address, PLOPS_TOKEN_ABI, rpc);
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
    ethReserve,
    tokenReserve,
    realEthReserve,
    priceWei,
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
    c.ethReserve() as Promise<bigint>,
    c.tokenReserve() as Promise<bigint>,
    c.realEthReserve() as Promise<bigint>,
    c.currentPrice() as Promise<bigint>,
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
    ethReserve,
    tokenReserve,
    realEthReserve,
    priceWei,
    userBalance,
  };
}

export async function quoteBuy(
  chain: ChainConfig,
  address: string,
  ethIn: bigint,
): Promise<bigint> {
  const rpc = new JsonRpcProvider(chain.rpcUrls[0], chain.chainIdDec);
  const c = new Contract(address, PLOPS_TOKEN_ABI, rpc);
  const [tokensOut] = (await c.quoteBuy(ethIn)) as [bigint, bigint];
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

/** Buy tokens from the curve. Quotes on-chain, then applies slippage protection. */
export async function buyToken(
  provider: Eip1193Provider,
  address: string,
  ethInWei: bigint,
  slippageBps = 300,
): Promise<string> {
  const signer = await browserProvider(provider).getSigner();
  const c = new Contract(address, PLOPS_TOKEN_ABI, signer);
  const [tokensOut] = (await c.quoteBuy(ethInWei)) as [bigint, bigint];
  const minOut = applySlippageDown(tokensOut, slippageBps);
  const tx = await c.buy(minOut, { value: ethInWei });
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
  const [ethOut] = (await c.quoteSell(tokenInWei)) as [bigint, bigint];
  const minOut = applySlippageDown(ethOut, slippageBps);
  const tx = await c.sell(tokenInWei, minOut);
  await tx.wait();
  return tx.hash as string;
}
