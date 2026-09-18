# Dump unauthorized share ACLs

- **Catalog id:** `audit-share-acls`
- **Category:** files
- **Platforms:** both
- **Risk:** read

> Dump Samba options and Windows share ACLs; flag guest/Everyone Full.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Inventories Samba share options and Windows SMB share ACLs. Flags guest/Everyone Full, world-writable paths, and administrative shares that should not be exposed on a workstation. Read-only; does not modify ACLs.

## Why it scores in CyberPatriot

Guest + Everyone Full on a public share is a high finding even when SMB is required. ACL dumps show who can write, not just that the share exists.

## When to run it

With audit-shared-folders and audit-smb, after you know whether sharing is required.

## Step-by-step

1. Run the op. Note guest, Everyone Full, world-writable paths, and C$/admin shares.
2. If sharing is not required, disable the service (confirm:true on disable-service / disable-smbv1 as appropriate).
3. If it is required: drop guest, tighten ACLs on the image, remove unexpected public shares.
4. Re-run until only README shares remain with tight ACLs.

## What “good” looks like

- No guest / Everyone Full.
- Admin shares disabled if not required.
- Remaining share paths not world-writable.

## Risks / confirm notes

- Read-only. Does not modify ACLs or enumerate other machines.
- Removing a required share costs points — README names matter.

## Related ops

- [`audit-shared-folders`](./audit-shared-folders.md) — Audit shared folders
- [`audit-smb`](./audit-smb.md) — Audit SMB / Samba
- [`disable-smbv1`](./disable-smbv1.md) — Disable SMBv1
- [`find-world-writable`](./find-world-writable.md) — Find world-writable files

