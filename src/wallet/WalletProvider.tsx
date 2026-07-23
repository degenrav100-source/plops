import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { WalletContext } from "./context";
import { curatedWallets } from "./wallets";
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

export function WalletProvider({ children }: { children: ReactNode }) {
  const [detected, setDetected] = useState<Eip6963ProviderDetail[]>([]);
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
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

  const wallets = useMemo<WalletOption[]>(() => {
    const byRdns = new Map(detected.map((d) => [d.info.rdns, d]));
    const curated: WalletOption[] = curatedWallets.map((w) => {
      const match = byRdns.get(w.rdns);
      return {
        id: w.id,
        name: w.name,
        icon: w.icon,
        rdns: w.rdns,
        installUrl: w.installUrl,
        detected: Boolean(match),
        provider: match?.provider,
      };
    });
    const curatedRdns = new Set(curatedWallets.map((w) => w.rdns));
    const extras: WalletOption[] = detected
      .filter((d) => !curatedRdns.has(d.info.rdns))
      .map((d) => ({
        id: d.info.rdns,
        name: d.info.name,
        icon: d.info.icon,
        rdns: d.info.rdns,
        installUrl: "",
        detected: true,
        provider: d.provider,
      }));
    return [...curated, ...extras];
  }, [detected]);

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
        if (wallet.installUrl) window.open(wallet.installUrl, "_blank", "noopener,noreferrer");
        setError(`${wallet.name} is not installed`);
        return;
      }
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
        window.localStorage.setItem(LAST_WALLET_KEY, wallet.rdns);
        setModalOpen(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to connect";
        setError(message);
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
    const wallet = wallets.find((w) => w.rdns === last && w.detected);
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
    setModalOpen(true);
  }, []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const value = useMemo(
    () => ({
      connection,
      wallets,
      connectingId,
      error,
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
