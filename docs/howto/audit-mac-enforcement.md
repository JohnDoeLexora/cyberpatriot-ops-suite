# Audit AppArmor/SELinux enforcement

- **Catalog id:** `audit-mac-enforcement`
- **Category:** kernel
- **Platforms:** linux
- **Risk:** read

> Report AppArmor/SELinux mode and suggest enforcing — does not flip the switch.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reads getenforce/sestatus and aa-status. Permissive or disabled MAC is a finding on images that shipped with profiles. Suggests enforce; does not run setenforce.

## Why it scores in CyberPatriot

SELinux Permissive and AppArmor complain-mode are common plants. Scoring wants enforcing on images that had it.

## When to run it

Linux kernel pass with audit-sysctl. After you know the distro (Ubuntu=AppArmor, Fedora/CentOS=SELinux).

## Step-by-step

1. Run the op. Note Permissive vs Enforcing vs Disabled, and complain vs enforce profiles.
2. If the README does not forbid MAC, plan to set enforcing (setenforce 1 / aa-enforce) as a separate admin action.
3. Do not disable MAC to ‘make an app work’ unless the README says the app is scored and broken by it.

## What “good” looks like

- SELinux Enforcing or AppArmor profiles in enforce, matching what the image shipped with.
- This op’s output still read-only — no surprise setenforce.

## Risks / confirm notes

- Read-only. Flipping to enforcing can break a scored service — README first.
- Disabled SELinux on a RHEL-like image is the finding; Ubuntu without SELinux is normal.

## Related ops

- [`audit-sysctl`](./audit-sysctl.md) — Audit sysctl hardening
- [`harden-sysctl`](./harden-sysctl.md) — Apply sysctl hardening
- [`check-auditd`](./check-auditd.md) — Check auditd
- [`audit-firewall`](./audit-firewall.md) — Audit host firewall

