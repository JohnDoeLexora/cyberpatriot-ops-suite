import type { HowToBody } from "../types.js";

export const SERVICES: Record<string, HowToBody> = {
  "list-services": {
    summary: "Inventory running/enabled services vs required and risky lists.",
    what: "Lists systemd/Windows services with active/enabled state and annotates them against config/required-services.txt and config/risky-services.txt.",
    whyItScores:
      "You cannot disable telnet if you never saw it. Extra services (ftp, cups, RemoteRegistry) and missing required ones (sshd, apache if the README says so) both score.",
    whenToRun: "Early network/services pass, before you disable anything.",
    steps: [
      "Read the image README for required services (web, SSH, database).",
      "Update config/required-services.txt if this image differs from the sample.",
      "Run the op. Sort mentally: required, risky, other.",
      "Required but stopped: start/enable via the OS (this op is read-only).",
      "Risky and not required: hand to disable-service / disable-telnet.",
    ],
    goodLooksLike: [
      "Every README-required service is running and enabled.",
      "Telnet, rsh, anonymous FTP, SMBv1, RemoteRegistry are not enabled unless the README explicitly wants them.",
    ],
    risks: [
      "Read-only.",
      "Stopping a required scored service costs points — always README-check before disable-service.",
    ],
    related: ["flag-risky-services", "disable-service", "audit-ftp-telnet", "list-firewall-rules"],
    keywords: ["systemctl", "services.msc", "required-services", "baseline"],
  },
  "flag-risky-services": {
    summary: "Cross-check running services against the risky list and the README.",
    what: "Flags telnet, rsh, anonymous FTP, SMBv1, RemoteRegistry, and similar unless the README requires them. Bulk audit, not a scan of other hosts.",
    whyItScores:
      "Insecure remote services are a large, predictable point block. A single flagged list is faster than reading every unit name.",
    whenToRun: "Immediately after list-services.",
    steps: [
      "Run the op. For each flag, open the README: is this service a scored requirement?",
      "If not required, use the specific disable op (disable-telnet, disable-legacy-r-services, disable-smbv1) or disable-service.",
      "If required, document why you left it on and harden around it (firewall, no anonymous, etc.).",
    ],
    goodLooksLike: [
      "Flags remaining are only README-required services.",
      "sshd/apache2 stay if required.",
    ],
    risks: [
      "Read-only. Disabling is a mutate with confirm:true.",
      "Local image only — never a network vulnerability scan of other teams.",
    ],
    related: [
      "list-services",
      "disable-service",
      "disable-telnet",
      "audit-ftp-telnet",
      "disable-legacy-r-services",
    ],
    keywords: ["telnet", "vsftpd", "RemoteRegistry", "risky-services"],
  },
  "disable-service": {
    summary: "Stop and disable one local service by name, with a required-list safety catch.",
    what: "systemctl disable --now / Set-Service -StartupType Disabled for a named unit. Refuses names in required-services.txt unless force is set.",
    whyItScores: "This is the generic hammer after flag-risky-services. Safer than a blind ‘disable all’ script.",
    whenToRun: "When a specific non-required service is running and you do not have a specialized op for it.",
    steps: [
      "Copy the exact service name from list-services.",
      "Confirm it is not in the README or required-services.txt.",
      "dryRun:true, then live confirm:true.",
      "Re-run list-services; the unit should be inactive and disabled.",
    ],
    goodLooksLike: [
      "Target unit dead and disabled.",
      "Required services still running.",
    ],
    risks: [
      "Mutation. Live requires confirm:true.",
      "force=true can disable a scored service — only if you are sure the README does not need it.",
      "Wrong name (sshd vs ssh) can take down remote access; keep a console session.",
    ],
    related: ["list-services", "flag-risky-services", "disable-telnet", "audit-startup-items"],
    keywords: ["systemctl disable", "Set-Service", "confirm", "force"],
  },
  "audit-ftp-telnet": {
    summary: "Detect Telnet and FTP servers, sockets, and ports 21/23.",
    what: "Looks for telnet/ftp units and listeners. Anonymous FTP and Telnet are almost never kosher on CP images.",
    whyItScores: "Port 23 and anonymous FTP are checkbox findings. The audit tells you which package/unit to disable.",
    whenToRun: "With flag-risky-services and audit-listening-ports.",
    steps: [
      "Run the op. Note whether the problem is a socket, a daemon, anonymous_enable, or just an open port.",
      "If not README-required, disable-telnet and/or disable-service for vsftpd/ftpd.",
      "Re-run this audit and audit-listening-ports.",
    ],
    goodLooksLike: [
      "No telnet.socket / TlntSvr.",
      "No anonymous FTP.",
      "Ports 21/23 closed unless the README requires a locked-down FTP.",
    ],
    risks: [
      "Read-only.",
      "If the README requires FTP, do not disable it — tighten anonymous off and firewall instead.",
    ],
    related: ["disable-telnet", "audit-listening-ports", "flag-risky-services", "disable-service"],
    keywords: ["telnet.socket", "vsftpd", "anonymous_enable", "port 23"],
  },
  "disable-telnet": {
    summary: "Stop Telnet and block tcp/23 on the host firewall.",
    what: "Disables telnetd / TlntSvr / telnet.socket and adds a local deny for tcp/23.",
    whyItScores: "Telnet is almost never required and almost always scored. Combining unit disable + firewall is belt and suspenders.",
    whenToRun: "As soon as audit-ftp-telnet or flag-risky-services shows Telnet and the README does not require it.",
    steps: [
      "Confirm README does not require Telnet (it shouldn’t).",
      "dryRun:true, then live confirm:true.",
      "Re-run audit-ftp-telnet and audit-listening-ports.",
    ],
    goodLooksLike: [
      "Telnet unit disabled.",
      "Nothing listening on 23.",
      "Host firewall denies 23.",
    ],
    risks: [
      "Mutation. Live requires confirm:true.",
      "Local image only; this does not scan or block other teams.",
    ],
    related: ["audit-ftp-telnet", "enable-firewall", "audit-listening-ports", "disable-legacy-r-services"],
    keywords: ["telnetd", "TlntSvr", "tcp/23", "confirm"],
  },
  "disable-legacy-r-services": {
    summary: "Turn off rsh, rlogin, and rexec trust-based remotes.",
    what: "Disables rsh/rlogin/rexec and related xinetd entries. These have no place on a CP image.",
    whyItScores: "r-services are ancient remote-login plants. They trust by hostname and send secrets in the clear.",
    whenToRun: "Linux services pass with disable-telnet.",
    steps: [
      "Run flag-risky-services / list-services to see which r-* units exist.",
      "dryRun:true, then live confirm:true.",
      "Re-run list-services and audit-listening-ports (512–514).",
    ],
    goodLooksLike: [
      "rsh.socket, rlogin.socket, rexec.socket disabled.",
      "Ports 512–514 closed.",
    ],
    risks: [
      "Mutation. Live requires confirm:true.",
      "If xinetd is only there for these, consider disabling xinetd too via disable-service after a README check.",
    ],
    related: ["disable-telnet", "flag-risky-services", "audit-listening-ports", "disable-service"],
    keywords: ["rsh", "rlogin", "rexec", "xinetd", "confirm"],
  },
  "audit-smb": {
    summary: "Report Samba/SMB state, guest access, SMBv1, and share list.",
    what: "Checks smbd/nmbd/LanmanServer, guest/anonymous, SMBv1, and shares. Guest shares and SMBv1 are high unless the README requires file sharing.",
    whyItScores:
      "Open SMB with Everyone Full and SMBv1 are large Windows/Linux findings. Even if sharing is required, guest and v1 usually are not.",
    whenToRun: "With audit-shared-folders and audit-listening-ports (139/445).",
    steps: [
      "Run the op. Split findings: service running, SMBv1, guest map, dangerous shares.",
      "If SMB is not required, disable-service / disable-smbv1 as appropriate.",
      "If SMB is required: disable SMBv1, turn off guest, tighten share ACLs (see audit-shared-folders).",
    ],
    goodLooksLike: [
      "SMBv1 off.",
      "No guest / Everyone Full shares.",
      "Service off entirely when the README does not need it.",
    ],
    risks: [
      "Read-only.",
      "Disabling LanmanServer on a Windows image that needs shares will cost points — README first.",
    ],
    related: ["audit-shared-folders", "disable-smbv1", "disable-service", "audit-listening-ports"],
    keywords: ["smbd", "SMBv1", "map to guest", "LanmanServer"],
  },
};
