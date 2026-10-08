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

## What it changes

Nothing - read-only audit

## How to undo

Nothing to undo

## When to run it

Right after audit-cron on Linux.

## Step-by-step

1. Run the op. If empty, good.
2. Unexpected jobs: copy the command into notes, then atrm on the image.
3. Investigate the user who queued it (flag-suspicious-users).
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: No unexpected at jobs.

## What “good” looks like

- No unexpected at jobs.
- Remaining jobs are README-justified.

## Risks / confirm notes

- Read-only. The reverse-looking command is reported, not executed.
- Do not ‘test’ the job.
- Common mistake: treating this read-only result as already fixed, or changing the computer before the findings are copied into Team notes.

## Related ops

- [`audit-cron`](./audit-cron.md) — Audit cron jobs
- [`flag-suspicious-users`](./flag-suspicious-users.md) — Flag suspicious users
- [`find-backdoor-binaries`](./find-backdoor-binaries.md) — Find suspicious binaries
- [`list-scheduled-tasks`](./list-scheduled-tasks.md) — List scheduled tasks

