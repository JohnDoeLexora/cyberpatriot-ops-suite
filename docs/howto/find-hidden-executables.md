# Find hidden executables

- **Catalog id:** `find-hidden-executables`
- **Category:** files
- **Platforms:** both
- **Risk:** read

> Dotfile executables in homes, /tmp, /var/tmp, and Startup folders.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Finds executable files whose names start with ‘.’ under homes, /tmp, /var/tmp, and Windows Startup. Classic planted backdoors. Inventory only.

## Why it scores in CyberPatriot

.hidden_shell and .kworker in /tmp are textbook CP plants. Startup folder .update.exe too.

## When to run it

Files/evidence pass with find-suid-sgid and find-backdoor-binaries.

## Step-by-step

1. Run the op. Record paths for forensics notes.
2. If not needed for a question, remove the executable (and the cron/startup that calls it).
3. Re-run. Pair with audit-cron and audit-startup-items so it does not come back.

## What “good” looks like

- No hidden executables in /tmp, /var/tmp, homes, or Startup.
- Legitimate dotfiles (.bashrc) are not executable.

## Risks / confirm notes

- Read-only inventory. Do not execute the hidden file ‘to see what it does.’
- Snapshot before delete if a forensics question may reference it.

## Related ops

- [`find-backdoor-binaries`](./find-backdoor-binaries.md) — Find suspicious binaries
- [`audit-cron`](./audit-cron.md) — Audit cron jobs
- [`audit-startup-items`](./audit-startup-items.md) — Audit startup items
- [`find-suid-sgid`](./find-suid-sgid.md) — Find SUID/SGID files

