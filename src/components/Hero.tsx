import { stats } from "../data";

export default function Hero() {
  return (
    <section id="top" className="relative flex flex-col items-center px-6 pt-36 pb-16 text-center md:pt-44">
      <div className="section flex flex-col items-center">
        <div className="chip animate-pulse-glow">
          <span className="h-2 w-2 rounded-full bg-plops-green shadow-glow-green" />
          Live on the Robinhood Chain
        </div>

        <h1 className="mt-7 max-w-4xl font-display text-5xl font-bold leading-[1.05] tracking-tight text-plops-ink md:text-7xl">
          Launch your token into the{" "}
          <span className="text-gradient animate-shimmer">dreamy</span> new economy
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-plops-ink/70 md:text-xl">
          <span className="font-semibold text-plops-ink">plops</span> is the fair-launch launchpad built natively on the
          Robinhood Chain. Discover, stake, and back the next generation of tokens — safely and beautifully.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <a href="#launches" className="btn-primary">
            Explore Launches →
          </a>
          <a href="#how" className="btn-ghost">
            How it works
          </a>
        </div>

        {/* floating preview card */}
        <div className="relative mt-16 w-full max-w-3xl">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-dreamy opacity-30 blur-3xl" />
          <div className="glass rounded-[2rem] p-6 shadow-soft md:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-plops-sky/40 text-2xl">🫧</span>
                <div className="text-left">
                  <p className="font-semibold text-plops-ink">Bubble Finance</p>
                  <p className="text-sm text-plops-ink/60">$BUBL · Robinhood Chain</p>
                </div>
              </div>
              <span className="chip !text-plops-green">● Live</span>
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-sm text-plops-ink/60">
                <span>Raised</span>
                <span className="font-semibold text-plops-ink">$302,400 / $420,000</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/60">
                <div className="h-full w-[72%] rounded-full bg-dreamy shadow-glow" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-left">
              {[
                { k: "Price", v: "0.012 RBH" },
                { k: "Ends in", v: "18h 42m" },
                { k: "Tier", v: "Sapphire" },
              ].map((i) => (
                <div key={i.k} className="rounded-2xl bg-white/50 p-3">
                  <p className="text-xs text-plops-ink/50">{i.k}</p>
                  <p className="font-semibold text-plops-ink">{i.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* inline stats */}
        <div className="mt-16 grid w-full grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="glass rounded-3xl px-4 py-6">
              <p className="text-gradient text-3xl font-bold md:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-plops-ink/60">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
