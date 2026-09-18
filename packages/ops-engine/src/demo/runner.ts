import type { OpDefinition } from "@cyberpatriot/ops-catalog";
import { findingsFromUsers, scoreUsers } from "../heuristics/suspicious-users.js";
import { asBoolean, asString } from "../safety.js";
import type {
  ChecklistItem,
  EngineContext,
  Finding,
  RunData,
  RunResult,
} from "../types.js";
import {
  DEMO_NOW,
  demoChecksums,
  demoCron,
  demoFiles,
  demoGroups,
  demoHostsEntries,
  demoPackages,
  demoPolicy,
  demoPorts,
  demoServices,
  demoShares,
  demoSysctl,
  demoUsers,
} from "./fixtures.js";

/** Default README allowlist used when no names are injected (browser demo fallback). */
export const DEFAULT_DEMO_ALLOWLIST = ["root", "alice", "bob", "coach", "Administrator"] as const;

function allowlistFrom(ctx: EngineContext): Set<string> {
  const raw = ctx.params.allowlistNames;
  if (Array.isArray(raw)) {
    const names = raw.filter((n): n is string => typeof n === "string").map((n) => n.trim()).filter(Boolean);
    if (names.length) return new Set(names);
  }
  return new Set(DEFAULT_DEMO_ALLOWLIST);
}

function scored(ctx: EngineContext) {
  return scoreUsers(demoUsers, { allowlist: allowlistFrom(ctx), now: ctx.now });
}

function findingsOf(_data: RunData, extra: Finding[] = []): Finding[] {
  return extra;
}

function pack(
  ctx: EngineContext,
  summary: string,
  data: RunData,
  findings: Finding[] = [],
  warnings: string[] = [],
): RunResult {
  return {
    opId: ctx.op.id,
    title: ctx.op.title,
    category: ctx.op.category,
    platforms: ctx.op.platforms,
    risk: ctx.op.risk,
    mode: "demo",
    ok: true,
    startedAt: ctx.now.toISOString(),
    finishedAt: ctx.now.toISOString(),
    summary,
    findings,
    data,
    warnings,
    engine: "demo",
  };
}

function mutateNote(ctx: EngineContext, action: string): string {
  const dry = asBoolean(ctx.params.dryRun, false);
  const target = asString(ctx.params.username) ?? asString(ctx.params.service) ?? asString(ctx.params.package);
  const who = target ? ` (${target})` : "";
  if (dry) return `DEMO dry-run: would ${action}${who}. No host changes.`;
  return `DEMO simulated: ${action}${who}. Fixtures only — the host was not modified.`;
}

