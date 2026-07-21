import { features } from "../data";
import SectionHeading from "./SectionHeading";

export default function Features() {
  return (
    <section id="features" className="section py-24">
      <SectionHeading
        eyebrow="✨ Why plops"
        title="Everything a launch needs — done beautifully"
        subtitle="Built for creators and communities who care about fairness, safety, and vibes."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="group glass rounded-3xl p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-dreamy-soft text-3xl transition-transform duration-300 group-hover:scale-110">
              {f.emoji}
            </span>
            <h3 className="mt-5 text-xl font-semibold text-plops-ink">{f.title}</h3>
            <p className="mt-2 text-plops-ink/65">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
