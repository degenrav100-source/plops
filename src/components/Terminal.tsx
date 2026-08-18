import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "../wallet/context";
import { useLaunch } from "../launch/context";
import { CHAINS, explorerToken, type ChainKey } from "../wallet/chains";
import { readToken, type TokenData } from "../lib/token";
import { listTokens, type StoredToken } from "../lib/registry";
import { factoryAddress, listLaunchedTokens } from "../lib/factory";
import { isNativeQuote } from "../lib/quotes";
import { fmtTokens, fmtUnits, shortAddr } from "../lib/format";
import HeroBanner from "./HeroBanner";
import DocsCallout from "./DocsCallout";
import NftCallout from "./NftCallout";
import { navigate } from "../hooks/useHashRoute";

type Filter = "all" | "mine";

interface Row {
  address: string;
  /** what this browser remembers about the token; absent for launches discovered on-chain */
  stored: StoredToken | null;
  data: TokenData | null;
}

const symbolOf = (r: Row): string => r.data?.symbol ?? r.stored?.symbol ?? shortAddr(r.address);
const nameOf = (r: Row): string => r.data?.name ?? r.stored?.name ?? "";
const imageOf = (r: Row): string => r.data?.imageURI ?? r.stored?.imageURI ?? "";

/** Share of the supply already bought off the curve — how "full" a launch is. */
function curveProgress(data: TokenData): number {
  if (data.totalSupply === 0n) return 0;
  const sold = data.totalSupply - data.tokenReserve;
  return Number((sold * 10_000n) / data.totalSupply) / 100;
}

/** Market cap in the curve's own quote units (ETH, or a tokenized stock). */
function marketCapWei(data: TokenData): bigint {
  return (data.priceWei * data.totalSupply) / 1_000_000_000_000_000_000n;
}

const quoteOf = (r: Row): { symbol: string; decimals: number } =>
  r.data?.quote ?? { symbol: "eth", decimals: 18 };

