import { useEffect, useState } from "react";
import { useLaunch, type LaunchMode } from "./context";
import CreatePanel from "./CreatePanel";
import TradePanel from "./TradePanel";
import { useWallet } from "../wallet/context";
import { CHAINS, DEFAULT_CHAIN, chainByIdHex, type ChainKey } from "../wallet/chains";
import { shortenAddress } from "../wallet/wallets";

export default function LaunchTokenModal() {
  const { isOpen, mode, tokenAddress, close } = useLaunch();
  const { connection, openModal } = useWallet();
  const [tab, setTab] = useState<LaunchMode>("create");
  const [chainKey, setChainKey] = useState<ChainKey>(DEFAULT_CHAIN);
  const [tradeAddress, setTradeAddress] = useState<string | null>(null);

  // Sync tab / address when opened from different entry points.
  useEffect(() => {
    if (!isOpen) return;
    setTab(mode);
    setTradeAddress(tokenAddress);
  }, [isOpen, mode, tokenAddress]);

  // If the wallet is already on a known Robinhood chain, match the selector to it.
  useEffect(() => {
    if (!isOpen || !connection?.chainId) return;
    const match = chainByIdHex(connection.chainId);
    if (match) setChainKey(match.key);
  }, [isOpen, connection?.chainId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  const goTrade = (address: string) => {
    setTradeAddress(address);
    setTab("trade");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 py-10">
      <button
        type="button"
        aria-label="Close"
        onClick={close}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-2xl rounded-xl border border-plops-edge bg-plops-surface p-6 shadow-2xl md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold lowercase tracking-tight text-plops-ink">launch studio</h2>
            <p className="text-sm text-plops-ink/60">
              Launch a coin in one transaction, or trade any plop on its curve.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-plops-edge text-plops-ink/70 hover:text-plops-ink"
          >
            ✕
          </button>
        </div>

        {/* controls */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-plops-edge bg-plops-surface p-0.5">
            {(["create", "trade"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-md px-5 py-1.5 text-sm font-semibold lowercase transition-colors ${
                  tab === t ? "bg-plops-ink text-plops-page" : "text-plops-ink/55 hover:text-plops-ink"
                }`}
              >
                {t === "create" ? "create" : "trade"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-plops-edge bg-plops-surface p-0.5">
              {(Object.keys(CHAINS) as ChainKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setChainKey(k)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold lowercase transition-colors ${
                    chainKey === k ? "bg-plops-ink text-plops-page" : "text-plops-ink/55 hover:text-plops-ink"
                  }`}
                >
                  {CHAINS[k].short.toLowerCase()}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={openModal}
              className="chip !py-1.5 text-xs hover:border-plops-ink/40"
            >
              {connection ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-plops-accent" />
                  {shortenAddress(connection.address)}
                </>
              ) : (
                "connect wallet"
              )}
            </button>
          </div>
        </div>

        <div className="mt-6">
          {tab === "create" ? (
            <CreatePanel chainKey={chainKey} onTradeToken={goTrade} />
          ) : (
            <TradePanel chainKey={chainKey} initialAddress={tradeAddress} />
          )}
        </div>
      </div>
    </div>
  );
}
