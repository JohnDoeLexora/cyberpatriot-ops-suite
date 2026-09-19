# Round-start wizard

- **Catalog id:** `round-start-wizard`
- **Category:** evidence
- **Platforms:** both
- **Risk:** read

> Sequenced first-minutes guide: forensics → users → passwords → firewall → updates → prohibited software.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Read-only checklist that points at existing ops in a sensible order. It does not run the mutate ops and does not contact the CCS. Use it as the one-click huddle at T+0.

## Why it scores in CyberPatriot

Other kits ship a giant .bat that does everything at once (and sometimes cheats). We sequence the legal work so the team does not forget forensics or the firewall while hunting SUID.

## When to run it

First five minutes, and again whenever the huddle needs a next step.

## Step-by-step

1. Run this op (demo or live read). Sort fail/warn first.
2. Open each related op in order: skim-forensics-readme, sync-authorized-users, enforce-password-policy, enable-firewall, apply-security-updates, find-prohibited-software.
3. Mutations still need confirm:true on those ops. Re-run the wizard; remaining fails should shrink.

## What “good” looks like

- Six sequenced rows, each with a related catalog id.
- ccsContacted is false.

## Risks / confirm notes

- Read-only. It will not disable users or enable the firewall for you.
- Not the official scoreboard. Do not query scoring endpoints.

## Related ops

- [`skim-forensics-readme`](./skim-forensics-readme.md) — Skim local README for forensics keywords
- [`sync-authorized-users`](./sync-authorized-users.md) — Sync users from allowlists
- [`enforce-password-policy`](./enforce-password-policy.md) — Enforce password policy
- [`enable-firewall`](./enable-firewall.md) — Enable host firewall
- [`one-click-hardening-checklist`](./one-click-hardening-checklist.md) — One-click hardening checklist

