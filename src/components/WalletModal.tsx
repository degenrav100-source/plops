import { useEffect, useState } from "react";
import { useWallet } from "../wallet/context";

/** Brand logo that degrades to the wallet's initials instead of a broken-image icon. */
function WalletIcon({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) {
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-plops-edge bg-plops-surface text-xs font-bold uppercase text-plops-ink/70">
        {name.slice(0, 2)}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={`${name} logo`}
      onError={() => setFailed(true)}
      className="h-10 w-10 rounded-lg object-contain"
    />
  );
}

export default function WalletModal() {
  const { isModalOpen, closeModal, wallets, connect, connectingId, error, notice } = useWallet();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isModalOpen, closeModal]);

  if (!isModalOpen) return null;

  const term = query.trim().toLowerCase();
  const visible = term ? wallets.filter((w) => w.name.toLowerCase().includes(term)) : wallets;
  const installed = wallets.filter((w) => w.detected).length;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        aria-label="Close wallet dialog"
        onClick={closeModal}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Connect a wallet"
        className="relative w-full max-w-md rounded-xl border border-plops-edge bg-plops-surface p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold lowercase tracking-tight text-plops-ink">connect a wallet</h3>
          <button
            aria-label="Close"
            onClick={closeModal}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-plops-edge text-plops-ink/60 transition-colors hover:text-plops-ink"
          >
            ✕
          </button>
        </div>

        <label className="mt-4 flex items-center gap-2 rounded-lg border border-plops-edge bg-plops-muted px-3 py-2">
          <span className="text-xs text-plops-ink/40">search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={installed > 0 ? `${installed} detected on this device` : "metamask, bitget, okx…"}
            className="w-full bg-transparent text-sm text-plops-ink outline-none placeholder:text-plops-ink/35"
          />
        </label>

        <div className="mt-3 grid max-h-[46vh] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
          {visible.map((w) => {
            const isConnecting = connectingId === w.id;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => connect(w)}
                disabled={isConnecting}
                title={w.detected ? `Connect ${w.name}` : `Open ${w.name}`}
                className="group relative flex flex-col items-center gap-2 rounded-lg border border-plops-edge bg-plops-muted p-3 text-center transition-colors hover:border-plops-ink/40 disabled:opacity-60"
              >
                <span className="relative flex h-11 w-11 items-center justify-center">
                  <WalletIcon src={w.icon} name={w.name} />
                  {isConnecting && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    </span>
                  )}
                </span>
                <span className="w-full text-[11px] font-semibold leading-tight text-plops-ink/80">
                  {w.name}
                </span>
                <span className="text-[10px] font-medium lowercase text-plops-ink/40">
                  {w.detected ? "detected" : "get"}
                </span>
              </button>
            );
          })}
          {visible.length === 0 && (
            <p className="col-span-2 py-6 text-center text-sm text-plops-ink/50 sm:col-span-3">
              no wallet matches “{query}”
            </p>
          )}
        </div>

        {notice && (
          <p className="mt-4 rounded-lg border border-plops-edge bg-plops-muted px-3 py-2 text-center text-sm text-plops-ink/70">
            {notice}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-plops-down/40 bg-plops-down/10 px-3 py-2 text-center text-sm text-plops-down">
            {error}
          </p>
        )}

        <div className="mt-5 border-t border-plops-edge pt-4 text-center">
          <p className="text-sm font-semibold lowercase text-plops-ink">non-custodial by design</p>
          <p className="mx-auto mt-1 max-w-xs text-xs text-plops-ink/55">
            plops never holds your keys or your funds. You approve every transaction in your own
            wallet on the Robinhood Chain.
          </p>
        </div>
      </div>
    </div>
  );
}
