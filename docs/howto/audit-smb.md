# Audit SMB / Samba

- **Catalog id:** `audit-smb`
- **Category:** services
- **Platforms:** both
- **Risk:** read

> Report Samba/SMB state, guest access, SMBv1, and share list.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Checks smbd/nmbd/LanmanServer, guest/anonymous, SMBv1, and shares. Guest shares and SMBv1 are high unless the README requires file sharing.

## Why it scores in CyberPatriot

Open SMB with Everyone Full and SMBv1 are large Windows/Linux findings. Even if sharing is required, guest and v1 usually are not.

## What it changes

Nothing - read-only audit

## How to undo

Nothing to undo

## When to run it

With audit-shared-folders and audit-listening-ports (139/445).

## Step-by-step

1. Run the op. Split findings: service running, SMBv1, guest map, dangerous shares.
2. If SMB is not required, disable-service / disable-smbv1 as appropriate.
3. If SMB is required: disable SMBv1, turn off guest, tighten share ACLs (see audit-shared-folders).
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: SMBv1 off.

## What “good” looks like

- SMBv1 off.
- No guest / Everyone Full shares.
- Service off entirely when the README does not need it.

## Risks / confirm notes

- Read-only.
- Disabling LanmanServer on a Windows image that needs shares will cost points — README first.
- Common mistake: treating this read-only result as already fixed, or changing the computer before the findings are copied into Team notes.

## Related ops

- [`audit-shared-folders`](./audit-shared-folders.md) — Audit shared folders
- [`disable-smbv1`](./disable-smbv1.md) — Disable SMBv1
- [`disable-service`](./disable-service.md) — Disable a service
- [`audit-listening-ports`](./audit-listening-ports.md) — Audit listening ports

