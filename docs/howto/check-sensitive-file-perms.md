# Check sensitive file permissions

- **Catalog id:** `check-sensitive-file-perms`
- **Category:** files
- **Platforms:** linux
- **Risk:** read

> passwd/shadow/sudoers/ssh host keys should not be world-readable or writable.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Verifies /etc/passwd, shadow, gshadow, group, sudoers, ssh host keys, crontab. shadow should be 000/640 root:shadow — never world-readable. Does not print shadow contents.

## Why it scores in CyberPatriot

World-readable shadow and 0666 sudoers are high findings. The check is permissions, not hash dumping.

## When to run it

Linux files pass, early — these files are also forensics-critical.

## Step-by-step

1. Run the op. Anything on shadow/sudoers/ssh keys that is world-readable or writable is urgent.
2. Fix modes on the image (e.g. shadow 640, sudoers 440, host keys 600).
3. Re-run. Pair with audit-sudoers if sudoers was writable.

## What “good” looks like

- shadow not world-readable, sudoers not writable by others, ssh host keys 600.
- No file contents of shadow in the output.

## Risks / confirm notes

- Read-only. Never cat shadow into notes or tickets.
- Wrong chmod on ssh host keys can break sshd — keep sshd running if required.

## Related ops

- [`audit-sudoers`](./audit-sudoers.md) — Audit sudoers
- [`find-world-writable`](./find-world-writable.md) — Find world-writable files
- [`harden-sshd`](./harden-sshd.md) — Harden sshd_config
- [`export-evidence-bundle`](./export-evidence-bundle.md) — Export evidence bundle

