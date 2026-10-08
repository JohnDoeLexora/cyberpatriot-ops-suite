# Disable Autoplay

- **Catalog id:** `disable-autoplay`
- **Category:** windows
- **Platforms:** windows
- **Risk:** mutate

> Disable Autoplay/Autorun via NoDriveTypeAutoRun.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Sets NoDriveTypeAutoRun (0xFF). Standard CP Windows hardening against removable-media autorun.

## Why it scores in CyberPatriot

Autoplay is a checkbox Windows item and a persistence path for planted USB-style payloads.

## What it changes

Creates HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer if needed and sets NoDriveTypeAutoRun to 255 (all drive types).

## How to undo

If a backup was made, restore from %ProgramData%\CyberPatriotOps\backups\<ts>\. Delete the NoDriveTypeAutoRun value, or set it back to the previous number, if the README required AutoPlay.

## When to run it

Windows hardening pass with enable-windows-defender and disable-smbv1.

## Step-by-step

1. dryRun:true to see the registry value that would be set.
2. Live confirm:true.
3. Re-check with your registry checklist / this op’s demo output.
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: NoDriveTypeAutoRun=0xFF (or equivalent ‘no autorun’ policy).

## What “good” looks like

- NoDriveTypeAutoRun=0xFF (or equivalent ‘no autorun’ policy).
- Removable media does not auto-launch an installer.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Local image registry only.
- Common mistake: confirming the live change before the account, service, or file matches the image README, or skipping the dry-run preview.

## Related ops

- [`enable-windows-defender`](./enable-windows-defender.md) — Enable Microsoft Defender
- [`disable-smbv1`](./disable-smbv1.md) — Disable SMBv1
- [`audit-uac`](./audit-uac.md) — Audit User Account Control
- [`audit-startup-items`](./audit-startup-items.md) — Audit startup items

