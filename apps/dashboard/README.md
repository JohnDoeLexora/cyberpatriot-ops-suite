# Dashboard

Paper-white mosaic UI for the CyberPatriot checks catalog.

Start it from the **repo root**:

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

Leave **Practice data** on (Mac-safe fixtures — this computer is not changed). On a competition image, switch the header to **This computer**. Changes that alter the box ask you to confirm.

**Beginner** is on by default: larger coach tips, starter checks first, and an empty-pane playlist suggestion. **Round playlists** run existing catalog ops in order (**Run next** / **Run all**); live mutations still confirm. **Edit allowlists** stores README user/admin lists in this browser and can download/upload `allowed-users.txt` / `allowed-admins.txt`.

**Read [SAFETY.md](../../docs/SAFETY.md) before live mode.**

The Vite dev server mounts the local API (`GET /health`, `GET /ops`, `POST /ops/:id/run`) so **Run** hits practice or live engines on the same origin. If the API is unreachable, practice data still falls back to in-browser fixtures. Live mode will not.

How-to explainers open from the pane **How to** button, the header **How-to** control, or `?`. Markdown copies live in [`docs/howto/`](../../docs/howto/).

```bash
npm run dev:api      # standalone API on :8787 if you prefer
```

Catalog, safety, and how to add a check: root [README](../../README.md) and [CONTRIBUTING.md](../../CONTRIBUTING.md).
