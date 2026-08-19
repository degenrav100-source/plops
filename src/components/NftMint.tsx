import { useCallback, useEffect, useState } from "react";
import { formatEther } from "ethers";
import { useWallet } from "../wallet/context";
import { useToast } from "../toast/context";
import { CHAINS, explorerAddress, explorerTx, type ChainKey } from "../wallet/chains";
import {
  COLLECTION,
  clearNftOverride,
  deployCollection,
  mintPlops,
  nftAddress,
  openseaCollection,
  openseaItem,
  readCollection,
  setNftOverride,
  tokenArt,
  type CollectionState,
} from "../lib/nft";
import { goHome } from "../hooks/useHashRoute";
import { fmtEth, shortAddr } from "../lib/format";

const PREVIEW_IDS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function NftMint() {
  const { connection, activeProvider, switchChain, openModal } = useWallet();
  const { notify } = useToast();

  const [chainKey, setChainKey] = useState<ChainKey>("mainnet");
  const [quantity, setQuantity] = useState(1);
  const [state, setState] = useState<CollectionState | null>(null);
  const [previews, setPreviews] = useState<{ id: number; src: string }[]>([]);
  const [minted, setMinted] = useState<{ ids: number[]; txHash: string } | null>(null);
  const [busy, setBusy] = useState<"deploy" | "mint" | null>(null);
  const [error, setError] = useState("");
  const [, forceRender] = useState(0);

  const chain = CHAINS[chainKey];
  const address = nftAddress(chain);
  const price = state?.price ?? COLLECTION.price;
  const supply = state?.supply ?? COLLECTION.supply;
  const soldOut = state !== null && state.minted >= state.supply;
  const remaining = state ? state.supply - state.minted : COLLECTION.supply;
  const maxQuantity = Math.max(1, Math.min(COLLECTION.maxPerTx, remaining));
  const total = price * BigInt(quantity);

  const refresh = useCallback(async () => {
    if (!nftAddress(chain)) {
      setState(null);
      setPreviews([]);
      return;
    }
    try {
      setState(await readCollection(chain, connection?.address));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read the collection.");
    }
  }, [chain, connection?.address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setQuantity((q) => Math.min(q, maxQuantity));
  }, [maxQuantity]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!address) return;
      const art = await Promise.all(
        PREVIEW_IDS.map(async (id) => ({ id, src: await tokenArt(chain, id).catch(() => "") })),
      );
      if (!cancelled) setPreviews(art.filter((a) => a.src !== ""));
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [chain, address]);

  const deploy = async () => {
    setError("");
    if (!connection || !activeProvider) {
      openModal();
      return;
    }
    setBusy("deploy");
    try {
      await switchChain(chain);
      const res = await deployCollection(activeProvider);
      setNftOverride(chainKey, res.address);
      forceRender((n) => n + 1);
      notify(`plops genesis live on ${chain.short.toLowerCase()}: ${shortAddr(res.address)}`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deploy failed");
    } finally {
      setBusy(null);
    }
  };

  const mint = async () => {
    setError("");
    if (!connection || !activeProvider) {
      openModal();
      return;
    }
    setBusy("mint");
    try {
      await switchChain(chain);
      const res = await mintPlops(activeProvider, chain, quantity);
      setMinted(res);
      notify(`minted ${res.ids.length} plop${res.ids.length === 1 ? "" : "s"}`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mint failed");
    } finally {
      setBusy(null);
    }
  };

  const forget = () => {
    clearNftOverride(chainKey);
    setState(null);
    setPreviews([]);
    forceRender((n) => n + 1);
  };

  return (
    <div className="section max-w-4xl py-8">
      <button type="button" onClick={() => goHome()} className="btn-ghost mb-6">
        ← back to plops
      </button>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold lowercase text-plops-ink">plops genesis</h1>
          <p className="mt-2 max-w-2xl text-sm text-plops-ink/60">
            1500 pixel plops on Robinhood Chain, {fmtEth(COLLECTION.price)} ETH each. Every trait, the
            artwork and the metadata are generated inside the contract — no IPFS, no server, no
            reveal — so the collection outlives this website. OpenSea indexes Robinhood Chain, so
            mints show up there with floor price, offers and rarity.
          </p>
        </div>
        <div className="flex rounded-lg border border-plops-edge p-0.5">
          {(Object.keys(CHAINS) as ChainKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setChainKey(key)}
              className={`rounded-md px-3 py-1.5 text-xs lowercase transition-colors ${
                chainKey === key
                  ? "bg-plops-accent text-plops-page"
                  : "text-plops-ink/60 hover:text-plops-ink"
              }`}
            >
              {CHAINS[key].short.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {previews.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {previews.map(({ id, src }) => (
            <img
              key={id}
              src={src}
              alt={`plops #${id}`}
              className="w-full rounded-xl border border-plops-edge bg-plops-muted"
            />
          ))}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-plops-edge bg-plops-surface p-4">
        {address ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-plops-ink">
                {state ? `${state.minted} / ${state.supply} minted` : "reading the collection…"}
              </span>
              <span className="text-xs lowercase text-plops-ink/55">
                {fmtEth(price)} eth · max {maxQuantity} per tx
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-plops-muted">
              <div
                className="h-full bg-plops-accent transition-[width]"
                style={{ width: `${state ? (state.minted / state.supply) * 100 : 0}%` }}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-lg border border-plops-edge">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-plops-ink/70 hover:text-plops-ink"
                  aria-label="Mint one less"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm text-plops-ink">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                  className="px-3 py-2 text-plops-ink/70 hover:text-plops-ink"
                  aria-label="Mint one more"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => void mint()}
                disabled={busy !== null || soldOut}
                className="btn-primary disabled:opacity-60"
              >
                {soldOut
                  ? "sold out"
                  : busy === "mint"
                    ? "confirm in your wallet…"
                    : connection
                      ? `mint ${quantity} for ${formatEther(total)} eth`
                      : "connect wallet to mint"}
              </button>
              <button type="button" onClick={() => void refresh()} className="btn-ghost">
                refresh
              </button>
            </div>

            {state && connection && (
              <p className="mt-3 text-xs text-plops-ink/55">
                you hold {state.owned} plop{state.owned === 1 ? "" : "s"} on{" "}
                {chain.short.toLowerCase()}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
              <a
                href={explorerAddress(chain, address)}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all font-mono text-plops-accent hover:underline"
              >
                {address} ↗
              </a>
              {openseaCollection(chain, address) && (
                <a
                  href={openseaCollection(chain, address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lowercase text-plops-accent hover:underline"
                >
                  view on opensea ↗
                </a>
              )}
              <button type="button" onClick={forget} className="lowercase text-plops-ink/45 hover:text-plops-ink">
                forget address
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-plops-ink/70">
              The collection is not deployed on {chain.chainName} yet. Whoever deploys it pays the
              gas once, owns the mint proceeds and the 5% royalty, and can never change the art —
              every plop is already fixed by the contract address.
            </p>
            <button
              type="button"
              onClick={() => void deploy()}
              disabled={busy !== null}
              className="btn-primary mt-4 disabled:opacity-60"
            >
              {busy === "deploy"
                ? "confirm in your wallet…"
                : connection
                  ? `deploy the collection on ${chain.short.toLowerCase()}`
                  : "connect wallet to deploy"}
            </button>
          </>
        )}
      </div>

      {minted && (
        <div className="mt-4 rounded-xl border border-plops-accent/40 bg-plops-accent/10 p-4">
          <p className="text-sm text-plops-ink">
            minted #{minted.ids.join(", #")} —{" "}
            <a
              href={explorerTx(chain, minted.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-plops-accent hover:underline"
            >
              view transaction ↗
            </a>
          </p>
          {openseaItem(chain, address, minted.ids[0] ?? 1) && (
            <a
              href={openseaItem(chain, address, minted.ids[0] ?? 1)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs lowercase text-plops-accent hover:underline"
            >
              open on opensea ↗
            </a>
          )}
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

      <dl className="mt-6 grid gap-3 text-xs sm:grid-cols-3">
        {[
          ["supply", `${supply} pixel plops`],
          ["mint price", `${fmtEth(COLLECTION.price)} eth`],
          ["royalty", `${COLLECTION.royaltyBps / 100}% (ERC-2981)`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-plops-edge bg-plops-muted px-3 py-2">
            <dt className="lowercase text-plops-ink/45">{k}</dt>
            <dd className="mt-0.5 lowercase text-plops-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
