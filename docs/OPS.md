# CyberPatriot ops catalog

Typed operations exported from `@cyberpatriot/ops-catalog`.
Every op is **defensive, authorized-image hardening** for CyberPatriot.
See [SAFETY.md](./SAFETY.md) before running anything with `mode: "live"`.
How-to explainers for every op: [howto/](./howto/).

- **Count:** 138
- **Default run mode:** demo (Mac-safe fixtures, no host mutation)
- **Mutations:** live mode requires `confirm: true` in `POST /ops/:id/run`

## Philosophy

Stay inside CyberPatriot rules: authorized image only, no remote attacks,
no scoring-server tricks, no exploit payloads. Push the envelope of *legal*
automation — bulk audits, heuristic suspicion scoring, one-click checklists,
exportable redacted evidence — like Sabbath coffee: creative, not cheating.

## Index

| ID | Title | Category | Platforms | Risk |
| --- | --- | --- | --- | --- |
| `list-users` | List local users | users | both | read |
| `flag-suspicious-users` | Flag suspicious users | users | both | read |
| `disable-user` | Disable a local user | users | both | mutate |
| `lock-user` | Lock a local user password | users | both | mutate |
| `remove-user-from-admins` | Remove user from administrators | users | both | mutate |
| `list-admin-users` | List administrators and sudoers | users | both | read |
| `audit-uid-zero` | Audit UID 0 accounts | users | linux | read |
| `check-empty-passwords` | Check for empty passwords | users | both | read |
| `audit-never-logged-in` | Audit never-logged-in humans | users | both | read |
| `check-user-shells` | Check login shells | users | linux | read |
| `list-groups` | List local groups | users | both | read |
| `disable-guest-account` | Disable Guest account | users | both | mutate |
| `audit-duplicate-uids` | Audit duplicate UIDs | users | linux | read |
| `expire-user-password` | Expire a user password | users | both | mutate |
| `audit-password-policy` | Audit password policy | auth | both | read |
| `enforce-password-policy` | Enforce password policy | auth | both | mutate |
| `check-password-aging` | Check password aging | auth | linux | read |
| `audit-pam` | Audit PAM configuration | auth | linux | read |
| `enable-account-lockout` | Enable account lockout | auth | both | mutate |
| `disable-root-ssh` | Disable SSH root login | auth | linux | mutate |
| `audit-sudoers` | Audit sudoers | auth | linux | read |
| `audit-uac` | Audit User Account Control | auth | windows | read |
| `list-services` | List services | services | both | read |
| `flag-risky-services` | Flag risky services | services | both | read |
| `disable-service` | Disable a service | services | both | mutate |
| `audit-ftp-telnet` | Audit FTP and Telnet | services | both | read |
| `disable-telnet` | Disable Telnet | services | both | mutate |
| `disable-legacy-r-services` | Disable rsh/rlogin/rexec | services | linux | mutate |
| `audit-smb` | Audit SMB / Samba | services | both | read |
| `audit-listening-ports` | Audit listening ports | ports | both | read |
| `ssh-hardening-audit` | SSH hardening audit | network | linux | read |
| `harden-sshd` | Harden sshd_config | network | linux | mutate |
| `audit-rdp` | Audit Remote Desktop | network | windows | read |
| `disable-rdp` | Disable Remote Desktop | network | windows | mutate |
| `audit-hosts-file` | Audit hosts file | network | both | read |
| `check-ntp` | Check time synchronization | network | both | read |
| `audit-firewall` | Audit host firewall | firewall | both | read |
| `enable-firewall` | Enable host firewall | firewall | both | mutate |
| `list-firewall-rules` | List firewall rules | firewall | both | read |
| `apply-default-deny-inbound` | Apply default-deny inbound | firewall | both | mutate |
| `find-world-writable` | Find world-writable files | files | linux | read |
| `find-suid-sgid` | Find SUID/SGID files | files | linux | read |
| `find-media-files` | Find prohibited media files | files | both | read |
| `audit-home-permissions` | Audit home directory permissions | files | linux | read |
| `check-sensitive-file-perms` | Check sensitive file permissions | files | linux | read |
| `audit-ssh-authorized-keys` | Audit SSH authorized_keys | files | linux | read |
| `find-hidden-executables` | Find hidden executables | files | both | read |
| `list-installed-packages` | List installed packages | packages | both | read |
| `find-prohibited-software` | Find prohibited software | packages | both | read |
| `remove-package` | Remove a package | packages | both | mutate |
| `audit-logging` | Audit logging configuration | logging | both | read |
| `check-auditd` | Check auditd | logging | linux | read |
| `check-pending-updates` | Check pending updates | updates | both | read |
| `apply-security-updates` | Apply security updates | updates | both | mutate |
| `audit-cron` | Audit cron jobs | scheduled | linux | read |
| `audit-at-jobs` | Audit at jobs | scheduled | linux | read |
| `list-scheduled-tasks` | List scheduled tasks | scheduled | windows | read |
| `audit-sysctl` | Audit sysctl hardening | kernel | linux | read |
| `harden-sysctl` | Apply sysctl hardening | kernel | linux | mutate |
| `audit-startup-items` | Audit startup items | kernel | both | read |
| `disable-smbv1` | Disable SMBv1 | windows | windows | mutate |
| `enable-windows-defender` | Enable Microsoft Defender | windows | windows | mutate |
| `audit-powershell-logging` | Audit PowerShell logging | windows | windows | read |
| `disable-autoplay` | Disable Autoplay | windows | windows | mutate |
| `check-bitlocker-status` | Check BitLocker status | windows | windows | read |
| `export-evidence-bundle` | Export evidence bundle | evidence | both | read |
| `package-forensics-evidence` | Package redacted forensics evidence | evidence | both | read |
| `one-click-hardening-checklist` | One-click hardening checklist | evidence | both | read |
| `score-image-heuristics` | Score image heuristics | evidence | both | read |
| `find-backdoor-binaries` | Find suspicious binaries | evidence | both | read |
| `audit-shared-folders` | Audit shared folders | files | both | read |
| `diff-expected-ports` | Diff listeners vs expected ports | ports | both | read |
| `audit-share-acls` | Dump unauthorized share ACLs | files | both | read |
| `audit-persistence-deep` | Deep startup persistence audit | scheduled | both | read |
| `hunt-remote-access-tools` | Hunt remote-access tools and browser extensions | packages | both | read |
| `report-password-never-expires` | Report never-expires + blank password combo | auth | both | read |
| `audit-critical-perm-drift` | Audit critical permission drift | files | both | read |
| `scoreboard-preflight` | Scoreboard preflight checklist | evidence | both | read |
| `post-harden-checklist` | Post-harden verification checklist | evidence | both | read |
| `select-unauthorized-users` | Select unauthorized users (allowlist miss) | users | both | read |
| `audit-sticky-tmp` | Audit sticky bit on temp dirs | files | linux | read |
| `audit-anonymous-ftp` | Audit anonymous FTP / vsftpd | services | both | read |
| `harden-vsftpd` | Harden vsftpd (disable anonymous) | services | linux | mutate |
| `audit-web-server` | Apache/nginx hardening checklist | services | linux | read |
| `disable-llmnr-netbios-wpad` | Disable LLMNR / NetBIOS / WPAD | network | windows | mutate |
| `audit-null-session` | Audit null session / anonymous SAM | auth | windows | read |
| `audit-idle-lock` | Audit screensaver / idle lock | auth | both | read |
| `hunt-sysprep-leftovers` | Hunt unattended / sysprep leftovers | files | both | read |
| `audit-snmp` | Audit SNMP community / insecure mgmt | services | both | read |
| `audit-mac-enforcement` | Audit AppArmor/SELinux enforcement | kernel | linux | read |
| `audit-browser-baseline` | Audit Firefox/IE/Edge security baseline | files | both | read |
| `audit-auto-updates` | Audit unattended-upgrades / Windows Update | updates | both | read |
| `remove-games-samples` | Remove games and sample content | packages | both | mutate |
| `audit-iis` | IIS feature inventory + anonymous auth | windows | windows | read |
| `skim-forensics-readme` | Skim local README for forensics keywords | evidence | both | read |
| `apply-security-template` | Apply local security template | windows | windows | mutate |
| `import-firewall-profile` | Import firewall profile | firewall | windows | mutate |
| `enable-audit-policy` | Enable Success+Failure audit policy | logging | windows | mutate |
| `disable-remote-registry` | Disable Remote Registry | windows | windows | mutate |
| `disable-remote-assistance` | Disable Remote Assistance | windows | windows | mutate |
| `force-password-change` | Force password change at next logon | users | both | mutate |
| `sync-authorized-users` | Sync users from allowlists | users | both | mutate |
| `disable-optional-windows-features` | Disable optional Windows features | windows | windows | mutate |
| `run-sfc-scan` | Run system file integrity check | windows | windows | read |
| `clear-suspicious-hosts` | Clear suspicious hosts-file entries | network | both | mutate |
| `disable-display-manager-guest` | Disable display-manager guest and autologin | auth | linux | mutate |
| `lock-root-account` | Lock the root password | users | linux | mutate |
| `enable-fail2ban` | Install and enable fail2ban | auth | linux | mutate |
| `harden-host-conf` | Harden host.conf nospoof | network | linux | mutate |
| `set-ufw-logging` | Set UFW logging high and verify defaults | firewall | linux | mutate |
| `restrict-cron-at` | Restrict at/cron to root | scheduled | linux | mutate |
| `hunt-shell-backdoors` | Hunt shell aliases and profile backdoors | files | both | read |
| `scan-malware-tools` | ClamAV / chkrootkit scan report | packages | linux | mutate |
| `round-start-wizard` | Round-start wizard | evidence | both | read |
| `harden-print-spooler` | Harden Print Spooler / disable remote print | windows | windows | mutate |
| `audit-lsa-protection` | Audit LSA protection / RunAsPPL | windows | windows | read |
| `audit-credential-guard` | Audit Credential Guard / Device Guard | windows | windows | read |
| `audit-secure-boot` | Audit Secure Boot / UEFI | windows | windows | read |
| `audit-wifi-profiles` | Audit leftover Wi-Fi profiles | windows | windows | read |
| `harden-powershell-constrained` | Harden PowerShell logging / Constrained Language | windows | windows | mutate |
| `disable-smb-client-v1` | Disable SMBv1 client leftovers | windows | windows | mutate |
| `audit-dns-client` | Audit DNS client / DoH | network | windows | read |
| `audit-windows-roles` | Audit Windows Server roles | windows | windows | read |
| `harden-null-session` | Harden anonymous enumeration / null sessions | auth | windows | mutate |
| `blacklist-kernel-modules` | Blacklist uncommon kernel modules | kernel | linux | mutate |
| `enforce-apparmor-profiles` | Enforce AppArmor profiles for common apps | kernel | linux | mutate |
| `enable-unattended-upgrades` | Enable unattended-upgrades | updates | linux | mutate |
| `audit-mail-services` | Audit Postfix/Exim/Dovecot relay | services | linux | read |
| `audit-database-bind` | Audit database bind-address / anonymous | services | linux | read |
| `audit-php-hardening` | Audit PHP expose_php / dangerous functions | services | linux | read |
| `audit-snap-flatpak` | Audit Snap/Flatpak unnecessary apps | packages | linux | read |
| `disable-ctrl-alt-del` | Disable Ctrl+Alt+Del and extra TTYs | kernel | linux | mutate |
| `audit-ipv6-privacy` | Audit IPv6 privacy / optional disable | kernel | linux | read |
| `audit-log-persistence` | Audit rsyslog/journald persistence | logging | linux | read |
| `audit-browser-policy` | Audit browser homepage / proxy / extensions | files | both | read |
| `harden-usb-storage` | Harden USB autorun / storage policy | kernel | both | mutate |
| `audit-time-timezone` | Audit time sync and timezone | network | both | read |
| `export-coach-packet` | Export redacted coach packet ZIP | evidence | both | read |

