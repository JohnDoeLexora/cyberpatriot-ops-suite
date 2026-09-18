# How-to guides

Searchable defensive explainers for every op in `@cyberpatriot/ops-catalog`.
Source of truth: `packages/ops-docs`. The dashboard How-to drawer searches titles and bodies.

Competition-legal only: authorized-image hardening. No offense, no exploit recipes, no CCS cheats.
Mutations still require `confirm: true` in live mode — see [SAFETY.md](../SAFETY.md).

- **Guides:** 70
- **Open in the dashboard:** How-to button on each OpPanel, or the header How-to control. Press `?` to open the focused pane’s guide.

## Index

| ID | Title | Category | Risk |
| --- | --- | --- | --- |
| [`list-users`](./list-users.md) | List local users | users | read |
| [`flag-suspicious-users`](./flag-suspicious-users.md) | Flag suspicious users | users | read |
| [`disable-user`](./disable-user.md) | Disable a local user | users | mutate |
| [`lock-user`](./lock-user.md) | Lock a local user password | users | mutate |
| [`remove-user-from-admins`](./remove-user-from-admins.md) | Remove user from administrators | users | mutate |
| [`list-admin-users`](./list-admin-users.md) | List administrators and sudoers | users | read |
| [`audit-uid-zero`](./audit-uid-zero.md) | Audit UID 0 accounts | users | read |
| [`check-empty-passwords`](./check-empty-passwords.md) | Check for empty passwords | users | read |
| [`audit-never-logged-in`](./audit-never-logged-in.md) | Audit never-logged-in humans | users | read |
| [`check-user-shells`](./check-user-shells.md) | Check login shells | users | read |
| [`list-groups`](./list-groups.md) | List local groups | users | read |
| [`disable-guest-account`](./disable-guest-account.md) | Disable Guest account | users | mutate |
| [`audit-duplicate-uids`](./audit-duplicate-uids.md) | Audit duplicate UIDs | users | read |
| [`expire-user-password`](./expire-user-password.md) | Expire a user password | users | mutate |
| [`audit-password-policy`](./audit-password-policy.md) | Audit password policy | auth | read |
| [`enforce-password-policy`](./enforce-password-policy.md) | Enforce password policy | auth | mutate |
| [`check-password-aging`](./check-password-aging.md) | Check password aging | auth | read |
| [`audit-pam`](./audit-pam.md) | Audit PAM configuration | auth | read |
| [`enable-account-lockout`](./enable-account-lockout.md) | Enable account lockout | auth | mutate |
| [`disable-root-ssh`](./disable-root-ssh.md) | Disable SSH root login | auth | mutate |
| [`audit-sudoers`](./audit-sudoers.md) | Audit sudoers | auth | read |
| [`audit-uac`](./audit-uac.md) | Audit User Account Control | auth | read |
| [`list-services`](./list-services.md) | List services | services | read |
| [`flag-risky-services`](./flag-risky-services.md) | Flag risky services | services | read |
| [`disable-service`](./disable-service.md) | Disable a service | services | mutate |
| [`audit-ftp-telnet`](./audit-ftp-telnet.md) | Audit FTP and Telnet | services | read |
| [`disable-telnet`](./disable-telnet.md) | Disable Telnet | services | mutate |
| [`disable-legacy-r-services`](./disable-legacy-r-services.md) | Disable rsh/rlogin/rexec | services | mutate |
| [`audit-smb`](./audit-smb.md) | Audit SMB / Samba | services | read |
| [`audit-listening-ports`](./audit-listening-ports.md) | Audit listening ports | ports | read |
| [`ssh-hardening-audit`](./ssh-hardening-audit.md) | SSH hardening audit | network | read |
| [`harden-sshd`](./harden-sshd.md) | Harden sshd_config | network | mutate |
| [`audit-rdp`](./audit-rdp.md) | Audit Remote Desktop | network | read |
| [`disable-rdp`](./disable-rdp.md) | Disable Remote Desktop | network | mutate |
| [`audit-hosts-file`](./audit-hosts-file.md) | Audit hosts file | network | read |
| [`check-ntp`](./check-ntp.md) | Check time synchronization | network | read |
| [`audit-firewall`](./audit-firewall.md) | Audit host firewall | firewall | read |
| [`enable-firewall`](./enable-firewall.md) | Enable host firewall | firewall | mutate |
| [`list-firewall-rules`](./list-firewall-rules.md) | List firewall rules | firewall | read |
| [`apply-default-deny-inbound`](./apply-default-deny-inbound.md) | Apply default-deny inbound | firewall | mutate |
| [`find-world-writable`](./find-world-writable.md) | Find world-writable files | files | read |
| [`find-suid-sgid`](./find-suid-sgid.md) | Find SUID/SGID files | files | read |
| [`find-media-files`](./find-media-files.md) | Find prohibited media files | files | read |
| [`audit-home-permissions`](./audit-home-permissions.md) | Audit home directory permissions | files | read |
| [`check-sensitive-file-perms`](./check-sensitive-file-perms.md) | Check sensitive file permissions | files | read |
| [`audit-ssh-authorized-keys`](./audit-ssh-authorized-keys.md) | Audit SSH authorized_keys | files | read |
| [`find-hidden-executables`](./find-hidden-executables.md) | Find hidden executables | files | read |
| [`list-installed-packages`](./list-installed-packages.md) | List installed packages | packages | read |
| [`find-prohibited-software`](./find-prohibited-software.md) | Find prohibited software | packages | read |
| [`remove-package`](./remove-package.md) | Remove a package | packages | mutate |
| [`audit-logging`](./audit-logging.md) | Audit logging configuration | logging | read |
| [`check-auditd`](./check-auditd.md) | Check auditd | logging | read |
| [`check-pending-updates`](./check-pending-updates.md) | Check pending updates | updates | read |
| [`apply-security-updates`](./apply-security-updates.md) | Apply security updates | updates | mutate |
| [`audit-cron`](./audit-cron.md) | Audit cron jobs | scheduled | read |
| [`audit-at-jobs`](./audit-at-jobs.md) | Audit at jobs | scheduled | read |
| [`list-scheduled-tasks`](./list-scheduled-tasks.md) | List scheduled tasks | scheduled | read |
| [`audit-sysctl`](./audit-sysctl.md) | Audit sysctl hardening | kernel | read |
| [`harden-sysctl`](./harden-sysctl.md) | Apply sysctl hardening | kernel | mutate |
| [`audit-startup-items`](./audit-startup-items.md) | Audit startup items | kernel | read |
| [`disable-smbv1`](./disable-smbv1.md) | Disable SMBv1 | windows | mutate |
| [`enable-windows-defender`](./enable-windows-defender.md) | Enable Microsoft Defender | windows | mutate |
| [`audit-powershell-logging`](./audit-powershell-logging.md) | Audit PowerShell logging | windows | read |
| [`disable-autoplay`](./disable-autoplay.md) | Disable Autoplay | windows | mutate |
| [`check-bitlocker-status`](./check-bitlocker-status.md) | Check BitLocker status | windows | read |
| [`export-evidence-bundle`](./export-evidence-bundle.md) | Export evidence bundle | evidence | read |
| [`one-click-hardening-checklist`](./one-click-hardening-checklist.md) | One-click hardening checklist | evidence | read |
| [`score-image-heuristics`](./score-image-heuristics.md) | Score image heuristics | evidence | read |
| [`find-backdoor-binaries`](./find-backdoor-binaries.md) | Find suspicious binaries | evidence | read |
| [`audit-shared-folders`](./audit-shared-folders.md) | Audit shared folders | files | read |

