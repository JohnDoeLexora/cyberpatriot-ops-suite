# Audit startup items

- **Catalog id:** `audit-startup-items`
- **Category:** kernel
- **Platforms:** both
- **Risk:** read

> Enabled units, rc.local, Run keys, and Startup folder payloads.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Lists systemd enabled units, rc.local, Windows Run keys, and Startup folder entries. Flags unsigned or temp-path payloads.

## Why it scores in CyberPatriot

rc.local calling /tmp/.kworker or HKCU Run \update.exe is persistence the service list can miss.

## When to run it

Persistence pass on both platforms, with cron/tasks and hidden executables.

## Step-by-step

1. Run the op. Keep required services (sshd) in the enabled list.
2. Remove planted rc.local lines, Run keys, and Startup shortcuts on the image.
3. Delete the payload files after snapshotting.

## What “good” looks like

- sshd/required units still enabled.
- No /tmp payloads in rc.local or Run keys.

## Risks / confirm notes

- Read-only.
- Disabling a required enabled unit here (by later mutate) costs points — README.

## Related ops

- [`audit-cron`](./audit-cron.md) — Audit cron jobs
- [`list-scheduled-tasks`](./list-scheduled-tasks.md) — List scheduled tasks
- [`find-hidden-executables`](./find-hidden-executables.md) — Find hidden executables
- [`list-services`](./list-services.md) — List services
- [`audit-persistence-deep`](./audit-persistence-deep.md) — Deep startup persistence audit

