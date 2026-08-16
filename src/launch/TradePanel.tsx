import { useCallback, useEffect, useMemo, useState } from "react";
import { formatEther, parseUnits } from "ethers";
import { useWallet } from "../wallet/context";
import { useToast } from "../toast/context";
import { CHAINS, explorerToken, type ChainKey } from "../wallet/chains";
import {
  buyToken,
  quoteBuy,
  quoteSell,
  readToken,
  readTokenBrief,
  sellToken,
  type TokenBrief,
  type TokenData,
} from "../lib/token";
import { listTokens } from "../lib/registry";
import { listLaunchedTokens } from "../lib/factory";
import { NATIVE_QUOTE, isNativeQuote } from "../lib/quotes";
import { fmtTokens, fmtUnits, isAddress, shortAddr, toExternalUrl } from "../lib/format";

const ETH_BUY_PRESETS = ["0.1", "0.05", "0.035", "0.025"];
const STOCK_BUY_PRESETS = ["1", "0.5", "0.25", "0.1"];
const SELL_PRESETS: { label: string; pct: bigint }[] = [
  { label: "25%", pct: 25n },
  { label: "50%", pct: 50n },
  { label: "100%", pct: 100n },
];

interface Props {
  chainKey: ChainKey;
  initialAddress: string | null;
}

