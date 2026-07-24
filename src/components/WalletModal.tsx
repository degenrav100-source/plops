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

        <div className="mt-5 grid grid-cols-3 gap-2">
          {wallets.map((w) => {
            const isConnecting = connectingId === w.id;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => connect(w)}
                disabled={isConnecting}
                title={w.detected ? `Connect ${w.name}` : `Install ${w.name}`}
                className="group relative flex flex-col items-center gap-2 rounded-lg border border-plops-edge bg-plops-muted p-3 text-center transition-colors hover:border-plops-ink/40 disabled:opacity-60"
              >
                <span className="relative flex h-11 w-11 items-center justify-center">
                  <img
                    src={w.icon}
                    alt={`${w.name} logo`}
                    className="h-10 w-10 rounded-lg object-contain"
                  />
                  {isConnecting && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    </span>
                  )}
                </span>
                <span className="w-full truncate text-[11px] font-semibold text-plops-ink/80">
                  {w.name}
                </span>
                {!w.detected && (
                  <span className="text-[10px] font-medium lowercase text-plops-ink/40">install</span>
                )}
              </button>
            );
          })}
        </div>

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
