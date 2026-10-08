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

## What it changes

On Linux it runs chage -d 0 for that username. On Windows it runs net user <name> /logonpasswordchg:yes.

## How to undo

If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. To clear the must-change flag, set a new password and a normal age: Linux chage -d today, Windows net user <name> /logonpasswordchg:no after they have a new password.

## When to run it

After you confirm the user is authorized and you suspect a default/stale password. Not for unauthorized users — disable those instead.

## Step-by-step

1. Confirm the username is on the README.
2. dryRun:true, then live confirm:true.
3. Do not paste a new password into this tool; the user (or your team, locally) sets it at next login per team policy.
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: Account still enabled.

## What “good” looks like

- Account still enabled.
- Aging shows must-change at next login.
- Unauthorized users were not expired — they were disabled.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Expiring root/Administrator can be painful mid-round; prefer authorized humans first.
- This is not a password reset that prints or emails secrets.
- Common mistake: confirming the live change before the account, service, or file matches the image README, or skipping the dry-run preview.

## Related ops

- [`check-password-aging`](./check-password-aging.md) — Check password aging
- [`enforce-password-policy`](./enforce-password-policy.md) — Enforce password policy
- [`lock-user`](./lock-user.md) — Lock a local user password
- [`check-empty-passwords`](./check-empty-passwords.md) — Check for empty passwords

