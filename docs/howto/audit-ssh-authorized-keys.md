# Audit SSH authorized_keys

- **Catalog id:** `audit-ssh-authorized-keys`
- **Category:** files
- **Platforms:** linux
- **Risk:** read

> Inventory authorized_keys comments and unexpected extra keys.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Finds ~/.ssh/authorized_keys (and odd paths). Reports fingerprints and comments, not private keys. Comments like hacker@evil are plants.

## Why it scores in CyberPatriot

A planted key on root is silent remote access. Scoring and persistence hunts both care.

## When to run it

With ssh-hardening-audit, after you know which users should exist.

## Step-by-step

1. Run the op. Root should have no random keys unless the README says so.
2. Remove unexpected public keys on the image (delete the line or the file). Snapshot comments into notes first.
3. Investigate authorized_keys living in /var/tmp or /tmp — that is persistence.

## What “good” looks like

- Only keys you can justify from the README/coach.
- No private key material in the output.
- No authorized_keys in /tmp or /var/tmp.

## Risks / confirm notes

- Read-only.
- Deleting the only authorized key can lock SSH if passwords are also off — have console.

## Related ops

- [`ssh-hardening-audit`](./ssh-hardening-audit.md) — SSH hardening audit
- [`harden-sshd`](./harden-sshd.md) — Harden sshd_config
- [`find-hidden-executables`](./find-hidden-executables.md) — Find hidden executables
- [`list-users`](./list-users.md) — List local users

