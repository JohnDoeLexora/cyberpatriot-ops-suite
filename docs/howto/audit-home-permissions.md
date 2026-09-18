# Audit home directory permissions

- **Catalog id:** `audit-home-permissions`
- **Category:** files
- **Platforms:** linux
- **Risk:** read

> Homes should not be 777 or owned by the wrong user.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Checks that homes are not group/world writable or owned by another user. Mode 777 homes and root-owned user homes are findings.

## Why it scores in CyberPatriot

Open homes leak keys and answers. Root-owned /home/alice can also block the user — both get dinged.

## When to run it

Linux files pass with check-sensitive-file-perms.

## Step-by-step

1. Run the op. Note 0777 homes, root-owned user homes, and homes in /tmp.
2. Fix ownership/mode on the image (typically 750/700, user:user).
3. Homes in /tmp for planted UID 0 users: disable the user rather than ‘fixing’ a /tmp home.

## What “good” looks like

- Each authorized user’s home is owned by that user, not world-writable.
- No /tmp/toor as a real home for a live account.

## Risks / confirm notes

- Read-only.
- chmod 700 on a required shared home could break a scored app — README first.

## Related ops

- [`check-sensitive-file-perms`](./check-sensitive-file-perms.md) — Check sensitive file permissions
- [`find-world-writable`](./find-world-writable.md) — Find world-writable files
- [`audit-ssh-authorized-keys`](./audit-ssh-authorized-keys.md) — Audit SSH authorized_keys
- [`disable-user`](./disable-user.md) — Disable a local user

