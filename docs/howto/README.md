# How-to guides

Searchable defensive explainers for every op in `@cyberpatriot/ops-catalog`.
Source of truth: `packages/ops-docs`. The dashboard How-to drawer searches titles and bodies.

Competition-legal only: authorized-image hardening. No offense, no exploit recipes, no CCS cheats.
Mutations still require `confirm: true` in live mode — see [SAFETY.md](../SAFETY.md).

- **Guides:** 138
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
| [`package-forensics-evidence`](./package-forensics-evidence.md) | Package redacted forensics evidence | evidence | read |
| [`one-click-hardening-checklist`](./one-click-hardening-checklist.md) | One-click hardening checklist | evidence | read |
| [`score-image-heuristics`](./score-image-heuristics.md) | Score image heuristics | evidence | read |
| [`find-backdoor-binaries`](./find-backdoor-binaries.md) | Find suspicious binaries | evidence | read |
| [`audit-shared-folders`](./audit-shared-folders.md) | Audit shared folders | files | read |
| [`diff-expected-ports`](./diff-expected-ports.md) | Diff listeners vs expected ports | ports | read |
| [`audit-share-acls`](./audit-share-acls.md) | Dump unauthorized share ACLs | files | read |
| [`audit-persistence-deep`](./audit-persistence-deep.md) | Deep startup persistence audit | scheduled | read |
| [`hunt-remote-access-tools`](./hunt-remote-access-tools.md) | Hunt remote-access tools and browser extensions | packages | read |
| [`report-password-never-expires`](./report-password-never-expires.md) | Report never-expires + blank password combo | auth | read |
| [`audit-critical-perm-drift`](./audit-critical-perm-drift.md) | Audit critical permission drift | files | read |
| [`scoreboard-preflight`](./scoreboard-preflight.md) | Scoreboard preflight checklist | evidence | read |
| [`post-harden-checklist`](./post-harden-checklist.md) | Post-harden verification checklist | evidence | read |
| [`select-unauthorized-users`](./select-unauthorized-users.md) | Select unauthorized users (allowlist miss) | users | read |
| [`audit-sticky-tmp`](./audit-sticky-tmp.md) | Audit sticky bit on temp dirs | files | read |
| [`audit-anonymous-ftp`](./audit-anonymous-ftp.md) | Audit anonymous FTP / vsftpd | services | read |
| [`harden-vsftpd`](./harden-vsftpd.md) | Harden vsftpd (disable anonymous) | services | mutate |
| [`audit-web-server`](./audit-web-server.md) | Apache/nginx hardening checklist | services | read |
| [`disable-llmnr-netbios-wpad`](./disable-llmnr-netbios-wpad.md) | Disable LLMNR / NetBIOS / WPAD | network | mutate |
| [`audit-null-session`](./audit-null-session.md) | Audit null session / anonymous SAM | auth | read |
| [`audit-idle-lock`](./audit-idle-lock.md) | Audit screensaver / idle lock | auth | read |
| [`hunt-sysprep-leftovers`](./hunt-sysprep-leftovers.md) | Hunt unattended / sysprep leftovers | files | read |
| [`audit-snmp`](./audit-snmp.md) | Audit SNMP community / insecure mgmt | services | read |
| [`audit-mac-enforcement`](./audit-mac-enforcement.md) | Audit AppArmor/SELinux enforcement | kernel | read |
| [`audit-browser-baseline`](./audit-browser-baseline.md) | Audit Firefox/IE/Edge security baseline | files | read |
| [`audit-auto-updates`](./audit-auto-updates.md) | Audit unattended-upgrades / Windows Update | updates | read |
| [`remove-games-samples`](./remove-games-samples.md) | Remove games and sample content | packages | mutate |
| [`audit-iis`](./audit-iis.md) | IIS feature inventory + anonymous auth | windows | read |
| [`skim-forensics-readme`](./skim-forensics-readme.md) | Skim local README for forensics keywords | evidence | read |
| [`apply-security-template`](./apply-security-template.md) | Apply local security template | windows | mutate |
| [`import-firewall-profile`](./import-firewall-profile.md) | Import firewall profile | firewall | mutate |
| [`enable-audit-policy`](./enable-audit-policy.md) | Enable Success+Failure audit policy | logging | mutate |
| [`disable-remote-registry`](./disable-remote-registry.md) | Disable Remote Registry | windows | mutate |
| [`disable-remote-assistance`](./disable-remote-assistance.md) | Disable Remote Assistance | windows | mutate |
| [`force-password-change`](./force-password-change.md) | Force password change at next logon | users | mutate |
| [`sync-authorized-users`](./sync-authorized-users.md) | Sync users from allowlists | users | mutate |
| [`disable-optional-windows-features`](./disable-optional-windows-features.md) | Disable optional Windows features | windows | mutate |
| [`run-sfc-scan`](./run-sfc-scan.md) | Run system file integrity check | windows | read |
| [`clear-suspicious-hosts`](./clear-suspicious-hosts.md) | Clear suspicious hosts-file entries | network | mutate |
| [`disable-display-manager-guest`](./disable-display-manager-guest.md) | Disable display-manager guest and autologin | auth | mutate |
| [`lock-root-account`](./lock-root-account.md) | Lock the root password | users | mutate |
| [`enable-fail2ban`](./enable-fail2ban.md) | Install and enable fail2ban | auth | mutate |
| [`harden-host-conf`](./harden-host-conf.md) | Harden host.conf nospoof | network | mutate |
| [`set-ufw-logging`](./set-ufw-logging.md) | Set UFW logging high and verify defaults | firewall | mutate |
| [`restrict-cron-at`](./restrict-cron-at.md) | Restrict at/cron to root | scheduled | mutate |
| [`hunt-shell-backdoors`](./hunt-shell-backdoors.md) | Hunt shell aliases and profile backdoors | files | read |
| [`scan-malware-tools`](./scan-malware-tools.md) | ClamAV / chkrootkit scan report | packages | mutate |
| [`round-start-wizard`](./round-start-wizard.md) | Round-start wizard | evidence | read |
| [`harden-print-spooler`](./harden-print-spooler.md) | Harden Print Spooler / disable remote print | windows | mutate |
| [`audit-lsa-protection`](./audit-lsa-protection.md) | Audit LSA protection / RunAsPPL | windows | read |
| [`audit-credential-guard`](./audit-credential-guard.md) | Audit Credential Guard / Device Guard | windows | read |
| [`audit-secure-boot`](./audit-secure-boot.md) | Audit Secure Boot / UEFI | windows | read |
| [`audit-wifi-profiles`](./audit-wifi-profiles.md) | Audit leftover Wi-Fi profiles | windows | read |
| [`harden-powershell-constrained`](./harden-powershell-constrained.md) | Harden PowerShell logging / Constrained Language | windows | mutate |
| [`disable-smb-client-v1`](./disable-smb-client-v1.md) | Disable SMBv1 client leftovers | windows | mutate |
| [`audit-dns-client`](./audit-dns-client.md) | Audit DNS client / DoH | network | read |
| [`audit-windows-roles`](./audit-windows-roles.md) | Audit Windows Server roles | windows | read |
| [`harden-null-session`](./harden-null-session.md) | Harden anonymous enumeration / null sessions | auth | mutate |
| [`blacklist-kernel-modules`](./blacklist-kernel-modules.md) | Blacklist uncommon kernel modules | kernel | mutate |
| [`enforce-apparmor-profiles`](./enforce-apparmor-profiles.md) | Enforce AppArmor profiles for common apps | kernel | mutate |
| [`enable-unattended-upgrades`](./enable-unattended-upgrades.md) | Enable unattended-upgrades | updates | mutate |
| [`audit-mail-services`](./audit-mail-services.md) | Audit Postfix/Exim/Dovecot relay | services | read |
| [`audit-database-bind`](./audit-database-bind.md) | Audit database bind-address / anonymous | services | read |
| [`audit-php-hardening`](./audit-php-hardening.md) | Audit PHP expose_php / dangerous functions | services | read |
| [`audit-snap-flatpak`](./audit-snap-flatpak.md) | Audit Snap/Flatpak unnecessary apps | packages | read |
| [`disable-ctrl-alt-del`](./disable-ctrl-alt-del.md) | Disable Ctrl+Alt+Del and extra TTYs | kernel | mutate |
| [`audit-ipv6-privacy`](./audit-ipv6-privacy.md) | Audit IPv6 privacy / optional disable | kernel | read |
| [`audit-log-persistence`](./audit-log-persistence.md) | Audit rsyslog/journald persistence | logging | read |
| [`audit-browser-policy`](./audit-browser-policy.md) | Audit browser homepage / proxy / extensions | files | read |
| [`harden-usb-storage`](./harden-usb-storage.md) | Harden USB autorun / storage policy | kernel | mutate |
| [`audit-time-timezone`](./audit-time-timezone.md) | Audit time sync and timezone | network | read |
| [`export-coach-packet`](./export-coach-packet.md) | Export redacted coach packet ZIP | evidence | read |

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
- [`select-unauthorized-users`](./select-unauthorized-users.md) — Select unauthorized users (allowlist miss)
- [`force-password-change`](./force-password-change.md) — Force password change at next logon
- [`sync-authorized-users`](./sync-authorized-users.md) — Sync users from allowlists
- [`lock-root-account`](./lock-root-account.md) — Lock the root password

