import { useState } from "react";
import { useWallet } from "../wallet/context";
import { useToast } from "../toast/context";
import { CHAINS, explorerAddress, type ChainKey } from "../wallet/chains";
import {
  clearFactoryOverride,
  deployFactory,
  factoryAddress,
  launchedTokensCount,
  setFactoryOverride,
} from "../lib/factory";
import { goHome } from "../hooks/useHashRoute";
import { shortAddr } from "../lib/format";

/**
 * One-off bootstrap for the on-chain launch index. Whoever deploys it pays the gas once; the
 * address is kept in localStorage until it is baked into `chains.ts`, so the operator can deploy
 * it before the code knows about it.
 */
export default function FactorySetup() {
  const { connection, activeProvider, switchChain, openModal } = useWallet();
  const { notify } = useToast();
  const [busy, setBusy] = useState<ChainKey | null>(null);
  const [error, setError] = useState("");
  const [counts, setCounts] = useState<Partial<Record<ChainKey, number>>>({});
  const [, forceRender] = useState(0);

  const deploy = async (chainKey: ChainKey) => {
    setError("");
    if (!connection || !activeProvider) {
      openModal();
      return;
    }
    const chain = CHAINS[chainKey];
    setBusy(chainKey);
    try {
      await switchChain(chain);
      const res = await deployFactory(activeProvider);
      setFactoryOverride(chainKey, res.address);
      forceRender((n) => n + 1);
      notify(`launch index live on ${chain.short}: ${shortAddr(res.address)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deploy failed");
    } finally {
      setBusy(null);
    }
  };

  const check = async (chainKey: ChainKey) => {
    try {
      const n = await launchedTokensCount(CHAINS[chainKey]);
      setCounts((c) => ({ ...c, [chainKey]: n }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Read failed");
    }
  };

  const forget = (chainKey: ChainKey) => {
    clearFactoryOverride(chainKey);
    setCounts((c) => ({ ...c, [chainKey]: undefined }));
    forceRender((n) => n + 1);
  };

  return (
    <div className="section max-w-3xl py-8">
      <button type="button" onClick={() => goHome()} className="btn-ghost mb-6">
        ← back to plops
      </button>

      <h1 className="text-2xl font-bold text-plops-ink">launch index</h1>
      <p className="mt-2 max-w-2xl text-sm text-plops-ink/60">
        plops reads every launch from one contract per chain, so a token launched by anyone shows up
        for everyone — no server, no database. It has to be deployed once per chain. It holds no ETH
        and no supply: it only records the tokens it deploys.
      </p>

      <div className="mt-6 grid gap-3">
        {(Object.keys(CHAINS) as ChainKey[]).map((key) => {
          const chain = CHAINS[key];
          const address = factoryAddress(chain);
          const count = counts[key];
          return (
            <div key={key} className="rounded-xl border border-plops-edge bg-plops-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-plops-ink">{chain.chainName}</span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    address ? "bg-plops-accent/15 text-plops-accent" : "bg-plops-muted text-plops-ink/50"
                  }`}
                >
                  {address ? "live" : "not deployed"}
                </span>
              </div>

              {address ? (
                <div className="mt-3 space-y-3">
                  <a
                    href={explorerAddress(chain, address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block break-all font-mono text-xs text-plops-accent hover:underline"
                  >
                    {address} ↗
                  </a>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void check(key)} className="btn-ghost">
                      check index
                    </button>
                    <button type="button" onClick={() => forget(key)} className="btn-ghost">
                      forget address
                    </button>
                  </div>
                  {count !== undefined && (
                    <p className="text-xs text-plops-ink/55">
                      {count} token{count === 1 ? "" : "s"} indexed on {chain.short.toLowerCase()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => void deploy(key)}
                    disabled={busy !== null}
                    className="btn-primary disabled:opacity-60"
                  >
                    {busy === key
                      ? "confirm in your wallet…"
                      : connection
                        ? `deploy index on ${chain.short.toLowerCase()}`
                        : "connect wallet to deploy"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

      <p className="mt-6 text-xs text-plops-ink/45">
        The address is stored in this browser. Send it to the plops repo so it can be compiled into{" "}
        <code className="font-mono">chains.ts</code> and every visitor reads the same index.
      </p>
    </div>
  );
}
