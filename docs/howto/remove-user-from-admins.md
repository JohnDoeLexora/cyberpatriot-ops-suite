# Remove user from administrators

- **Catalog id:** `remove-user-from-admins`
- **Category:** users
- **Platforms:** both
- **Risk:** mutate

> Drop extra sudo/Administrators members down to standard users.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Removes a user from Administrators / sudo / wheel. The account stays enabled as a normal user — preferred when the README lists them as standard, not admin.

## Why it scores in CyberPatriot

Extra admins are high-value points. Deleting the user can be wrong if they are a required standard account; demoting them is the kosher fix.

## When to run it

After list-admin-users. Anyone in sudo/Administrators who is not an authorized admin on the README.

## Step-by-step

1. Run list-admin-users and tick README-approved admins.
2. For extras, confirm they should remain as standard users (not disabled entirely).
3. dryRun:true, then live with confirm:true and the username.
4. Re-run list-admin-users; they should disappear from sudo/Administrators but still appear in list-users.

## What “good” looks like

- sudo/Administrators matches the README allowlist.
- Demoted users can still exist as standard accounts.
- root / Administrator RID-500 remains as expected for the OS.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Removing the last authorized admin can lock your team out of the image — keep one README admin.
- Do not confuse this with disable-user.

## Related ops

- [`list-admin-users`](./list-admin-users.md) — List administrators and sudoers
- [`audit-sudoers`](./audit-sudoers.md) — Audit sudoers
- [`list-groups`](./list-groups.md) — List local groups
- [`disable-user`](./disable-user.md) — Disable a local user

