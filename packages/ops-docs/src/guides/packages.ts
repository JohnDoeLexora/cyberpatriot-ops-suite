import type { HowToBody } from "../types.js";

export const PACKAGES: Record<string, HowToBody> = {
  "list-installed-packages": {
    summary: "Dump installed packages so you can match prohibited software.",
    what: "Lists packages via dpkg-query / rpm / Get-Package. Large but filterable; input to find-prohibited-software.",
    whyItScores:
      "You cannot remove nmap if you never saw it in the inventory. Some READMEs also require a package to stay.",
    whenToRun: "Software pass, before mass removal. Also when a forensics question asks ‘what is installed.’",
    steps: [
      "Run the op. Search the output for names in config/prohibited-software.txt and the README banned list.",
      "Note required stacks (openssh-server, apache2) so you do not purge them later.",
      "Hand hits to find-prohibited-software / remove-package.",
    ],
    goodLooksLike: [
      "Inventory completes without hashes or credentials.",
      "Required services’ packages are present.",
    ],
    risks: [
      "Read-only.",
      "A huge list is normal — do not delete ‘unknown’ packages blindly.",
    ],
    related: ["find-prohibited-software", "remove-package", "list-services", "check-pending-updates"],
    keywords: ["dpkg", "rpm", "Get-Package", "inventory"],
  },
  "find-prohibited-software": {
    summary: "Match installed packages and well-known paths against the prohibited list.",
    what: "Matches nmap, hydra, john, netcat, ophcrack, aircrack, and friends from config/prohibited-software.txt. Read-only discovery; removal is a separate op.",
    whyItScores:
      "Hacking tools and games on a CP image are scored. Discovery first keeps you from removing a required look-alike.",
    whenToRun: "Right after list-installed-packages, and anytime you find nc in /tmp.",
    steps: [
      "Skim the README prohibited list; update config/prohibited-software.txt if needed.",
      "Run the op. Each hit should name a package or path.",
      "remove-package for packages; for loose binaries in /tmp, delete the file after snapshotting (see find-backdoor-binaries).",
    ],
    goodLooksLike: [
      "No nmap/hydra/john/netcat/ophcrack unless the README amazingly requires them (it will not).",
      "Required servers (openssh-server, apache2) still installed.",
    ],
    risks: [
      "Read-only. This is not a tutorial for using nmap or hydra.",
      "netcat may be named nc, ncat, or netcat-traditional — read the hit.",
    ],
    related: ["remove-package", "list-installed-packages", "find-backdoor-binaries", "find-hidden-executables"],
    keywords: ["nmap", "hydra", "john", "netcat", "ophcrack", "prohibited-software"],
  },
  "remove-package": {
    summary: "Purge one local package, with a safety catch for required services.",
    what: "apt-get remove --purge / dnf remove / Uninstall-Package. Refuses packages that look like required services (openssh-server, apache2) unless forced.",
    whyItScores: "This is the fix for find-prohibited-software. Confirmed, one name at a time, beats a reckless autoremove.",
    whenToRun: "After find-prohibited-software, for each banned package the README does not require.",
    steps: [
      "Copy the exact package name from the finder.",
      "dryRun:true.",
      "Live confirm:true. Do not force-remove openssh-server/apache2 unless you are sure.",
      "Re-run find-prohibited-software.",
    ],
    goodLooksLike: [
      "Prohibited package gone.",
      "Required services still installed and running.",
    ],
    risks: [
      "Mutation. Live requires confirm:true.",
      "force=true can remove a scored service.",
      "Purging may remove config you wanted for forensics — snapshot first if unsure.",
    ],
    related: ["find-prohibited-software", "list-installed-packages", "list-services", "disable-service"],
    keywords: ["apt-get remove", "purge", "Uninstall-Package", "confirm"],
  },
  "audit-logging": {
    summary: "Is rsyslog/journald/Event Log actually running, and are logs sized sanely?",
    what: "Checks logging services and common log files. Disabled logging is a finding because scoring/forensics depend on it.",
    whyItScores: "Images often ship with rsyslog stopped or Security log tiny. You also need logs for forensics questions.",
    whenToRun: "Early-middle of the round, before you need evidence, and as part of the checklist.",
    steps: [
      "Run the op. If rsyslog/journald/EventLog is inactive, enable it on the image (this op is read-only).",
      "Note tiny log sizes and missing auditd (see check-auditd).",
      "Do not wipe logs to ‘hide’ your work — that is the opposite of CP.",
    ],
    goodLooksLike: [
      "Logging service running.",
      "auth/secure/Security logs exist and are not zeroed.",
    ],
    risks: [
      "Read-only.",
      "Do not send logs off-image to random collectors.",
    ],
    related: ["check-auditd", "audit-powershell-logging", "export-evidence-bundle", "check-ntp"],
    keywords: ["rsyslog", "journald", "EventLog", "auditd"],
  },
  "check-auditd": {
    summary: "Is auditd installed, enabled, and watching identity files?",
    what: "Checks auditd/auditctl presence, enabled flag, and a few expected rules (identity changes, sudoers writes). Does not flood the disk with new rules in read mode.",
    whyItScores: "auditd off is a Linux logging finding. Watches on /etc/passwd are the usual expected rules.",
    whenToRun: "Linux logging pass with audit-logging.",
    steps: [
      "Run the op. If missing/inactive, install/enable on the image (read-only here).",
      "If running but no watches, add conservative watches via the OS — do not paste huge rule packs you do not understand.",
      "Re-run. Pair with audit-logging so rsyslog/journald is also alive.",
    ],
    goodLooksLike: [
      "auditd active.",
      "Watches on /etc/passwd, /etc/sudoers (or distro equivalent).",
    ],
    risks: [
      "Read-only in this op.",
      "Aggressive audit rules can fill the disk and take the image down — keep it conservative.",
    ],
    related: ["audit-logging", "check-sensitive-file-perms", "audit-sudoers"],
    keywords: ["auditd", "auditctl", "watches", "/etc/passwd"],
  },
  "check-pending-updates": {
    summary: "See whether security patches are waiting, without installing them yet.",
    what: "Reports unattended-upgrades/apt/dnf or Windows Update pending security patches. Read-only; uses the image’s configured update service only.",
    whyItScores: "Unpatched images lose update points. Checking first tells you whether apply-security-updates will take a long time.",
    whenToRun: "Once the hosts file is clean (so updates are not sinkholed) and the network/firewall will allow the vendor update channel.",
    steps: [
      "Run audit-hosts-file first if updates look blocked.",
      "Run this op. Note the count and whether unattended-upgrades is off.",
      "When you have a quiet stretch, apply-security-updates with confirm:true.",
    ],
    goodLooksLike: [
      "Zero pending security updates, or a documented reason (offline image).",
      "unattended-upgrades on if the README/distro expects it.",
    ],
    risks: [
      "Read-only. Installing is the mutate op.",
      "Do not point the image at unofficial third-party repos to ‘get more patches.’",
    ],
    related: ["apply-security-updates", "audit-hosts-file", "enable-windows-defender"],
    keywords: ["unattended-upgrades", "Windows Update", "pending patches"],
  },
  "hunt-remote-access-tools": {
    summary: "Find TeamViewer, AnyDesk, VNC, Chrome Remote Desktop, and similar on this image.",
    what: "Looks for TeamViewer, AnyDesk, VNC, Chrome Remote Desktop, RustDesk and similar on the authorized image, plus browser extension directories (profile ids only — no extension source dump). Cross-checks config/remote-access-tools.txt. Discovery, not an exploit.",
    whyItScores:
      "Unauthorized remote-access tools are a frequent software finding and a persistence path. README-required remote support is the exception; everything else goes.",
    whenToRun: "Software pass with find-prohibited-software, and again after persistence cleanup.",
    steps: [
      "Confirm the README does not require a named remote-support tool.",
      "Run the op. Note packages, binaries, and browser extension ids — not extension source.",
      "Remove unauthorized packages with remove-package (confirm:true) and delete leftover binaries/extension dirs.",
      "Re-run plus flag-risky-services (VNC listeners) and audit-listening-ports.",
    ],
    goodLooksLike: [
      "No TeamViewer/AnyDesk/VNC/RustDesk unless the README names it.",
      "No surprise unpacked Chrome/Edge remote-desktop extensions.",
      "No VNC listener on the host.",
    ],
    risks: [
      "Read-only discovery. Removal is a separate confirm:true mutate.",
      "Do not dump extension source or attack other hosts.",
      "Do not keep a RAT ‘for testing’ on the scoring image.",
    ],
    related: [
      "find-prohibited-software",
      "flag-risky-services",
      "audit-listening-ports",
      "remove-package",
    ],
    keywords: ["TeamViewer", "AnyDesk", "x11vnc", "RustDesk", "Chrome Remote Desktop", "remote-access-tools.txt"],
  },
  "apply-security-updates": {
    summary: "Install local security updates from the image’s own update channels.",
    what: "apt-get upgrade, dnf update --security, or Start-WindowsUpdate. Long-running. Live requires confirm:true. Stays on authorized-image channels.",
    whyItScores: "This is the actual patching step the check-pending-updates finding wants.",
    whenToRun:
      "When the image can reach its update service, hosts file is clean, and you can spare the time (it can be slow).",
    steps: [
      "Run check-pending-updates and audit-hosts-file.",
      "dryRun:true if you only need the package list.",
      "Live confirm:true. Do not walk away from a reboot prompt on Windows without team agreement.",
      "Re-run check-pending-updates.",
    ],
    goodLooksLike: [
      "Pending security count at or near zero.",
      "Required services come back after any restart.",
    ],
    risks: [
      "Mutation. Live requires confirm:true. Can take a long time and may reboot.",
      "Do not add random PPAs or third-party patch tools.",
      "Authorized image only — never push updates to other teams’ hosts.",
    ],
    related: ["check-pending-updates", "audit-hosts-file", "list-services", "enable-windows-defender"],
    keywords: ["apt-get upgrade", "dnf update --security", "Windows Update", "confirm"],
  },
};
