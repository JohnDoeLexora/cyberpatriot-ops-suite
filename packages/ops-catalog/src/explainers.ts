import type { OpExplain } from "./types.js";

/** Linux timestamped backups from lane cp-13. The folder exists only if that op made one. */
const LINUX_BACKUP = "/var/backups/cyberpatriot-ops/<ts>/";
/** Windows timestamped backups from lane cp-13. */
const WINDOWS_BACKUP = "%ProgramData%\\CyberPatriotOps\\backups\\<ts>\\";

const READ_CHANGES = "Nothing - read-only audit";
const READ_UNDO = "Nothing to undo";

function read(whatItDoes: string, whyItScores: string): OpExplain {
  return { whatItDoes, whyItScores, whatItChanges: READ_CHANGES, howToUndo: READ_UNDO };
}

function undo(platform: "linux" | "windows" | "both", concrete: string): string {
  const where =
    platform === "linux"
      ? `If a backup was made, restore from ${LINUX_BACKUP}.`
      : platform === "windows"
        ? `If a backup was made, restore from ${WINDOWS_BACKUP}.`
        : `If a backup was made, restore from ${LINUX_BACKUP} on Linux or ${WINDOWS_BACKUP} on Windows.`;
  return `${where} ${concrete}`;
}

function fix(
  platform: "linux" | "windows" | "both",
  whatItDoes: string,
  whyItScores: string,
  whatItChanges: string,
  concreteUndo: string,
): OpExplain {
  return {
    whatItDoes,
    whyItScores,
    whatItChanges,
    howToUndo: undo(platform, concreteUndo),
  };
}

/**
 * One card per catalog id. Wording follows the live engine scripts
 * (engines/linux/*.sh, engines/windows/lib/CpOps.psm1, and the Linux mutate helpers),
 * not the demo fixtures.
 */
