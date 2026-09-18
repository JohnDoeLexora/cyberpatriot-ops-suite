# Disable Guest account

- **Catalog id:** `disable-guest-account`
- **Category:** users
- **Platforms:** both
- **Risk:** mutate

> Turn Guest off. It is almost never authorized on CP images.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Disables the Guest / guest account on Windows and Linux. The account remains listed but cannot log in.

## Why it scores in CyberPatriot

Guest with a blank password is a classic scoring item on both platforms. README almost never asks you to keep it.

## When to run it

Early, as soon as you confirm the README does not require Guest (it won’t, 99% of the time).

## Step-by-step

1. Skim the README for the word Guest. If it is required (rare), stop.
2. dryRun:true, then live with confirm:true. No username param — it targets Guest.
3. Re-run list-users / check-empty-passwords; Guest should be disabled.

## What “good” looks like

- Guest exists but enabled=false / cannot log in.
- No empty-password Guest finding.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- If a forensics question mentions Guest, disable still; do not delete the account.

## Related ops

- [`check-empty-passwords`](./check-empty-passwords.md) — Check for empty passwords
- [`list-users`](./list-users.md) — List local users
- [`disable-user`](./disable-user.md) — Disable a local user
- [`audit-uac`](./audit-uac.md) — Audit User Account Control

