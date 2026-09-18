# `@cyberpatriot/ops-docs`

Searchable how-to guides for every id in `@cyberpatriot/ops-catalog`.

Each guide covers:

- What it is
- Why it scores in CyberPatriot
- When to run it
- Step-by-step (normie-friendly)
- What “good” looks like
- Risks / confirm notes for mutations
- Related ops

Markdown copies live in [`docs/howto/`](../../docs/howto/). The dashboard How-to drawer imports this package and searches **titles + bodies**.

```bash
npm test -w @cyberpatriot/ops-docs
npm run docs -w @cyberpatriot/ops-docs
```