export const EXPLAINERS: Record<string, OpExplain> = {
  "list-users": read(
    "Lists every local account: name, id number, home folder, login shell, groups, whether it is locked, and last login.",
    "Extra accounts, a second root, and missing README users are common score items, and you cannot fix an account you have not listed.",
  ),
  "flag-suspicious-users": read(
    "Scores local accounts for odd names, a user id of 0 (full admin) besides root, never having logged in, strange shells, and names missing from your allowlist.",
    "Planted accounts are often named like toor or hacker, or they have never logged in. A ranked list tells you whom to lock first.",
  ),
  "disable-user": fix(
    "both",
    "Turns an account off so it cannot log in, and leaves the home folder in place.",
    "Unauthorized people who can still log in are a standard deduction. Disabling is safer than deleting, because forensics questions may still need the home folder.",
    "On Linux it locks the password (usermod -L) and sets the shell to /usr/sbin/nologin. On Windows it runs Disable-LocalUser. The home folder is not deleted.",
    "On Linux run usermod -U and set the shell back (usually /bin/bash). On Windows run Enable-LocalUser. Do this only if the README says the person should exist.",
  ),
  "lock-user": fix(
    "both",
    "Locks the password so the account cannot sign in, without deleting the account.",
    "A locked planted account cannot be used, and the name stays visible for your write-up.",
    "On Linux it runs usermod -L (or passwd -l). On Windows it runs Disable-LocalUser for that name.",
    "On Linux run usermod -U or passwd -u for that name. On Windows run Enable-LocalUser. Only unlock someone the README allows.",
  ),
  "remove-user-from-admins": fix(
    "both",
    "Takes administrator rights away from one person and leaves the account itself turned on.",
    "Extra administrators are a high-value finding. A README user who should be a normal user needs demotion, not deletion.",
    "On Linux it runs gpasswd -d to drop the user from the sudo and wheel groups (the groups that can act as root). On Windows it runs Remove-LocalGroupMember on Administrators.",
    "Put them back only if the README lists them as an admin: Linux usermod -aG sudo (or wheel), Windows Add-LocalGroupMember Administrators.",
  ),
  "list-admin-users": read(
    "Lists who is in Administrators, sudo, or wheel, and any account whose user id is 0 (the same power as root).",
    "Every extra admin is points. Comparing this list to allowed-admins.txt shows who should not have that power.",
  ),
  "audit-uid-zero": read(
    "Finds every Linux account whose user id is 0. Only root should have that id.",
    "A second user id 0 is a hidden root account. Scoring treats it as a backdoor.",
  ),
  "check-empty-passwords": read(
    "Reports which accounts have a blank password, a locked password, or a real password. It never prints the password hash (the scrambled secret).",
    "A blank password means anyone can log in as that person. Guest and leftover accounts are often left this way.",
  ),
  "audit-never-logged-in": read(
    "Lists human accounts that have never signed in. Service accounts that cannot log in are skipped.",
    "A person who has never logged in is often a leftover or a planted account waiting to be used.",
  ),
  "check-user-shells": read(
    "Shows each account's login shell (the program that starts when they sign in).",
    "People should use a normal shell such as bash. A shell under /tmp, or a system account with a real shell, is a common plant.",
  ),
  "list-groups": read(
    "Lists local groups and who is in them, and highlights powerful groups such as sudo, wheel, Administrators, and Remote Desktop Users.",
    "Power often hides in a group membership the user list does not make obvious, such as docker or Administrators.",
  ),
  "disable-guest-account": fix(
    "both",
    "Turns off the Guest account so nobody can sign in with no real identity.",
    "Guest is almost never on the README, and a blank-password Guest is an easy score item.",
    "On Linux it locks the guest account and sets its shell to nologin. On Windows it runs Disable-LocalUser Guest.",
    "Turn Guest back on only if the README requires it: Linux usermod -U guest and a normal shell, Windows Enable-LocalUser Guest.",
  ),
  "audit-duplicate-uids": read(
    "Finds different usernames that share the same user id number.",
    "Two names with the same id, especially 0, share one identity. Logs and permissions cannot tell them apart.",
  ),
  "expire-user-password": fix(
    "both",
    "Makes one account choose a new password at the next login. The account stays enabled.",
    "README users sometimes still have the password printed in the setup notes. Forcing a change closes that without locking them out forever.",
    "On Linux it runs chage -d 0 for that username. On Windows it runs net user <name> /logonpasswordchg:yes.",
    "To clear the must-change flag, set a new password and a normal age: Linux chage -d today, Windows net user <name> /logonpasswordchg:no after they have a new password.",
  ),
  "audit-password-policy": read(
    "Reads the password rules: minimum length, how often passwords expire, and whether old passwords are remembered.",
    "Short passwords and passwords that never expire are reliable points on both Linux and Windows.",
  ),
  "enforce-password-policy": fix(
    "both",
    "Sets a stricter password rule: at least 14 characters, remember 5 old passwords, expire after 90 days, and wait 1 day before changing again.",
    "The score checks the policy itself. This does not rewrite anyone's current password hash.",
    "On Linux it edits /etc/login.defs (PASS_MAX_DAYS 90, PASS_MIN_DAYS 1, PASS_MIN_LEN 14, PASS_WARN_AGE 7) and writes /etc/security/pwquality.conf.d/99-cp.conf (minlen 14, mixed character classes, remember 5). On Windows it runs net accounts /minpwlen:14 /maxpwage:90 /minpwage:1 /uniquepw:5.",
    "Put the previous numbers back into login.defs and delete 99-cp.conf on Linux. On Windows rerun net accounts with the old lengths and ages.",
  ),
  "check-password-aging": read(
    "Reads how long each Linux password is allowed to live, without showing the password hash.",
    "A human whose password never expires (max days 99999 or -1) is a standard Linux finding.",
  ),
  "audit-pam": read(
    "Reads Linux sign-in rules in PAM (the plug-in stack that checks passwords) for blank-password permission, lockout, and password quality.",
    "nullok means a blank password is accepted. Missing lockout means guessing can go on forever.",
  ),
  "enable-account-lockout": fix(
    "both",
    "Locks an account after repeated bad passwords so guessing has to stop.",
    "Unlimited password guesses are a scored weakness. Five failures then a short lock is the usual bar.",
    "On Linux it writes /etc/security/faillock.conf (deny 5, fail_interval 900 seconds, unlock_time 600 seconds, even for root). You still need pam_faillock in the sign-in stack if it is not already there. On Windows it runs net accounts /lockoutthreshold:5 /lockoutduration:10 /lockoutwindow:10.",
    "Delete or restore /etc/security/faillock.conf on Linux. On Windows set the lockout threshold back with net accounts /lockoutthreshold:0 if the README wants no lockout.",
  ),
  "disable-root-ssh": fix(
    "linux",
    "Stops anyone from signing in as root over SSH (secure remote login).",
    "Root login over the network is a classic scored hole. People should use their own account and then sudo.",
    "Writes PermitRootLogin no to /etc/ssh/sshd_config.d/99-cp-noroot.conf and reloads the SSH service.",
    "Delete 99-cp-noroot.conf and reload ssh (or sshd). Only do that if the README requires root SSH.",
  ),
  "audit-sudoers": read(
    "Reads sudo rules (who can run commands as root) for NOPASSWD and for files anyone can edit.",
    "A sudo rule with no password, or a sudoers file anyone can change, is a free path to root.",
  ),
  "audit-uac": read(
    "Reads Windows User Account Control (the 'are you sure?' prompt before admin actions): EnableLUA and the consent prompt setting.",
    "UAC turned off lets any program act as administrator. Images often plant that in the registry.",
  ),
  "list-services": read(
    "Lists services (programs that stay running in the background) and whether each one is running.",
    "You need the inventory before you turn off Telnet, file sharing, or anything else the README did not ask for.",
  ),
  "flag-risky-services": read(
    "Highlights risky services that are still on, such as Telnet, FTP, Remote Desktop, Remote Registry, and SNMP.",
    "Those services are common scored holes. The list tells you which disable op to run next.",
  ),
  "disable-service": fix(
    "both",
    "Stops one service and sets it not to start on boot. It refuses services listed in config/required-services.txt unless you force it.",
    "Services the README does not need, such as Telnet or Remote Registry, cost points while they stay running.",
    "On Linux it runs systemctl disable --now for the unit you name. On Windows it runs Stop-Service and Set-Service -StartupType Disabled.",
    "Turn it back on only if the README needs it: Linux systemctl enable --now <service>, Windows Set-Service -StartupType Automatic and Start-Service.",
  ),
  "audit-ftp-telnet": read(
    "Checks whether FTP (plain file transfer) or Telnet (plain remote login) services are present. It does not try to log in.",
    "Telnet and FTP send passwords in the clear. They are almost never required, and they score when left on.",
  ),
  "disable-telnet": fix(
    "both",
    "Stops the Telnet server and sets it not to start again.",
    "Telnet has no encryption. Leaving the server running is a standard service finding.",
    "On Linux the live runner disables telnet.socket (or the service name you pass). On Windows it stops TlntSvr and sets its startup type to Disabled. This op does not add a firewall rule by itself.",
    "Re-enable only if the README requires Telnet: Linux systemctl enable --now telnet.socket, Windows Set-Service TlntSvr -StartupType Manual.",
  ),
  "disable-legacy-r-services": fix(
    "linux",
    "Stops the old rsh remote-shell service (commands sent with no real password check).",
    "rsh, rlogin, and rexec trust the network instead of a password. They do not belong on a competition image.",
    "The live runner runs systemctl disable --now on rsh.socket unless you pass a different service name. Run it again for rlogin.socket and rexec.socket if those units exist.",
    "systemctl enable --now the unit you disabled, and only if the README actually requires that remote shell.",
  ),
  "audit-smb": read(
    "Checks Windows file-sharing settings, including whether SMBv1 (an old, unsafe sharing dialect) is enabled. On Linux it is a read of the Samba picture the engine already collected.",
    "SMBv1 is scored even when newer file sharing is allowed to stay.",
  ),
  "audit-listening-ports": read(
    "Lists ports that are open and waiting for connections (TCP and UDP), with the program name when the system shows it.",
    "Unexpected listeners such as 23 (Telnet), 21 (FTP), or 3389 (Remote Desktop) are how you find services the process list hid.",
  ),
  "ssh-hardening-audit": read(
    "Reads the SSH server settings: root login, blank passwords, X11 forwarding, password login, protocol, and max tries.",
    "PermitRootLogin yes and PermitEmptyPasswords yes are direct point losses. Read them before you change sshd.",
  ),
  "harden-sshd": fix(
    "linux",
    "Applies a safer SSH server drop-in and reloads SSH so new logins follow it.",
    "The audit finds weak SSH settings. This writes the usual scored fixes: no root login, no blank passwords, fewer guesses.",
    "Writes /etc/ssh/sshd_config.d/99-cp-hardening.conf with PermitRootLogin no, PermitEmptyPasswords no, X11Forwarding no, MaxAuthTries 4, Protocol 2, LoginGraceTime 30, ClientAliveInterval 300, ClientAliveCountMax 2, then reloads ssh or sshd.",
    "Delete 99-cp-hardening.conf and reload ssh. Existing settings in sshd_config then apply again.",
  ),
  "audit-rdp": read(
    "Reads whether Windows Remote Desktop is allowed (fDenyTSConnections) and whether the Remote Desktop service is running.",
    "Remote Desktop should be off unless the README says a teammate must connect that way.",
  ),
  "disable-rdp": fix(
    "windows",
    "Turns Remote Desktop off and stops the Remote Desktop service.",
    "An open Remote Desktop port is a high Windows finding when the README does not ask for it.",
    "Sets HKLM\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server fDenyTSConnections to 1 and stops TermService.",
    "Set fDenyTSConnections back to 0 and start TermService only if the README requires Remote Desktop.",
  ),
  "audit-hosts-file": read(
    "Reads the hosts file (a local name-to-address list) for lines that send update or security sites to a dead address.",
    "A hosts line that sinks windowsupdate or an antivirus name blocks patches and is a planted finding.",
  ),
  "check-ntp": read(
    "Checks whether the clock is syncing (timedatectl or w32tm). It does not query outside time servers beyond what the local service already shows.",
    "A wrong clock makes logs useless and can fail update checks. Scoring often wants time sync on.",
  ),
  "audit-firewall": read(
    "Shows whether the host firewall is on. Linux reads ufw and iptables. Windows reads the Domain, Private, and Public profiles.",
    "A firewall that is off lets every service answer the network. Turning it on is usually one of the first fixes.",
  ),
  "enable-firewall": fix(
    "both",
    "Turns the host firewall on. It does not delete your existing allow rules.",
    "Firewall off is an early, high-value finding on both platforms.",
    "On Linux it runs ufw --force enable. On Windows it runs Set-NetFirewallProfile so Domain, Public, and Private are Enabled.",
    "Turn it off only if you must recover a locked-out service: Linux ufw disable, Windows Set-NetFirewallProfile -Enabled False. Then turn it back on once the README ports are allowed.",
  ),
  "list-firewall-rules": read(
    "Lists enabled firewall rules (name, direction, allow or block) so you can see what is already permitted.",
    "After you turn the firewall on you still need the rules to match the README, or you will block a scored service or leave a bad one open.",
  ),
  "apply-default-deny-inbound": fix(
    "both",
    "Sets the firewall to block incoming connections unless a rule allows them, and still allows outgoing traffic.",
    "Default-allow inbound means every new listener is exposed. Scoring wants new connections blocked until you allow the README ports.",
    "On Linux it runs ufw default deny incoming and ufw default allow outgoing. On Windows it sets DefaultInboundAction Block and DefaultOutboundAction Allow on the firewall profiles.",
    "Restore the previous default: Linux ufw default allow incoming if that was the old policy, Windows Set-NetFirewallProfile -DefaultInboundAction Allow. Then re-add only the README allows.",
  ),
  "find-world-writable": read(
    "Finds files and folders that any local user can change, especially cron, sudoers, and directories on the command PATH.",
    "A world-writable sudoers or cron file lets a normal user become root. That is a critical file finding.",
  ),
  "find-suid-sgid": read(
    "Finds SUID and SGID programs (they run as the file's owner, often root), especially copies under /tmp or home folders.",
    "A surprise SUID copy of a shell is a classic backdoor. Stock system SUID tools in /usr can stay.",
  ),
  "find-media-files": read(
    "Finds music and video files (mp3, mp4, and similar) under user folders. It does not delete them.",
    "Prohibited media is an easy file-finding. Delete only after you have answered any forensics question that names the file.",
  ),
  "audit-home-permissions": read(
    "Checks whether home folders are private to their owner instead of readable by everyone.",
    "A home folder open to every user leaks SSH keys and documents, and it is a standard permission finding.",
  ),
  "check-sensitive-file-perms": read(
    "Checks permissions on sensitive files such as shadow, sudoers, and SSH host keys. It does not print their contents.",
    "If anyone can read the shadow file or write sudoers, the password store and root access are exposed.",
  ),
  "audit-ssh-authorized-keys": read(
    "Lists SSH authorized_keys files (the public keys that can log in without a password) and flags unexpected ones. Private keys are not printed.",
    "An extra key in authorized_keys is a backdoor login that survives a password change.",
  ),
  "find-hidden-executables": read(
    "Looks for hidden programs (names starting with a dot, or odd executables) under home folders, temp, and the Windows Startup folder.",
    "Hidden executables are a common way a plant stays out of a normal directory listing.",
  ),
  "list-installed-packages": read(
    "Lists installed software (dpkg or Windows packages) so you can compare it to the README.",
    "You need the inventory before you remove a game, a hacking tool, or a sample app.",
  ),
  "find-prohibited-software": read(
    "Looks for known hacking and attack tools such as nmap, hydra, john, and netcat. It does not remove them.",
    "Those tools are prohibited on the image and score when they are installed. Removal is a separate confirmed step.",
  ),
  "remove-package": fix(
    "both",
    "Uninstalls one package you name. It refuses core packages such as openssh-server, sudo, bash, and systemd unless you force it.",
    "Banned tools and games stay installed until you remove them. This is the confirmed uninstall.",
    "On Linux it runs apt-get remove -y or dnf remove -y for that package name. On Windows it runs Uninstall-Package. Configuration files the package manager leaves behind may remain.",
    "Reinstall from the distro only if the README requires it: apt-get install or dnf install on Linux, Install-Package on Windows. Do not download a random installer.",
  ),
  "audit-logging": read(
    "Checks whether system logs are being kept. Windows reads Application, Security, and System log status. Linux reads the local logging setup.",
    "If logging is off you cannot prove what happened, and audit policy is itself a scored item.",
  ),
  "check-auditd": read(
    "Checks whether auditd (Linux's security audit daemon) is installed and running.",
    "auditd is how Linux records admin actions. Scoring often wants it on and recording.",
  ),
  "check-pending-updates": read(
    "Reports whether security updates are waiting. It does not install them and does not contact the scoring server.",
    "Missing patches are points. Know the list before you spend time on an upgrade.",
  ),
  "apply-security-updates": fix(
    "both",
    "Installs updates from the image's own package source. It does not target any other computer.",
    "Pending security updates are a direct score category once you know the README allows the network path to the local mirror.",
    "On Linux it runs apt-get update and apt-get upgrade -y, or dnf update. On Windows the live script does not download updates itself; it tells you to run Windows Update on the image.",
    "Package upgrades are not a single file to revert. If a backup was made, restore the packages from it, or reinstall the previous package versions from the distro cache. Do not uninstall a security update just to get the old vulnerable build back unless the image will not boot.",
  ),
  "audit-cron": read(
    "Reads Linux scheduled jobs in /etc/crontab and /etc/cron.d and shows a short snippet of each file.",
    "A cron line that downloads a script and runs it is a persistence plant. Jobs also keep running after you lock the user who added them.",
  ),
  "audit-at-jobs": read(
    "Lists one-shot at jobs (commands scheduled to run once).",
    "An at job is an easy place to hide a command that fires after you think the image is clean.",
  ),
  "list-scheduled-tasks": read(
    "Lists Windows scheduled tasks outside the built-in Microsoft folders.",
    "A non-Microsoft task that runs a script from a user folder is a persistence finding.",
  ),
  "audit-sysctl": read(
    "Reads Linux kernel network switches such as IP forwarding, ICMP redirects, and SYN cookies.",
    "Forwarding and accepting redirects turn the image into a router or a spoof target. Scoring wants those off on a workstation.",
  ),
  "harden-sysctl": fix(
    "linux",
    "Writes safer kernel network settings and applies them.",
    "This is the fix for the sysctl audit: no forwarding, no redirects, reverse-path filtering, and SYN cookies.",
    "Writes /etc/sysctl.d/99-cp-hardening.conf (ip_forward 0, send/accept redirects 0, accept_source_route 0, log_martians 1, rp_filter 1, tcp_syncookies 1, IPv6 accept_redirects 0, randomize_va_space 2, dmesg_restrict 1, kptr_restrict 2) and runs sysctl --system.",
    "Delete 99-cp-hardening.conf and run sysctl --system so the previous files apply again.",
  ),
  "audit-startup-items": read(
    "Lists programs that start at boot or logon: Linux rc files and Windows Run keys and Startup folders.",
    "Startup entries survive a reboot. A strange Run key is how a tool comes back after you close it.",
  ),
  "disable-smbv1": fix(
    "windows",
    "Turns off the old SMBv1 file-sharing feature. Newer SMB can stay.",
    "SMBv1 is unsafe and is scored even when the image still needs file sharing.",
    "Runs Disable-WindowsOptionalFeature for SMB1Protocol with no restart.",
    "Re-enable SMB1 only if a README you trust still requires it: Enable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol. That is rare.",
  ),
  "enable-windows-defender": fix(
    "windows",
    "Turns Microsoft Defender real-time protection back on. It does not install a third-party antivirus.",
    "Defender disabled is a common registry plant. The built-in antivirus should be watching.",
    "Runs Set-MpPreference -DisableRealtimeMonitoring $false.",
    "Do not turn real-time protection back off. If you must undo a bad preference change, restore the Defender policy from the backup folder.",
  ),
  "audit-powershell-logging": read(
    "Reads whether Windows records PowerShell script blocks. It does not dump script history.",
    "Script-block logging off is a Windows logging finding, and it also blinds your own notes.",
  ),
  "disable-autoplay": fix(
    "windows",
    "Stops Windows from auto-running programs when a disk or USB stick is plugged in.",
    "AutoPlay is a standard checkbox finding and a way for a planted file to launch itself.",
    "Creates HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer if needed and sets NoDriveTypeAutoRun to 255 (all drive types).",
    "Delete the NoDriveTypeAutoRun value, or set it back to the previous number, if the README required AutoPlay.",
  ),
  "check-bitlocker-status": read(
    "Reports whether BitLocker disk encryption is on for each drive. Recovery keys are not shown.",
    "Some images score encryption. Either way, you need the on/off state without copying recovery keys into notes.",
  ),
  "export-evidence-bundle": read(
    "Builds a redacted snapshot of users, services, and ports for the team. Password hashes and private keys are left out.",
    "You need a shareable record of what you found. This stays on the image and does not talk to the scoring server.",
  ),
  "package-forensics-evidence": read(
    "Packs a redacted forensics snapshot (account inventory and a note that hashes and private keys are omitted).",
    "Forensics answers need evidence you can hand to a teammate without leaking password hashes.",
  ),
  "one-click-hardening-checklist": read(
    "Runs a short local checklist (for example Guest off and UAC on) and points each miss at the op that fixes it.",
    "It is a huddle list, not a score. It shows the highest remaining items without changing the computer.",
  ),
  "score-image-heuristics": read(
    "Ranks the noisiest account findings into a remaining-work index. It is not the official score and it never contacts the scoring server.",
    "Use it to see what is still open after the obvious fixes. Do not chase the number instead of the README.",
  ),
  "find-backdoor-binaries": read(
    "Looks for leftover attack tools such as nc.exe or ncat under temp and user folders. It does not run them.",
    "A netcat binary in temp is a backdoor left behind. Inventory it before anyone deletes the only copy a question names.",
  ),
  "audit-shared-folders": read(
    "Lists file shares and flags ones that allow Guest or Everyone to write.",
    "An open share is a scored hole even when the firewall is on, because local users can still reach it.",
  ),
  "diff-expected-ports": read(
    "Compares listening ports to the expected-ports list and reports extras and missing scored services.",
    "An extra listener is something to shut. A missing expected port means you turned off a service the README still needs.",
  ),
  "audit-share-acls": read(
    "Lists each share's access list (who has which rights) and flags Everyone or Guest.",
    "Share permissions that include Everyone are a finding even if the folder's own permissions look tight.",
  ),
  "audit-persistence-deep": read(
    "Reads Run and RunOnce keys, the Startup folder, and non-Microsoft scheduled tasks in one pass.",
    "Persistence is spread across those places. One combined read is how you catch a tool that comes back after reboot.",
  ),
  "hunt-remote-access-tools": read(
    "Looks for remote-control programs such as TeamViewer, AnyDesk, VNC, and similar names in installed software.",
    "Unauthorized remote-access tools are prohibited and give someone else a console on the image.",
  ),
  "report-password-never-expires": read(
    "Flags accounts whose password never expires, and accounts with a blank password. Hashes are not printed.",
    "Never-expire plus a blank password is a paired finding. Policy and the account both need a look.",
  ),
  "audit-critical-perm-drift": read(
    "Re-checks permissions on critical files (via the same sensitive-file check, or the optional Bend file scan if it is installed).",
    "Permissions drift back when a package or a plant rewrites them. This is the second look after the first file audit.",
  ),
  "scoreboard-preflight": read(
    "Runs a local checklist before you worry about points. It never contacts the scoring server.",
    "It catches the obvious misses (accounts, firewall, services) while you can still fix them in order.",
  ),
  "post-harden-checklist": read(
    "Re-reads the image after your changes and reports what is still open. It does not apply fixes again.",
    "Use it at the end so a fix you thought landed is actually visible, without a second round of surprise changes.",
  ),
  "select-unauthorized-users": read(
    "Compares local accounts to config/allowed-users.txt and lists names that are not on that list.",
    "The allowlist is the README. Anyone not on it is the first disable candidate, after you confirm the file matches this image.",
  ),
  "audit-sticky-tmp": read(
    "Checks the sticky bit on /tmp and other temp folders (only the owner can delete their own files).",
    "Without the sticky bit, any user can delete another user's files in /tmp, including locks and sockets.",
  ),
  "audit-anonymous-ftp": read(
    "Reads vsftpd or ProFTPD settings for anonymous login and anonymous upload. It does not try to log in.",
    "Anonymous FTP, especially with upload, lets anyone drop files on the image. That is a high service finding.",
  ),
  "harden-vsftpd": fix(
    "linux",
    "Turns off anonymous and upload FTP in the vsftpd config, and stops vsftpd if it is not on the required-services list.",
    "Anonymous FTP is the finding. This writes the usual scored nos.",
    "Sets anonymous_enable, write_enable, anon_upload_enable, and anon_mkdir_write_enable to NO in /etc/vsftpd.conf or /etc/vsftpd/vsftpd.conf, reloads vsftpd, and disables the service unless config/required-services.txt lists vsftpd.",
    "Restore the previous vsftpd.conf from the backup. If the service was disabled and the README needs FTP, systemctl enable --now vsftpd after anonymous login stays NO.",
  ),
  "audit-web-server": read(
    "Reads Apache or nginx settings for risky options such as directory listing and default samples. It does not attack the site.",
    "A web server with directory listing or sample apps is a scored service finding when the image hosts a page.",
  ),
  "disable-llmnr-netbios-wpad": fix(
    "windows",
    "Turns off LLMNR, NetBIOS name replies, and WPAD (three ways Windows guesses names and proxy settings on the local network).",
    "Those name shortcuts are common plants and let a neighbor answer for a name you meant to look up.",
    "Sets EnableMulticast to 0 under DNSClient policy, sets each adapter's NetBIOS to disabled, sets AutoDetect to 0, sets DisableWpad to 1, and disables the WinHttpAutoProxySvc service.",
    "Remove those policy values and set WinHttpAutoProxySvc back to Manual only if the README requires WPAD or NetBIOS.",
  ),
  "audit-null-session": read(
    "Checks whether Windows still allows anonymous (null session) access to account names. It does not dump the account database.",
    "Anonymous listing of users is a scored Windows finding. The fix is a separate confirmed op.",
  ),
  "audit-idle-lock": read(
    "Reads whether the screen or shell locks after idle time (TMOUT and the login manager's idle action).",
    "A session that never locks lets the next person at the keyboard act as the signed-in user.",
  ),
  "hunt-sysprep-leftovers": read(
    "Finds leftover unattend.xml, sysprep, and kickstart files. Password values in those files are not printed.",
    "Setup answer files often still contain the original password. Find them before you delete them, and never paste the secret into notes.",
  ),
  "audit-snmp": read(
    "Checks whether SNMP (a simple device-management protocol) is running and whether a default community name is set. It does not guess passwords.",
    "SNMP with the community string public is an unauthenticated management port.",
  ),
  "audit-mac-enforcement": read(
    "Reports whether AppArmor or SELinux (Linux mandatory access control) is enforcing, or only complaining.",
    "A profile set to complain does not actually block a bad program. Scoring often wants enforcing mode.",
  ),
  "audit-browser-baseline": read(
    "Checks whether Firefox has a system policy file. Cookies, history, and saved passwords are not read.",
    "A missing browser baseline, or a planted homepage, is a later-round finding after accounts and the firewall.",
  ),
  "audit-auto-updates": read(
    "Reads whether automatic updates are turned on (Linux unattended-upgrades files, or the Windows Update channel).",
    "Auto-update off means the next patch never arrives. It is a scored updates finding.",
  ),
  "remove-games-samples": fix(
    "both",
    "Removes games and sample apps named in config/games-samples.txt, plus a short Windows list of built-in games.",
    "Games and sample content are prohibited software and an easy package finding.",
    "On Linux it apt-get removes packages from config/games-samples.txt that are actually installed. On Windows it Remove-AppxPackage for Xbox, Solitaire, Zune Music, and Candy Crush when those packages are present.",
    "Reinstall a package only if the README says it is required, using the distro or the Microsoft Store. Do not add a random game back.",
  ),
  "audit-iis": read(
    "Lists IIS web features and whether anonymous browsing or sample sites are on. It does not request pages from another computer.",
    "IIS with anonymous auth and directory browsing is a Windows web finding when the README does not need a public site.",
  ),
  "skim-forensics-readme": read(
    "Searches local README and question files for forensics keywords. It never opens a web page and never contacts the scoring server.",
    "Forensics questions are answered before you change anything, because a later cleanup can delete the only copy of the answer.",
  ),
  "apply-security-template": fix(
    "windows",
    "Applies the local security template (password, lockout, and Guest settings) from a secedit .inf file.",
    "One template covers the Windows password policy, lockout, and Guest items the baseline file lists.",
    "Runs secedit /configure against the template (default config/windows/cp-baseline.inf) into a temporary security database, which writes those policy settings.",
    "Re-import the previous .inf if you saved one. Otherwise put password length, lockout, and Guest back by hand from the backup copy of the security policy.",
  ),
  "import-firewall-profile": fix(
    "windows",
    "Imports a saved Windows firewall policy, or applies a known-good on-and-block-inbound profile when you do not pass a file.",
    "A known-good firewall policy turns profiles on and blocks inbound in one step, after which you add only README ports.",
    "If you pass a .wfw file it runs netsh advfirewall import. Otherwise it enables Domain, Public, and Private, sets inbound to Block, and sets outbound to Allow.",
    "Import the previous .wfw export if you have one. Otherwise set the inbound default back only for the moment you need, then return to Block.",
  ),
  "enable-audit-policy": fix(
    "windows",
    "Turns on success and failure auditing for the main Windows audit categories.",
    "Windows scoring wants logon, account, and policy changes recorded. This does not dump the Security log.",
    "Runs auditpol /set /success:enable /failure:enable for Account Logon, Account Management, Logon/Logoff, Policy Change, Privilege Use, and System.",
    "Set a category back with auditpol /set /category:<name> /success:disable /failure:disable only if the README forbids that category.",
  ),
  "disable-remote-registry": fix(
    "windows",
    "Stops Remote Registry and sets it not to start, so other computers cannot edit this registry.",
    "Workstations do not need Remote Registry. Leaving it on is a standard service finding.",
    "Stop-Service RemoteRegistry and Set-Service RemoteRegistry -StartupType Disabled.",
    "Set-Service RemoteRegistry -StartupType Manual only if the README says remote registry administration is required.",
  ),
  "disable-remote-assistance": fix(
    "windows",
    "Turns off Remote Assistance so nobody can request or take help-desk control of the desktop.",
    "Remote Assistance is a second remote-control path beside Remote Desktop, and it is usually prohibited.",
    "Sets fAllowToGetHelp and fAllowFullControl to 0 under HKLM\\SYSTEM\\CurrentControlSet\\Control\\Remote Assistance.",
    "Set fAllowToGetHelp back to 1 only if the README requires Remote Assistance.",
  ),
  "force-password-change": fix(
    "both",
    "Forces a password change at next logon for one account, or for every human on the allowlist if you do not name one.",
    "README users often still have the published starter password. Expiring it makes them set a new one.",
    "On Linux it runs chage -d 0. One username expires that account; with no username it expires each allowlisted human except root. On Windows it runs net user <name> /logonpasswordchg:yes for the named user or for allowlisted names other than built-in system accounts.",
    "After the person sets a new password, the flag clears itself. To cancel before they log in, set a real password and clear the flag (chage -d today, or net user /logonpasswordchg:no).",
  ),
  "sync-authorized-users": fix(
    "both",
    "Creates README users who are missing and adds README admins to the admin group. It does not invent passwords and it does not delete extras.",
    "Missing authorized users can score as badly as extra ones. This adds only names you already put on the allowlist.",
    "On Linux it runs useradd -m -s /bin/bash for missing allowlist names (no password is set) and usermod -aG sudo or wheel for names in allowed-admins.txt. On Windows it runs New-LocalUser -NoPassword for missing names and Add-LocalGroupMember Administrators for the admin list. You must set each new password yourself.",
    "Delete a user this op created only if they were not on the README: Linux userdel, Windows Remove-LocalUser. Remove an admin group membership with gpasswd -d or Remove-LocalGroupMember if you added the wrong name.",
  ),
  "disable-optional-windows-features": fix(
    "windows",
    "Turns off optional Windows features such as the Telnet client, TFTP, and SMBv1, from config/windows/optional-features.txt.",
    "Optional features like Telnet and SMBv1 are installed plants. Disabling the feature removes the program, not just the service.",
    "Runs Disable-WindowsOptionalFeature -Online -NoRestart for each name in the features file (or TelnetClient, TelnetServer, TFTP, SMB1Protocol, and SimpleTCP if the file is missing).",
    "Enable-WindowsOptionalFeature for a single feature only if the README requires that feature.",
  ),
  "run-sfc-scan": read(
    "Runs sfc /verifyonly, which checks Windows system files and does not repair them. It does not dump WinSxS.",
    "Corrupt or replaced system files are a Windows integrity finding. Verify-only tells you without changing the files.",
  ),
  "clear-suspicious-hosts": fix(
    "both",
    "Removes hosts-file lines that point update, antivirus, or common site names at 127.0.0.1, 0.0.0.0, or ::1. Localhost lines stay.",
    "Those sinkholes block Windows Update and security tools. They are a planted hosts finding.",
    "Rewrites /etc/hosts on Linux and %SystemRoot%\\System32\\drivers\\etc\\hosts on Windows, dropping only sinkhole lines whose names match update, antivirus, or major site names. Comments and other lines stay.",
    "Put a removed line back only if you are sure it was legitimate. The backup copy of the hosts file is the safe source.",
  ),
  "disable-display-manager-guest": fix(
    "linux",
    "Turns off the login-screen Guest session and automatic login.",
    "A greeter Guest session is a second Guest account. Autologin signs someone in with no password.",
    "Writes /etc/lightdm/lightdm.conf.d/99-cp-hardening.conf with allow-guest, greeter-allow-guest, and autologin-guest false and autologin-user empty. If GDM is installed it sets AutomaticLoginEnable=false in custom.conf.",
    "Delete the LightDM drop-in and restore the previous GDM custom.conf from the backup.",
  ),
  "lock-root-account": fix(
    "linux",
    "Locks the root password so nobody can sign in directly as root. sudo for authorized admins still works.",
    "A usable root password, especially a known one, is a scored account finding. Admins should use sudo.",
    "Runs passwd -l root.",
    "Unlock with passwd -u root only if the README says direct root login is required, then set a new password yourself.",
  ),
  "enable-fail2ban": fix(
    "linux",
    "Installs fail2ban from the distro package source and turns it on, so repeated login failures get blocked.",
    "Lockout at the SSH door stops password guessing even when the account policy is still loose.",
    "Runs apt-get install -y fail2ban or dnf install -y fail2ban, then systemctl enable --now fail2ban. It does not download a script from the internet.",
    "systemctl disable --now fail2ban, and apt-get remove fail2ban or dnf remove fail2ban if you need it gone.",
  ),
  "harden-host-conf": fix(
    "linux",
    "Sets the name-lookup order so the hosts file is checked first and spoofed replies are rejected.",
    "nospoof on stops a forged DNS answer from winning over the hosts file. It is a small Linux network hardening item.",
    "Overwrites /etc/host.conf with order hosts,bind, multi on, and nospoof on.",
    "Restore the previous /etc/host.conf from the backup (often order hosts,bind and multi on, without nospoof).",
  ),
  "set-ufw-logging": fix(
    "linux",
    "Turns firewall logging up and sets the default to deny incoming and allow outgoing.",
    "High logging is how you see blocked probes. The same command also locks in default-deny, which is the scored firewall stance.",
    "Runs ufw logging high, ufw default deny incoming, and ufw default allow outgoing.",
    "Set logging back with ufw logging low or medium. Change the default policy only if you saved the previous one in the backup.",
  ),
  "restrict-cron-at": fix(
    "linux",
    "Allows only root to add cron and at jobs.",
    "If every user can schedule a job, a planted account can keep a command running after you lock the password.",
    "Writes root as the only line in /etc/cron.allow and /etc/at.allow, sets those files to mode 600, and deletes /etc/cron.deny and /etc/at.deny.",
    "Restore the previous allow and deny files from the backup. If you need a README user to have cron, add that name to cron.allow.",
  ),
  "hunt-shell-backdoors": read(
    "Reads shell startup files for aliases that hijack sudo or ls, and for lines that download a script and run it. It does not execute those files.",
    "A bad alias or a profile line runs every time someone opens a terminal. That is a persistence plant.",
  ),
  "scan-malware-tools": fix(
    "linux",
    "With confirmation, installs clamav and chkrootkit from the distro and scans /home, /tmp, and /opt. Without confirmation it only reports that a scan was not started.",
    "A local malware scan can catch a planted binary the package list does not name. It stays on this computer.",
    "When confirmed it may apt-get or dnf install clamav and chkrootkit, then runs clamscan on /home, /tmp, and /opt and chkrootkit, and prints only a short infected-or-warning excerpt.",
    "Remove the tools if you do not want them left behind: apt-get remove clamav chkrootkit or dnf remove. The scan itself does not delete files.",
  ),
  "round-start-wizard": read(
    "Prints the suggested order for the round: forensics, users, passwords, firewall, updates, then prohibited software. It changes nothing.",
    "A shared order stops the team from deleting evidence or locking a required user in the first five minutes.",
  ),
  "harden-print-spooler": fix(
    "windows",
    "Stops remote printer-driver installs and remote spooler access. Local printing can stay.",
    "Remote printer driver install is a known Windows hole (PrintNightmare-class). Scoring wants it limited to administrators.",
    "Sets RestrictDriverInstallationToAdministrators to 1, NoWarningNoElevationOnInstall to 0, and UpdatePromptSettings to 0 under PointAndPrint policy, and sets RegisterSpoolerRemoteRpcEndPoint to 2 with RPC privacy on.",
    "Delete those PointAndPrint and Printers policy values to return to the previous remote-print behavior.",
  ),
  "audit-lsa-protection": read(
    "Reads whether Windows runs LSA as a protected process (RunAsPPL). It does not touch LSASS or dump password hashes.",
    "Unprotected LSA is a credential-theft finding. You only need the on/off bit, never a hash dump.",
  ),
  "audit-credential-guard": read(
    "Reports whether Credential Guard / virtualization-based security is running. Isolated secrets are not dumped.",
    "Some Windows images score Credential Guard. Knowing it is off tells you whether the README wants it enabled.",
  ),
  "audit-secure-boot": read(
    "Reads Secure Boot and UEFI status. It does not change firmware.",
    "Secure Boot off is a firmware finding on images that shipped with it. This check only reports the state.",
  ),
  "audit-wifi-profiles": read(
    "Lists saved Wi-Fi profile names. It does not print the Wi-Fi password or PSK (the pre-shared key).",
    "Leftover Wi-Fi profiles from another network are clutter and sometimes a finding. Keys must never land in the output.",
  ),
  "harden-powershell-constrained": fix(
    "windows",
    "Turns on PowerShell script-block logging, module logging, and local transcripts.",
    "Those three logs are the Windows PowerShell finding. Transcripts stay on this computer.",
    "Sets EnableScriptBlockLogging, EnableModuleLogging, and EnableTranscripting to 1 under HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell, and writes transcripts to C:\\ProgramData\\cp-ops\\ps-transcripts. The live script does not switch on Constrained Language Mode.",
    "Set those three Enable values back to 0 and remove the transcript folder if you do not want the logs. Do not delete the Security log.",
  ),
  "disable-smb-client-v1": fix(
    "windows",
    "Turns off the SMBv1 client so this computer does not speak the old sharing dialect.",
    "Disabling the server feature is not enough if the client driver is still allowed to use SMBv1.",
    "Sets the SMB client EnableSMB1Protocol to false, disables the SMB1Protocol optional feature, and disables the mrxsmb10 service.",
    "Turn the client dialect back on only if the README requires SMBv1: Set-SmbClientConfiguration -EnableSMB1Protocol $true. That is rare.",
  ),
  "audit-dns-client": read(
    "Reads the local DNS client settings, including DNS-over-HTTPS if Windows reports it. It does not look up names.",
    "A planted DNS server sends every lookup to the wrong place. You want the configured servers, not a live query off the image.",
  ),
  "audit-windows-roles": read(
    "Lists installed Windows roles such as Active Directory, DNS, DHCP, and IIS. It does not promote or demote a domain.",
    "A workstation image should not be a surprise domain controller or DHCP server. Extra roles are findings.",
  ),
  "harden-null-session": fix(
    "windows",
    "Blocks anonymous users from listing accounts and shares.",
    "Null sessions are the fix for the anonymous-SAM audit. They should not be able to enumerate this computer.",
    "Sets RestrictAnonymous and RestrictAnonymousSAM to 1, EveryoneIncludesAnonymous to 0, LimitBlankPasswordUse to 1, and LanmanServer RestrictNullSessAccess to 1.",
    "Set those LSA and LanmanServer values back to 0 only if a required legacy app the README names cannot work without anonymous access.",
  ),
  "blacklist-kernel-modules": fix(
    "linux",
    "Stops uncommon network and filesystem kernel modules from loading. USB storage is included only when you ask for it.",
    "Protocols such as DCCP and SCTP, and odd filesystems, are unused on a competition desktop and sometimes used by plants.",
    "Writes /etc/modprobe.d/cp-blacklist.conf blacklisting dccp, sctp, rds, tipc, cramfs, freevxfs, jffs2, hfs, hfsplus, udf, and firewire-core. usb-storage is added only when CP_USB_STORAGE=1.",
    "Delete cp-blacklist.conf. Already-loaded modules stay until reboot. Leave usb-storage out unless you meant to disable USB disks.",
  ),
  "enforce-apparmor-profiles": fix(
    "linux",
    "Switches common AppArmor profiles from complain to enforce, when aa-enforce is installed.",
    "Complain mode only logs. Enforce mode is what actually blocks a program from doing more than its profile allows.",
    "Runs aa-enforce for apache2, httpd, mysqld, ntpd, named, dhcpd, ping, and tcpdump when those profiles exist. If aa-enforce is missing, it changes nothing.",
    "aa-complain on the same profile names returns them to log-only mode.",
  ),
  "enable-unattended-upgrades": fix(
    "linux",
    "Turns on automatic security updates through the distro's unattended-upgrades package.",
    "Auto-update off is an updates finding. This writes the apt setting that turns the daily job on.",
    "May install unattended-upgrades from apt, writes /etc/apt/apt.conf.d/20auto-upgrades with Update-Package-Lists 1 and Unattended-Upgrade 1, and enables the unattended-upgrades service.",
    "Set Unattended-Upgrade back to 0 in 20auto-upgrades, or restore that file from the backup, if the README says updates must be manual.",
  ),
  "audit-mail-services": read(
    "Reads Postfix and Dovecot settings for an open relay and for plaintext login. It does not send mail.",
    "A mail server that relays for the whole internet is a serious finding. Most images should not run mail at all.",
  ),
  "audit-database-bind": read(
    "Reads whether MySQL or Postgres listens on all interfaces, and whether skip-grant-tables or a trust-anyone rule is set. It does not connect or dump data.",
    "A database bound to every interface, or with grant tables skipped, is an open data store.",
  ),
  "audit-php-hardening": read(
    "Reads PHP settings such as expose_php and dangerous functions. It does not run PHP code from the image.",
    "PHP that advertises its version or allows risky functions is a web finding on images that serve pages.",
  ),
  "audit-snap-flatpak": read(
    "Lists Snap and Flatpak apps so you can spot games and extra tools the package manager did not show.",
    "Prohibited software is sometimes installed as a snap or flatpak and missed by the dpkg list.",
  ),
  "disable-ctrl-alt-del": fix(
    "linux",
    "Stops Ctrl+Alt+Del from rebooting the machine, and turns off an extra serial login prompt.",
    "An open reboot chord and an extra getty are small hardening items after the account and network work.",
    "Runs systemctl mask ctrl-alt-del.target and systemctl disable --now serial-getty@ttyS0.",
    "systemctl unmask ctrl-alt-del.target and systemctl enable serial-getty@ttyS0 if you truly need the serial console.",
  ),
  "audit-ipv6-privacy": {
    whatItDoes:
      "Reads IPv6 privacy and forwarding switches. By default it changes nothing. It disables IPv6 only when you explicitly ask.",
    whyItScores:
      "IPv6 that accepts router advertisements while forwarding is on, or that is left in an unexpected state, is a later-round network finding.",
    whatItChanges:
      "Nothing - read-only audit unless disableIPv6 is true (Linux CP_DISABLE_IPV6=1). In that case it writes /etc/sysctl.d/99-cp-ipv6-disable.conf and reloads sysctl so IPv6 is off.",
    howToUndo:
      "Nothing to undo when you only audited. If IPv6 was disabled, if a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/. Otherwise delete 99-cp-ipv6-disable.conf and run sysctl --system.",
  },
  "audit-log-persistence": read(
    "Reads whether the systemd journal is stored on disk or only in memory.",
    "Volatile logs disappear at reboot, so you lose the record of what changed during the round.",
  ),
  "audit-browser-policy": read(
    "Reads the browser homepage, proxy, and extension ids. Cookies, history, and saved passwords are not dumped.",
    "A planted homepage or proxy sends the user somewhere else. Unknown extensions are a later-round finding.",
  ),
  "harden-usb-storage": fix(
    "both",
    "Stops USB disks from auto-running or auto-mounting. It does not disable keyboards.",
    "Autorun from a USB stick is a scored finding and a way for a file to launch itself.",
    "On Windows it sets NoDriveTypeAutoRun to 255 and Deny_Execute on removable disks. On Linux it writes /etc/udev/rules.d/99-cp-usb.rules and a dconf policy that turns automount off. The usb-storage driver is blacklisted only when CP_DISABLE_USB_STORAGE=1.",
    "Delete the udev rule and dconf file on Linux, and remove NoDriveTypeAutoRun and the RemovableStorageDevices Deny_Execute value on Windows. Remove /etc/modprobe.d/usb-storage.conf if you also blacklisted the driver.",
  ),
  "audit-time-timezone": read(
    "Reads the timezone and whether the clock is synced. It does not change the clock and it is not a network time attack.",
    "A nonsense timezone or a dead time service makes every log timestamp wrong.",
  ),
  "export-coach-packet": {
    whatItDoes:
      "Writes a redacted zip a coach can read: a summary, empty findings list, and inventory placeholders. Hashes, Wi-Fi keys, and scoring-server addresses are not included.",
    whyItScores:
      "It does not score by itself. It lets you hand a teammate the picture of the image without leaking secrets.",
    whatItChanges:
      "Creates a folder and coach-packet.zip under the temp directory (Linux /tmp/cp-ops-coach-packet, Windows %TEMP%\\cp-ops-coach-packet) or the outputDir you pass. Accounts, services, and policies are not modified.",
    howToUndo: "Nothing to undo on system settings. Delete that folder if you do not want the zip left on disk.",
  },
};
