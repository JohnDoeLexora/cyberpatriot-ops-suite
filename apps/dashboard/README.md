# CP Ops dashboard

Paper-white mosaic UI for the CyberPatriot ops catalog.

The Vite dev server mounts the local API (`GET /health`, `GET /ops`, `POST /ops/:id/run`) so **Run** hits the demo or live engines on the same origin. Practice data (`mode: "demo"`) is the default. Live mutations require a confirm step.

If the API is unreachable, demo mode falls back to the browser-safe `@cyberpatriot/ops-engine/demo` fixtures. Live mode will not.

```bash
npm run dev          # from repo root — dashboard + in-process API
npm run dev:api      # standalone API on :8787 if you prefer
```

See the root README for catalog behavior, safety, and tests.
