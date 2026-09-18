# Check login shells

- **Catalog id:** `check-user-shells`
- **Category:** users
- **Platforms:** linux
- **Risk:** read

> Interactive users get a real shell; system users should not.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reports login shells. Humans should be bash/sh (or the distro default). System users should be nologin/false. Interpreters, /tmp shells, and empty shells are suspicious.

## Why it scores in CyberPatriot

A python3 or /tmp/shell login shell is a planted backdoor pattern. A system UID with /bin/bash is also a finding.

## When to run it

During the Linux user pass, with audit-uid-zero and flag-suspicious-users.

## Step-by-step

1. Run the op on the Linux image.
2. For each weird shell: check the README, then disable the user or set a proper shell via the OS — this op itself is read-only.
3. System accounts with bash: report and typically lock/nologin them if not required.

## What “good” looks like

- Authorized humans: /bin/bash or /bin/sh.
- UID < 1000 (except root): nologin or false.
- No /tmp/*, no python/perl as a login shell.

## Risks / confirm notes

- Read-only. Changing shells is a separate system change; prefer disable-user if the account is unauthorized.
- csh/zsh is not automatically evil — but on a bash CP image it is unusual; check the README.

## Related ops

- [`flag-suspicious-users`](./flag-suspicious-users.md) — Flag suspicious users
- [`disable-user`](./disable-user.md) — Disable a local user
- [`audit-uid-zero`](./audit-uid-zero.md) — Audit UID 0 accounts
- [`find-hidden-executables`](./find-hidden-executables.md) — Find hidden executables

