# CyberPatriot Ops Suite

Split-pane competition hardening dashboard for CyberPatriot teams.

**Public repo:** https://github.com/JohnDoeLexora/cyberpatriot-ops-suite

Kosher / competition-legal only — defensive auditing and hardening on **authorized competition images**. Demo/mock mode ships so the UI is fully clickable on macOS without a scoring VM.

## Apps

| Path | Lane | Status |
| --- | --- | --- |
| `apps/dashboard` | cp-01 dashboard shell | Vite + React + TypeScript + Tailwind |
| `packages/ops-catalog` | cp-02 | **Not present yet.** Catalog is embedded in the dashboard with a TODO for cp-02 to own the package. |

## Quick start

Requires Node 20+.

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).

Same commands work from `apps/dashboard`.

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm test` | Vitest + Testing Library smokes |
| `npm run test:e2e` | Playwright (Chromium) against the dev server |

First-time e2e:

```bash
npx playwright install chromium
npm run test:e2e
```

## What this shell does

- Left **operations catalog**: 50+ searchable, categorized ops. Press `/` to focus search, `Esc` to close menus.
- Center **Cursor-style mosaic**: open an op into a pane, split horizontally/vertically, drag pane title bars (or catalog rows) onto drop zones, close panes. Layout persists in `localStorage`.
- Each pane has title, status (`idle` / `running` / `done` / `error`), Run, and structured mock output.
- **Users & Identity** panes render a live mock account table. Hover a row (or right-click) for Flag / Disable / Enable / Delete / Reset password / View details. Every action toasts and mutates row state via a mock API.
- Header **DEMO** toggle defaults **ON** so Mac users can click everything.

Real OS engines are out of scope for this lane (cp-02).

## License

MIT
