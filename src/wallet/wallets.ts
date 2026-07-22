const base = import.meta.env.BASE_URL;

export interface CuratedWallet {
  id: string;
  name: string;
  icon: string;
  rdns: string;
  installUrl: string;
}

// Mirrors the wallet set on plopspad.xyz, with original brand logos.
export const curatedWallets: CuratedWallet[] = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: `${base}wallets/metamask.png`,
    rdns: "io.metamask",
    installUrl: "https://metamask.io/download/",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: `${base}wallets/coinbase.png`,
    rdns: "com.coinbase.wallet",
    installUrl: "https://www.coinbase.com/wallet/downloads",
  },
  {
    id: "okx",
    name: "OKX Wallet",
    icon: `${base}wallets/okx.svg`,
    rdns: "com.okex.wallet",
    installUrl: "https://www.okx.com/web3",
  },
  {
    id: "rainbow",
    name: "Rainbow",
    icon: `${base}wallets/rainbow.png`,
    rdns: "me.rainbow",
    installUrl: "https://rainbow.me/",
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: `${base}wallets/trust.png`,
    rdns: "com.trustwallet.app",
    installUrl: "https://trustwallet.com/download",
  },
  {
    id: "phantom",
    name: "Phantom",
    icon: `${base}wallets/phantom.png`,
    rdns: "app.phantom",
    installUrl: "https://phantom.app/download",
  },
];

export function shortenAddress(address: string): string {
  if (address.length < 11) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
