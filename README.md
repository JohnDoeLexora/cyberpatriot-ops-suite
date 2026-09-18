# CyberPatriot Ops Suite

Split-pane competition hardening dashboard for CyberPatriot teams. Paper-white UI, wired to the typed catalog and demo/live engines.

**Public repo:** https://github.com/JohnDoeLexora/cyberpatriot-ops-suite

Kosher / competition-legal only — defensive auditing and hardening on **authorized competition images**. Demo/mock mode ships so the UI is fully clickable on macOS without a scoring VM.

## Apps

| Path | Lane | Status |
| --- | --- | --- |
| `apps/dashboard` | cp-01 / cp-03 | Vite + React dashboard: paper-white mosaic, runs `POST /ops/:id/run` |
| `apps/api` | cp-02 | Local HTTP API the dashboard can call (`@cyberpatriot/api`) |
| `packages/ops-catalog` | cp-02 | Typed catalog of 70 CyberPatriot-legal ops |
| `packages/ops-engine` | cp-02 | `demo` / `linux` / `windows` runners + suspicious-user heuristics |
| `packages/ops-docs` | cp-04 | Searchable how-to explainers for every catalog op |

Docs: [docs/OPS.md](docs/OPS.md) (every op) · [docs/howto/](docs/howto/) (how-to explainers) · [docs/SAFETY.md](docs/SAFETY.md) (confirm, demo default, competition-only).

## Quick start

Requires Node 20+.

```bash
npm install
npm test
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).

Same dashboard commands work from `apps/dashboard`.

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dashboard dev server |
| `npm run dev:api` | Local ops API (`http://127.0.0.1:8787`) |
| `npm run build` | Typecheck + production build (all workspaces) |
| `npm test` | Workspace tests (dashboard + catalog + engine) |
| `npm run test:e2e` | Playwright (Chromium) against the dashboard |
| `npm run docs` | Regenerate [docs/OPS.md](docs/OPS.md) and [docs/howto/](docs/howto/) |

First-time e2e:

```bash
npx playwright install chromium
npm run test:e2e
```

API from the repo root:

```bash
npm run dev:api
```

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/health` | Liveness + catalog size |
| `GET` | `/ops` | Full catalog (`?q=&category=&platform=&risk=`) |
| `POST` | `/ops/:id/run` | Body `{ "mode": "demo" \| "live", "params": {}, "confirm": true }` |

Default API mode is **demo** (Mac-safe fixtures). Live **mutations** require `"confirm": true`.

```bash
curl -s http://127.0.0.1:8787/ops | head
curl -s -X POST http://127.0.0.1:8787/ops/flag-suspicious-users/run \
  -H 'content-type: application/json' \
  -d '{"mode":"demo"}'
```

CORS is open for a local dashboard. The API never returns password hashes or private keys.

## What this shell does

- Left **checks list**: the typed 70-op catalog plus team notes. Press `/` to search, `Esc` to close menus.
- Center **mosaic**: open a check into a pane, split, drag, or use the tab strip when several panes are open. Tight widths scroll instead of crushing tables.
- Each pane runs against the **demo** or **live** engine (`POST /ops/:id/run`). Practice data is the default (Mac-safe fixtures). Live mutations ask for confirmation.
- **How to** on a pane (or `?` / header How-to) opens a searchable explainer drawer for every catalog op. Search matches titles and body text.
- Account panes show the engine user inventory. Hover a row for Flag / Turn off / Turn on / Expire password / Details.
- Header **Practice data** toggle defaults **ON**. Switch to **This computer** for live engines.

## Engines

- **demo** — rich deterministic users/services/ports/files (and findings) for UI work
- **linux** — TypeScript collectors + `engines/linux/*.sh` (read-heavy; mutations gated)
- **windows** — `engines/windows/*.ps1` (correct PowerShell; not executed on Linux builders)

Allowlist used by “Flag suspicious users”: `config/allowed-users.txt`.

## License

MIT
