import AsciiPlops from "./AsciiPlops";
import { useLaunch } from "../launch/context";
import { navigate } from "../hooks/useHashRoute";

const scene = `${import.meta.env.BASE_URL}scene.webp`;

export default function HeroBanner() {
  const { openLaunch } = useLaunch();

  return (
    <section className="relative overflow-hidden rounded-xl border border-plops-edge">
      <img
        src={scene}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover grayscale"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-plops-page via-plops-page/90 to-plops-page/40" />
      <div className="absolute inset-0 bg-plops-page/40" />

      <div className="relative grid items-center gap-4 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:p-8">
        <div>
          <span className="text-xs uppercase tracking-wider text-plops-ink/55">
            robinhood chain, non-custodial
          </span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-plops-ink md:text-4xl">
            launch coins with a <em className="font-normal italic text-plops-accent">plop</em>.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-plops-ink/70">
            Deploy an OpenZeppelin token on a non-custodial bonding curve on the Robinhood Chain.
            Every buy and sell settles on-chain — you always hold your own keys.
          </p>
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
          className="justify-self-center text-plops-ink/85 md:justify-self-end"
          style={{ fontSize: "clamp(5.5px, 0.85vw, 11px)" }}
        />
      </div>
    </section>
  );
}
