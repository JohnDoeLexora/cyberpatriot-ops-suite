# Lock a local user password

- **Catalog id:** `lock-user`
- **Category:** users
- **Platforms:** both
- **Risk:** mutate

> Lock the password so the account cannot authenticate, but keep the record.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Locks a local account password (passwd -l / usermod -L, or the Windows lock equivalent) without removing the user. Different from disable-user mainly in the mechanism; both stop logins.

## Why it scores in CyberPatriot

Some checklists want the account present but unable to log in (especially service-like humans or stale authorized users you are not allowed to delete).

## What it changes

On Linux it runs usermod -L (or passwd -l). On Windows it runs Disable-LocalUser for that name.

## How to undo

If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. On Linux run usermod -U or passwd -u for that name. On Windows run Enable-LocalUser. Only unlock someone the README allows.

## When to run it

When the README still lists the person as a user but you need to stop a known-default or compromised password, or when disable-user is too heavy.

## Step-by-step

1. Confirm the username on the image and in the README.
2. dryRun:true to see the before/after lock bit.
3. Live: confirm:true plus the username.
4. Re-run list-users; the account should show locked and still exist.

## What “good” looks like

- Account remains in the inventory with a locked/password-disabled flag.
- No home deletion.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Locking a required service account can break a scored service — check required-services and the README.
- This is not a password-cracking tool and never prints hashes.
- Common mistake: confirming the live change before the account, service, or file matches the image README, or skipping the dry-run preview.

## Related ops

- [`disable-user`](./disable-user.md) — Disable a local user
- [`expire-user-password`](./expire-user-password.md) — Expire a user password
- [`check-empty-passwords`](./check-empty-passwords.md) — Check for empty passwords
- [`list-users`](./list-users.md) — List local users

