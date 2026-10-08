# Find SUID/SGID files

- **Catalog id:** `find-suid-sgid`
- **Category:** files
- **Platforms:** linux
- **Risk:** read

> List setuid/setgid binaries and flag copies under /tmp /home /opt.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Compares SUID/SGID files to a small expected set (passwd, sudo, su, newgrp, ping). SUID copies under /tmp /home /opt /var are critical. Read-only find; does not exploit them.

## Why it scores in CyberPatriot

A SUID bash in /tmp is a planted root shell. Expected SUID like /usr/bin/passwd is fine.

## What it changes

Nothing - read-only audit

## How to undo

Nothing to undo

## When to run it

Linux files pass, with find-hidden-executables and find-backdoor-binaries.

## Step-by-step

1. Run the op. Ignore the known-good set unless the path is wrong.
2. Anything under /tmp, /home, /opt, /var: snapshot for notes, then remove the SUID bit or the file per team policy.
3. Re-run until only expected system binaries remain.
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: Expected: passwd, sudo, su, ping, newgrp in /usr.

## What “good” looks like

- Expected: passwd, sudo, su, ping, newgrp in /usr.
- No /tmp/suid_bash, no hidden shells in homes.

## Risks / confirm notes

- Read-only. This is not a guide to using SUID bash.
- Removing SUID from /usr/bin/passwd will break password changes — only touch unexpected paths.
- Common mistake: treating this read-only result as already fixed, or changing the computer before the findings are copied into Team notes.

## Related ops

- [`find-hidden-executables`](./find-hidden-executables.md) — Find hidden executables
- [`find-backdoor-binaries`](./find-backdoor-binaries.md) — Find suspicious binaries
- [`find-world-writable`](./find-world-writable.md) — Find world-writable files
- [`audit-cron`](./audit-cron.md) — Audit cron jobs

