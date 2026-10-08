# CyberPatriot ops catalog

Typed operations exported from `@cyberpatriot/ops-catalog`.
Every op is **defensive, authorized-image hardening** for CyberPatriot.
See [SAFETY.md](./SAFETY.md) before running anything with `mode: "live"`.
How-to explainers for every op: [howto/](./howto/).
Round playlists (ordered existing ops only): [Playlists](#round-playlists).

- **Count:** 138
- **Playlists:** 5 (linux-starter, windows-starter, linux-deep, windows-deep, forensics-first)
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
- **What it does:** Lists every local account: name, id number, home folder, login shell, groups, whether it is locked, and last login.
- **Why it scores:** Extra accounts, a second root, and missing README users are common score items, and you cannot fix an account you have not listed.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Enumerate local accounts with UID/GID or SID, home/profile, shell, group membership, lock state, and last-login timestamp. Password hashes are never returned. Authorized-image hardening only: never used against other teams, scoring endpoints, or off-image hosts.

#### `flag-suspicious-users`

- **Title:** Flag suspicious users
- **Platforms:** both
- **Risk:** read
- **Params:** `allowlistPath` (string)
- **Demo fixture:** Scored users: toor (UID 0), hacker123 (name+allowlist), zygote (shell/home/recent), nologin_admin (never logged in + sudo), Guest, flag; alice/bob/coach clean
- **What it does:** Scores local accounts for odd names, a user id of 0 (full admin) besides root, never having logged in, strange shells, and names missing from your allowlist.
- **Why it scores:** Planted accounts are often named like toor or hacker, or they have never logged in. A ranked list tells you whom to lock first.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Heuristic suspicion scoring for local accounts. Signals: never-logged-in humans, nonstandard shells, UID weirdness (non-root UID 0, duplicate UIDs, login shells on low UIDs), home outside /home, throwaway/backdoor name patterns, recently created accounts, and identities missing from config/allowed-users.txt. Admins not on the README allowlist score extra. This is a bulk audit with exportable reasons — not credential dumping and not an exploit. Use scores to prioritize lock/disable/remove-from-admin on the authorized image.

#### `disable-user`

- **Title:** Disable a local user
- **Platforms:** both
- **Risk:** mutate
- **Params:** `username*` (string), `dryRun` (boolean)
- **Demo fixture:** Simulates disabling hacker123; reports before/after lock and shell
- **What it does:** Turns an account off so it cannot log in, and leaves the home folder in place.
- **Why it scores:** Unauthorized people who can still log in are a standard deduction. Disabling is safer than deleting, because forensics questions may still need the home folder.
- **What it changes:** On Linux it locks the password (usermod -L) and sets the shell to /usr/sbin/nologin. On Windows it runs Disable-LocalUser. The home folder is not deleted.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. On Linux run usermod -U and set the shell back (usually /bin/bash). On Windows run Enable-LocalUser. Do this only if the README says the person should exist.

Disable an unauthorized local account (usermod/nologin or Disable-LocalUser). Live mode requires confirm:true. Does not delete home directories (forensics questions may need them).

#### `lock-user`

- **Title:** Lock a local user password
- **Platforms:** both
- **Risk:** mutate
- **Params:** `username*` (string), `dryRun` (boolean)
- **Demo fixture:** Simulates locking zygote; account remains listed but locked
- **What it does:** Locks the password so the account cannot sign in, without deleting the account.
- **Why it scores:** A locked planted account cannot be used, and the name stays visible for your write-up.
- **What it changes:** On Linux it runs usermod -L (or passwd -l). On Windows it runs Disable-LocalUser for that name.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. On Linux run usermod -U or passwd -u for that name. On Windows run Enable-LocalUser. Only unlock someone the README allows.

Lock the password of a local account (passwd -l / usermod -L or net user /active:no equivalent lock) so the account cannot authenticate, without destroying the account record. Live mode requires confirm:true.

#### `remove-user-from-admins`

- **Title:** Remove user from administrators
- **Platforms:** both
- **Risk:** mutate
- **Params:** `username*` (string), `dryRun` (boolean)
- **Demo fixture:** Simulates removing nologin_admin from sudo while leaving the account enabled
- **What it does:** Takes administrator rights away from one person and leaves the account itself turned on.
- **Why it scores:** Extra administrators are a high-value finding. A README user who should be a normal user needs demotion, not deletion.
- **What it changes:** On Linux it runs gpasswd -d to drop the user from the sudo and wheel groups (the groups that can act as root). On Windows it runs Remove-LocalGroupMember on Administrators.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. Put them back only if the README lists them as an admin: Linux usermod -aG sudo (or wheel), Windows Add-LocalGroupMember Administrators.

Drop a user from Administrators / sudo / wheel. Preferred over deletion when the README lists them as a standard user. Live mode requires confirm:true.

#### `list-admin-users`

- **Title:** List administrators and sudoers
- **Platforms:** both
- **Risk:** read
- **Params:** `allowlistPath` (string)
- **Demo fixture:** root, alice (expected sudo), nologin_admin (unexpected sudo), toor (UID 0), Administrator
- **What it does:** Lists who is in Administrators, sudo, or wheel, and any account whose user id is 0 (the same power as root).
- **Why it scores:** Every extra admin is points. Comparing this list to allowed-admins.txt shows who should not have that power.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

List members of Administrators, sudo, wheel, and UID 0. Cross-check against the README allowlist so extra admins are obvious.

#### `audit-uid-zero`

- **Title:** Audit UID 0 accounts
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** root (expected) and toor (duplicate UID 0, home /tmp/toor)
- **What it does:** Finds every Linux account whose user id is 0. Only root should have that id.
- **Why it scores:** A second user id 0 is a hidden root account. Scoring treats it as a backdoor.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Find every passwd entry with UID 0. Only root should have UID 0 on a CyberPatriot Linux image. Extra UID 0 accounts are classic backdoors; flag them for disable.

#### `check-empty-passwords`

- **Title:** Check for empty passwords
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** Guest and games have empty/unusable-or-empty password flags; alice has a set password
- **What it does:** Reports which accounts have a blank password, a locked password, or a real password. It never prints the password hash (the scrambled secret).
- **Why it scores:** A blank password means anyone can log in as that person. Guest and leftover accounts are often left this way.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Detect accounts with empty or non-set passwords (shadow '!'/'!!'/empty, PasswordRequired=false). Never prints hashes — only a boolean empty/locked/set classification.

#### `audit-never-logged-in`

- **Title:** Audit never-logged-in humans
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** nologin_admin and flag never logged in; alice logged in recently
- **What it does:** Lists human accounts that have never signed in. Service accounts that cannot log in are skipped.
- **Why it scores:** A person who has never logged in is often a leftover or a planted account waiting to be used.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Human/interactive accounts that have never logged in are often leftover or planted. Compare lastlog / LastLogon against the allowlist; service accounts with nologin are ignored.

#### `check-user-shells`

- **Title:** Check login shells
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** zygote uses /usr/bin/python3; games uses /bin/bash despite being a system UID
- **What it does:** Shows each account's login shell (the program that starts when they sign in).
- **Why it scores:** People should use a normal shell such as bash. A shell under /tmp, or a system account with a real shell, is a common plant.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Report login shells. Interactive users should use a standard shell (bash/sh); system users should be nologin/false. Nonstandard shells (/tmp/*, interpreters, csh/zsh on a bash image, empty) are suspicious.

#### `list-groups`

- **Title:** List local groups
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** sudo (alice, nologin_admin), docker (zygote — unexpected), Administrators
- **What it does:** Lists local groups and who is in them, and highlights powerful groups such as sudo, wheel, Administrators, and Remote Desktop Users.
- **Why it scores:** Power often hides in a group membership the user list does not make obvious, such as docker or Administrators.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Enumerate local groups and membership. Highlight privileged groups (sudo, wheel, Administrators, Hyper-V, Remote Desktop Users, docker).

#### `disable-guest-account`

- **Title:** Disable Guest account
- **Platforms:** both
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates disabling Guest; account remains but enabled=false
- **What it does:** Turns off the Guest account so nobody can sign in with no real identity.
- **Why it scores:** Guest is almost never on the README, and a blank-password Guest is an easy score item.
- **What it changes:** On Linux it locks the guest account and sets its shell to nologin. On Windows it runs Disable-LocalUser Guest.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. Turn Guest back on only if the README requires it: Linux usermod -U guest and a normal shell, Windows Enable-LocalUser Guest.

Disable the Guest / guest account on Windows and Linux. Guest is almost never authorized on CP images. Live mode requires confirm:true.

#### `audit-duplicate-uids`

- **Title:** Audit duplicate UIDs
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** toor shares UID 0 with root
- **What it does:** Finds different usernames that share the same user id number.
- **Why it scores:** Two names with the same id, especially 0, share one identity. Logs and permissions cannot tell them apart.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Find distinct usernames sharing a UID. Duplicate UID 0 is critical; other collisions still break auditing and privilege boundaries.

#### `expire-user-password`

- **Title:** Expire a user password
- **Platforms:** both
- **Risk:** mutate
- **Params:** `username*` (string), `dryRun` (boolean)
- **Demo fixture:** Simulates expiring bob's password without locking the account
- **What it does:** Makes one account choose a new password at the next login. The account stays enabled.
- **Why it scores:** README users sometimes still have the password printed in the setup notes. Forcing a change closes that without locking them out forever.
- **What it changes:** On Linux it runs chage -d 0 for that username. On Windows it runs net user <name> /logonpasswordchg:yes.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. To clear the must-change flag, set a new password and a normal age: Linux chage -d today, Windows net user <name> /logonpasswordchg:no after they have a new password.

Force a password change at next login (chage -d 0 / net user /logonpasswordchg:yes). Useful for authorized users with stale or known-default passwords. Live mode requires confirm:true.

#### `select-unauthorized-users`

- **Title:** Select unauthorized users (allowlist miss)
- **Platforms:** both
- **Risk:** read
- **Params:** `allowlistPath` (string)
- **Demo fixture:** hacker123, toor, zygote, nologin_admin, flag, Guest selected; alice/bob/coach/root not selected; extra-admin nologin_admin
- **What it does:** Compares local accounts to config/allowed-users.txt and lists names that are not on that list.
- **Why it scores:** The allowlist is the README. Anyone not on it is the first disable candidate, after you confirm the file matches this image.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Bulk-select interactive accounts that miss config/allowed-users.txt (or the README list). Returns a disable/lock-ready name list plus extra admins and allowlist names missing from the image. Deepens flag-suspicious-users: this is the round-one 'who do we turn off' table, not a credential dump. Authorized-image hardening only: never used against other teams, scoring endpoints, or off-image hosts.

#### `force-password-change`

- **Title:** Force password change at next logon
- **Platforms:** both
- **Risk:** mutate
- **Params:** `username` (string), `allowlistPath` (string), `dryRun` (boolean)
- **Demo fixture:** Bulk demo: would expire alice, bob, coach (not root/hacker123); per-user demo expires bob
- **What it does:** Forces a password change at next logon for one account, or for every human on the allowlist if you do not name one.
- **Why it scores:** README users often still have the published starter password. Expiring it makes them set a new one.
- **What it changes:** On Linux it runs chage -d 0. One username expires that account; with no username it expires each allowlisted human except root. On Windows it runs net user <name> /logonpasswordchg:yes for the named user or for allowlisted names other than built-in system accounts.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. After the person sets a new password, the flag clears itself. To cancel before they log in, set a real password and clear the flag (chage -d today, or net user /logonpasswordchg:no).

Expire passwords so the user must change at next logon (chage -d 0 / net user /logonpasswordchg:yes). Pass username for one account, or omit it to bulk-expire humans on config/allowed-users.txt (root skipped in bulk). Deepens expire-user-password. Never invents or prints passwords. Live requires confirm:true.

#### `sync-authorized-users`

- **Title:** Sync users from allowlists
- **Platforms:** both
- **Risk:** mutate
- **Params:** `allowlistPath` (string), `adminsPath` (string), `dryRun` (boolean)
- **Demo fixture:** Missing dave (create, set password manually); extras hacker123/toor/Guest; extra-admin nologin_admin; alice already admin
- **What it does:** Creates README users who are missing and adds README admins to the admin group. It does not invent passwords and it does not delete extras.
- **Why it scores:** Missing authorized users can score as badly as extra ones. This adds only names you already put on the allowlist.
- **What it changes:** On Linux it runs useradd -m -s /bin/bash for missing allowlist names (no password is set) and usermod -aG sudo or wheel for names in allowed-admins.txt. On Windows it runs New-LocalUser -NoPassword for missing names and Add-LocalGroupMember Administrators for the admin list. You must set each new password yourself.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. Delete a user this op created only if they were not on the README: Linux userdel, Windows Remove-LocalUser. Remove an admin group membership with gpasswd -d or Remove-LocalGroupMember if you added the wrong name.

Create missing README humans from config/allowed-users.txt and promote missing admins from config/allowed-admins.txt. Extra interactive users and extra admins are flagged — not auto-disabled. Never invents passwords: new accounts are created without a password and listed under setPasswordManually. Live requires confirm:true. Bend-parallel user sweep when available. Authorized-image hardening only: never used against other teams, scoring endpoints, or off-image hosts.

#### `lock-root-account`

- **Title:** Lock the root password
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates passwd -l root; account remains UID 0 but password locked
- **What it does:** Locks the root password so nobody can sign in directly as root. sudo for authorized admins still works.
- **Why it scores:** A usable root password, especially a known one, is a scored account finding. Admins should use sudo.
- **What it changes:** Runs passwd -l root.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. Unlock with passwd -u root only if the README says direct root login is required, then set a new password yourself.

Lock the root account password with passwd -l so root cannot authenticate with a password (sudo can remain). Confirm-gated. Does not delete root or disable UID 0. Check the README before locking if a console root login is required.

### auth

#### `audit-password-policy`

- **Title:** Audit password policy
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** minlen 8 (too short), PASS_MAX_DAYS 99999, no complexity — several findings
- **What it does:** Reads the password rules: minimum length, how often passwords expire, and whether old passwords are remembered.
- **Why it scores:** Short passwords and passwords that never expire are reliable points on both Linux and Windows.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Read /etc/login.defs + PAM pwquality/cracklib, or net accounts / secedit policy: min length, aging, history, complexity. Compare to typical CP baselines (length ≥12–14, history, max age).

#### `enforce-password-policy`

- **Title:** Enforce password policy
- **Platforms:** both
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates writing login.defs/pwquality and a Windows net accounts policy
- **What it does:** Sets a stricter password rule: at least 14 characters, remember 5 old passwords, expire after 90 days, and wait 1 day before changing again.
- **Why it scores:** The score checks the policy itself. This does not rewrite anyone's current password hash.
- **What it changes:** On Linux it edits /etc/login.defs (PASS_MAX_DAYS 90, PASS_MIN_DAYS 1, PASS_MIN_LEN 14, PASS_WARN_AGE 7) and writes /etc/security/pwquality.conf.d/99-cp.conf (minlen 14, mixed character classes, remember 5). On Windows it runs net accounts /minpwlen:14 /maxpwage:90 /minpwage:1 /uniquepw:5.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. Put the previous numbers back into login.defs and delete 99-cp.conf on Linux. On Windows rerun net accounts with the old lengths and ages.

Apply a conservative CP-friendly policy: min length 14, remember 5, max age 90, min age 1, complexity on, inactive lock. Does not change existing password hashes. Live requires confirm:true.

#### `check-password-aging`

- **Title:** Check password aging
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** bob MAX_DAYS=99999; alice 90; root aging disabled
- **What it does:** Reads how long each Linux password is allowed to live, without showing the password hash.
- **Why it scores:** A human whose password never expires (max days 99999 or -1) is a standard Linux finding.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Parse chage/shadow aging fields (without hashes). Flag max days of -1/99999 on human accounts and users with aging disabled.

#### `audit-pam`

- **Title:** Audit PAM configuration
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** common-auth still has nullok; no faillock; pwquality missing
- **What it does:** Reads Linux sign-in rules in PAM (the plug-in stack that checks passwords) for blank-password permission, lockout, and password quality.
- **Why it scores:** nullok means a blank password is accepted. Missing lockout means guessing can go on forever.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Inspect common-auth / system-auth for pam_pwquality, pam_tally2/faillock, pam_unix remember, and nullok. nullok is a high finding; missing faillock is medium.

#### `enable-account-lockout`

- **Title:** Enable account lockout
- **Platforms:** both
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates enabling faillock and net accounts /lockoutthreshold:5
- **What it does:** Locks an account after repeated bad passwords so guessing has to stop.
- **Why it scores:** Unlimited password guesses are a scored weakness. Five failures then a short lock is the usual bar.
- **What it changes:** On Linux it writes /etc/security/faillock.conf (deny 5, fail_interval 900 seconds, unlock_time 600 seconds, even for root). You still need pam_faillock in the sign-in stack if it is not already there. On Windows it runs net accounts /lockoutthreshold:5 /lockoutduration:10 /lockoutwindow:10.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. Delete or restore /etc/security/faillock.conf on Linux. On Windows set the lockout threshold back with net accounts /lockoutthreshold:0 if the README wants no lockout.

Enable PAM faillock or Windows lockout policy after repeated failures (deny=5, unlock_time=600). Stops password-guessing on the local image only. Live mode requires confirm:true.

#### `disable-root-ssh`

- **Title:** Disable SSH root login
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates PermitRootLogin yes → no with a config diff snippet
- **What it does:** Stops anyone from signing in as root over SSH (secure remote login).
- **Why it scores:** Root login over the network is a classic scored hole. People should use their own account and then sudo.
- **What it changes:** Writes PermitRootLogin no to /etc/ssh/sshd_config.d/99-cp-noroot.conf and reloads the SSH service.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. Delete 99-cp-noroot.conf and reload ssh (or sshd). Only do that if the README requires root SSH.

Set PermitRootLogin no in sshd_config and reload ssh if it is a required service. Live requires confirm:true.

#### `audit-sudoers`

- **Title:** Audit sudoers
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** nologin_admin ALL=(ALL) NOPASSWD: ALL; /etc/sudoers.d/hack world-writable
- **What it does:** Reads sudo rules (who can run commands as root) for NOPASSWD and for files anyone can edit.
- **Why it scores:** A sudo rule with no password, or a sudoers file anyone can change, is a free path to root.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Read /etc/sudoers and sudoers.d for NOPASSWD, ALL=(ALL) ALL granted to unexpected users, and world-writable sudoers files. Does not execute sudo commands as other users.

#### `audit-uac`

- **Title:** Audit User Account Control
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** EnableLUA=0 (UAC off), ConsentPromptBehaviorAdmin=0
- **What it does:** Reads Windows User Account Control (the 'are you sure?' prompt before admin actions): EnableLUA and the consent prompt setting.
- **Why it scores:** UAC turned off lets any program act as administrator. Images often plant that in the registry.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Read EnableLUA, ConsentPromptBehaviorAdmin, and PromptOnSecureDesktop. UAC disabled is a high finding on a Windows CP image.

#### `report-password-never-expires`

- **Title:** Report never-expires + blank password combo
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** Guest empty+never-expires (critical); bob never-expires with a set password; alice OK
- **What it does:** Flags accounts whose password never expires, and accounts with a blank password. Hashes are not printed.
- **Why it scores:** Never-expire plus a blank password is a paired finding. Policy and the account both need a look.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Combine password-aging (shadow MAX_DAYS -1/99999 or Windows PasswordNeverExpires) with empty-password classification. Human accounts that never expire, especially with a blank password, are high. Never prints hashes — only empty/locked/set + never-expires booleans.

#### `audit-null-session`

- **Title:** Audit null session / anonymous SAM
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** RestrictAnonymous=0, RestrictAnonymousSAM=0, EveryoneIncludesAnonymous=1, NullSessionShares listed
- **What it does:** Checks whether Windows still allows anonymous (null session) access to account names. It does not dump the account database.
- **Why it scores:** Anonymous listing of users is a scored Windows finding. The fix is a separate confirmed op.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Read RestrictAnonymous, RestrictAnonymousSAM, EveryoneIncludesAnonymous, RestrictNullSessAccess, NullSessionPipes, and NullSessionShares. Anonymous SAM/null sessions are high Windows findings. Classification only — never dumps SAM, hashes, or pipe contents.

#### `audit-idle-lock`

- **Title:** Audit screensaver / idle lock
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** No TMOUT; IdleAction ignore; Windows ScreenSaverIsSecure=0 timeout 9999
- **What it does:** Reads whether the screen or shell locks after idle time (TMOUT and the login manager's idle action).
- **Why it scores:** A session that never locks lets the next person at the keyboard act as the signed-in user.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Check idle/screensaver lock: Linux TMOUT/logind IdleAction and dconf idle-delay; Windows ScreenSaveActive, ScreenSaverIsSecure, and ScreenSaveTimeOut. Unlocked idle sessions are a frequent policy item. Read-only.

#### `disable-display-manager-guest`

- **Title:** Disable display-manager guest and autologin
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates LightDM allow-guest=false and GDM AutomaticLoginEnable=false; autologin-user cleared
- **What it does:** Turns off the login-screen Guest session and automatic login.
- **Why it scores:** A greeter Guest session is a second Guest account. Autologin signs someone in with no password.
- **What it changes:** Writes /etc/lightdm/lightdm.conf.d/99-cp-hardening.conf with allow-guest, greeter-allow-guest, and autologin-guest false and autologin-user empty. If GDM is installed it sets AutomaticLoginEnable=false in custom.conf.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. Delete the LightDM drop-in and restore the previous GDM custom.conf from the backup.

Turn off LightDM/GDM guest sessions and autologin (allow-guest=false, autologin-user empty, AutomaticLoginEnable=false). Distinct from disable-guest-account (the Guest user). Live requires confirm:true.

#### `enable-fail2ban`

- **Title:** Install and enable fail2ban
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates apt install fail2ban and systemctl enable --now; jail.d sshd on
- **What it does:** Installs fail2ban from the distro package source and turns it on, so repeated login failures get blocked.
- **Why it scores:** Lockout at the SSH door stops password guessing even when the account policy is still loose.
- **What it changes:** Runs apt-get install -y fail2ban or dnf install -y fail2ban, then systemctl enable --now fail2ban. It does not download a script from the internet.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. systemctl disable --now fail2ban, and apt-get remove fail2ban or dnf remove fail2ban if you need it gone.

Install fail2ban if the distro package is available, then enable and start the service on the authorized image. If apt/dnf cannot provide it, report unavailable — do not fetch random GitHub installers. Live requires confirm:true. dryRun reports presence only. Local SSH brute-force defense, not a remote attack.

#### `harden-null-session`

- **Title:** Harden anonymous enumeration / null sessions
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates the four LSA restrict values set to the hardened baseline
- **What it does:** Blocks anonymous users from listing accounts and shares.
- **Why it scores:** Null sessions are the fix for the anonymous-SAM audit. They should not be able to enumerate this computer.
- **What it changes:** Sets RestrictAnonymous and RestrictAnonymousSAM to 1, EveryoneIncludesAnonymous to 0, LimitBlankPasswordUse to 1, and LanmanServer RestrictNullSessAccess to 1.
- **How to undo:** If a backup was made, restore from %ProgramData%\CyberPatriotOps\backups\<ts>\. Set those LSA and LanmanServer values back to 0 only if a required legacy app the README names cannot work without anonymous access.

Set RestrictAnonymous=1, RestrictAnonymousSAM=1, EveryoneIncludesAnonymous=0, RestrictNullSessAccess=1. Deepens the read-only audit-null-session. Does not dump SAM, pipes, or hashes. Live requires confirm:true.

### services

#### `list-services`

- **Title:** List services
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** sshd (required, running), telnet (enabled — bad), cups, avahi, smbd, apache2, mysql
- **What it does:** Lists services (programs that stay running in the background) and whether each one is running.
- **Why it scores:** You need the inventory before you turn off Telnet, file sharing, or anything else the README did not ask for.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

List systemd/Windows services with active/enabled state. Annotate against config/required-services.txt and config/risky-services.txt.

#### `flag-risky-services`

- **Title:** Flag risky services
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** telnet, vsftpd, smbd, cups, avahi, RemoteRegistry flagged; sshd/apache2 required
- **What it does:** Highlights risky services that are still on, such as Telnet, FTP, Remote Desktop, Remote Registry, and SNMP.
- **Why it scores:** Those services are common scored holes. The list tells you which disable op to run next.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Cross-check running/enabled services against the risky list and required list. Telnet, rsh, anonymous FTP, SMBv1, RemoteRegistry, and similar score high unless the README explicitly requires them. Bulk audit, not an exploit scan of other hosts.

#### `disable-service`

- **Title:** Disable a service
- **Platforms:** both
- **Risk:** mutate
- **Params:** `service*` (string), `dryRun` (boolean), `force` (boolean)
- **Demo fixture:** Simulates disabling telnet.socket and vsftpd
- **What it does:** Stops one service and sets it not to start on boot. It refuses services listed in config/required-services.txt unless you force it.
- **Why it scores:** Services the README does not need, such as Telnet or Remote Registry, cost points while they stay running.
- **What it changes:** On Linux it runs systemctl disable --now for the unit you name. On Windows it runs Stop-Service and Set-Service -StartupType Disabled.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. Turn it back on only if the README needs it: Linux systemctl enable --now <service>, Windows Set-Service -StartupType Automatic and Start-Service.

Stop and disable a local service (systemctl disable --now / Set-Service -StartupType Disabled). Live requires confirm:true. Will refuse to disable names in required-services.txt unless forced.

#### `audit-ftp-telnet`

- **Title:** Audit FTP and Telnet
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** telnet.socket enabled, vsftpd running with anonymous_enable=YES, port 23 open
- **What it does:** Checks whether FTP (plain file transfer) or Telnet (plain remote login) services are present. It does not try to log in.
- **Why it scores:** Telnet and FTP send passwords in the clear. They are almost never required, and they score when left on.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Detect telnet/ftp servers, sockets, and listening 21/23. Anonymous FTP and Telnet are almost never kosher on CP images.

#### `disable-telnet`

- **Title:** Disable Telnet
- **Platforms:** both
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates stopping telnet and adding a deny-23 firewall rule
- **What it does:** Stops the Telnet server and sets it not to start again.
- **Why it scores:** Telnet has no encryption. Leaving the server running is a standard service finding.
- **What it changes:** On Linux the live runner disables telnet.socket (or the service name you pass). On Windows it stops TlntSvr and sets its startup type to Disabled. This op does not add a firewall rule by itself.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. Re-enable only if the README requires Telnet: Linux systemctl enable --now telnet.socket, Windows Set-Service TlntSvr -StartupType Manual.

Disable telnetd / TlntSvr / telnet.socket and block tcp/23 on the host firewall. Live requires confirm:true.

#### `disable-legacy-r-services`

- **Title:** Disable rsh/rlogin/rexec
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates disabling rsh.socket rlogin.socket rexec.socket
- **What it does:** Stops the old rsh remote-shell service (commands sent with no real password check).
- **Why it scores:** rsh, rlogin, and rexec trust the network instead of a password. They do not belong on a competition image.
- **What it changes:** The live runner runs systemctl disable --now on rsh.socket unless you pass a different service name. Run it again for rlogin.socket and rexec.socket if those units exist.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. systemctl enable --now the unit you disabled, and only if the README actually requires that remote shell.

Disable rsh, rlogin, rexec, and related xinetd entries. These trust-based remotes have no place on a CP image. Live mode requires confirm:true.

#### `audit-smb`

- **Title:** Audit SMB / Samba
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** smbd running, map to guest, SMBv1 enabled, public share with Everyone Full
- **What it does:** Checks Windows file-sharing settings, including whether SMBv1 (an old, unsafe sharing dialect) is enabled. On Linux it is a read of the Samba picture the engine already collected.
- **Why it scores:** SMBv1 is scored even when newer file sharing is allowed to stay.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Report smbd/nmbd/LanmanServer state, guest/anonymous access, SMBv1, and share list. Guest shares and SMBv1 are high findings unless the README requires file sharing.

#### `audit-anonymous-ftp`

- **Title:** Audit anonymous FTP / vsftpd
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** vsftpd anonymous_enable=YES, write_enable=YES, anon_upload_enable=YES; port 21 open
- **What it does:** Reads vsftpd or ProFTPD settings for anonymous login and anonymous upload. It does not try to log in.
- **Why it scores:** Anonymous FTP, especially with upload, lets anyone drop files on the image. That is a high service finding.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Parse vsftpd/proftpd/pure-ftpd (and Windows FTPSVC) for anonymous_enable, anon_upload, write_enable, and chroot. Deeper than audit-ftp-telnet: reports the insecure knobs, not just that ftpd is running. Does not log in anonymously or scan other hosts.

#### `harden-vsftpd`

- **Title:** Harden vsftpd (disable anonymous)
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates writing anonymous_enable=NO and disabling vsftpd because it is not required
- **What it does:** Turns off anonymous and upload FTP in the vsftpd config, and stops vsftpd if it is not on the required-services list.
- **Why it scores:** Anonymous FTP is the finding. This writes the usual scored nos.
- **What it changes:** Sets anonymous_enable, write_enable, anon_upload_enable, and anon_mkdir_write_enable to NO in /etc/vsftpd.conf or /etc/vsftpd/vsftpd.conf, reloads vsftpd, and disables the service unless config/required-services.txt lists vsftpd.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. Restore the previous vsftpd.conf from the backup. If the service was disabled and the README needs FTP, systemctl enable --now vsftpd after anonymous login stays NO.

Set anonymous_enable=NO, write_enable=NO, and anon_upload_enable=NO in vsftpd.conf (or the distro equivalent). If FTP is not a required service, also stop/disable vsftpd. Live requires confirm:true. README-required FTP stays up, just without anonymous write.

#### `audit-web-server`

- **Title:** Apache/nginx hardening checklist
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** Options Indexes on; ServerTokens OS; nginx autoindex on; TLSv1 still offered
- **What it does:** Reads Apache or nginx settings for risky options such as directory listing and default samples. It does not attack the site.
- **Why it scores:** A web server with directory listing or sample apps is a scored service finding when the image hosts a page.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Read-only Apache/httpd/nginx checklist: directory listings, ServerTokens/server_tokens, ServerSignature, TraceEnable, weak SSLProtocol/ssl_protocols, AllowOverride All, and cgi/userdir if present. Does not disable a README-required web server and does not scan other hosts.

#### `audit-snmp`

- **Title:** Audit SNMP community / insecure mgmt
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** snmpd running, rocommunity public, rwcommunity private, UDP/161 open
- **What it does:** Checks whether SNMP (a simple device-management protocol) is running and whether a default community name is set. It does not guess passwords.
- **Why it scores:** SNMP with the community string public is an unauthenticated management port.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Detect snmpd/SNMP service and default community strings (public/private), rwcommunity, and related insecure mgmt listeners (chargen, discard, ident). Reports community *names* that look default; never uses them to walk other hosts.

#### `audit-mail-services`

- **Title:** Audit Postfix/Exim/Dovecot relay
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** postfix inet_interfaces=all, mynetworks includes 0.0.0.0/0, disable_vrfy_command=no
- **What it does:** Reads Postfix and Dovecot settings for an open relay and for plaintext login. It does not send mail.
- **Why it scores:** A mail server that relays for the whole internet is a serious finding. Most images should not run mail at all.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

If postfix/exim/dovecot is installed, audit inet_interfaces, mynetworks, smtpd relay restrictions, disable_vrfy, and plaintext auth. Flags open relay and VRFY. Local config only — does not send mail or probe other MX hosts.

#### `audit-database-bind`

- **Title:** Audit database bind-address / anonymous
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** mysqld bind-address=0.0.0.0; skip-grant-tables in systemd override; pg_hba host all all 0.0.0.0/0 trust
- **What it does:** Reads whether MySQL or Postgres listens on all interfaces, and whether skip-grant-tables or a trust-anyone rule is set. It does not connect or dump data.
- **Why it scores:** A database bound to every interface, or with grant tables skipped, is an open data store.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

If MySQL/MariaDB/Postgres is installed, read bind-address / listen_addresses and pg_hba trust/ident. Flags 0.0.0.0 bind and skip-grant-tables. Does not connect with credentials, dump user tables, or print passwords.

#### `audit-php-hardening`

- **Title:** Audit PHP expose_php / dangerous functions
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** expose_php=On, allow_url_include=On, disable_functions empty; /var/www/html/info.php present
- **What it does:** Reads PHP settings such as expose_php and dangerous functions. It does not run PHP code from the image.
- **Why it scores:** PHP that advertises its version or allows risky functions is a web finding on images that serve pages.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

If PHP/LAMP is present, read php.ini: expose_php, display_errors, allow_url_include, allow_url_fopen, disable_functions. Inventory info.php by name under web roots (contents not dumped). Local files only.

### ports

#### `audit-listening-ports`

- **Title:** Audit listening ports
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** 22/80 expected; 23, 445, 31337/nc, 4444 flagged
- **What it does:** Lists ports that are open and waiting for connections (TCP and UDP), with the program name when the system shows it.
- **Why it scores:** Unexpected listeners such as 23 (Telnet), 21 (FTP), or 3389 (Remote Desktop) are how you find services the process list hid.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

List TCP/UDP listeners (ss/Get-NetTCPConnection) bound on this image. Flag 23, 111, 139, 445, 512-514, 5900, 31337, 4444, and anything bound to 0.0.0.0 that is not a required service. Local audit only — does not scan other hosts.

#### `diff-expected-ports`

- **Title:** Diff listeners vs expected ports
- **Platforms:** both
- **Risk:** read
- **Params:** `expectedPortsPath` (string)
- **Demo fixture:** Unexpected 23/31337/445; expected 22/80 present; 443 missing
- **What it does:** Compares listening ports to the expected-ports list and reports extras and missing scored services.
- **Why it scores:** An extra listener is something to shut. A missing expected port means you turned off a service the README still needs.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Compare this image's TCP/UDP listeners to config/expected-ports.txt (README-allowed services). Reports unexpected listeners and missing expected ports. Local ss/Get-NetTCPConnection only — never scans other hosts or the scoring server. Authorized-image hardening only: never used against other teams, scoring endpoints, or off-image hosts.

### network

#### `ssh-hardening-audit`

- **Title:** SSH hardening audit
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** PermitRootLogin yes, PermitEmptyPasswords yes, Protocol 2+1, X11Forwarding yes
- **What it does:** Reads the SSH server settings: root login, blank passwords, X11 forwarding, password login, protocol, and max tries.
- **Why it scores:** PermitRootLogin yes and PermitEmptyPasswords yes are direct point losses. Read them before you change sshd.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Parse sshd_config: PermitRootLogin, PasswordAuthentication, Protocol, X11Forwarding, MaxAuthTries, PermitEmptyPasswords, Ciphers/MACs, AllowUsers. Read-only; does not connect outbound.

#### `harden-sshd`

- **Title:** Harden sshd_config
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates a drop-in at /etc/ssh/sshd_config.d/99-cp-hardening.conf
- **What it does:** Applies a safer SSH server drop-in and reloads SSH so new logins follow it.
- **Why it scores:** The audit finds weak SSH settings. This writes the usual scored fixes: no root login, no blank passwords, fewer guesses.
- **What it changes:** Writes /etc/ssh/sshd_config.d/99-cp-hardening.conf with PermitRootLogin no, PermitEmptyPasswords no, X11Forwarding no, MaxAuthTries 4, Protocol 2, LoginGraceTime 30, ClientAliveInterval 300, ClientAliveCountMax 2, then reloads ssh or sshd.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. Delete 99-cp-hardening.conf and reload ssh. Existing settings in sshd_config then apply again.

Write a conservative sshd drop-in: PermitRootLogin no, PermitEmptyPasswords no, X11Forwarding no, MaxAuthTries 4, Protocol 2. Reloads sshd. Live requires confirm:true.

#### `audit-rdp`

- **Title:** Audit Remote Desktop
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** RDP enabled, NLA off, TermService running
- **What it does:** Reads whether Windows Remote Desktop is allowed (fDenyTSConnections) and whether the Remote Desktop service is running.
- **Why it scores:** Remote Desktop should be off unless the README says a teammate must connect that way.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Check fDenyTSConnections, NLA, and TermService. RDP should be off unless the README requires it; NLA should be on if RDP stays.

#### `disable-rdp`

- **Title:** Disable Remote Desktop
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates disabling RDP and stopping TermService
- **What it does:** Turns Remote Desktop off and stops the Remote Desktop service.
- **Why it scores:** An open Remote Desktop port is a high Windows finding when the README does not ask for it.
- **What it changes:** Sets HKLM\SYSTEM\CurrentControlSet\Control\Terminal Server fDenyTSConnections to 1 and stops TermService.
- **How to undo:** If a backup was made, restore from %ProgramData%\CyberPatriotOps\backups\<ts>\. Set fDenyTSConnections back to 0 and start TermService only if the README requires Remote Desktop.

Set fDenyTSConnections=1 and stop TermService if RDP is not a required service. Live requires confirm:true.

#### `audit-hosts-file`

- **Title:** Audit hosts file
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** Suspicious redirect of windowsupdate.microsoft.com and an extra 0.0.0.0 google.com
- **What it does:** Reads the hosts file (a local name-to-address list) for lines that send update or security sites to a dead address.
- **Why it scores:** A hosts line that sinks windowsupdate or an antivirus name blocks patches and is a planted finding.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Read /etc/hosts or drivers/etc/hosts for unexpected redirects (windows update, antivirus, scoring sites, social). Does not contact those hosts.

#### `check-ntp`

- **Title:** Check time synchronization
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** timesyncd inactive; fake NTP server 10.0.0.1 in config
- **What it does:** Checks whether the clock is syncing (timedatectl or w32tm). It does not query outside time servers beyond what the local service already shows.
- **Why it scores:** A wrong clock makes logs useless and can fail update checks. Scoring often wants time sync on.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Check chronyd/systemd-timesyncd/w32time status. Wrong clocks break logs and Kerberos; this is a local config audit, not an NTP amplification test.

#### `disable-llmnr-netbios-wpad`

- **Title:** Disable LLMNR / NetBIOS / WPAD
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates LLMNR off, NetBIOS disabled on adapters, WPAD AutoDetect=0
- **What it does:** Turns off LLMNR, NetBIOS name replies, and WPAD (three ways Windows guesses names and proxy settings on the local network).
- **Why it scores:** Those name shortcuts are common plants and let a neighbor answer for a name you meant to look up.
- **What it changes:** Sets EnableMulticast to 0 under DNSClient policy, sets each adapter's NetBIOS to disabled, sets AutoDetect to 0, sets DisableWpad to 1, and disables the WinHttpAutoProxySvc service.
- **How to undo:** If a backup was made, restore from %ProgramData%\CyberPatriotOps\backups\<ts>\. Remove those policy values and set WinHttpAutoProxySvc back to Manual only if the README requires WPAD or NetBIOS.

Turn off LLMNR (EnableMulticast=0), NetBIOS over TCP/IP (SetTcpipNetbios 2), and WPAD/autodetect proxy on the local Windows image. These name-resolution shortcuts are common CP plants and are not needed on a hardened workstation. Live requires confirm:true. dryRun reports current state without changing it.

#### `clear-suspicious-hosts`

- **Title:** Clear suspicious hosts-file entries
- **Platforms:** both
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Would drop 127.0.0.1 windowsupdate.microsoft.com and 0.0.0.0 google.com; keep localhost
- **What it does:** Removes hosts-file lines that point update, antivirus, or common site names at 127.0.0.1, 0.0.0.0, or ::1. Localhost lines stay.
- **Why it scores:** Those sinkholes block Windows Update and security tools. They are a planted hosts finding.
- **What it changes:** Rewrites /etc/hosts on Linux and %SystemRoot%\System32\drivers\etc\hosts on Windows, dropping only sinkhole lines whose names match update, antivirus, or major site names. Comments and other lines stay.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. Put a removed line back only if you are sure it was legitimate. The backup copy of the hosts file is the safe source.

Remove hosts-file lines that sinkhole Windows Update, AV, or well-known names to 127.0.0.1/0.0.0.0. Keeps localhost and the machine hostname. Complements audit-hosts-file. Live requires confirm:true. dryRun lists lines that would be dropped. Local file only.

#### `harden-host-conf`

- **Title:** Harden host.conf nospoof
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates writing order hosts,bind / multi on / nospoof on
- **What it does:** Sets the name-lookup order so the hosts file is checked first and spoofed replies are rejected.
- **Why it scores:** nospoof on stops a forged DNS answer from winning over the hosts file. It is a small Linux network hardening item.
- **What it changes:** Overwrites /etc/host.conf with order hosts,bind, multi on, and nospoof on.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. Restore the previous /etc/host.conf from the backup (often order hosts,bind and multi on, without nospoof).

Write /etc/host.conf with `order hosts,bind`, `multi on`, and `nospoof on` to mitigate IP spoofing / name tricks on the local resolver. Live requires confirm:true. Complements harden-sysctl rp_filter.

#### `audit-dns-client`

- **Title:** Audit DNS client / DoH
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** DNS 10.13.37.1 (unexpected); DoH unset; NRPT empty; hosts poisoning is a separate op
- **What it does:** Reads the local DNS client settings, including DNS-over-HTTPS if Windows reports it. It does not look up names.
- **Why it scores:** A planted DNS server sends every lookup to the wrong place. You want the configured servers, not a live query off the image.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Read DNS client servers, DoH (DnsClientDoh), and NRPT on the local image. Complements audit-hosts-file (poisoning) without contacting those names. Flags 127.0.0.1-only, empty DoH, and obviously bogus servers. Local config only.

#### `audit-time-timezone`

- **Title:** Audit time sync and timezone
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** timesyncd inactive; NTP 10.13.37.1; timezone Etc/GMT+12 (suspicious); RTC not NTP-synced
- **What it does:** Reads the timezone and whether the clock is synced. It does not change the clock and it is not a network time attack.
- **Why it scores:** A nonsense timezone or a dead time service makes every log timestamp wrong.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Deepen check-ntp: timedatectl/w32time plus timezone sanity (UTC vs America/*, fake NTP 10.x, NTP disabled). Wrong clocks break logs. Local config only — not an NTP amplification test and not a CCS query.

### firewall

#### `audit-firewall`

- **Title:** Audit host firewall
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** ufw inactive; Windows Public profile off; no default deny
- **What it does:** Shows whether the host firewall is on. Linux reads ufw and iptables. Windows reads the Domain, Private, and Public profiles.
- **Why it scores:** A firewall that is off lets every service answer the network. Turning it on is usually one of the first fixes.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Report ufw/firewalld/iptables or Windows Firewall profiles (Domain/Private/Public). A disabled host firewall is a high finding.

#### `enable-firewall`

- **Title:** Enable host firewall
- **Platforms:** both
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates ufw --force enable and Set-NetFirewallProfile -Enabled True
- **What it does:** Turns the host firewall on. It does not delete your existing allow rules.
- **Why it scores:** Firewall off is an early, high-value finding on both platforms.
- **What it changes:** On Linux it runs ufw --force enable. On Windows it runs Set-NetFirewallProfile so Domain, Public, and Private are Enabled.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. Turn it off only if you must recover a locked-out service: Linux ufw disable, Windows Set-NetFirewallProfile -Enabled False. Then turn it back on once the README ports are allowed.

Enable ufw/firewalld or all Windows Firewall profiles. Does not open ports on other machines. Live requires confirm:true.

#### `list-firewall-rules`

- **Title:** List firewall rules
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** Allow 23/tcp, Allow 445, a 0.0.0.0/0 any/any inbound exception
- **What it does:** Lists enabled firewall rules (name, direction, allow or block) so you can see what is already permitted.
- **Why it scores:** After you turn the firewall on you still need the rules to match the README, or you will block a scored service or leave a bad one open.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

List host firewall rules and highlight allow-any inbound, allow 23/21/445, and disabled default-deny.

#### `apply-default-deny-inbound`

- **Title:** Apply default-deny inbound
- **Platforms:** both
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates default deny inbound + allow 22/80 from required services
- **What it does:** Sets the firewall to block incoming connections unless a rule allows them, and still allows outgoing traffic.
- **Why it scores:** Default-allow inbound means every new listener is exposed. Scoring wants new connections blocked until you allow the README ports.
- **What it changes:** On Linux it runs ufw default deny incoming and ufw default allow outgoing. On Windows it sets DefaultInboundAction Block and DefaultOutboundAction Allow on the firewall profiles.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. Restore the previous default: Linux ufw default allow incoming if that was the old policy, Windows Set-NetFirewallProfile -DefaultInboundAction Allow. Then re-add only the README allows.

Set default incoming deny (ufw default deny incoming / public profile block) while leaving established outbound. Pair with allow rules for required services. Live requires confirm:true.

#### `import-firewall-profile`

- **Title:** Import firewall profile
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `profilePath` (string), `dryRun` (boolean)
- **Demo fixture:** Simulates enabling Domain/Public/Private firewall with Block inbound / Allow outbound (no .wfw in the demo)
- **What it does:** Imports a saved Windows firewall policy, or applies a known-good on-and-block-inbound profile when you do not pass a file.
- **Why it scores:** A known-good firewall policy turns profiles on and blocks inbound in one step, after which you add only README ports.
- **What it changes:** If you pass a .wfw file it runs netsh advfirewall import. Otherwise it enables Domain, Public, and Private, sets inbound to Block, and sets outbound to Allow.
- **How to undo:** If a backup was made, restore from %ProgramData%\CyberPatriotOps\backups\<ts>\. Import the previous .wfw export if you have one. Otherwise set the inbound default back only for the moment you need, then return to Block.

Import a netsh .wfw firewall export if profilePath is set, otherwise apply a known-good local profile: all profiles on, default-deny inbound, allow outbound. Confirm-gated. Does not scan other machines. Authorized-image hardening only: never used against other teams, scoring endpoints, or off-image hosts.

#### `set-ufw-logging`

- **Title:** Set UFW logging high and verify defaults
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates logging high, default deny incoming, allow outgoing; ufw was inactive in the fixture
- **What it does:** Turns firewall logging up and sets the default to deny incoming and allow outgoing.
- **Why it scores:** High logging is how you see blocked probes. The same command also locks in default-deny, which is the scored firewall stance.
- **What it changes:** Runs ufw logging high, ufw default deny incoming, and ufw default allow outgoing.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. Set logging back with ufw logging low or medium. Change the default policy only if you saved the previous one in the backup.

Set `ufw logging high` and verify default deny incoming / allow outgoing on the local host firewall. Does not open ports. Live requires confirm:true. Pair with enable-firewall if UFW is inactive.

### files

#### `find-world-writable`

- **Title:** Find world-writable files
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** /etc/cron.d/hack, /usr/local/bin, /home/bob/public mode 0777
- **What it does:** Finds files and folders that any local user can change, especially cron, sudoers, and directories on the command PATH.
- **Why it scores:** A world-writable sudoers or cron file lets a normal user become root. That is a critical file finding.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Find world-writable files and directories under /home /etc /opt /tmp /var /usr/local (capped). World-writable sudoers, cron, or PATH dirs are high. Local filesystem only.

#### `find-suid-sgid`

- **Title:** Find SUID/SGID files
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** /tmp/suid_bash, /home/flag/.hidden_shell, plus expected /usr/bin/passwd
- **What it does:** Finds SUID and SGID programs (they run as the file's owner, often root), especially copies under /tmp or home folders.
- **Why it scores:** A surprise SUID copy of a shell is a classic backdoor. Stock system SUID tools in /usr can stay.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

List SUID/SGID binaries and compare to a small expected set (passwd, sudo, su, newgrp, ping). SUID copies under /tmp /home /opt /var are critical. Read-only find; does not exploit them.

#### `find-media-files`

- **Title:** Find prohibited media files
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** /home/bob/secret.mp3, /home/alice/Movies/clip.mp4, /Users/Public/song.wav
- **What it does:** Finds music and video files (mp3, mp4, and similar) under user folders. It does not delete them.
- **Why it scores:** Prohibited media is an easy file-finding. Delete only after you have answered any forensics question that names the file.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Find mp3/mp4/avi/mkv/mov/flac/wav/ogg under user homes and common stash dirs. CP README usually forbids media; this is an inventory for authorized deletion, not a wipe-without-review.

#### `audit-home-permissions`

- **Title:** Audit home directory permissions
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** /home/bob 0777, /home/zygote owned by root, /tmp/toor as toor's home
- **What it does:** Checks whether home folders are private to their owner instead of readable by everyone.
- **Why it scores:** A home folder open to every user leaks SSH keys and documents, and it is a standard permission finding.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Check that homes are not group/world writable or owned by another user. Mode 777 homes are a finding; root-owned user homes too.

#### `check-sensitive-file-perms`

- **Title:** Check sensitive file permissions
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** /etc/shadow 0644, /etc/sudoers 0666, ssh host key 0644
- **What it does:** Checks permissions on sensitive files such as shadow, sudoers, and SSH host keys. It does not print their contents.
- **Why it scores:** If anyone can read the shadow file or write sudoers, the password store and root access are exposed.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Verify /etc/passwd, shadow, gshadow, group, sudoers, ssh host keys, crontab. shadow should be 000/640 root:shadow — never world-readable. Does not print file contents of shadow.

#### `audit-ssh-authorized-keys`

- **Title:** Audit SSH authorized_keys
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** root has a key commented hacker@evil; zygote has authorized_keys in /var/tmp
- **What it does:** Lists SSH authorized_keys files (the public keys that can log in without a password) and flags unexpected ones. Private keys are not printed.
- **Why it scores:** An extra key in authorized_keys is a backdoor login that survives a password change.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Inventory ~/.ssh/authorized_keys for unexpected keys (comments like 'hacker@evil', extra keys on root). Reports fingerprints and comments, not private keys.

#### `find-hidden-executables`

- **Title:** Find hidden executables
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** /home/flag/.hidden_shell, /tmp/.kworker, Windows Startup .update.exe
- **What it does:** Looks for hidden programs (names starting with a dot, or odd executables) under home folders, temp, and the Windows Startup folder.
- **Why it scores:** Hidden executables are a common way a plant stays out of a normal directory listing.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Find executable files whose names start with '.' under homes, /tmp, /var/tmp, and Startup folders. Classic CP planted backdoors. Inventory only.

#### `audit-shared-folders`

- **Title:** Audit shared folders
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** public (guest ok, world writable), C$ enabled, IPC$
- **What it does:** Lists file shares and flags ones that allow Guest or Everyone to write.
- **Why it scores:** An open share is a scored hole even when the firewall is on, because local users can still reach it.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

List Samba shares and Windows SMB shares with guest access, Everyone/Full, and administrative shares. Local config only.

#### `audit-share-acls`

- **Title:** Dump unauthorized share ACLs
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** public: Everyone Full + guest; C$ Everyone; homes browseable
- **What it does:** Lists each share's access list (who has which rights) and flags Everyone or Guest.
- **Why it scores:** Share permissions that include Everyone are a finding even if the folder's own permissions look tight.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Inventory Samba share options and Windows SMB share ACLs. Flags guest/Everyone Full, world-writable paths, and administrative shares that should not be exposed on a workstation image. Read-only; does not modify ACLs or enumerate other machines.

#### `audit-critical-perm-drift`

- **Title:** Audit critical permission drift
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** /etc/shadow 0644, /etc/sudoers 0666, SAM Everyone:(R) simulated
- **What it does:** Re-checks permissions on critical files (via the same sensitive-file check, or the optional Bend file scan if it is installed).
- **Why it scores:** Permissions drift back when a package or a plant rewrites them. This is the second look after the first file audit.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Read-only mode/ACL check for /etc/shadow, gshadow, sudoers, ssh host keys, and Windows SAM/SYSTEM file ACLs via icacls. Flags world-readable shadow or Everyone-readable SAM. Does not dump SAM, hashes, or private keys.

#### `audit-sticky-tmp`

- **Title:** Audit sticky bit on temp dirs
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** /tmp mode 0777 missing sticky (critical); /var/tmp 1777 ok; /tmp/world dir 0777
- **What it does:** Checks the sticky bit on /tmp and other temp folders (only the owner can delete their own files).
- **Why it scores:** Without the sticky bit, any user can delete another user's files in /tmp, including locks and sockets.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Check /tmp, /var/tmp, and /dev/shm for the sticky bit (1777) and inventory world-writable temp files/dirs that are missing sticky. 0777 /tmp without sticky is a classic plant; sticky /tmp is expected. Local filesystem only — Bend-parallel when available.

#### `hunt-sysprep-leftovers`

- **Title:** Hunt unattended / sysprep leftovers
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** C:\Windows\Panther\unattend.xml with AutoLogon key (value omitted); /root/unattend.xml
- **What it does:** Finds leftover unattend.xml, sysprep, and kickstart files. Password values in those files are not printed.
- **Why it scores:** Setup answer files often still contain the original password. Find them before you delete them, and never paste the secret into notes.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Find leftover unattend.xml, autounattend.xml, sysprep.xml, Panther, and kickstart files on the authorized image. Flags AutoLogon/Password keys by name only — values are never printed. Local files only; Bend-parallel path hunt when available.

#### `audit-browser-baseline`

- **Title:** Audit Firefox/IE/Edge security baseline
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** Firefox safebrowsing off; IE DisablePasswordSaving=0; Edge SmartScreen off
- **What it does:** Checks whether Firefox has a system policy file. Cookies, history, and saved passwords are not read.
- **Why it scores:** A missing browser baseline, or a planted homepage, is a later-round finding after accounts and the firewall.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Check enterprise Firefox policies/user.js and IE/Edge SmartScreen, form-fill, and popup settings on the local image. Flags safebrowsing off, password-saving on a shared image, and insecure protocol handlers. Does not dump cookies, history, or saved passwords.

#### `hunt-shell-backdoors`

- **Title:** Hunt shell aliases and profile backdoors
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** Hits: /home/zygote/.bashrc alias sudo=; /etc/profile.d/backdoor.sh wget|sh; /root/.bashrc HISTFILE unset
- **What it does:** Reads shell startup files for aliases that hijack sudo or ls, and for lines that download a script and run it. It does not execute those files.
- **Why it scores:** A bad alias or a profile line runs every time someone opens a terminal. That is a persistence plant.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Scan /etc/profile, bashrc, profile.d, user rc files, and Windows PowerShell profiles for alias hijacks (sudo/ls/passwd), wget|sh, nc -e, LD_PRELOAD, HISTFILE unset, and /tmp plants. Read-only. Bend-parallel file sweep on Linux when available. Does not execute the rc files.

#### `audit-browser-policy`

- **Title:** Audit browser homepage / proxy / extensions
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** Firefox homepage http://10.13.37.1/pwn; system proxy 10.13.37.1:8080; one unpacked Chrome extension id
- **What it does:** Reads the browser homepage, proxy, and extension ids. Cookies, history, and saved passwords are not dumped.
- **Why it scores:** A planted homepage or proxy sends the user somewhere else. Unknown extensions are a later-round finding.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Deepen audit-browser-baseline: Firefox/Chrome/Edge/IE homepage, proxy/PAC, and extension *ids* (no source dump, no cookies, no saved passwords). Flags unexpected homepages, system proxy to a contest box, and leftover unpacked extensions.

### packages

#### `list-installed-packages`

- **Title:** List installed packages
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** Subset including nmap, hydra, telnetd, apache2, openssh-server
- **What it does:** Lists installed software (dpkg or Windows packages) so you can compare it to the README.
- **Why it scores:** You need the inventory before you remove a game, a hacking tool, or a sample app.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

List packages (dpkg-query / rpm / Get-Package). Large but filterable; used as input to prohibited-software matching.

#### `find-prohibited-software`

- **Title:** Find prohibited software
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** nmap, hydra, netcat-traditional, john, ophcrack found
- **What it does:** Looks for known hacking and attack tools such as nmap, hydra, john, and netcat. It does not remove them.
- **Why it scores:** Those tools are prohibited on the image and score when they are installed. Removal is a separate confirmed step.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Match installed packages and well-known binary paths against config/prohibited-software.txt (nmap, hydra, john, netcat, ophcrack, aircrack, …). Removal is in-scope on the authorized image; this op is read-only discovery.

#### `remove-package`

- **Title:** Remove a package
- **Platforms:** both
- **Risk:** mutate
- **Params:** `package*` (string), `dryRun` (boolean)
- **Demo fixture:** Simulates purging nmap and hydra
- **What it does:** Uninstalls one package you name. It refuses core packages such as openssh-server, sudo, bash, and systemd unless you force it.
- **Why it scores:** Banned tools and games stay installed until you remove them. This is the confirmed uninstall.
- **What it changes:** On Linux it runs apt-get remove -y or dnf remove -y for that package name. On Windows it runs Uninstall-Package. Configuration files the package manager leaves behind may remain.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. Reinstall from the distro only if the README requires it: apt-get install or dnf install on Linux, Install-Package on Windows. Do not download a random installer.

Remove a local package (apt-get remove --purge / dnf remove / Uninstall-Package). Live requires confirm:true. Refuses to remove packages that look like required services (openssh-server, apache2) unless forced.

#### `hunt-remote-access-tools`

- **Title:** Hunt remote-access tools and browser extensions
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** teamviewer + anydesk packages; x11vnc binary; one unpacked Chrome extension id
- **What it does:** Looks for remote-control programs such as TeamViewer, AnyDesk, VNC, and similar names in installed software.
- **Why it scores:** Unauthorized remote-access tools are prohibited and give someone else a console on the image.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Find TeamViewer, AnyDesk, VNC, Chrome Remote Desktop, RustDesk and similar on the authorized image, plus browser extension directories (Chrome/Edge/Firefox profile ids only — no extension source dump). Cross-checks config/remote-access-tools.txt. Discovery, not an exploit.

#### `remove-games-samples`

- **Title:** Remove games and sample content
- **Platforms:** both
- **Risk:** mutate
- **Params:** `gamesListPath` (string), `dryRun` (boolean)
- **Demo fixture:** Simulates removing aisleriot, gnome-mines, example-content, and MicrosoftSolitaireCollection
- **What it does:** Removes games and sample apps named in config/games-samples.txt, plus a short Windows list of built-in games.
- **Why it scores:** Games and sample content are prohibited software and an easy package finding.
- **What it changes:** On Linux it apt-get removes packages from config/games-samples.txt that are actually installed. On Windows it Remove-AppxPackage for Xbox, Solitaire, Zune Music, and Candy Crush when those packages are present.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. Reinstall a package only if the README says it is required, using the distro or the Microsoft Store. Do not add a random game back.

Remove games and vendor sample/content packages listed in config/games-samples.txt (aisleriot, solitaire, Xbox apps, example-content, IIS samples, …). Live requires confirm:true. Refuses names that look like required services. Snapshot first if a forensics question might name a game.

#### `scan-malware-tools`

- **Title:** ClamAV / chkrootkit scan report
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Demo dry inventory: clamav absent, chkrootkit absent; confirm would install then scan /home /tmp (no hits in fixture)
- **What it does:** With confirmation, installs clamav and chkrootkit from the distro and scans /home, /tmp, and /opt. Without confirmation it only reports that a scan was not started.
- **Why it scores:** A local malware scan can catch a planted binary the package list does not name. It stays on this computer.
- **What it changes:** When confirmed it may apt-get or dnf install clamav and chkrootkit, then runs clamscan on /home, /tmp, and /opt and chkrootkit, and prints only a short infected-or-warning excerpt.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. Remove the tools if you do not want them left behind: apt-get remove clamav chkrootkit or dnf remove. The scan itself does not delete files.

Inventory clamav and chkrootkit. dryRun (or live without install) reports whether they are present. With confirm:true, may apt/dnf install the distro packages then run a local scan (home/tmp/opt only). Never downloads unofficial installers, never scans other hosts. If packages are unavailable, report that — do not fail the round on a missing universe repo.

#### `audit-snap-flatpak`

- **Title:** Audit Snap/Flatpak unnecessary apps
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** snap: steam, discord; flatpak: org.videolan.VLC, com.anydesk.Anydesk; core snaps ignored
- **What it does:** Lists Snap and Flatpak apps so you can spot games and extra tools the package manager did not show.
- **Why it scores:** Prohibited software is sometimes installed as a snap or flatpak and missed by the dpkg list.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

List snap and flatpak apps and flag games, remote-desktop, and typical prohibited leftovers (steam, discord, skype, wine). Discovery for authorized removal — this op does not uninstall.

### logging

#### `audit-logging`

- **Title:** Audit logging configuration
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** rsyslog inactive; auditd not installed; EventLog running but Security log size tiny
- **What it does:** Checks whether system logs are being kept. Windows reads Application, Security, and System log status. Linux reads the local logging setup.
- **Why it scores:** If logging is off you cannot prove what happened, and audit policy is itself a scored item.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Check rsyslog/journald/syslog-ng or Windows Event Log services and common log files. Disabled logging is a finding because scoring/forensics depend on it.

#### `check-auditd`

- **Title:** Check auditd
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** auditd installed but inactive; no watches on /etc/passwd
- **What it does:** Checks whether auditd (Linux's security audit daemon) is installed and running.
- **Why it scores:** auditd is how Linux records admin actions. Scoring often wants it on and recording.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Check auditd/auditctl presence, enabled flag, and a few expected rules (identity changes, sudoers writes). Does not flood the disk with new rules in read mode.

#### `enable-audit-policy`

- **Title:** Enable Success+Failure audit policy
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates auditpol Success+Failure on six categories; Security log is not dumped
- **What it does:** Turns on success and failure auditing for the main Windows audit categories.
- **Why it scores:** Windows scoring wants logon, account, and policy changes recorded. This does not dump the Security log.
- **What it changes:** Runs auditpol /set /success:enable /failure:enable for Account Logon, Account Management, Logon/Logoff, Policy Change, Privilege Use, and System.
- **How to undo:** If a backup was made, restore from %ProgramData%\CyberPatriotOps\backups\<ts>\. Set a category back with auditpol /set /category:<name> /success:disable /failure:disable only if the README forbids that category.

Turn on Success and Failure auditing for Account Logon, Account Management, Logon/Logoff, Policy Change, Privilege Use, and System via auditpol. Local security log only — not a remote audit. Live requires confirm:true.

#### `audit-log-persistence`

- **Title:** Audit rsyslog/journald persistence
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** journald Storage=volatile; /var/log/journal missing; rsyslog inactive
- **What it does:** Reads whether the systemd journal is stored on disk or only in memory.
- **Why it scores:** Volatile logs disappear at reboot, so you lose the record of what changed during the round.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Check journald Storage=persistent (or /var/log/journal present) and rsyslog file modules. Disabled/volatile logging loses forensics evidence. Complements audit-logging. Does not ship logs off-image.

### updates

#### `check-pending-updates`

- **Title:** Check pending updates
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** 12 pending security updates; unattended-upgrades off
- **What it does:** Reports whether security updates are waiting. It does not install them and does not contact the scoring server.
- **Why it scores:** Missing patches are points. Know the list before you spend time on an upgrade.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Report whether unattended-upgrades/apt/dnf or Windows Update indicates pending security patches. Read-only; does not reach out beyond the image's configured update service.

#### `apply-security-updates`

- **Title:** Apply security updates
- **Platforms:** both
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates installing 12 security updates with a package list
- **What it does:** Installs updates from the image's own package source. It does not target any other computer.
- **Why it scores:** Pending security updates are a direct score category once you know the README allows the network path to the local mirror.
- **What it changes:** On Linux it runs apt-get update and apt-get upgrade -y, or dnf update. On Windows the live script does not download updates itself; it tells you to run Windows Update on the image.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. Package upgrades are not a single file to revert. If a backup was made, restore the packages from it, or reinstall the previous package versions from the distro cache. Do not uninstall a security update just to get the old vulnerable build back unless the image will not boot.

Apply local security updates (apt-get upgrade, dnf update --security, or Start-WindowsUpdate). Long-running; live requires confirm:true. Stays on the authorized image's update channels.

#### `audit-auto-updates`

- **Title:** Audit unattended-upgrades / Windows Update
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** 20auto-upgrades Unattended-Upgrade 0; wuauserv disabled; AUOptions=1 (never check)
- **What it does:** Reads whether automatic updates are turned on (Linux unattended-upgrades files, or the Windows Update channel).
- **Why it scores:** Auto-update off means the next patch never arrives. It is a scored updates finding.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Check that unattended-upgrades (APT Periodic) or Windows Update (WUAU/AUOptions, wuauserv) is enabled and not blocked by policy/hosts. Complements check-pending-updates: this is the *channel* sanity check, not a patch install. Local config only.

#### `enable-unattended-upgrades`

- **Title:** Enable unattended-upgrades
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates writing 20auto-upgrades Unattended-Upgrade 1 and enabling the package
- **What it does:** Turns on automatic security updates through the distro's unattended-upgrades package.
- **Why it scores:** Auto-update off is an updates finding. This writes the apt setting that turns the daily job on.
- **What it changes:** May install unattended-upgrades from apt, writes /etc/apt/apt.conf.d/20auto-upgrades with Update-Package-Lists 1 and Unattended-Upgrade 1, and enables the unattended-upgrades service.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. Set Unattended-Upgrade back to 0 in 20auto-upgrades, or restore that file from the backup, if the README says updates must be manual.

Install distro unattended-upgrades if missing and write APT Periodic 20auto-upgrades (Update-Package-Lists 1, Unattended-Upgrade 1). Complements audit-auto-updates. Does not fetch unofficial installers. Live requires confirm:true.

### scheduled

#### `audit-cron`

- **Title:** Audit cron jobs
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** root cron wget | sh; /etc/cron.d/hack world-writable running /tmp/suid_bash
- **What it does:** Reads Linux scheduled jobs in /etc/crontab and /etc/cron.d and shows a short snippet of each file.
- **Why it scores:** A cron line that downloads a script and runs it is a persistence plant. Jobs also keep running after you lock the user who added them.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Inventory /etc/crontab, cron.d, cron.*, and user crontabs. Flag nc/wget|sh, curl-to-pipe, /tmp executables, and world-writable cron files.

#### `audit-at-jobs`

- **Title:** Audit at jobs
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** One at job as zygote running python reverse-looking command (reported, not executed)
- **What it does:** Lists one-shot at jobs (commands scheduled to run once).
- **Why it scores:** An at job is an easy place to hide a command that fires after you think the image is clean.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

List at/batch jobs. Unexpected at jobs are a common CP plant.

#### `list-scheduled-tasks`

- **Title:** List scheduled tasks
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** Updater task running %TEMP%\svc.exe; persistence in Startup folder
- **What it does:** Lists Windows scheduled tasks outside the built-in Microsoft folders.
- **Why it scores:** A non-Microsoft task that runs a script from a user folder is a persistence finding.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

List non-Microsoft scheduled tasks and highlight user-writable actions, missing authors, and payloads under TEMP or Startup.

#### `audit-persistence-deep`

- **Title:** Deep startup persistence audit
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** rc.local /tmp/.kworker; cron wget|sh; HKCU Run update.exe; profile.d backdoor.sh
- **What it does:** Reads Run and RunOnce keys, the Startup folder, and non-Microsoft scheduled tasks in one pass.
- **Why it scores:** Persistence is spread across those places. One combined read is how you catch a tool that comes back after reboot.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Deeper than audit-startup-items: systemd enabled units, rc.local, cron/cron.d, /etc/profile.d, user autostart, Windows Run/RunOnce, Startup folder, and non-Microsoft scheduled tasks. Flags temp-path payloads, wget|sh, and interpreter plants. Inventory only.

#### `restrict-cron-at`

- **Title:** Restrict at/cron to root
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates cron.allow/at.allow = root; would remove world-readable cron.deny
- **What it does:** Allows only root to add cron and at jobs.
- **Why it scores:** If every user can schedule a job, a planted account can keep a command running after you lock the password.
- **What it changes:** Writes root as the only line in /etc/cron.allow and /etc/at.allow, sets those files to mode 600, and deletes /etc/cron.deny and /etc/at.deny.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. Restore the previous allow and deny files from the backup. If you need a README user to have cron, add that name to cron.allow.

Write /etc/cron.allow and /etc/at.allow containing root (and allowed-admins if listed), and remove world-usable cron.deny/at.deny so only those names may use crontab/at. Does not delete existing root cron jobs. Live requires confirm:true. Complements audit-cron / audit-at-jobs.

### kernel

#### `audit-sysctl`

- **Title:** Audit sysctl hardening
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** ip_forward=1, tcp_syncookies=0, accept_redirects=1
- **What it does:** Reads Linux kernel network switches such as IP forwarding, ICMP redirects, and SYN cookies.
- **Why it scores:** Forwarding and accepting redirects turn the image into a router or a spoof target. Scoring wants those off on a workstation.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Read ip_forward, rp_filter, accept_redirects, tcp_syncookies, dmesg_restrict, kptr_restrict, randomize_va_space. Forwarding on a workstation is a finding.

#### `harden-sysctl`

- **Title:** Apply sysctl hardening
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates writing the drop-in and applying sysctl --system
- **What it does:** Writes safer kernel network settings and applies them.
- **Why it scores:** This is the fix for the sysctl audit: no forwarding, no redirects, reverse-path filtering, and SYN cookies.
- **What it changes:** Writes /etc/sysctl.d/99-cp-hardening.conf (ip_forward 0, send/accept redirects 0, accept_source_route 0, log_martians 1, rp_filter 1, tcp_syncookies 1, IPv6 accept_redirects 0, randomize_va_space 2, dmesg_restrict 1, kptr_restrict 2) and runs sysctl --system.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. Delete 99-cp-hardening.conf and run sysctl --system so the previous files apply again.

Write /etc/sysctl.d/99-cp-hardening.conf with conservative workstation values (no forwarding, syncookies, rp_filter, no redirects) and sysctl --system. Live requires confirm:true.

#### `audit-startup-items`

- **Title:** Audit startup items
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** rc.local invokes /tmp/.kworker; HKCU Run \update.exe; sshd enabled (ok)
- **What it does:** Lists programs that start at boot or logon: Linux rc files and Windows Run keys and Startup folders.
- **Why it scores:** Startup entries survive a reboot. A strange Run key is how a tool comes back after you close it.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

List systemd enabled units, rc.local, Windows Run keys, and Startup folder entries. Flag unsigned or temp-path payloads.

#### `audit-mac-enforcement`

- **Title:** Audit AppArmor/SELinux enforcement
- **Platforms:** linux
- **Risk:** read
- **Params:** none
- **Demo fixture:** SELinux Permissive; AppArmor loaded but complain-mode profiles present
- **What it does:** Reports whether AppArmor or SELinux (Linux mandatory access control) is enforcing, or only complaining.
- **Why it scores:** A profile set to complain does not actually block a bad program. Scoring often wants enforcing mode.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Report AppArmor (aa-status) and SELinux (getenforce/sestatus) mode. Permissive or disabled MAC is a finding on images that shipped with a profile. Suggests enforce; this op does not flip the mode (setenforce is a separate admin action after a README check).

#### `blacklist-kernel-modules`

- **Title:** Blacklist uncommon kernel modules
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `usbStorage` (boolean), `dryRun` (boolean)
- **Demo fixture:** Simulates blacklisting dccp/sctp/cramfs/hfs; usb-storage left loaded unless usbStorage=true
- **What it does:** Stops uncommon network and filesystem kernel modules from loading. USB storage is included only when you ask for it.
- **Why it scores:** Protocols such as DCCP and SCTP, and odd filesystems, are unused on a competition desktop and sometimes used by plants.
- **What it changes:** Writes /etc/modprobe.d/cp-blacklist.conf blacklisting dccp, sctp, rds, tipc, cramfs, freevxfs, jffs2, hfs, hfsplus, udf, and firewire-core. usb-storage is added only when CP_USB_STORAGE=1.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. Delete cp-blacklist.conf. Already-loaded modules stay until reboot. Leave usb-storage out unless you meant to disable USB disks.

Write /etc/modprobe.d/cp-blacklist.conf for uncommon protocols/filesystems (dccp, sctp, cramfs, hfs, firewire, …) from config/kernel-module-blacklist.txt. usb-storage is included only when usbStorage=true (default false). Live requires confirm:true.

#### `enforce-apparmor-profiles`

- **Title:** Enforce AppArmor profiles for common apps
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates aa-enforce apache2 mysqld ntpd ping; 3 complain profiles remain unnamed
- **What it does:** Switches common AppArmor profiles from complain to enforce, when aa-enforce is installed.
- **Why it scores:** Complain mode only logs. Enforce mode is what actually blocks a program from doing more than its profile allows.
- **What it changes:** Runs aa-enforce for apache2, httpd, mysqld, ntpd, named, dhcpd, ping, and tcpdump when those profiles exist. If aa-enforce is missing, it changes nothing.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. aa-complain on the same profile names returns them to log-only mode.

Move loaded AppArmor profiles for common daemons (apache2, mysqld, ntpd, named, dhcpd, ping, tcpdump, …) from complain to enforce when aa-enforce exists. Complements audit-mac-enforcement (read). Does not setenforce SELinux. Live requires confirm:true.

#### `disable-ctrl-alt-del`

- **Title:** Disable Ctrl+Alt+Del and extra TTYs
- **Platforms:** linux
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates systemctl mask ctrl-alt-del.target and disable serial-getty@ttyS0
- **What it does:** Stops Ctrl+Alt+Del from rebooting the machine, and turns off an extra serial login prompt.
- **Why it scores:** An open reboot chord and an extra getty are small hardening items after the account and network work.
- **What it changes:** Runs systemctl mask ctrl-alt-del.target and systemctl disable --now serial-getty@ttyS0.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. systemctl unmask ctrl-alt-del.target and systemctl enable serial-getty@ttyS0 if you truly need the serial console.

Mask ctrl-alt-del.target and disable rare extra gettys (serial-getty@ttyS0, extra tty8+) so a console CAD reboot is not a cheap plant. Does not disable tty1–tty6 needed for local login. Live requires confirm:true.

#### `audit-ipv6-privacy`

- **Title:** Audit IPv6 privacy / optional disable
- **Platforms:** linux
- **Risk:** read
- **Params:** `disableIPv6` (boolean), `dryRun` (boolean)
- **Demo fixture:** use_tempaddr=0, accept_ra=1, forwarding=1; disableIPv6 not applied in the demo
- **What it does:** Reads IPv6 privacy and forwarding switches. By default it changes nothing. It disables IPv6 only when you explicitly ask.
- **Why it scores:** IPv6 that accepts router advertisements while forwarding is on, or that is left in an unexpected state, is a later-round network finding.
- **What it changes:** Nothing - read-only audit unless disableIPv6 is true (Linux CP_DISABLE_IPV6=1). In that case it writes /etc/sysctl.d/99-cp-ipv6-disable.conf and reloads sysctl so IPv6 is off.
- **How to undo:** Nothing to undo when you only audited. If IPv6 was disabled, if a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. Otherwise delete 99-cp-ipv6-disable.conf and run sysctl --system.

Read IPv6 privacy extensions, accept_ra, and forwarding. Default is audit-only. disableIPv6=true writes sysctl to disable IPv6 — that path requires confirm:true (or dryRun). Do not disable if the README requires IPv6.

#### `harden-usb-storage`

- **Title:** Harden USB autorun / storage policy
- **Platforms:** both
- **Risk:** mutate
- **Params:** `disableUsbStorage` (boolean), `dryRun` (boolean)
- **Demo fixture:** Simulates autorun off + Deny_Execute on removable; USBSTOR left enabled unless disableUsbStorage
- **What it does:** Stops USB disks from auto-running or auto-mounting. It does not disable keyboards.
- **Why it scores:** Autorun from a USB stick is a scored finding and a way for a file to launch itself.
- **What it changes:** On Windows it sets NoDriveTypeAutoRun to 255 and Deny_Execute on removable disks. On Linux it writes /etc/udev/rules.d/99-cp-usb.rules and a dconf policy that turns automount off. The usb-storage driver is blacklisted only when CP_DISABLE_USB_STORAGE=1.
- **How to undo:** If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. Delete the udev rule and dconf file on Linux, and remove NoDriveTypeAutoRun and the RemovableStorageDevices Deny_Execute value on Windows. Remove /etc/modprobe.d/usb-storage.conf if you also blacklisted the driver.

Disable USB autorun/autoplay and deny execute from removable storage (Windows NoDriveTypeAutoRun + RemovableStorageDevices; Linux udisks/udev automount off). Optional disableUsbStorage=true blacklists usb-storage / USBSTOR — default false so keyboards stay. Live requires confirm:true.

### windows

#### `disable-smbv1`

- **Title:** Disable SMBv1
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates Disable-WindowsOptionalFeature SMB1Protocol
- **What it does:** Turns off the old SMBv1 file-sharing feature. Newer SMB can stay.
- **Why it scores:** SMBv1 is unsafe and is scored even when the image still needs file sharing.
- **What it changes:** Runs Disable-WindowsOptionalFeature for SMB1Protocol with no restart.
- **How to undo:** If a backup was made, restore from %ProgramData%\CyberPatriotOps\backups\<ts>\. Re-enable SMB1 only if a README you trust still requires it: Enable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol. That is rare.

Disable SMB1Protocol feature / registry. SMBv1 is in-scope hardening on Windows CP images. Live requires confirm:true.

#### `enable-windows-defender`

- **Title:** Enable Microsoft Defender
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates Set-MpPreference -DisableRealtimeMonitoring $false
- **What it does:** Turns Microsoft Defender real-time protection back on. It does not install a third-party antivirus.
- **Why it scores:** Defender disabled is a common registry plant. The built-in antivirus should be watching.
- **What it changes:** Runs Set-MpPreference -DisableRealtimeMonitoring $false.
- **How to undo:** If a backup was made, restore from %ProgramData%\CyberPatriotOps\backups\<ts>\. Do not turn real-time protection back off. If you must undo a bad preference change, restore the Defender policy from the backup folder.

Re-enable Defender realtime monitoring if it was disabled. Does not download third-party AV. Live requires confirm:true.

#### `audit-powershell-logging`

- **Title:** Audit PowerShell logging
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** ScriptBlockLogging disabled; Transcription off
- **What it does:** Reads whether Windows records PowerShell script blocks. It does not dump script history.
- **Why it scores:** Script-block logging off is a Windows logging finding, and it also blinds your own notes.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Check Module Logging, Script Block Logging, and Transcription. Enabling these is kosher evidence collection on the local image.

#### `disable-autoplay`

- **Title:** Disable Autoplay
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates setting NoDriveTypeAutoRun=0xFF
- **What it does:** Stops Windows from auto-running programs when a disk or USB stick is plugged in.
- **Why it scores:** AutoPlay is a standard checkbox finding and a way for a planted file to launch itself.
- **What it changes:** Creates HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer if needed and sets NoDriveTypeAutoRun to 255 (all drive types).
- **How to undo:** If a backup was made, restore from %ProgramData%\CyberPatriotOps\backups\<ts>\. Delete the NoDriveTypeAutoRun value, or set it back to the previous number, if the README required AutoPlay.

Disable Autoplay/Autorun via registry (NoDriveTypeAutoRun). Standard CP Windows hardening. Live requires confirm:true.

#### `check-bitlocker-status`

- **Title:** Check BitLocker status
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** C: Protection Off; no recovery key material in the result
- **What it does:** Reports whether BitLocker disk encryption is on for each drive. Recovery keys are not shown.
- **Why it scores:** Some images score encryption. Either way, you need the on/off state without copying recovery keys into notes.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Report BitLocker protection status per volume. Informational; CP scoring may or may not require encryption. Does not export recovery keys.

#### `audit-iis`

- **Title:** IIS feature inventory + anonymous auth
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** IIS-WebServer installed; anonymousAuthentication enabled; directoryBrowse enabled; IIS samples present
- **What it does:** Lists IIS web features and whether anonymous browsing or sample sites are on. It does not request pages from another computer.
- **Why it scores:** IIS with anonymous auth and directory browsing is a Windows web finding when the README does not need a public site.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Inventory IIS optional features and flag anonymous authentication, directory browsing, ASP classic, and sample applications. Local Windows image only. Does not dump site content or attack other hosts.

#### `apply-security-template`

- **Title:** Apply local security template
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `templatePath` (string), `dryRun` (boolean)
- **Demo fixture:** Simulates secedit import of cp-baseline.inf: min length 14, lockout 5, audit Success+Failure, Guest off
- **What it does:** Applies the local security template (password, lockout, and Guest settings) from a secedit .inf file.
- **Why it scores:** One template covers the Windows password policy, lockout, and Guest items the baseline file lists.
- **What it changes:** Runs secedit /configure against the template (default config/windows/cp-baseline.inf) into a temporary security database, which writes those policy settings.
- **How to undo:** If a backup was made, restore from %ProgramData%\CyberPatriotOps\backups\<ts>\. Re-import the previous .inf if you saved one. Otherwise put password length, lockout, and Guest back by hand from the backup copy of the security policy.

Import a secedit .inf (or LGPO-style) baseline for password, lockout, audit, and security options on the local Windows image. Defaults to config/windows/cp-baseline.inf. dryRun reports what secedit would configure. Live requires confirm:true. Does not talk to other hosts or the CCS. Authorized-image hardening only: never used against other teams, scoring endpoints, or off-image hosts.

#### `disable-remote-registry`

- **Title:** Disable Remote Registry
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates RemoteRegistry stopped and StartupType Disabled
- **What it does:** Stops Remote Registry and sets it not to start, so other computers cannot edit this registry.
- **Why it scores:** Workstations do not need Remote Registry. Leaving it on is a standard service finding.
- **What it changes:** Stop-Service RemoteRegistry and Set-Service RemoteRegistry -StartupType Disabled.
- **How to undo:** If a backup was made, restore from %ProgramData%\CyberPatriotOps\backups\<ts>\. Set-Service RemoteRegistry -StartupType Manual only if the README says remote registry administration is required.

Stop and disable the RemoteRegistry service on the local Windows image. Remote Registry is a common CP plant and is not needed on a workstation. Live requires confirm:true. dryRun reports current start type.

#### `disable-remote-assistance`

- **Title:** Disable Remote Assistance
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates fAllowToGetHelp=0 and fAllowFullControl=0
- **What it does:** Turns off Remote Assistance so nobody can request or take help-desk control of the desktop.
- **Why it scores:** Remote Assistance is a second remote-control path beside Remote Desktop, and it is usually prohibited.
- **What it changes:** Sets fAllowToGetHelp and fAllowFullControl to 0 under HKLM\SYSTEM\CurrentControlSet\Control\Remote Assistance.
- **How to undo:** If a backup was made, restore from %ProgramData%\CyberPatriotOps\backups\<ts>\. Set fAllowToGetHelp back to 1 only if the README requires Remote Assistance.

Set fAllowToGetHelp=0 and fAllowFullControl=0 under HKLM Remote Assistance so the local image will not offer Remote Assistance. Live requires confirm:true. Complements disable-rdp; does not attack other hosts.

#### `disable-optional-windows-features`

- **Title:** Disable optional Windows features
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `featuresPath` (string), `dryRun` (boolean)
- **Demo fixture:** Simulates disabling TelnetClient, TFTP, SMB1Protocol, SimpleTCP; reboot pending noted
- **What it does:** Turns off optional Windows features such as the Telnet client, TFTP, and SMBv1, from config/windows/optional-features.txt.
- **Why it scores:** Optional features like Telnet and SMBv1 are installed plants. Disabling the feature removes the program, not just the service.
- **What it changes:** Runs Disable-WindowsOptionalFeature -Online -NoRestart for each name in the features file (or TelnetClient, TelnetServer, TFTP, SMB1Protocol, and SimpleTCP if the file is missing).
- **How to undo:** If a backup was made, restore from %ProgramData%\CyberPatriotOps\backups\<ts>\. Enable-WindowsOptionalFeature for a single feature only if the README requires that feature.

Bulk-disable optional features listed in config/windows/optional-features.txt (Telnet, TFTP, SMB1Protocol extras, SimpleTCP, IIS-FTP*). Complements disable-telnet / disable-smbv1. Live requires confirm:true. NoRestart — reboot is a separate admin choice.

#### `run-sfc-scan`

- **Title:** Run system file integrity check
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** Demo: sfc /verifyonly found 2 integrity violations (hosts.dll plant, notepad.exe hash mismatch) — report only, no repair
- **What it does:** Runs sfc /verifyonly, which checks Windows system files and does not repair them. It does not dump WinSxS.
- **Why it scores:** Corrupt or replaced system files are a Windows integrity finding. Verify-only tells you without changing the files.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Run sfc /verifyonly on the local Windows image and report integrity results. Read-only (does not repair). Does not dump WinSxS payloads. Pair with apply-security-updates if component store repair is needed later.

#### `harden-print-spooler`

- **Title:** Harden Print Spooler / disable remote print
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates PointAndPrint restrict + remote RPC endpoint disabled; Spooler left running for local print
- **What it does:** Stops remote printer-driver installs and remote spooler access. Local printing can stay.
- **Why it scores:** Remote printer driver install is a known Windows hole (PrintNightmare-class). Scoring wants it limited to administrators.
- **What it changes:** Sets RestrictDriverInstallationToAdministrators to 1, NoWarningNoElevationOnInstall to 0, and UpdatePromptSettings to 0 under PointAndPrint policy, and sets RegisterSpoolerRemoteRpcEndPoint to 2 with RPC privacy on.
- **How to undo:** If a backup was made, restore from %ProgramData%\CyberPatriotOps\backups\<ts>\. Delete those PointAndPrint and Printers policy values to return to the previous remote-print behavior.

Close PrintNightmare-class remote driver install: RestrictDriverInstallationToAdministrators, PointAndPrint no-warning elevation off, RegisterSpoolerRemoteRpcEndPoint disabled, RPC auth privacy on. Does not stop the local spooler unless the README says printing is unused. Live requires confirm:true. Authorized-image hardening only: never used against other teams, scoring endpoints, or off-image hosts.

#### `audit-lsa-protection`

- **Title:** Audit LSA protection / RunAsPPL
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** RunAsPPL=0, RunAsPPLBoot unset — LSA not protected
- **What it does:** Reads whether Windows runs LSA as a protected process (RunAsPPL). It does not touch LSASS or dump password hashes.
- **Why it scores:** Unprotected LSA is a credential-theft finding. You only need the on/off bit, never a hash dump.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Read RunAsPPL / RunAsPPLBoot (LSA as Protected Process Light). Unprotected LSA is a credential-theft finding on Windows CP images. Classification only — never dumps LSASS, hashes, or tickets.

#### `audit-credential-guard`

- **Title:** Audit Credential Guard / Device Guard
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** Credential Guard not running; ConfigurableTCB off; no secret material in the result
- **What it does:** Reports whether Credential Guard / virtualization-based security is running. Isolated secrets are not dumped.
- **Why it scores:** Some Windows images score Credential Guard. Knowing it is off tells you whether the README wants it enabled.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Read Win32_DeviceGuard / Device Guard and Credential Guard security services running. Informational: some images score VBS/CG, others only want the state known. Does not dump isolated secrets or recovery keys.

#### `audit-secure-boot`

- **Title:** Audit Secure Boot / UEFI
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** SecureBoot=false, SetupMode=true on the demo fixture
- **What it does:** Reads Secure Boot and UEFI status. It does not change firmware.
- **Why it scores:** Secure Boot off is a firmware finding on images that shipped with it. This check only reports the state.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Report Secure Boot and SetupMode via Confirm-SecureBootUEFI. Off or Setup Mode is a firmware finding. Read-only; does not enroll keys or dump PK/KEK material.

#### `audit-wifi-profiles`

- **Title:** Audit leftover Wi-Fi profiles
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** Open SSID 'CP-GUEST'; leftover WPA2 'HomeRouter' (key omitted); one enterprise profile ok
- **What it does:** Lists saved Wi-Fi profile names. It does not print the Wi-Fi password or PSK (the pre-shared key).
- **Why it scores:** Leftover Wi-Fi profiles from another network are clutter and sometimes a finding. Keys must never land in the output.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Inventory saved WLAN profiles (SSID + auth type only). Flags Open networks and leftover contest/home SSIDs. Never prints PSKs, EAP passwords, or `key=clear` material.

#### `harden-powershell-constrained`

- **Title:** Harden PowerShell logging / Constrained Language
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `constrainedLanguage` (boolean), `dryRun` (boolean)
- **Demo fixture:** Simulates ScriptBlockLogging+ModuleLogging+Transcription on; LanguageMode FullLanguage unless constrainedLanguage
- **What it does:** Turns on PowerShell script-block logging, module logging, and local transcripts.
- **Why it scores:** Those three logs are the Windows PowerShell finding. Transcripts stay on this computer.
- **What it changes:** Sets EnableScriptBlockLogging, EnableModuleLogging, and EnableTranscripting to 1 under HKLM\SOFTWARE\Policies\Microsoft\Windows\PowerShell, and writes transcripts to C:\ProgramData\cp-ops\ps-transcripts. The live script does not switch on Constrained Language Mode.
- **How to undo:** If a backup was made, restore from %ProgramData%\CyberPatriotOps\backups\<ts>\. Set those three Enable values back to 0 and remove the transcript folder if you do not want the logs. Do not delete the Security log.

Enable Script Block Logging, Module Logging, and local Transcription (deepens audit-powershell-logging). Optional constrainedLanguage=true sets Constrained Language Mode. Transcription path is local only — never a remote share. Live requires confirm:true.

#### `disable-smb-client-v1`

- **Title:** Disable SMBv1 client leftovers
- **Platforms:** windows
- **Risk:** mutate
- **Params:** `dryRun` (boolean)
- **Demo fixture:** Simulates Set-SmbClientConfiguration EnableSMB1Protocol=false and mrxsmb10 disabled
- **What it does:** Turns off the SMBv1 client so this computer does not speak the old sharing dialect.
- **Why it scores:** Disabling the server feature is not enough if the client driver is still allowed to use SMBv1.
- **What it changes:** Sets the SMB client EnableSMB1Protocol to false, disables the SMB1Protocol optional feature, and disables the mrxsmb10 service.
- **How to undo:** If a backup was made, restore from %ProgramData%\CyberPatriotOps\backups\<ts>\. Turn the client dialect back on only if the README requires SMBv1: Set-SmbClientConfiguration -EnableSMB1Protocol $true. That is rare.

Turn off leftover SMBv1 *client* knobs (EnableSMB1Protocol on the workstation, mrxsmb10, SMB1Protocol feature) after disable-smbv1 covers the server/optional-feature path. Live requires confirm:true. Does not scan other hosts.

#### `audit-windows-roles`

- **Title:** Audit Windows Server roles
- **Platforms:** windows
- **Risk:** read
- **Params:** none
- **Demo fixture:** AD-Domain-Services Installed (unexpected); DNS Installed; DHCP Installed; IIS present
- **What it does:** Lists installed Windows roles such as Active Directory, DNS, DHCP, and IIS. It does not promote or demote a domain.
- **Why it scores:** A workstation image should not be a surprise domain controller or DHCP server. Extra roles are findings.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Inventory Windows Server roles/features (DNS, DHCP, AD-DS/AD-LDS, IIS extras) when ServerManager is present. Read-only harden suggestions: unexpected directory/DNS/DHCP roles on a workstation image. Does not promote/demote a domain or attack other DCs.

### evidence

#### `export-evidence-bundle`

- **Title:** Export evidence bundle
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** Bundle with checksums, counts, top findings, and a generated notes.md snippet
- **What it does:** Builds a redacted snapshot of users, services, and ports for the team. Password hashes and private keys are left out.
- **Why it scores:** You need a shareable record of what you found. This stays on the image and does not talk to the scoring server.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Assemble a redacted evidence pack: user inventory (no hashes), listeners, services, firewall state, checksums of sshd_config/sudoers/hosts. For forensics write-ups and team notes. Never copies shadow hashes, private keys, .ssh identities, or off-image data. Sabbath-coffee maximalism: one-click evidence, still inside the rules.

#### `package-forensics-evidence`

- **Title:** Package redacted forensics evidence
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** Expanded bundle with persistence, share ACLs, perm drift, and notes.md snippet
- **What it does:** Packs a redacted forensics snapshot (account inventory and a note that hashes and private keys are omitted).
- **Why it scores:** Forensics answers need evidence you can hand to a teammate without leaking password hashes.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Deeper redacted forensics packager: user/service/port inventories, persistence hints, share ACLs, critical permission drift, and config checksums. Never copies shadow hashes, SAM contents, private keys, or off-image data. For authorized-image write-ups only.

#### `one-click-hardening-checklist`

- **Title:** One-click hardening checklist
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** 12 checklist rows with pass/fail/warn derived from the same demo fixtures
- **What it does:** Runs a short local checklist (for example Guest off and UAC on) and points each miss at the op that fixes it.
- **Why it scores:** It is a huddle list, not a score. It shows the highest remaining items without changing the computer.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Read-only checklist covering users, admins, guest, password policy, firewall, telnet/ftp, listening ports, prohibited software, media files, and SSH/UAC. Each row points at the mutate op to fix it. Does not change the image — pair with confirm:true on the fix ops. Creative automation within CP policy, not a scoring-server cheat.

#### `score-image-heuristics`

- **Title:** Score image heuristics
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** Overall 78/100 remaining work; top drivers: UID 0 toor, port 31337, telnet, empty Guest password
- **What it does:** Ranks the noisiest account findings into a remaining-work index. It is not the official score and it never contacts the scoring server.
- **Why it scores:** Use it to see what is still open after the obvious fixes. Do not chase the number instead of the README.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Aggregate suspicion scores across users, services, ports, and files into a 0–100 remaining-work index (higher = more to harden). A dashboard headline number with drill-down findings. Heuristic only — not the official CCS score.

#### `find-backdoor-binaries`

- **Title:** Find suspicious binaries
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** /tmp/nc, /home/flag/.hidden_shell, /usr/local/bin/ncat, process on :31337
- **What it does:** Looks for leftover attack tools such as nc.exe or ncat under temp and user folders. It does not run them.
- **Why it scores:** A netcat binary in temp is a backdoor left behind. Inventory it before anyone deletes the only copy a question names.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Heuristic filenames and locations: nc, netcat, ncat, socat in /tmp /home /opt; suid copies of bash; meterpreter-like names; 31337 listeners' process binaries. Does not include exploit payloads or attack other hosts.

#### `scoreboard-preflight`

- **Title:** Scoreboard preflight checklist
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** 8 preflight rows; firewall/guest/telnet fail; note that CCS is not queried
- **What it does:** Runs a local checklist before you worry about points. It never contacts the scoring server.
- **Why it scores:** It catches the obvious misses (accounts, firewall, services) while you can still fix them in order.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Pre-competition local checklist: firewall, guest, time sync, logging, no telnet, allowlist users, expected ports. Explicitly does not contact the CCS scoring server, other teams, or the internet beyond the image's configured update/time sources. Pair failing rows with confirm:true mutate ops.

#### `post-harden-checklist`

- **Title:** Post-harden verification checklist
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** 10 post-harden rows still failing on the unhardened demo image
- **What it does:** Re-reads the image after your changes and reports what is still open. It does not apply fixes again.
- **Why it scores:** Use it at the end so a fix you thought landed is actually visible, without a second round of surprise changes.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

After-action verification on the authorized image: password policy, SSH/UAC, extra UID 0, empty/never-expire passwords, media, prohibited software, default-deny firewall, remote-access tools. Read-only — does not re-apply hardening. Each fail points at the mutate op.

#### `skim-forensics-readme`

- **Title:** Skim local README for forensics keywords
- **Platforms:** both
- **Risk:** read
- **Params:** `searchRoot` (string), `keywordsPath` (string)
- **Demo fixture:** Hits: README Desktop 'forensics question 1 media', /home/alice/README.txt 'unauthorized ftp'; CCS not contacted
- **What it does:** Searches local README and question files for forensics keywords. It never opens a web page and never contacts the scoring server.
- **Why it scores:** Forensics questions are answered before you change anything, because a later cleanup can delete the only copy of the answer.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

Keyword-skim local README/forensics/question text files (Desktop, homes, /root, optional searchRoot). Helps answer forensics questions from files *on the image*. Never contacts the CCS scoring server, other teams, or the internet. Hash-looking lines are skipped; passwords in files are not copied wholesale. Authorized-image hardening only: never used against other teams, scoring endpoints, or off-image hosts.

#### `round-start-wizard`

- **Title:** Round-start wizard
- **Platforms:** both
- **Risk:** read
- **Params:** none
- **Demo fixture:** 6 sequenced steps; forensics/users/firewall/prohibited fail on the unhardened demo image; CCS not contacted
- **What it does:** Prints the suggested order for the round: forensics, users, passwords, firewall, updates, then prohibited software. It changes nothing.
- **Why it scores:** A shared order stops the team from deleting evidence or locking a required user in the first five minutes.
- **What it changes:** Nothing - read-only audit
- **How to undo:** Nothing to undo

One-click sequenced guide for the first minutes of a round: forensics skim → user sync → password policy → firewall → updates → prohibited software. Read-only — it does not run the mutate ops. Each row points at the existing catalog op to open next. Not a CCS scrape and not a substitute for the README.

#### `export-coach-packet`

- **Title:** Export redacted coach packet ZIP
- **Platforms:** both
- **Risk:** read
- **Params:** `outputDir` (string)
- **Demo fixture:** ZIP listing SUMMARY.md + findings.json + inventories; redacted=true; ccsContacted=false; no secrets
- **What it does:** Writes a redacted zip a coach can read: a summary, empty findings list, and inventory placeholders. Hashes, Wi-Fi keys, and scoring-server addresses are not included.
- **Why it scores:** It does not score by itself. It lets you hand a teammate the picture of the image without leaking secrets.
- **What it changes:** Creates a folder and coach-packet.zip under the temp directory (Linux /tmp/cp-ops-coach-packet, Windows %TEMP%\cp-ops-coach-packet) or the outputDir you pass. Accounts, services, and policies are not modified.
- **How to undo:** Nothing to undo on system settings. Delete that folder if you do not want the zip left on disk.

Assemble a redacted handoff ZIP for a coach: SUMMARY.md, findings.json, user/service/port inventories (no hashes), checklist snapshot. Never includes shadow/SAM, private keys, Wi-Fi PSKs, cookies, or CCS URLs. Distinct from export-evidence-bundle: this is the coach-facing packet, still on-image only. Authorized-image hardening only: never used against other teams, scoring endpoints, or off-image hosts.


## Round playlists

Ordered lists of **existing** catalog ids. The dashboard Playlist panel runs them through the engine/API; live mutations still require `confirm: true`. No CCS.

### `linux-starter`

Linux starter — For a first-time Linux teammate in the opening 25–40 minutes: answer forensics, then accounts, passwords, firewall, updates, banned tools, insecure services, SSH, and logging.

| # | Op | Coach tip | Why now | How-to |
| --- | --- | --- | --- | --- |
| 1 | `skim-forensics-readme` | Copy forensics questions into Team notes before you change anything. | Questions first. A later delete can erase the only copy of an answer. | [how-to](./howto/skim-forensics-readme.md) |
| 2 | `list-users` | See who is on this box. Compare names to the image README. | You cannot judge extra accounts until you have the full list. | [how-to](./howto/list-users.md) |
| 3 | `select-unauthorized-users` | Paste the README user list into Allowlists, then see who is extra. | The allowlist is the README. Extras are the people to lock next. | [how-to](./howto/select-unauthorized-users.md) |
| 4 | `flag-suspicious-users` | Scores UID 0, never-logged-in, and allowlist misses. Read first. | A ranked list beats guessing which odd name is the plant. | [how-to](./howto/flag-suspicious-users.md) |
| 5 | `list-admin-users` | Who has sudo? Cross-check allowed-admins.txt. | Extra admins score even when the account itself is allowed. | [how-to](./howto/list-admin-users.md) |
| 6 | `disable-guest-account` | Guest is almost never authorized. Live mode asks before turning it off. | Guest is the usual blank-password door, before you touch password rules. | [how-to](./howto/disable-guest-account.md) |
| 7 | `audit-password-policy` | Check length and aging before you apply a policy. | Read the rules now that the obvious Guest account is handled. | [how-to](./howto/audit-password-policy.md) |
| 8 | `audit-firewall` | Is the host firewall even on? | See the current door policy before you flip it. | [how-to](./howto/audit-firewall.md) |
| 9 | `enable-firewall` | Turn it on. Live mode asks first. | Firewall off is an early, high-value finding. | [how-to](./howto/enable-firewall.md) |
| 10 | `apply-default-deny-inbound` | Block new inbound connections. Allow only README services after. | On is not enough if every new listener is still allowed in. | [how-to](./howto/apply-default-deny-inbound.md) |
| 11 | `check-pending-updates` | See which security patches are waiting. This does not install them. | Know the update gap before you spend the round on a long upgrade. | [how-to](./howto/check-pending-updates.md) |
| 12 | `find-prohibited-software` | Inventory nmap, hydra, and netcat. Removal is a separate confirm. | Banned tools score while they stay installed. List them before you delete. | [how-to](./howto/find-prohibited-software.md) |
| 13 | `audit-ftp-telnet` | See if Telnet or FTP is installed. This does not log in. | Clear-text remote login is the next service to turn off. | [how-to](./howto/audit-ftp-telnet.md) |
| 14 | `ssh-hardening-audit` | Read root login and blank passwords before harden-sshd. | SSH is the remote door you will keep. Read it before you edit it. | [how-to](./howto/ssh-hardening-audit.md) |
| 15 | `audit-logging` | Check that the box is actually recording events. | Logging is the record of every change you are about to make. | [how-to](./howto/audit-logging.md) |
| 16 | `scoreboard-preflight` | Local checklist only. This never talks to the scoring server. | One last local pass before the deeper fixes. | [how-to](./howto/scoreboard-preflight.md) |

### `windows-starter`

Windows starter — For a first-time Windows teammate in the opening 25–40 minutes: forensics, accounts, passwords, Guest and UAC, firewall, updates, banned tools, Remote Desktop, Defender, and logging.

| # | Op | Coach tip | Why now | How-to |
| --- | --- | --- | --- | --- |
| 1 | `skim-forensics-readme` | Copy forensics questions into Team notes before you change anything. | Questions first. Cleanup can delete the file an answer lives in. | [how-to](./howto/skim-forensics-readme.md) |
| 2 | `list-users` | See who is on this box. Compare names to the image README. | Account points start with a complete local user list. | [how-to](./howto/list-users.md) |
| 3 | `select-unauthorized-users` | Paste the README user list into Allowlists, then see who is extra. | Extras against the allowlist are the disable list. | [how-to](./howto/select-unauthorized-users.md) |
| 4 | `flag-suspicious-users` | Scores Guest, extra admins, and allowlist misses. Read first. | Use the reasons column before you turn anyone off. | [how-to](./howto/flag-suspicious-users.md) |
| 5 | `list-admin-users` | Who is in Administrators? Cross-check allowed-admins.txt. | An allowed user with admin rights is still a finding. | [how-to](./howto/list-admin-users.md) |
| 6 | `disable-guest-account` | Guest is almost never authorized. Live mode asks before turning it off. | Guest is the usual no-password account, before you touch password rules. | [how-to](./howto/disable-guest-account.md) |
| 7 | `audit-password-policy` | Check length, lockout, and aging before you apply a template. | Read the policy now that Guest is off, before any template import. | [how-to](./howto/audit-password-policy.md) |
| 8 | `audit-uac` | UAC off is a high Windows finding. Read, then fix with a template. | The 'are you sure?' prompt should be on before you chase smaller items. | [how-to](./howto/audit-uac.md) |
| 9 | `audit-firewall` | Are Domain, Private, and Public profiles on? | See all three profiles before you enable them. | [how-to](./howto/audit-firewall.md) |
| 10 | `enable-firewall` | Turn all profiles on. Live mode asks first. | A firewall that is off is early points. | [how-to](./howto/enable-firewall.md) |
| 11 | `check-pending-updates` | See if Windows Update has patches waiting. This does not install them. | Updates are next, after the door is shut. | [how-to](./howto/check-pending-updates.md) |
| 12 | `find-prohibited-software` | Inventory banned tools. Removal is a separate confirm. | Hacking tools and games score until they are removed. | [how-to](./howto/find-prohibited-software.md) |
| 13 | `audit-ftp-telnet` | See if Telnet or FTP services are still installed. | Clear-text services are the insecure-service check before you disable them. | [how-to](./howto/audit-ftp-telnet.md) |
| 14 | `audit-rdp` | Is Remote Desktop on? Leave it if the README requires it. | Read Remote Desktop before the deep playlist turns it off. | [how-to](./howto/audit-rdp.md) |
| 15 | `enable-windows-defender` | Real-time protection should be on. Live mode asks first. | Built-in antivirus off is a standard Windows plant. | [how-to](./howto/enable-windows-defender.md) |
| 16 | `disable-autoplay` | AutoPlay is a classic plant. Live mode asks first. | Stop disks from launching programs by themselves. | [how-to](./howto/disable-autoplay.md) |
| 17 | `audit-logging` | Check that Windows is recording Security events. | You want a record before the deeper policy changes. | [how-to](./howto/audit-logging.md) |
| 18 | `scoreboard-preflight` | Local checklist only. This never talks to the scoring server. | Close the starter with a local remaining-work pass. | [how-to](./howto/scoreboard-preflight.md) |

### `linux-deep`

Linux deep — For the same Linux image after the starter, about 40–70 minutes: lockout, root and sudo, the password policy fix, updates, Telnet and FTP, SSH hardening, logs, then file and kernel hygiene.

| # | Op | Coach tip | Why now | How-to |
| --- | --- | --- | --- | --- |
| 1 | `round-start-wizard` | Huddle list if you skipped the starter. It changes nothing. | Confirm forensics and accounts are done before these writes. | [how-to](./howto/round-start-wizard.md) |
| 2 | `check-empty-passwords` | Flags blank passwords. It never prints hashes. | Blank passwords are the account hole the starter list did not classify. | [how-to](./howto/check-empty-passwords.md) |
| 3 | `audit-sudoers` | Look for NOPASSWD and sudoers files anyone can edit. | Admin rules are the next privilege check after the admin list. | [how-to](./howto/audit-sudoers.md) |
| 4 | `enable-account-lockout` | Lock out after repeated bad passwords. Live mode asks first. | Stop guessing once you know the password rules are weak. | [how-to](./howto/enable-account-lockout.md) |
| 5 | `audit-uid-zero` | Only root should be user id 0. Extra roots are backdoors. | A second root is more urgent than a normal extra user. | [how-to](./howto/audit-uid-zero.md) |
| 6 | `lock-root-account` | Lock the root password. sudo for README admins still works. | Direct root login should die after you know who has sudo. | [how-to](./howto/lock-root-account.md) |
| 7 | `enforce-password-policy` | Length 14, history, aging. Does not change existing hashes. | Apply the policy you already audited in the starter. | [how-to](./howto/enforce-password-policy.md) |
| 8 | `apply-security-updates` | Install distro updates. Live mode asks first. | Install the patches the starter only listed. | [how-to](./howto/apply-security-updates.md) |
| 9 | `enable-unattended-upgrades` | Turn on daily security updates. Live mode asks first. | The next patch should arrive without a person at the keyboard. | [how-to](./howto/enable-unattended-upgrades.md) |
| 10 | `find-media-files` | Find music and video. Do not delete until questions are answered. | Media is prohibited, but forensics may name the file. | [how-to](./howto/find-media-files.md) |
| 11 | `remove-games-samples` | Remove games named in the games list. Live mode asks first. | Sample games are the prohibited-software fix after the inventory. | [how-to](./howto/remove-games-samples.md) |
| 12 | `disable-telnet` | Stop the Telnet service. Live mode asks first. | Telnet was the insecure service the starter only detected. | [how-to](./howto/disable-telnet.md) |
| 13 | `disable-legacy-r-services` | Stop rsh. Live mode asks first. Repeat for rlogin if it exists. | Old remote shells are the same class of hole as Telnet. | [how-to](./howto/disable-legacy-r-services.md) |
| 14 | `audit-anonymous-ftp` | Read anonymous FTP settings. This is not a login test. | See the FTP knobs before you rewrite them. | [how-to](./howto/audit-anonymous-ftp.md) |
| 15 | `harden-vsftpd` | Turn anonymous FTP off. Live mode asks first. | Anonymous upload is the FTP fix. | [how-to](./howto/harden-vsftpd.md) |
| 16 | `harden-sshd` | No root login, no blank passwords. Live mode asks first. | Apply the SSH settings the starter audit already showed. | [how-to](./howto/harden-sshd.md) |
| 17 | `disable-root-ssh` | Second lock on root SSH after the drop-in file. | Belt and suspenders on the remote root door. | [how-to](./howto/disable-root-ssh.md) |
| 18 | `check-auditd` | Is the Linux audit daemon recording? | Deeper logging after the starter's basic log check. | [how-to](./howto/check-auditd.md) |
| 19 | `find-suid-sgid` | SUID copies under /tmp and home folders are critical. | File hygiene starts with programs that run as root. | [how-to](./howto/find-suid-sgid.md) |
| 20 | `find-world-writable` | World-writable cron, sudoers, or PATH directories. | Anyone-can-edit files are the next permission pass. | [how-to](./howto/find-world-writable.md) |
| 21 | `audit-cron` | Look for download-and-run lines in scheduled jobs. | Scheduled jobs keep running after you lock the user. | [how-to](./howto/audit-cron.md) |
| 22 | `restrict-cron-at` | Allow only root to add cron and at jobs. | Stop planted users from scheduling the next command. | [how-to](./howto/restrict-cron-at.md) |
| 23 | `hunt-shell-backdoors` | Alias hijacks in profile files. Do not run those files. | Startup shell files are persistence after cron. | [how-to](./howto/hunt-shell-backdoors.md) |
| 24 | `harden-sysctl` | No forwarding, SYN cookies, reverse-path filter. Asks first. | Kernel network switches are the deep network pass. | [how-to](./howto/harden-sysctl.md) |
| 25 | `post-harden-checklist` | Re-check the image. Read-only. It will not re-apply. | Prove the fixes stuck before you call the image done. | [how-to](./howto/post-harden-checklist.md) |

### `windows-deep`

Windows deep — For the same Windows image after the starter, about 40–70 minutes: security template, firewall profile, updates, insecure services, Remote Desktop, audit policy, IIS, then a verify-only system-file check.

| # | Op | Coach tip | Why now | How-to |
| --- | --- | --- | --- | --- |
| 1 | `round-start-wizard` | Huddle list if you skipped the starter. It changes nothing. | Do not import a template until forensics and accounts are done. | [how-to](./howto/round-start-wizard.md) |
| 2 | `apply-security-template` | Import the baseline template (password, lockout, Guest). Dry-run first. | This is the password and lockout fix the starter only read. | [how-to](./howto/apply-security-template.md) |
| 3 | `enable-account-lockout` | Five bad guesses then a short lock. Live mode asks first. | Lockout belongs with the password policy, before service cleanup. | [how-to](./howto/enable-account-lockout.md) |
| 4 | `import-firewall-profile` | Profiles on, inbound blocked. Add README ports after. | A known-good firewall policy is the deeper firewall pass. | [how-to](./howto/import-firewall-profile.md) |
| 5 | `apply-security-updates` | Start Windows Update on the image. Live mode asks first. | Install what the starter only reported as pending. | [how-to](./howto/apply-security-updates.md) |
| 6 | `remove-games-samples` | Remove built-in games and sample apps. Live mode asks first. | Games are the prohibited-software removal after the inventory. | [how-to](./howto/remove-games-samples.md) |
| 7 | `disable-rdp` | Turn Remote Desktop off unless the README needs it. | The starter only read Remote Desktop. This is the fix. | [how-to](./howto/disable-rdp.md) |
| 8 | `disable-smbv1` | Turn off old SMB sharing. Live mode asks first. | SMBv1 is the unsafe file-sharing dialect. | [how-to](./howto/disable-smbv1.md) |
| 9 | `disable-smb-client-v1` | Turn off the SMBv1 client too. | The client dialect can stay on after the server feature is gone. | [how-to](./howto/disable-smb-client-v1.md) |
| 10 | `disable-optional-windows-features` | Telnet, TFTP, and SMB1 extras from the features list. | Optional features are how those insecure services got installed. | [how-to](./howto/disable-optional-windows-features.md) |
| 11 | `disable-llmnr-netbios-wpad` | Turn off name-guessing shortcuts. | Local name spoofing is the next network plant. | [how-to](./howto/disable-llmnr-netbios-wpad.md) |
| 12 | `disable-remote-registry` | Workstations do not need Remote Registry. | Remote Registry is an insecure management service. | [how-to](./howto/disable-remote-registry.md) |
| 13 | `disable-remote-assistance` | Stop help-desk remote control of the desktop. | It is a second remote path beside Remote Desktop. | [how-to](./howto/disable-remote-assistance.md) |
| 14 | `audit-null-session` | Can anonymous users list accounts? No dumps. | Read anonymous access before you harden it. | [how-to](./howto/audit-null-session.md) |
| 15 | `harden-null-session` | Block anonymous account listing. Live mode asks first. | This is the null-session fix. | [how-to](./howto/harden-null-session.md) |
| 16 | `enable-audit-policy` | Record success and failure. This is not a log dump. | Audit policy is the logging fix after services are quiet. | [how-to](./howto/enable-audit-policy.md) |
| 17 | `audit-iis` | Anonymous sites and samples. Local inventory only. | Web role findings come after the remote-access holes. | [how-to](./howto/audit-iis.md) |
| 18 | `run-sfc-scan` | sfc /verifyonly. Report only, no repair. | System-file integrity is a late check and does not rewrite files. | [how-to](./howto/run-sfc-scan.md) |
| 19 | `post-harden-checklist` | Re-check the image. Read-only. It will not re-apply. | Confirm the template and service changes are still in effect. | [how-to](./howto/post-harden-checklist.md) |

### `forensics-first`

Forensics first — For whoever is answering questions, the first 15–30 minutes, before anyone changes the image: read local notes, then collect evidence without deleting it.

| # | Op | Coach tip | Why now | How-to |
| --- | --- | --- | --- | --- |
| 1 | `skim-forensics-readme` | Keyword-skim local README files. Never contacts the scoring server. | Write the questions down before any other step deletes a file. | [how-to](./howto/skim-forensics-readme.md) |
| 2 | `list-users` | Account inventory for the write-up. Hashes are never listed. | Many questions name a user. Capture the list while it is intact. | [how-to](./howto/list-users.md) |
| 3 | `hunt-sysprep-leftovers` | Find unattend and sysprep files. Password values are never printed. | Answer files often hold the original secret. Find them before cleanup. | [how-to](./howto/hunt-sysprep-leftovers.md) |
| 4 | `audit-hosts-file` | Look for update or antivirus names sent to a dead address. | A hosts sinkhole is both a finding and a clue. | [how-to](./howto/audit-hosts-file.md) |
| 5 | `find-media-files` | Music and video under home folders. Snapshot before anyone deletes. | Questions often name a song or video. Record the path first. | [how-to](./howto/find-media-files.md) |
| 6 | `find-hidden-executables` | Hidden programs under homes, temp, and Startup. | Hidden files are easy to miss and easy to delete too soon. | [how-to](./howto/find-hidden-executables.md) |
| 7 | `find-backdoor-binaries` | Netcat and similar tools. Inventory only. Do not run them. | A tool in temp may be the subject of a question. | [how-to](./howto/find-backdoor-binaries.md) |
| 8 | `hunt-shell-backdoors` | Alias hijacks and profile plants. Do not execute the files. | Startup scripts can hide the answer and a backdoor together. | [how-to](./howto/hunt-shell-backdoors.md) |
| 9 | `audit-startup-items` | Boot scripts, Run keys, and the Startup folder. | What runs at logon is part of the persistence story. | [how-to](./howto/audit-startup-items.md) |
| 10 | `package-forensics-evidence` | Redacted pack. No hashes or private keys. | Hand the notes to the team while the image is still unchanged. | [how-to](./howto/package-forensics-evidence.md) |
| 11 | `export-evidence-bundle` | One redacted bundle for the scratchpad. | A second export for the person writing the answers. | [how-to](./howto/export-evidence-bundle.md) |

