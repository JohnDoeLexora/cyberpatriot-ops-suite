# Disable SMBv1

- **Catalog id:** `disable-smbv1`
- **Category:** windows
- **Platforms:** windows
- **Risk:** mutate

> Turn off the SMBv1 feature/registry on a Windows image.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Disables SMB1Protocol (optional feature / registry). Standard in-scope Windows hardening.

## Why it scores in CyberPatriot

SMBv1 is a high Windows finding even when SMB itself is required.

## What it changes

Runs Disable-WindowsOptionalFeature for SMB1Protocol with no restart.

## How to undo

If a backup was made, restore from %ProgramData%\CyberPatriotOps\backups\<ts>\. Re-enable SMB1 only if a README you trust still requires it: Enable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol. That is rare.

## When to run it

After audit-smb, whether or not file sharing stays on.

## Step-by-step

1. Run audit-smb so you know SMBv1 is actually on.
2. dryRun:true, then live confirm:true.
3. Re-run audit-smb. SMBv2/3 can remain if shares are required.
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: SMB1Protocol disabled.

## What “good” looks like

- SMB1Protocol disabled.
- Guest shares still handled separately via audit-shared-folders.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- If a dinosaur README required SMBv1 (almost never), stop. Otherwise disable it.
- Common mistake: confirming the live change before the account, service, or file matches the image README, or skipping the dry-run preview.

## Related ops

- [`audit-smb`](./audit-smb.md) — Audit SMB / Samba
- [`audit-shared-folders`](./audit-shared-folders.md) — Audit shared folders
- [`enable-firewall`](./enable-firewall.md) — Enable host firewall
- [`disable-autoplay`](./disable-autoplay.md) — Disable Autoplay

