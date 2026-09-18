# Audit logging configuration

- **Catalog id:** `audit-logging`
- **Category:** logging
- **Platforms:** both
- **Risk:** read

> Is rsyslog/journald/Event Log actually running, and are logs sized sanely?

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Checks logging services and common log files. Disabled logging is a finding because scoring/forensics depend on it.

## Why it scores in CyberPatriot

Images often ship with rsyslog stopped or Security log tiny. You also need logs for forensics questions.

## When to run it

Early-middle of the round, before you need evidence, and as part of the checklist.

## Step-by-step

1. Run the op. If rsyslog/journald/EventLog is inactive, enable it on the image (this op is read-only).
2. Note tiny log sizes and missing auditd (see check-auditd).
3. Do not wipe logs to ‘hide’ your work — that is the opposite of CP.

## What “good” looks like

- Logging service running.
- auth/secure/Security logs exist and are not zeroed.

## Risks / confirm notes

- Read-only.
- Do not send logs off-image to random collectors.

## Related ops

- [`check-auditd`](./check-auditd.md) — Check auditd
- [`audit-powershell-logging`](./audit-powershell-logging.md) — Audit PowerShell logging
- [`export-evidence-bundle`](./export-evidence-bundle.md) — Export evidence bundle
- [`check-ntp`](./check-ntp.md) — Check time synchronization

