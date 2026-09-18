# Audit PAM configuration

- **Catalog id:** `audit-pam`
- **Category:** auth
- **Platforms:** linux
- **Risk:** read

> Look for nullok, missing faillock, and missing pwquality in PAM.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Inspects common-auth / system-auth for pam_pwquality, pam_tally2/faillock, pam_unix remember, and nullok. nullok is high; missing faillock is medium.

## Why it scores in CyberPatriot

nullok means empty passwords are allowed at the PAM layer even if shadow looks fine. Missing lockout means password-guessing on the local console is unlimited.

## When to run it

Linux auth pass, before enable-account-lockout and enforce-password-policy.

## Step-by-step

1. Run the op. Treat nullok as fire — it must go.
2. Note missing pwquality and faillock; those are the mutate ops.
3. Do not hand-edit PAM as your first move unless you know the distro; prefer the suite’s mutate ops.

## What “good” looks like

- No nullok.
- pwquality or cracklib present.
- faillock or tally2 present with a deny threshold.

## Risks / confirm notes

- Read-only. A broken PAM file can lock everyone out — that is why mutate ops exist.
- This is not a guide to bypass PAM.

## Related ops

- [`enable-account-lockout`](./enable-account-lockout.md) — Enable account lockout
- [`enforce-password-policy`](./enforce-password-policy.md) — Enforce password policy
- [`check-empty-passwords`](./check-empty-passwords.md) — Check for empty passwords