## Details

### users

#### `list-users`

- **Title:** List local users
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** 15 mixed Linux/Windows accounts including root, alice, toor (UID 0), hacker123, Guest, and service accounts

Enumerate local accounts with UID/GID or SID, home/profile, shell, group membership, lock state, and last-login timestamp. Password hashes are never returned. Authorized-image hardening only: never used against other teams, scoring endpoints, or off-image hosts.

#### `flag-suspicious-users`

- **Title:** Flag suspicious users
- **Platforms:** both
- **Risk:** read
- **Params:** `allowlistPath` (string)
- **Demo fixture:** Scored users: toor (UID 0), hacker123 (name+allowlist), zygote (shell/home/recent), nologin_admin (never logged in + sudo), Guest, flag; alice/bob/coach clean

Heuristic suspicion scoring for local accounts. Signals: never-logged-in humans, nonstandard shells, UID weirdness (non-root UID 0, duplicate UIDs, login shells on low UIDs), home outside /home, throwaway/backdoor name patterns, recently created accounts, and identities missing from config/allowed-users.txt. Admins not on the README allowlist score extra. This is a bulk audit with exportable reasons — not credential dumping and not an exploit. Use scores to prioritize lock/disable/remove-from-admin on the authorized image.

#### `disable-user`

- **Title:** Disable a local user
- **Platforms:** both
- **Risk:** mutate
- **Params:** `username*` (string), `dryRun` (boolean)
- **Demo fixture:** Simulates disabling hacker123; reports before/after lock and shell

Disable an unauthorized local account (usermod/nologin or Disable-LocalUser). Live mode requires confirm:true. Does not delete home directories (forensics questions may need them).

#### `lock-user`

- **Title:** Lock a local user password
- **Platforms:** both
- **Risk:** mutate
- **Params:** `username*` (string), `dryRun` (boolean)
- **Demo fixture:** Simulates locking zygote; account remains listed but locked

Lock the password of a local account (passwd -l / usermod -L or net user /active:no equivalent lock) so the account cannot authenticate, without destroying the account record. Live mode requires confirm:true.

#### `remove-user-from-admins`

- **Title:** Remove user from administrators
- **Platforms:** both
- **Risk:** mutate
- **Params:** `username*` (string), `dryRun` (boolean)
- **Demo fixture:** Simulates removing nologin_admin from sudo while leaving the account enabled

Drop a user from Administrators / sudo / wheel. Preferred over deletion when the README lists them as a standard user. Live mode requires confirm:true.

#### `list-admin-users`

- **Title:** List administrators and sudoers
- **Platforms:** both
- **Risk:** read
- **Params:** `allowlistPath` (string)
- **Demo fixture:** root, alice (expected sudo), nologin_admin (unexpected sudo), toor (UID 0), Administrator

List members of Administrators, sudo, wheel, and UID 0. Cross-check against the README allowlist so extra admins are obvious.

#### `audit-uid-zero`

- **Title:** Audit UID 0 accounts
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** root (expected) and toor (duplicate UID 0, home /tmp/toor)

Find every passwd entry with UID 0. Only root should have UID 0 on a CyberPatriot Linux image. Extra UID 0 accounts are classic backdoors; flag them for disable.

#### `check-empty-passwords`

- **Title:** Check for empty passwords
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** Guest and games have empty/unusable-or-empty password flags; alice has a set password

Detect accounts with empty or non-set passwords (shadow '!'/'!!'/empty, PasswordRequired=false). Never prints hashes — only a boolean empty/locked/set classification.

#### `audit-never-logged-in`

- **Title:** Audit never-logged-in humans
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** nologin_admin and flag never logged in; alice logged in recently

Human/interactive accounts that have never logged in are often leftover or planted. Compare lastlog / LastLogon against the allowlist; service accounts with nologin are ignored.

#### `check-user-shells`

- **Title:** Check login shells
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** zygote uses /usr/bin/python3; games uses /bin/bash despite being a system UID

