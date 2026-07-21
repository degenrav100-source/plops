import Logo from "./Logo";

const columns = [
  {
    title: "Product",
    links: ["Launches", "Staking", "Creator Studio", "Dashboard"],
  },
  {
    title: "Resources",
    links: ["Docs", "Audits", "Brand Kit", "Blog"],
  },
  {
    title: "Community",
    links: ["Twitter / X", "Discord", "Telegram", "Governance"],
  },
];

export default function Footer() {
  return (
    <footer className="section pb-10 pt-16">
      <div className="glass rounded-[2rem] p-8 shadow-soft md:p-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-plops-ink/60">
              The dreamy fair-launch launchpad on the Robinhood Chain. Made with 🫧 for ploppers everywhere.
            </p>
          </div>

          {columns.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold text-plops-ink">{c.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#top" className="text-sm text-plops-ink/60 transition-colors hover:text-plops-ink">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/50 pt-6 text-sm text-plops-ink/55 md:flex-row">
          <p>© {new Date().getFullYear()} plops. All rights reserved.</p>
          <p>Built on the Robinhood Chain · Not financial advice.</p>
        </div>
      </div>
    </footer>
  );
}
