# Audit cron jobs

- **Catalog id:** `audit-cron`
- **Category:** scheduled
- **Platforms:** linux
- **Risk:** read

> Inventory crontabs and flag wget|sh, /tmp payloads, and world-writable cron files.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reads /etc/crontab, cron.d, cron.*, and user crontabs. Flags nc/wget|sh, curl-to-pipe, /tmp executables, and world-writable cron files.

## Why it scores in CyberPatriot

Cron is the usual persistence for planted bash in /tmp. World-writable cron.d is a finding even before you read the command.

## When to run it

Linux persistence pass with audit-at-jobs, audit-startup-items, and find-hidden-executables.

## Step-by-step

1. Run the op. Snapshot suspicious command lines into forensics notes.
2. Remove planted cron files/lines on the image; chmod world-writable cron dirs.
3. Delete or disable the payload they called (see find-hidden-executables).
4. Re-run until only system/README jobs remain.

## What “good” looks like

- No wget|sh or /tmp/suid_bash jobs.
- cron.d files not world-writable.
- Authorized backup/logrotate jobs still present.

## Risks / confirm notes

- Read-only. Do not run the cron command ‘to see what it does.’
- Deleting distro logrotate/cron can break logging — only remove plants.

## Related ops

- [`audit-at-jobs`](./audit-at-jobs.md) — Audit at jobs
- [`find-hidden-executables`](./find-hidden-executables.md) — Find hidden executables
- [`find-world-writable`](./find-world-writable.md) — Find world-writable files
- [`audit-startup-items`](./audit-startup-items.md) — Audit startup items

