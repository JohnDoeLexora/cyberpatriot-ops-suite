# Audit sysctl hardening

- **Catalog id:** `audit-sysctl`
- **Category:** kernel
- **Platforms:** linux
- **Risk:** read

> Read workstation sysctl hardening knobs (forwarding, syncookies, redirects).

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reads ip_forward, rp_filter, accept_redirects, tcp_syncookies, dmesg_restrict, kptr_restrict, randomize_va_space. Forwarding on a workstation is a finding.

## Why it scores in CyberPatriot

ip_forward=1 and tcp_syncookies=0 are common kernel plants on Linux workstations.

## When to run it

Linux kernel pass, before harden-sysctl.

## Step-by-step

1. Run the op. Workstations should not forward; routers might — believe the README.
2. Apply harden-sysctl for the conservative workstation set.
3. Re-run the audit.

## What “good” looks like

- ip_forward=0 on a workstation (unless the README says router).
- tcp_syncookies=1, redirects off, rp_filter on.

## Risks / confirm notes

- Read-only.
- If the README says this image is a router, do not blindly disable forwarding.

## Related ops

- [`harden-sysctl`](./harden-sysctl.md) — Apply sysctl hardening
- [`audit-firewall`](./audit-firewall.md) — Audit host firewall
- [`enable-firewall`](./enable-firewall.md) — Enable host firewall

