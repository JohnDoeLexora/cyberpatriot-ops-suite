# Audit shared folders

- **Catalog id:** `audit-shared-folders`
- **Category:** files
- **Platforms:** both
- **Risk:** read

> List Samba/Windows shares with guest, Everyone/Full, and admin shares.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Local share config only: guest access, Everyone Full, C$, IPC$. Complements audit-smb.

## Why it scores in CyberPatriot

A public guest-writable share is a high finding even if the SMB service is ‘required.’

## When to run it

With audit-smb. After you know whether file sharing is required.

## Step-by-step

1. Run the op. Classify each share: required, guest, world-writable, administrative.
2. If sharing is not required, disable the service.
3. If it is required: remove guest, tighten ACLs, drop unexpected public shares.

## What “good” looks like

- Only README shares remain.
- No guest / Everyone Full.
- Admin shares disabled if not required.

## Risks / confirm notes

- Read-only.
- Removing a required share costs points — README names matter.

## Related ops

- [`audit-smb`](./audit-smb.md) — Audit SMB / Samba
- [`disable-smbv1`](./disable-smbv1.md) — Disable SMBv1
- [`disable-service`](./disable-service.md) — Disable a service
- [`find-world-writable`](./find-world-writable.md) — Find world-writable files

