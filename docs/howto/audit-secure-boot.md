# Audit Secure Boot / UEFI

- **Catalog id:** `audit-secure-boot`
- **Category:** windows
- **Platforms:** windows
- **Risk:** read

> Report Secure Boot on/off and Setup Mode — no firmware keys dumped.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Calls Confirm-SecureBootUEFI. Off or Setup Mode is a firmware finding. PK/KEK/db material is never exported.

## Why it scores in CyberPatriot

Some Windows images score Secure Boot. Even when they do not, Setup Mode is a plant you want to know about.

## When to run it

Windows extras after BitLocker/LSA, not in the first five minutes.

## Step-by-step

1. Run the op. Note SecureBoot true/false.
2. If the README requires Secure Boot and it is off, follow the image’s firmware procedure — this op will not enroll keys.
3. Never copy PK/KEK material into chat, Git, or evidence zips.

## What “good” looks like

- Secure Boot on if the README requires it.
- No firmware key material in the result.

## Risks / confirm notes

- Read-only. Firmware enroll is out of band and easy to get wrong under the clock.
- Authorized-image only.

## Related ops

- [`check-bitlocker-status`](./check-bitlocker-status.md) — Check BitLocker status
- [`audit-lsa-protection`](./audit-lsa-protection.md) — Audit LSA protection / RunAsPPL
- [`audit-credential-guard`](./audit-credential-guard.md) — Audit Credential Guard / Device Guard
- [`run-sfc-scan`](./run-sfc-scan.md) — Run system file integrity check

