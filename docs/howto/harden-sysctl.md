# Apply sysctl hardening

- **Catalog id:** `harden-sysctl`
- **Category:** kernel
- **Platforms:** linux
- **Risk:** mutate

> Write a conservative sysctl drop-in and apply it.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Writes /etc/sysctl.d/99-cp-hardening.conf (no forwarding, syncookies, rp_filter, no redirects) and runs sysctl --system.

## Why it scores in CyberPatriot

This is the mutate that closes audit-sysctl findings on a workstation image.

## When to run it

After audit-sysctl, when the README does not require routing/forwarding.

## Step-by-step

1. Confirm the image is not a router per README.
2. dryRun:true, then live confirm:true.
3. Re-run audit-sysctl.

## What “good” looks like

- Drop-in present.
- ip_forward=0, syncookies=1, redirects=0.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Disabling forwarding on a required router image will cost points.

## Related ops

- [`audit-sysctl`](./audit-sysctl.md) — Audit sysctl hardening
- [`enable-firewall`](./enable-firewall.md) — Enable host firewall
- [`apply-default-deny-inbound`](./apply-default-deny-inbound.md) — Apply default-deny inbound

