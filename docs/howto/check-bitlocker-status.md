# Check BitLocker status

- **Catalog id:** `check-bitlocker-status`
- **Category:** windows
- **Platforms:** windows
- **Risk:** read

> Report BitLocker on/off per volume — informational, no recovery keys.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Protection status per volume. CP scoring may or may not require encryption. Does not export recovery keys.

## Why it scores in CyberPatriot

Some Windows images score encryption; others only want you to know the state. Either way, dumping recovery keys is out of scope and dangerous.

## When to run it

Windows extras, after the high-value user/firewall work.

## Step-by-step

1. Run the op. Note Protection Off vs On.
2. If the README requires BitLocker and it is off, follow the README’s encrypt procedure on the authorized image — this op will not turn it on.
3. Never copy recovery keys into chat, Git, or evidence zips.

## What “good” looks like

- Status matches the README requirement.
- No recovery key material in the result.

## Risks / confirm notes

- Read-only.
- Do not export or print recovery keys. Do not encrypt blindly if the README is silent and time is short.

## Related ops

- [`enable-windows-defender`](./enable-windows-defender.md) — Enable Microsoft Defender
- [`audit-uac`](./audit-uac.md) — Audit User Account Control
- [`export-evidence-bundle`](./export-evidence-bundle.md) — Export evidence bundle

