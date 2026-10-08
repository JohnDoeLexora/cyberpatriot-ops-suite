# Scoreboard preflight checklist

- **Catalog id:** `scoreboard-preflight`
- **Category:** evidence
- **Platforms:** both
- **Risk:** read

> Local pre-round checklist: firewall, guest, time, logging, telnet, allowlist, ports.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Pre-competition local checklist covering firewall, guest, time sync, logging, no telnet, allowlist users, and expected ports. Explicitly does not contact the CCS scoring server, other teams, or the internet beyond the image’s configured update/time sources. Pair failing rows with confirm:true mutate ops.

## Why it scores in CyberPatriot

These are the first-hour misses that cost easy points. The checklist is a huddle tool, not a way to query or game the official scoreboard.

## What it changes

Nothing - read-only audit

## How to undo

Nothing to undo

## When to run it

Start of the round, and after any big mutate batch before you walk away.

## Step-by-step

1. Run the op. Sort fail rows first.
2. Open the linked mutate/read op from each failing row and follow that how-to (confirm:true on live mutates).
3. Re-run. Do not point this tool at scoring URLs — it will not, and you must not.
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: Firewall on, Guest off, telnet gone, time in sync, logging up.

## What “good” looks like

- Firewall on, Guest off, telnet gone, time in sync, logging up.
- Allowlist users match the README; expected ports present.
- No attempt to reach CCS or other teams.

## Risks / confirm notes

- Read-only. Fixes still need confirm:true on the mutate ops.
- Not the official scoreboard. Do not query scoring endpoints or other images.
- Common mistake: treating this read-only result as already fixed, or changing the computer before the findings are copied into Team notes.

## Related ops

- [`one-click-hardening-checklist`](./one-click-hardening-checklist.md) — One-click hardening checklist
- [`audit-firewall`](./audit-firewall.md) — Audit host firewall
- [`disable-guest-account`](./disable-guest-account.md) — Disable Guest account
- [`diff-expected-ports`](./diff-expected-ports.md) — Diff listeners vs expected ports

