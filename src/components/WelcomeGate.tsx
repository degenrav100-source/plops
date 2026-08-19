import { useEffect, useState } from "react";

const logoSrc = `${import.meta.env.BASE_URL}logo.png`;
const docsHref = `${import.meta.env.BASE_URL}#/docs`;

const steps = [
  {
    title: "connect your wallet",
    body: "top-right. plops never sees your keys, your seed phrase or your funds.",
  },
  {
    title: "launch or trade",
    body: "create mints an ERC-20 with its own bonding curve; trade buys and sells on that curve.",
  },
  {
    title: "you sign everything",
    body: "every launch and every trade is a transaction you approve on the Robinhood Chain.",
  },
];

/**
 * Guide + terms agreement. Shown on every visit, never remembered away — except on the docs
 * route, which stays readable so "read the docs first" is not gated by the gate itself.
 */
export default function WelcomeGate() {
  const [open, setOpen] = useState(true);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-plops-edge bg-plops-surface p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <img
            src={logoSrc}
            alt=""
            className="h-9 w-9 shrink-0 object-contain [filter:brightness(0)] dark:[filter:brightness(0)_invert(1)]"
          />
          <div>
            <h2 id="welcome-title" className="text-base font-bold lowercase tracking-tight text-plops-ink">
              welcome to plops
            </h2>
            <p className="text-xs text-plops-ink/55">
              non-custodial launchpad on the robinhood chain
            </p>
          </div>
        </div>

        <ol className="mt-5 space-y-3">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-plops-edge text-[11px] text-plops-ink/60">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold lowercase text-plops-ink">
                  {step.title}
                </span>
                <span className="block text-xs text-plops-ink/60">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>

        <p className="mt-5 rounded-lg border border-plops-edge bg-plops-muted px-3 py-3 text-xs text-plops-ink/65">
          Bonding-curve tokens are volatile and anyone can launch one — plops does not review, endorse
          or guarantee any coin listed here. You can lose everything you put in. Nothing on this site
          is financial advice.
        </p>

        <label className="mt-4 flex cursor-pointer items-start gap-2 text-xs text-plops-ink/70">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-plops-accent"
          />
          <span>
            I have read and agree to these terms: plops is non-custodial software, I am responsible
            for every transaction I sign, and I accept the risk of total loss.
          </span>
        </label>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={!agreed}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
          >
            {agreed ? "enter plops" : "agree to the terms to continue"}
          </button>
          <a
            href={docsHref}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost text-center sm:flex-1"
          >
            read the docs first
          </a>
        </div>
      </div>
    </div>
  );
}
