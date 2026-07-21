import { useState } from "react";
import { launches, type LaunchStatus } from "../data";
import SectionHeading from "./SectionHeading";

const tabs: { key: LaunchStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "upcoming", label: "Upcoming" },
  { key: "ended", label: "Ended" },
];

const statusStyles: Record<LaunchStatus, string> = {
  live: "text-plops-green",
  upcoming: "text-plops-blue",
  ended: "text-plops-ink/40",
};

const statusLabel: Record<LaunchStatus, string> = {
  live: "● Live",
  upcoming: "◇ Upcoming",
  ended: "✓ Ended",
};

export default function Launches() {
  const [tab, setTab] = useState<LaunchStatus | "all">("all");
  const visible = tab === "all" ? launches : launches.filter((l) => l.status === tab);

  return (
    <section id="launches" className="section py-24">
      <SectionHeading
        eyebrow="🚀 Launchpad"
        title="Discover your next launch"
        subtitle="Curated, audited projects launching on the Robinhood Chain — every day."
      />

      <div className="mb-10 flex justify-center">
        <div className="glass inline-flex rounded-full p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                tab === t.key ? "bg-dreamy text-plops-ink shadow-glow" : "text-plops-ink/60 hover:text-plops-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => (
          <article
            key={p.ticker}
            className="group glass relative overflow-hidden rounded-3xl p-6 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow"
          >
            <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${p.tint} blur-2xl transition-opacity duration-300 group-hover:opacity-90`} />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-2xl shadow-sm">
                  {p.emoji}
                </span>
                <div>
                  <h3 className="font-semibold text-plops-ink">{p.name}</h3>
                  <p className="text-sm text-plops-ink/55">${p.ticker}</p>
                </div>
              </div>
              <span className={`text-sm font-semibold ${statusStyles[p.status]}`}>{statusLabel[p.status]}</span>
            </div>

            <div className="relative mt-6">
              <div className="flex justify-between text-sm text-plops-ink/55">
                <span>{p.status === "upcoming" ? "Target" : "Raised"}</span>
                <span className="font-semibold text-plops-ink">{p.raise}</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/60">
                <div
                  className="h-full rounded-full bg-dreamy transition-all duration-500"
                  style={{ width: `${p.status === "upcoming" ? 4 : p.progress}%` }}
                />
              </div>
              {p.status !== "upcoming" && (
                <p className="mt-1 text-right text-xs text-plops-ink/45">{p.progress}% filled</p>
              )}
            </div>

            <div className="relative mt-5 flex items-center justify-between rounded-2xl bg-white/50 px-4 py-3">
              <div>
                <p className="text-xs text-plops-ink/50">Price</p>
                <p className="font-semibold text-plops-ink">{p.price}</p>
              </div>
              <button className="btn-primary !px-5 !py-2 text-sm">
                {p.status === "live" ? "Join" : p.status === "upcoming" ? "Remind me" : "View"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