function checklist(ctx: EngineContext): ChecklistItem[] {
  const users = scored(ctx);
  const extraAdmins = users.filter(
    (u) => (u.signals ?? []).includes("extra-admin") || (u.signals ?? []).includes("uid-weirdness"),
  );
  const guest = users.find((u) => u.name.toLowerCase() === "guest");
  const telnet = demoServices.find((s) => s.name.toLowerCase().includes("telnet") && s.state === "running");
  const fw = demoPolicy.firewallEnabled === true;
  const media = demoFiles.filter((f) => /\.(mp3|mp4|wav|flac|ogg|avi|mkv)$/i.test(f.path));
  const prohibited = demoPackages.filter((p) => p.prohibited);
  const badPorts = demoPorts.filter((p) => p.suspicious);
  return [
    {
      id: "allowlist-users",
      title: "No unexpected interactive users",
      status: extraAdmins.length ? "fail" : "pass",
      detail: extraAdmins.length
        ? `${extraAdmins.map((u) => u.name).join(", ")} look unauthorized`
        : "Interactive users match the allowlist",
      relatedOpId: "flag-suspicious-users",
    },
    {
      id: "guest",
      title: "Guest account disabled",
      status: guest?.enabled ? "fail" : "pass",
      detail: guest?.enabled ? "Guest is enabled with an empty password" : "Guest disabled",
      relatedOpId: "disable-guest-account",
    },
    {
      id: "password-policy",
      title: "Password policy meets baseline",
      status: Number(demoPolicy.PASS_MIN_LEN) >= 14 ? "pass" : "fail",
      detail: `min length ${demoPolicy.PASS_MIN_LEN}, max age ${demoPolicy.PASS_MAX_DAYS}`,
      relatedOpId: "enforce-password-policy",
    },
    {
      id: "firewall",
      title: "Host firewall enabled",
      status: fw ? "pass" : "fail",
      detail: fw ? "Firewall on" : `ufw ${demoPolicy.ufwStatus}`,
      relatedOpId: "enable-firewall",
    },
    {
      id: "telnet",
      title: "Telnet disabled",
      status: telnet ? "fail" : "pass",
      detail: telnet ? `${telnet.name} is ${telnet.state}` : "No telnet service",
      relatedOpId: "disable-telnet",
    },
    {
      id: "ports",
      title: "No suspicious listeners",
      status: badPorts.length ? "fail" : "pass",
      detail: badPorts.length
        ? badPorts.map((p) => `${p.port}/${p.protocol}`).join(", ")
        : "Listeners look like required services",
      relatedOpId: "audit-listening-ports",
    },
    {
      id: "ssh",
      title: "SSH hardened",
      status: demoPolicy.PermitRootLogin === "no" ? "pass" : "fail",
      detail: `PermitRootLogin=${demoPolicy.PermitRootLogin} PermitEmptyPasswords=${demoPolicy.PermitEmptyPasswords}`,
      relatedOpId: "harden-sshd",
    },
    {
      id: "uac",
      title: "UAC enabled",
      status: demoPolicy.EnableLUA === 1 ? "pass" : "fail",
      detail: `EnableLUA=${demoPolicy.EnableLUA}`,
      relatedOpId: "audit-uac",
    },
    {
      id: "prohibited",
      title: "No prohibited software",
      status: prohibited.length ? "fail" : "pass",
      detail: prohibited.map((p) => p.name).join(", ") || "None found",
      relatedOpId: "find-prohibited-software",
    },
    {
      id: "media",
      title: "No prohibited media files",
      status: media.length ? "fail" : "pass",
      detail: media.map((f) => f.path).join(", ") || "None found",
      relatedOpId: "find-media-files",
    },
    {
      id: "updates",
      title: "Security updates applied",
      status: Number(demoPolicy.pendingSecurityUpdates) > 0 ? "warn" : "pass",
      detail: `${demoPolicy.pendingSecurityUpdates} pending security updates`,
      relatedOpId: "apply-security-updates",
    },
    {
      id: "defender",
      title: "Windows Defender running",
      status: demoServices.find((s) => s.name === "WinDefend")?.state === "running" ? "pass" : "fail",
      detail: "WinDefend is stopped in the demo fixture",
      relatedOpId: "enable-windows-defender",
    },
  ];
}

function remainingWorkScore(ctx: EngineContext): { score: number; findings: Finding[] } {
  const items = checklist(ctx);
  const fail = items.filter((i) => i.status === "fail").length;
  const warn = items.filter((i) => i.status === "warn").length;
  const score = Math.min(100, fail * 8 + warn * 3 + 10);
  const users = scored(ctx);
  const findings: Finding[] = [
    ...findingsFromUsers(users).slice(0, 6),
    ...demoPorts
      .filter((p) => p.suspicious)
      .map((p) => ({
        id: `port:${p.port}`,
        severity: p.port === 31337 || p.port === 4444 ? "critical" as const : "high" as const,
        title: `Listener ${p.port}/${p.protocol}`,
        detail: p.reason ?? "unexpected listener",
        resource: `${p.address}:${p.port}`,
        remediationOpId: p.port === 23 ? "disable-telnet" : "audit-listening-ports",
      })),
  ];
  return { score, findings };
}

