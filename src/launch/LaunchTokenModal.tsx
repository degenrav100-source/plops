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
        className="fixed inset-0 bg-plops-night/60 backdrop-blur-sm"
      />
      <div className="glass relative z-10 w-full max-w-2xl rounded-[2rem] p-6 shadow-soft md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-plops-ink">Launch Studio</h2>
            <p className="text-sm text-plops-ink/60">Create & trade tokens on the Robinhood Chain.</p>
          </div>
          <button
            type="button"
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-full glass text-plops-ink/70 hover:text-plops-ink"
          >
            ✕
          </button>
        </div>

        {/* controls */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-full bg-plops-surface/50 p-1">
            {(["create", "trade"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition-all ${
                  tab === t ? "bg-dreamy text-[#0c1330] shadow-glow" : "text-plops-ink/60 hover:text-plops-ink"
                }`}
              >
                {t === "create" ? "Create" : "Trade"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full bg-plops-surface/50 p-1">
              {(Object.keys(CHAINS) as ChainKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setChainKey(k)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    chainKey === k ? "bg-plops-ink text-plops-surface" : "text-plops-ink/55 hover:text-plops-ink"
                  }`}
                >
                  {CHAINS[k].short}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={openModal}
              className="chip !py-1.5 text-xs hover:!border-plops-blue/60"
            >
              {connection ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-plops-green" />
                  {shortenAddress(connection.address)}
                </>
              ) : (
                "Connect wallet"
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
