const logoSrc = `${import.meta.env.BASE_URL}logo.png`;

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="#top" className={`group flex items-center gap-2.5 ${className}`}>
      <span className="relative flex h-9 w-9 items-center justify-center">
        <span className="absolute inset-0 rounded-2xl bg-plops-ink/10 blur-md transition-opacity duration-300 group-hover:opacity-90 dark:bg-white/10" />
        <img
          src={logoSrc}
          alt="plops logo"
          className="relative h-9 w-9 object-contain transition-transform duration-300 [filter:brightness(0)] group-hover:rotate-6 group-hover:scale-110 dark:[filter:brightness(0)_invert(1)]"
        />
      </span>
      <span className="text-xl font-bold tracking-tight text-plops-ink">plops</span>
    </a>
  );
}
