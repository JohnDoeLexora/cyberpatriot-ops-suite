# Hunt shell aliases and profile backdoors

- **Catalog id:** `hunt-shell-backdoors`
- **Category:** files
- **Platforms:** both
- **Risk:** read

> Find alias hijacks and wget|sh plants in bashrc/profile (and PowerShell profiles).

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Read-only scan of /etc/profile, bashrc, profile.d, user rc files, and Windows PowerShell profiles for alias sudo=, nc -e, wget|sh, LD_PRELOAD, HISTFILE unset, and /tmp plants. Bend-parallel on Linux. Does not execute the rc files.

## Why it scores in CyberPatriot

A sudo alias or profile wget|sh is a persistence plant that survives user lock. Public kits grep these files; this op ranks the hits.

## When to run it

Files pass with audit-persistence-deep and hunt-sysprep-leftovers.

## Step-by-step

1. Run the op. Open each hit path on the image and snapshot before deleting the plant line.
2. Do not bash -x the rc file — just edit out the plant.
3. Re-run. Pair with audit-ssh-authorized-keys.

## What “good” looks like

- No alias sudo/ls/passwd in rc files.
- No wget|sh / DownloadString in profiles.

## Risks / confirm notes

- Read-only. Deleting a line is a manual edit (or a later mutate).
- Do not execute untrusted rc files to ‘see what they do’.

## Related ops

- [`audit-persistence-deep`](./audit-persistence-deep.md) — Deep startup persistence audit
- [`audit-ssh-authorized-keys`](./audit-ssh-authorized-keys.md) — Audit SSH authorized_keys
- [`find-backdoor-binaries`](./find-backdoor-binaries.md) — Find suspicious binaries
- [`audit-cron`](./audit-cron.md) — Audit cron jobs

