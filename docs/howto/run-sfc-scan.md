# Run system file integrity check

- **Catalog id:** `run-sfc-scan`
- **Category:** windows
- **Platforms:** windows
- **Risk:** read

> Read-only sfc /verifyonly report of Windows system-file integrity.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Runs sfc /verifyonly and returns a truncated integrity report. It does not repair (that would be /scannow) and does not dump WinSxS payloads.

## Why it scores in CyberPatriot

Planted system files and a broken component store show up here. Knowing SFC is dirty tells you to snapshot and then repair on the image.

## When to run it

When you suspect tampered system files, after audit-hosts-file, before a long update pass.

## Step-by-step

1. Run the op. It can take several minutes on a real image.
2. If violations name hosts or system DLLs, pair with clear-suspicious-hosts / apply-security-updates.
3. Repair (sfc /scannow) is a separate admin action — this op stays read-only.

## What “good” looks like

- Windows Resource Protection did not find integrity violations.
- No WinSxS dump in the output.

## Risks / confirm notes

- Read-only. Still slow — do not block the whole team on it at T+0.
- Authorized-image only.

## Related ops

- [`audit-hosts-file`](./audit-hosts-file.md) — Audit hosts file
- [`apply-security-updates`](./apply-security-updates.md) — Apply security updates
- [`audit-critical-perm-drift`](./audit-critical-perm-drift.md) — Audit critical permission drift
- [`enable-windows-defender`](./enable-windows-defender.md) — Enable Microsoft Defender

