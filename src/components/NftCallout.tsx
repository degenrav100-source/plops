import { navigate } from "../hooks/useHashRoute";
import { COLLECTION } from "../lib/nft";
import { fmtEth } from "../lib/format";

const logoSrc = `${import.meta.env.BASE_URL}logo.png`;

/** Entry point to the genesis mint, next to the docs callout. */
export default function NftCallout() {
  return (
    <section className="mt-4 flex flex-col gap-4 rounded-xl border border-plops-edge bg-plops-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <img
          src={logoSrc}
          alt=""
          className="h-9 w-9 shrink-0 object-contain [filter:brightness(0)] dark:[filter:brightness(0)_invert(1)]"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold lowercase text-plops-ink">plops genesis nfts</p>
          <p className="text-xs text-plops-ink/55">
            {COLLECTION.supply} fully on-chain pixel plops · {fmtEth(COLLECTION.price)} eth mint ·
            tradable on opensea
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button type="button" onClick={() => navigate("#/nft")} className="btn-primary">
          mint a plop
        </button>
        <button type="button" onClick={() => navigate("#/docs/nfts")} className="btn-ghost">
          collection docs
        </button>
      </div>
    </section>
  );
}
