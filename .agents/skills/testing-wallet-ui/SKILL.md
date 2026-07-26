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
- Return a chain id the app knows (`0x1237` mainnet / `0xb626` testnet) if you want the launch studio's
  network tabs to follow the wallet; an unknown id leaves the selector on its default.
- `context.addInitScript(...)` does **not** survive `browser.close()` over CDP — prefer `page.evaluate`
  on the live page, or keep the connection open if you need it on reload.
- The injection is lost on every reload (e.g. after a theme-persistence `F5`), so **re-run the inject
  script after each reload** before testing wallet-gated UI.
- `localStorage["plops-last-wallet"]` makes the app eagerly reconnect as soon as the provider is
  announced. If you want to see the wallet modal, click the address chip → `disconnect` first,
  otherwise clicking the header button just opens the copy/disconnect dropdown.
- After injecting, the modal's MetaMask entry changes from "Install" to a connectable state; clicking
  it connects and the navbar shows the shortened address.

## Mobile-viewport testing without devtools
Resize the real Chrome window instead of opening devtools (cleaner in a recording):

```bash
wmctrl -r :ACTIVE: -b remove,maximized_vert,maximized_horz
xdotool getactivewindow windowsize 420 820
# restore later:
wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz
```

## Gotchas worth re-testing after UI changes
- **Modal props vs. `useState` initial values.** `LaunchTokenModal` copies the requested token address
  into state inside a `useEffect`, and `if (!isOpen) return null` unmounts its children — so a child
  that does `useState(initialAddress ?? "")` mounts before the address arrives and silently ignores it.
  `TradePanel` had this bug: opening trade from search or a table `trade` button left the address input
  empty. Always assert the input is **prefilled and attempts a load**, not just that the tab switched.
- **Mobile menu must close on every action.** Each mobile menu handler needs `setOpen(false)`; the
  address branch of the search handler once missed it and the menu stayed expanded behind the modal.
- Loading a non-plops address shows an ethers `BAD_DATA / could not decode result data` error. That is
  the expected honest response and is useful proof that a real RPC read happened.

## Key UI paths
- Header (nav, search, connect, create): `src/components/Navbar.tsx`
- Main terminal layout (markets · token table · positions): `src/components/Terminal.tsx`
- Wallet modal: `src/components/WalletModal.tsx`
- Launch studio (create/trade): `src/launch/LaunchTokenModal.tsx`, `src/launch/CreatePanel.tsx`, `src/launch/TradePanel.tsx`
- Theme toggle (drives logo color via CSS filter): `src/components/ThemeToggle.tsx`, `src/components/Logo.tsx`