Report login shells. Interactive users should use a standard shell (bash/sh); system users should be nologin/false. Nonstandard shells (/tmp/*, interpreters, csh/zsh on a bash image, empty) are suspicious.

#### `list-groups`

- **Title:** List local groups
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** sudo (alice, nologin_admin), docker (zygote — unexpected), Administrators

Enumerate local groups and membership. Highlight privileged groups (sudo, wheel, Administrators, Hyper-V, Remote Desktop Users, docker).

#### `disable-guest-account`

- **Title:** Disable Guest account
- **Platforms:** both
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates disabling Guest; account remains but enabled=false

Disable the Guest / guest account on Windows and Linux. Guest is almost never authorized on CP images. Live mode requires confirm:true.

#### `audit-duplicate-uids`

- **Title:** Audit duplicate UIDs
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** toor shares UID 0 with root

Find distinct usernames sharing a UID. Duplicate UID 0 is critical; other collisions still break auditing and privilege boundaries.

#### `expire-user-password`

- **Title:** Expire a user password
- **Platforms:** both
- **Risk:** mutate
- **Params:** `username*` (string), `dryRun` (boolean)
- **Demo fixture:** Simulates expiring bob's password without locking the account

Force a password change at next login (chage -d 0 / net user /logonpasswordchg:yes). Useful for authorized users with stale or known-default passwords. Live mode requires confirm:true.

#### `select-unauthorized-users`

- **Title:** Select unauthorized users (allowlist miss)
- **Platforms:** both
- **Risk:** read
- **Params:** `allowlistPath` (string)
- **Demo fixture:** hacker123, toor, zygote, nologin_admin, flag, Guest selected; alice/bob/coach/root not selected; extra-admin nologin_admin

Bulk-select interactive accounts that miss config/allowed-users.txt (or the README list). Returns a disable/lock-ready name list plus extra admins and allowlist names missing from the image. Deepens flag-suspicious-users: this is the round-one 'who do we turn off' table, not a credential dump. Authorized-image hardening only: never used against other teams, scoring endpoints, or off-image hosts.

#### `force-password-change`

- **Title:** Force password change at next logon
- **Platforms:** both
- **Risk:** mutate
- **Params:** `username` (string), `allowlistPath` (string), `dryRun` (boolean)
- **Demo fixture:** Bulk demo: would expire alice, bob, coach (not root/hacker123); per-user demo expires bob

Expire passwords so the user must change at next logon (chage -d 0 / net user /logonpasswordchg:yes). Pass username for one account, or omit it to bulk-expire humans on config/allowed-users.txt (root skipped in bulk). Deepens expire-user-password. Never invents or prints passwords. Live requires confirm:true.

#### `sync-authorized-users`

- **Title:** Sync users from allowlists
- **Platforms:** both
- **Risk:** mutate
- **Params:** `allowlistPath` (string), `adminsPath` (string), `dryRun` (boolean)
- **Demo fixture:** Missing dave (create, set password manually); extras hacker123/toor/Guest; extra-admin nologin_admin; alice already admin

Create missing README humans from config/allowed-users.txt and promote missing admins from config/allowed-admins.txt. Extra interactive users and extra admins are flagged — not auto-disabled. Never invents passwords: new accounts are created without a password and listed under setPasswordManually. Live requires confirm:true. Bend-parallel user sweep when available. Authorized-image hardening only: never used against other teams, scoring endpoints, or off-image hosts.

#### `lock-root-account`

- **Title:** Lock the root password
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates passwd -l root; account remains UID 0 but password locked

Lock the root account password with passwd -l so root cannot authenticate with a password (sudo can remain). Confirm-gated. Does not delete root or disable UID 0. Check the README before locking if a console root login is required.

### auth

#### `audit-password-policy`

- **Title:** Audit password policy
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** minlen 8 (too short), PASS_MAX_DAYS 99999, no complexity — several findings

Read /etc/login.defs + PAM pwquality/cracklib, or net accounts / secedit policy: min length, aging, history, complexity. Compare to typical CP baselines (length ≥12–14, history, max age).

#### `enforce-password-policy`

- **Title:** Enforce password policy
- **Platforms:** both
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates writing login.defs/pwquality and a Windows net accounts policy

Apply a conservative CP-friendly policy: min length 14, remember 5, max age 90, min age 1, complexity on, inactive lock. Does not change existing password hashes. Live requires confirm:true.

#### `check-password-aging`

- **Title:** Check password aging
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** bob MAX_DAYS=99999; alice 90; root aging disabled

Parse chage/shadow aging fields (without hashes). Flag max days of -1/99999 on human accounts and users with aging disabled.

#### `audit-pam`

- **Title:** Audit PAM configuration
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** common-auth still has nullok; no faillock; pwquality missing

Inspect common-auth / system-auth for pam_pwquality, pam_tally2/faillock, pam_unix remember, and nullok. nullok is a high finding; missing faillock is medium.

#### `enable-account-lockout`

- **Title:** Enable account lockout
- **Platforms:** both
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates enabling faillock and net accounts /lockoutthreshold:5

Enable PAM faillock or Windows lockout policy after repeated failures (deny=5, unlock_time=600). Stops password-guessing on the local image only. Live mode requires confirm:true.

#### `disable-root-ssh`

- **Title:** Disable SSH root login
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates PermitRootLogin yes → no with a config diff snippet

Set PermitRootLogin no in sshd_config and reload ssh if it is a required service. Live requires confirm:true.

#### `audit-sudoers`

- **Title:** Audit sudoers
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** nologin_admin ALL=(ALL) NOPASSWD: ALL; /etc/sudoers.d/hack world-writable

Read /etc/sudoers and sudoers.d for NOPASSWD, ALL=(ALL) ALL granted to unexpected users, and world-writable sudoers files. Does not execute sudo commands as other users.

#### `audit-uac`

- **Title:** Audit User Account Control
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** EnableLUA=0 (UAC off), ConsentPromptBehaviorAdmin=0

Read EnableLUA, ConsentPromptBehaviorAdmin, and PromptOnSecureDesktop. UAC disabled is a high finding on a Windows CP image.

#### `report-password-never-expires`

- **Title:** Report never-expires + blank password combo
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** Guest empty+never-expires (critical); bob never-expires with a set password; alice OK

Combine password-aging (shadow MAX_DAYS -1/99999 or Windows PasswordNeverExpires) with empty-password classification. Human accounts that never expire, especially with a blank password, are high. Never prints hashes — only empty/locked/set + never-expires booleans.

#### `audit-null-session`

- **Title:** Audit null session / anonymous SAM
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** RestrictAnonymous=0, RestrictAnonymousSAM=0, EveryoneIncludesAnonymous=1, NullSessionShares listed

Read RestrictAnonymous, RestrictAnonymousSAM, EveryoneIncludesAnonymous, RestrictNullSessAccess, NullSessionPipes, and NullSessionShares. Anonymous SAM/null sessions are high Windows findings. Classification only — never dumps SAM, hashes, or pipe contents.

#### `audit-idle-lock`

- **Title:** Audit screensaver / idle lock
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** No TMOUT; IdleAction ignore; Windows ScreenSaverIsSecure=0 timeout 9999

Check idle/screensaver lock: Linux TMOUT/logind IdleAction and dconf idle-delay; Windows ScreenSaveActive, ScreenSaverIsSecure, and ScreenSaveTimeOut. Unlocked idle sessions are a frequent policy item. Read-only.

#### `disable-display-manager-guest`

- **Title:** Disable display-manager guest and autologin
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates LightDM allow-guest=false and GDM AutomaticLoginEnable=false; autologin-user cleared

Turn off LightDM/GDM guest sessions and autologin (allow-guest=false, autologin-user empty, AutomaticLoginEnable=false). Distinct from disable-guest-account (the Guest user). Live requires confirm:true.

#### `enable-fail2ban`

- **Title:** Install and enable fail2ban
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates apt install fail2ban and systemctl enable --now; jail.d sshd on

Install fail2ban if the distro package is available, then enable and start the service on the authorized image. If apt/dnf cannot provide it, report unavailable — do not fetch random GitHub installers. Live requires confirm:true. dryRun reports presence only. Local SSH brute-force defense, not a remote attack.

#### `harden-null-session`

- **Title:** Harden anonymous enumeration / null sessions
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates the four LSA restrict values set to the hardened baseline

Set RestrictAnonymous=1, RestrictAnonymousSAM=1, EveryoneIncludesAnonymous=0, RestrictNullSessAccess=1. Deepens the read-only audit-null-session. Does not dump SAM, pipes, or hashes. Live requires confirm:true.

### services

#### `list-services`

- **Title:** List services
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** sshd (required, running), telnet (enabled — bad), cups, avahi, smbd, apache2, mysql

List systemd/Windows services with active/enabled state. Annotate against config/required-services.txt and config/risky-services.txt.

#### `flag-risky-services`

- **Title:** Flag risky services
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** telnet, vsftpd, smbd, cups, avahi, RemoteRegistry flagged; sshd/apache2 required

Cross-check running/enabled services against the risky list and required list. Telnet, rsh, anonymous FTP, SMBv1, RemoteRegistry, and similar score high unless the README explicitly requires them. Bulk audit, not an exploit scan of other hosts.

#### `disable-service`

- **Title:** Disable a service
- **Platforms:** both
- **Risk:** mutate
- **Params:** `service*` (string), `dryRun` (boolean), `force` (boolean)
- **Demo fixture:** Simulates disabling telnet.socket and vsftpd

Stop and disable a local service (systemctl disable --now / Set-Service -StartupType Disabled). Live requires confirm:true. Will refuse to disable names in required-services.txt unless forced.

#### `audit-ftp-telnet`

- **Title:** Audit FTP and Telnet
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** telnet.socket enabled, vsftpd running with anonymous_enable=YES, port 23 open

Detect telnet/ftp servers, sockets, and listening 21/23. Anonymous FTP and Telnet are almost never kosher on CP images.

#### `disable-telnet`

- **Title:** Disable Telnet
- **Platforms:** both
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates stopping telnet and adding a deny-23 firewall rule

Disable telnetd / TlntSvr / telnet.socket and block tcp/23 on the host firewall. Live requires confirm:true.

#### `disable-legacy-r-services`

- **Title:** Disable rsh/rlogin/rexec
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates disabling rsh.socket rlogin.socket rexec.socket

Disable rsh, rlogin, rexec, and related xinetd entries. These trust-based remotes have no place on a CP image. Live mode requires confirm:true.

#### `audit-smb`

- **Title:** Audit SMB / Samba
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** smbd running, map to guest, SMBv1 enabled, public share with Everyone Full

Report smbd/nmbd/LanmanServer state, guest/anonymous access, SMBv1, and share list. Guest shares and SMBv1 are high findings unless the README requires file sharing.

#### `audit-anonymous-ftp`

- **Title:** Audit anonymous FTP / vsftpd
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** vsftpd anonymous_enable=YES, write_enable=YES, anon_upload_enable=YES; port 21 open

Parse vsftpd/proftpd/pure-ftpd (and Windows FTPSVC) for anonymous_enable, anon_upload, write_enable, and chroot. Deeper than audit-ftp-telnet: reports the insecure knobs, not just that ftpd is running. Does not log in anonymously or scan other hosts.

#### `harden-vsftpd`

- **Title:** Harden vsftpd (disable anonymous)
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates writing anonymous_enable=NO and disabling vsftpd because it is not required

Set anonymous_enable=NO, write_enable=NO, and anon_upload_enable=NO in vsftpd.conf (or the distro equivalent). If FTP is not a required service, also stop/disable vsftpd. Live requires confirm:true. README-required FTP stays up, just without anonymous write.

#### `audit-web-server`

- **Title:** Apache/nginx hardening checklist
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** Options Indexes on; ServerTokens OS; nginx autoindex on; TLSv1 still offered

Read-only Apache/httpd/nginx checklist: directory listings, ServerTokens/server_tokens, ServerSignature, TraceEnable, weak SSLProtocol/ssl_protocols, AllowOverride All, and cgi/userdir if present. Does not disable a README-required web server and does not scan other hosts.

#### `audit-snmp`

- **Title:** Audit SNMP community / insecure mgmt
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** snmpd running, rocommunity public, rwcommunity private, UDP/161 open

Detect snmpd/SNMP service and default community strings (public/private), rwcommunity, and related insecure mgmt listeners (chargen, discard, ident). Reports community *names* that look default; never uses them to walk other hosts.

#### `audit-mail-services`

- **Title:** Audit Postfix/Exim/Dovecot relay
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** postfix inet_interfaces=all, mynetworks includes 0.0.0.0/0, disable_vrfy_command=no

If postfix/exim/dovecot is installed, audit inet_interfaces, mynetworks, smtpd relay restrictions, disable_vrfy, and plaintext auth. Flags open relay and VRFY. Local config only — does not send mail or probe other MX hosts.

#### `audit-database-bind`

- **Title:** Audit database bind-address / anonymous
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** mysqld bind-address=0.0.0.0; skip-grant-tables in systemd override; pg_hba host all all 0.0.0.0/0 trust

If MySQL/MariaDB/Postgres is installed, read bind-address / listen_addresses and pg_hba trust/ident. Flags 0.0.0.0 bind and skip-grant-tables. Does not connect with credentials, dump user tables, or print passwords.

#### `audit-php-hardening`

- **Title:** Audit PHP expose_php / dangerous functions
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** expose_php=On, allow_url_include=On, disable_functions empty; /var/www/html/info.php present

If PHP/LAMP is present, read php.ini: expose_php, display_errors, allow_url_include, allow_url_fopen, disable_functions. Inventory info.php by name under web roots (contents not dumped). Local files only.

### ports

#### `audit-listening-ports`

- **Title:** Audit listening ports
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** 22/80 expected; 23, 445, 31337/nc, 4444 flagged

List TCP/UDP listeners (ss/Get-NetTCPConnection) bound on this image. Flag 23, 111, 139, 445, 512-514, 5900, 31337, 4444, and anything bound to 0.0.0.0 that is not a required service. Local audit only — does not scan other hosts.

#### `diff-expected-ports`

- **Title:** Diff listeners vs expected ports
- **Platforms:** both
- **Risk:** read
- **Params:** `expectedPortsPath` (string)
- **Demo fixture:** Unexpected 23/31337/445; expected 22/80 present; 443 missing

Compare this image's TCP/UDP listeners to config/expected-ports.txt (README-allowed services). Reports unexpected listeners and missing expected ports. Local ss/Get-NetTCPConnection only — never scans other hosts or the scoring server. Authorized-image hardening only: never used against other teams, scoring endpoints, or off-image hosts.

### network

#### `ssh-hardening-audit`

- **Title:** SSH hardening audit
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** PermitRootLogin yes, PermitEmptyPasswords yes, Protocol 2+1, X11Forwarding yes

Parse sshd_config: PermitRootLogin, PasswordAuthentication, Protocol, X11Forwarding, MaxAuthTries, PermitEmptyPasswords, Ciphers/MACs, AllowUsers. Read-only; does not connect outbound.

#### `harden-sshd`

- **Title:** Harden sshd_config
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates a drop-in at /etc/ssh/sshd_config.d/99-cp-hardening.conf

Write a conservative sshd drop-in: PermitRootLogin no, PermitEmptyPasswords no, X11Forwarding no, MaxAuthTries 4, Protocol 2. Reloads sshd. Live requires confirm:true.

#### `audit-rdp`

- **Title:** Audit Remote Desktop
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** RDP enabled, NLA off, TermService running

Check fDenyTSConnections, NLA, and TermService. RDP should be off unless the README requires it; NLA should be on if RDP stays.

#### `disable-rdp`

- **Title:** Disable Remote Desktop
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates disabling RDP and stopping TermService

Set fDenyTSConnections=1 and stop TermService if RDP is not a required service. Live requires confirm:true.

#### `audit-hosts-file`

- **Title:** Audit hosts file
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** Suspicious redirect of windowsupdate.microsoft.com and an extra 0.0.0.0 google.com

Read /etc/hosts or drivers/etc/hosts for unexpected redirects (windows update, antivirus, scoring sites, social). Does not contact those hosts.

#### `check-ntp`

- **Title:** Check time synchronization
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** timesyncd inactive; fake NTP server 10.0.0.1 in config

Check chronyd/systemd-timesyncd/w32time status. Wrong clocks break logs and Kerberos; this is a local config audit, not an NTP amplification test.

#### `disable-llmnr-netbios-wpad`

- **Title:** Disable LLMNR / NetBIOS / WPAD
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates LLMNR off, NetBIOS disabled on adapters, WPAD AutoDetect=0

Turn off LLMNR (EnableMulticast=0), NetBIOS over TCP/IP (SetTcpipNetbios 2), and WPAD/autodetect proxy on the local Windows image. These name-resolution shortcuts are common CP plants and are not needed on a hardened workstation. Live requires confirm:true. dryRun reports current state without changing it.

#### `clear-suspicious-hosts`

- **Title:** Clear suspicious hosts-file entries
- **Platforms:** both
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Would drop 127.0.0.1 windowsupdate.microsoft.com and 0.0.0.0 google.com; keep localhost

Remove hosts-file lines that sinkhole Windows Update, AV, or well-known names to 127.0.0.1/0.0.0.0. Keeps localhost and the machine hostname. Complements audit-hosts-file. Live requires confirm:true. dryRun lists lines that would be dropped. Local file only.

#### `harden-host-conf`

- **Title:** Harden host.conf nospoof
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates writing order hosts,bind / multi on / nospoof on

Write /etc/host.conf with `order hosts,bind`, `multi on`, and `nospoof on` to mitigate IP spoofing / name tricks on the local resolver. Live requires confirm:true. Complements harden-sysctl rp_filter.

#### `audit-dns-client`

- **Title:** Audit DNS client / DoH
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** DNS 10.13.37.1 (unexpected); DoH unset; NRPT empty; hosts poisoning is a separate op

Read DNS client servers, DoH (DnsClientDoh), and NRPT on the local image. Complements audit-hosts-file (poisoning) without contacting those names. Flags 127.0.0.1-only, empty DoH, and obviously bogus servers. Local config only.

#### `audit-time-timezone`

- **Title:** Audit time sync and timezone
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** timesyncd inactive; NTP 10.13.37.1; timezone Etc/GMT+12 (suspicious); RTC not NTP-synced

Deepen check-ntp: timedatectl/w32time plus timezone sanity (UTC vs America/*, fake NTP 10.x, NTP disabled). Wrong clocks break logs. Local config only — not an NTP amplification test and not a CCS query.

### firewall

#### `audit-firewall`

- **Title:** Audit host firewall
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** ufw inactive; Windows Public profile off; no default deny

Report ufw/firewalld/iptables or Windows Firewall profiles (Domain/Private/Public). A disabled host firewall is a high finding.

#### `enable-firewall`

- **Title:** Enable host firewall
- **Platforms:** both
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates ufw --force enable and Set-NetFirewallProfile -Enabled True

Enable ufw/firewalld or all Windows Firewall profiles. Does not open ports on other machines. Live requires confirm:true.

#### `list-firewall-rules`

- **Title:** List firewall rules
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** Allow 23/tcp, Allow 445, a 0.0.0.0/0 any/any inbound exception

List host firewall rules and highlight allow-any inbound, allow 23/21/445, and disabled default-deny.

#### `apply-default-deny-inbound`

- **Title:** Apply default-deny inbound
- **Platforms:** both
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates default deny inbound + allow 22/80 from required services

Set default incoming deny (ufw default deny incoming / public profile block) while leaving established outbound. Pair with allow rules for required services. Live requires confirm:true.

#### `import-firewall-profile`

- **Title:** Import firewall profile
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `profilePath` (string), `dryRun` (boolean)
- **Demo fixture:** Simulates enabling Domain/Public/Private firewall with Block inbound / Allow outbound (no .wfw in the demo)

Import a netsh .wfw firewall export if profilePath is set, otherwise apply a known-good local profile: all profiles on, default-deny inbound, allow outbound. Confirm-gated. Does not scan other machines. Authorized-image hardening only: never used against other teams, scoring endpoints, or off-image hosts.

#### `set-ufw-logging`

- **Title:** Set UFW logging high and verify defaults
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates logging high, default deny incoming, allow outgoing; ufw was inactive in the fixture

Set `ufw logging high` and verify default deny incoming / allow outgoing on the local host firewall. Does not open ports. Live requires confirm:true. Pair with enable-firewall if UFW is inactive.

### files

#### `find-world-writable`

- **Title:** Find world-writable files
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** /etc/cron.d/hack, /usr/local/bin, /home/bob/public mode 0777

Find world-writable files and directories under /home /etc /opt /tmp /var /usr/local (capped). World-writable sudoers, cron, or PATH dirs are high. Local filesystem only.

#### `find-suid-sgid`

- **Title:** Find SUID/SGID files
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** /tmp/suid_bash, /home/flag/.hidden_shell, plus expected /usr/bin/passwd

List SUID/SGID binaries and compare to a small expected set (passwd, sudo, su, newgrp, ping). SUID copies under /tmp /home /opt /var are critical. Read-only find; does not exploit them.

#### `find-media-files`

- **Title:** Find prohibited media files
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** /home/bob/secret.mp3, /home/alice/Movies/clip.mp4, /Users/Public/song.wav

Find mp3/mp4/avi/mkv/mov/flac/wav/ogg under user homes and common stash dirs. CP README usually forbids media; this is an inventory for authorized deletion, not a wipe-without-review.

#### `audit-home-permissions`

- **Title:** Audit home directory permissions
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** /home/bob 0777, /home/zygote owned by root, /tmp/toor as toor's home

Check that homes are not group/world writable or owned by another user. Mode 777 homes are a finding; root-owned user homes too.

#### `check-sensitive-file-perms`

- **Title:** Check sensitive file permissions
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** /etc/shadow 0644, /etc/sudoers 0666, ssh host key 0644

Verify /etc/passwd, shadow, gshadow, group, sudoers, ssh host keys, crontab. shadow should be 000/640 root:shadow — never world-readable. Does not print file contents of shadow.

#### `audit-ssh-authorized-keys`

- **Title:** Audit SSH authorized_keys
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** root has a key commented hacker@evil; zygote has authorized_keys in /var/tmp

Inventory ~/.ssh/authorized_keys for unexpected keys (comments like 'hacker@evil', extra keys on root). Reports fingerprints and comments, not private keys.

#### `find-hidden-executables`

- **Title:** Find hidden executables
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** /home/flag/.hidden_shell, /tmp/.kworker, Windows Startup .update.exe

Find executable files whose names start with '.' under homes, /tmp, /var/tmp, and Startup folders. Classic CP planted backdoors. Inventory only.

#### `audit-shared-folders`

- **Title:** Audit shared folders
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** public (guest ok, world writable), C$ enabled, IPC$

List Samba shares and Windows SMB shares with guest access, Everyone/Full, and administrative shares. Local config only.

#### `audit-share-acls`

- **Title:** Dump unauthorized share ACLs
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** public: Everyone Full + guest; C$ Everyone; homes browseable

Inventory Samba share options and Windows SMB share ACLs. Flags guest/Everyone Full, world-writable paths, and administrative shares that should not be exposed on a workstation image. Read-only; does not modify ACLs or enumerate other machines.

#### `audit-critical-perm-drift`

- **Title:** Audit critical permission drift
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** /etc/shadow 0644, /etc/sudoers 0666, SAM Everyone:(R) simulated

Read-only mode/ACL check for /etc/shadow, gshadow, sudoers, ssh host keys, and Windows SAM/SYSTEM file ACLs via icacls. Flags world-readable shadow or Everyone-readable SAM. Does not dump SAM, hashes, or private keys.

#### `audit-sticky-tmp`

- **Title:** Audit sticky bit on temp dirs
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** /tmp mode 0777 missing sticky (critical); /var/tmp 1777 ok; /tmp/world dir 0777

Check /tmp, /var/tmp, and /dev/shm for the sticky bit (1777) and inventory world-writable temp files/dirs that are missing sticky. 0777 /tmp without sticky is a classic plant; sticky /tmp is expected. Local filesystem only — Bend-parallel when available.

#### `hunt-sysprep-leftovers`

- **Title:** Hunt unattended / sysprep leftovers
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** C:\Windows\Panther\unattend.xml with AutoLogon key (value omitted); /root/unattend.xml

Find leftover unattend.xml, autounattend.xml, sysprep.xml, Panther, and kickstart files on the authorized image. Flags AutoLogon/Password keys by name only — values are never printed. Local files only; Bend-parallel path hunt when available.

#### `audit-browser-baseline`

- **Title:** Audit Firefox/IE/Edge security baseline
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** Firefox safebrowsing off; IE DisablePasswordSaving=0; Edge SmartScreen off

Check enterprise Firefox policies/user.js and IE/Edge SmartScreen, form-fill, and popup settings on the local image. Flags safebrowsing off, password-saving on a shared image, and insecure protocol handlers. Does not dump cookies, history, or saved passwords.

#### `hunt-shell-backdoors`

- **Title:** Hunt shell aliases and profile backdoors
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** Hits: /home/zygote/.bashrc alias sudo=; /etc/profile.d/backdoor.sh wget|sh; /root/.bashrc HISTFILE unset

Scan /etc/profile, bashrc, profile.d, user rc files, and Windows PowerShell profiles for alias hijacks (sudo/ls/passwd), wget|sh, nc -e, LD_PRELOAD, HISTFILE unset, and /tmp plants. Read-only. Bend-parallel file sweep on Linux when available. Does not execute the rc files.

#### `audit-browser-policy`

- **Title:** Audit browser homepage / proxy / extensions
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** Firefox homepage http://10.13.37.1/pwn; system proxy 10.13.37.1:8080; one unpacked Chrome extension id

Deepen audit-browser-baseline: Firefox/Chrome/Edge/IE homepage, proxy/PAC, and extension *ids* (no source dump, no cookies, no saved passwords). Flags unexpected homepages, system proxy to a contest box, and leftover unpacked extensions.

### packages

#### `list-installed-packages`

- **Title:** List installed packages
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** Subset including nmap, hydra, telnetd, apache2, openssh-server

List packages (dpkg-query / rpm / Get-Package). Large but filterable; used as input to prohibited-software matching.

#### `find-prohibited-software`

- **Title:** Find prohibited software
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** nmap, hydra, netcat-traditional, john, ophcrack found

Match installed packages and well-known binary paths against config/prohibited-software.txt (nmap, hydra, john, netcat, ophcrack, aircrack, …). Removal is in-scope on the authorized image; this op is read-only discovery.

#### `remove-package`

- **Title:** Remove a package
- **Platforms:** both
- **Risk:** mutate
- **Params:** `package*` (string), `dryRun` (boolean)
- **Demo fixture:** Simulates purging nmap and hydra

Remove a local package (apt-get remove --purge / dnf remove / Uninstall-Package). Live requires confirm:true. Refuses to remove packages that look like required services (openssh-server, apache2) unless forced.

#### `hunt-remote-access-tools`

- **Title:** Hunt remote-access tools and browser extensions
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** teamviewer + anydesk packages; x11vnc binary; one unpacked Chrome extension id

Find TeamViewer, AnyDesk, VNC, Chrome Remote Desktop, RustDesk and similar on the authorized image, plus browser extension directories (Chrome/Edge/Firefox profile ids only — no extension source dump). Cross-checks config/remote-access-tools.txt. Discovery, not an exploit.

#### `remove-games-samples`

- **Title:** Remove games and sample content
- **Platforms:** both
- **Risk:** mutate
- **Params:** `gamesListPath` (string), `dryRun` (boolean)
- **Demo fixture:** Simulates removing aisleriot, gnome-mines, example-content, and MicrosoftSolitaireCollection

Remove games and vendor sample/content packages listed in config/games-samples.txt (aisleriot, solitaire, Xbox apps, example-content, IIS samples, …). Live requires confirm:true. Refuses names that look like required services. Snapshot first if a forensics question might name a game.

#### `scan-malware-tools`

- **Title:** ClamAV / chkrootkit scan report
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Demo dry inventory: clamav absent, chkrootkit absent; confirm would install then scan /home /tmp (no hits in fixture)

Inventory clamav and chkrootkit. dryRun (or live without install) reports whether they are present. With confirm:true, may apt/dnf install the distro packages then run a local scan (home/tmp/opt only). Never downloads unofficial installers, never scans other hosts. If packages are unavailable, report that — do not fail the round on a missing universe repo.

#### `audit-snap-flatpak`

- **Title:** Audit Snap/Flatpak unnecessary apps
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** snap: steam, discord; flatpak: org.videolan.VLC, com.anydesk.Anydesk; core snaps ignored

List snap and flatpak apps and flag games, remote-desktop, and typical prohibited leftovers (steam, discord, skype, wine). Discovery for authorized removal — this op does not uninstall.

### logging

#### `audit-logging`

- **Title:** Audit logging configuration
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** rsyslog inactive; auditd not installed; EventLog running but Security log size tiny

Check rsyslog/journald/syslog-ng or Windows Event Log services and common log files. Disabled logging is a finding because scoring/forensics depend on it.

#### `check-auditd`

- **Title:** Check auditd
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** auditd installed but inactive; no watches on /etc/passwd

Check auditd/auditctl presence, enabled flag, and a few expected rules (identity changes, sudoers writes). Does not flood the disk with new rules in read mode.

#### `enable-audit-policy`

- **Title:** Enable Success+Failure audit policy
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates auditpol Success+Failure on six categories; Security log is not dumped

Turn on Success and Failure auditing for Account Logon, Account Management, Logon/Logoff, Policy Change, Privilege Use, and System via auditpol. Local security log only — not a remote audit. Live requires confirm:true.

#### `audit-log-persistence`

- **Title:** Audit rsyslog/journald persistence
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** journald Storage=volatile; /var/log/journal missing; rsyslog inactive

Check journald Storage=persistent (or /var/log/journal present) and rsyslog file modules. Disabled/volatile logging loses forensics evidence. Complements audit-logging. Does not ship logs off-image.

### updates

#### `check-pending-updates`

- **Title:** Check pending updates
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** 12 pending security updates; unattended-upgrades off

Report whether unattended-upgrades/apt/dnf or Windows Update indicates pending security patches. Read-only; does not reach out beyond the image's configured update service.

#### `apply-security-updates`

- **Title:** Apply security updates
- **Platforms:** both
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates installing 12 security updates with a package list

Apply local security updates (apt-get upgrade, dnf update --security, or Start-WindowsUpdate). Long-running; live requires confirm:true. Stays on the authorized image's update channels.

#### `audit-auto-updates`

- **Title:** Audit unattended-upgrades / Windows Update
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** 20auto-upgrades Unattended-Upgrade 0; wuauserv disabled; AUOptions=1 (never check)

Check that unattended-upgrades (APT Periodic) or Windows Update (WUAU/AUOptions, wuauserv) is enabled and not blocked by policy/hosts. Complements check-pending-updates: this is the *channel* sanity check, not a patch install. Local config only.

#### `enable-unattended-upgrades`

- **Title:** Enable unattended-upgrades
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates writing 20auto-upgrades Unattended-Upgrade 1 and enabling the package

Install distro unattended-upgrades if missing and write APT Periodic 20auto-upgrades (Update-Package-Lists 1, Unattended-Upgrade 1). Complements audit-auto-updates. Does not fetch unofficial installers. Live requires confirm:true.

### scheduled

#### `audit-cron`

- **Title:** Audit cron jobs
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** root cron wget | sh; /etc/cron.d/hack world-writable running /tmp/suid_bash

Inventory /etc/crontab, cron.d, cron.*, and user crontabs. Flag nc/wget|sh, curl-to-pipe, /tmp executables, and world-writable cron files.

#### `audit-at-jobs`

- **Title:** Audit at jobs
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** One at job as zygote running python reverse-looking command (reported, not executed)

List at/batch jobs. Unexpected at jobs are a common CP plant.

#### `list-scheduled-tasks`

- **Title:** List scheduled tasks
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** Updater task running %TEMP%\svc.exe; persistence in Startup folder

List non-Microsoft scheduled tasks and highlight user-writable actions, missing authors, and payloads under TEMP or Startup.

#### `audit-persistence-deep`

- **Title:** Deep startup persistence audit
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** rc.local /tmp/.kworker; cron wget|sh; HKCU Run update.exe; profile.d backdoor.sh

Deeper than audit-startup-items: systemd enabled units, rc.local, cron/cron.d, /etc/profile.d, user autostart, Windows Run/RunOnce, Startup folder, and non-Microsoft scheduled tasks. Flags temp-path payloads, wget|sh, and interpreter plants. Inventory only.

#### `restrict-cron-at`

- **Title:** Restrict at/cron to root
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates cron.allow/at.allow = root; would remove world-readable cron.deny

Write /etc/cron.allow and /etc/at.allow containing root (and allowed-admins if listed), and remove world-usable cron.deny/at.deny so only those names may use crontab/at. Does not delete existing root cron jobs. Live requires confirm:true. Complements audit-cron / audit-at-jobs.

### kernel

#### `audit-sysctl`

- **Title:** Audit sysctl hardening
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** ip_forward=1, tcp_syncookies=0, accept_redirects=1

Read ip_forward, rp_filter, accept_redirects, tcp_syncookies, dmesg_restrict, kptr_restrict, randomize_va_space. Forwarding on a workstation is a finding.

#### `harden-sysctl`

- **Title:** Apply sysctl hardening
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates writing the drop-in and applying sysctl --system

Write /etc/sysctl.d/99-cp-hardening.conf with conservative workstation values (no forwarding, syncookies, rp_filter, no redirects) and sysctl --system. Live requires confirm:true.

#### `audit-startup-items`

- **Title:** Audit startup items
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** rc.local invokes /tmp/.kworker; HKCU Run \update.exe; sshd enabled (ok)

List systemd enabled units, rc.local, Windows Run keys, and Startup folder entries. Flag unsigned or temp-path payloads.

#### `audit-mac-enforcement`

- **Title:** Audit AppArmor/SELinux enforcement
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** SELinux Permissive; AppArmor loaded but complain-mode profiles present

Report AppArmor (aa-status) and SELinux (getenforce/sestatus) mode. Permissive or disabled MAC is a finding on images that shipped with a profile. Suggests enforce; this op does not flip the mode (setenforce is a separate admin action after a README check).

#### `blacklist-kernel-modules`

- **Title:** Blacklist uncommon kernel modules
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `usbStorage` (boolean), `dryRun` (boolean)
- **Demo fixture:** Simulates blacklisting dccp/sctp/cramfs/hfs; usb-storage left loaded unless usbStorage=true

Write /etc/modprobe.d/cp-blacklist.conf for uncommon protocols/filesystems (dccp, sctp, cramfs, hfs, firewire, …) from config/kernel-module-blacklist.txt. usb-storage is included only when usbStorage=true (default false). Live requires confirm:true.

#### `enforce-apparmor-profiles`

- **Title:** Enforce AppArmor profiles for common apps
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates aa-enforce apache2 mysqld ntpd ping; 3 complain profiles remain unnamed

Move loaded AppArmor profiles for common daemons (apache2, mysqld, ntpd, named, dhcpd, ping, tcpdump, …) from complain to enforce when aa-enforce exists. Complements audit-mac-enforcement (read). Does not setenforce SELinux. Live requires confirm:true.

#### `disable-ctrl-alt-del`

- **Title:** Disable Ctrl+Alt+Del and extra TTYs
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates systemctl mask ctrl-alt-del.target and disable serial-getty@ttyS0

Mask ctrl-alt-del.target and disable rare extra gettys (serial-getty@ttyS0, extra tty8+) so a console CAD reboot is not a cheap plant. Does not disable tty1–tty6 needed for local login. Live requires confirm:true.

#### `audit-ipv6-privacy`

- **Title:** Audit IPv6 privacy / optional disable
- **Platforms:** linux
- **Risk:** read
- **Params:** `disableIPv6` (boolean), `dryRun` (boolean)
- **Demo fixture:** use_tempaddr=0, accept_ra=1, forwarding=1; disableIPv6 not applied in the demo

Read IPv6 privacy extensions, accept_ra, and forwarding. Default is audit-only. disableIPv6=true writes sysctl to disable IPv6 — that path requires confirm:true (or dryRun). Do not disable if the README requires IPv6.

#### `harden-usb-storage`

- **Title:** Harden USB autorun / storage policy
- **Platforms:** both
- **Risk:** mutate
- **Params:** `disableUsbStorage` (boolean), `dryRun` (boolean)
- **Demo fixture:** Simulates autorun off + Deny_Execute on removable; USBSTOR left enabled unless disableUsbStorage

Disable USB autorun/autoplay and deny execute from removable storage (Windows NoDriveTypeAutoRun + RemovableStorageDevices; Linux udisks/udev automount off). Optional disableUsbStorage=true blacklists usb-storage / USBSTOR — default false so keyboards stay. Live requires confirm:true.

### windows

#### `disable-smbv1`

- **Title:** Disable SMBv1
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates Disable-WindowsOptionalFeature SMB1Protocol

Disable SMB1Protocol feature / registry. SMBv1 is in-scope hardening on Windows CP images. Live requires confirm:true.

#### `enable-windows-defender`

- **Title:** Enable Microsoft Defender
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates Set-MpPreference -DisableRealtimeMonitoring $false

Re-enable Defender realtime monitoring if it was disabled. Does not download third-party AV. Live requires confirm:true.

#### `audit-powershell-logging`

- **Title:** Audit PowerShell logging
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** ScriptBlockLogging disabled; Transcription off

Check Module Logging, Script Block Logging, and Transcription. Enabling these is kosher evidence collection on the local image.

#### `disable-autoplay`

- **Title:** Disable Autoplay
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates setting NoDriveTypeAutoRun=0xFF

Disable Autoplay/Autorun via registry (NoDriveTypeAutoRun). Standard CP Windows hardening. Live requires confirm:true.

#### `check-bitlocker-status`

- **Title:** Check BitLocker status
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** C: Protection Off; no recovery key material in the result

Report BitLocker protection status per volume. Informational; CP scoring may or may not require encryption. Does not export recovery keys.

#### `audit-iis`

- **Title:** IIS feature inventory + anonymous auth
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** IIS-WebServer installed; anonymousAuthentication enabled; directoryBrowse enabled; IIS samples present

Inventory IIS optional features and flag anonymous authentication, directory browsing, ASP classic, and sample applications. Local Windows image only. Does not dump site content or attack other hosts.

#### `apply-security-template`

- **Title:** Apply local security template
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `templatePath` (string), `dryRun` (boolean)
- **Demo fixture:** Simulates secedit import of cp-baseline.inf: min length 14, lockout 5, audit Success+Failure, Guest off

Import a secedit .inf (or LGPO-style) baseline for password, lockout, audit, and security options on the local Windows image. Defaults to config/windows/cp-baseline.inf. dryRun reports what secedit would configure. Live requires confirm:true. Does not talk to other hosts or the CCS. Authorized-image hardening only: never used against other teams, scoring endpoints, or off-image hosts.

#### `disable-remote-registry`

- **Title:** Disable Remote Registry
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates RemoteRegistry stopped and StartupType Disabled

Stop and disable the RemoteRegistry service on the local Windows image. Remote Registry is a common CP plant and is not needed on a workstation. Live requires confirm:true. dryRun reports current start type.

#### `disable-remote-assistance`

- **Title:** Disable Remote Assistance
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates fAllowToGetHelp=0 and fAllowFullControl=0

Set fAllowToGetHelp=0 and fAllowFullControl=0 under HKLM Remote Assistance so the local image will not offer Remote Assistance. Live requires confirm:true. Complements disable-rdp; does not attack other hosts.

#### `disable-optional-windows-features`

- **Title:** Disable optional Windows features
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `featuresPath` (string), `dryRun` (boolean)
- **Demo fixture:** Simulates disabling TelnetClient, TFTP, SMB1Protocol, SimpleTCP; reboot pending noted

Bulk-disable optional features listed in config/windows/optional-features.txt (Telnet, TFTP, SMB1Protocol extras, SimpleTCP, IIS-FTP*). Complements disable-telnet / disable-smbv1. Live requires confirm:true. NoRestart — reboot is a separate admin choice.

#### `run-sfc-scan`

- **Title:** Run system file integrity check
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** Demo: sfc /verifyonly found 2 integrity violations (hosts.dll plant, notepad.exe hash mismatch) — report only, no repair

Run sfc /verifyonly on the local Windows image and report integrity results. Read-only (does not repair). Does not dump WinSxS payloads. Pair with apply-security-updates if component store repair is needed later.

#### `harden-print-spooler`

- **Title:** Harden Print Spooler / disable remote print
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates PointAndPrint restrict + remote RPC endpoint disabled; Spooler left running for local print

Close PrintNightmare-class remote driver install: RestrictDriverInstallationToAdministrators, PointAndPrint no-warning elevation off, RegisterSpoolerRemoteRpcEndPoint disabled, RPC auth privacy on. Does not stop the local spooler unless the README says printing is unused. Live requires confirm:true. Authorized-image hardening only: never used against other teams, scoring endpoints, or off-image hosts.

#### `audit-lsa-protection`

- **Title:** Audit LSA protection / RunAsPPL
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** RunAsPPL=0, RunAsPPLBoot unset — LSA not protected

Read RunAsPPL / RunAsPPLBoot (LSA as Protected Process Light). Unprotected LSA is a credential-theft finding on Windows CP images. Classification only — never dumps LSASS, hashes, or tickets.

#### `audit-credential-guard`

- **Title:** Audit Credential Guard / Device Guard
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** Credential Guard not running; ConfigurableTCB off; no secret material in the result

Read Win32_DeviceGuard / Device Guard and Credential Guard security services running. Informational: some images score VBS/CG, others only want the state known. Does not dump isolated secrets or recovery keys.

#### `audit-secure-boot`

- **Title:** Audit Secure Boot / UEFI
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** SecureBoot=false, SetupMode=true on the demo fixture

Report Secure Boot and SetupMode via Confirm-SecureBootUEFI. Off or Setup Mode is a firmware finding. Read-only; does not enroll keys or dump PK/KEK material.

#### `audit-wifi-profiles`

- **Title:** Audit leftover Wi-Fi profiles
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** Open SSID 'CP-GUEST'; leftover WPA2 'HomeRouter' (key omitted); one enterprise profile ok

Inventory saved WLAN profiles (SSID + auth type only). Flags Open networks and leftover contest/home SSIDs. Never prints PSKs, EAP passwords, or `key=clear` material.

#### `harden-powershell-constrained`

- **Title:** Harden PowerShell logging / Constrained Language
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `constrainedLanguage` (boolean), `dryRun` (boolean)
- **Demo fixture:** Simulates ScriptBlockLogging+ModuleLogging+Transcription on; LanguageMode FullLanguage unless constrainedLanguage

Enable Script Block Logging, Module Logging, and local Transcription (deepens audit-powershell-logging). Optional constrainedLanguage=true sets Constrained Language Mode. Transcription path is local only — never a remote share. Live requires confirm:true.

#### `disable-smb-client-v1`

- **Title:** Disable SMBv1 client leftovers
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates Set-SmbClientConfiguration EnableSMB1Protocol=false and mrxsmb10 disabled

Turn off leftover SMBv1 *client* knobs (EnableSMB1Protocol on the workstation, mrxsmb10, SMB1Protocol feature) after disable-smbv1 covers the server/optional-feature path. Live requires confirm:true. Does not scan other hosts.

#### `audit-windows-roles`

- **Title:** Audit Windows Server roles
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** AD-Domain-Services Installed (unexpected); DNS Installed; DHCP Installed; IIS present

Inventory Windows Server roles/features (DNS, DHCP, AD-DS/AD-LDS, IIS extras) when ServerManager is present. Read-only harden suggestions: unexpected directory/DNS/DHCP roles on a workstation image. Does not promote/demote a domain or attack other DCs.

### evidence

#### `export-evidence-bundle`

- **Title:** Export evidence bundle
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** Bundle with checksums, counts, top findings, and a generated notes.md snippet

Assemble a redacted evidence pack: user inventory (no hashes), listeners, services, firewall state, checksums of sshd_config/sudoers/hosts. For forensics write-ups and team notes. Never copies shadow hashes, private keys, .ssh identities, or off-image data. Sabbath-coffee maximalism: one-click evidence, still inside the rules.

#### `package-forensics-evidence`

- **Title:** Package redacted forensics evidence
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** Expanded bundle with persistence, share ACLs, perm drift, and notes.md snippet

Deeper redacted forensics packager: user/service/port inventories, persistence hints, share ACLs, critical permission drift, and config checksums. Never copies shadow hashes, SAM contents, private keys, or off-image data. For authorized-image write-ups only.

#### `one-click-hardening-checklist`

- **Title:** One-click hardening checklist
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** 12 checklist rows with pass/fail/warn derived from the same demo fixtures

Read-only checklist covering users, admins, guest, password policy, firewall, telnet/ftp, listening ports, prohibited software, media files, and SSH/UAC. Each row points at the mutate op to fix it. Does not change the image — pair with confirm:true on the fix ops. Creative automation within CP policy, not a scoring-server cheat.

#### `score-image-heuristics`

- **Title:** Score image heuristics
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** Overall 78/100 remaining work; top drivers: UID 0 toor, port 31337, telnet, empty Guest password

Aggregate suspicion scores across users, services, ports, and files into a 0–100 remaining-work index (higher = more to harden). A dashboard headline number with drill-down findings. Heuristic only — not the official CCS score.

#### `find-backdoor-binaries`

- **Title:** Find suspicious binaries
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** /tmp/nc, /home/flag/.hidden_shell, /usr/local/bin/ncat, process on :31337

Heuristic filenames and locations: nc, netcat, ncat, socat in /tmp /home /opt; suid copies of bash; meterpreter-like names; 31337 listeners' process binaries. Does not include exploit payloads or attack other hosts.

#### `scoreboard-preflight`

- **Title:** Scoreboard preflight checklist
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** 8 preflight rows; firewall/guest/telnet fail; note that CCS is not queried

Pre-competition local checklist: firewall, guest, time sync, logging, no telnet, allowlist users, expected ports. Explicitly does not contact the CCS scoring server, other teams, or the internet beyond the image's configured update/time sources. Pair failing rows with confirm:true mutate ops.

#### `post-harden-checklist`

- **Title:** Post-harden verification checklist
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** 10 post-harden rows still failing on the unhardened demo image

After-action verification on the authorized image: password policy, SSH/UAC, extra UID 0, empty/never-expire passwords, media, prohibited software, default-deny firewall, remote-access tools. Read-only — does not re-apply hardening. Each fail points at the mutate op.

#### `skim-forensics-readme`

- **Title:** Skim local README for forensics keywords
- **Platforms:** both
- **Risk:** read
- **Params:** `searchRoot` (string), `keywordsPath` (string)
- **Demo fixture:** Hits: README Desktop 'forensics question 1 media', /home/alice/README.txt 'unauthorized ftp'; CCS not contacted

Keyword-skim local README/forensics/question text files (Desktop, homes, /root, optional searchRoot). Helps answer forensics questions from files *on the image*. Never contacts the CCS scoring server, other teams, or the internet. Hash-looking lines are skipped; passwords in files are not copied wholesale. Authorized-image hardening only: never used against other teams, scoring endpoints, or off-image hosts.

#### `round-start-wizard`

- **Title:** Round-start wizard
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** 6 sequenced steps; forensics/users/firewall/prohibited fail on the unhardened demo image; CCS not contacted

One-click sequenced guide for the first minutes of a round: forensics skim → user sync → password policy → firewall → updates → prohibited software. Read-only — it does not run the mutate ops. Each row points at the existing catalog op to open next. Not a CCS scrape and not a substitute for the README.

#### `export-coach-packet`

- **Title:** Export redacted coach packet ZIP
- **Platforms:** both
- **Risk:** read
- **Params:** `outputDir` (string)
- **Demo fixture:** ZIP listing SUMMARY.md + findings.json + inventories; redacted=true; ccsContacted=false; no secrets

Assemble a redacted handoff ZIP for a coach: SUMMARY.md, findings.json, user/service/port inventories (no hashes), checklist snapshot. Never includes shadow/SAM, private keys, Wi-Fi PSKs, cookies, or CCS URLs. Distinct from export-evidence-bundle: this is the coach-facing packet, still on-image only. Authorized-image hardening only: never used against other teams, scoring endpoints, or off-image hosts.

