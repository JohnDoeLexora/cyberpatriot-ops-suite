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

## What it changes

Writes /etc/sysctl.d/99-cp-hardening.conf (ip_forward 0, send/accept redirects 0, accept_source_route 0, log_martians 1, rp_filter 1, tcp_syncookies 1, IPv6 accept_redirects 0, randomize_va_space 2, dmesg_restrict 1, kptr_restrict 2) and runs sysctl --system.

## How to undo

If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. Delete 99-cp-hardening.conf and run sysctl --system so the previous files apply again.

## When to run it

After audit-sysctl, when the README does not require routing/forwarding.

## Step-by-step

1. Confirm the image is not a router per README.
2. dryRun:true, then live confirm:true.
3. Re-run audit-sysctl.
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: Drop-in present.

## What “good” looks like

- Drop-in present.
- ip_forward=0, syncookies=1, redirects=0.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Disabling forwarding on a required router image will cost points.
- Common mistake: confirming the live change before the account, service, or file matches the image README, or skipping the dry-run preview.

## Related ops

- [`audit-sysctl`](./audit-sysctl.md) — Audit sysctl hardening
- [`enable-firewall`](./enable-firewall.md) — Enable host firewall
- [`apply-default-deny-inbound`](./apply-default-deny-inbound.md) — Apply default-deny inbound

