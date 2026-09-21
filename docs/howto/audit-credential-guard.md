# Audit Credential Guard / Device Guard

- **Catalog id:** `audit-credential-guard`
- **Category:** windows
- **Platforms:** windows
- **Risk:** read

> Report Credential Guard / Device Guard security services running.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reads Win32_DeviceGuard: Credential Guard, Configurable TCB, VBS status. Informational — some images score CG, others only want the state known. Isolated secrets are not dumped.

## Why it scores in CyberPatriot

VBS/Credential Guard is a Windows extras item on Server/Win10+ images that shipped with it. Knowing it is off tells you whether to enable it from the README.

## When to run it

With audit-lsa-protection and audit-secure-boot. Skip enabling CG if the image cannot boot with VBS.

## Step-by-step

1. Run the op. Note SecurityServicesRunning and VirtualizationBasedSecurityStatus.
2. If CG is off and the README requires it, enable via local policy/msinfo — this op will not flip it.
3. If the image is a VM without nested VBS, leave it off and document that.

## What “good” looks like

- Status matches the README.
- No isolated secret material in the result.

## Risks / confirm notes

- Read-only. Forcing CG on a VM that cannot run VBS can brick the round — snapshot first.
- Authorized-image only. Not a remote attestation of other hosts.

## Related ops

- [`audit-lsa-protection`](./audit-lsa-protection.md) — Audit LSA protection / RunAsPPL
- [`audit-secure-boot`](./audit-secure-boot.md) — Audit Secure Boot / UEFI
- [`check-bitlocker-status`](./check-bitlocker-status.md) — Check BitLocker status
- [`audit-uac`](./audit-uac.md) — Audit User Account Control

