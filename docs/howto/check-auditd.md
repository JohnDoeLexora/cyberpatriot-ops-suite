# Check auditd

- **Catalog id:** `check-auditd`
- **Category:** logging
- **Platforms:** linux
- **Risk:** read

> Is auditd installed, enabled, and watching identity files?

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Checks auditd/auditctl presence, enabled flag, and a few expected rules (identity changes, sudoers writes). Does not flood the disk with new rules in read mode.

## Why it scores in CyberPatriot

auditd off is a Linux logging finding. Watches on /etc/passwd are the usual expected rules.

## When to run it

Linux logging pass with audit-logging.

## Step-by-step

1. Run the op. If missing/inactive, install/enable on the image (read-only here).
2. If running but no watches, add conservative watches via the OS — do not paste huge rule packs you do not understand.
3. Re-run. Pair with audit-logging so rsyslog/journald is also alive.

## What “good” looks like

- auditd active.
- Watches on /etc/passwd, /etc/sudoers (or distro equivalent).

## Risks / confirm notes

- Read-only in this op.
- Aggressive audit rules can fill the disk and take the image down — keep it conservative.

## Related ops

- [`audit-logging`](./audit-logging.md) — Audit logging configuration
- [`check-sensitive-file-perms`](./check-sensitive-file-perms.md) — Check sensitive file permissions
- [`audit-sudoers`](./audit-sudoers.md) — Audit sudoers

