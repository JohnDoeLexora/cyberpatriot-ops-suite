# Enable Success+Failure audit policy

- **Catalog id:** `enable-audit-policy`
- **Category:** logging
- **Platforms:** windows
- **Risk:** mutate

> Turn on Success+Failure auditing for the key Windows categories.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Calls auditpol for Account Logon, Account Management, Logon/Logoff, Policy Change, Privilege Use, and System — Success and Failure. Writes the local Security log; it does not dump that log here.

## Why it scores in CyberPatriot

‘Audit policy not configured’ is a common Windows scoring item and you want those events for your own forensics notes.

## When to run it

Windows logging pass with audit-logging, after apply-security-template or instead of it if you only need auditpol.

## Step-by-step

1. Run with dryRun:true to see the six categories.
2. Live confirm:true.
3. Do not export or upload the Security log off-image.

## What “good” looks like

- Those six categories show Success and Failure.
- Security log is enabled, contents not dumped by this op.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- This is not a remote audit and not a CCS query.

## Related ops

- [`audit-logging`](./audit-logging.md) — Audit logging configuration
- [`apply-security-template`](./apply-security-template.md) — Apply local security template
- [`audit-powershell-logging`](./audit-powershell-logging.md) — Audit PowerShell logging
- [`export-evidence-bundle`](./export-evidence-bundle.md) — Export evidence bundle

