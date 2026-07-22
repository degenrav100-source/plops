import { useEffect } from "react";
import { useWallet } from "../wallet/context";

export default function WalletModal() {
  const { isModalOpen, closeModal, wallets, connect, connectingId, error } = useWallet();

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

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        aria-label="Close wallet dialog"
        onClick={closeModal}
        className="absolute inset-0 bg-plops-night/60 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Connect a wallet"
        className="glass relative w-full max-w-md rounded-3xl p-6 shadow-soft"
      >
        <div className="absolute -inset-1 -z-10 rounded-3xl bg-dreamy opacity-20 blur-2xl" />

        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-plops-ink">Connect a wallet</h3>
          <button
            aria-label="Close"
            onClick={closeModal}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-plops-surface/60 text-plops-ink/70 transition-colors hover:text-plops-ink"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {wallets.map((w) => {
            const isConnecting = connectingId === w.id;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => connect(w)}
                disabled={isConnecting}
                title={w.detected ? `Connect ${w.name}` : `Install ${w.name}`}
                className="group relative flex flex-col items-center gap-2 rounded-2xl bg-plops-surface/50 p-3 text-center transition-all duration-300 hover:-translate-y-0.5 hover:bg-plops-surface/80 hover:shadow-glow disabled:opacity-60"
              >
                <span className="relative flex h-12 w-12 items-center justify-center">
                  <img
                    src={w.icon}
                    alt={`${w.name} logo`}
                    className="h-11 w-11 rounded-xl object-contain"
                  />
                  {isConnecting && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-plops-night/50">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    </span>
                  )}
                </span>
                <span className="w-full truncate text-xs font-semibold text-plops-ink/80">
                  {w.name}
                </span>
                {!w.detected && (
                  <span className="text-[10px] font-medium text-plops-ink/40">Install</span>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mt-4 rounded-2xl bg-plops-pink/15 px-4 py-2 text-center text-sm text-plops-pink">
            {error}
          </p>
        )}

        <div className="mt-6 border-t border-plops-edge/30 pt-5 text-center">
          <p className="font-semibold text-plops-ink">Non-custodial by design</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-plops-ink/60">
            plops never holds your keys or your funds. You approve every transaction in your own
            wallet on the Robinhood Chain.
          </p>
        </div>
      </div>
    </div>
  );
}
