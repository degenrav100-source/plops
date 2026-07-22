export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* base dreamy wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#eaf3ff] via-[#f3f0ff] to-[#ffeaf4] dark:from-[#05060f] dark:via-[#0a0d24] dark:to-[#160a2b]" />

      {/* cinematic vignette (dark only) */}
      <div className="absolute inset-0 hidden dark:block" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(91,140,255,0.18), transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(255,158,205,0.15), transparent 55%)" }} />

      {/* floating glow blobs */}
      <div className="absolute -left-32 -top-24 h-[28rem] w-[28rem] animate-float-slow rounded-full bg-plops-blue/40 blur-3xl dark:bg-plops-blue/25" />
      <div className="absolute right-[-8rem] top-24 h-[26rem] w-[26rem] animate-float rounded-full bg-plops-pink/40 blur-3xl dark:bg-plops-pink/25" />
      <div className="absolute bottom-[-10rem] left-1/3 h-[30rem] w-[30rem] animate-float-slow rounded-full bg-plops-green/40 blur-3xl dark:bg-plops-green/25" />
      <div className="absolute right-1/4 top-1/2 h-72 w-72 animate-float rounded-full bg-plops-sky/40 blur-3xl dark:bg-plops-sky/20" />

      {/* subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.15] dark:opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(124,180,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(124,180,255,0.4) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, black, transparent 75%)",
        }}
      />
    </div>
  );
}
