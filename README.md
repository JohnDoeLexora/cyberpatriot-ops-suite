# CyberPatriot Ops Suite

A split-pane dashboard of **defensive** checks for CyberPatriot. Click a check, run it, read the result. How-to guides are built in.

**Competition-legal only.** Use this on an **authorized competition image** — never against other teams, scoring servers, or a computer you are not allowed to harden.

**Read [SAFETY.md](docs/SAFETY.md) before you turn practice data off.**

Public repo: https://github.com/JohnDoeLexora/cyberpatriot-ops-suite

## Share with the team

Send this repo link. Teammates need [Node 20+](https://nodejs.org/). Clone, `npm install`, `npm run dev`, and leave **Practice data** on. Switch to **This computer** only on the competition image, and confirm before anything that changes the box.

## Quick start

```bash
git clone https://github.com/JohnDoeLexora/cyberpatriot-ops-suite.git
cd cyberpatriot-ops-suite
npm install
npm run dev
```

Open the URL Vite prints (http://localhost:5173).

| Where you are | Header toggle | What happens |
| --- | --- | --- |
| Mac or your laptop | **Practice data** (default **ON**) | Fake accounts and services. Nothing on this computer changes. |
| Linux or Windows competition image | **This computer** | Live checks on this box. Anything that **changes** the image asks you to **confirm**. |

**Bend** is optional. On Linux, if `bend` is installed, some file / user / port scoring can run in parallel. If it is missing, the same checks still run. You do not need Bend on a Mac.

## Using the dashboard

- Left list: 130+ checks. Press `/` to search.
- **Round playlists** (Linux starter, Windows starter, Linux deep, Windows deep, Forensics first): pick one, **Run next** or **Run all**. Each step is an existing check with a coach tip and a how-to. Live mutations still ask you to confirm. Nothing talks to CCS.
- **Beginner** (on by default): larger tips, starter checks first, **Show advanced** for the rest. Empty panes suggest a playlist. Turn it off for the full catalog.
- **Edit allowlists**: paste the README user/admin lists (saved in this browser). Download/upload `allowed-users.txt` / `allowed-admins.txt` in the same format as `config/`.
- Click a check to **replace the focused pane** (an empty pane just fills). **Split** or drop on an edge to open another. Two across, then two below (a 2×2). Tabs from the fifth pane.
- **How-to** (or `?`) explains what the check is and why it scores.
- On account panes, hover a row for Flag / Turn off / Turn on / Expire password. Extra columns tuck away on a narrow pane.

Night-of runbook: [docs/TEAM-NIGHT.md](docs/TEAM-NIGHT.md).

More: [docs/SAFETY.md](docs/SAFETY.md) · [docs/TEAM-NIGHT.md](docs/TEAM-NIGHT.md) · [docs/OPS.md](docs/OPS.md) (every check) · [docs/howto/](docs/howto/) · [CONTRIBUTING.md](CONTRIBUTING.md)

## What’s in this repo

| Path | What it is |
| --- | --- |
| `apps/dashboard` | The UI you just started |
| `apps/api` | Local HTTP API the dashboard can call |
| `packages/ops-catalog` | Typed list of every check |
| `packages/ops-engine` | Practice data + live Linux / Windows runners |
| `packages/ops-docs` | How-to text |
| `engines/linux` | Shell scripts for live Linux |
| `engines/windows` | PowerShell for a Windows CyberPatriot image |
| `engines/bend` | Optional parallel scoring on Linux |
| `config/` | Allowlists (users, ports, banned software) |

Edit `config/allowed-users.txt` and `config/allowed-admins.txt` to match **this image’s README** before you trust “flag suspicious users” or “sync authorized users.” Example lists (other teams call these `users.txt` / `admins.txt`) live in `config/examples/`. New accounts are created **without a password** — set one yourself; the tool will not invent one.

Start-of-round: pick a **Round playlist** (or open **Round-start wizard**). Playlists only run existing ops through the engine/API. Mutations still ask you to confirm.

## Other commands

From the repo root (Node 20+):

| Script | What it does |
| --- | --- |
| `npm run dev` | Dashboard + in-process API |
| `npm run dev:api` | Standalone API on http://127.0.0.1:8787 |
| `npm test` | Unit tests |
| `npm run test:e2e` | Playwright against the dashboard |
| `npm run docs` | Regenerate [docs/OPS.md](docs/OPS.md) and [docs/howto/](docs/howto/) |
| `npm run build` | Typecheck + production build |

First-time e2e:

```bash
npx playwright install chromium
npm run test:e2e
```

Default API mode is **demo** (practice data). Live **mutations** require `"confirm": true`. The API never returns password hashes or private keys.

## License

MIT
