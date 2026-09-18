# Audit never-logged-in humans

- **Catalog id:** `audit-never-logged-in`
- **Category:** users
- **Platforms:** both
- **Risk:** read

> Human accounts that have never logged in are often leftover or planted.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Compares lastlog / LastLogon for interactive accounts against the allowlist. Service accounts with nologin are ignored.

## Why it scores in CyberPatriot

Competition images frequently include a never-used admin or a ‘flag’ user waiting for you. Never-logged-in is a cheap, high-signal filter.

## When to run it

Right after list-users; pair with flag-suspicious-users.

## Step-by-step

1. Run the op. Ignore nologin system UIDs.
2. If a never-logged-in name is not on the README, disable or lock it.
3. If it is on the README, it may still be fine — some authorized users simply have not logged in yet.

## What “good” looks like

- Remaining never-logged-in humans are README-authorized.
- Planted names (flag, nologin_admin) are disabled.

## Risks / confirm notes

- Read-only.
- A required user who has not logged in yet is not automatically a backdoor.

## Related ops

- [`flag-suspicious-users`](./flag-suspicious-users.md) — Flag suspicious users
- [`disable-user`](./disable-user.md) — Disable a local user
- [`list-users`](./list-users.md) — List local users
- [`check-user-shells`](./check-user-shells.md) — Check login shells