### auth

- [`audit-password-policy`](./audit-password-policy.md) — Audit password policy
- [`enforce-password-policy`](./enforce-password-policy.md) — Enforce password policy
- [`check-password-aging`](./check-password-aging.md) — Check password aging
- [`audit-pam`](./audit-pam.md) — Audit PAM configuration
- [`enable-account-lockout`](./enable-account-lockout.md) — Enable account lockout
- [`disable-root-ssh`](./disable-root-ssh.md) — Disable SSH root login
- [`audit-sudoers`](./audit-sudoers.md) — Audit sudoers
- [`audit-uac`](./audit-uac.md) — Audit User Account Control
- [`report-password-never-expires`](./report-password-never-expires.md) — Report never-expires + blank password combo
- [`audit-null-session`](./audit-null-session.md) — Audit null session / anonymous SAM
- [`audit-idle-lock`](./audit-idle-lock.md) — Audit screensaver / idle lock
- [`disable-display-manager-guest`](./disable-display-manager-guest.md) — Disable display-manager guest and autologin
- [`enable-fail2ban`](./enable-fail2ban.md) — Install and enable fail2ban
- [`harden-null-session`](./harden-null-session.md) — Harden anonymous enumeration / null sessions

### services

- [`list-services`](./list-services.md) — List services
- [`flag-risky-services`](./flag-risky-services.md) — Flag risky services
- [`disable-service`](./disable-service.md) — Disable a service
- [`audit-ftp-telnet`](./audit-ftp-telnet.md) — Audit FTP and Telnet
- [`disable-telnet`](./disable-telnet.md) — Disable Telnet
- [`disable-legacy-r-services`](./disable-legacy-r-services.md) — Disable rsh/rlogin/rexec
- [`audit-smb`](./audit-smb.md) — Audit SMB / Samba
- [`audit-anonymous-ftp`](./audit-anonymous-ftp.md) — Audit anonymous FTP / vsftpd
- [`harden-vsftpd`](./harden-vsftpd.md) — Harden vsftpd (disable anonymous)
- [`audit-web-server`](./audit-web-server.md) — Apache/nginx hardening checklist
- [`audit-snmp`](./audit-snmp.md) — Audit SNMP community / insecure mgmt
- [`audit-mail-services`](./audit-mail-services.md) — Audit Postfix/Exim/Dovecot relay
- [`audit-database-bind`](./audit-database-bind.md) — Audit database bind-address / anonymous
- [`audit-php-hardening`](./audit-php-hardening.md) — Audit PHP expose_php / dangerous functions

