---
name: testing-plops-ui
description: Build, preview, and test the plops launchpad UI locally (theme toggle, logo, launch filters, FAQ). Use when verifying frontend/UI changes before merge.
---

# Testing the plops launchpad UI

Vite + React + TS + Tailwind (v3) single-page launchpad. Deployed to GitHub Pages under `/plops/`.

## Build & preview locally
```bash
npm install
npm run lint          # oxlint
npm run build         # tsc -b && vite build
npm run preview -- --port 4173 --host
```
Because `vite.config.ts` sets `base: "/plops/"`, the preview URL is `http://localhost:4173/plops/` (NOT the bare root — the root returns 404/blank).

## Gotchas
- **Native binding errors** (`Cannot find native binding`) on lint/build are an npm optional-deps bug. Fix: `npm i --no-save @rolldown/binding-linux-x64-gnu @oxlint/binding-linux-x64-gnu`.
- **Custom Tailwind color tokens are nested under `plops`** (e.g. `plops.surface`, `plops.edge`, `plops.ink`), so the classes are `bg-plops-surface`, `border-plops-edge`, etc. Using `bg-surface`/`border-edge` in `@apply` fails the build with "class does not exist". Always prefix with `plops-`.
- Node 20.18 warns it's below Vite's recommended 20.19+, but the build still succeeds.

## Theme toggle (dark/light)
- `darkMode: "class"` in Tailwind; theme tokens are CSS variables in `src/index.css` toggled by the `.dark` class on `<html>`.
- `src/hooks/useTheme.ts` persists choice in `localStorage` key `plops-theme` (defaults to **dark**). An inline script in `index.html` applies the class before paint to avoid a flash.
- Toggle button is `src/components/ThemeToggle.tsx` (🌙/☀️) in the navbar (`src/components/Navbar.tsx`), both desktop and mobile.
- To test a fresh default state, clear `localStorage` (key `plops-theme`) and reload — it should default to dark.

## Key UI test flows
1. **Theme**: fresh load = dark (🌙); click toggle → light pastel (☀️); reload → theme persists with no flash.
2. **Logo**: `public/logo.png` (transparent) rendered top-left via `import.meta.env.BASE_URL`; verify no black box behind it.
3. **Launch filters** (`src/components/Launches.tsx`): All/Live/Upcoming/Ended filter the cards.
4. **FAQ accordion** (`src/components/FAQ.tsx`): single-open behavior.

## Devin Secrets Needed
None — the app is frontend-only with mock data (`src/data.ts`). No login, API keys, or backend required.
