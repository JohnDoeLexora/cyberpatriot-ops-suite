# Report never-expires + blank password combo

- **Catalog id:** `report-password-never-expires`
- **Category:** auth
- **Platforms:** both
- **Risk:** read

> Combine never-expires aging with blank-password classification — no hashes.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Joins password-aging (shadow MAX_DAYS -1/99999 or Windows PasswordNeverExpires) with empty-password classification. Human accounts that never expire, especially with a blank password, are high. Never prints hashes — only empty/locked/set plus never-expires booleans.

## Why it scores in CyberPatriot

Guest with a blank never-expiring password is a two-finding plant. Aging-off humans stay scored even when the password is set.

## When to run it

Auth pass with check-empty-passwords and check-password-aging.

## Step-by-step

1. Run the op. Sort empty+never-expires first (Guest, games, planted humans).
2. Disable Guest; lock or expire authorized humans; enforce-password-policy for the global max-age.
3. Do not print or copy hashes. Re-run until empty+never-expires is gone for humans.

## What “good” looks like

- No human with empty password + never-expires.
- Authorized humans have a max age (e.g. 90), not 99999.
- Result shows empty/locked/set only — never a hash.

## Risks / confirm notes

- Read-only. Hashes are never returned.
- Do not expire a required service account that cannot change a password interactively.

## Related ops

- [`check-empty-passwords`](./check-empty-passwords.md) — Check for empty passwords
- [`check-password-aging`](./check-password-aging.md) — Check password aging
- [`disable-guest-account`](./disable-guest-account.md) — Disable Guest account
- [`enforce-password-policy`](./enforce-password-policy.md) — Enforce password policy

