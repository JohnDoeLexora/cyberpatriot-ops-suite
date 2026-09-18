# One-click hardening checklist

- **Catalog id:** `one-click-hardening-checklist`
- **Category:** evidence
- **Platforms:** both
- **Risk:** read

> Read-only dashboard of pass/fail/warn rows pointing at the fix ops.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Covers users, admins, guest, password policy, firewall, telnet/ftp, listening ports, prohibited software, media, SSH/UAC. Each row points at the mutate op to fix it. Does not change the image.

## Why it scores in CyberPatriot

This is the ‘what is left’ view so the team does not forget Guest or the firewall while hunting SUID. It is not a CCS cheat.

## When to run it

Start of the round (baseline), whenever you need a huddle, and near the end.

## Step-by-step

1. Run the op. Sort fail/warn first.
2. Open the linked mutate/read op from each failing row and follow that how-to.
3. Re-run the checklist; remaining fails should shrink.

## What “good” looks like

- Required services still pass.
- Guest, firewall, telnet, extra admins go green after their mutate ops.

## Risks / confirm notes

- Read-only. Fixes still need confirm:true on the mutate ops.
- Not the official scoreboard. Do not query scoring endpoints.

## Related ops

- [`score-image-heuristics`](./score-image-heuristics.md) — Score image heuristics
- [`flag-suspicious-users`](./flag-suspicious-users.md) — Flag suspicious users
- [`audit-firewall`](./audit-firewall.md) — Audit host firewall
- [`disable-guest-account`](./disable-guest-account.md) — Disable Guest account

