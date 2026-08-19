import { useEffect, type ReactNode } from "react";
import { CHAINS, type ChainKey } from "../wallet/chains";
import { useLaunch } from "../launch/context";
import { useWallet } from "../wallet/context";
import { goHome, navigate } from "../hooks/useHashRoute";
import AsciiPlops from "./AsciiPlops";

const NAV = [
  { id: "overview", label: "overview" },
  { id: "deploy", label: "how to deploy" },
  { id: "curve", label: "bonding curve" },
  { id: "trade", label: "buying & selling" },
  { id: "nfts", label: "plops genesis nfts" },
  { id: "networks", label: "networks" },
  { id: "contract", label: "contract" },
  { id: "faq", label: "faq" },
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-b border-plops-edge px-5 py-6 last:border-b-0 md:px-7">
      <h2 className="text-lg font-bold lowercase tracking-tight text-plops-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-plops-ink/70">{children}</div>
    </section>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-plops-accent text-xs font-bold text-plops-accent">
        {n}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold lowercase text-plops-ink">{title}</span>
        <span className="mt-1 block text-sm text-plops-ink/70">{children}</span>
      </span>
    </li>
  );
}

function ChainTable({ chainKey }: { chainKey: ChainKey }) {
  const c = CHAINS[chainKey];
  const rows: [string, string][] = [
    ["network name", c.chainName],
    ["chain id", `${c.chainIdDec} (${c.chainIdHex})`],
    ["currency", c.nativeCurrency.symbol],
    ["rpc url", c.rpcUrls[0]],
    ["explorer", c.blockExplorerUrls[0]],
  ];
  return (
    <div className="overflow-hidden rounded-lg border border-plops-edge">
      <div className="border-b border-plops-edge bg-plops-muted px-3 py-2 text-xs font-semibold uppercase tracking-wider text-plops-ink/60">
        {c.short}
      </div>
      <dl className="divide-y divide-plops-edge text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <dt className="text-plops-ink/50">{k}</dt>
            <dd className="break-all text-plops-ink/85 sm:text-right">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function Docs({ section }: { section: string | null }) {
  const { openLaunch } = useLaunch();
  const { connection, openModal } = useWallet();

  useEffect(() => {
    if (!section) {
      window.scrollTo({ top: 0 });
      return;
    }
    const el = document.getElementById(section);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0 });
  }, [section]);

  return (
    <div className="section grid gap-4 py-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      {/* left — doc nav */}
      <aside className="order-2 h-max rounded-xl border border-plops-edge bg-plops-surface lg:sticky lg:top-20 lg:order-1">
        <div className="flex items-center justify-between border-b border-plops-edge px-3 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-plops-ink/50">docs</span>
          <AsciiPlops cols={14} rows={7} speed={0.8} className="text-plops-ink/60" style={{ fontSize: "4px" }} />
        </div>
        <nav className="flex flex-col p-1">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(`#/docs/${item.id}`)}
              className="rounded-md px-2.5 py-2 text-left text-sm lowercase text-plops-ink/60 transition-colors hover:bg-plops-muted hover:text-plops-ink"
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => goHome("tokens")}
            className="mt-1 rounded-md border-t border-plops-edge px-2.5 py-2 text-left text-sm lowercase text-plops-ink/60 transition-colors hover:bg-plops-muted hover:text-plops-ink"
          >
            ← back to launchpad
          </button>
        </nav>
      </aside>

      {/* right — content */}
      <main className="order-1 min-w-0 rounded-xl border border-plops-edge bg-plops-surface lg:order-2">
        <header className="border-b border-plops-edge px-5 py-6 md:px-7">
          <span className="text-xs uppercase tracking-wider text-plops-ink/45">documentation</span>
          <h1 className="mt-1 text-2xl font-bold lowercase tracking-tight text-plops-ink md:text-3xl">
            build and trade on plops
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-plops-ink/65">
            plops turns an idea into a tradable coin in one transaction. Every token carries its own
            market on the Robinhood Chain, and it all runs from your wallet — plops never holds your
            keys, your tokens or your ETH.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => openLaunch("create")} className="btn-primary">
              open launch studio
            </button>
            {!connection && (
              <button type="button" onClick={openModal} className="btn-ghost">
                connect wallet
              </button>
            )}
          </div>
        </header>

        <Section id="overview" title="overview">
          <p>
            A plops token is a single contract that is both the ERC-20 and its own market maker. The
            full supply (1,000,000,000 tokens) is minted to the contract at deployment and can only
            leave it through the curve, so there is no team allocation to rug and no separate pool to
            drain.
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>non-custodial: the contract holds the reserve, nobody can withdraw it</li>
            <li>pairs: native ETH, or a tokenized stock (RWA) on Robinhood Chain</li>
            <li>audited base: OpenZeppelin <code>ERC20</code> + <code>ReentrancyGuard</code></li>
            <li>metadata on-chain: description, image URI, twitter, telegram, website</li>
            <li>1% fee per trade, paid to the token creator</li>
          </ul>
        </Section>

        <Section id="deploy" title="how to deploy a token">
          <ol className="space-y-4">
            <Step n={1} title="connect a wallet">
              Tap <span className="text-plops-ink">connect wallet</span> top-right. 21 wallets are
              supported, plus any other injected one. Never a seed phrase.
            </Step>
            <Step n={2} title="fund it with eth">
              A little for gas, plus whatever you want to spend on the first buy. New here? Use{" "}
              <span className="text-plops-ink">testnet</span>.
            </Step>
            <Step n={3} title="fill in the coin">
              <span className="text-plops-ink">create</span> → name, ticker, pitch, image, socials.
              All of it is stored on-chain.
            </Step>
            <Step n={4} title="choose the pair">
              <span className="text-plops-ink">ETH</span>, or a tokenized stock on Robinhood Chain
              (AAPL, TSLA, NVDA, SPY…). The pair is what your coin trades against on the curve.
            </Step>
            <Step n={5} title="pick your first buy">
              A preset or a custom amount in the pair asset — it buys on the curve at launch, so you
              are holder #1. Optional.
            </Step>
            <Step n={6} title="sign it">
              plops switches the network if needed; you sign the launch. ETH pairs are one
              transaction; stock pairs add a one-off ERC-20 approval for the amount you spend.
            </Step>
            <Step n={7} title="share the address">
              You get the contract address and an explorer link. Anyone can paste it into search or{" "}
              <span className="text-plops-ink">trade</span> and start buying.
            </Step>
          </ol>
          <p className="text-xs text-plops-ink/50">
            You pay gas on the selected network. plops charges nothing.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" onClick={() => openLaunch("create")} className="btn-primary">
              create a token now
            </button>
            <button type="button" onClick={() => openLaunch("trade")} className="btn-ghost">
              open trade panel
            </button>
          </div>
        </Section>

        <Section id="curve" title="how the bonding curve works">
          <p>
            The contract keeps a virtual ETH reserve of 1 ETH plus every ETH that has been paid in,
            and a token reserve holding the unsold supply. Price is simply the ratio of the two
            reserves, so each buy pushes the price up and each sell pushes it back down along the same
            curve.
          </p>
          <pre className="overflow-x-auto rounded-lg border border-plops-edge bg-plops-muted p-3 text-xs text-plops-ink/80">{`tokensOut = tokenReserve * ethIn  / (ethReserve + ethIn)
ethOut    = ethReserve   * tokensIn / (tokenReserve + tokensIn)
price     = ethReserve / tokenReserve`}</pre>
          <p>
            Reserves are tracked explicitly instead of being derived from balances, so rounding can
            never leave the contract insolvent. A slippage guard (minimum tokens out / minimum ETH
            out) is included in every trade.
          </p>
        </Section>

        <Section id="trade" title="buying and selling">
          <ul className="list-inside list-disc space-y-1">
            <li>
              open <span className="text-plops-ink">trade</span>, paste a token address (or click a
              token in the market list) and the panel loads price, liquidity and your balance on-chain
            </li>
            <li>buying sends ETH to the contract and returns tokens in the same transaction</li>
            <li>
              selling needs no separate approval — the token contract moves its own units, so one
              wallet confirmation is enough
            </li>
            <li>1% of every trade goes to the creator; the rest stays in the curve</li>
          </ul>
        </Section>

        <Section id="nfts" title="plops genesis nfts">
          <p>
            1500 pixel plops, 0.01 ETH each, max 10 per transaction. <code>PlopsNFT</code> is an
            OpenZeppelin ERC-721 with an ERC-2981 royalty of 5%.
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              artwork and metadata are generated inside the contract — no IPFS pin and no server to
              keep alive
            </li>
            <li>
              traits come from <code>keccak256(collection, tokenId)</code>: fixed at deploy, the same
              for everyone, and viewable before you mint — there is no reveal
            </li>
            <li>
              OpenSea supports Robinhood Chain, so a mint is listed there automatically with floor
              price, offers and rarity
            </li>
            <li>
              open <span className="text-plops-ink">nfts</span> in the menu to mint
            </li>
          </ul>
        </Section>

        <Section id="networks" title="networks">
          <p>
            plops runs on the Robinhood Chain. The launch studio can add either network to your wallet
            automatically, or you can add them manually with these parameters:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <ChainTable chainKey="mainnet" />
            <ChainTable chainKey="testnet" />
          </div>
        </Section>

        <Section id="contract" title="the contract">
          <p>
            <code>PlopsBondingToken</code> is written in Solidity 0.8.24 and extends OpenZeppelin's
            audited <code>ERC20</code> and <code>ReentrancyGuard</code>. Key facts:
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>total supply 1,000,000,000, minted once to the contract itself</li>
            <li>virtual ETH reserve of 1 ETH seeds the starting price</li>
            <li>trading fee 1% (100 bps), paid to the creator on buys and sells</li>
            <li>no owner withdrawal function — the reserve can only leave through a sell</li>
            <li>metadata (description, image, socials) is stored on-chain at deployment</li>
          </ul>
          <p className="text-xs text-plops-ink/50">
            Deployed tokens are yours: plops never becomes an owner, admin or fee recipient.
          </p>
        </Section>

        <Section id="faq" title="faq">
          <p className="font-semibold text-plops-ink">Does plops hold my funds?</p>
          <p>
            No. The site is a static frontend; keys stay in your wallet and ETH stays in the token
            contract.
          </p>
          <p className="font-semibold text-plops-ink">Where is the token list stored?</p>
          <p>
            Tokens you deploy or open are remembered in your browser (localStorage). There is no
            global index yet, so the market list shows what this browser knows about.
          </p>
          <p className="font-semibold text-plops-ink">Can I upload an image file?</p>
          <p>
            Yes, if you paste a Pinata JWT into the launch studio it pins the file to IPFS and stores
            the resulting URI. Otherwise paste any image URL.
          </p>
          <p className="font-semibold text-plops-ink">Is this financial advice?</p>
          <p>No. Bonding-curve tokens are volatile and you can lose everything you put in.</p>
        </Section>
      </main>
    </div>
  );
}
