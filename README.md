# CyberPatriot Ops Suite

Split-pane competition hardening dashboard for CyberPatriot teams.

**Public repo:** https://github.com/JohnDoeLexora/cyberpatriot-ops-suite

Kosher / competition-legal only — defensive auditing and hardening on **authorized competition images**. Demo/mock mode ships so the UI is fully clickable on macOS without a scoring VM.

## Apps

| Path | Lane | Status |
| --- | --- | --- |
| `apps/dashboard` | cp-01 dashboard shell | Vite + React + TypeScript + Tailwind |
| `apps/api` | cp-02 | Local HTTP API the dashboard can call (`@cyberpatriot/api`) |
| `packages/ops-catalog` | cp-02 | Typed catalog of 70 CyberPatriot-legal ops |
| `packages/ops-engine` | cp-02 | `demo` / `linux` / `windows` runners + suspicious-user heuristics |

Docs: [docs/OPS.md](docs/OPS.md) (every op) · [docs/SAFETY.md](docs/SAFETY.md) (confirm, demo default, competition-only).

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
| `npm run docs` | Regenerate [docs/OPS.md](docs/OPS.md) from the catalog |

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

- Left **operations catalog**: 50+ searchable, categorized ops. Press `/` to focus search, `Esc` to close menus.
- Center **Cursor-style mosaic**: open an op into a pane, split horizontally/vertically, drag pane title bars (or catalog rows) onto drop zones, close panes. Layout persists in `localStorage`.
- Each pane has title, status (`idle` / `running` / `done` / `error`), Run, and structured mock output.
- **Users & Identity** panes render a live mock account table. Hover a row (or right-click) for Flag / Disable / Enable / Delete / Reset password / View details. Every action toasts and mutates row state via a mock API.
- Header **DEMO** toggle defaults **ON** so Mac users can click everything.

## Engines

- **demo** — rich deterministic users/services/ports/files (and findings) for UI work
- **linux** — TypeScript collectors + `engines/linux/*.sh` (read-heavy; mutations gated)
- **windows** — `engines/windows/*.ps1` (correct PowerShell; not executed on Linux builders)

Allowlist used by “Flag suspicious users”: `config/allowed-users.txt`.

## License

MIT
