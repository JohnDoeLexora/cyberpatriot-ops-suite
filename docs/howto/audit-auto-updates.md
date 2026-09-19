# Audit unattended-upgrades / Windows Update

- **Catalog id:** `audit-auto-updates`
- **Category:** updates
- **Platforms:** both
- **Risk:** read

> Check that unattended-upgrades or Windows Update is actually enabled.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reads APT Periodic / 50unattended-upgrades or Windows AUOptions / wuauserv. Complements check-pending-updates: this is the *channel* sanity check, not a patch install.

## Why it scores in CyberPatriot

Unattended-upgrades off and wuauserv disabled are plants that keep the image unpatched. Scoring wants the update channel on even before you finish applying patches.

## When to run it

With check-pending-updates and audit-hosts-file (so Windows Update is not sinkholed).

## Step-by-step

1. Run the op. APT::Periodic::Unattended-Upgrade should not be 0; wuauserv should not be disabled; AUOptions should not be ‘never check’.
2. Fix hosts-file blocks of windowsupdate first (audit-hosts-file).
3. Enable the channel on the image, then apply-security-updates with confirm:true.

## What “good” looks like

- Unattended-upgrades enabled, or Windows Update service automatic and AUOptions checking.
- Hosts file not pinning Windows Update to 127.0.0.1.

## Risks / confirm notes

- Read-only. Installing patches is apply-security-updates with confirm:true.
- Stays on the image’s configured update channels — no off-host targeting.

## Related ops

- [`check-pending-updates`](./check-pending-updates.md) — Check pending updates
- [`apply-security-updates`](./apply-security-updates.md) — Apply security updates
- [`audit-hosts-file`](./audit-hosts-file.md) — Audit hosts file
- [`enable-windows-defender`](./enable-windows-defender.md) — Enable Microsoft Defender

