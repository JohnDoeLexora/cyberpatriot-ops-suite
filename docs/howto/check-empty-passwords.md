# Check for empty passwords

- **Catalog id:** `check-empty-passwords`
- **Category:** users
- **Platforms:** both
- **Risk:** read

> Find accounts that can log in with no password.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Classifies accounts as empty / locked / set using shadow or Windows PasswordRequired. It never prints hashes — only the boolean class.

## Why it scores in CyberPatriot

Empty-password Guest or human accounts are easy points and an open door on the image. CP images often ship Guest or games this way.

## When to run it

With the first user pass, especially before you connect the image to a network you care about.

## Step-by-step

1. Run the op. Note anyone classified empty or PasswordRequired=false.
2. README check: Guest should almost always be disabled, not given a password.
3. Authorized humans with empty passwords: expire-user-password or set a strong password through the OS tools; do not dump hashes.
4. Re-run until no interactive account is empty.

## What “good” looks like

- Human accounts: password set (or locked if unauthorized).
- Guest disabled.
- Output has no hash strings.

## Risks / confirm notes

- Read-only. This is not John/hashcat and must never become a cracker.
- Setting passwords is a manual/OS step; this op only detects emptiness.

## Related ops

- [`disable-guest-account`](./disable-guest-account.md) — Disable Guest account
- [`expire-user-password`](./expire-user-password.md) — Expire a user password
- [`audit-password-policy`](./audit-password-policy.md) — Audit password policy
- [`lock-user`](./lock-user.md) — Lock a local user password

