# Apply security updates

- **Catalog id:** `apply-security-updates`
- **Category:** updates
- **Platforms:** both
- **Risk:** mutate

> Install local security updates from the image’s own update channels.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

apt-get upgrade, dnf update --security, or Start-WindowsUpdate. Long-running. Live requires confirm:true. Stays on authorized-image channels.

## Why it scores in CyberPatriot

This is the actual patching step the check-pending-updates finding wants.

## What it changes

On Linux it runs apt-get update and apt-get upgrade -y, or dnf update. On Windows the live script does not download updates itself; it tells you to run Windows Update on the image.

## How to undo

If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. Package upgrades are not a single file to revert. If a backup was made, restore the packages from it, or reinstall the previous package versions from the distro cache. Do not uninstall a security update just to get the old vulnerable build back unless the image will not boot.

## When to run it

When the image can reach its update service, hosts file is clean, and you can spare the time (it can be slow).

## Step-by-step

1. Run check-pending-updates and audit-hosts-file.
2. dryRun:true if you only need the package list.
3. Live confirm:true. Do not walk away from a reboot prompt on Windows without team agreement.
4. Re-run check-pending-updates.

## What “good” looks like

- Pending security count at or near zero.
- Required services come back after any restart.

## Risks / confirm notes

- Mutation. Live requires confirm:true. Can take a long time and may reboot.
- Do not add random PPAs or third-party patch tools.
- Authorized image only — never push updates to other teams’ hosts.
- Common mistake: confirming the live change before the account, service, or file matches the image README, or skipping the dry-run preview.

## Related ops

- [`check-pending-updates`](./check-pending-updates.md) — Check pending updates
- [`audit-hosts-file`](./audit-hosts-file.md) — Audit hosts file
- [`list-services`](./list-services.md) — List services
- [`enable-windows-defender`](./enable-windows-defender.md) — Enable Microsoft Defender

