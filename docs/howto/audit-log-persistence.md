# Audit rsyslog/journald persistence

- **Catalog id:** `audit-log-persistence`
- **Category:** logging
- **Platforms:** linux
- **Risk:** read

> Check journald Storage=persistent and rsyslog actually running.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reads journald.conf Storage, /var/log/journal presence, and rsyslog active state. Complements audit-logging: this is persistence, not just ‘is a daemon installed’.

## Why it scores in CyberPatriot

Volatile journald loses forensics evidence across reboot. Scoring and your own write-ups both need logs that stick.

## What it changes

Nothing - read-only audit

## How to undo

Nothing to undo

## When to run it

Linux logging pass with audit-logging and check-auditd.

## Step-by-step

1. Run the op. Storage=volatile or missing /var/log/journal is the finding.
2. Set Storage=persistent in journald.conf on the image (this op is read-only) and mkdir /var/log/journal.
3. Do not ship logs off-image or to the CCS.
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: journald Storage=persistent (or /var/log/journal present) and rsyslog active.

## What “good” looks like

- journald Storage=persistent (or /var/log/journal present) and rsyslog active.
- Logs were not exported off-image.

## Risks / confirm notes

- Read-only. Editing journald.conf is a separate action.
- Do not upload the journal to a coach laptop that is not the authorized image.
- Common mistake: treating this read-only result as already fixed, or changing the computer before the findings are copied into Team notes.

## Related ops

- [`audit-logging`](./audit-logging.md) — Audit logging configuration
- [`check-auditd`](./check-auditd.md) — Check auditd
- [`export-evidence-bundle`](./export-evidence-bundle.md) — Export evidence bundle
- [`export-coach-packet`](./export-coach-packet.md) — Export redacted coach packet ZIP