### ports

- [`audit-listening-ports`](./audit-listening-ports.md) — Audit listening ports
- [`diff-expected-ports`](./diff-expected-ports.md) — Diff listeners vs expected ports

### network

- [`ssh-hardening-audit`](./ssh-hardening-audit.md) — SSH hardening audit
- [`harden-sshd`](./harden-sshd.md) — Harden sshd_config
- [`audit-rdp`](./audit-rdp.md) — Audit Remote Desktop
- [`disable-rdp`](./disable-rdp.md) — Disable Remote Desktop
- [`audit-hosts-file`](./audit-hosts-file.md) — Audit hosts file
- [`check-ntp`](./check-ntp.md) — Check time synchronization
- [`disable-llmnr-netbios-wpad`](./disable-llmnr-netbios-wpad.md) — Disable LLMNR / NetBIOS / WPAD
- [`clear-suspicious-hosts`](./clear-suspicious-hosts.md) — Clear suspicious hosts-file entries
- [`harden-host-conf`](./harden-host-conf.md) — Harden host.conf nospoof
- [`audit-dns-client`](./audit-dns-client.md) — Audit DNS client / DoH
- [`audit-time-timezone`](./audit-time-timezone.md) — Audit time sync and timezone

### firewall

- [`audit-firewall`](./audit-firewall.md) — Audit host firewall
- [`enable-firewall`](./enable-firewall.md) — Enable host firewall
- [`list-firewall-rules`](./list-firewall-rules.md) — List firewall rules
- [`apply-default-deny-inbound`](./apply-default-deny-inbound.md) — Apply default-deny inbound
- [`import-firewall-profile`](./import-firewall-profile.md) — Import firewall profile
- [`set-ufw-logging`](./set-ufw-logging.md) — Set UFW logging high and verify defaults

