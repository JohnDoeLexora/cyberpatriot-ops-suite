# Export evidence bundle

- **Catalog id:** `export-evidence-bundle`
- **Category:** evidence
- **Platforms:** both
- **Risk:** read

> One-click redacted evidence pack for notes and forensics write-ups.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Assembles a redacted local pack: user inventory (no hashes), listeners, services, firewall state, checksums of sshd_config/sudoers/hosts, plus a notes.md snippet. Never copies shadow hashes, private keys, or off-image data.

## Why it scores in CyberPatriot

Forensics questions and team handoff need artifacts. A redacted bundle is faster than screenshots and stays inside the rules.

## When to run it

After major passes (users, firewall, files) and before you submit forensics answers. Also at the end of the round.

## Step-by-step

1. Run the op in demo or live read mode — it does not mutate.
2. Skim the bundle: counts, top findings, checksums.
3. Copy only what you need into the forensics notepad. Do not add shadow or id_rsa files by hand.

## What “good” looks like

- Bundle contains inventories and checksums, not secrets.
- notes.md snippet is something you could show a coach.

## Risks / confirm notes

- Read-only. Still: do not zip private keys into the pack.
- Not off-image exfiltration and not a scoring-server upload.

## Related ops

- [`one-click-hardening-checklist`](./one-click-hardening-checklist.md) — One-click hardening checklist
- [`score-image-heuristics`](./score-image-heuristics.md) — Score image heuristics
- [`list-users`](./list-users.md) — List local users
- [`audit-listening-ports`](./audit-listening-ports.md) — Audit listening ports

