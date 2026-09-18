# Audit critical permission drift

- **Catalog id:** `audit-critical-perm-drift`
- **Category:** files
- **Platforms:** both
- **Risk:** read

> Mode/ACL check for shadow, sudoers, SSH host keys, and Windows SAM — no dumps.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Read-only mode/ACL check for /etc/shadow, gshadow, sudoers, ssh host keys, and Windows SAM/SYSTEM ACLs via icacls. Flags world-readable shadow or Everyone-readable SAM. Does not dump SAM, hashes, or private keys.

## Why it scores in CyberPatriot

World-readable shadow or a 0666 sudoers file is a classic plant. Scoring checks modes; hashes must never leave the box.

## When to run it

Linux/Windows files pass with check-sensitive-file-perms.

## Step-by-step

1. Run the op. Treat 0644 shadow, 0666 sudoers, or Everyone:(R) on SAM as fire.
2. Fix modes on the image (typically shadow 000/640 root:shadow, sudoers 440, host keys 600). This op does not mutate.
3. Re-run. Pair with find-world-writable so a writable sudoers.d file does not sneak back.

## What “good” looks like

- shadow/gshadow not world-readable.
- sudoers 440/400, ssh host keys 600.
- SAM/SYSTEM not Everyone-readable. No hashes in the result.

## Risks / confirm notes

- Read-only. Never dump SAM, shadow hashes, or private keys into notes.
- chmod of /usr host keys is fine; do not chmod -R /etc blindly.

## Related ops

- [`check-sensitive-file-perms`](./check-sensitive-file-perms.md) — Check sensitive file permissions
- [`find-world-writable`](./find-world-writable.md) — Find world-writable files
- [`audit-sudoers`](./audit-sudoers.md) — Audit sudoers
- [`audit-ssh-authorized-keys`](./audit-ssh-authorized-keys.md) — Audit SSH authorized_keys

