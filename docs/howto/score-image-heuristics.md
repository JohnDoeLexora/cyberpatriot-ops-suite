# Score image heuristics

- **Catalog id:** `score-image-heuristics`
- **Category:** evidence
- **Platforms:** both
- **Risk:** read

> A 0–100 remaining-work index with drill-down — not the official CCS score.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Aggregates suspicion across users, services, ports, and files. Higher means more left to harden. Dashboard headline with drill-down findings. Heuristic only — not the official CCS score.

## Why it scores in CyberPatriot

It does not score you on CCS. It helps the team pick the next fire. Treating it as the scoreboard is a mistake.

## When to run it

Anytime you need a single number for huddle, plus at the end to sanity-check leftovers.

## Step-by-step

1. Run the op. Read top drivers (UID 0, port 31337, telnet, empty Guest) not just the integer.
2. Work those drivers with the matching ops.
3. Re-run; the remaining-work index should fall. If it does not, you fixed the wrong thing.

## What “good” looks like

- Top drivers match what you already found in specialized ops.
- Number trending down after real fixes.

## Risks / confirm notes

- Read-only heuristic. Not CCS. Not a scoring-server client.
- Do not optimize the number by hiding logs or deleting evidence.

## Related ops

- [`one-click-hardening-checklist`](./one-click-hardening-checklist.md) — One-click hardening checklist
- [`flag-suspicious-users`](./flag-suspicious-users.md) — Flag suspicious users
- [`audit-listening-ports`](./audit-listening-ports.md) — Audit listening ports
- [`export-evidence-bundle`](./export-evidence-bundle.md) — Export evidence bundle

