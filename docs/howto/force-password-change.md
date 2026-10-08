# Force password change at next logon

- **Catalog id:** `force-password-change`
- **Category:** users
- **Platforms:** both
- **Risk:** mutate

> Expire passwords so authorized users must change at next logon (bulk or one name).

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

chage -d 0 or net user /logonpasswordchg:yes. Pass username for one account; omit it to bulk-expire humans on allowed-users.txt (root/Administrator skipped in bulk). Deepens expire-user-password. Never invents or prints passwords.

## Why it scores in CyberPatriot

README users often still have the default password. Forcing a change is the kosher way to rotate without embedding a new password in the tool.

## What it changes

On Linux it runs chage -d 0. One username expires that account; with no username it expires each allowlisted human except root. On Windows it runs net user <name> /logonpasswordchg:yes for the named user or for allowlisted names other than built-in system accounts.

## How to undo

If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. After the person sets a new password, the flag clears itself. To cancel before they log in, set a real password and clear the flag (chage -d today, or net user /logonpasswordchg:no).

## When to run it

After sync-authorized-users and enforce-password-policy, before you walk away from the account pane.

## Step-by-step

1. Put the README humans in config/allowed-users.txt.
2. dryRun:true with no username to see the bulk list, or with username for one account.
3. Live confirm:true. Then log on as that user (or tell the teammate) to set a strong password — this op will not set one for you.
4. Do not expire a service account. Skip names the README says must keep a known password for a scored service.
5. How to verify: run this check again and compare the output to the image README. You are done when this is true: Authorized humans must change password at next logon.

## What “good” looks like

- Authorized humans must change password at next logon.
- Output has no password values — only names.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Bulk mode skips root/Administrator so you are not locked out of the console account.
- Never invents passwords and never prints them.
- Common mistake: confirming the live change before the account, service, or file matches the image README, or skipping the dry-run preview.

## Related ops

- [`expire-user-password`](./expire-user-password.md) — Expire a user password
- [`enforce-password-policy`](./enforce-password-policy.md) — Enforce password policy
- [`sync-authorized-users`](./sync-authorized-users.md) — Sync users from allowlists
- [`check-password-aging`](./check-password-aging.md) — Check password aging

