import AsciiPlops from "./AsciiPlops";
import { useLaunch } from "../launch/context";
import { navigate } from "../hooks/useHashRoute";

// Pre-desaturated so the banner needs no CSS filter: a filtered child escapes the card's
// rounded overflow clip on some mobile browsers and bleeds over the page.
const scene = `${import.meta.env.BASE_URL}scene-mono.webp`;

export default function HeroBanner() {
  const { openLaunch } = useLaunch();

  return (
    <section
      className="relative isolate overflow-hidden rounded-xl border border-plops-edge bg-plops-page bg-cover bg-center"
      style={{ backgroundImage: `url(${scene})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-plops-page via-plops-page/90 to-plops-page/40" />
      <div className="absolute inset-0 bg-plops-page/40" />

      <div className="relative grid items-center gap-4 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:p-8">
        <div>
          <span className="text-xs uppercase tracking-wider text-plops-ink/55">
            robinhood chain · fair launch · your keys
          </span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-plops-ink md:text-4xl">
            launch coins with a <em className="font-normal italic text-plops-accent">plop</em>.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-plops-ink/70">
            Name it, plop it, trade it. Liquidity is live the second your token is — no presale, no
            team bag, no one holding your keys.
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-plops-ink/55">
            <li>fair launch by default</li>
            <li>instant liquidity</li>
            <li>you keep custody</li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => openLaunch("create")} className="btn-primary">
              create a token
            </button>
            <button type="button" onClick={() => openLaunch("trade")} className="btn-ghost bg-plops-surface/70">
              trade on curve
            </button>
            <button
              type="button"
              onClick={() => navigate("#/docs/deploy")}
              className="btn-ghost bg-plops-surface/70"
            >
              how to deploy
            </button>
          </div>
        </div>

        <AsciiPlops
          cols={46}
          rows={20}
          className="max-w-full justify-self-center overflow-hidden text-plops-ink/85 md:justify-self-end"
          style={{ fontSize: "clamp(5.5px, 0.85vw, 11px)" }}
        />
      </div>
    </section>
  );
}
