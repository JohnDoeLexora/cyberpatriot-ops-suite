# Audit LSA protection / RunAsPPL

- **Catalog id:** `audit-lsa-protection`
- **Category:** windows
- **Platforms:** windows
- **Risk:** read

> Read RunAsPPL — whether LSA runs as a protected process.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reads HKLM LSA RunAsPPL / RunAsPPLBoot. Unprotected LSA is a credential-theft finding. Classification only — LSASS, hashes, and tickets are never dumped.

## Why it scores in CyberPatriot

Windows images often score LSA protection. Knowing the bit is on is the check; dumping LSASS is out of scope and against the rules.

## What it changes

Nothing - read-only audit

## How to undo

Nothing to undo

## When to run it

Windows auth extras with audit-uac and audit-credential-guard, after the high-value user/firewall work.

## Step-by-step

1. Run the op. Note RunAsPPL=0 vs 1/2.
2. If the README/image supports VBS, enabling RunAsPPL is a local policy action — this op is read-only.
3. Never run a credential dump, mimikatz, or LSASS access tool. The result must not contain hashes.
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: RunAsPPL is 1 or 2 on images that score it.

## What “good” looks like

- RunAsPPL is 1 or 2 on images that score it.
- No hash or ticket material in the output.

## Risks / confirm notes

- Read-only. Enabling RunAsPPL is a separate admin action after a README check.
- Do not dump LSASS. Authorized-image only.
- Common mistake: treating this read-only result as already fixed, or changing the computer before the findings are copied into Team notes.

## Related ops

- [`audit-credential-guard`](./audit-credential-guard.md) — Audit Credential Guard / Device Guard
- [`audit-uac`](./audit-uac.md) — Audit User Account Control
- [`check-bitlocker-status`](./check-bitlocker-status.md) — Check BitLocker status
- [`audit-secure-boot`](./audit-secure-boot.md) — Audit Secure Boot / UEFI

