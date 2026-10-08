# Disable optional Windows features

- **Catalog id:** `disable-optional-windows-features`
- **Category:** windows
- **Platforms:** windows
- **Risk:** mutate

> Bulk-disable Telnet, TFTP, SMB1 extras, SimpleTCP, and similar optional features.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Disable-WindowsOptionalFeature -NoRestart for names in config/windows/optional-features.txt. Complements disable-telnet and disable-smbv1 when those features are still installed.

## Why it scores in CyberPatriot

Telnet Client, TFTP, Simple TCP, and SMB1 are classic leftover features on Windows images.

## What it changes

Runs Disable-WindowsOptionalFeature -Online -NoRestart for each name in the features file (or TelnetClient, TelnetServer, TFTP, SMB1Protocol, and SimpleTCP if the file is missing).

## How to undo

If a backup was made, restore from %ProgramData%\CyberPatriotOps\backups\<ts>\. Enable-WindowsOptionalFeature for a single feature only if the README requires that feature.

## When to run it

Windows services/features pass after audit-ftp-telnet and audit-smb.

## Step-by-step

1. Skim config/windows/optional-features.txt. Remove any name the README requires (IIS-FTP if FTP is scored).
2. dryRun:true, then live confirm:true.
3. Reboot later if DISM says so — this op does not reboot.
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: TelnetClient/TFTP/SMB1Protocol/SimpleTCP Disabled.

## What “good” looks like

- TelnetClient/TFTP/SMB1Protocol/SimpleTCP Disabled.
- NoRestart — you choose when to reboot.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Do not disable a README-required web/FTP feature. Edit the list first.
- Common mistake: confirming the live change before the account, service, or file matches the image README, or skipping the dry-run preview.

## Related ops

- [`disable-telnet`](./disable-telnet.md) — Disable Telnet
- [`disable-smbv1`](./disable-smbv1.md) — Disable SMBv1
- [`audit-iis`](./audit-iis.md) — IIS feature inventory + anonymous auth
- [`audit-ftp-telnet`](./audit-ftp-telnet.md) — Audit FTP and Telnet

