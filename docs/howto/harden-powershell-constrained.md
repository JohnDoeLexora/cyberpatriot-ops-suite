# Harden PowerShell logging / Constrained Language

- **Catalog id:** `harden-powershell-constrained`
- **Category:** windows
- **Platforms:** windows
- **Risk:** mutate

> Turn on Script Block/Module logging and local transcription; optional Constrained Language.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Enables the three PowerShell logging policies and writes transcripts under a local ProgramData path. Optional constrainedLanguage=true sets Constrained Language Mode. Deepens the read-only audit-powershell-logging.

## Why it scores in CyberPatriot

Script Block Logging off is a Windows logging finding and you want those events for your own notes. Transcription must stay on-image.

## When to run it

Windows logging pass after audit-powershell-logging and enable-audit-policy.

## Step-by-step

1. Run audit-powershell-logging so you know which of the three are off.
2. dryRun:true, then live confirm:true. Leave constrainedLanguage false unless the README wants lock-down — it can break local admin scripts.
3. Confirm the transcript directory is local (ProgramData), not a remote share.

## What “good” looks like

- Script Block Logging, Module Logging, and Transcription on.
- Transcript path is local. LanguageMode still FullLanguage unless you opted in.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Constrained Language can break this suite’s own PowerShell engine if you set it on the account you use to run ops. Default is logging only.
- Do not ship transcripts off-image.

## Related ops

- [`audit-powershell-logging`](./audit-powershell-logging.md) — Audit PowerShell logging
- [`enable-audit-policy`](./enable-audit-policy.md) — Enable Success+Failure audit policy
- [`audit-logging`](./audit-logging.md) — Audit logging configuration
- [`export-evidence-bundle`](./export-evidence-bundle.md) — Export evidence bundle

