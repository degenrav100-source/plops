export interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
}

// EIP-6963 multi-injected provider discovery
export interface Eip6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface Eip6963ProviderDetail {
  info: Eip6963ProviderInfo;
  provider: Eip1193Provider;
}

export interface WalletOption {
  id: string;
  name: string;
  icon: string;
  rdns: string;
  installUrl: string;
  detected: boolean;
  provider?: Eip1193Provider;
}

export interface WalletConnection {
  address: string;
  chainId: string;
  walletName: string;
  walletIcon: string;
}
