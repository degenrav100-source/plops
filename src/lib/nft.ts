import {
  BrowserProvider,
  Contract,
  ContractFactory,
  JsonRpcProvider,
  type Eip1193Provider as EthersEip1193Provider,
} from "ethers";
import { PLOPS_NFT_ABI, PLOPS_NFT_BYTECODE } from "../contracts/PlopsNFT";
import type { Eip1193Provider } from "../wallet/types";
import type { ChainConfig, ChainKey } from "../wallet/chains";

const OVERRIDE_KEY = "plops-nft";

/** Mirrors the contract, so the page can show the collection before it is deployed. */
export const COLLECTION = {
  name: "plops genesis",
  symbol: "PLOPS",
  supply: 1500,
  price: 10n ** 16n, // 0.01 ETH
  maxPerTx: 10,
  royaltyBps: 500,
};

export interface CollectionState {
  minted: number;
  supply: number;
  price: bigint;
  owned: number;
}

function overrideKey(chainKey: ChainKey): string {
  return `${OVERRIDE_KEY}-${chainKey}`;
}

/**
 * Address of the collection on a chain. Like the launch index, a localStorage override lets it be
 * deployed from the UI before the address is compiled into `chains.ts`.
 */
export function nftAddress(chain: ChainConfig): string {
  try {
    const stored = window.localStorage.getItem(overrideKey(chain.key));
    if (stored) return stored;
  } catch {
    /* private mode: fall back to the compiled-in address */
  }
  return chain.nftAddress;
}

export function setNftOverride(chainKey: ChainKey, address: string): void {
  window.localStorage.setItem(overrideKey(chainKey), address);
}

export function clearNftOverride(chainKey: ChainKey): void {
  window.localStorage.removeItem(overrideKey(chainKey));
}

function browserProvider(provider: Eip1193Provider): BrowserProvider {
  return new BrowserProvider(provider as unknown as EthersEip1193Provider, "any");
}

function rpcContract(chain: ChainConfig, address: string): Contract {
  const rpc = new JsonRpcProvider(chain.rpcUrls[0], chain.chainIdDec);
  return new Contract(address, PLOPS_NFT_ABI, rpc);
}

/** One-off deploy of the collection, paid by the connected wallet, which becomes its owner. */
export async function deployCollection(
  provider: Eip1193Provider,
): Promise<{ address: string; txHash: string }> {
  const signer = await browserProvider(provider).getSigner();
  const owner = await signer.getAddress();
  const deployer = new ContractFactory(PLOPS_NFT_ABI, PLOPS_NFT_BYTECODE, signer);
  const contract = await deployer.deploy(owner);
  const tx = contract.deploymentTransaction();
  await contract.waitForDeployment();
  return { address: await contract.getAddress(), txHash: tx?.hash ?? "" };
}

export async function readCollection(
  chain: ChainConfig,
  wallet?: string,
): Promise<CollectionState | null> {
  const address = nftAddress(chain);
  if (!address) return null;
  const c = rpcContract(chain, address);
  const [minted, supply, price] = (await Promise.all([
    c.totalMinted(),
    c.MAX_SUPPLY(),
    c.PRICE(),
  ])) as [bigint, bigint, bigint];
  const owned = wallet ? ((await c.balanceOf(wallet)) as bigint) : 0n;
  return { minted: Number(minted), supply: Number(supply), price, owned: Number(owned) };
}

/** The artwork of a token, straight from the contract — it renders before the token is minted. */
export async function tokenArt(chain: ChainConfig, tokenId: number): Promise<string> {
  const address = nftAddress(chain);
  if (!address) return "";
  const svg = (await rpcContract(chain, address).tokenSVG(tokenId)) as string;
  return svgDataUri(svg);
}

export function svgDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Mint `quantity` plops. Returns the ids that were minted. */
export async function mintPlops(
  provider: Eip1193Provider,
  chain: ChainConfig,
  quantity: number,
): Promise<{ txHash: string; ids: number[] }> {
  const address = nftAddress(chain);
  if (!address) throw new Error("The collection is not deployed on this network yet.");
  const signer = await browserProvider(provider).getSigner();
  const nft = new Contract(address, PLOPS_NFT_ABI, signer);
  const price = (await nft.PRICE()) as bigint;
  const tx = await nft.mint(quantity, { value: price * BigInt(quantity) });
  const receipt = await tx.wait();

  const ids: number[] = [];
  for (const log of receipt?.logs ?? []) {
    try {
      const parsed = nft.interface.parseLog(log);
      if (parsed?.name === "Minted") ids.push(Number(parsed.args.tokenId as bigint));
    } catch {
      /* transfer logs from other contracts don't parse here */
    }
  }
  return { txHash: tx.hash as string, ids };
}

/** OpenSea indexes Robinhood Chain mainnet; its testnet is not on the marketplace. */
export function openseaItem(chain: ChainConfig, address: string, tokenId: number): string {
  if (chain.testnet) return "";
  return `https://opensea.io/item/robinhood/${address}/${tokenId}`;
}

export function openseaCollection(chain: ChainConfig, address: string): string {
  if (chain.testnet) return "";
  return `https://opensea.io/assets/robinhood/${address}`;
}
