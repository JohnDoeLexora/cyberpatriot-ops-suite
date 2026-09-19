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

## When to run it

Right after audit-hosts-file shows sinkholes, before apply-security-updates.

## Step-by-step

1. Run audit-hosts-file. Note which names are pinned to 127.0.0.1 / 0.0.0.0.
2. dryRun:true — wouldDrop should match those lines.
3. Live confirm:true. Re-run audit-hosts-file. Then check-ntp / apply-security-updates.

## What “good” looks like

- Only localhost (and 127.0.1.1 hostname) remain.
- Windows Update / AV names resolve normally again.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- If the README documents a required local hostname mapping, dryRun first so you do not drop it.

## Related ops

- [`audit-hosts-file`](./audit-hosts-file.md) — Audit hosts file
- [`apply-security-updates`](./apply-security-updates.md) — Apply security updates
- [`enable-windows-defender`](./enable-windows-defender.md) — Enable Microsoft Defender
- [`check-ntp`](./check-ntp.md) — Check time synchronization