## Browse by category

### users

- [`list-users`](./list-users.md) — List local users
- [`flag-suspicious-users`](./flag-suspicious-users.md) — Flag suspicious users
- [`disable-user`](./disable-user.md) — Disable a local user
- [`lock-user`](./lock-user.md) — Lock a local user password
- [`remove-user-from-admins`](./remove-user-from-admins.md) — Remove user from administrators
- [`list-admin-users`](./list-admin-users.md) — List administrators and sudoers
- [`audit-uid-zero`](./audit-uid-zero.md) — Audit UID 0 accounts
- [`check-empty-passwords`](./check-empty-passwords.md) — Check for empty passwords
- [`audit-never-logged-in`](./audit-never-logged-in.md) — Audit never-logged-in humans
- [`check-user-shells`](./check-user-shells.md) — Check login shells
- [`list-groups`](./list-groups.md) — List local groups
- [`disable-guest-account`](./disable-guest-account.md) — Disable Guest account
- [`audit-duplicate-uids`](./audit-duplicate-uids.md) — Audit duplicate UIDs
- [`expire-user-password`](./expire-user-password.md) — Expire a user password

### auth

- [`audit-password-policy`](./audit-password-policy.md) — Audit password policy
- [`enforce-password-policy`](./enforce-password-policy.md) — Enforce password policy
- [`check-password-aging`](./check-password-aging.md) — Check password aging
- [`audit-pam`](./audit-pam.md) — Audit PAM configuration
- [`enable-account-lockout`](./enable-account-lockout.md) — Enable account lockout
- [`disable-root-ssh`](./disable-root-ssh.md) — Disable SSH root login
- [`audit-sudoers`](./audit-sudoers.md) — Audit sudoers
- [`audit-uac`](./audit-uac.md) — Audit User Account Control

