import { useEffect, useState } from "react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import ConnectButton from "./ConnectButton";
import type { Theme } from "../hooks/useTheme";
import { useWallet } from "../wallet/context";
import { useToast } from "../toast/context";

const links = [
  { label: "Launches", href: "#launches" },
  { label: "How it works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "FAQ", href: "#faq" },
];

interface Props {
  theme: Theme;
  toggleTheme: () => void;
}

export default function Navbar({ theme, toggleTheme }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { connection, openModal } = useWallet();
  const { notify } = useToast();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const launchApp = () => {
    setOpen(false);
    if (!connection) {
      openModal();
      return;
    }
    document.getElementById("launches")?.scrollIntoView({ behavior: "smooth" });
    notify("Wallet connected — pick a launch to join.");
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        className={`section flex items-center justify-between rounded-full px-5 py-3 transition-all duration-300 ${
          scrolled ? "glass shadow-soft" : "border border-transparent bg-transparent"
        }`}
      >
        <Logo />

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-plops-ink/70 transition-colors hover:bg-plops-surface/60 hover:text-plops-ink"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle theme={theme} toggle={toggleTheme} />
          <ConnectButton />
          <button type="button" onClick={launchApp} className="btn-primary text-sm">
            Launch App
          </button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle theme={theme} toggle={toggleTheme} />
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full glass"
          >
            <span className="text-lg">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </nav>

      {open && (
        <div className="absolute top-20 left-4 right-4 rounded-3xl glass p-4 shadow-soft md:hidden">
          <ul className="flex flex-col gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-sm font-medium text-plops-ink/80 hover:bg-plops-surface/70"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-col gap-2">
            <ConnectButton className="w-full" />
            <button type="button" onClick={launchApp} className="btn-primary w-full text-sm">
              Launch App
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
