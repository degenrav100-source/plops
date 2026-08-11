import {
  BrowserProvider,
  Contract,
  ContractFactory,
  JsonRpcProvider,
  type Eip1193Provider as EthersEip1193Provider,
} from "ethers";
import { PLOPS_FACTORY_ABI, PLOPS_FACTORY_BYTECODE } from "../contracts/PlopsFactory";
import type { Eip1193Provider } from "../wallet/types";
import type { ChainConfig, ChainKey } from "../wallet/chains";
import type { DeployParams } from "./token";
import { deployToken } from "./token";

const OVERRIDE_KEY = "plops-factory";

function overrideKey(chainKey: ChainKey): string {
  return `${OVERRIDE_KEY}-${chainKey}`;
}

/**
 * Address of the on-chain launch index for a chain. A localStorage override lets the factory be
 * bootstrapped from the UI (see `#/factory`) before it is baked into `chains.ts`.
 */
export function factoryAddress(chain: ChainConfig): string {
  try {
    const stored = window.localStorage.getItem(overrideKey(chain.key));
    if (stored) return stored;
  } catch {
    /* private mode: fall back to the compiled-in address */
  }
  return chain.factoryAddress;
}

export function setFactoryOverride(chainKey: ChainKey, address: string): void {
  window.localStorage.setItem(overrideKey(chainKey), address);
}

export function clearFactoryOverride(chainKey: ChainKey): void {
  window.localStorage.removeItem(overrideKey(chainKey));
}

function browserProvider(provider: Eip1193Provider): BrowserProvider {
  return new BrowserProvider(provider as unknown as EthersEip1193Provider, "any");
}

function rpcContract(chain: ChainConfig, address: string): Contract {
  const rpc = new JsonRpcProvider(chain.rpcUrls[0], chain.chainIdDec);
  return new Contract(address, PLOPS_FACTORY_ABI, rpc);
}

/** Deploy the launch index for a chain. One-off bootstrap, paid by the connected wallet. */
export async function deployFactory(
  provider: Eip1193Provider,
): Promise<{ address: string; txHash: string }> {
  const signer = await browserProvider(provider).getSigner();
  const factory = new ContractFactory(PLOPS_FACTORY_ABI, PLOPS_FACTORY_BYTECODE, signer);
  const contract = await factory.deploy();
  const tx = contract.deploymentTransaction();
  await contract.waitForDeployment();
  return { address: await contract.getAddress(), txHash: tx?.hash ?? "" };
}

/**
 * Every launch on a chain, newest first, read straight from the index contract — so a token
 * launched by anyone shows up in every browser, without a backend or a log scan.
 */
export async function listLaunchedTokens(chain: ChainConfig, limit = 100): Promise<string[]> {
  const address = factoryAddress(chain);
  if (!address) return [];
  const c = rpcContract(chain, address);
  return (await c.latestTokens(limit)) as string[];
}

export async function launchedTokensCount(chain: ChainConfig): Promise<number> {
  const address = factoryAddress(chain);
  if (!address) return 0;
  const c = rpcContract(chain, address);
  return Number((await c.tokensCount()) as bigint);
}

/**
 * Launch a token. Goes through the factory when the chain has one (so the token lands in the
 * global index); otherwise falls back to deploying the token contract directly.
 */
export async function launchToken(
  provider: Eip1193Provider,
  chain: ChainConfig,
  params: DeployParams,
  initialBuyWei: bigint,
): Promise<{ address: string; txHash: string; indexed: boolean }> {
  const address = factoryAddress(chain);
  if (!address) {
    const res = await deployToken(provider, params, initialBuyWei);
    return { ...res, indexed: false };
  }

  const signer = await browserProvider(provider).getSigner();
  const factory = new Contract(address, PLOPS_FACTORY_ABI, signer);
  const meta = [
    params.description,
    params.imageURI,
    params.twitter,
    params.telegram,
    params.website,
  ];
  const tx = await factory.launch(params.name, params.symbol, meta, { value: initialBuyWei });
  const receipt = await tx.wait();

  let token = "";
  for (const log of receipt?.logs ?? []) {
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed?.name === "TokenLaunched") {
        token = parsed.args.token as string;
        break;
      }
    } catch {
      /* logs from the token itself don't parse against the factory ABI */
    }
  }
  if (!token) throw new Error("Launch confirmed but the token address could not be read.");
  return { address: token, txHash: tx.hash as string, indexed: true };
}
