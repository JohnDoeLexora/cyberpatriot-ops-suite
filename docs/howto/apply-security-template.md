# Apply local security template

- **Catalog id:** `apply-security-template`
- **Category:** windows
- **Platforms:** windows
- **Risk:** mutate

> Import a secedit .inf baseline for password, lockout, and audit options.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Runs secedit /configure against a local .inf (default config/windows/cp-baseline.inf) covering password length/history/lockout, Success+Failure audit, and a few security-option registry values. LGPO-style baselines belong here too. Local image only.

## Why it scores in CyberPatriot

Public Windows kits apply a security template in one shot so password policy, Guest, and audit policy are not forgotten under the clock. This is that mutate, with dryRun and confirm.

## What it changes

Runs secedit /configure against the template (default config/windows/cp-baseline.inf) into a temporary security database, which writes those policy settings.

## How to undo

If a backup was made, restore from %ProgramData%\CyberPatriotOps\backups\<ts>\. Re-import the previous .inf if you saved one. Otherwise put password length, lockout, and Guest back by hand from the backup copy of the security policy.

## When to run it

Windows auth pass after you have read the README. Prefer dryRun first.

## Step-by-step

1. Open config/windows/cp-baseline.inf and confirm min length, lockout, and Guest=0 match this image’s README.
2. Run with dryRun:true. The result should name the template and not call secedit for real.
3. Live mode requires confirm:true. Re-run audit-password-policy and enable-audit-policy’s categories should now look set.
4. If a README-required service breaks, stop and revert from your snapshot — do not import a template you have not read.

## What “good” looks like

- Password min length ≥14, history, lockout, Guest disabled.
- Audit policy Success+Failure on logon/account management.

## Risks / confirm notes

- Mutation. Live requires confirm:true (or dryRun:true to preview).
- secedit overwrites local policy. Snapshot the image first.
- Authorized-image only. Never pointed at another team.
- Common mistake: confirming the live change before the account, service, or file matches the image README, or skipping the dry-run preview.

## Related ops

- [`audit-password-policy`](./audit-password-policy.md) — Audit password policy
- [`enable-audit-policy`](./enable-audit-policy.md) — Enable Success+Failure audit policy
- [`enforce-password-policy`](./enforce-password-policy.md) — Enforce password policy
- [`disable-guest-account`](./disable-guest-account.md) — Disable Guest account

