export default function Footer() {
  return (
    <footer className="mt-4 border-t border-plops-edge">
      <div className="section flex flex-col items-center justify-between gap-2 py-4 text-xs text-plops-ink/50 sm:flex-row">
        <p className="lowercase">
          <span className="font-semibold text-plops-ink/70">plops</span> · non-custodial launchpad on
          the robinhood chain
        </p>
        <div className="flex items-center gap-4">
          <span className="lowercase">not financial advice</span>
          <a
            href="https://github.com/degenrav100-source/plops"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="github"
            className="text-plops-ink/50 transition-colors hover:text-plops-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .5A12 12 0 0 0 0 12.5a12 12 0 0 0 8.2 11.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.3-1.8-1.3-1.8-1.1-.7 0-.7 0-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2 0-.4-.5-1.6.2-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.6.2 2.8.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 24 12.5 12 12 0 0 0 12 .5z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
