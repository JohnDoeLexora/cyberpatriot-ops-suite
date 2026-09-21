# Enable unattended-upgrades

- **Catalog id:** `enable-unattended-upgrades`
- **Category:** updates
- **Platforms:** linux
- **Risk:** mutate

> Write 20auto-upgrades and enable the distro unattended-upgrades package.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Installs distro unattended-upgrades if missing and writes APT Periodic Update-Package-Lists 1 / Unattended-Upgrade 1. Complements audit-auto-updates. Does not fetch unofficial installers.

## Why it scores in CyberPatriot

Automatic security updates are a Linux scoring item and how you keep the image patched under the clock.

## When to run it

After audit-auto-updates / check-pending-updates. Pair with apply-security-updates for the current backlog.

## Step-by-step

1. Run audit-auto-updates so you know 20auto-upgrades is 0 or missing.
2. dryRun:true, then live confirm:true. If apt cannot provide the package, the op reports that — do not wget a random installer.
3. Re-run audit-auto-updates. Unattended-Upgrade should be 1.

## What “good” looks like

- /etc/apt/apt.conf.d/20auto-upgrades has Unattended-Upgrade 1.
- No GitHub/raw installer involved.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Need root/apt. Do not point at a third-party repo.

## Related ops

- [`audit-auto-updates`](./audit-auto-updates.md) — Audit unattended-upgrades / Windows Update
- [`apply-security-updates`](./apply-security-updates.md) — Apply security updates
- [`check-pending-updates`](./check-pending-updates.md) — Check pending updates
- [`audit-hosts-file`](./audit-hosts-file.md) — Audit hosts file

