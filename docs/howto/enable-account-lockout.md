# Enable account lockout

- **Catalog id:** `enable-account-lockout`
- **Category:** auth
- **Platforms:** both
- **Risk:** mutate

> Lock the local account after repeated failed passwords.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Enables PAM faillock or Windows lockout after failures (deny=5, unlock_time=600). Stops password-guessing on this image only.

## Why it scores in CyberPatriot

Lockout policy is a standard auth scoring item. It is defensive, local, and expected.

## When to run it

After audit-pam / audit-password-policy, once you know you will not lock yourselves out during testing.

## Step-by-step

1. Run the matching audit so you have a before picture.
2. dryRun:true, then live confirm:true.
3. Re-run audit-pam / audit-password-policy; faillock or lockout threshold should be present.

## What “good” looks like

- deny=5 (or README value) and a non-zero unlock time.
- Your team can still log in with the correct password.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- A very low threshold plus a shared team password can lock you during the round — 5/10 minutes is the conservative default.
- This does not attack other hosts and is not an online bruteforce tool.

## Related ops

- [`audit-pam`](./audit-pam.md) — Audit PAM configuration
- [`audit-password-policy`](./audit-password-policy.md) — Audit password policy
- [`enforce-password-policy`](./enforce-password-policy.md) — Enforce password policy

