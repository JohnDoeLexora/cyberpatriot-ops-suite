# Clear suspicious hosts-file entries

- **Catalog id:** `clear-suspicious-hosts`
- **Category:** network
- **Platforms:** both
- **Risk:** mutate

> Remove hosts-file sinkholes of Windows Update, AV, and public names.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Rewrites /etc/hosts or drivers\etc\hosts dropping loopback/unspecified mappings for vendor and well-known names. Keeps localhost and the machine hostname. Complements audit-hosts-file.

## Why it scores in CyberPatriot

Blocking windowsupdate.microsoft.com in hosts is a classic plant that also stops patches and Defender signatures.

## What it changes

Rewrites /etc/hosts on Linux and %SystemRoot%\System32\drivers\etc\hosts on Windows, dropping only sinkhole lines whose names match update, antivirus, or major site names. Comments and other lines stay.

## How to undo

If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. Put a removed line back only if you are sure it was legitimate. The backup copy of the hosts file is the safe source.

## When to run it

Right after audit-hosts-file shows sinkholes, before apply-security-updates.

## Step-by-step

1. Run audit-hosts-file. Note which names are pinned to 127.0.0.1 / 0.0.0.0.
2. dryRun:true — wouldDrop should match those lines.
3. Live confirm:true. Re-run audit-hosts-file. Then check-ntp / apply-security-updates.
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: Only localhost (and 127.0.1.1 hostname) remain.

## What “good” looks like

- Only localhost (and 127.0.1.1 hostname) remain.
- Windows Update / AV names resolve normally again.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- If the README documents a required local hostname mapping, dryRun first so you do not drop it.
- Common mistake: confirming the live change before the account, service, or file matches the image README, or skipping the dry-run preview.

## Related ops

- [`audit-hosts-file`](./audit-hosts-file.md) — Audit hosts file
- [`apply-security-updates`](./apply-security-updates.md) — Apply security updates
- [`enable-windows-defender`](./enable-windows-defender.md) — Enable Microsoft Defender
- [`check-ntp`](./check-ntp.md) — Check time synchronization

