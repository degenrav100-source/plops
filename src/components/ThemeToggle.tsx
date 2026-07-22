import type { Theme } from "../hooks/useTheme";

interface Props {
  theme: Theme;
  toggle: () => void;
  className?: string;
}

export default function ThemeToggle({ theme, toggle, className = "" }: Props) {
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={`relative flex h-10 w-10 items-center justify-center rounded-full glass text-lg transition-all duration-300 hover:shadow-glow ${className}`}
    >
      <span
        className={`absolute transition-all duration-300 ${
          isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"
        }`}
      >
        🌙
      </span>
      <span
        className={`absolute transition-all duration-300 ${
          isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
        }`}
      >
        ☀️
      </span>
    </button>
  );
}