function TokenAvatar({
  symbol,
  imageURI,
  size = "h-8 w-8",
}: {
  symbol: string;
  imageURI: string;
  size?: string;
}) {
  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-md border border-plops-edge bg-plops-muted text-xs font-bold text-plops-ink/70`}
    >
      {imageURI ? (
        <img src={imageURI} alt="" className="h-full w-full object-cover" />
      ) : (
        symbol.slice(0, 2)
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
    const storedByAddress = new Map(stored.map((s) => [s.address.toLowerCase(), s]));
    setRows(stored.map((s) => ({ address: s.address, stored: s, data: null })));
    setLoading(true);

    // The factory is the global index: launches by anyone show up here, not just this browser's.
    let indexed: string[] = [];
    try {
      indexed = await listLaunchedTokens(chain, 100);
    } catch {
      indexed = [];
    }
    if (requestId !== loadId.current) return;

    const seen = new Set<string>();
    const addresses: string[] = [];
    for (const addr of [...indexed, ...stored.map((s) => s.address)]) {
      const key = addr.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      addresses.push(addr);
    }
    if (addresses.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const results = await Promise.all(
      addresses.map(async (address): Promise<Row> => {
        const s = storedByAddress.get(address.toLowerCase()) ?? null;
        try {
          const data = await readToken(chain, address, account);
          return { address, stored: s, data };
        } catch {
          return { address, stored: s, data: null };
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
    const creator = (r.data?.creator ?? r.stored?.creator ?? "").toLowerCase();
    if (creator === acc) return true;
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
                <li key={r.address}>
                  <button
                    type="button"
                    onClick={() => openTrade(r.address)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-plops-muted"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <TokenAvatar symbol={symbolOf(r)} imageURI={imageOf(r)} size="h-7 w-7" />
                      <span className="truncate text-xs font-semibold">${symbolOf(r)}</span>
                    </span>
                    <span className="shrink-0 text-right text-[11px] text-plops-ink/60">
                      {r.data ? fmtUnits(r.data.priceWei, quoteOf(r).decimals, 6) : "—"}
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
        <NftCallout />

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
          {!factoryAddress(chain) && (
            <p className="border-b border-plops-edge bg-plops-muted px-4 py-2 text-[11px] text-plops-ink/55">
              the global launch index isn't deployed on {chain.short.toLowerCase()} yet, so this list
              only shows tokens this browser knows about.{" "}
              <button
                type="button"
                onClick={() => navigate("#/factory")}
                className="font-semibold text-plops-accent underline-offset-2 hover:underline"
              >
                deploy the index →
              </button>
            </p>
          )}
          <div className="grid grid-cols-[1.6fr_1fr_1fr_auto] gap-2 border-b border-plops-edge px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-plops-ink/45">
            <span>coin</span>
            <span className="text-right">price</span>
            <span className="text-right">market cap</span>
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
                  key={r.address}
                  className="grid grid-cols-[1.6fr_1fr_1fr_auto] items-center gap-2 border-b border-plops-edge px-4 py-3 last:border-b-0 transition-colors hover:bg-plops-muted"
                >
                  <button
                    type="button"
                    onClick={() => openTrade(r.address)}
                    className="flex min-w-0 items-center gap-3 text-left"
                  >
                    <TokenAvatar symbol={symbolOf(r)} imageURI={imageOf(r)} />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-plops-ink">
                        ${symbolOf(r)}
                        {r.data && !isNativeQuote(r.data.quote) && (
                          <span className="rounded border border-plops-edge px-1 text-[10px] font-semibold uppercase text-plops-ink/50">
                            /{r.data.quote.symbol}
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-plops-ink/45">{nameOf(r)}</span>
                      {r.data && (
                        <span className="mt-1 flex items-center gap-1.5">
                          <span className="h-1 w-16 overflow-hidden rounded-full bg-plops-edge">
                            <span
                              className="block h-full rounded-full bg-plops-accent"
                              style={{ width: `${Math.min(100, Math.max(2, curveProgress(r.data)))}%` }}
                            />
                          </span>
                          <span className="text-[10px] text-plops-ink/40">
                            {curveProgress(r.data).toFixed(1)}% on curve
                          </span>
                        </span>
                      )}
                    </span>
                  </button>
                  <span className="text-right text-sm text-plops-ink/80">
                    {r.data
                      ? `${fmtUnits(r.data.priceWei, quoteOf(r).decimals, 6)} ${quoteOf(r).symbol.toLowerCase()}`
                      : "—"}
                  </span>
                  <span className="text-right text-sm text-plops-ink/80">
                    {r.data
                      ? `${fmtUnits(marketCapWei(r.data), quoteOf(r).decimals, 3)} ${quoteOf(r).symbol.toLowerCase()}`
                      : "—"}
                    {r.data && (
                      <span className="block text-[10px] text-plops-ink/40">
                        liq {fmtUnits(r.data.realQuoteReserve, quoteOf(r).decimals, 3)}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center justify-end gap-2">
                    <a
                      href={explorerToken(chain, r.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View on explorer"
                      className="hidden text-xs text-plops-ink/40 hover:text-plops-ink sm:inline"
                    >
                      {shortAddr(r.address)} ↗
                    </a>
                    <button
                      type="button"
                      onClick={() => openTrade(r.address)}
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
                  <li key={r.address}>
                    <button
                      type="button"
                      onClick={() => openTrade(r.address)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-plops-muted"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <TokenAvatar symbol={symbolOf(r)} imageURI={imageOf(r)} size="h-7 w-7" />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold">${symbolOf(r)}</span>
                          <span className="block truncate text-[10px] text-plops-ink/45">
                            {fmtTokens(bal)}
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-[11px] text-plops-ink/60">
                        {fmtUnits(valueWei, quoteOf(r).decimals, 4)} {quoteOf(r).symbol.toLowerCase()}
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
