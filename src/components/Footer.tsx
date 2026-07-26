import { CHAINS } from "../wallet/chains";
import { navigate } from "../hooks/useHashRoute";

export default function Footer() {
  return (
    <footer className="mt-4 border-t border-plops-edge">
      <div className="section flex flex-col items-center justify-between gap-2 py-4 text-xs text-plops-ink/50 sm:flex-row">
        <p className="lowercase">
          <span className="font-semibold text-plops-ink/70">plops</span> · non-custodial launchpad on
          the robinhood chain
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => navigate("#/docs/deploy")}
            className="lowercase transition-colors hover:text-plops-ink"
          >
            how to deploy
          </button>
          <button
            type="button"
            onClick={() => navigate("#/docs")}
            className="lowercase transition-colors hover:text-plops-ink"
          >
            docs
          </button>
          <a
            href={CHAINS.mainnet.blockExplorerUrls[0]}
            target="_blank"
            rel="noopener noreferrer"
            className="lowercase transition-colors hover:text-plops-ink"
          >
            explorer
          </a>
          <span className="lowercase">not financial advice</span>
        </div>
      </div>
    </footer>
  );
}
