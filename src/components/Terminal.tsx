import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "../wallet/context";
import { useLaunch } from "../launch/context";
import { CHAINS, explorerToken, type ChainKey } from "../wallet/chains";
import { readToken, type TokenData } from "../lib/token";
import { listTokens, type StoredToken } from "../lib/registry";
import { fmtEth, fmtTokens, shortAddr } from "../lib/format";
import HeroBanner from "./HeroBanner";
import DocsCallout from "./DocsCallout";

type Filter = "all" | "mine";

interface Row {
  stored: StoredToken;
  data: TokenData | null;
}

function TokenAvatar({ token, size = "h-8 w-8" }: { token: StoredToken; size?: string }) {
  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-md border border-plops-edge bg-plops-muted text-xs font-bold text-plops-ink/70`}
    >
      {token.imageURI ? (
        <img src={token.imageURI} alt="" className="h-full w-full object-cover" />
      ) : (
        token.symbol.slice(0, 2)
      )}
    </span>
  );
}

export default function Terminal() {
  const { connection, openModal } = useWallet();
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
  const positions = rows.filter((r) => r.data && r.data.userBalance > 0n);
  const openTrade = (addr: string) => openLaunch("trade", addr);

  return (
    <div id="tokens" className="section grid gap-4 py-4 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
      {/* LEFT — markets */}
      <aside className="order-2 flex flex-col rounded-xl border border-plops-edge bg-plops-surface lg:order-1">
        <div className="flex items-center justify-between border-b border-plops-edge px-3 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-plops-ink/50">markets</span>
          <span className="text-[10px] text-plops-ink/40">{rows.length}</span>
        </div>
        <div className="max-h-[420px] overflow-y-auto lg:max-h-[70vh]">
          {rows.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-plops-ink/45">
              no tokens on {chain.short.toLowerCase()} yet
            </p>
          ) : (
            <ul>
              {rows.map((r) => (
                <li key={r.stored.address}>
                  <button
                    type="button"
                    onClick={() => openTrade(r.stored.address)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-plops-muted"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <TokenAvatar token={r.stored} size="h-7 w-7" />
                      <span className="truncate text-xs font-semibold">${r.stored.symbol}</span>
                    </span>
                    <span className="shrink-0 text-right text-[11px] text-plops-ink/60">
                      {r.data ? `${fmtEth(r.data.priceWei, 6)}` : "—"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* CENTER — hero + token table */}
      <main className="order-1 min-w-0 lg:order-2">
        <HeroBanner />
        <DocsCallout />

        {/* controls */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-lg border border-plops-edge bg-plops-surface p-0.5">
            {(["all", "mine"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold lowercase transition-colors ${
                  filter === f ? "bg-plops-ink text-plops-page" : "text-plops-ink/55 hover:text-plops-ink"
                }`}
              >
                {f === "all" ? "all tokens" : "my tokens"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-plops-edge bg-plops-surface p-0.5">
              {(Object.keys(CHAINS) as ChainKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setChainKey(k)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold lowercase transition-colors ${
                    chainKey === k ? "bg-plops-ink text-plops-page" : "text-plops-ink/55 hover:text-plops-ink"
                  }`}
                >
                  {CHAINS[k].short.toLowerCase()}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="flex h-8 items-center gap-1 rounded-lg border border-plops-edge px-3 text-xs text-plops-ink/60 transition-colors hover:text-plops-ink"
            >
              ↻ refresh
            </button>
          </div>
        </div>

        {/* table */}
        <div className="mt-3 overflow-hidden rounded-xl border border-plops-edge bg-plops-surface">
          <div className="grid grid-cols-[1.6fr_1fr_1fr_auto] gap-2 border-b border-plops-edge px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-plops-ink/45">
            <span>coin</span>
            <span className="text-right">price (eth)</span>
            <span className="text-right">liquidity</span>
            <span className="text-right">trade</span>
          </div>

          {visible.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <p className="text-sm text-plops-ink/55">
                {filter === "mine"
                  ? "you haven't launched or bought any tokens yet"
                  : `no tokens launched on ${chain.short.toLowerCase()} yet`}
              </p>
              <button
                type="button"
                onClick={() => openLaunch("create")}
                className="btn-primary mt-4"
              >
                create the first one →
              </button>
            </div>
          ) : (
            <ul>
              {visible.map((r) => (
                <li
                  key={r.stored.address}
                  className="grid grid-cols-[1.6fr_1fr_1fr_auto] items-center gap-2 border-b border-plops-edge px-4 py-3 last:border-b-0 transition-colors hover:bg-plops-muted"
                >
                  <button
                    type="button"
                    onClick={() => openTrade(r.stored.address)}
                    className="flex min-w-0 items-center gap-3 text-left"
                  >
                    <TokenAvatar token={r.stored} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-plops-ink">
                        ${r.stored.symbol}
                      </span>
                      <span className="block truncate text-xs text-plops-ink/45">{r.stored.name}</span>
                    </span>
                  </button>
                  <span className="text-right text-sm text-plops-ink/80">
                    {r.data ? fmtEth(r.data.priceWei, 6) : "—"}
                  </span>
                  <span className="text-right text-sm text-plops-ink/80">
                    {r.data ? `${fmtEth(r.data.realEthReserve, 4)}` : "—"}
                  </span>
                  <span className="flex items-center justify-end gap-2">
                    <a
                      href={explorerToken(chain, r.stored.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View on explorer"
                      className="hidden text-xs text-plops-ink/40 hover:text-plops-ink sm:inline"
                    >
                      {shortAddr(r.stored.address)} ↗
                    </a>
                    <button
                      type="button"
                      onClick={() => openTrade(r.stored.address)}
                      className="rounded-md border border-plops-accent px-3 py-1.5 text-xs font-semibold lowercase text-plops-accent transition-colors hover:bg-plops-accent hover:text-black"
                    >
                      trade
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {loading && (
            <p className="border-t border-plops-edge px-4 py-2 text-center text-xs text-plops-ink/45">
              loading on-chain data…
            </p>
          )}
        </div>
      </main>

      {/* RIGHT — positions */}
      <aside className="order-3 flex flex-col rounded-xl border border-plops-edge bg-plops-surface">
        <div className="border-b border-plops-edge px-3 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-plops-ink/50">
            your positions
          </span>
        </div>
        <div className="max-h-[420px] overflow-y-auto lg:max-h-[70vh]">
          {!connection ? (
            <div className="px-3 py-8 text-center">
              <p className="text-xs text-plops-ink/50">connect a wallet to see your positions</p>
              <button type="button" onClick={openModal} className="btn-ghost mt-3 w-full">
                connect wallet
              </button>
            </div>
          ) : positions.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-plops-ink/45">no positions yet</p>
          ) : (
            <ul>
              {positions.map((r) => {
                const bal = r.data!.userBalance;
                const valueWei = (bal * r.data!.priceWei) / 1_000_000_000_000_000_000n;
                return (
                  <li key={r.stored.address}>
                    <button
                      type="button"
                      onClick={() => openTrade(r.stored.address)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-plops-muted"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <TokenAvatar token={r.stored} size="h-7 w-7" />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold">${r.stored.symbol}</span>
                          <span className="block truncate text-[10px] text-plops-ink/45">
                            {fmtTokens(bal)}
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-[11px] text-plops-ink/60">
                        {fmtEth(valueWei, 4)} eth
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
