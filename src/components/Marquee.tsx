const items = [
  "🫧 Fair Launches",
  "⚡ Sub-second Finality",
  "🔒 Audited Contracts",
  "🌈 No-code Studio",
  "🎯 Tiered Staking",
  "🛡️ Rug-proof Vaults",
  "🚀 Robinhood Chain",
  "💧 Auto Liquidity Lock",
];

export default function Marquee() {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-white/50 bg-white/30 py-4 backdrop-blur-md">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-2 text-sm font-semibold text-plops-ink/70">
            {item}
            <span className="text-plops-pink">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
