export default function CTA() {
  return (
    <section className="section py-16">
      <div className="relative overflow-hidden rounded-[2.5rem] p-10 text-center shadow-soft md:p-16">
        <div className="absolute inset-0 bg-dreamy opacity-90" />
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
        <div className="absolute -left-10 -top-10 h-48 w-48 animate-float rounded-full bg-white/30 blur-2xl" />
        <div className="absolute -bottom-12 right-0 h-56 w-56 animate-float-slow rounded-full bg-white/30 blur-2xl" />

        <div className="relative">
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-bold text-plops-ink md:text-5xl">
            Ready to make your first plop?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-plops-ink/80">
            Join thousands of ploppers launching and backing the next wave of tokens on the Robinhood Chain.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#launches"
              className="inline-flex items-center justify-center rounded-full bg-plops-ink px-8 py-3.5 font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5"
            >
              Launch App →
            </a>
            <a
              href="#how"
              className="inline-flex items-center justify-center rounded-full border border-plops-ink/20 bg-white/50 px-8 py-3.5 font-semibold text-plops-ink backdrop-blur-md transition-colors hover:bg-white/70"
            >
              Read the docs
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
