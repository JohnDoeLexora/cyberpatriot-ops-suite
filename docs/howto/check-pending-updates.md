# Check pending updates

- **Catalog id:** `check-pending-updates`
- **Category:** updates
- **Platforms:** both
- **Risk:** read

> See whether security patches are waiting, without installing them yet.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reports unattended-upgrades/apt/dnf or Windows Update pending security patches. Read-only; uses the image’s configured update service only.

## Why it scores in CyberPatriot

Unpatched images lose update points. Checking first tells you whether apply-security-updates will take a long time.

## When to run it

Once the hosts file is clean (so updates are not sinkholed) and the network/firewall will allow the vendor update channel.

## Step-by-step

1. Run audit-hosts-file first if updates look blocked.
2. Run this op. Note the count and whether unattended-upgrades is off.
3. When you have a quiet stretch, apply-security-updates with confirm:true.

## What “good” looks like

- Zero pending security updates, or a documented reason (offline image).
- unattended-upgrades on if the README/distro expects it.

## Risks / confirm notes

- Read-only. Installing is the mutate op.
- Do not point the image at unofficial third-party repos to ‘get more patches.’

## Related ops

- [`apply-security-updates`](./apply-security-updates.md) — Apply security updates
- [`audit-hosts-file`](./audit-hosts-file.md) — Audit hosts file
- [`enable-windows-defender`](./enable-windows-defender.md) — Enable Microsoft Defender

