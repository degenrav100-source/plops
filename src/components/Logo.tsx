import AsciiPlops from "./AsciiPlops";
import { goHome } from "../hooks/useHashRoute";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => goHome()}
      aria-label="plops home"
      className={`group flex items-center gap-2 ${className}`}
    >
      <AsciiPlops
        cols={16}
        rows={8}
        speed={0.9}
        className="h-9 w-9 overflow-hidden text-plops-ink/80 transition-colors group-hover:text-plops-ink"
        style={{ fontSize: "4.5px" }}
      />
      <span className="text-lg font-bold lowercase tracking-tight text-plops-ink">plops</span>
    </button>
  );
}
