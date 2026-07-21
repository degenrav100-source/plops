export default function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="#top" className={`group flex items-center gap-2.5 ${className}`}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-dreamy shadow-glow transition-transform duration-300 group-hover:rotate-12">
        <span className="text-lg">🫧</span>
        <span className="absolute inset-0 rounded-2xl bg-white/20 blur-md" />
      </span>
      <span className="text-xl font-bold tracking-tight text-plops-ink">
        plops
      </span>
    </a>
  );
}
