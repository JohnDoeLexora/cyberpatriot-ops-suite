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

## What it changes

On Linux it writes /etc/security/faillock.conf (deny 5, fail_interval 900 seconds, unlock_time 600 seconds, even for root). You still need pam_faillock in the sign-in stack if it is not already there. On Windows it runs net accounts /lockoutthreshold:5 /lockoutduration:10 /lockoutwindow:10.

## How to undo

If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. Delete or restore /etc/security/faillock.conf on Linux. On Windows set the lockout threshold back with net accounts /lockoutthreshold:0 if the README wants no lockout.

## When to run it

After audit-pam / audit-password-policy, once you know you will not lock yourselves out during testing.

## Step-by-step

1. Run the matching audit so you have a before picture.
2. dryRun:true, then live confirm:true.
3. Re-run audit-pam / audit-password-policy; faillock or lockout threshold should be present.
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: deny=5 (or README value) and a non-zero unlock time.

## What “good” looks like

- deny=5 (or README value) and a non-zero unlock time.
- Your team can still log in with the correct password.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- A very low threshold plus a shared team password can lock you during the round — 5/10 minutes is the conservative default.
- This does not attack other hosts and is not an online bruteforce tool.
- Common mistake: confirming the live change before the account, service, or file matches the image README, or skipping the dry-run preview.

## Related ops

- [`audit-pam`](./audit-pam.md) — Audit PAM configuration
- [`audit-password-policy`](./audit-password-policy.md) — Audit password policy
- [`enforce-password-policy`](./enforce-password-policy.md) — Enforce password policy

