import { roadmap } from "../data";
import SectionHeading from "./SectionHeading";

export default function Roadmap() {
  return (
    <section id="roadmap" className="section py-24">
      <SectionHeading eyebrow="🗺️ Roadmap" title="Where plops is floating next" />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {roadmap.map((r) => (
          <div
            key={r.quarter}
            className={`glass rounded-3xl p-7 shadow-soft ${r.done ? "ring-1 ring-plops-green/40" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-plops-ink/60">{r.quarter}</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  r.done ? "bg-plops-green/20 text-plops-green" : "bg-plops-blue/15 text-plops-blue"
                }`}
              >
                {r.done ? "Shipped" : "Planned"}
              </span>
            </div>
            <h3 className="mt-3 font-display text-2xl font-bold text-plops-ink">{r.title}</h3>
            <ul className="mt-4 space-y-2">
              {r.points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-plops-ink/70">
                  <span className={r.done ? "text-plops-green" : "text-plops-pink"}>
                    {r.done ? "✓" : "◇"}
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