### files

- [`find-world-writable`](./find-world-writable.md) — Find world-writable files
- [`find-suid-sgid`](./find-suid-sgid.md) — Find SUID/SGID files
- [`find-media-files`](./find-media-files.md) — Find prohibited media files
- [`audit-home-permissions`](./audit-home-permissions.md) — Audit home directory permissions
- [`check-sensitive-file-perms`](./check-sensitive-file-perms.md) — Check sensitive file permissions
- [`audit-ssh-authorized-keys`](./audit-ssh-authorized-keys.md) — Audit SSH authorized_keys
- [`find-hidden-executables`](./find-hidden-executables.md) — Find hidden executables
- [`audit-shared-folders`](./audit-shared-folders.md) — Audit shared folders
- [`audit-share-acls`](./audit-share-acls.md) — Dump unauthorized share ACLs
- [`audit-critical-perm-drift`](./audit-critical-perm-drift.md) — Audit critical permission drift
- [`audit-sticky-tmp`](./audit-sticky-tmp.md) — Audit sticky bit on temp dirs
- [`hunt-sysprep-leftovers`](./hunt-sysprep-leftovers.md) — Hunt unattended / sysprep leftovers
- [`audit-browser-baseline`](./audit-browser-baseline.md) — Audit Firefox/IE/Edge security baseline
- [`hunt-shell-backdoors`](./hunt-shell-backdoors.md) — Hunt shell aliases and profile backdoors
- [`audit-browser-policy`](./audit-browser-policy.md) — Audit browser homepage / proxy / extensions

### packages

- [`list-installed-packages`](./list-installed-packages.md) — List installed packages
- [`find-prohibited-software`](./find-prohibited-software.md) — Find prohibited software
- [`remove-package`](./remove-package.md) — Remove a package
- [`hunt-remote-access-tools`](./hunt-remote-access-tools.md) — Hunt remote-access tools and browser extensions
- [`remove-games-samples`](./remove-games-samples.md) — Remove games and sample content
- [`scan-malware-tools`](./scan-malware-tools.md) — ClamAV / chkrootkit scan report
- [`audit-snap-flatpak`](./audit-snap-flatpak.md) — Audit Snap/Flatpak unnecessary apps

### logging

- [`audit-logging`](./audit-logging.md) — Audit logging configuration
- [`check-auditd`](./check-auditd.md) — Check auditd
- [`enable-audit-policy`](./enable-audit-policy.md) — Enable Success+Failure audit policy
- [`audit-log-persistence`](./audit-log-persistence.md) — Audit rsyslog/journald persistence

### updates

- [`check-pending-updates`](./check-pending-updates.md) — Check pending updates
- [`apply-security-updates`](./apply-security-updates.md) — Apply security updates
- [`audit-auto-updates`](./audit-auto-updates.md) — Audit unattended-upgrades / Windows Update
- [`enable-unattended-upgrades`](./enable-unattended-upgrades.md) — Enable unattended-upgrades

### scheduled