export default function TradePanel({ chainKey, initialAddress }: Props) {
  const { connection, activeProvider, switchChain, openModal } = useWallet();
  const { notify } = useToast();
  const chain = CHAINS[chainKey];

  const [saved, setSaved] = useState<TokenBrief[]>([]);
  const [addressInput, setAddressInput] = useState(initialAddress ?? "");
  const [selected, setSelected] = useState<string | null>(initialAddress);
  const [data, setData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  // What the selected curve is priced in; ETH until the token is loaded.
  const asset = data?.quote ?? NATIVE_QUOTE;
  const buyPresets = isNativeQuote(asset) ? ETH_BUY_PRESETS : STOCK_BUY_PRESETS;

  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<bigint | null>(null);
  const [txBusy, setTxBusy] = useState(false);
  const [txStatus, setTxStatus] = useState("");
  const [txError, setTxError] = useState("");

  // Quick picks: what this browser launched, plus the newest launches from the global index.
  useEffect(() => {
    let cancelled = false;
    const local: TokenBrief[] = listTokens(chainKey).map((t) => ({
      address: t.address,
      symbol: t.symbol,
      imageURI: t.imageURI,
    }));
    setSaved(local);
    (async () => {
      try {
        const indexed = await listLaunchedTokens(chain, 12);
        const known = new Set(local.map((t) => t.address.toLowerCase()));
        const extra = await Promise.all(
          indexed
            .filter((a) => !known.has(a.toLowerCase()))
            .map((a) => readTokenBrief(chain, a).catch(() => null)),
        );
        if (cancelled) return;
        setSaved([...local, ...extra.filter((t): t is TokenBrief => t !== null)]);
      } catch {
        /* no index on this chain yet — local picks only */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chainKey, chain]);

  // The panel can mount before the parent has resolved the requested address.
  useEffect(() => {
    if (!initialAddress) return;
    setAddressInput(initialAddress);
    setSelected(initialAddress);
  }, [initialAddress]);

  const load = useCallback(
    async (addr: string) => {
      setLoading(true);
      setLoadError("");
      try {
        const d = await readToken(chain, addr, connection?.address);
        setData(d);
      } catch (err) {
        setData(null);
        setLoadError(err instanceof Error ? err.message : "Could not load token");
      } finally {
        setLoading(false);
      }
    },
    [chain, connection?.address],
  );

  useEffect(() => {
    if (selected && isAddress(selected)) void load(selected);
    else setData(null);
  }, [selected, load]);

  // Live quote as the user types.
  useEffect(() => {
    let cancelled = false;
    if (!selected || !isAddress(selected) || !amount.trim()) {
      setQuote(null);
      return;
    }
    let parsed: bigint;
    try {
      // buys are denominated in the quote asset, sells in the launched token (18 dp)
      parsed = parseUnits(amount.trim(), side === "buy" ? asset.decimals : 18);
    } catch {
      setQuote(null);
      return;
    }
    if (parsed <= 0n) {
      setQuote(null);
      return;
    }
    (async () => {
      try {
        const q = side === "buy" ? await quoteBuy(chain, selected, parsed) : await quoteSell(chain, selected, parsed);
        if (!cancelled) setQuote(q);
      } catch {
        if (!cancelled) setQuote(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [amount, side, selected, chain, asset.decimals]);

  const marketCapWei = useMemo(() => {
    if (!data) return 0n;
    return (data.priceWei * data.totalSupply) / 10n ** 18n;
  }, [data]);

  const selectToken = (addr: string) => {
    setSelected(addr);
    setAddressInput(addr);
    setAmount("");
    setQuote(null);
    setTxError("");
  };

  const trade = async () => {
    setTxError("");
    if (!connection || !activeProvider) {
      openModal();
      return;
    }
    if (!selected || !isAddress(selected)) {
      setTxError("Select a valid token address.");
      return;
    }
    let parsed: bigint;
    try {
      parsed = parseUnits(amount.trim(), side === "buy" ? asset.decimals : 18);
    } catch {
      setTxError("Invalid amount.");
      return;
    }
    if (parsed <= 0n) {
      setTxError("Amount must be greater than 0.");
      return;
    }
    setTxBusy(true);
    try {
      setTxStatus(`Switching to ${chain.short}…`);
      await switchChain(chain);
      setTxStatus(
        side === "buy" && !isNativeQuote(asset)
          ? `Approve ${asset.symbol}, then confirm the buy in your wallet…`
          : "Confirm in your wallet…",
      );
      if (side === "buy") {
        await buyToken(activeProvider, selected, parsed, 300, asset);
        notify(`Bought ${data?.symbol ?? "tokens"} 🎉`);
      } else {
        await sellToken(activeProvider, selected, parsed);
        notify(`Sold ${data?.symbol ?? "tokens"} 💸`);
      }
      setAmount("");
      setQuote(null);
      await load(selected);
    } catch (err) {
      setTxError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setTxBusy(false);
      setTxStatus("");
    }
  };

  const setSellPct = (pct: bigint) => {
    if (!data) return;
    const portion = (data.userBalance * pct) / 100n;
    setAmount(formatEther(portion));
  };

  return (
    <div className="space-y-4">
      {/* token picker */}
      <div className="flex gap-2">
        <input
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          placeholder="Paste a token address (0x…)"
          className="plops-input"
        />
        <button
          type="button"
          onClick={() => selectToken(addressInput.trim())}
          disabled={!isAddress(addressInput.trim())}
          className="btn-ghost !px-4 !py-2 text-sm disabled:opacity-50"
        >
          Load
        </button>
      </div>

      {saved.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {saved.map((t) => (
            <button
              key={t.address}
              type="button"
              onClick={() => selectToken(t.address)}
              className={`chip !py-1 ${selected?.toLowerCase() === t.address.toLowerCase() ? "!border-plops-accent !text-plops-ink" : ""}`}
            >
              {t.imageURI ? (
                <img src={t.imageURI} alt="" className="h-4 w-4 rounded-full object-cover" />
              ) : (
                <span>🪙</span>
              )}
              ${t.symbol}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="text-sm text-plops-ink/60">Loading token…</p>}
      {loadError && (
        <p className="rounded-lg border border-plops-down/40 bg-plops-down/10 px-3 py-2 text-sm text-plops-down">
          {loadError}
        </p>
      )}

      {data && (
        <>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-plops-edge bg-plops-muted text-2xl">
                {data.imageURI ? <img src={data.imageURI} alt="" className="h-full w-full object-cover" /> : "🪙"}
              </span>
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-plops-ink">
                  {data.name} <span className="text-plops-ink/50">${data.symbol}</span>
                </h3>
                <a
                  href={explorerToken(chain, data.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-plops-ink/50 hover:text-plops-ink"
                >
                  {shortAddr(data.address)} ↗
                </a>
              </div>
            </div>
            {data.description && <p className="mt-3 text-sm text-plops-ink/70">{data.description}</p>}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Price" value={`${fmtUnits(data.priceWei, asset.decimals, 8)} ${asset.symbol}`} />
              <Stat label="Market cap" value={`${fmtUnits(marketCapWei, asset.decimals, 3)} ${asset.symbol}`} />
              <Stat
                label="Liquidity"
                value={`${fmtUnits(data.realQuoteReserve, asset.decimals, 4)} ${asset.symbol}`}
              />
              <Stat label="Your balance" value={fmtTokens(data.userBalance)} />
            </div>
            <SocialRow twitter={data.twitter} telegram={data.telegram} website={data.website} />
          </div>

          {/* trade box */}
          <div className="glass rounded-xl p-4">
            <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg border border-plops-edge bg-plops-muted p-1">
              {(["buy", "sell"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSide(s);
                    setAmount("");
                    setQuote(null);
                  }}
                  className={`rounded-md py-2 text-sm font-semibold lowercase transition-colors ${
                    side === s
                      ? s === "buy"
                        ? "bg-plops-up text-black"
                        : "bg-plops-down text-white"
                      : "text-plops-ink/60 hover:text-plops-ink"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder={side === "buy" ? `${asset.symbol} amount` : `${data.symbol} amount`}
              className="plops-input"
            />

            <div className="mt-2 flex flex-wrap gap-2">
              {side === "buy"
                ? buyPresets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAmount(p)}
                      className="rounded-md border border-plops-edge bg-plops-muted px-3 py-1 text-xs font-semibold text-plops-ink/70 hover:text-plops-ink"
                    >
                      {p} {asset.symbol}
                    </button>
                  ))
                : SELL_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setSellPct(p.pct)}
                      className="rounded-md border border-plops-edge bg-plops-muted px-3 py-1 text-xs font-semibold text-plops-ink/70 hover:text-plops-ink"
                    >
                      {p.label}
                    </button>
                  ))}
            </div>

            {quote !== null && (
              <p className="mt-2 text-sm text-plops-ink/70">
                ≈{" "}
                {side === "buy"
                  ? `${fmtTokens(quote)} ${data.symbol}`
                  : `${fmtUnits(quote, asset.decimals, 6)} ${asset.symbol}`}{" "}
                <span className="text-plops-ink/40">(after 1% fee)</span>
              </p>
            )}

            {txError && (
              <p className="mt-2 rounded-lg border border-plops-down/40 bg-plops-down/10 px-3 py-2 text-sm text-plops-down">
                {txError}
              </p>
            )}
            {txStatus && <p className="mt-2 text-sm text-plops-ink/60">{txStatus}</p>}

            <button
              type="button"
              onClick={trade}
              disabled={txBusy}
              className="btn-primary mt-3 w-full disabled:opacity-60"
            >
              {txBusy
                ? "Working…"
                : !connection
                  ? "Connect wallet"
                  : side === "buy"
                    ? `Buy ${data.symbol}`
                    : `Sell ${data.symbol}`}
            </button>
          </div>
        </>
      )}

      {!data && !loading && !loadError && (
        <p className="py-6 text-center text-sm text-plops-ink/50">
          Deploy a token or paste an address to start trading on the bonding curve.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-plops-edge bg-plops-muted px-3 py-2">
      <p className="text-[11px] lowercase tracking-wide text-plops-ink/45">{label}</p>
      <p className="truncate text-sm font-semibold text-plops-ink">{value}</p>
    </div>
  );
}

function SocialRow({ twitter, telegram, website }: { twitter: string; telegram: string; website: string }) {
  const links = [
    { url: toExternalUrl(twitter), label: "Twitter" },
    { url: toExternalUrl(telegram), label: "Telegram" },
    { url: toExternalUrl(website), label: "Website" },
  ].filter((l) => l.url);
  if (links.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className="chip !py-1 text-xs hover:border-plops-ink/40"
        >
          {l.label} ↗
        </a>
      ))}
    </div>
  );
}
