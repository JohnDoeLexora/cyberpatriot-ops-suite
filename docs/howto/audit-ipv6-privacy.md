# Audit IPv6 privacy / optional disable

- **Catalog id:** `audit-ipv6-privacy`
- **Category:** kernel
- **Platforms:** linux
- **Risk:** read

> Read IPv6 privacy/forwarding. Disable only with disableIPv6=true and confirm.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reads use_tempaddr, accept_ra, forwarding, disable_ipv6. Default is audit-only. disableIPv6=true writes sysctl to disable IPv6 and requires confirm:true (or dryRun).

## Why it scores in CyberPatriot

IPv6 forwarding/RA on a workstation is a sysctl cousin finding. Disabling IPv6 entirely is a README call — some images need it.

## When to run it

Linux kernel pass with audit-sysctl. Leave disableIPv6 false unless the README forbids IPv6.

## Step-by-step

1. Run with defaults (audit-only). Note accept_ra + forwarding.
2. If the README says disable IPv6, re-run with disableIPv6:true dryRun:true, then confirm:true.
3. If the README requires IPv6, do not disable — pair with harden-sysctl instead.

## What “good” looks like

- Privacy extensions on or IPv6 disabled, matching the README.
- Default run did not write sysctl.

## Risks / confirm notes

- Default is read-only. Live disableIPv6 requires confirm:true.
- Disabling IPv6 can break dual-stack required services. Check the README.

## Related ops

- [`harden-sysctl`](./harden-sysctl.md) — Apply sysctl hardening
- [`audit-sysctl`](./audit-sysctl.md) — Audit sysctl hardening
- [`blacklist-kernel-modules`](./blacklist-kernel-modules.md) — Blacklist uncommon kernel modules
- [`audit-firewall`](./audit-firewall.md) — Audit host firewall

