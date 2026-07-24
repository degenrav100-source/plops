export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-plops-page" />
      {/* faint terminal grid */}
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.25]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--plops-edge)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--plops-edge)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse at 50% 0%, black, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, black, transparent 70%)",
        }}
      />
    </div>
  );
}
