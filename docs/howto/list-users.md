# List local users

- **Catalog id:** `list-users`
- **Category:** users
- **Platforms:** both
- **Risk:** read

> Inventory every local account so you know who lives on the image.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Lists local users with UID/SID, home/profile, shell, groups, lock state, and last login. Password hashes are never listed. This is the phone book for every later user op.

## Why it scores in CyberPatriot

CyberPatriot images almost always hide extra accounts, leftover vendor users, or a second root. You cannot lock or demote what you have not found, and README-required users that are missing are findings too.

## When to run it

First five minutes of the round, then again after you disable or lock anyone so the inventory matches reality.

## Step-by-step

1. Open this op and Run it (demo mode is safe and does not touch the host).
2. Put the README authorized-user list next to the output (or config/allowed-users.txt).
3. Highlight names that are not on the README and names the README promised that are missing.
4. Do not delete yet — note UID 0, Guest, never-logged-in humans, and extra admins for the specialized ops.
5. Re-run after each account change so your evidence stays current.

## What “good” looks like

- Every README human is present and enabled.
- No surprise interactive accounts (toor, hacker123, flag, test).
- Output never includes password hashes or private keys.

## Risks / confirm notes

- Read-only: this op does not disable or delete anyone.
- Service accounts (www-data, sshd, daemon) are supposed to exist — do not treat them as backdoors just because they are not in the README.
- Authorized-image inventory only. Never point this at another team’s host.

## Related ops

- [`flag-suspicious-users`](./flag-suspicious-users.md) — Flag suspicious users
- [`list-admin-users`](./list-admin-users.md) — List administrators and sudoers
- [`audit-uid-zero`](./audit-uid-zero.md) — Audit UID 0 accounts
- [`disable-user`](./disable-user.md) — Disable a local user

