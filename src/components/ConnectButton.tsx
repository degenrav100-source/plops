import { useEffect, useRef, useState } from "react";
import { useWallet } from "../wallet/context";
import { shortenAddress } from "../wallet/wallets";

function WalletIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </svg>
  );
}

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
      <button type="button" onClick={openModal} className={`btn-ghost ${className}`}>
        <WalletIcon />
        connect wallet
      </button>
    );
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="btn-ghost w-full"
      >
        <img src={connection.walletIcon} alt="" className="h-4 w-4 rounded object-contain" />
        {shortenAddress(connection.address)}
        <span className="h-1.5 w-1.5 rounded-full bg-plops-accent" />
      </button>
      {menuOpen && (
        <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-plops-edge bg-plops-surface p-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(connection.address);
              setMenuOpen(false);
            }}
            className="block w-full rounded-md px-3 py-2 text-left text-sm lowercase text-plops-ink/80 hover:bg-plops-muted"
          >
            copy address
          </button>
          <button
            type="button"
            onClick={() => {
              disconnect();
              setMenuOpen(false);
            }}
            className="block w-full rounded-md px-3 py-2 text-left text-sm lowercase text-plops-down hover:bg-plops-muted"
          >
            disconnect
          </button>
        </div>
      )}
    </div>
  );
}
