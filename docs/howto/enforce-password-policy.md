# Enforce password policy

- **Catalog id:** `enforce-password-policy`
- **Category:** auth
- **Platforms:** both
- **Risk:** mutate

> Apply a conservative CP-friendly password policy without touching existing hashes.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Writes min length 14, remember 5, max age 90, min age 1, complexity on, inactive lock. Does not change existing password hashes.

## Why it scores in CyberPatriot

The audit op finds the gap; this op is the fix. Scoring checks the policy files/objects, not whether you cracked anyone.

## When to run it

After audit-password-policy, once you know the README does not demand a weaker custom policy.

## Step-by-step

1. Run audit-password-policy and keep the output as before-evidence.
2. dryRun:true to see which files/objects would change.
3. Live: confirm:true. Existing user hashes are not rewritten.
4. Re-run the audit. For authorized users with known defaults, use expire-user-password separately.

## What “good” looks like

- Audit comes back clean against the baseline.
- Users can still log in with current passwords until they expire naturally or you expire them.

## Risks / confirm notes

- Mutation. Live requires confirm:true. dryRun:true previews.
- A too-strict policy can lock your team out if you also expire everyone at once — do not combine blindly.
- Never used to attack password-guessing on other hosts.

## Related ops

- [`audit-password-policy`](./audit-password-policy.md) — Audit password policy
- [`expire-user-password`](./expire-user-password.md) — Expire a user password
- [`enable-account-lockout`](./enable-account-lockout.md) — Enable account lockout
- [`audit-pam`](./audit-pam.md) — Audit PAM configuration

