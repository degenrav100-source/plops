import { useCallback, useMemo, useState, type ReactNode } from "react";
import { LaunchContext, type LaunchMode } from "./context";
import LaunchTokenModal from "./LaunchTokenModal";

export function LaunchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [mode, setMode] = useState<LaunchMode>("create");
  const [tokenAddress, setTokenAddress] = useState<string | null>(null);

  const openLaunch = useCallback((m: LaunchMode = "create", addr?: string) => {
    setMode(m);
    setTokenAddress(addr ?? null);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, mode, tokenAddress, openLaunch, close }),
    [isOpen, mode, tokenAddress, openLaunch, close],
  );

  return (
    <LaunchContext.Provider value={value}>
      {children}
      <LaunchTokenModal />
    </LaunchContext.Provider>
  );
}
