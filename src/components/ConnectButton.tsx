import { useEffect, useRef, useState } from "react";
import { useWallet } from "../wallet/context";
import { shortenAddress } from "../wallet/wallets";

export default function ConnectButton({ className = "" }: { className?: string }) {
  const { connection, openModal, disconnect } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  if (!connection) {
    return (
      <button type="button" onClick={openModal} className={`btn-ghost text-sm ${className}`}>
        Connect wallet
      </button>
    );
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="btn-ghost gap-2 text-sm"
      >
        <img src={connection.walletIcon} alt="" className="h-5 w-5 rounded-md object-contain" />
        {shortenAddress(connection.address)}
      </button>
      {menuOpen && (
        <div className="glass absolute right-0 mt-2 w-44 rounded-2xl p-1.5 shadow-soft">
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(connection.address);
              setMenuOpen(false);
            }}
            className="block w-full rounded-xl px-3 py-2 text-left text-sm text-plops-ink/80 hover:bg-plops-surface/70"
          >
            Copy address
          </button>
          <button
            type="button"
            onClick={() => {
              disconnect();
              setMenuOpen(false);
            }}
            className="block w-full rounded-xl px-3 py-2 text-left text-sm text-plops-pink hover:bg-plops-surface/70"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
