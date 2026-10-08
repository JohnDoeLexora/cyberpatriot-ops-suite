# Audit password policy

- **Catalog id:** `audit-password-policy`
- **Category:** auth
- **Platforms:** both
- **Risk:** read

> Read min length, aging, history, and complexity — then compare to a CP baseline.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reads /etc/login.defs + PAM pwquality/cracklib, or net accounts / secedit: length, aging, history, complexity. Compare to typical CP baselines (length 12–14+, history, max age).

## Why it scores in CyberPatriot

Weak policy (minlen 8, max age 99999, no complexity) is a reliable chunk of points on both platforms.

## What it changes

Nothing - read-only audit

## How to undo

Nothing to undo

## When to run it

After the first user inventory, before you apply enforce-password-policy.

## Step-by-step

1. Run the op and list every finding (short minlen, no history, never-expires).
2. Skim the README for a required policy; if silent, use the conservative baseline this suite documents (length 14, history 5, max 90).
3. Fix with enforce-password-policy rather than hand-editing five files under the clock.
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: Min length ≥ 12–14, complexity on, history remembered, max age not 99999.

## What “good” looks like

- Min length ≥ 12–14, complexity on, history remembered, max age not 99999.
- Inactive/lockout policy present (pair with enable-account-lockout).

## Risks / confirm notes

- Read-only. Applying policy is a mutate op with confirm:true.
- Do not weaken policy to ‘match a guessing attack’ — this is defensive only.
- Common mistake: treating this read-only result as already fixed, or changing the computer before the findings are copied into Team notes.

## Related ops

- [`enforce-password-policy`](./enforce-password-policy.md) — Enforce password policy
- [`check-password-aging`](./check-password-aging.md) — Check password aging
- [`audit-pam`](./audit-pam.md) — Audit PAM configuration
- [`enable-account-lockout`](./enable-account-lockout.md) — Enable account lockout

