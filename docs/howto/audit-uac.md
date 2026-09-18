# Audit User Account Control

- **Catalog id:** `audit-uac`
- **Category:** auth
- **Platforms:** windows
- **Risk:** read

> Check that Windows User Account Control is actually on.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reads EnableLUA, ConsentPromptBehaviorAdmin, and PromptOnSecureDesktop. UAC disabled is a high finding.

## Why it scores in CyberPatriot

EnableLUA=0 is a common Windows plant. Scoring checks the registry values.

## When to run it

Windows auth pass, with disable-guest-account and audit-rdp.

## Step-by-step

1. Run the op. If EnableLUA is 0, UAC is off — that is the finding.
2. This op is read-only; turn UAC back on with the Windows settings / registry using a confirmed team procedure.
3. Re-run until EnableLUA=1 and the admin prompt is not ‘elevate without asking.’

## What “good” looks like

- EnableLUA=1.
- Admin consent prompt not set to ‘elevate without asking’.
- Secure desktop prompt on.

## Risks / confirm notes

- Read-only.
- Do not disable UAC to ‘make scripts easier.’

## Related ops

- [`disable-guest-account`](./disable-guest-account.md) — Disable Guest account
- [`audit-password-policy`](./audit-password-policy.md) — Audit password policy
- [`enable-windows-defender`](./enable-windows-defender.md) — Enable Microsoft Defender
- [`audit-rdp`](./audit-rdp.md) — Audit Remote Desktop

