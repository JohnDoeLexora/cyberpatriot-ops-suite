# Audit sticky bit on temp dirs

- **Catalog id:** `audit-sticky-tmp`
- **Category:** files
- **Platforms:** linux
- **Risk:** read

> Confirm /tmp is 1777 (sticky) and flag world-writable temp dirs without sticky.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Checks /tmp, /var/tmp, and /dev/shm for the sticky bit and inventories world-writable temp paths missing it. 0777 /tmp without sticky is a plant; sticky /tmp is expected. Local filesystem only; Bend-parallel when available.

## Why it scores in CyberPatriot

Without sticky, anyone can delete or replace files in /tmp — including other users’ work and planted droppers. Scoring checks 1777 on shared temp dirs.

## When to run it

Linux files pass with find-world-writable. /tmp 1777 is the common “this is fine” exception that this op makes explicit.

## Step-by-step

1. Run the op. /tmp and /var/tmp should be 1777 (drwxrwxrwt).
2. If /tmp is 0777, chmod 1777 /tmp on the image (that chmod is not this op).
3. World-writable subdirs under /tmp without sticky: snapshot, then chmod +t or remove the plant.
4. Re-run. Pair with find-world-writable so a 0777 /usr/local/bin is not missed.

## What “good” looks like

- /tmp and /var/tmp are 1777.
- No extra 0777 directories under temp mounts.

## Risks / confirm notes

- Read-only. chmod is a separate action.
- Do not chmod 1777 on /usr or /home — only shared temp dirs.

## Related ops

- [`find-world-writable`](./find-world-writable.md) — Find world-writable files
- [`check-sensitive-file-perms`](./check-sensitive-file-perms.md) — Check sensitive file permissions
- [`audit-home-permissions`](./audit-home-permissions.md) — Audit home directory permissions
- [`find-suid-sgid`](./find-suid-sgid.md) — Find SUID/SGID files

