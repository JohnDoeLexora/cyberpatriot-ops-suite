# Select unauthorized users (allowlist miss)

- **Catalog id:** `select-unauthorized-users`
- **Category:** users
- **Platforms:** both
- **Risk:** read

> Bulk-select interactive accounts that miss the README allowlist.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Compares local interactive users to config/allowed-users.txt and returns a disable/lock-ready name list, extra admins, and allowlist names missing from the image. Deepens flag-suspicious-users into the round-one “who do we turn off” table. Never dumps hashes.

## Why it scores in CyberPatriot

Unauthorized humans and extra admins are a staple point block. A bulk miss list is faster than scrolling a scored inventory under the clock, and it feeds disable-user / remove-user-from-admins.

## When to run it

Right after you paste the README user list into config/allowed-users.txt. Re-run after each disable/lock.

## Step-by-step

1. Copy the README authorized users into config/allowed-users.txt (one name per line).
2. Run this op. The unauthorizedNames list is who you bulk-select.
3. Confirm each name is not a required service account, then disable-user or lock-user (and remove-user-from-admins for extra admins).
4. If an allowlist name is missing, do not invent an account unless the README tells you to create it.
5. Re-run until the miss list is empty of humans.

## What “good” looks like

- README humans remain; toor/hacker123/Guest/flag are selected then disabled.
- No hashes in the output. Extra admins dropped to standard users when the README says so.

## Risks / confirm notes

- Read-only selection. Acting on a name is a mutate op with confirm:true.
- Service accounts (www-data, sshd) should not appear — if they do, check the allowlist rather than disabling them.
- Authorized-image only. Never pointed at another team.

## Related ops

- [`flag-suspicious-users`](./flag-suspicious-users.md) — Flag suspicious users
- [`disable-user`](./disable-user.md) — Disable a local user
- [`list-admin-users`](./list-admin-users.md) — List administrators and sudoers
- [`list-users`](./list-users.md) — List local users

