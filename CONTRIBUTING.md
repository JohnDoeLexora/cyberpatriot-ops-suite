# Contributing

This is a CyberPatriot **team** tool. Keep it defensive and competition-legal. Read [docs/SAFETY.md](docs/SAFETY.md) first.

Need to *use* the app? See the [README](README.md). This page is for adding or editing checks.

## Do not commit secrets

- No `.env` files, API keys, passwords, password hashes, private keys, or `/etc/shadow` dumps.
- No scoring-server URLs, competition write-up answers, or evidence packs that contain real secrets.
- `.env` and `*.local` are gitignored. Keep exports on the image, not in git.

Hashes and private keys must never appear in API output either — the engines already redact them.

## Where things live

| You want to… | Look here |
| --- | --- |
| Add or edit a check (op) | `packages/ops-catalog/src/catalog.ts` |
| Practice-data (demo) output | `packages/ops-engine/src/demo/` |
| Live Linux behavior | `packages/ops-engine/src/linux/` and `engines/linux/*.sh` |
| Live Windows behavior | `engines/windows/<op-id>.ps1` |
| How-to text | `packages/ops-docs/src/guides/` |
| Allowlists | `config/*.txt` |
| Dashboard labels / user table | `apps/dashboard/src/catalog/ops.ts` |

Windows scripts are **not** executed on a Mac or Linux laptop. Review them here; run them on the Windows competition image.

## How to add an op

1. **Catalog** — add a kebab-case id in `packages/ops-catalog/src/catalog.ts` (`title`, category, platforms, risk, description). Mutations are `risk: "mutate"`.
2. **Practice data** — handle the id in `packages/ops-engine/src/demo/runner.ts` so the UI stays clickable on a Mac.
3. **Live Linux** — handle it in `packages/ops-engine/src/linux/runner.ts`. Add `engines/linux/<id>.sh` if teammates should run it without the API.
4. **Live Windows** — add `engines/windows/<id>.ps1` (every catalog id needs a wrapper). You can regenerate stubs with `node engines/windows/generate-wrappers.mjs`. Mutations require `-ConfirmLive`.
5. **How-to** — add a guide in `packages/ops-docs/src/guides/` (one entry per catalog id).
6. **Dashboard (optional)** — run-button label or user-table view in `apps/dashboard/src/catalog/ops.ts`.
7. From the repo root:

```bash
npm run docs
npm test
```

`npm run docs` regenerates [docs/OPS.md](docs/OPS.md) and [docs/howto/](docs/howto/).

Stay inside the rules: authorized image only, no remote attacks, no exploit payloads, no hashes in output.

## Commands

```bash
npm install
npm run dev
npm test
npm run docs
```
