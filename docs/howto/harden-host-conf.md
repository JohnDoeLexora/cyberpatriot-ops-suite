# Harden host.conf nospoof

- **Catalog id:** `harden-host-conf`
- **Category:** network
- **Platforms:** linux
- **Risk:** mutate

> Write /etc/host.conf with order hosts,bind and nospoof on.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Replaces /etc/host.conf with the classic resolver hardening: order hosts,bind; multi on; nospoof on. Complements sysctl rp_filter.

## Why it scores in CyberPatriot

IP spoofing / hosts-bind order is a recurring Linux network checkbox in public kits.

## What it changes

Overwrites /etc/host.conf with order hosts,bind, multi on, and nospoof on.

## How to undo

If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. Restore the previous /etc/host.conf from the backup (often order hosts,bind and multi on, without nospoof).

## When to run it

Linux network pass with harden-sysctl and clear-suspicious-hosts.

## Step-by-step

1. dryRun:true to preview the file.
2. Live confirm:true.
3. Pair with harden-sysctl (rp_filter) rather than treating nospoof as the whole story.
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: /etc/host.conf contains nospoof on and order hosts,bind.

## What “good” looks like

- /etc/host.conf contains nospoof on and order hosts,bind.
- multi on is present so the resolver still accepts multiple addresses.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- nospoof is historical; still expected on many Ubuntu scoring images.
- Common mistake: confirming the live change before the account, service, or file matches the image README, or skipping the dry-run preview.

## Related ops

- [`harden-sysctl`](./harden-sysctl.md) — Apply sysctl hardening
- [`audit-hosts-file`](./audit-hosts-file.md) — Audit hosts file
- [`clear-suspicious-hosts`](./clear-suspicious-hosts.md) — Clear suspicious hosts-file entries
- [`check-ntp`](./check-ntp.md) — Check time synchronization

