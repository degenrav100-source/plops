import { useEffect, useState } from "react";
import { navigate } from "../hooks/useHashRoute";

const STORAGE_KEY = "plops-welcome-accepted";
const logoSrc = `${import.meta.env.BASE_URL}logo.png`;

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

/** First-visit guide + risk agreement. Shown once per browser, remembered in localStorage. */
export default function WelcomeGate() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      /* private mode: the gate simply shows again next visit */
    }
    setOpen(false);
  };

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

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={accept} className="btn-primary sm:flex-1">
            i understand, enter plops
          </button>
          <button
            type="button"
            onClick={() => {
              accept();
              navigate("#/docs");
            }}
            className="btn-ghost sm:flex-1"
          >
            read the docs first
          </button>
        </div>
      </div>
    </div>
  );
}
