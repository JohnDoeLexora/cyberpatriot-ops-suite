# Audit sudoers

- **Catalog id:** `audit-sudoers`
- **Category:** auth
- **Platforms:** linux
- **Risk:** read

> Find NOPASSWD, unexpected ALL=(ALL), and world-writable sudoers files.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reads /etc/sudoers and sudoers.d. Does not execute sudo as other users.

## Why it scores in CyberPatriot

NOPASSWD: ALL for a random user is a planted privilege path. World-writable sudoers is even worse because anyone can add themselves.

## What it changes

Nothing - read-only audit

## How to undo

Nothing to undo

## When to run it

With list-admin-users on Linux. Before you demote users.

## Step-by-step

1. Run the op. Note NOPASSWD lines and files that are world-writable.
2. Compare sudoers names to the README admins.
3. World-writable sudoers files: fix permissions with check-sensitive-file-perms follow-up; do not leave 0666.
4. Unexpected NOPASSWD users: remove-user-from-admins or edit sudoers via visudo on the image (not this read op).
5. How to verify: run this check again and compare the output to the image README. You are done when this is true: Only README admins have sudo.

## What “good” looks like

- Only README admins have sudo.
- No NOPASSWD unless the README truly requires a specific command.
- sudoers files not world-writable.

## Risks / confirm notes

- Read-only. A syntax error in sudoers can lock out sudo — use visudo if you edit by hand.
- This is not a privilege-escalation cookbook.
- Common mistake: treating this read-only result as already fixed, or changing the computer before the findings are copied into Team notes.

## Related ops

- [`list-admin-users`](./list-admin-users.md) — List administrators and sudoers
- [`remove-user-from-admins`](./remove-user-from-admins.md) — Remove user from administrators
- [`check-sensitive-file-perms`](./check-sensitive-file-perms.md) — Check sensitive file permissions
- [`find-world-writable`](./find-world-writable.md) — Find world-writable files

