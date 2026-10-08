# Harden anonymous enumeration / null sessions

- **Catalog id:** `harden-null-session`
- **Category:** auth
- **Platforms:** windows
- **Risk:** mutate

> Set RestrictAnonymous / RestrictAnonymousSAM / RestrictNullSessAccess to the hardened baseline.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Writes the four LSA/LanmanServer restrict values that audit-null-session only reads. Does not dump SAM, pipes, or hashes.

## Why it scores in CyberPatriot

Anonymous SAM / null session enumeration is a high Windows finding even when shares stay.

## What it changes

Sets RestrictAnonymous and RestrictAnonymousSAM to 1, EveryoneIncludesAnonymous to 0, LimitBlankPasswordUse to 1, and LanmanServer RestrictNullSessAccess to 1.

## How to undo

If a backup was made, restore from %ProgramData%\CyberPatriotOps\backups\<ts>\. Set those LSA and LanmanServer values back to 0 only if a required legacy app the README names cannot work without anonymous access.

## When to run it

After audit-null-session, with disable-remote-registry and audit-smb.

## Step-by-step

1. Run audit-null-session so you know which values are 0.
2. dryRun:true, then live confirm:true.
3. Re-run audit-null-session. RestrictAnonymous and RestrictAnonymousSAM should be 1; EveryoneIncludesAnonymous 0.
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: RestrictAnonymous=1, RestrictAnonymousSAM=1, RestrictNullSessAccess=1, EveryoneIncludesAnonymous=0.

## What “good” looks like

- RestrictAnonymous=1, RestrictAnonymousSAM=1, RestrictNullSessAccess=1, EveryoneIncludesAnonymous=0.
- No SAM dump in the output.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Do not dump SAM or hashes. Authorized-image only.
- Common mistake: confirming the live change before the account, service, or file matches the image README, or skipping the dry-run preview.

## Related ops

- [`audit-null-session`](./audit-null-session.md) — Audit null session / anonymous SAM
- [`audit-smb`](./audit-smb.md) — Audit SMB / Samba
- [`disable-remote-registry`](./disable-remote-registry.md) — Disable Remote Registry
- [`audit-share-acls`](./audit-share-acls.md) — Dump unauthorized share ACLs

