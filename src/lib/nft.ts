import {
  AbiCoder,
  BrowserProvider,
  Contract,
  ContractFactory,
  JsonRpcProvider,
  concat,
  getAddress,
  getCreate2Address,
  id,
  keccak256,
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

/**
 * Arachnid's deterministic-deployment proxy, present at the same address on both Robinhood Chain
 * networks. It deploys `calldata[32:]` with CREATE2 using `calldata[:32]` as the salt, which makes
 * the collection address a pure function of (proxy, salt, init code) — knowable before any
 * transaction is signed, and identical on mainnet and testnet.
 */
export const CREATE2_DEPLOYER = "0x4e59b44847b379578588920cA78FbF26c0B4956C";

export const NFT_SALT = id("plops genesis v1");

/** Creation bytecode plus the ABI-encoded constructor owner — the CREATE2 address depends on it. */
export function collectionInitCode(owner: string): string {
  const args = AbiCoder.defaultAbiCoder().encode(["address"], [getAddress(owner)]);
  return concat([PLOPS_NFT_BYTECODE, args]);
}

/** The address plops genesis will have once `owner` deploys it through the CREATE2 proxy. */
export function predictCollectionAddress(owner: string): string {
  return getCreate2Address(CREATE2_DEPLOYER, NFT_SALT, keccak256(collectionInitCode(owner)));
}

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

/**
 * One-off deploy of the collection, paid by the connected wallet, which becomes its owner.
 * Goes through the CREATE2 proxy so the address matches `predictCollectionAddress(owner)`; falls
 * back to a plain deploy on a chain where the proxy is missing.
 */
export async function deployCollection(
  provider: Eip1193Provider,
): Promise<{ address: string; txHash: string }> {
  const eth = browserProvider(provider);
  const signer = await eth.getSigner();
  const owner = await signer.getAddress();

  if ((await eth.getCode(CREATE2_DEPLOYER)) !== "0x") {
    const address = predictCollectionAddress(owner);
    if ((await eth.getCode(address)) !== "0x") return { address, txHash: "" };

    const tx = await signer.sendTransaction({
      to: CREATE2_DEPLOYER,
      data: concat([NFT_SALT, collectionInitCode(owner)]),
    });
    await tx.wait();
    if ((await eth.getCode(address)) === "0x") {
      throw new Error("The deploy transaction left no code at the predicted address.");
    }
    return { address, txHash: tx.hash };
  }

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
