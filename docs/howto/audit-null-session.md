# Audit null session / anonymous SAM

- **Catalog id:** `audit-null-session`
- **Category:** auth
- **Platforms:** windows
- **Risk:** read

> Check RestrictAnonymous / anonymous SAM / null session shares — no dumps.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reads RestrictAnonymous, RestrictAnonymousSAM, EveryoneIncludesAnonymous, RestrictNullSessAccess, NullSessionPipes, and NullSessionShares. Classification only; never dumps SAM or hashes.

## Why it scores in CyberPatriot

Anonymous SAM and null sessions are high Windows findings. Scoring checks the LSA/LanmanServer knobs, not whether you enumerated anyone.

## When to run it

Windows auth pass with audit-smb and audit-share-acls.

## Step-by-step

1. Run the op. RestrictAnonymous and RestrictAnonymousSAM should be 1; EveryoneIncludesAnonymous 0.
2. NullSessionShares/Pipes should not list C$ or samr on a workstation.
3. Fix via local policy/registry on the image (this op is read-only). Do not dump SAM to confirm.

## What “good” looks like

- RestrictAnonymous=1, RestrictAnonymousSAM=1, EveryoneIncludesAnonymous=0.
- No hashes or SAM contents in the result.

## Risks / confirm notes

- Read-only. Never dump SAM, SECURITY, or password hashes into notes.
- Do not test null sessions against other machines.

## Related ops

- [`audit-smb`](./audit-smb.md) — Audit SMB / Samba
- [`audit-share-acls`](./audit-share-acls.md) — Dump unauthorized share ACLs
- [`audit-uac`](./audit-uac.md) — Audit User Account Control
- [`audit-critical-perm-drift`](./audit-critical-perm-drift.md) — Audit critical permission drift

