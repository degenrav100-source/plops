import { steps } from "../data";
import SectionHeading from "./SectionHeading";

export default function HowItWorks() {
  return (
    <section id="how" className="section py-24">
      <SectionHeading
        eyebrow="🌈 How it works"
        title="From wallet to launch in four steps"
        subtitle="No jargon, no friction. Just a soft, guided path to your next investment."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div key={s.step} className="relative glass rounded-3xl p-7 shadow-soft">
            <span className="text-gradient font-display text-5xl font-bold">{s.step}</span>
            <h3 className="mt-4 text-lg font-semibold text-plops-ink">{s.title}</h3>
            <p className="mt-2 text-sm text-plops-ink/65">{s.desc}</p>
            {i < steps.length - 1 && (
              <span className="absolute right-6 top-8 hidden text-2xl text-plops-pink/60 lg:block">→</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
