import type { HowToBody } from "../types.js";

export const CP07: Record<string, HowToBody> = {
  "select-unauthorized-users": {
    summary: "Bulk-select interactive accounts that miss the README allowlist.",
    what: "Compares local interactive users to config/allowed-users.txt and returns a disable/lock-ready name list, extra admins, and allowlist names missing from the image. Deepens flag-suspicious-users into the round-one “who do we turn off” table. Never dumps hashes.",
    whyItScores:
      "Unauthorized humans and extra admins are a staple point block. A bulk miss list is faster than scrolling a scored inventory under the clock, and it feeds disable-user / remove-user-from-admins.",
    whenToRun: "Right after you paste the README user list into config/allowed-users.txt. Re-run after each disable/lock.",
    steps: [
      "Copy the README authorized users into config/allowed-users.txt (one name per line).",
      "Run this op. The unauthorizedNames list is who you bulk-select.",
      "Confirm each name is not a required service account, then disable-user or lock-user (and remove-user-from-admins for extra admins).",
      "If an allowlist name is missing, do not invent an account unless the README tells you to create it.",
      "Re-run until the miss list is empty of humans.",
    ],
    goodLooksLike: [
      "README humans remain; toor/hacker123/Guest/flag are selected then disabled.",
      "No hashes in the output. Extra admins dropped to standard users when the README says so.",
    ],
    risks: [
      "Read-only selection. Acting on a name is a mutate op with confirm:true.",
      "Service accounts (www-data, sshd) should not appear — if they do, check the allowlist rather than disabling them.",
      "Authorized-image only. Never pointed at another team.",
    ],
    related: ["flag-suspicious-users", "disable-user", "list-admin-users", "list-users"],
    keywords: ["allowlist miss", "unauthorized users", "bulk select", "allowed-users.txt"],
  },
  "audit-sticky-tmp": {
    summary: "Confirm /tmp is 1777 (sticky) and flag world-writable temp dirs without sticky.",
    what: "Checks /tmp, /var/tmp, and /dev/shm for the sticky bit and inventories world-writable temp paths missing it. 0777 /tmp without sticky is a plant; sticky /tmp is expected. Local filesystem only; Bend-parallel when available.",
    whyItScores:
      "Without sticky, anyone can delete or replace files in /tmp — including other users’ work and planted droppers. Scoring checks 1777 on shared temp dirs.",
    whenToRun: "Linux files pass with find-world-writable. /tmp 1777 is the common “this is fine” exception that this op makes explicit.",
    steps: [
      "Run the op. /tmp and /var/tmp should be 1777 (drwxrwxrwt).",
      "If /tmp is 0777, chmod 1777 /tmp on the image (that chmod is not this op).",
      "World-writable subdirs under /tmp without sticky: snapshot, then chmod +t or remove the plant.",
      "Re-run. Pair with find-world-writable so a 0777 /usr/local/bin is not missed.",
    ],
    goodLooksLike: [
      "/tmp and /var/tmp are 1777.",
      "No extra 0777 directories under temp mounts.",
    ],
    risks: [
      "Read-only. chmod is a separate action.",
      "Do not chmod 1777 on /usr or /home — only shared temp dirs.",
    ],
    related: ["find-world-writable", "check-sensitive-file-perms", "audit-home-permissions", "find-suid-sgid"],
    keywords: ["sticky bit", "1777", "chmod +t", "/tmp", "drwxrwxrwt"],
  },
  "audit-anonymous-ftp": {
    summary: "Parse vsftpd/proftpd for anonymous_enable and anon upload — deeper than port 21.",
    what: "Reads vsftpd.conf / proftpd / FTPSVC knobs: anonymous_enable, anon_upload, write_enable, chroot. Does not log in anonymously and does not scan other hosts.",
    whyItScores:
      "Anonymous FTP is almost never required and almost always scored. Knowing *which knob* is on tells you whether to harden or disable the daemon.",
    whenToRun: "With audit-ftp-telnet and flag-risky-services, before harden-vsftpd.",
    steps: [
      "Run the op. Note anonymous_enable, write_enable, and anon_upload_enable.",
      "Read the README: is FTP a scored service? If not, plan to disable vsftpd after hardening anonymous off.",
      "If FTP is required, harden-vsftpd (anonymous off) rather than killing the daemon.",
      "Re-run plus audit-listening-ports (21).",
    ],
    goodLooksLike: [
      "anonymous_enable=NO and no anon upload.",
      "vsftpd disabled entirely when the README does not need FTP.",
    ],
    risks: [
      "Read-only. This is not an anonymous login test against anyone.",
      "If the README requires FTP, do not disable the service — turn anonymous off.",
    ],
    related: ["harden-vsftpd", "audit-ftp-telnet", "disable-service", "flag-risky-services"],
    keywords: ["anonymous_enable", "vsftpd.conf", "anon_upload_enable", "FTPSVC"],
  },
  "harden-vsftpd": {
    summary: "Turn off anonymous FTP in vsftpd.conf; disable vsftpd if it is not required.",
    what: "Sets anonymous_enable=NO, write_enable=NO, and anon_upload_enable=NO. If vsftpd is not in required-services.txt, also stop/disable the unit. Reloads vsftpd.",
    whyItScores: "This is the mutate that closes audit-anonymous-ftp. Anonymous write is a critical finding even when FTP stays.",
    whenToRun: "After audit-anonymous-ftp, once you know whether the README requires FTP.",
    steps: [
      "Run audit-anonymous-ftp and check required-services.txt / the README.",
      "dryRun:true to see the planned conf edits.",
      "Live confirm:true. If FTP is required, anonymous still goes off and the service stays.",
      "Re-run audit-anonymous-ftp and audit-listening-ports.",
    ],
    goodLooksLike: [
      "anonymous_enable=NO.",
      "vsftpd disabled when FTP is not required.",
    ],
    risks: [
      "Mutation. Live requires confirm:true.",
      "Disabling a README-required FTP service costs points — harden anonymous instead.",
    ],
    related: ["audit-anonymous-ftp", "disable-service", "audit-ftp-telnet", "audit-listening-ports"],
    keywords: ["vsftpd", "anonymous_enable=NO", "confirm", "anon_upload"],
  },
  "audit-web-server": {
    summary: "Apache/nginx quick harden checklist: listings, tokens, legacy TLS.",
    what: "Read-only checklist on local apache2/httpd/nginx config: Options Indexes, ServerTokens, ServerSignature, autoindex, TraceEnable, weak SSLProtocol. Does not disable a README-required web server.",
    whyItScores:
      "Directory listings and ServerTokens OS are easy Apache points. Weak TLS is a common leftover. A checklist beats grepping five conf files.",
    whenToRun: "When apache2/nginx/httpd is a required service (or running). After list-services.",
    steps: [
      "Confirm the README still wants the web server. If not, disable-service instead of hardening.",
      "Run the op. Fix failing rows on the image (Options -Indexes, ServerTokens Prod, autoindex off, modern SSLProtocol).",
      "Re-run. Do not turn off apache2 if it is scored.",
    ],
    goodLooksLike: [
      "No directory listings, ServerTokens Prod / server_tokens off, no SSLv3/TLSv1.",
      "Required site still serves.",
    ],
    risks: [
      "Read-only. Conf edits are a separate action on the image.",
      "A wrong SSLProtocol line can break a required HTTPS site — test locally.",
    ],
    related: ["list-services", "flag-risky-services", "audit-listening-ports", "disable-service"],
    keywords: ["ServerTokens", "Options Indexes", "autoindex", "SSLProtocol", "nginx"],
  },
  "disable-llmnr-netbios-wpad": {
    summary: "Turn off LLMNR, NetBIOS-over-TCP/IP, and WPAD on a Windows image.",
    what: "Sets EnableMulticast=0 (LLMNR), SetTcpipNetbios 2 (disable), and WPAD AutoDetect/DisableWpad. Stops WinHttpAutoProxySvc. Local Windows image only.",
    whyItScores:
      "LLMNR/NBT-NS/WPAD spoofing is a classic Windows plant. Workstations do not need these name-resolution shortcuts.",
    whenToRun: "Windows network pass with disable-smbv1 and audit-hosts-file. dryRun first to see current state.",
    steps: [
      "dryRun:true — the result should show LLMNR/NetBIOS/WPAD on the unhardened image.",
      "Confirm the README does not require NetBIOS name service (it almost never does).",
      "Live confirm:true.",
      "Re-run dryRun or audit-smb; LLMNR should be off and adapters NetBIOS-disabled.",
    ],
    goodLooksLike: [
      "EnableMulticast=0 and NetBIOS disabled on IP-enabled adapters.",
      "WPAD AutoDetect off and WinHttpAutoProxySvc disabled.",
    ],
    risks: [
      "Mutation. Live requires confirm:true.",
      "If a dinosaur README required NetBIOS browsing, stop. Otherwise disable it.",
      "Local image only — this does not attack LLMNR on other hosts.",
    ],
    related: ["audit-hosts-file", "audit-smb", "enable-firewall", "disable-smbv1"],
    keywords: ["LLMNR", "EnableMulticast", "NetBIOS", "WPAD", "WinHttpAutoProxySvc", "confirm"],
  },
  "audit-null-session": {
    summary: "Check RestrictAnonymous / anonymous SAM / null session shares — no dumps.",
    what: "Reads RestrictAnonymous, RestrictAnonymousSAM, EveryoneIncludesAnonymous, RestrictNullSessAccess, NullSessionPipes, and NullSessionShares. Classification only; never dumps SAM or hashes.",
    whyItScores: "Anonymous SAM and null sessions are high Windows findings. Scoring checks the LSA/LanmanServer knobs, not whether you enumerated anyone.",
    whenToRun: "Windows auth pass with audit-smb and audit-share-acls.",
    steps: [
      "Run the op. RestrictAnonymous and RestrictAnonymousSAM should be 1; EveryoneIncludesAnonymous 0.",
      "NullSessionShares/Pipes should not list C$ or samr on a workstation.",
      "Fix via local policy/registry on the image (this op is read-only). Do not dump SAM to confirm.",
    ],
    goodLooksLike: [
      "RestrictAnonymous=1, RestrictAnonymousSAM=1, EveryoneIncludesAnonymous=0.",
      "No hashes or SAM contents in the result.",
    ],
    risks: [
      "Read-only. Never dump SAM, SECURITY, or password hashes into notes.",
      "Do not test null sessions against other machines.",
    ],
    related: ["audit-smb", "audit-share-acls", "audit-uac", "audit-critical-perm-drift"],
    keywords: ["RestrictAnonymous", "RestrictAnonymousSAM", "null session", "NullSessionShares"],
  },
  "audit-idle-lock": {
    summary: "Check screensaver/idle lock: TMOUT, logind IdleAction, ScreenSaverIsSecure.",
    what: "Linux: TMOUT in profile and systemd-logind IdleAction. Windows: ScreenSaveActive, ScreenSaverIsSecure, ScreenSaveTimeOut. Unlocked idle sessions are a frequent policy item.",
    whyItScores: "Idle lock is a common ‘physical access’ scoring item on both platforms. A missing TMOUT or ScreenSaverIsSecure=0 is an easy miss.",
    whenToRun: "Auth/policy pass with audit-password-policy and audit-uac.",
    steps: [
      "Run the op. Note TMOUT, IdleAction, and Windows screensaver secure/timeout.",
      "On Linux set TMOUT in /etc/profile.d and IdleAction=lock if this is a workstation.",
      "On Windows enable a password-protected screensaver with a short timeout (this op is read-only).",
      "Re-run.",
    ],
    goodLooksLike: [
      "TMOUT set to a few minutes, or logind lock on idle.",
      "Windows ScreenSaverIsSecure=1 with a reasonable timeout (not 9999).",
    ],
    risks: [
      "Read-only.",
      "A very short TMOUT can annoy a scored interactive service — README first.",
    ],
    related: ["audit-password-policy", "audit-uac", "enable-account-lockout", "disable-guest-account"],
    keywords: ["TMOUT", "IdleAction", "ScreenSaverIsSecure", "screensaver", "idle lock"],
  },
  "hunt-sysprep-leftovers": {
    summary: "Find leftover unattend.xml / sysprep / kickstart files; never print passwords.",
    what: "Hunts unattend.xml, autounattend.xml, sysprep.xml, Panther, and ks.cfg. Flags AutoLogon/Password keys by name only — values are omitted. Local files; Bend-parallel when available.",
    whyItScores:
      "Answer files left on disk often contain the local admin password in the clear. Scoring wants them gone; forensics may want the *path* noted first.",
    whenToRun: "Files/persistence pass, early enough that you can snapshot the path for notes.",
    steps: [
      "Run the op. Record paths in team notes (not the password values).",
      "If a forensics question might reference the file, snapshot the path then remove or redact the leftover on the image.",
      "Re-run until the inventory is empty.",
    ],
    goodLooksLike: [
      "No unattend.xml under Panther, Sysprep, /root, or the drive root.",
      "Output never includes password values.",
    ],
    risks: [
      "Read-only hunt. Deleting is a separate action — snapshot first if forensics may need the path.",
      "Do not paste AutoLogon passwords into chat, tickets, or CCS.",
    ],
    related: ["find-hidden-executables", "audit-persistence-deep", "check-empty-passwords", "package-forensics-evidence"],
    keywords: ["unattend.xml", "sysprep", "autounattend", "Panther", "kickstart"],
  },
  "audit-snmp": {
    summary: "Detect SNMP and default public/private communities — no walks of other hosts.",
    what: "Finds snmpd/SNMP and default community names (public/private), plus rwcommunity. Reports names only. Never uses them to query other devices.",
    whyItScores: "SNMP with community public is a classic insecure-mgmt finding. UDP/161 open plus public/private is an easy chunk of points.",
    whenToRun: "Services pass with flag-risky-services. SNMP is almost never required on a CP workstation.",
    steps: [
      "Run the op. If public/private appear, plan to disable SNMP unless the README requires it.",
      "If SNMP must stay, change communities on the image (this op is read-only) and firewall 161.",
      "Otherwise disable-service for snmpd / SNMP with confirm:true.",
    ],
    goodLooksLike: [
      "SNMP service disabled, or no default public/private communities.",
      "No SNMP walk of other hosts in your notes.",
    ],
    risks: [
      "Read-only. Do not snmpwalk the LAN, other teams, or network printers as a ‘test.’",
      "If the README requires SNMP, do not disable it — change the community and restrict it.",
    ],
    related: ["flag-risky-services", "disable-service", "audit-listening-ports", "audit-ftp-telnet"],
    keywords: ["snmpd", "rocommunity public", "rwcommunity private", "UDP 161"],
  },
  "audit-mac-enforcement": {
    summary: "Report AppArmor/SELinux mode and suggest enforcing — does not flip the switch.",
    what: "Reads getenforce/sestatus and aa-status. Permissive or disabled MAC is a finding on images that shipped with profiles. Suggests enforce; does not run setenforce.",
    whyItScores: "SELinux Permissive and AppArmor complain-mode are common plants. Scoring wants enforcing on images that had it.",
    whenToRun: "Linux kernel pass with audit-sysctl. After you know the distro (Ubuntu=AppArmor, Fedora/CentOS=SELinux).",
    steps: [
      "Run the op. Note Permissive vs Enforcing vs Disabled, and complain vs enforce profiles.",
      "If the README does not forbid MAC, plan to set enforcing (setenforce 1 / aa-enforce) as a separate admin action.",
      "Do not disable MAC to ‘make an app work’ unless the README says the app is scored and broken by it.",
    ],
    goodLooksLike: [
      "SELinux Enforcing or AppArmor profiles in enforce, matching what the image shipped with.",
      "This op’s output still read-only — no surprise setenforce.",
    ],
    risks: [
      "Read-only. Flipping to enforcing can break a scored service — README first.",
      "Disabled SELinux on a RHEL-like image is the finding; Ubuntu without SELinux is normal.",
    ],
    related: ["audit-sysctl", "harden-sysctl", "check-auditd", "audit-firewall"],
    keywords: ["getenforce", "sestatus", "aa-status", "Permissive", "AppArmor"],
  },
  "audit-browser-baseline": {
    summary: "Firefox/IE/Edge baseline: Safe Browsing, password saving, SmartScreen — no dumps.",
    what: "Checks system Firefox policies/user.js and IE/Edge SmartScreen / password-saving flags. Does not dump cookies, history, or saved passwords.",
    whyItScores: "Safebrowsing off and password-saving on a shared image are common browser findings. SmartScreen off is a Windows favorite.",
    whenToRun: "Software/browser pass with hunt-remote-access-tools (extensions) and audit-hosts-file.",
    steps: [
      "Run the op. Note safebrowsing, password manager, SmartScreen, and insecure protocol handlers.",
      "Fix via enterprise policy / IE zone / Edge policy on the image (this op is read-only).",
      "Do not export the profile; cookies and saved passwords stay on disk.",
    ],
    goodLooksLike: [
      "Safe Browsing / SmartScreen on.",
      "Password saving off on a shared competition image.",
      "No cookies or password blobs in the result.",
    ],
    risks: [
      "Read-only. Never dump browser password stores into notes.",
      "Do not browse other teams’ sites as a ‘test’ of SmartScreen.",
    ],
    related: ["hunt-remote-access-tools", "find-prohibited-software", "audit-hosts-file", "disable-autoplay"],
    keywords: ["safebrowsing", "SmartScreen", "DisablePasswordSaving", "policies.json", "user.js"],
  },
  "audit-auto-updates": {
    summary: "Check that unattended-upgrades or Windows Update is actually enabled.",
    what: "Reads APT Periodic / 50unattended-upgrades or Windows AUOptions / wuauserv. Complements check-pending-updates: this is the *channel* sanity check, not a patch install.",
    whyItScores:
      "Unattended-upgrades off and wuauserv disabled are plants that keep the image unpatched. Scoring wants the update channel on even before you finish applying patches.",
    whenToRun: "With check-pending-updates and audit-hosts-file (so Windows Update is not sinkholed).",
    steps: [
      "Run the op. APT::Periodic::Unattended-Upgrade should not be 0; wuauserv should not be disabled; AUOptions should not be ‘never check’.",
      "Fix hosts-file blocks of windowsupdate first (audit-hosts-file).",
      "Enable the channel on the image, then apply-security-updates with confirm:true.",
    ],
    goodLooksLike: [
      "Unattended-upgrades enabled, or Windows Update service automatic and AUOptions checking.",
      "Hosts file not pinning Windows Update to 127.0.0.1.",
    ],
    risks: [
      "Read-only. Installing patches is apply-security-updates with confirm:true.",
      "Stays on the image’s configured update channels — no off-host targeting.",
    ],
    related: ["check-pending-updates", "apply-security-updates", "audit-hosts-file", "enable-windows-defender"],
    keywords: ["unattended-upgrades", "20auto-upgrades", "AUOptions", "wuauserv", "Windows Update"],
  },
  "remove-games-samples": {
    summary: "Purge games and vendor sample/content packages from the authorized image.",
    what: "Removes packages/AppX names in config/games-samples.txt (aisleriot, solitaire, Xbox apps, example-content, IIS samples). Refuses names that look like required services.",
    whyItScores: "Games and sample galleries are a frequent ‘prohibited software / sample content’ scoring item. A list beats hunting Add/Remove by hand.",
    whenToRun: "After find-prohibited-software and a forensics glance — a README question might name a game.",
    steps: [
      "Skim the README: are games/sample content forbidden? (Usually yes.)",
      "dryRun:true to see which listed packages are actually installed.",
      "If a forensics question might mention a game, snapshot the name, then live confirm:true.",
      "Re-run list-installed-packages / this op until the list is empty.",
    ],
    goodLooksLike: [
      "No aisleriot/solitaire/Xbox/example-content leftovers.",
      "Required stacks (openssh-server, apache2) untouched.",
    ],
    risks: [
      "Mutation. Live requires confirm:true.",
      "Blind purge can destroy a forensics exhibit — snapshot names first.",
      "wine/steam may be in the list; confirm they are not a required scored app.",
    ],
    related: ["find-prohibited-software", "remove-package", "find-media-files", "list-installed-packages"],
    keywords: ["aisleriot", "solitaire", "example-content", "Xbox", "games", "confirm"],
  },
  "audit-iis": {
    summary: "Inventory IIS features and flag anonymous auth plus directory browsing.",
    what: "Lists enabled IIS-* optional features and reads anonymousAuthentication / directoryBrowse. Local Windows image only. Does not dump site content.",
    whyItScores:
      "IIS anonymous + directory browsing is a high Windows web finding. Sample apps are extra points. You still must not disable a README-required site.",
    whenToRun: "Windows services pass when IIS is present. Pair with audit-anonymous-ftp if FTP is under IIS.",
    steps: [
      "Run the op. Note which IIS features are enabled and whether anonymous/directory browsing is on.",
      "If IIS is not required, plan to disable the feature/service (separate mutate).",
      "If it is required: turn off anonymous (unless the README wants a public site) and directory browsing on the image.",
    ],
    goodLooksLike: [
      "IIS absent, or anonymous auth off unless required, directory browsing off, samples gone.",
      "No site-content dump in the result.",
    ],
    risks: [
      "Read-only.",
      "Disabling IIS when the README requires a website costs the whole web check — README first.",
    ],
    related: ["list-services", "audit-anonymous-ftp", "disable-service", "audit-listening-ports"],
    keywords: ["IIS-WebServer", "anonymousAuthentication", "directoryBrowse", "Get-WindowsOptionalFeature"],
  },
  "skim-forensics-readme": {
    summary: "Keyword-skim local README/forensics files. Never contacts CCS.",
    what: "Searches Desktop/homes/README/forensics/question text on the authorized image for keywords (password, media, unauthorized, …). Helps answer forensics questions from files *on the box*. Hash-looking lines are skipped. CCS, other teams, and the internet are never contacted.",
    whyItScores:
      "Forensics questions are answered from the image README and planted files. A keyword skim is faster than opening every Desktop txt, and it stays inside the rules because it never talks to the scoring server.",
    whenToRun: "First ten minutes (README on the desktop) and again when a forensics question cites a filename. Optional searchRoot for a folder you already found.",
    steps: [
      "Run with defaults — it skims /home, /root, Desktop-like paths. On Windows it skims user Desktops.",
      "Read the hit lines. They are hints, not CCS answers. Copy into team notes.",
      "Follow up with find-media-files, list-users, or package-forensics-evidence as the hits suggest.",
      "Never paste a CCS URL into searchRoot. Never fetch the scoring site.",
    ],
    goodLooksLike: [
      "Hits from local README files only.",
      "ccsContacted=false in the extra payload.",
      "No 32+ hex dumps (hash-looking lines omitted).",
    ],
    risks: [
      "Read-only. Still: do not copy password values from unattend files into chat.",
      "This is not a scoring-server scrape and not a search of other teams’ shares.",
      "searchRoot must be a local path, never a URL.",
    ],
    related: ["package-forensics-evidence", "export-evidence-bundle", "find-media-files", "list-users"],
    keywords: ["README", "forensics question", "keyword skim", "CCS", "Desktop README"],
  },
};
