# Set UFW logging high and verify defaults

- **Catalog id:** `set-ufw-logging`
- **Category:** firewall
- **Platforms:** linux
- **Risk:** mutate

> Set UFW logging high and verify default deny incoming / allow outgoing.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

ufw logging high plus default deny incoming and allow outgoing. Does not open ports. If UFW is inactive, enable-firewall first.

## Why it scores in CyberPatriot

Default-deny plus high logging is the Linux firewall baseline public kits apply after ‘ufw enable’.

## When to run it

Immediately after enable-firewall / apply-default-deny-inbound.

## Step-by-step

1. If ufw is inactive, run enable-firewall first (confirm).
2. dryRun:true, then live confirm:true on this op.
3. ufw status verbose should show logging high and default deny incoming.

## What “good” looks like

- logging high
- Default: deny (incoming), allow (outgoing)

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Default deny can hide a README-required port — add an allow rule, do not flip default to allow.

## Related ops

- [`enable-firewall`](./enable-firewall.md) — Enable host firewall
- [`apply-default-deny-inbound`](./apply-default-deny-inbound.md) — Apply default-deny inbound
- [`audit-firewall`](./audit-firewall.md) — Audit host firewall
- [`list-firewall-rules`](./list-firewall-rules.md) — List firewall rules

