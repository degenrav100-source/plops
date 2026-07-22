const logoSrc = `${import.meta.env.BASE_URL}logo.png`;

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="#top" className={`group flex items-center gap-2.5 ${className}`}>
      <span className="relative flex h-9 w-9 items-center justify-center">
        <span className="absolute inset-0 rounded-2xl bg-plops-green/30 blur-md transition-opacity duration-300 group-hover:opacity-90" />
        <img
          src={logoSrc}
          alt="plops logo"
          className="relative h-9 w-9 object-contain drop-shadow-[0_0_10px_rgba(95,227,192,0.65)] transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"
        />
      </span>
      <span className="text-xl font-bold tracking-tight text-plops-ink">
        plops
      </span>
    </a>
  );
}
