# Deep startup persistence audit

- **Catalog id:** `audit-persistence-deep`
- **Category:** scheduled
- **Platforms:** both
- **Risk:** read

> Deeper persistence: systemd, rc.local, cron, profile.d, Run keys, Startup, tasks.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Goes beyond audit-startup-items: systemd enabled units, rc.local, cron/cron.d, /etc/profile.d, user autostart, Windows Run/RunOnce, Startup folder, and non-Microsoft scheduled tasks. Flags temp-path payloads, wget|sh, and interpreter plants. Inventory only.

## Why it scores in CyberPatriot

Plants hide in profile.d and RunOnce after you cleaned rc.local. One pass over every autostart class is faster than four separate eyeballs.

## When to run it

Persistence pass on both platforms, after the first startup/cron sweep, and again near the end.

## Step-by-step

1. Run the op. Keep required units (sshd) enabled.
2. Snapshot suspicious rc.local / cron / profile.d / Run / Startup payloads into team notes.
3. Remove the planted lines/tasks on the image, then delete the payload files if forensics does not need them.
4. Re-run plus audit-cron and find-hidden-executables so the plant does not return.

## What “good” looks like

- No /tmp payloads in rc.local, cron, profile.d, or Run keys.
- No wget|sh or interpreter plants.
- Required services still enabled.

## Risks / confirm notes

- Read-only inventory. Do not execute the payload ‘to confirm.’
- Disabling a required enabled unit later costs points — README.

## Related ops

- [`audit-startup-items`](./audit-startup-items.md) — Audit startup items
- [`audit-cron`](./audit-cron.md) — Audit cron jobs
- [`list-scheduled-tasks`](./list-scheduled-tasks.md) — List scheduled tasks
- [`find-hidden-executables`](./find-hidden-executables.md) — Find hidden executables

