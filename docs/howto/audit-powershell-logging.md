# Audit PowerShell logging

- **Catalog id:** `audit-powershell-logging`
- **Category:** windows
- **Platforms:** windows
- **Risk:** read

> Check Module Logging, Script Block Logging, and Transcription.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reads PowerShell logging policy. Enabling these is kosher evidence collection on the local image.

## Why it scores in CyberPatriot

ScriptBlockLogging off is a Windows logging finding and hurts your own forensics notes.

## What it changes

Nothing - read-only audit

## How to undo

Nothing to undo

## When to run it

Windows logging pass with audit-logging.

## Step-by-step

1. Run the op. Note which of the three are off.
2. Enable them via local policy/registry on the image (this op is read-only).
3. Re-run. Transcription path should be a local directory, not a remote share you do not control.
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: Script Block Logging on.

## What “good” looks like

- Script Block Logging on.
- Module Logging on.
- Transcription on to a local path if the README/policy expects it.

## Risks / confirm notes

- Read-only here.
- Do not ship transcripts off-image. This is not unconstrained attack scripting.
- Common mistake: treating this read-only result as already fixed, or changing the computer before the findings are copied into Team notes.

## Related ops

- [`audit-logging`](./audit-logging.md) — Audit logging configuration
- [`export-evidence-bundle`](./export-evidence-bundle.md) — Export evidence bundle
- [`enable-windows-defender`](./enable-windows-defender.md) — Enable Microsoft Defender

