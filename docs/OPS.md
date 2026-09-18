# CyberPatriot ops catalog

Typed operations exported from `@cyberpatriot/ops-catalog`.
Every op is **defensive, authorized-image hardening** for CyberPatriot.
See [SAFETY.md](./SAFETY.md) before running anything with `mode: "live"`.

- **Count:** 70
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
| `one-click-hardening-checklist` | One-click hardening checklist | evidence | both | read |
| `score-image-heuristics` | Score image heuristics | evidence | both | read |
| `find-backdoor-binaries` | Find suspicious binaries | evidence | both | read |
| `audit-shared-folders` | Audit shared folders | files | both | read |

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

### ports

#### `audit-listening-ports`

- **Title:** Audit listening ports
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** 22/80 expected; 23, 445, 31337/nc, 4444 flagged

List TCP/UDP listeners (ss/Get-NetTCPConnection) bound on this image. Flag 23, 111, 139, 445, 512-514, 5900, 31337, 4444, and anything bound to 0.0.0.0 that is not a required service. Local audit only — does not scan other hosts.

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

### evidence

#### `export-evidence-bundle`

- **Title:** Export evidence bundle
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** Bundle with checksums, counts, top findings, and a generated notes.md snippet

Assemble a redacted evidence pack: user inventory (no hashes), listeners, services, firewall state, checksums of sshd_config/sudoers/hosts. For forensics write-ups and team notes. Never copies shadow hashes, private keys, .ssh identities, or off-image data. Sabbath-coffee maximalism: one-click evidence, still inside the rules.

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

