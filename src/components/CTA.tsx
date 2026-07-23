import { useToast } from "../toast/context";
import { useLaunch } from "../launch/context";

export default function CTA() {
  const { notify } = useToast();
  const { openLaunch } = useLaunch();

  return (
    <section className="section py-16">
      <div className="relative overflow-hidden rounded-[2.5rem] p-10 text-center shadow-soft md:p-16">
        <div className="absolute inset-0 bg-dreamy opacity-90" />
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
        <div className="absolute -left-10 -top-10 h-48 w-48 animate-float rounded-full bg-white/30 blur-2xl" />
        <div className="absolute -bottom-12 right-0 h-56 w-56 animate-float-slow rounded-full bg-white/30 blur-2xl" />

        <div className="relative">
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-bold text-[#0c1330] md:text-5xl">
            Ready to make your first plop?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[#0c1330]/80">
            Join thousands of ploppers launching and backing the next wave of tokens on the Robinhood Chain.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => openLaunch("create")}
              className="inline-flex items-center justify-center rounded-full bg-[#0c1330] px-8 py-3.5 font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5"
            >
              Launch your token →
            </button>
            <button
              type="button"
              onClick={() => notify("Docs are coming soon — stay tuned! 📚")}
              className="inline-flex items-center justify-center rounded-full border border-[#0c1330]/20 bg-white/60 px-8 py-3.5 font-semibold text-[#0c1330] backdrop-blur-md transition-colors hover:bg-white/80"
            >
              Read the docs
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
