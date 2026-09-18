# Audit at jobs

- **Catalog id:** `audit-at-jobs`
- **Category:** scheduled
- **Platforms:** linux
- **Risk:** read

> List at/batch jobs — unexpected ones are a common plant.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Lists at/batch jobs. Reports the command; does not execute it.

## Why it scores in CyberPatriot

at is easier to miss than cron. A zygote python job is a typical plant.

## When to run it

Right after audit-cron on Linux.

## Step-by-step

1. Run the op. If empty, good.
2. Unexpected jobs: copy the command into notes, then atrm on the image.
3. Investigate the user who queued it (flag-suspicious-users).

## What “good” looks like

- No unexpected at jobs.
- Remaining jobs are README-justified.

## Risks / confirm notes

- Read-only. The reverse-looking command is reported, not executed.
- Do not ‘test’ the job.

## Related ops

- [`audit-cron`](./audit-cron.md) — Audit cron jobs
- [`flag-suspicious-users`](./flag-suspicious-users.md) — Flag suspicious users
- [`find-backdoor-binaries`](./find-backdoor-binaries.md) — Find suspicious binaries
- [`list-scheduled-tasks`](./list-scheduled-tasks.md) — List scheduled tasks

