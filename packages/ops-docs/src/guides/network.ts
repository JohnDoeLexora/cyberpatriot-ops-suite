import type { HowToBody } from "../types.js";

export const NETWORK: Record<string, HowToBody> = {
  "audit-listening-ports": {
    summary: "List this image’s TCP/UDP listeners and flag the ugly ones.",
    what: "Uses ss / Get-NetTCPConnection on the local image. Flags 23, 111, 139, 445, 512–514, 5900, 31337, 4444, and unexpected 0.0.0.0 binds. Does not scan other hosts.",
    whyItScores:
      "A listener is a service you forgot. Backdoor ports (31337, 4444) are planted; 23/445 are insecure services. Scoring and forensics both care.",
    whenToRun: "Early, and after every service disable. Pair with list-services.",
    steps: [
      "Run the op. Keep the README required ports (22, 80, 443, …) as the allowlist.",
      "For each unexpected bind: identify the process, then disable that service or investigate find-backdoor-binaries.",
      "Re-run until only required listeners remain.",
    ],
    goodLooksLike: [
      "22/80/443 (or whatever the README lists) only.",
      "No 23, 31337, 4444, or mystery 0.0.0.0 binds.",
    ],
    risks: [
      "Read-only local audit. This is not nmap against the LAN or other teams.",
      "Killing the wrong listener can drop a scored service — identify first.",
    ],
    related: [
      "flag-risky-services",
      "find-backdoor-binaries",
      "disable-telnet",
      "list-firewall-rules",
    ],
    keywords: ["ss -lntup", "31337", "4444", "listeners", "Get-NetTCPConnection"],
  },
  "ssh-hardening-audit": {
    summary: "Read sshd_config for root login, empty passwords, protocol, and related knobs.",
    what: "Parses PermitRootLogin, PasswordAuthentication, Protocol, X11Forwarding, MaxAuthTries, PermitEmptyPasswords, ciphers/MACs, AllowUsers. Read-only; no outbound SSH.",
    whyItScores:
      "sshd_config is a dense scoring surface. PermitRootLogin yes and PermitEmptyPasswords yes are the usual plants.",
    whenToRun: "Linux network pass, before harden-sshd / disable-root-ssh.",
    steps: [
      "Confirm SSH is required (almost always).",
      "Run the audit and list every weak setting.",
      "Apply harden-sshd (and disable-root-ssh if you want that one knob isolated).",
      "Re-run the audit.",
    ],
    goodLooksLike: [
      "PermitRootLogin no, PermitEmptyPasswords no, Protocol 2, X11Forwarding no, MaxAuthTries ≤ 4.",
      "sshd still running.",
    ],
    risks: [
      "Read-only.",
      "Do not disable sshd if it is a required service just to ‘hide’ findings — harden it.",
    ],
    related: ["harden-sshd", "disable-root-ssh", "audit-ssh-authorized-keys", "list-admin-users"],
    keywords: ["sshd_config", "PermitRootLogin", "PermitEmptyPasswords", "MaxAuthTries"],
  },
  "harden-sshd": {
    summary: "Write a conservative sshd drop-in and reload sshd.",
    what: "Drop-in with PermitRootLogin no, PermitEmptyPasswords no, X11Forwarding no, MaxAuthTries 4, Protocol 2. Reloads sshd.",
    whyItScores: "One confirmed mutate beats five error-prone hand edits, and the audit op can verify it.",
    whenToRun: "After ssh-hardening-audit, with a sudo user session already open.",
    steps: [
      "Keep a local/console session as a sudo README user.",
      "dryRun:true to preview the drop-in path (99-cp-hardening.conf).",
      "Live confirm:true.",
      "Re-run ssh-hardening-audit. If sshd is required, confirm it reloaded successfully.",
    ],
    goodLooksLike: [
      "Drop-in present, audit clean.",
      "Team can still SSH as a non-root authorized user.",
    ],
    risks: [
      "Mutation. Live requires confirm:true.",
      "A bad sshd reload can drop remote access — console first.",
      "Local sshd only; not a tool for connecting to other hosts.",
    ],
    related: ["ssh-hardening-audit", "disable-root-ssh", "enable-firewall", "audit-ssh-authorized-keys"],
    keywords: ["sshd_config.d", "drop-in", "Protocol 2", "confirm"],
  },
  "audit-rdp": {
    summary: "See whether Remote Desktop is on, and whether NLA is on if it stays.",
    what: "Checks fDenyTSConnections, NLA, and TermService. RDP should be off unless the README requires it; NLA on if it stays.",
    whyItScores: "Open RDP without NLA is a common Windows finding. Extra RDP when not required is also scored.",
    whenToRun: "Windows network pass with audit-firewall and list-groups (Remote Desktop Users).",
    steps: [
      "README: is RDP a required service?",
      "Run the audit.",
      "If not required: disable-rdp.",
      "If required: leave it on, require NLA, restrict Remote Desktop Users.",
    ],
    goodLooksLike: [
      "RDP off when not required.",
      "If on: NLA enabled, TermService running, membership tight.",
    ],
    risks: [
      "Read-only.",
      "Disabling RDP when it is the only remote path can strand you — know your console story.",
    ],
    related: ["disable-rdp", "list-groups", "enable-firewall", "audit-listening-ports"],
    keywords: ["fDenyTSConnections", "NLA", "TermService", "RDP"],
  },
  "disable-rdp": {
    summary: "Turn Remote Desktop off and stop TermService when it is not required.",
    what: "Sets fDenyTSConnections=1 and stops TermService if RDP is not a required service.",
    whyItScores: "When the README is silent on RDP, off is the scoring answer.",
    whenToRun: "After audit-rdp says enabled and the README does not require RDP.",
    steps: [
      "Confirm you have console or another admin path.",
      "dryRun:true, then live confirm:true.",
      "Re-run audit-rdp and audit-listening-ports (3389).",
    ],
    goodLooksLike: ["fDenyTSConnections=1", "TermService stopped", "3389 closed"],
    risks: [
      "Mutation. Live requires confirm:true.",
      "Will refuse to be your only remote path if you still need it — README first.",
    ],
    related: ["audit-rdp", "enable-firewall", "list-groups", "disable-service"],
    keywords: ["disable RDP", "TermService", "3389", "confirm"],
  },
  "audit-hosts-file": {
    summary: "Catch malicious redirects in /etc/hosts or drivers/etc/hosts.",
    what: "Reads the hosts file for unexpected redirects (Windows Update, antivirus, scoring sites, social). Does not contact those hosts.",
    whyItScores:
      "Planted hosts entries can block updates or AV. That both costs update points and hides other findings.",
    whenToRun: "Network pass, before apply-security-updates, and if updates seem ‘broken’.",
    steps: [
      "Run the op. Expected: localhost, maybe the hostname.",
      "Unexpected sinkholes of windowsupdate, defender, or scoring domains: plan to remove those lines on the image (this op is read-only).",
      "Re-run after editing. Do not add your own redirects to third-party sites.",
    ],
    goodLooksLike: [
      "localhost and the machine hostname only, plus README-required entries.",
      "No Windows Update / AV sinkholes.",
    ],
    risks: [
      "Read-only.",
      "Do not probe the redirected sites from the image as a ‘test.’",
    ],
    related: ["check-pending-updates", "apply-security-updates", "enable-windows-defender", "audit-logging"],
    keywords: ["/etc/hosts", "windowsupdate", "sinkhole", "redirect"],
  },
  "check-ntp": {
    summary: "See whether the clock is actually syncing.",
    what: "Checks chronyd / systemd-timesyncd / w32time. Wrong clocks break logs and Kerberos. Local config audit, not an NTP amplification test.",
    whyItScores: "Disabled time sync is a small but real finding, and it poisons log evidence for forensics questions.",
    whenToRun: "After logging/firewall basics, or if log timestamps look insane.",
    steps: [
      "Run the op. Note inactive units and bogus NTP servers (10.0.0.1 plants).",
      "Enable the distro time service via the OS; this op is read-only.",
      "Do not point NTP at random internet pools if the README specifies an internal server.",
    ],
    goodLooksLike: [
      "timesyncd/chronyd/w32time active.",
      "Server list looks like the README or a sane vendor default — not a planted RFC1918 box.",
    ],
    risks: [
      "Read-only.",
      "This is not a denial-of-service test against NTP servers.",
    ],
    related: ["audit-logging", "check-auditd", "audit-hosts-file"],
    keywords: ["chronyd", "timesyncd", "w32time", "NTP"],
  },
  "audit-firewall": {
    summary: "Is the host firewall even on, and is there a default deny?",
    what: "Reports ufw/firewalld/iptables or Windows Firewall profiles (Domain/Private/Public). A disabled host firewall is a high finding.",
    whyItScores: "‘Firewall off’ is one of the fastest network points. Profiles that are off individually (Public) also score.",
    whenToRun: "Immediately in the network pass — often in the first ten minutes.",
    steps: [
      "Run the op. If inactive/off, enable-firewall is the next click.",
      "Then list-firewall-rules and apply-default-deny-inbound.",
      "Allow required services (22/80/…) only after default deny.",
    ],
    goodLooksLike: [
      "ufw/firewalld active, or all Windows profiles on.",
      "Default incoming deny (see apply-default-deny-inbound).",
    ],
    risks: [
      "Read-only.",
      "Enabling a firewall without allow rules for required services can drop scored ports — plan the allows.",
    ],
    related: ["enable-firewall", "list-firewall-rules", "apply-default-deny-inbound", "audit-listening-ports"],
    keywords: ["ufw", "firewalld", "Windows Firewall", "profile off"],
  },
  "enable-firewall": {
    summary: "Turn the host firewall on (ufw/firewalld or all Windows profiles).",
    what: "Enables ufw/firewalld or Set-NetFirewallProfile -Enabled True for all profiles. Does not change other machines.",
    whyItScores: "The audit finding ‘firewall disabled’ is fixed by this mutate.",
    whenToRun: "As soon as audit-firewall says off, after you know which ports must stay open.",
    steps: [
      "Note required ports from the README.",
      "dryRun:true, then live confirm:true.",
      "Follow with apply-default-deny-inbound and explicit allows if needed.",
      "Re-run audit-firewall.",
    ],
    goodLooksLike: ["Firewall enabled on all profiles.", "Required services still reachable on this image."],
    risks: [
      "Mutation. Live requires confirm:true.",
      "Can cut your own SSH/RDP if default deny is already in place without allows — have console access.",
    ],
    related: ["audit-firewall", "apply-default-deny-inbound", "list-firewall-rules", "harden-sshd"],
    keywords: ["ufw --force enable", "Set-NetFirewallProfile", "confirm"],
  },
  "list-firewall-rules": {
    summary: "Dump host rules and highlight allow-any and ugly ports.",
    what: "Lists host firewall rules. Highlights allow-any inbound, allow 23/21/445, and disabled default-deny.",
    whyItScores: "A firewall that is ‘on’ but allows 0.0.0.0/0 any/any is still a finding.",
    whenToRun: "After enable-firewall, before you declare the network pass done.",
    steps: [
      "Run the op. Treat any/any inbound and 23/21/445 allows as to-fix.",
      "Remove those rules on the image (OS tools); this op is read-only.",
      "Keep allows for README-required ports only.",
    ],
    goodLooksLike: [
      "No 0.0.0.0/0 any/any inbound.",
      "No allow 23/21 unless README FTP/Telnet (shouldn’t).",
      "Required 22/80 present if those services are required.",
    ],
    risks: [
      "Read-only.",
      "Deleting the wrong allow can drop a scored service — README next to the rule list.",
    ],
    related: ["apply-default-deny-inbound", "audit-firewall", "disable-telnet", "audit-listening-ports"],
    keywords: ["ufw status", "netsh advfirewall", "any/any", "allow 23"],
  },
  "apply-default-deny-inbound": {
    summary: "Default incoming deny, keep established outbound, allow required services.",
    what: "Sets default incoming deny (ufw default deny incoming / public profile block) while leaving established outbound. Pairs with allow rules for required services.",
    whyItScores: "Default-deny is the actual hardening; ‘firewall on’ alone is not enough.",
    whenToRun: "Right after enable-firewall, with the required-port list in hand.",
    steps: [
      "Write down required inbound ports from the README.",
      "dryRun:true — you should see default deny plus allows for those ports.",
      "Live confirm:true.",
      "Re-run list-firewall-rules and try the required service locally.",
    ],
    goodLooksLike: [
      "Default incoming deny.",
      "Explicit allows for required services only.",
      "Outbound established traffic still works.",
    ],
    risks: [
      "Mutation. Live requires confirm:true.",
      "Without the allow list, you can cut SSH/HTTP scoring. Console access first.",
      "Does not open or close ports on other machines.",
    ],
    related: ["enable-firewall", "list-firewall-rules", "audit-listening-ports", "list-services"],
    keywords: ["default deny", "ufw default deny incoming", "confirm"],
  },
};
