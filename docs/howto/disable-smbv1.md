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

## When to run it

After audit-smb, whether or not file sharing stays on.

## Step-by-step

1. Run audit-smb so you know SMBv1 is actually on.
2. dryRun:true, then live confirm:true.
3. Re-run audit-smb. SMBv2/3 can remain if shares are required.

## What “good” looks like

- SMB1Protocol disabled.
- Guest shares still handled separately via audit-shared-folders.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- If a dinosaur README required SMBv1 (almost never), stop. Otherwise disable it.

## Related ops

- [`audit-smb`](./audit-smb.md) — Audit SMB / Samba
- [`audit-shared-folders`](./audit-shared-folders.md) — Audit shared folders
- [`enable-firewall`](./enable-firewall.md) — Enable host firewall
- [`disable-autoplay`](./disable-autoplay.md) — Disable Autoplay

