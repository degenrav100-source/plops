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
- The `eth_chainId` the mock returns decides which network the app selects, so it also decides what
  chain-dependent labels say (e.g. the create CTA becomes `launch on mainnet` vs `launch on testnet`).
  Return `0x1237` (mainnet) or `0xb626` (testnet) to test a specific one, and flip the mainnet/testnet
  chips in the launch studio to prove the label is live state rather than static text.
- `context.addInitScript(...)` does **not** survive `browser.close()` over CDP — prefer `page.evaluate`
  on the live page, or keep the connection open if you need it on reload.
- After injecting, the modal's MetaMask entry changes from "Install" to a connectable state; clicking
  it connects and the navbar shows the shortened address.

### Testing real transactions (deploy / launch / buy / sell) without a funded wallet
The mock above cannot sign, so it only proves the flow up to "confirm in your wallet". To exercise the
whole chain path end to end, run a local node and make the mock a *forwarding* provider — the node's
accounts are unlocked, so `eth_sendTransaction` just works:

1. `cd contracts && npx hardhat node` (chainId 31337, RPC `http://127.0.0.1:8545`).
2. Temporarily point the testnet entry of `src/wallet/chains.ts` at it (`chainIdHex: "0x7a69"`,
   `chainIdDec: 31337`, `rpcUrls: ["http://127.0.0.1:8545"]`), `npm run build`, preview on a spare
   port. **Restore `chains.ts` before committing.**
3. In the injected provider, forward every unknown method to the node over `fetch`, answer
   `eth_requestAccounts`/`eth_accounts` with one hardhat account, and return `null` for
   `wallet_switchEthereumChain`/`wallet_addEthereumChain`.
4. Use a *different* hardhat account per persona (deployer of the index, launcher, trader) and clear
   `localStorage` between personas to prove global discovery instead of local registry echo.

## Testing copy / branding changes
A copy PR is easy to "verify" with a screenshot that would look the same if it were broken, so make
the assertions measurable:
- Count the removed wording in the rendered text, not just the added wording:
  `document.body.innerText.match(/OpenZeppelin/gi)?.length` must be `0`.
- For "shorten this text", assert lengths: per-step body char counts and total section length, with
  the old numbers as the baseline (steps went 230–330 → 75–112 chars, section ≈1800 → 818).
- For theme-adaptive images (footer/header logo uses a CSS `brightness/invert` filter), a DOM check
  only proves the `img` loaded (`naturalWidth > 0`). Whether it is *visible* in each theme is a pixel
  question — take a zoomed screenshot of the footer in dark **and** light.
- For state-dependent labels, capture both states (before connect / after connect); a single
  screenshot cannot distinguish a live label from a hardcoded one.

## Attacker-controlled token metadata
Token description/image/socials are stored on-chain by whoever deploys the token, so treat them as
untrusted in the trade panel. `toExternalUrl` in `src/lib/format.ts` must only produce `http(s)` URLs
(scheme-less input gets `https://` prepended, anything else returns `""` so no link renders) —
otherwise `javascript:`/`data:` ends up in an `href`. This path cannot be reached in the UI without a
real deployed token, so verify it as a pure function and, if you want evidence about the artifact you
actually tested, grep the built bundle in `dist/assets/index-*.js` for the guard. Report it as
"untested in the UI" rather than implying it was clicked through.

## Viewport limits when testing mobile
Chrome on this box refuses to go narrower than ~490px CSS width even with
`wmctrl -r :ACTIVE: -e 0,0,0,430,1000`, so "mobile" screenshots land around 492px. That is still below
the `sm` breakpoint (mobile header + stacked layout), but say so in the report instead of claiming
390px. Re-maximize afterwards with
`wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz`. Overflow assertion:
`document.documentElement.scrollWidth === document.documentElement.clientWidth`.

## Key UI paths
- Header (nav, search, connect, create): `src/components/Navbar.tsx`
- Main terminal layout (markets · token table · positions): `src/components/Terminal.tsx`
- Wallet modal: `src/components/WalletModal.tsx`
- Launch studio (create/trade): `src/launch/LaunchTokenModal.tsx`, `src/launch/CreatePanel.tsx`, `src/launch/TradePanel.tsx`
- Theme toggle (drives logo color via CSS filter): `src/components/ThemeToggle.tsx`, `src/components/Logo.tsx`
- Hero copy: `src/components/HeroBanner.tsx`; footer logo: `src/components/Footer.tsx`; docs and
  how-to-deploy (`#/docs`, `#/docs/deploy`): `src/components/Docs.tsx`

## Devin Secrets Needed
None. Everything above runs against a local preview with a mock wallet. Real deploy/buy/sell need the
user's own funded wallet on the Robinhood Chain and cannot be automated here — never ask for a
private key or seed phrase.
