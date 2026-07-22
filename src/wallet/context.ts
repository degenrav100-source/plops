import { createContext, useContext } from "react";
import type { WalletConnection, WalletOption } from "./types";

export interface WalletContextValue {
  connection: WalletConnection | null;
  wallets: WalletOption[];
  connectingId: string | null;
  error: string | null;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  connect: (wallet: WalletOption) => Promise<void>;
  disconnect: () => void;
}

export const WalletContext = createContext<WalletContextValue | null>(null);

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}