### services

- [`list-services`](./list-services.md) — List services
- [`flag-risky-services`](./flag-risky-services.md) — Flag risky services
- [`disable-service`](./disable-service.md) — Disable a service
- [`audit-ftp-telnet`](./audit-ftp-telnet.md) — Audit FTP and Telnet
- [`disable-telnet`](./disable-telnet.md) — Disable Telnet
- [`disable-legacy-r-services`](./disable-legacy-r-services.md) — Disable rsh/rlogin/rexec
- [`audit-smb`](./audit-smb.md) — Audit SMB / Samba

### ports

- [`audit-listening-ports`](./audit-listening-ports.md) — Audit listening ports

### network

- [`ssh-hardening-audit`](./ssh-hardening-audit.md) — SSH hardening audit
- [`harden-sshd`](./harden-sshd.md) — Harden sshd_config
- [`audit-rdp`](./audit-rdp.md) — Audit Remote Desktop
- [`disable-rdp`](./disable-rdp.md) — Disable Remote Desktop
- [`audit-hosts-file`](./audit-hosts-file.md) — Audit hosts file
- [`check-ntp`](./check-ntp.md) — Check time synchronization

### firewall

- [`audit-firewall`](./audit-firewall.md) — Audit host firewall
- [`enable-firewall`](./enable-firewall.md) — Enable host firewall
- [`list-firewall-rules`](./list-firewall-rules.md) — List firewall rules
- [`apply-default-deny-inbound`](./apply-default-deny-inbound.md) — Apply default-deny inbound

### files

- [`find-world-writable`](./find-world-writable.md) — Find world-writable files
- [`find-suid-sgid`](./find-suid-sgid.md) — Find SUID/SGID files
- [`find-media-files`](./find-media-files.md) — Find prohibited media files
- [`audit-home-permissions`](./audit-home-permissions.md) — Audit home directory permissions
- [`check-sensitive-file-perms`](./check-sensitive-file-perms.md) — Check sensitive file permissions
- [`audit-ssh-authorized-keys`](./audit-ssh-authorized-keys.md) — Audit SSH authorized_keys
- [`find-hidden-executables`](./find-hidden-executables.md) — Find hidden executables
- [`audit-shared-folders`](./audit-shared-folders.md) — Audit shared folders

### packages

- [`list-installed-packages`](./list-installed-packages.md) — List installed packages
- [`find-prohibited-software`](./find-prohibited-software.md) — Find prohibited software
- [`remove-package`](./remove-package.md) — Remove a package

### logging

- [`audit-logging`](./audit-logging.md) — Audit logging configuration
- [`check-auditd`](./check-auditd.md) — Check auditd

### updates

- [`check-pending-updates`](./check-pending-updates.md) — Check pending updates
- [`apply-security-updates`](./apply-security-updates.md) — Apply security updates

### scheduled

- [`audit-cron`](./audit-cron.md) — Audit cron jobs
- [`audit-at-jobs`](./audit-at-jobs.md) — Audit at jobs
- [`list-scheduled-tasks`](./list-scheduled-tasks.md) — List scheduled tasks

### kernel

- [`audit-sysctl`](./audit-sysctl.md) — Audit sysctl hardening
- [`harden-sysctl`](./harden-sysctl.md) — Apply sysctl hardening
- [`audit-startup-items`](./audit-startup-items.md) — Audit startup items

### windows

- [`disable-smbv1`](./disable-smbv1.md) — Disable SMBv1
- [`enable-windows-defender`](./enable-windows-defender.md) — Enable Microsoft Defender
- [`audit-powershell-logging`](./audit-powershell-logging.md) — Audit PowerShell logging
- [`disable-autoplay`](./disable-autoplay.md) — Disable Autoplay
- [`check-bitlocker-status`](./check-bitlocker-status.md) — Check BitLocker status

### evidence

- [`export-evidence-bundle`](./export-evidence-bundle.md) — Export evidence bundle
- [`one-click-hardening-checklist`](./one-click-hardening-checklist.md) — One-click hardening checklist
- [`score-image-heuristics`](./score-image-heuristics.md) — Score image heuristics
- [`find-backdoor-binaries`](./find-backdoor-binaries.md) — Find suspicious binaries

