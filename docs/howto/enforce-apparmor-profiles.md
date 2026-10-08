# Enforce AppArmor profiles for common apps

- **Catalog id:** `enforce-apparmor-profiles`
- **Category:** kernel
- **Platforms:** linux
- **Risk:** mutate

> Move common AppArmor profiles from complain to enforce.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Runs aa-enforce for apache2/mysqld/ntpd/named/dhcpd/ping/tcpdump when apparmor-utils is present. Complements audit-mac-enforcement (read). Does not setenforce SELinux.

## Why it scores in CyberPatriot

Permissive/complain MAC is a finding on images that shipped with profiles. Enforcing the stock profiles is the kosher fix.

## What it changes

Runs aa-enforce for apache2, httpd, mysqld, ntpd, named, dhcpd, ping, and tcpdump when those profiles exist. If aa-enforce is missing, it changes nothing.

## How to undo

If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. aa-complain on the same profile names returns them to log-only mode.

## When to run it

After audit-mac-enforcement, once you know AppArmor is the MAC on this image.

## Step-by-step

1. Run audit-mac-enforcement. If SELinux is the MAC, stop — this op is AppArmor-only.
2. dryRun:true, then live confirm:true.
3. Re-run audit-mac-enforcement. Complain profiles for common daemons should drop.
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: aa-status shows apache2/mysqld/sshd in enforce if those packages exist.

## What “good” looks like

- aa-status shows apache2/mysqld/sshd in enforce if those packages exist.
- SELinux was not flipped.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Enforcing a broken profile can take down a README-required service — snapshot first.
- Common mistake: confirming the live change before the account, service, or file matches the image README, or skipping the dry-run preview.

## Related ops

- [`audit-mac-enforcement`](./audit-mac-enforcement.md) — Audit AppArmor/SELinux enforcement
- [`audit-web-server`](./audit-web-server.md) — Apache/nginx hardening checklist
- [`harden-sshd`](./harden-sshd.md) — Harden sshd_config
- [`audit-php-hardening`](./audit-php-hardening.md) — Audit PHP expose_php / dangerous functions

