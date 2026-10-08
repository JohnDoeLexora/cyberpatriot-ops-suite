# Enable Microsoft Defender

- **Catalog id:** `enable-windows-defender`
- **Category:** windows
- **Platforms:** windows
- **Risk:** mutate

> Turn realtime Defender back on if it was disabled.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Re-enables Defender realtime monitoring. Does not download third-party AV.

## Why it scores in CyberPatriot

Defender disabled is a common registry/policy plant. Scoring wants the built-in AV on.

## What it changes

Runs Set-MpPreference -DisableRealtimeMonitoring $false.

## How to undo

If a backup was made, restore from %ProgramData%\CyberPatriotOps\backups\<ts>\. Do not turn real-time protection back off. If you must undo a bad preference change, restore the Defender policy from the backup folder.

## When to run it

Windows pass with disable-autoplay and audit-hosts-file (so signatures can update).

## Step-by-step

1. Run the op with dryRun:true if you only need the intended Set-MpPreference.
2. Live confirm:true.
3. If hosts file sinkholed Defender, fix that first (audit-hosts-file).
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: Realtime monitoring on.

## What “good” looks like

- Realtime monitoring on.
- No third-party random AV installer involved.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Do not sideload cracked AV. Do not disable Defender to ‘go faster.’
- Common mistake: confirming the live change before the account, service, or file matches the image README, or skipping the dry-run preview.

## Related ops

- [`audit-hosts-file`](./audit-hosts-file.md) — Audit hosts file
- [`check-pending-updates`](./check-pending-updates.md) — Check pending updates
- [`disable-autoplay`](./disable-autoplay.md) — Disable Autoplay
- [`audit-uac`](./audit-uac.md) — Audit User Account Control