export function runDemo(ctx: EngineContext): RunResult {
  const users = scored(ctx);
  const userFindings = findingsFromUsers(users);
  const id = ctx.op.id;
  const username = asString(ctx.params.username);
  const service = asString(ctx.params.service);
  const pkg = asString(ctx.params.package);

  switch (id) {
    case "list-users":
      return pack(ctx, `Demo inventory of ${users.length} local accounts (hashes omitted).`, { users }, []);
    case "flag-suspicious-users":
      return pack(
        ctx,
        `Heuristic pack flagged ${userFindings.length} accounts. Highest: ${userFindings[0]?.resource ?? "none"}.`,
        { users: users.filter((u) => (u.suspicionScore ?? 0) >= 10) },
        userFindings,
      );
    case "list-admin-users":
      return pack(
        ctx,
        "Administrators / sudo / UID 0 from demo fixtures.",
        {
          users: users.filter(
            (u) =>
              u.uid === 0 ||
              u.groups.some((g) => ["sudo", "wheel", "administrators", "root"].includes(g.toLowerCase())),
          ),
          groups: demoGroups.filter((g) => g.privileged),
        },
        userFindings.filter((f) => (f.signals ?? []).some((s) => s === "extra-admin" || s === "uid-weirdness")),
      );
    case "audit-uid-zero":
    case "audit-duplicate-uids": {
      const zeros = users.filter((u) => u.uid === 0);
      return pack(
        ctx,
        `${zeros.length} UID 0 accounts (expected 1: root).`,
        { users: zeros },
        zeros
          .filter((u) => u.name !== "root")
          .map((u) => ({
            id: `uid0:${u.name}`,
            severity: "critical" as const,
            title: `Non-root UID 0: ${u.name}`,
            detail: `${u.name} has uid=0 home=${u.home}`,
            resource: u.name,
            remediationOpId: "disable-user",
          })),
      );
    }
    case "check-empty-passwords": {
      const empty = users.filter((u) => u.passwordEmpty);
      return pack(
        ctx,
        `${empty.length} accounts with empty passwords (hashes not shown).`,
        { users: empty },
        empty.map((u) => ({
          id: `empty:${u.name}`,
          severity: "high" as const,
          title: `Empty password: ${u.name}`,
          detail: "Password is empty or not required. Hash omitted.",
          resource: u.name,
          remediationOpId: u.name.toLowerCase() === "guest" ? "disable-guest-account" : "lock-user",
        })),
      );
    }
    case "audit-never-logged-in": {
      const never = users.filter((u) => u.interactive && !u.lastLogin);
      return pack(
        ctx,
        `${never.length} interactive accounts have never logged in.`,
        { users: never },
        never.map((u) => ({
          id: `nologin:${u.name}`,
          severity: "medium" as const,
          title: `Never logged in: ${u.name}`,
          detail: "Human account with no last-login timestamp.",
          resource: u.name,
          remediationOpId: "disable-user",
        })),
      );
    }
    case "check-user-shells":
      return pack(
        ctx,
        "Login shells from demo fixtures.",
        { users },
        users
          .filter((u) => (u.signals ?? []).includes("nonstandard-shell"))
          .map((u) => ({
            id: `shell:${u.name}`,
            severity: "medium" as const,
            title: `Unusual shell for ${u.name}`,
            detail: u.shell ?? "missing",
            resource: u.name,
          })),
      );
    case "list-groups":
      return pack(ctx, `${demoGroups.length} groups.`, { groups: demoGroups, users });
    case "disable-user":
    case "lock-user":
    case "remove-user-from-admins":
    case "expire-user-password":
      return pack(
        ctx,
        mutateNote(ctx, id.replace(/-/g, " ")),
        {
          users: users.filter((u) => !username || u.name === username),
          extra: { simulated: true, target: username ?? null, op: id },
        },
        [],
        username ? [] : ["No username param; demo still succeeded against fixtures."],
      );
    case "disable-guest-account":
      return pack(ctx, mutateNote(ctx, "disable Guest"), {
        users: users.filter((u) => u.name.toLowerCase() === "guest").map((u) => ({ ...u, enabled: false, locked: true })),
      });
    case "audit-password-policy":
    case "check-password-aging":
      return pack(
        ctx,
        "Password policy is weaker than a typical CP baseline.",
        { policy: demoPolicy, users: users.filter((u) => u.interactive) },
        [
          {
            id: "minlen",
            severity: "high",
            title: "Minimum password length is 8",
            detail: "Raise to at least 14.",
            remediationOpId: "enforce-password-policy",
          },
          {
            id: "maxdays",
            severity: "medium",
            title: "PASS_MAX_DAYS is 99999",
            detail: "Aging effectively disabled.",
            remediationOpId: "enforce-password-policy",
          },
        ],
      );
    case "enforce-password-policy":
    case "enable-account-lockout":
      return pack(ctx, mutateNote(ctx, id.replace(/-/g, " ")), { policy: { ...demoPolicy, PASS_MIN_LEN: 14, PASS_MAX_DAYS: 90 } });
    case "audit-pam":
      return pack(ctx, "PAM still allows nullok and has no faillock.", {
        extra: { nullok: true, faillock: false, pwquality: false },
      }, [
        { id: "nullok", severity: "high", title: "pam_unix nullok is set", detail: "Empty passwords can authenticate.", remediationOpId: "enforce-password-policy" },
        { id: "faillock", severity: "medium", title: "No pam_faillock", detail: "Enable account lockout.", remediationOpId: "enable-account-lockout" },
      ]);
    case "disable-root-ssh":
    case "harden-sshd":
      return pack(ctx, mutateNote(ctx, "harden sshd_config"), {
        policy: { PermitRootLogin: "no", PermitEmptyPasswords: "no", X11Forwarding: "no" },
      });
    case "audit-sudoers":
      return pack(ctx, "NOPASSWD sudoers plant and world-writable sudoers.d.", {
        files: demoFiles.filter((f) => f.path.includes("sudoers")),
        extra: { nopasswd: ["nologin_admin ALL=(ALL) NOPASSWD: ALL"] },
      }, [
        { id: "nopasswd", severity: "critical", title: "NOPASSWD: ALL for nologin_admin", detail: "Unexpected sudoers rule.", resource: "nologin_admin", remediationOpId: "remove-user-from-admins" },
      ]);
    case "audit-uac":
      return pack(ctx, "UAC is disabled in the Windows demo fixture.", {
        policy: { EnableLUA: 0, ConsentPromptBehaviorAdmin: 0, PromptOnSecureDesktop: 0 },
      }, [
        { id: "uac", severity: "high", title: "EnableLUA=0", detail: "User Account Control is off.", remediationOpId: "audit-uac" },
      ]);
    case "list-services":
      return pack(ctx, `${demoServices.length} services in the demo image.`, { services: demoServices });
    case "flag-risky-services": {
      const risky = demoServices.filter((s) => s.risky && (s.state === "running" || s.enabled));
      return pack(
        ctx,
        `${risky.length} risky services enabled or running.`,
        { services: risky },
        risky.map((s) => ({
          id: `svc:${s.name}`,
          severity: s.name.toLowerCase().includes("telnet") ? "critical" as const : "high" as const,
          title: `Risky service ${s.name}`,
          detail: `${s.name} is ${s.state} (enabled=${s.enabled})`,
          resource: s.name,
          remediationOpId: s.name.toLowerCase().includes("telnet") ? "disable-telnet" : "disable-service",
        })),
      );
    }
    case "disable-service":
    case "disable-telnet":
    case "disable-legacy-r-services":
    case "disable-rdp":
    case "disable-smbv1":
    case "enable-windows-defender":
    case "disable-autoplay":
      return pack(ctx, mutateNote(ctx, id.replace(/-/g, " ")), {
        services: demoServices.filter((s) => !service || s.name === service),
      });
    case "audit-ftp-telnet":
      return pack(ctx, "Telnet and anonymous FTP are live in the demo image.", {
        services: demoServices.filter((s) => /telnet|ftp/i.test(s.name)),
        ports: demoPorts.filter((p) => p.port === 21 || p.port === 23),
        extra: { anonymousFtp: true },
      }, [
        { id: "telnet", severity: "critical", title: "Telnet listening on :23", detail: "Disable telnetd.", remediationOpId: "disable-telnet" },
        { id: "anonftp", severity: "high", title: "vsftpd anonymous_enable=YES", detail: "Anonymous FTP is on.", remediationOpId: "disable-service" },
      ]);
    case "audit-smb":
      return pack(ctx, "SMB/Samba is running with guest mapping and SMBv1.", {
        services: demoServices.filter((s) => /smb|nmb|lanman/i.test(s.name)),
        shares: demoShares,
        extra: { smb1: true, mapToGuest: true },
      }, [
        { id: "smb1", severity: "high", title: "SMBv1 enabled", detail: "Disable SMB1Protocol / min protocol SMB2.", remediationOpId: "disable-smbv1" },
      ]);
    case "audit-listening-ports": {
      const bad = demoPorts.filter((p) => p.suspicious);
      return pack(
        ctx,
        `${demoPorts.length} listeners, ${bad.length} suspicious.`,
        { ports: demoPorts },
        bad.map((p) => ({
          id: `port:${p.protocol}:${p.port}`,
          severity: p.port === 31337 || p.port === 4444 ? "critical" as const : "high" as const,
          title: `${p.address}:${p.port}/${p.protocol} (${p.process ?? "unknown"})`,
          detail: p.reason ?? "unexpected",
          resource: `${p.port}/${p.protocol}`,
        })),
      );
    }
    case "ssh-hardening-audit":
      return pack(ctx, "sshd_config is the stock insecure demo.", {
        policy: {
          PermitRootLogin: String(demoPolicy.PermitRootLogin),
          PermitEmptyPasswords: String(demoPolicy.PermitEmptyPasswords),
          X11Forwarding: String(demoPolicy.X11Forwarding),
          Protocol: String(demoPolicy.Protocol),
        },
      }, [
        { id: "rootlogin", severity: "high", title: "PermitRootLogin yes", detail: "Disable root SSH.", remediationOpId: "disable-root-ssh" },
        { id: "empty", severity: "critical", title: "PermitEmptyPasswords yes", detail: "Empty passwords over SSH.", remediationOpId: "harden-sshd" },
      ]);
    case "audit-rdp":
      return pack(ctx, "RDP is enabled without NLA.", {
        services: demoServices.filter((s) => s.name === "TermService"),
        ports: demoPorts.filter((p) => p.port === 3389),
        extra: { fDenyTSConnections: 0, UserAuthentication: 0 },
      }, [
        { id: "rdp", severity: "high", title: "RDP enabled without NLA", detail: "Disable unless the README requires it.", remediationOpId: "disable-rdp" },
      ]);
    case "audit-hosts-file":
      return pack(ctx, "Hosts file redirects Windows Update and google.com.", {
        extra: { entries: demoHostsEntries },
      }, [
        { id: "wu", severity: "high", title: "windowsupdate.microsoft.com pinned to 127.0.0.1", detail: "Likely blocking patches." },
      ]);
    case "check-ntp":
      return pack(ctx, "Time sync is inactive; config points at 10.0.0.1.", {
        extra: { timesyncd: "inactive", ntpServer: "10.0.0.1" },
      }, [{ id: "ntp", severity: "medium", title: "timesyncd inactive", detail: "Enable chrony or systemd-timesyncd." }]);
    case "audit-firewall":
    case "list-firewall-rules":
      return pack(ctx, "Host firewall is off; demo rules allow 23 and 445.", {
        policy: { firewallEnabled: false, ufwStatus: "inactive" },
        extra: { rules: ["allow 23/tcp", "allow 445/tcp", "allow any from 0.0.0.0/0"] },
      }, [
        { id: "fw", severity: "high", title: "Firewall inactive", detail: "Enable ufw / Windows Firewall.", remediationOpId: "enable-firewall" },
      ]);
    case "enable-firewall":
    case "apply-default-deny-inbound":
      return pack(ctx, mutateNote(ctx, id.replace(/-/g, " ")), { policy: { firewallEnabled: true, ufwStatus: "active" } });
    case "find-world-writable":
      return pack(ctx, "World-writable PATH, cron, and sudoers in the demo image.", {
        files: demoFiles.filter((f) => f.worldWritable),
      }, demoFiles.filter((f) => f.worldWritable).map((f) => ({
        id: `ww:${f.path}`,
        severity: f.path.includes("sudoers") || f.path.includes("cron") ? "critical" as const : "high" as const,
        title: `World-writable ${f.path}`,
        detail: f.note ?? f.mode ?? "",
        resource: f.path,
      })));
    case "find-suid-sgid":
      return pack(ctx, "Unexpected SUID binaries under /tmp and /home.", {
        files: demoFiles.filter((f) => f.suid || f.sgid),
      }, demoFiles.filter((f) => f.suid && (f.path.startsWith("/tmp") || f.path.startsWith("/home"))).map((f) => ({
        id: `suid:${f.path}`,
        severity: "critical" as const,
        title: `Unexpected SUID ${f.path}`,
        detail: f.note ?? "",
        resource: f.path,
      })));
    case "find-media-files": {
      const media = demoFiles.filter((f) => /\.(mp3|mp4|wav|flac|ogg|avi|mkv|mov)$/i.test(f.path));
      return pack(ctx, `${media.length} prohibited media files.`, { files: media }, media.map((f) => ({
        id: `media:${f.path}`,
        severity: "medium" as const,
        title: `Media file ${f.path}`,
        detail: "README typically forbids media on the image.",
        resource: f.path,
      })));
    }
    case "audit-home-permissions":
    case "check-sensitive-file-perms":
      return pack(ctx, "Sensitive files and homes have unsafe modes.", {
        files: demoFiles.filter((f) => f.path.startsWith("/etc") || f.path.startsWith("/home") || f.path === "/root/.ssh/authorized_keys"),
      }, [
        { id: "shadow", severity: "critical", title: "/etc/shadow is 0644", detail: "Should be 000 or 640 root:shadow.", resource: "/etc/shadow" },
      ]);
    case "audit-ssh-authorized-keys":
      return pack(ctx, "Root authorized_keys contains hacker@evil.", {
        files: demoFiles.filter((f) => f.path.includes("authorized_keys")),
        extra: { comments: ["hacker@evil"] },
      }, [
        { id: "key", severity: "high", title: "Unexpected authorized key on root", detail: "comment=hacker@evil (public key fingerprint only, no private keys)." },
      ]);
    case "find-hidden-executables":
    case "find-backdoor-binaries":
      return pack(ctx, "Hidden shells and netcat-like binaries in temp/home.", {
        files: demoFiles.filter((f) => f.hidden || /nc|ncat|hidden_shell|kworker/i.test(f.path)),
        ports: demoPorts.filter((p) => p.port === 31337 || p.port === 4444),
      }, [
        { id: "hidden", severity: "critical", title: "Hidden SUID shell", detail: "/home/flag/.hidden_shell", resource: "/home/flag/.hidden_shell" },
      ]);
    case "list-installed-packages":
      return pack(ctx, `${demoPackages.length} sample packages.`, { packages: demoPackages });
    case "find-prohibited-software": {
      const bad = demoPackages.filter((p) => p.prohibited);
      return pack(ctx, `${bad.length} prohibited packages.`, { packages: bad }, bad.map((p) => ({
        id: `pkg:${p.name}`,
        severity: "high" as const,
        title: `Prohibited package ${p.name}`,
        detail: `${p.name} ${p.version ?? ""}`.trim(),
        resource: p.name,
        remediationOpId: "remove-package",
      })));
    }
    case "remove-package":
      return pack(ctx, mutateNote(ctx, `remove package`), { packages: demoPackages.filter((p) => !pkg || p.name === pkg) });
    case "audit-logging":
    case "check-auditd":
      return pack(ctx, "rsyslog/auditd are not enforcing in the demo image.", {
        extra: { rsyslog: "inactive", auditd: "inactive", watches: [] },
      }, [
        { id: "auditd", severity: "medium", title: "auditd inactive", detail: "Enable auditd for identity-file watches." },
      ]);
    case "check-pending-updates":
      return pack(ctx, "12 pending security updates; unattended-upgrades off.", {
        policy: { pendingSecurityUpdates: 12, unattendedUpgrades: false },
      }, [
        { id: "updates", severity: "medium", title: "12 pending security updates", detail: "Apply on the authorized image.", remediationOpId: "apply-security-updates" },
      ]);
    case "apply-security-updates":
      return pack(ctx, mutateNote(ctx, "apply security updates"), { extra: { wouldInstall: 12 } });
    case "audit-cron":
    case "audit-at-jobs":
      return pack(ctx, "Cron contains wget|sh and a /tmp payload.", {
        extra: { cron: demoCron, at: [{ user: "zygote", command: "python3 -c 'import socket,...'", suspicious: true }] },
      }, [
        { id: "wgetsh", severity: "critical", title: "root cron pipes wget to sh", detail: demoCron[0]?.command ?? "", remediationOpId: "audit-cron" },
      ]);
    case "list-scheduled-tasks":
      return pack(ctx, "Non-Microsoft task runs %TEMP%\\svc.exe.", {
        extra: { tasks: [{ name: "Updater", action: "%TEMP%\\svc.exe", author: "" }] },
        files: demoFiles.filter((f) => f.path.includes("Startup")),
      }, [
        { id: "task", severity: "high", title: "Scheduled task Updater", detail: "Payload under TEMP." },
      ]);
    case "audit-sysctl":
      return pack(ctx, "IP forwarding on, syncookies off.", { extra: { sysctl: demoSysctl } }, [
        { id: "forward", severity: "high", title: "net.ipv4.ip_forward=1", detail: "Workstations should not forward.", remediationOpId: "harden-sysctl" },
      ]);
    case "harden-sysctl":
      return pack(ctx, mutateNote(ctx, "write sysctl hardening drop-in"), {
        extra: { sysctl: { "net.ipv4.ip_forward": "0", "net.ipv4.tcp_syncookies": "1" } },
      });
    case "audit-startup-items":
      return pack(ctx, "rc.local and a hidden Startup payload.", {
        files: demoFiles.filter((f) => f.path.includes("kworker") || f.path.includes("Startup")),
        extra: { rcLocal: "/tmp/.kworker", runKey: "HKCU\\...\\Run\\update" },
      }, [
        { id: "rclocal", severity: "high", title: "rc.local launches /tmp/.kworker", detail: "Remove the plant." },
      ]);
    case "audit-powershell-logging":
      return pack(ctx, "Script Block Logging is off.", {
        extra: { ScriptBlockLogging: false, ModuleLogging: false, Transcription: false },
      }, [
        { id: "ps", severity: "low", title: "PowerShell ScriptBlockLogging disabled", detail: "Enable for local evidence." },
      ]);
    case "check-bitlocker-status":
      return pack(ctx, "BitLocker protection is off (recovery keys omitted).", {
        extra: { volumes: [{ mount: "C:", protection: "Off" }] },
      });
    case "export-evidence-bundle":
      return pack(ctx, "Redacted evidence bundle from demo fixtures (no hashes, no private keys).", {
        users: users.map(({ ...u }) => u),
        services: demoServices,
        ports: demoPorts,
        files: demoFiles.slice(0, 8),
        checksums: demoChecksums,
        extra: { notes: "Forensics write-up starter. Competition image only." },
      }, userFindings.slice(0, 5));
    case "one-click-hardening-checklist": {
      const items = checklist(ctx);
      const failed = items.filter((i) => i.status === "fail").length;
      return pack(ctx, `Checklist ${items.length} items, ${failed} failing. Read-only — no mutations.`, {
        checklist: items,
      }, items.filter((i) => i.status === "fail").map((i) => ({
        id: i.id,
        severity: "high" as const,
        title: i.title,
        detail: i.detail,
        remediationOpId: i.relatedOpId,
      })));
    }
    case "score-image-heuristics": {
      const { score, findings } = remainingWorkScore(ctx);
      return pack(ctx, `Remaining-work heuristic ${score}/100 (not the official CCS score).`, {
        extra: { remainingWork: score, drivers: findings.slice(0, 8).map((f) => f.title) },
        users: users.filter((u) => (u.suspicionScore ?? 0) >= 20),
        ports: demoPorts.filter((p) => p.suspicious),
        services: demoServices.filter((s) => s.risky && s.state === "running"),
      }, findings);
    }
    case "audit-shared-folders":
      return pack(ctx, "Guest-writable public share and C$ present.", {
        shares: demoShares,
      }, [
        { id: "public", severity: "high", title: "Share public allows guest write", detail: "/srv/public", resource: "public" },
      ]);
    default:
      return pack(
        ctx,
        `Demo fixture for ${ctx.op.title}.`,
        {
          users: ctx.op.category === "users" ? users : undefined,
          services: ctx.op.category === "services" ? demoServices : undefined,
          ports: ctx.op.category === "ports" ? demoPorts : undefined,
          files: ctx.op.category === "files" ? demoFiles : undefined,
        },
        findingsOf({}),
        [`No specialized demo handler; returned category fixtures for ${ctx.op.category}.`],
      );
  }
}

export function demoNow(): Date {
  return new Date(DEMO_NOW);
}

export function demoContext(op: OpDefinition, params: Record<string, unknown> = {}): EngineContext {
  return {
    repoRoot: "",
    now: demoNow(),
    params,
    confirm: false,
    op,
    mode: "demo",
  };
}
