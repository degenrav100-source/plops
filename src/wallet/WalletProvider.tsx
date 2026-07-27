import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { WalletContext } from "./context";
import { curatedWallets, isMobile } from "./wallets";
import type { ChainConfig } from "./chains";
import type {
  Eip1193Provider,
  Eip6963ProviderDetail,
  WalletConnection,
  WalletOption,
} from "./types";

const LAST_WALLET_KEY = "plops-last-wallet";

interface ProviderRpcError {
  code?: number;
}

type ProviderHandler = (...args: unknown[]) => void;

interface ActiveListeners {
  provider: Eip1193Provider;
  accountsChanged: ProviderHandler;
  chainChanged: ProviderHandler;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

type FlaggedProvider = Eip1193Provider & Record<string, unknown>;

/**
 * Wallets that never announce themselves over EIP-6963 (mostly in-app mobile browsers) still
 * inject `window.ethereum`, sometimes as a list of providers. Read them so those wallets connect.
 */
function legacyProviders(): FlaggedProvider[] {
  const injected = (window as unknown as { ethereum?: FlaggedProvider }).ethereum;
  if (!injected) return [];
  const nested = injected.providers;
  if (Array.isArray(nested)) return nested.filter((p): p is FlaggedProvider => Boolean(p));
  return [injected];
}

/**
 * Map injected providers to curated wallets by their vendor flag. Wallets with a specific flag are
 * matched first because several of them also set `isMetaMask` to stay compatible with old dapps.
 */
function matchLegacy(providers: FlaggedProvider[]): Map<string, FlaggedProvider> {
  const matches = new Map<string, FlaggedProvider>();
  const taken = new Set<FlaggedProvider>();
  const passes = [
    curatedWallets.filter((w) => w.id !== "metamask"),
    curatedWallets.filter((w) => w.id === "metamask"),
  ];
  for (const pass of passes) {
    for (const wallet of pass) {
      const hit = providers.find(
        (p) => !taken.has(p) && wallet.flags.some((flag) => p[flag] === true),
      );
      if (!hit) continue;
      matches.set(wallet.id, hit);
      taken.add(hit);
    }
  }
  return matches;
}

function connectErrorMessage(err: unknown, walletName: string): string {
  const code = (err as ProviderRpcError)?.code;
  if (code === 4001) return "Connection request rejected in your wallet";
  if (code === -32002) return `${walletName} already has a pending request — open the wallet`;
  const message = err instanceof Error ? err.message : "";
  return message || `Could not connect to ${walletName}`;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [detected, setDetected] = useState<Eip6963ProviderDetail[]>([]);
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [legacyTick, setLegacyTick] = useState(0);
  const [activeProvider, setActiveProvider] = useState<Eip1193Provider | null>(null);
  const activeListeners = useRef<ActiveListeners | null>(null);

  const detachProvider = useCallback(() => {
    const current = activeListeners.current;
    if (!current) return;
    current.provider.removeListener?.("accountsChanged", current.accountsChanged);
    current.provider.removeListener?.("chainChanged", current.chainChanged);
    activeListeners.current = null;
  }, []);

  // EIP-6963: discover installed wallets and their real icons.
  useEffect(() => {
    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent<Eip6963ProviderDetail>).detail;
      if (!detail?.info?.rdns) return;
      setDetected((prev) =>
        prev.some((p) => p.info.rdns === detail.info.rdns) ? prev : [...prev, detail],
      );
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce as EventListener);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    return () =>
      window.removeEventListener("eip6963:announceProvider", onAnnounce as EventListener);
  }, []);

  // `window.ethereum` can be injected after React mounts, so re-read it for a few seconds.
  useEffect(() => {
    if (legacyProviders().length > 0) return;
    let tries = 0;
    const id = window.setInterval(() => {
      tries += 1;
      if (legacyProviders().length > 0) setLegacyTick((n) => n + 1);
      if (tries >= 6 || legacyProviders().length > 0) window.clearInterval(id);
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  const wallets = useMemo<WalletOption[]>(() => {
    void legacyTick;
    const pageUrl = window.location.href;
    const announcedProviders = new Set(detected.map((d) => d.provider));
    const legacyByWallet = matchLegacy(
      legacyProviders().filter((p) => !announcedProviders.has(p)),
    );
    const claimed = new Set<string>();

    const curated: WalletOption[] = curatedWallets.map((w) => {
      const announced = detected.find(
        (d) =>
          w.rdns.includes(d.info.rdns) ||
          d.info.name.toLowerCase().replace(/\s+/g, "") === w.name.toLowerCase().replace(/\s+/g, ""),
      );
      if (announced) claimed.add(announced.info.rdns);
      const provider = announced?.provider ?? legacyByWallet.get(w.id);
      return {
        id: w.id,
        name: w.name,
        icon: w.icon,
        key: w.rdns[0],
        installUrl: w.installUrl,
        deepLinkUrl: w.deepLink?.(pageUrl),
        detected: Boolean(provider),
        provider,
      };
    });

    // Anything else that announced itself: show it with the icon the wallet provided.
    const extras: WalletOption[] = detected
      .filter((d) => !claimed.has(d.info.rdns))
      .map((d) => ({
        id: d.info.rdns,
        name: d.info.name,
        icon: d.info.icon,
        key: d.info.rdns,
        installUrl: "",
        detected: true,
        provider: d.provider,
      }));

    const all = [...curated, ...extras];
    // Installed wallets first, everything else keeps its curated order.
    return all.filter((w) => w.detected).concat(all.filter((w) => !w.detected));
  }, [detected, legacyTick]);

  const applyAccounts = useCallback(
    (accounts: unknown, wallet: WalletOption, chainId: string) => {
      const list = Array.isArray(accounts) ? accounts : [];
      const address = asString(list[0]);
      if (!address) {
        setConnection(null);
        return;
      }
      setConnection({ address, chainId, walletName: wallet.name, walletIcon: wallet.icon });
    },
    [],
  );

  const attachProvider = useCallback(
    (provider: Eip1193Provider) => {
      detachProvider();
      const accountsChanged: ProviderHandler = (accounts: unknown) => {
        const list = Array.isArray(accounts) ? accounts : [];
        const address = asString(list[0]);
        if (!address) {
          setConnection(null);
          window.localStorage.removeItem(LAST_WALLET_KEY);
          return;
        }
        setConnection((prev) => (prev ? { ...prev, address } : prev));
      };
      const chainChanged: ProviderHandler = (chainId: unknown) => {
        setConnection((prev) => (prev ? { ...prev, chainId: asString(chainId) } : prev));
      };
      provider.on?.("accountsChanged", accountsChanged);
      provider.on?.("chainChanged", chainChanged);
      activeListeners.current = { provider, accountsChanged, chainChanged };
    },
    [detachProvider],
  );

  const connect = useCallback(
    async (wallet: WalletOption) => {
      setError(null);
      if (!wallet.provider) {
        // On a phone the wallet lives in its own app: hand the page over to it.
        const target = (isMobile() && wallet.deepLinkUrl) || wallet.installUrl;
        if (target) window.open(target, "_blank", "noopener,noreferrer");
        setNotice(
          isMobile() && wallet.deepLinkUrl
            ? `Opening plops in ${wallet.name}…`
            : `${wallet.name} is not installed — opening its download page.`,
        );
        return;
      }
      setNotice(null);
      setConnectingId(wallet.id);
      try {
        const accounts = await wallet.provider.request({ method: "eth_requestAccounts" });
        let chainId = "";
        try {
          chainId = asString(await wallet.provider.request({ method: "eth_chainId" }));
        } catch {
          chainId = "";
        }
        applyAccounts(accounts, wallet, chainId);
        attachProvider(wallet.provider);
        setActiveProvider(wallet.provider);
        window.localStorage.setItem(LAST_WALLET_KEY, wallet.key);
        setModalOpen(false);
      } catch (err) {
        setError(connectErrorMessage(err, wallet.name));
      } finally {
        setConnectingId(null);
      }
    },
    [applyAccounts, attachProvider],
  );

  // Eager reconnect if a wallet was previously connected this browser.
  useEffect(() => {
    if (connection || detected.length === 0) return;
    const last = window.localStorage.getItem(LAST_WALLET_KEY);
    if (!last) return;
    const wallet = wallets.find((w) => w.key === last && w.detected);
    if (!wallet?.provider) return;
    let cancelled = false;
    (async () => {
      try {
        const accounts = await wallet.provider!.request({ method: "eth_accounts" });
        const list = Array.isArray(accounts) ? accounts : [];
        if (cancelled || list.length === 0) return;
        let chainId = "";
        try {
          chainId = asString(await wallet.provider!.request({ method: "eth_chainId" }));
        } catch {
          chainId = "";
        }
        applyAccounts(accounts, wallet, chainId);
        attachProvider(wallet.provider!);
        setActiveProvider(wallet.provider!);
      } catch {
        /* ignore silent reconnect errors */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wallets, detected.length, connection, applyAccounts, attachProvider]);

  const disconnect = useCallback(() => {
    setConnection(null);
    setError(null);
    setNotice(null);
    detachProvider();
    setActiveProvider(null);
    window.localStorage.removeItem(LAST_WALLET_KEY);
  }, [detachProvider]);

  const switchChain = useCallback(
    async (chain: ChainConfig) => {
      if (!activeProvider) throw new Error("Connect a wallet first");
      try {
        await activeProvider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chain.chainIdHex }],
        });
      } catch (err) {
        const code = (err as ProviderRpcError)?.code;
        // 4902 = chain not added to the wallet yet.
        if (code === 4902 || code === -32603) {
          await activeProvider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: chain.chainIdHex,
                chainName: chain.chainName,
                nativeCurrency: chain.nativeCurrency,
                rpcUrls: chain.rpcUrls,
                blockExplorerUrls: chain.blockExplorerUrls,
              },
            ],
          });
        } else {
          throw err;
        }
      }
    },
    [activeProvider],
  );

  // Detach any live provider listeners on unmount.
  useEffect(() => detachProvider, [detachProvider]);

  const openModal = useCallback(() => {
    setError(null);
    setNotice(null);
    setModalOpen(true);
  }, []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const value = useMemo(
    () => ({
      connection,
      wallets,
      connectingId,
      error,
      notice,
      isModalOpen,
      openModal,
      closeModal,
      connect,
      disconnect,
      activeProvider,
      switchChain,
    }),
    [
      connection,
      wallets,
      connectingId,
      error,
      notice,
      isModalOpen,
      openModal,
      closeModal,
      connect,
      disconnect,
      activeProvider,
      switchChain,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
