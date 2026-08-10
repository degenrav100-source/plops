import { navigate } from "../hooks/useHashRoute";

const logoSrc = `${import.meta.env.BASE_URL}logo.png`;

/** Entry point to the docs, straight under the banner. */
export default function DocsCallout() {
  return (
    <section className="mt-4 flex flex-col gap-4 rounded-xl border border-plops-edge bg-plops-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <img
          src={logoSrc}
          alt=""
          className="h-9 w-9 shrink-0 object-contain [filter:brightness(0)] dark:[filter:brightness(0)_invert(1)]"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold lowercase text-plops-ink">plops docs</p>
          <p className="text-xs text-plops-ink/55">
            how the curve prices your coin, the networks, the contract — in plain english.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button type="button" onClick={() => navigate("#/docs")} className="btn-primary">
          open docs
        </button>
        <button type="button" onClick={() => navigate("#/docs/deploy")} className="btn-ghost">
          how to deploy
        </button>
      </div>
    </section>
  );
}
