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

## What it changes

May install unattended-upgrades from apt, writes /etc/apt/apt.conf.d/20auto-upgrades with Update-Package-Lists 1 and Unattended-Upgrade 1, and enables the unattended-upgrades service.

## How to undo

If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. Set Unattended-Upgrade back to 0 in 20auto-upgrades, or restore that file from the backup, if the README says updates must be manual.

## When to run it

After audit-auto-updates / check-pending-updates. Pair with apply-security-updates for the current backlog.

## Step-by-step

1. Run audit-auto-updates so you know 20auto-upgrades is 0 or missing.
2. dryRun:true, then live confirm:true. If apt cannot provide the package, the op reports that — do not wget a random installer.
3. Re-run audit-auto-updates. Unattended-Upgrade should be 1.
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: /etc/apt/apt.conf.d/20auto-upgrades has Unattended-Upgrade 1.

## What “good” looks like

- /etc/apt/apt.conf.d/20auto-upgrades has Unattended-Upgrade 1.
- No GitHub/raw installer involved.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Need root/apt. Do not point at a third-party repo.
- Common mistake: confirming the live change before the account, service, or file matches the image README, or skipping the dry-run preview.

## Related ops

- [`audit-auto-updates`](./audit-auto-updates.md) — Audit unattended-upgrades / Windows Update
- [`apply-security-updates`](./apply-security-updates.md) — Apply security updates
- [`check-pending-updates`](./check-pending-updates.md) — Check pending updates
- [`audit-hosts-file`](./audit-hosts-file.md) — Audit hosts file