- [`audit-cron`](./audit-cron.md) — Audit cron jobs
- [`audit-at-jobs`](./audit-at-jobs.md) — Audit at jobs
- [`list-scheduled-tasks`](./list-scheduled-tasks.md) — List scheduled tasks
- [`audit-persistence-deep`](./audit-persistence-deep.md) — Deep startup persistence audit
- [`restrict-cron-at`](./restrict-cron-at.md) — Restrict at/cron to root

### kernel

- [`audit-sysctl`](./audit-sysctl.md) — Audit sysctl hardening
- [`harden-sysctl`](./harden-sysctl.md) — Apply sysctl hardening
- [`audit-startup-items`](./audit-startup-items.md) — Audit startup items
- [`audit-mac-enforcement`](./audit-mac-enforcement.md) — Audit AppArmor/SELinux enforcement
- [`blacklist-kernel-modules`](./blacklist-kernel-modules.md) — Blacklist uncommon kernel modules
- [`enforce-apparmor-profiles`](./enforce-apparmor-profiles.md) — Enforce AppArmor profiles for common apps
- [`disable-ctrl-alt-del`](./disable-ctrl-alt-del.md) — Disable Ctrl+Alt+Del and extra TTYs
- [`audit-ipv6-privacy`](./audit-ipv6-privacy.md) — Audit IPv6 privacy / optional disable
- [`harden-usb-storage`](./harden-usb-storage.md) — Harden USB autorun / storage policy

### windows

- [`disable-smbv1`](./disable-smbv1.md) — Disable SMBv1
- [`enable-windows-defender`](./enable-windows-defender.md) — Enable Microsoft Defender
- [`audit-powershell-logging`](./audit-powershell-logging.md) — Audit PowerShell logging
- [`disable-autoplay`](./disable-autoplay.md) — Disable Autoplay
- [`check-bitlocker-status`](./check-bitlocker-status.md) — Check BitLocker status
- [`audit-iis`](./audit-iis.md) — IIS feature inventory + anonymous auth
- [`apply-security-template`](./apply-security-template.md) — Apply local security template
- [`disable-remote-registry`](./disable-remote-registry.md) — Disable Remote Registry
- [`disable-remote-assistance`](./disable-remote-assistance.md) — Disable Remote Assistance
- [`disable-optional-windows-features`](./disable-optional-windows-features.md) — Disable optional Windows features
- [`run-sfc-scan`](./run-sfc-scan.md) — Run system file integrity check
- [`harden-print-spooler`](./harden-print-spooler.md) — Harden Print Spooler / disable remote print
- [`audit-lsa-protection`](./audit-lsa-protection.md) — Audit LSA protection / RunAsPPL
- [`audit-credential-guard`](./audit-credential-guard.md) — Audit Credential Guard / Device Guard
- [`audit-secure-boot`](./audit-secure-boot.md) — Audit Secure Boot / UEFI
- [`audit-wifi-profiles`](./audit-wifi-profiles.md) — Audit leftover Wi-Fi profiles
- [`harden-powershell-constrained`](./harden-powershell-constrained.md) — Harden PowerShell logging / Constrained Language
- [`disable-smb-client-v1`](./disable-smb-client-v1.md) — Disable SMBv1 client leftovers
- [`audit-windows-roles`](./audit-windows-roles.md) — Audit Windows Server roles

### evidence

- [`export-evidence-bundle`](./export-evidence-bundle.md) — Export evidence bundle
- [`package-forensics-evidence`](./package-forensics-evidence.md) — Package redacted forensics evidence
- [`one-click-hardening-checklist`](./one-click-hardening-checklist.md) — One-click hardening checklist
- [`score-image-heuristics`](./score-image-heuristics.md) — Score image heuristics
- [`find-backdoor-binaries`](./find-backdoor-binaries.md) — Find suspicious binaries
- [`scoreboard-preflight`](./scoreboard-preflight.md) — Scoreboard preflight checklist
- [`post-harden-checklist`](./post-harden-checklist.md) — Post-harden verification checklist
- [`skim-forensics-readme`](./skim-forensics-readme.md) — Skim local README for forensics keywords
- [`round-start-wizard`](./round-start-wizard.md) — Round-start wizard
- [`export-coach-packet`](./export-coach-packet.md) — Export redacted coach packet ZIP

