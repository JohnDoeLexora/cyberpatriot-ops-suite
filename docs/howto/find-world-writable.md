# Find world-writable files

- **Catalog id:** `find-world-writable`
- **Category:** files
- **Platforms:** linux
- **Risk:** read

> Hunt world-writable files, especially sudoers, cron, and PATH dirs.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Finds world-writable files and directories under /home /etc /opt /tmp /var /usr/local (capped). World-writable sudoers, cron, or PATH dirs are high. Local filesystem only.

## Why it scores in CyberPatriot

0777 on /etc/cron.d/hack or /usr/local/bin is a persistence gift. Scoring checks these paths; this is an inventory, not an exploit of them.

## When to run it

Linux files pass, with check-sensitive-file-perms and audit-cron.

## Step-by-step

1. Run the op. Prioritize /etc, cron, sudoers, and directories on PATH.
2. Fix modes on the image (chmod o-w, or delete planted scripts after you snapshot them for forensics).
3. Re-run. Sticky /tmp is expected; 0777 /usr/local/bin is not.

## What “good” looks like

- No world-writable sudoers or cron files.
- PATH directories not writable by others.
- /tmp may be 1777 (sticky) — that is OK.

## Risks / confirm notes

- Read-only. chmod/delete is a separate action — snapshot first if a forensics question might need the file.
- Do not ‘test’ world-writable sudoers by writing to them.

## Related ops

- [`check-sensitive-file-perms`](./check-sensitive-file-perms.md) — Check sensitive file permissions
- [`audit-cron`](./audit-cron.md) — Audit cron jobs
- [`audit-sudoers`](./audit-sudoers.md) — Audit sudoers
- [`audit-sticky-tmp`](./audit-sticky-tmp.md) — Audit sticky bit on temp dirs

