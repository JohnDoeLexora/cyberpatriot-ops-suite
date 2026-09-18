# Disable a local user

- **Catalog id:** `disable-user`
- **Category:** users
- **Platforms:** both
- **Risk:** mutate

> Turn off an unauthorized account without destroying the record.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Disables a local account (usermod/nologin or Disable-LocalUser) so it cannot log in. The account row remains for evidence. Homes are not deleted.

## Why it scores in CyberPatriot

Unauthorized interactive users are a staple scoring item. Disabling is safer than deleting because forensics questions and README checks may still need the username and home.

## When to run it

After flag-suspicious-users / list-users, and only for names the README does not authorize.

## Step-by-step

1. Run list-users or flag-suspicious-users and write down the exact username.
2. Read the README twice. If the user is listed as authorized, stop.
3. Prefer dryRun:true first — the result should describe the lock/shell change without applying it.
4. Live mode requires confirm:true. Pass the username; do not delete the home directory.
5. Re-run list-users and try (in your notes) to confirm the account is disabled/locked.

## What “good” looks like

- Unauthorized user still listed but enabled=false / shell nologin / locked.
- Home directory still on disk.
- Required README users remain active.

## Risks / confirm notes

- Mutation. Live mode is refused without confirm:true. dryRun:true previews without confirm.
- Never disable root or a README-required admin unless the README says so.
- Do not userdel. Deleting homes can wipe forensics evidence.
- Authorized image only.

## Related ops

- [`lock-user`](./lock-user.md) — Lock a local user password
- [`flag-suspicious-users`](./flag-suspicious-users.md) — Flag suspicious users
- [`list-users`](./list-users.md) — List local users
- [`disable-guest-account`](./disable-guest-account.md) — Disable Guest account

