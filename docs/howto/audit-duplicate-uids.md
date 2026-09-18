# Audit duplicate UIDs

- **Catalog id:** `audit-duplicate-uids`
- **Category:** users
- **Platforms:** linux
- **Risk:** read

> Two names sharing one UID break auditing and can hide a root alias.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Finds distinct usernames that share a UID. Duplicate UID 0 is critical; other collisions still matter.

## Why it scores in CyberPatriot

A second name with UID 0 is root by another name. Non-zero duplicates confuse logs and file ownership — both are findings.

## When to run it

Together with audit-uid-zero on Linux.

## Step-by-step

1. Run the op. Treat any UID 0 collision as urgent.
2. Disable the extra name (disable-user). Do not try to ‘merge’ the UIDs.
3. Re-run until each UID maps to one username (plus expected system aliases if the distro documents them).

## What “good” looks like

- No two human usernames share a UID.
- root is the only UID 0 name.

## Risks / confirm notes

- Read-only.
- Some distros have aliases; still, CP images that plant toor are not ‘aliases’ — they are backdoors to disable.

## Related ops

- [`audit-uid-zero`](./audit-uid-zero.md) — Audit UID 0 accounts
- [`disable-user`](./disable-user.md) — Disable a local user
- [`list-users`](./list-users.md) — List local users
- [`flag-suspicious-users`](./flag-suspicious-users.md) — Flag suspicious users

