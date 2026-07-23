import { createContext, useContext } from "react";

export type LaunchMode = "create" | "trade";

export interface LaunchContextValue {
  isOpen: boolean;
  mode: LaunchMode;
  tokenAddress: string | null;
  openLaunch: (mode?: LaunchMode, tokenAddress?: string) => void;
  close: () => void;
}

export const LaunchContext = createContext<LaunchContextValue | null>(null);

export function useLaunch(): LaunchContextValue {
  const ctx = useContext(LaunchContext);
  if (!ctx) throw new Error("useLaunch must be used within a LaunchProvider");
  return ctx;
}
