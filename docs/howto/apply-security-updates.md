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

## Related ops

- [`check-pending-updates`](./check-pending-updates.md) — Check pending updates
- [`audit-hosts-file`](./audit-hosts-file.md) — Audit hosts file
- [`list-services`](./list-services.md) — List services
- [`enable-windows-defender`](./enable-windows-defender.md) — Enable Microsoft Defender

