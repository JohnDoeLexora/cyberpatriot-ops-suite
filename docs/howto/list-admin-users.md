# List administrators and sudoers

- **Catalog id:** `list-admin-users`
- **Category:** users
- **Platforms:** both
- **Risk:** read

> Show who actually has admin / UID 0 / sudo rights.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Lists members of Administrators, sudo, wheel, and UID 0. Cross-checks the README allowlist so extra admins jump out.

## Why it scores in CyberPatriot

Privilege is scored separately from “user exists.” A standard user who is also in sudo is a finding even if the name looks friendly.

## When to run it

Immediately after list-users, and again after remove-user-from-admins.

## Step-by-step

1. Run the op with the allowlist path if you customized config/allowed-users.txt.
2. Circle names that are admin but not on the README as admins.
3. Note UID 0 duplicates (toor) — those also belong in audit-uid-zero.
4. Feed extras to remove-user-from-admins or disable-user.

## What “good” looks like

- Only README admins plus the OS built-in (root / Administrator).
- No NOPASSWD surprises (pair with audit-sudoers).

## Risks / confirm notes

- Read-only.
- Windows built-in Administrator and Linux root are expected; do not “fix” them by deletion.

## Related ops

- [`remove-user-from-admins`](./remove-user-from-admins.md) — Remove user from administrators
- [`audit-sudoers`](./audit-sudoers.md) — Audit sudoers
- [`audit-uid-zero`](./audit-uid-zero.md) — Audit UID 0 accounts
- [`list-groups`](./list-groups.md) — List local groups

