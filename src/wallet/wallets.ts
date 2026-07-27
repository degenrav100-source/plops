const base = import.meta.env.BASE_URL;

export interface CuratedWallet {
  id: string;
  name: string;
  icon: string;
  /** EIP-6963 rdns identifiers this wallet is known to announce */
  rdns: string[];
  /** legacy `window.ethereum` flags, for in-app browsers without EIP-6963 */
  flags: string[];
  installUrl: string;
  /** deep link that reopens the current page inside the wallet's own browser */
  deepLink?: (url: string) => string;
}

const stripScheme = (url: string) => url.replace(/^https?:\/\//, "");

export const curatedWallets: CuratedWallet[] = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: `${base}wallets/metamask.svg`,
    rdns: ["io.metamask", "io.metamask.mobile"],
    flags: ["isMetaMask"],
    installUrl: "https://metamask.io/download/",
    deepLink: (url) => `https://metamask.app.link/dapp/${stripScheme(url)}`,
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: `${base}wallets/coinbase.svg`,
    rdns: ["com.coinbase.wallet"],
    flags: ["isCoinbaseWallet"],
    installUrl: "https://www.coinbase.com/wallet/downloads",
    deepLink: (url) => `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(url)}`,
  },
  {
    id: "okx",
    name: "OKX Wallet",
    icon: `${base}wallets/okx.svg`,
    rdns: ["com.okex.wallet", "com.okx.wallet"],
    flags: ["isOkxWallet", "isOKExWallet"],
    installUrl: "https://www.okx.com/web3",
    deepLink: (url) =>
      `https://www.okx.com/download?deeplink=${encodeURIComponent(
        `okx://wallet/dapp/url?dappUrl=${encodeURIComponent(url)}`,
      )}`,
  },
  {
    id: "bitget",
    name: "Bitget Wallet",
    icon: `${base}wallets/bitget.svg`,
    rdns: ["com.bitget.web3", "com.bitkeep.wallet"],
    flags: ["isBitKeep", "isBitgetWallet"],
    installUrl: "https://web3.bitget.com/en/wallet-download",
    deepLink: (url) => `https://bkcode.vip?action=dapp&url=${encodeURIComponent(url)}`,
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: `${base}wallets/trust.svg`,
    rdns: ["com.trustwallet.app"],
    flags: ["isTrust", "isTrustWallet"],
    installUrl: "https://trustwallet.com/download",
    deepLink: (url) => `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(url)}`,
  },
  {
    id: "phantom",
    name: "Phantom",
    icon: `${base}wallets/phantom.svg`,
    rdns: ["app.phantom"],
    flags: ["isPhantom"],
    installUrl: "https://phantom.app/download",
    deepLink: (url) => `https://phantom.app/ul/browse/${encodeURIComponent(url)}`,
  },
  {
    id: "rainbow",
    name: "Rainbow",
    icon: `${base}wallets/rainbow.svg`,
    rdns: ["me.rainbow"],
    flags: ["isRainbow"],
    installUrl: "https://rainbow.me/",
    deepLink: (url) => `https://rnbwapp.com/dapp?url=${encodeURIComponent(url)}`,
  },
  {
    id: "binance",
    name: "Binance Wallet",
    icon: `${base}wallets/binance.svg`,
    rdns: ["com.binance.wallet", "com.binance.web3wallet"],
    flags: ["isBinance", "isBinanceWallet"],
    installUrl: "https://www.binance.com/en/web3wallet",
  },
  {
    id: "bybit",
    name: "Bybit Wallet",
    icon: `${base}wallets/bybit.svg`,
    rdns: ["com.bybit.wallet", "com.bybit"],
    flags: ["isBybit"],
    installUrl: "https://www.bybit.com/web3/",
  },
  {
    id: "rabby",
    name: "Rabby",
    icon: `${base}wallets/rabby.svg`,
    rdns: ["io.rabby"],
    flags: ["isRabby"],
    installUrl: "https://rabby.io/",
  },
  {
    id: "zerion",
    name: "Zerion",
    icon: `${base}wallets/zerion.svg`,
    rdns: ["io.zerion.wallet"],
    flags: ["isZerion"],
    installUrl: "https://zerion.io/download",
  },
  {
    id: "uniswap",
    name: "Uniswap Wallet",
    icon: `${base}wallets/uniswap.svg`,
    rdns: ["org.uniswap", "org.uniswap.app"],
    flags: ["isUniswapWallet"],
    installUrl: "https://wallet.uniswap.org/",
  },
  {
    id: "brave",
    name: "Brave Wallet",
    icon: `${base}wallets/brave.svg`,
    rdns: ["com.brave.wallet"],
    flags: ["isBraveWallet"],
    installUrl: "https://brave.com/wallet/",
  },
  {
    id: "safepal",
    name: "SafePal",
    icon: `${base}wallets/safepal.svg`,
    rdns: ["com.safepal", "io.safepal.wallet"],
    flags: ["isSafePal", "isSafePalWallet"],
    installUrl: "https://www.safepal.com/en/download",
  },
  {
    id: "tokenpocket",
    name: "TokenPocket",
    icon: `${base}wallets/tokenpocket.svg`,
    rdns: ["pro.tokenpocket"],
    flags: ["isTokenPocket"],
    installUrl: "https://www.tokenpocket.pro/en/download/app",
  },
  {
    id: "onekey",
    name: "OneKey",
    icon: `${base}wallets/onekey.svg`,
    rdns: ["so.onekey.app.wallet"],
    flags: ["isOneKey"],
    installUrl: "https://onekey.so/download/",
  },
  {
    id: "imtoken",
    name: "imToken",
    icon: `${base}wallets/imtoken.svg`,
    rdns: ["im.token", "im.token.app"],
    flags: ["isImToken"],
    installUrl: "https://token.im/download",
  },
  {
    id: "core",
    name: "Core",
    icon: `${base}wallets/core.svg`,
    rdns: ["app.core.extension"],
    flags: ["isAvalanche", "isCore"],
    installUrl: "https://core.app/download",
  },
  {
    id: "ctrl",
    name: "Ctrl Wallet",
    icon: `${base}wallets/ctrl.svg`,
    rdns: ["io.xdefi", "io.ctrl"],
    flags: ["isXDEFI", "isCtrl"],
    installUrl: "https://ctrl.xyz/",
  },
  {
    id: "talisman",
    name: "Talisman",
    icon: `${base}wallets/talisman.svg`,
    rdns: ["xyz.talisman"],
    flags: ["isTalisman"],
    installUrl: "https://talisman.xyz/download",
  },
  {
    id: "ledger",
    name: "Ledger",
    icon: `${base}wallets/ledger.svg`,
    rdns: ["com.ledger"],
    flags: [],
    installUrl: "https://www.ledger.com/ledger-live",
  },
];

export function shortenAddress(address: string): string {
  if (address.length < 11) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}
