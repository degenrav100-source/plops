const logoSrc = `${import.meta.env.BASE_URL}logo.png`;

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="#top" className={`group flex items-center gap-2 ${className}`}>
      <img
        src={logoSrc}
        alt="plops logo"
        className="h-7 w-7 object-contain transition-transform duration-200 [filter:brightness(0)] group-hover:scale-110 dark:[filter:brightness(0)_invert(1)]"
      />
      <span className="text-lg font-bold lowercase tracking-tight text-plops-ink">plops</span>
    </a>
  );
}
