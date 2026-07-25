import { useState } from "react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import ConnectButton from "./ConnectButton";
import type { Theme } from "../hooks/useTheme";
import { useLaunch } from "../launch/context";
import { CHAINS } from "../wallet/chains";
import { isAddress } from "../lib/format";

interface Props {
  theme: Theme;
  toggleTheme: () => void;
}

export default function Navbar({ theme, toggleTheme }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { openLaunch } = useLaunch();

  const goCreate = () => {
    setOpen(false);
    openLaunch("create");
  };
  const goTrade = () => {
    setOpen(false);
    openLaunch("trade");
  };
  const goMarket = () => {
    setOpen(false);
    document.getElementById("tokens")?.scrollIntoView({ behavior: "smooth" });
  };

  const explorer = `${CHAINS.mainnet.blockExplorerUrls[0]}`;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (isAddress(q)) {
      setOpen(false);
      openLaunch("trade", q);
    } else {
      goMarket();
    }
    setQuery("");
  };

  const navItems = (
    <>
      <button type="button" onClick={goMarket} className="nav-link">
        market
      </button>
      <button type="button" onClick={goCreate} className="nav-link">
        create
      </button>
      <button type="button" onClick={goTrade} className="nav-link">
        trade
      </button>
      <a href={explorer} target="_blank" rel="noopener noreferrer" className="nav-link">
        explorer
      </a>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-plops-edge bg-plops-page/90 backdrop-blur-md">
      <div className="section flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">{navItems}</nav>
        </div>

        <form onSubmit={onSearch} className="hidden max-w-xs flex-1 lg:block">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-plops-ink/40">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search ticker, name or contract"
              className="w-full rounded-lg border border-plops-edge bg-plops-muted py-2 pl-9 pr-3 text-xs text-plops-ink outline-none transition-colors placeholder:text-plops-ink/35 focus:border-plops-accent"
            />
          </div>
        </form>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle theme={theme} toggle={toggleTheme} />
          <ConnectButton />
          <button type="button" onClick={goCreate} className="btn-primary">
            create
          </button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle theme={theme} toggle={toggleTheme} />
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-plops-edge text-plops-ink"
          >
            <span className="text-lg leading-none">{open ? "\u2715" : "\u2630"}</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-plops-edge bg-plops-surface px-4 py-3 md:hidden">
          <nav className="flex flex-col items-start gap-1 [&>*]:w-full [&>*]:text-left">{navItems}</nav>
          <form onSubmit={onSearch} className="mt-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search ticker, name or contract"
              className="plops-input text-xs"
            />
          </form>
          <div className="mt-3 flex flex-col gap-2">
            <ConnectButton className="w-full" />
            <button type="button" onClick={goCreate} className="btn-primary w-full">
              create token
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
