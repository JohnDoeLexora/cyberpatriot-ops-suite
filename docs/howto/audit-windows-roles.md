# Audit Windows Server roles

- **Catalog id:** `audit-windows-roles`
- **Category:** windows
- **Platforms:** windows
- **Risk:** read

> Inventory DNS/DHCP/AD-DS presence on a Windows Server image — read-only suggestions.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Lists installed ServerManager roles (or optional features on a workstation). Flags unexpected AD-DS, DNS, and DHCP on a member/workstation image. Does not promote, demote, or attack another DC.

## Why it scores in CyberPatriot

A workstation image with AD-DS/DNS/DHCP installed is usually a plant. Server images that *are* the DC need those roles left alone — read the README.

## When to run it

Windows extras after you have read whether this image is a DC, member, or workstation.

## Step-by-step

1. Read the README: is this a domain controller, member server, or workstation?
2. Run the op. Unexpected AD/DNS/DHCP on a workstation is a remove-feature candidate (not this op).
3. Never dcpromo / uninstall AD-DS on a README-required DC.

## What “good” looks like

- Role list matches the README.
- No domain demotion attempted by this op.

## Risks / confirm notes

- Read-only. Uninstalling AD-DS is a separate, high-risk admin action.
- Do not target another team’s DC. Authorized-image only.

## Related ops

- [`audit-iis`](./audit-iis.md) — IIS feature inventory + anonymous auth
- [`list-services`](./list-services.md) — List services
- [`flag-risky-services`](./flag-risky-services.md) — Flag risky services
- [`disable-optional-windows-features`](./disable-optional-windows-features.md) — Disable optional Windows features

