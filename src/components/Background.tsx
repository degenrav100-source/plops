const scene = `${import.meta.env.BASE_URL}scene-blur.webp`;

export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-plops-page" />
      {/* the launch scene, softened so the terminal stays readable */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-45 dark:opacity-30"
        style={{ backgroundImage: `url(${scene})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-plops-page/60 via-plops-page/85 to-plops-page" />
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
