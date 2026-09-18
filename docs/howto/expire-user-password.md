# Expire a user password

- **Catalog id:** `expire-user-password`
- **Category:** users
- **Platforms:** both
- **Risk:** mutate

> Force an authorized user to set a new password at next login.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Expires a password (chage -d 0 / net user /logonpasswordchg:yes) without locking the account. For README users with stale or known-default passwords.

## Why it scores in CyberPatriot

Authorized accounts with default passwords are scored. Expiring is the kosher way to force a change without inventing a password in the write-up.

## When to run it

After you confirm the user is authorized and you suspect a default/stale password. Not for unauthorized users — disable those instead.

## Step-by-step

1. Confirm the username is on the README.
2. dryRun:true, then live confirm:true.
3. Do not paste a new password into this tool; the user (or your team, locally) sets it at next login per team policy.

## What “good” looks like

- Account still enabled.
- Aging shows must-change at next login.
- Unauthorized users were not expired — they were disabled.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Expiring root/Administrator can be painful mid-round; prefer authorized humans first.
- This is not a password reset that prints or emails secrets.

## Related ops

- [`check-password-aging`](./check-password-aging.md) — Check password aging
- [`enforce-password-policy`](./enforce-password-policy.md) — Enforce password policy
- [`lock-user`](./lock-user.md) — Lock a local user password
- [`check-empty-passwords`](./check-empty-passwords.md) — Check for empty passwords

