---
name: testing-wallet-ui
description: How to run and UI-test the plops launchpad locally, including simulating a wallet for the Connect Wallet flow when no browser extension is installed.
---

# Testing the plops launchpad UI

## Run locally
- Install: `npm install`
- Lint: `npm run lint` (oxlint)
- Build: `npm run build`
- Dev server: `npm run dev`
- Production preview (what to test against): `npm run build && npm run preview -- --port 4173`
  then open **`http://localhost:4173/plops/`** (note the `/plops/` base path — the Vite base is
  set to `/plops/` for GitHub Pages, so the root `/` will 404).

If lint/build fail with "Cannot find native binding", install the platform binaries:
`npm i --no-save @rolldown/binding-linux-x64-gnu @oxlint/binding-linux-x64-gnu`

## Wallet connect flow
The wallet UI uses **EIP-6963** discovery + **EIP-1193** (`eth_requestAccounts`) — see
`src/wallet/WalletProvider.tsx`. It is non-custodial: it never asks for keys/seed phrases and
shows an honest "Install" state (opening the wallet's install page) for undetected wallets.

### Simulating a wallet when no extension is installed
The test machine has no wallet extension, so injected a **mock EIP-6963 provider** to exercise the
real connect code path. Attach Playwright to the already-running Chrome over CDP
(`http://localhost:29229`) and `page.evaluate` an announce on the live page (React's listener is
already mounted, so no reload is needed):

```js
// npm i --no-save playwright-core
import { chromium } from "playwright-core";
const browser = await chromium.connectOverCDP("http://localhost:29229");
const ctx = browser.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes("/plops/")) ?? ctx.pages()[0];
await page.evaluate(() => {
  const address = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
  const provider = {
    isMetaMask: true,
    request: async ({ method }) =>
      method === "eth_chainId" ? "0x1" : [address], // eth_requestAccounts / eth_accounts
    on: () => {}, removeListener: () => {},
  };
  const info = { uuid: "mock", name: "MetaMask", rdns: "io.metamask", icon: "data:," };
  const announce = () => window.dispatchEvent(new CustomEvent("eip6963:announceProvider",
    { detail: Object.freeze({ info, provider }) }));
  window.addEventListener("eip6963:requestProvider", announce);
  window.ethereum = provider; announce();
});
await browser.close();
```

Notes:
- Match the mock's `rdns` (e.g. `io.metamask`) to a curated wallet in `src/wallet/wallets.ts` so the
  app shows that wallet's real bundled logo.
- `context.addInitScript(...)` does **not** survive `browser.close()` over CDP — prefer `page.evaluate`
  on the live page, or keep the connection open if you need it on reload.
- After injecting, the modal's MetaMask entry changes from "Install" to a connectable state; clicking
  it connects and the navbar shows the shortened address.

## Key UI paths
- Connect wallet button + Launch App: `src/components/Navbar.tsx`
- Wallet modal: `src/components/WalletModal.tsx`
- Launch card Join/Remind/View actions + toasts: `src/components/Launches.tsx`
- Theme toggle (drives logo color via CSS filter): `src/components/ThemeToggle.tsx`, `src/components/Logo.tsx`
