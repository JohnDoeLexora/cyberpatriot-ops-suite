# List scheduled tasks

- **Catalog id:** `list-scheduled-tasks`
- **Category:** scheduled
- **Platforms:** windows
- **Risk:** read

> Non-Microsoft scheduled tasks with TEMP/Startup payloads.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Lists non-Microsoft scheduled tasks. Highlights user-writable actions, missing authors, and payloads under TEMP or Startup.

## Why it scores in CyberPatriot

Windows persistence often lives in Task Scheduler as ‘Updater’ running %TEMP%\svc.exe.

## What it changes

Nothing - read-only audit

## How to undo

Nothing to undo

## When to run it

Windows persistence pass with audit-startup-items.

## Step-by-step

1. Run the op. Ignore signed Microsoft tasks unless the action looks hijacked.
2. Disable/delete planted tasks on the image; remove the payload file after snapshotting.
3. Re-run and check Startup folders via audit-startup-items.
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: No user tasks pointing at TEMP or Startup binaries.

## What “good” looks like

- No user tasks pointing at TEMP or Startup binaries.
- Remaining third-party tasks are README software.

## Risks / confirm notes

- Read-only.
- Disabling a required vendor updater can be wrong — README/software list first.
- Common mistake: treating this read-only result as already fixed, or changing the computer before the findings are copied into Team notes.

## Related ops

- [`audit-startup-items`](./audit-startup-items.md) — Audit startup items
- [`find-hidden-executables`](./find-hidden-executables.md) — Find hidden executables
- [`find-backdoor-binaries`](./find-backdoor-binaries.md) — Find suspicious binaries
- [`audit-cron`](./audit-cron.md) — Audit cron jobs

