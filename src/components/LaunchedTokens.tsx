import { useCallback, useEffect, useRef, useState } from "react";
import SectionHeading from "./SectionHeading";
import { useWallet } from "../wallet/context";
import { useLaunch } from "../launch/context";
import { CHAINS, explorerToken, type ChainKey } from "../wallet/chains";
import { readToken, type TokenData } from "../lib/token";
import { listTokens, type StoredToken } from "../lib/registry";
import { fmtEth, fmtTokens, shortAddr } from "../lib/format";

type Filter = "all" | "mine";

interface Row {
  stored: StoredToken;
  data: TokenData | null;
}

export default function LaunchedTokens() {
  const { connection } = useWallet();
  const { openLaunch } = useLaunch();
  const [chainKey, setChainKey] = useState<ChainKey>("testnet");
  const [filter, setFilter] = useState<Filter>("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const loadId = useRef(0);

  const account = connection?.address;
  const chain = CHAINS[chainKey];

  const load = useCallback(async () => {
    const requestId = ++loadId.current;
    const stored = listTokens(chainKey);
    setRows(stored.map((s) => ({ stored: s, data: null })));
    if (stored.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const results = await Promise.all(
      stored.map(async (s): Promise<Row> => {
        try {
          const data = await readToken(chain, s.address, account);
          return { stored: s, data };
        } catch {
          return { stored: s, data: null };
        }
      }),
    );
    if (requestId !== loadId.current) return;
    setRows(results);
    setLoading(false);
  }, [chainKey, chain, account]);

  useEffect(() => {
    void load();
  }, [load]);

  const isMine = (r: Row): boolean => {
    if (!account) return false;
    const acc = account.toLowerCase();
    if (r.stored.creator.toLowerCase() === acc) return true;
    return r.data ? r.data.userBalance > 0n : false;
  };

  const visible = filter === "mine" ? rows.filter(isMine) : rows;

  return (
    <section id="launches" className="section py-24">
      <SectionHeading
        eyebrow="🚀 Launchpad"
        title="Tokens launched on plops"
        subtitle="Live, on-chain tokens deployed through the Launch Studio — trade them on the bonding curve."
      />

      <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
        <div className="glass inline-flex rounded-full p-1">
          {(["all", "mine"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                filter === f ? "bg-dreamy text-[#0c1330] shadow-glow" : "text-plops-ink/60 hover:text-plops-ink"
              }`}
            >
              {f === "all" ? "All launches" : "My tokens"}
            </button>
          ))}
        </div>
        <div className="glass inline-flex rounded-full p-1">
          {(Object.keys(CHAINS) as ChainKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setChainKey(k)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                chainKey === k ? "bg-plops-ink text-plops-surface" : "text-plops-ink/55 hover:text-plops-ink"
              }`}
            >
              {CHAINS[k].short}
            </button>
          ))}
        </div>
        <button onClick={() => void load()} className="btn-ghost !px-4 !py-2 text-sm" type="button">
          ↻ Refresh
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="glass mx-auto max-w-xl rounded-3xl p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-dreamy text-2xl shadow-glow">
            🫧
          </div>
          <h3 className="text-lg font-semibold text-plops-ink">
            {filter === "mine"
              ? "You haven't launched or bought any tokens yet"
              : `No tokens launched on ${chain.short} yet`}
          </h3>
          <p className="mt-1 text-sm text-plops-ink/60">
            Be the first to make a plop — deploy a token in seconds, fully non-custodial.
          </p>
          <button type="button" onClick={() => openLaunch("create")} className="btn-primary mt-5 text-sm">
            Launch a token →
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => (
            <TokenCard
              key={r.stored.address}
              row={r}
              chainKey={chainKey}
              onTrade={() => openLaunch("trade", r.stored.address)}
            />
          ))}
        </div>
      )}

      {loading && <p className="mt-6 text-center text-sm text-plops-ink/50">Loading on-chain data…</p>}
    </section>
  );
}

function TokenCard({ row, chainKey, onTrade }: { row: Row; chainKey: ChainKey; onTrade: () => void }) {
  const { stored, data } = row;
  const chain = CHAINS[chainKey];
  return (
    <article className="group glass relative overflow-hidden rounded-3xl p-6 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-plops-blue/30 to-plops-green/20 blur-2xl transition-opacity duration-300 group-hover:opacity-90" />

      <div className="relative flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-plops-surface/70 text-2xl shadow-sm">
            {stored.imageURI ? <img src={stored.imageURI} alt="" className="h-full w-full object-cover" /> : "🪙"}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-plops-ink">{stored.name}</h3>
            <p className="text-sm text-plops-ink/55">${stored.symbol}</p>
          </div>
        </div>
        <a
          href={explorerToken(chain, stored.address)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-plops-ink/45 hover:text-plops-ink"
        >
          {shortAddr(stored.address)} ↗
        </a>
      </div>

      <div className="relative mt-5 grid grid-cols-3 gap-2">
        <Metric label="Price" value={data ? `${fmtEth(data.priceWei, 6)}` : "—"} unit="ETH" />
        <Metric label="Liquidity" value={data ? `${fmtEth(data.realEthReserve, 4)}` : "—"} unit="ETH" />
        <Metric label="Your bal" value={data ? fmtTokens(data.userBalance) : "—"} unit={stored.symbol} />
      </div>

      <button onClick={onTrade} type="button" className="btn-primary mt-5 w-full !py-2 text-sm">
        Trade
      </button>
    </article>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl bg-plops-surface/50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-plops-ink/45">{label}</p>
      <p className="truncate text-sm font-semibold text-plops-ink">{value}</p>
      <p className="truncate text-[10px] text-plops-ink/40">{unit}</p>
    </div>
  );
}
