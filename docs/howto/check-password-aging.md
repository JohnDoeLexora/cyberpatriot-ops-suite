# Check password aging

- **Catalog id:** `check-password-aging`
- **Category:** auth
- **Platforms:** linux
- **Risk:** read

> Spot human accounts with max days -1/99999 or aging disabled.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Parses chage/shadow aging fields without hashes. Flags unlimited max age on human accounts.

## Why it scores in CyberPatriot

PASS_MAX_DAYS 99999 is a default the scoring engine loves to ding. Root aging disabled is often OK; bob with 99999 is not.

## When to run it

Linux auth pass, with audit-password-policy.

## Step-by-step

1. Run the op. Ignore system accounts.
2. For humans with 99999/-1: either enforce-password-policy (global) or chage the user; this op is read-only.
3. Re-check authorized users after policy apply.

## What “good” looks like

- Human max age in a sane range (e.g. 90).
- No hashes printed.

## Risks / confirm notes

- Read-only.
- Do not expire a required service account that cannot interactively change a password.

## Related ops

- [`enforce-password-policy`](./enforce-password-policy.md) — Enforce password policy
- [`expire-user-password`](./expire-user-password.md) — Expire a user password
- [`audit-password-policy`](./audit-password-policy.md) — Audit password policy

