# Sync users from allowlists

- **Catalog id:** `sync-authorized-users`
- **Category:** users
- **Platforms:** both
- **Risk:** mutate

> Create missing README users (no passwords invented) and flag extras.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reads config/allowed-users.txt and config/allowed-admins.txt. Creates missing humans without a password and lists setPasswordManually. Adds missing admins to sudo/Administrators. Extra interactive users and extra admins are flagged — not auto-disabled. Bend-parallel user sweep when available.

## Why it scores in CyberPatriot

Public kits sync users.txt/admins.txt at round start. Creating missing README users scores; planted extras must still be disabled by hand so you do not nuke a required account.

## What it changes

On Linux it runs useradd -m -s /bin/bash for missing allowlist names (no password is set) and usermod -aG sudo or wheel for names in allowed-admins.txt. On Windows it runs New-LocalUser -NoPassword for missing names and Add-LocalGroupMember Administrators for the admin list. You must set each new password yourself.

## How to undo

If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. Delete a user this op created only if they were not on the README: Linux userdel, Windows Remove-LocalUser. Remove an admin group membership with gpasswd -d or Remove-LocalGroupMember if you added the wrong name.

## When to run it

Right after you paste the README lists into the two config files. Before disable-user.

## Step-by-step

1. Copy the README user list into config/allowed-users.txt and admins into config/allowed-admins.txt (see also config/examples/).
2. dryRun:true. Read missingToCreate, extras, extraAdmins, and setPasswordManually.
3. Live confirm:true creates missing accounts with no password. Immediately set those passwords yourself (passwd / lusrmgr).
4. Hand extras to disable-user / lock-user and extra admins to remove-user-from-admins — this op will not auto-disable them.
5. How to verify: run this check again and compare the output to the image README. You are done when this is true: Every README human exists. New accounts have ‘set password manually’ and no password in the output.

## What “good” looks like

- Every README human exists. New accounts have ‘set password manually’ and no password in the output.
- Extras are listed with remediation disable-user, not silently deleted.

## Risks / confirm notes

- Mutation (creates/group-adds). Live requires confirm:true.
- Never invents passwords. Empty/locked new accounts cannot log in until you set one.
- Do not put passwords in the allowlist files.
- Common mistake: confirming the live change before the account, service, or file matches the image README, or skipping the dry-run preview.

## Related ops

- [`select-unauthorized-users`](./select-unauthorized-users.md) — Select unauthorized users (allowlist miss)
- [`disable-user`](./disable-user.md) — Disable a local user
- [`list-admin-users`](./list-admin-users.md) — List administrators and sudoers
- [`force-password-change`](./force-password-change.md) — Force password change at next logon

