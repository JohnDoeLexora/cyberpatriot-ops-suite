import type { OpDefinition } from "@cyberpatriot/ops-catalog";
import {
  findingsFromUnauthorized,
  findingsFromUsers,
  scoreUsers,
  selectUnauthorizedUsers,
} from "../heuristics/suspicious-users.js";
import { asBoolean, asString } from "../safety.js";
import type {
  ChecklistItem,
  EngineContext,
  Finding,
  RunData,
  RunResult,
} from "../types.js";
import { runCp10Demo } from "./cp10.js";
import {
  DEFAULT_DEMO_ADMINS,
  DEMO_NOW,
  demoAuditPolicy,
  demoAutoUpdates,
  demoBrowserBaseline,
  demoBrowserExtensions,
  demoChecksums,
  demoCron,
  demoDisplayManager,
  demoExpectedPorts,
  demoFail2ban,
  demoFiles,
  demoFtpConfig,
  demoGames,
  demoGroups,
  demoHostConf,
  demoHostsEntries,
  demoIdleLock,
  demoIis,
  demoMac,
  demoMalwareTools,
  demoNameResolution,
  demoNullSession,
  demoOptionalFeatures,
  demoPackages,
  demoPermDrift,
  demoPersistence,
  demoPolicy,
  demoPorts,
  demoReadmeHits,
  demoRemoteServices,
  demoRemoteTools,
  demoSecurityTemplate,
  demoServices,
  demoSfc,
  demoShareAcls,
  demoShares,
  demoShellBackdoors,
  demoSnmp,
  demoSysctl,
  demoSysprepFiles,
  demoTmpDirs,
  demoUsers,
  demoWebChecklist,
} from "./fixtures.js";

/** Default README allowlist used when no names are injected (browser demo fallback). */
export const DEFAULT_DEMO_ALLOWLIST = ["root", "alice", "bob", "coach", "Administrator"] as const;

function namesFromParam(raw: unknown, fallback: readonly string[]): Set<string> {
  if (Array.isArray(raw)) {
    const names = raw
      .filter((n): n is string => typeof n === "string")
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length) return new Set(names);
  }
  return new Set(fallback);
}

function allowlistFrom(ctx: EngineContext): Set<string> {
  return namesFromParam(ctx.params.allowlistNames, DEFAULT_DEMO_ALLOWLIST);
}

function adminsFrom(ctx: EngineContext): Set<string> {
  return namesFromParam(ctx.params.adminNames, DEFAULT_DEMO_ADMINS);
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

function statusCard(
  tone: "clear" | "watch" | "urgent" | "info" | "empty",
  facts: ReadonlyArray<readonly [string, string]>,
  table?: {
    title: string;
    columns: Array<{ key: string; label: string; mono?: boolean }>;
    rows: Array<Record<string, string>>;
  },
) {
  return {
    tone,
    facts: facts.map(([label, value]) => ({ label, value })),
    ...(table ? { table } : {}),
  };
}

const DEMO_FIREWALL_RULES = [
  { to: "22/tcp", action: "ALLOW IN", from: "Anywhere", family: "v4" },
  { to: "22/tcp", action: "ALLOW IN", from: "Anywhere (v6)", family: "v6" },
  { to: "80/tcp", action: "ALLOW IN", from: "Anywhere", family: "v4" },
  { to: "80/tcp", action: "ALLOW IN", from: "Anywhere (v6)", family: "v6" },
];

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
    {
      id: "never-expires",
      title: "No blank + never-expires combo",
      status: users.some((u) => u.passwordEmpty && u.passwordNeverExpires) ? "fail" : "pass",
      detail: "Guest (and games) have empty passwords that never expire",
      relatedOpId: "report-password-never-expires",
    },
    {
      id: "expected-ports",
      title: "Listeners match expected-ports baseline",
      status: demoPorts.some((p) => p.suspicious) ? "fail" : "pass",
      detail: "Unexpected 23/31337/445 vs config/expected-ports.txt",
      relatedOpId: "diff-expected-ports",
    },
    {
      id: "remote-access",
      title: "No remote-access tools",
      status: demoRemoteTools.length ? "fail" : "pass",
      detail: demoRemoteTools.map((t) => t.name).join(", "),
      relatedOpId: "hunt-remote-access-tools",
    },
    {
      id: "share-acls",
      title: "No guest/Everyone Full shares",
      status: demoShareAcls.some((s) => s.guest && s.writable) ? "fail" : "pass",
      detail: "public allows guest Full",
      relatedOpId: "audit-share-acls",
    },
    {
      id: "perm-drift",
      title: "Critical file modes match baseline",
      status: demoPermDrift.some((p) => p.drift) ? "fail" : "pass",
      detail: "/etc/shadow 0644 (expected 0640)",
      relatedOpId: "audit-critical-perm-drift",
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

  const cp10 = runCp10Demo(ctx);
  if (cp10) return cp10;

  switch (id) {
    case "list-users":
      return pack(ctx, `Demo inventory of ${users.length} local accounts (hashes omitted).`, { users }, []);
    case "flag-suspicious-users": {
      const sel = selectUnauthorizedUsers(users, allowlistFrom(ctx));
      return pack(
        ctx,
        `Heuristic pack flagged ${userFindings.length} accounts. Highest: ${userFindings[0]?.resource ?? "none"}.`,
        {
          users: users.filter((u) => (u.suspicionScore ?? 0) >= 10),
          extra: { unauthorizedNames: sel.names, missingAllowlist: sel.missingAllowlist },
        },
        userFindings,
      );
    }
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
      return pack(
        ctx,
        "Password policy from login.defs (no hashes): minimum length 8, maximum age 99999 days.",
        {
          policy: demoPolicy,
          report: statusCard("urgent", [
            ["Minimum length", "8"],
            ["Maximum age", "99999 days"],
            ["Minimum age", "0 days"],
            ["Warning", "7 days"],
          ]),
        },
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
    case "check-password-aging":
      return pack(
        ctx,
        "3 unlocked accounts have password aging disabled (hashes omitted).",
        {
          users: users.filter((u) => u.passwordNeverExpires && !u.locked),
          extra: { neverExpires: ["bob", "games", "Guest"] },
          report: statusCard("watch", [
            ["Unlocked without aging", "3"],
            ["Accounts", "bob, games, Guest"],
          ]),
        },
        [
          {
            id: "aging",
            severity: "medium",
            title: "Password aging disabled for bob, games, Guest",
            detail: "Hashes omitted.",
            remediationOpId: "enforce-password-policy",
          },
        ],
      );
    case "enforce-password-policy":
    case "enable-account-lockout":
      return pack(ctx, mutateNote(ctx, id.replace(/-/g, " ")), { policy: { ...demoPolicy, PASS_MIN_LEN: 14, PASS_MAX_DAYS: 90 } });
    case "audit-pam":
      return pack(ctx, "PAM allows empty passwords in 2 files", {
        extra: { nullok: true, faillock: false, pwquality: false },
        report: statusCard("urgent", [
          ["Files", "2"],
          ["nullok", "present"],
          ["faillock", "missing"],
        ]),
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
        report: statusCard("urgent", [
          ["Files", "2"],
          ["NOPASSWD", "present"],
          ["Unreadable", "none"],
        ]),
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
    case "disable-llmnr-netbios-wpad":
    case "harden-vsftpd":
    case "remove-games-samples":
      return pack(ctx, mutateNote(ctx, id.replace(/-/g, " ")), {
        services: demoServices.filter((s) => !service || s.name === service),
        packages: id === "remove-games-samples" ? demoGames : undefined,
        extra:
          id === "disable-llmnr-netbios-wpad"
            ? { before: demoNameResolution, after: { llmnr: false, netbios: "disabled", wpadAutoDetect: false } }
            : id === "harden-vsftpd"
              ? { before: demoFtpConfig, after: { anonymous_enable: "NO", write_enable: "NO", anon_upload_enable: "NO" } }
              : { simulated: true },
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
      return pack(ctx, "SSH root login is enabled; password auth is on", {
        policy: {
          PermitRootLogin: String(demoPolicy.PermitRootLogin),
          PermitEmptyPasswords: String(demoPolicy.PermitEmptyPasswords),
          X11Forwarding: String(demoPolicy.X11Forwarding),
          PasswordAuthentication: String(demoPolicy.PasswordAuthentication),
          Protocol: String(demoPolicy.Protocol),
        },
        report: statusCard("urgent", [
          ["PermitRootLogin", String(demoPolicy.PermitRootLogin)],
          ["PasswordAuthentication", String(demoPolicy.PasswordAuthentication)],
          ["PermitEmptyPasswords", String(demoPolicy.PermitEmptyPasswords)],
          ["X11Forwarding", String(demoPolicy.X11Forwarding)],
        ]),
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
      return pack(ctx, "NTP synced via systemd-timesyncd", {
        extra: { timesyncd: "active", ntpServer: "time.cloudflare.com", backend: "systemd-timesyncd" },
        report: statusCard("clear", [
          ["Synchronized", "yes"],
          ["NTP service", "active"],
          ["Backend", "systemd-timesyncd"],
          ["Time zone", "UTC"],
        ]),
      });
    case "audit-firewall":
    case "list-firewall-rules":
      return pack(ctx, "Firewall is on: default deny incoming, allow outgoing, 4 rules", {
        policy: { firewallEnabled: true, ufwStatus: "active", backend: "ufw", incoming: "deny", outgoing: "allow", routed: "disabled" },
        extra: { backend: "ufw", ruleCount: DEMO_FIREWALL_RULES.length },
        report: statusCard(
          "clear",
          [
            ["Backend", "ufw"],
            ["Status", "active"],
            ["Incoming", "deny"],
            ["Outgoing", "allow"],
            ["Routed", "disabled"],
          ],
          {
            title: "Rules",
            columns: [
              { key: "to", label: "To", mono: true },
              { key: "action", label: "Action" },
              { key: "from", label: "From", mono: true },
              { key: "family", label: "Family" },
            ],
            rows: DEMO_FIREWALL_RULES,
          },
        ),
      });
    case "enable-firewall":
    case "apply-default-deny-inbound":
      return pack(ctx, mutateNote(ctx, id.replace(/-/g, " ")), { policy: { firewallEnabled: true, ufwStatus: "active" } });
    case "find-world-writable":
      return pack(ctx, "5 world-writable files under /home, /etc, /opt, /tmp, /var, /usr/local", {
        files: demoFiles.filter((f) => f.worldWritable),
        report: statusCard("watch", [
          ["Checked", "/home, /etc, /opt, /tmp, /var, /usr/local"],
          ["Found", "5"],
        ]),
      }, demoFiles.filter((f) => f.worldWritable).map((f) => ({
        id: `ww:${f.path}`,
        severity: f.path.includes("sudoers") || f.path.includes("cron") ? "critical" as const : "high" as const,
        title: `World-writable ${f.path}`,
        detail: f.note ?? f.mode ?? "",
        resource: f.path,
      })));
    case "find-suid-sgid":
      return pack(ctx, "2 SUID/SGID files.", {
        files: demoFiles.filter((f) => f.suid || f.sgid),
        report: statusCard("watch", [
          ["Checked", "/"],
          ["Found", "2"],
        ]),
      }, demoFiles.filter((f) => f.suid && (f.path.startsWith("/tmp") || f.path.startsWith("/home"))).map((f) => ({
        id: `suid:${f.path}`,
        severity: "critical" as const,
        title: `Unexpected SUID ${f.path}`,
        detail: f.note ?? "",
        resource: f.path,
      })));
    case "find-media-files": {
      const media = demoFiles.filter((f) => /\.(mp3|mp4|wav|flac|ogg|avi|mkv|mov)$/i.test(f.path));
      return pack(ctx, `${media.length} prohibited media files.`, {
        files: media,
        report: statusCard(media.length ? "watch" : "empty", [
          ["Checked", "/home, /tmp, /var/tmp, /opt, /usr/local/share"],
          ["Found", String(media.length)],
        ]),
      }, media.map((f) => ({
        id: `media:${f.path}`,
        severity: "medium" as const,
        title: `Media file ${f.path}`,
        detail: "README typically forbids media on the image.",
        resource: f.path,
      })));
    }
    case "audit-home-permissions":
      return pack(ctx, "Sensitive files and homes have unsafe modes.", {
        files: demoFiles.filter((f) => f.path.startsWith("/etc") || f.path.startsWith("/home") || f.path === "/root/.ssh/authorized_keys"),
      }, [
        { id: "shadow", severity: "critical", title: "/etc/shadow is 0644", detail: "Should be 000 or 640 root:shadow.", resource: "/etc/shadow" },
      ]);
    case "check-sensitive-file-perms":
      return pack(ctx, "Checked 3 sensitive files; 2 are world-writable", {
        files: demoFiles.filter((f) => ["/etc/shadow", "/etc/sudoers", "/etc/sudoers.d/hack"].includes(f.path)),
        report: statusCard("urgent", [
          ["Checked", "3"],
          ["World-writable", "2"],
        ]),
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
      return pack(ctx, "3 hidden executables.", {
        files: demoFiles.filter((f) => f.hidden),
        report: statusCard("watch", [
          ["Checked", "/tmp, /var/tmp, /home, /opt"],
          ["Found", "3"],
        ]),
      }, [
        { id: "hidden", severity: "critical", title: "Hidden SUID shell", detail: "/home/flag/.hidden_shell", resource: "/home/flag/.hidden_shell" },
      ]);
    case "find-backdoor-binaries":
      return pack(ctx, "2 suspicious binaries.", {
        files: demoFiles.filter((f) => /\/nc$|\/ncat$|netcat|socat/i.test(f.path)),
        report: statusCard("watch", [
          ["Checked", "/tmp, /home, /opt, /usr/local"],
          ["Found", "2"],
        ]),
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
      return pack(ctx, "auditd is running; rsyslog is running", {
        extra: { rsyslog: "active", auditd: "active" },
        report: statusCard("clear", [
          ["auditd", "active"],
          ["rsyslog", "active"],
        ]),
      });
    case "check-auditd":
      return pack(ctx, "auditd is running with 12 rules", {
        extra: { auditd: "active", enabled: "enabled", rules: 12 },
        report: statusCard("clear", [
          ["Status", "active"],
          ["Boot", "enabled"],
          ["Rules", "12"],
        ]),
      });
    case "check-pending-updates":
      return pack(ctx, "12 pending security updates; unattended-upgrades off.", {
        policy: { pendingSecurityUpdates: 12, unattendedUpgrades: false },
      }, [
        { id: "updates", severity: "medium", title: "12 pending security updates", detail: "Apply on the authorized image.", remediationOpId: "apply-security-updates" },
      ]);
    case "apply-security-updates":
      return pack(ctx, mutateNote(ctx, "apply security updates"), { extra: { wouldInstall: 12 } });
    case "audit-cron":
      return pack(ctx, "Cron contains wget|sh and a /tmp payload.", {
        extra: { cron: demoCron },
        report: statusCard("urgent", [
          ["Cron entries", String(demoCron.length)],
          ["Suspicious", String(demoCron.filter((row) => row.suspicious).length)],
        ]),
      }, [
        { id: "wgetsh", severity: "critical", title: "root cron pipes wget to sh", detail: demoCron[0]?.command ?? "", remediationOpId: "audit-cron" },
      ]);
    case "audit-at-jobs":
      return pack(ctx, "1 at job is queued", {
        extra: { at: [{ user: "zygote", command: "python3 -c 'import socket,...'", suspicious: true }] },
        report: statusCard("info", [
          ["Queued", "1"],
          ["User", "zygote"],
        ]),
      }, [
        { id: "at", severity: "high", title: "at job for zygote", detail: "python3 socket payload. The command was not run.", remediationOpId: "restrict-cron-at" },
      ]);
    case "list-scheduled-tasks":
      return pack(ctx, "Non-Microsoft task runs %TEMP%\\svc.exe.", {
        extra: { tasks: [{ name: "Updater", action: "%TEMP%\\svc.exe", author: "" }] },
        files: demoFiles.filter((f) => f.path.includes("Startup")),
      }, [
        { id: "task", severity: "high", title: "Scheduled task Updater", detail: "Payload under TEMP." },
      ]);
    case "audit-sysctl":
      return pack(ctx, "Sysctl: forwarding on, syncookies off", {
        extra: { sysctl: demoSysctl },
        report: statusCard("urgent", [
          ["IP forwarding", "1"],
          ["TCP syncookies", "0"],
        ]),
      }, [
        { id: "forward", severity: "high", title: "net.ipv4.ip_forward=1", detail: "Workstations should not forward.", remediationOpId: "harden-sysctl" },
      ]);
    case "harden-sysctl":
      return pack(ctx, mutateNote(ctx, "write sysctl hardening drop-in"), {
        extra: { sysctl: { "net.ipv4.ip_forward": "0", "net.ipv4.tcp_syncookies": "1" } },
      });
    case "audit-startup-items":
      return pack(ctx, "Startup items include a suspicious rc.local", {
        files: demoFiles.filter((f) => f.path.includes("kworker") || f.path.includes("Startup")),
        extra: { rcLocal: "/tmp/.kworker", runKey: "HKCU\\...\\Run\\update" },
        report: statusCard("urgent", [
          ["rc.local", "/tmp/.kworker"],
          ["Enabled units", "1"],
        ]),
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
    case "package-forensics-evidence":
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
    case "diff-expected-ports": {
      const expected = new Set(demoExpectedPorts.map((e) => e.port));
      const unexpected = demoPorts.filter((p) => p.suspicious && !expected.has(p.port));
      const present = new Set(demoPorts.map((p) => p.port));
      const missing = demoExpectedPorts.filter((e) => !present.has(e.port));
      return pack(
        ctx,
        `${unexpected.length} unexpected listeners, ${missing.length} expected ports missing. Local diff only.`,
        {
          ports: demoPorts,
          extra: { expected: demoExpectedPorts, missing, accelerator: "demo" },
        },
        [
          ...unexpected.map((p) => ({
            id: `unexp:${p.port}`,
            severity: p.port === 31337 || p.port === 4444 ? "critical" as const : "high" as const,
            title: `Unexpected listener ${p.port}/${p.protocol}`,
            detail: p.reason ?? p.process ?? "",
            resource: `${p.port}/${p.protocol}`,
          })),
          ...missing.map((e) => ({
            id: `missing:${e.port}`,
            severity: "medium" as const,
            title: `Expected port ${e.port} not listening`,
            detail: "Required service may be down (not a remote scan).",
            resource: `${e.port}/${e.protocol}`,
          })),
        ],
      );
    }
    case "audit-share-acls":
      return pack(ctx, "Share ACLs include Everyone Full and guest write.", {
        shares: demoShares,
        extra: { acls: demoShareAcls },
      }, demoShareAcls.filter((s) => s.guest || s.rights === "Full").map((s) => ({
        id: `acl:${s.name}`,
        severity: "high" as const,
        title: `Share ${s.name} ${s.principal} ${s.rights}`,
        detail: s.path,
        resource: s.name,
      })));
    case "audit-persistence-deep":
      return pack(ctx, "Deep persistence audit found rc.local, cron plant, profile.d, and a Run key.", {
        extra: { persistence: demoPersistence },
        files: demoFiles.filter((f) => f.path.includes("kworker") || f.path.includes("Startup") || f.path.includes("cron")),
      }, demoPersistence.filter((p) => p.suspicious).map((p) => ({
        id: `pers:${p.source}`,
        severity: "high" as const,
        title: `Persistence: ${p.source}`,
        detail: p.payload,
        resource: p.source,
      })));
    case "hunt-remote-access-tools":
      return pack(ctx, `${demoRemoteTools.length} remote-access tools and ${demoBrowserExtensions.length} browser extension dirs.`, {
        extra: { tools: demoRemoteTools, extensions: demoBrowserExtensions },
        packages: demoRemoteTools.map((t) => ({ name: t.name, prohibited: true })),
        report: statusCard("watch", [
          ["Remote-access tools", String(demoRemoteTools.length)],
          ["Extension dirs", String(demoBrowserExtensions.length)],
        ]),
      }, [
        ...demoRemoteTools.map((t) => ({
          id: `rat:${t.name}`,
          severity: "high" as const,
          title: `Remote-access tool ${t.name}`,
          detail: t.path,
          resource: t.name,
          remediationOpId: "remove-package",
        })),
        ...demoBrowserExtensions.map((e) => ({
          id: `ext:${e.id}`,
          severity: "medium" as const,
          title: `${e.browser} extension ${e.id}`,
          detail: "Profile path only; extension source not dumped.",
          resource: e.id,
        })),
      ]);
    case "report-password-never-expires": {
      const never = users.filter((u) => u.passwordNeverExpires && u.interactive);
      const combo = never.filter((u) => u.passwordEmpty);
      return pack(
        ctx,
        `${combo.length} empty+never-expires accounts; ${never.length} never-expires humans (hashes omitted).`,
        { users: never },
        [
          ...combo.map((u) => ({
            id: `combo:${u.name}`,
            severity: "critical" as const,
            title: `Blank password never expires: ${u.name}`,
            detail: "Classification only; hash not returned.",
            resource: u.name,
            remediationOpId: u.name.toLowerCase() === "guest" ? "disable-guest-account" : "lock-user",
          })),
          ...never
            .filter((u) => !u.passwordEmpty)
            .map((u) => ({
              id: `never:${u.name}`,
              severity: "medium" as const,
              title: `Password never expires: ${u.name}`,
              detail: "MAX_DAYS 99999 / PasswordNeverExpires.",
              resource: u.name,
              remediationOpId: "enforce-password-policy",
            })),
        ],
      );
    }
    case "audit-critical-perm-drift":
      return pack(ctx, "Critical permission drift on shadow, sudoers, host key, and SAM ACL.", {
        files: demoFiles.filter((f) => /shadow|sudoers|authorized_keys/.test(f.path)),
        extra: { drift: demoPermDrift, note: "SAM contents not dumped; ACL classification only." },
        report: statusCard("urgent", [
          ["Checked", "/etc/passwd, /etc/shadow, /etc/sudoers, ssh host key"],
          ["Drift", String(demoPermDrift.filter((p) => p.drift).length)],
        ]),
      }, demoPermDrift.filter((p) => p.drift).map((p) => ({
        id: `drift:${p.path}`,
        severity: p.path.includes("shadow") || p.path.includes("SAM") ? "critical" as const : "high" as const,
        title: `${p.path} is ${p.mode}`,
        detail: `expected ${p.expected}`,
        resource: p.path,
      })));
    case "scoreboard-preflight": {
      const items = checklist(ctx).filter((i) =>
        ["firewall", "guest", "telnet", "allowlist-users", "expected-ports", "never-expires"].includes(i.id),
      ).concat([
        {
          id: "ccs-untouched",
          title: "Scoring server not contacted",
          status: "pass" as const,
          detail: "This op is local-only. CCS endpoints are never queried.",
          relatedOpId: "scoreboard-preflight",
        },
        {
          id: "ntp-pre",
          title: "Time synchronization configured",
          status: "fail" as const,
          detail: "timesyncd inactive in the demo fixture",
          relatedOpId: "check-ntp",
        },
      ]);
      return pack(ctx, `Preflight ${items.length} items. CCS not contacted.`, { checklist: items }, items.filter((i) => i.status === "fail").map((i) => ({
        id: i.id,
        severity: "high" as const,
        title: i.title,
        detail: i.detail,
        remediationOpId: i.relatedOpId,
      })));
    }
    case "post-harden-checklist": {
      const items = checklist(ctx);
      const failed = items.filter((i) => i.status === "fail").length;
      return pack(ctx, `Post-harden ${items.length} items, ${failed} still failing. Read-only verification.`, {
        checklist: items,
      }, items.filter((i) => i.status === "fail").map((i) => ({
        id: i.id,
        severity: "high" as const,
        title: i.title,
        detail: i.detail,
        remediationOpId: i.relatedOpId,
      })));
    }
    case "select-unauthorized-users": {
      const sel = selectUnauthorizedUsers(users, allowlistFrom(ctx));
      return pack(
        ctx,
        `${sel.names.length} unauthorized/extra-admin accounts selected for disable/lock (allowlist miss).`,
        {
          users: sel.unauthorized,
          extra: {
            unauthorizedNames: sel.names,
            extraAdmins: sel.extraAdmins.map((u) => u.name),
            missingAllowlist: sel.missingAllowlist,
          },
        },
        findingsFromUnauthorized(sel),
      );
    }
    case "audit-sticky-tmp": {
      const bad = demoTmpDirs.filter((f) => f.worldWritable && f.mode === "0777");
      return pack(
        ctx,
        `${bad.length} temp paths missing sticky bit (1777 expected on /tmp).`,
        {
          files: demoTmpDirs,
          report: statusCard(bad.length ? "urgent" : "empty", [
            ["Checked", "/tmp, /var/tmp, /dev/shm"],
            ["Found", String(bad.length)],
          ]),
        },
        bad.map((f) => ({
          id: `sticky:${f.path}`,
          severity: f.path === "/tmp" ? "critical" as const : "high" as const,
          title: `${f.path} is ${f.mode} (sticky missing)`,
          detail: f.note ?? "World-writable temp without sticky.",
          resource: f.path,
          remediationOpId: "audit-sticky-tmp",
        })),
      );
    }
    case "audit-anonymous-ftp":
      return pack(ctx, "Anonymous FTP is on", {
        services: demoServices.filter((s) => /ftp|vsftp/i.test(s.name)),
        ports: demoPorts.filter((p) => p.port === 21),
        extra: { vsftpd: demoFtpConfig },
        report: statusCard("urgent", [
          ["anonymous_enable", String(demoFtpConfig.anonymous_enable)],
          ["anon_upload_enable", String(demoFtpConfig.anon_upload_enable)],
          ["Config files", "1"],
        ]),
      }, [
        { id: "anon", severity: "high", title: "anonymous_enable=YES", detail: "/etc/vsftpd.conf", remediationOpId: "harden-vsftpd" },
        { id: "anonup", severity: "critical", title: "anon_upload_enable=YES", detail: "Anonymous can write.", remediationOpId: "harden-vsftpd" },
      ]);
    case "audit-web-server":
      return pack(ctx, `Web server config has ${demoWebChecklist.filter((item) => item.status === "fail").length} issues`, {
        checklist: demoWebChecklist,
        services: demoServices.filter((s) => /apache|nginx|httpd/i.test(s.name)),
        report: statusCard("watch", [
          ["Config files", "2"],
          ["Issues", String(demoWebChecklist.filter((i) => i.status === "fail").length)],
        ]),
      }, demoWebChecklist.filter((i) => i.status === "fail").map((i) => ({
        id: i.id,
        severity: "medium" as const,
        title: i.title,
        detail: i.detail,
        remediationOpId: "audit-web-server",
      })));
    case "audit-null-session":
      return pack(ctx, "Anonymous SAM / null session restrictions are off.", {
        extra: demoNullSession,
      }, [
        { id: "restrictanon", severity: "high", title: "RestrictAnonymous=0", detail: "Anonymous enumeration allowed.", remediationOpId: "audit-null-session" },
        { id: "sam", severity: "critical", title: "RestrictAnonymousSAM=0", detail: "Anonymous SAM access allowed. SAM not dumped.", remediationOpId: "audit-null-session" },
      ]);
    case "audit-idle-lock":
      return pack(ctx, "Shell idle lock is not set", {
        extra: demoIdleLock,
        report: statusCard("watch", [
          ["TMOUT", "unset"],
          ["IdleAction", String(demoIdleLock.IdleAction)],
        ]),
      }, [
        { id: "tmout", severity: "medium", title: "No TMOUT in profile", detail: "Shell idle timeout unset." },
        { id: "ss", severity: "high", title: "Screensaver is not secure", detail: "ScreenSaverIsSecure=0, timeout 9999." },
      ]);
    case "hunt-sysprep-leftovers":
      return pack(ctx, `${demoSysprepFiles.length} sysprep leftovers.`, {
        files: demoSysprepFiles,
        extra: { note: "AutoLogon/Password keys flagged by name only." },
        report: statusCard("watch", [
          ["Checked", "/home, /root, /tmp, /opt, /var/tmp"],
          ["Found", String(demoSysprepFiles.length)],
        ]),
      }, demoSysprepFiles.map((f) => ({
        id: `sysprep:${f.path}`,
        severity: "high" as const,
        title: `Sysprep leftover ${f.path}`,
        detail: f.note ?? "",
        resource: f.path,
      })));
    case "audit-snmp":
      return pack(ctx, "SNMP uses a default community", {
        services: demoServices.filter((s) => /snmp/i.test(s.name)),
        extra: demoSnmp,
        report: statusCard("urgent", [
          ["Communities", String(demoSnmp.communities.length)],
          ["Default names", "public, private"],
        ]),
      }, [
        { id: "public", severity: "high", title: "SNMP community public", detail: "Default read community.", remediationOpId: "disable-service" },
        { id: "private", severity: "critical", title: "SNMP community private", detail: "Default write community.", remediationOpId: "disable-service" },
      ]);
    case "audit-mac-enforcement":
      return pack(ctx, "SELinux is permissive; AppArmor has 1 enforcing profile and 3 complain profiles", {
        extra: demoMac,
        report: statusCard("watch", [
          ["SELinux", "permissive"],
          ["Enforcing profiles", String(demoMac.profilesEnforce)],
          ["Complain profiles", String(demoMac.profilesComplain)],
        ]),
      }, [
        { id: "selinux", severity: "high", title: "SELinux Permissive", detail: "Suggest enforcing after a README check." },
        { id: "aa", severity: "medium", title: "AppArmor complain profiles", detail: `${demoMac.profilesComplain} profiles not enforcing.` },
      ]);
    case "audit-browser-baseline":
      return pack(ctx, `${demoBrowserBaseline.length} Firefox baseline settings are weak (cookies not dumped)`, {
        extra: { checks: demoBrowserBaseline, note: "cookies/history/passwords not dumped" },
        report: statusCard("watch", [
          ["Settings", String(demoBrowserBaseline.length)],
          ["Cookies", "not dumped"],
        ]),
      }, demoBrowserBaseline.map((c) => ({
        id: c.id,
        severity: "medium" as const,
        title: c.title,
        detail: c.detail,
      })));
    case "audit-auto-updates":
      return pack(ctx, "Unattended upgrades are off", {
        extra: demoAutoUpdates,
        policy: { unattendedUpgrades: false, pendingSecurityUpdates: 12 },
        report: statusCard("watch", [
          ["Unattended-Upgrade", "0"],
        ]),
      }, [
        { id: "uu", severity: "medium", title: "unattended-upgrades off", detail: "APT::Periodic::Unattended-Upgrade 0", remediationOpId: "apply-security-updates" },
        { id: "wu", severity: "high", title: "wuauserv disabled / AUOptions=1", detail: "Windows Update never checks.", remediationOpId: "apply-security-updates" },
      ]);
    case "audit-iis":
      return pack(ctx, "IIS is installed with anonymous auth and directory browsing.", {
        extra: demoIis,
      }, [
        { id: "anon", severity: "high", title: "IIS anonymousAuthentication enabled", detail: "Disable unless the README requires a public site." },
        { id: "browse", severity: "medium", title: "IIS directoryBrowse enabled", detail: "Turn off directory listings." },
        { id: "samples", severity: "medium", title: "IIS sample apps present", detail: "Remove sample content.", remediationOpId: "remove-games-samples" },
      ]);
    case "skim-forensics-readme":
      return pack(ctx, `${demoReadmeHits.length} README keyword hits. CCS was not contacted.`, {
        extra: { hits: demoReadmeHits, ccsContacted: false, note: "Local files only. Hash-looking lines omitted." },
        report: statusCard("info", [
          ["Checked", "/home, /root, /opt, /tmp"],
          ["Found", String(demoReadmeHits.length)],
          ["CCS contacted", "no"],
        ]),
      }, demoReadmeHits.map((h) => ({
        id: `readme:${h.path}:${h.keyword}`,
        severity: "info" as const,
        title: `${h.keyword} in ${h.path}`,
        detail: h.line,
        resource: h.path,
      })));
    case "apply-security-template":
      return pack(ctx, mutateNote(ctx, "import secedit template cp-baseline.inf"), {
        extra: { template: demoSecurityTemplate, simulated: true },
      });
    case "import-firewall-profile":
      return pack(ctx, mutateNote(ctx, "apply known-good firewall profile (all on, block inbound)"), {
        policy: { firewallEnabled: true, ufwStatus: "active" },
        extra: {
          profiles: [
            { name: "Domain", enabled: true, inbound: "Block", outbound: "Allow" },
            { name: "Private", enabled: true, inbound: "Block", outbound: "Allow" },
            { name: "Public", enabled: true, inbound: "Block", outbound: "Allow" },
          ],
        },
      });
    case "enable-audit-policy":
      return pack(ctx, mutateNote(ctx, "enable Success+Failure audit policy"), {
        extra: {
          before: demoAuditPolicy,
          after: {
            "Account Logon": "Success and Failure",
            "Account Management": "Success and Failure",
            "Logon/Logoff": "Success and Failure",
            "Policy Change": "Success and Failure",
            "Privilege Use": "Success and Failure",
            System: "Success and Failure",
          },
        },
      });
    case "disable-remote-registry":
      return pack(ctx, mutateNote(ctx, "disable Remote Registry"), {
        services: [{ name: "RemoteRegistry", state: "stopped", enabled: false, platform: "windows" }],
        extra: { before: demoRemoteServices.RemoteRegistry },
      });
    case "disable-remote-assistance":
      return pack(ctx, mutateNote(ctx, "disable Remote Assistance"), {
        extra: { before: demoRemoteServices.RemoteAssistance, after: { fAllowToGetHelp: 0, fAllowFullControl: 0 } },
      });
    case "force-password-change": {
      const allow = allowlistFrom(ctx);
      const target = username;
      const bulk = users.filter(
        (u) =>
          allow.has(u.name) &&
          u.name !== "root" &&
          u.name !== "Administrator" &&
          u.interactive !== false,
      );
      const names = target ? [target] : bulk.map((u) => u.name);
      return pack(ctx, mutateNote(ctx, target ? `expire password for ${target}` : `bulk-expire ${names.join(", ")}`), {
        users: users.filter((u) => names.includes(u.name)),
        extra: { targets: names, bulk: !target, simulated: true },
      });
    }
    case "sync-authorized-users": {
      const allow = allowlistFrom(ctx);
      const admins = adminsFrom(ctx);
      const missing = ["dave"].filter((n) => ![...users].some((u) => u.name === n));
      const extras = users.filter(
        (u) =>
          (u.interactive || (u.uid != null && u.uid >= 1000) || u.name.toLowerCase() === "guest") &&
          !allow.has(u.name) &&
          u.name !== "root",
      );
      const extraAdmins = users.filter(
        (u) =>
          (u.uid === 0 || u.groups.some((g) => ["sudo", "wheel", "administrators"].includes(g.toLowerCase()))) &&
          !admins.has(u.name) &&
          u.name !== "root",
      );
      return pack(
        ctx,
        mutateNote(
          ctx,
          `create ${missing.join(", ") || "no missing users"}; flag ${extras.length} extras (passwords never invented)`,
        ),
        {
          users: extras,
          extra: {
            missingToCreate: missing,
            setPasswordManually: missing.map((name) => ({
              name,
              detail: `Created without a password. Set one manually (passwd ${name} / lusrmgr).`,
            })),
            extras: extras.map((u) => u.name),
            extraAdmins: extraAdmins.map((u) => u.name),
            allowedAdmins: [...admins],
            simulated: true,
          },
        },
        [
          ...missing.map((name) => ({
            id: `missing:${name}`,
            severity: "medium" as const,
            title: `Allowlist user missing: ${name}`,
            detail: "Would create without a password. Set password manually.",
            resource: name,
            remediationOpId: "sync-authorized-users",
          })),
          ...extras.map((u) => ({
            id: `extra:${u.name}`,
            severity: "high" as const,
            title: `Extra account not in allowlist: ${u.name}`,
            detail: "Flagged only — not auto-disabled.",
            resource: u.name,
            remediationOpId: "disable-user",
          })),
          ...extraAdmins.map((u) => ({
            id: `extraadmin:${u.name}`,
            severity: "high" as const,
            title: `Extra admin: ${u.name}`,
            detail: "Not in allowed-admins.txt.",
            resource: u.name,
            remediationOpId: "remove-user-from-admins",
          })),
        ],
      );
    }
    case "disable-optional-windows-features":
      return pack(ctx, mutateNote(ctx, "disable optional Windows features Telnet/TFTP/SMB1/SimpleTCP"), {
        extra: { features: demoOptionalFeatures, rebootRequired: true, simulated: true },
      });
    case "run-sfc-scan":
      return pack(
        ctx,
        `sfc /verifyonly: ${demoSfc.violations.length} integrity violations (report only, no repair).`,
        { extra: demoSfc },
        demoSfc.violations.map((v) => ({
          id: `sfc:${v.path}`,
          severity: "medium" as const,
          title: `SFC integrity violation ${v.path}`,
          detail: v.detail,
          resource: v.path,
        })),
      );
    case "clear-suspicious-hosts": {
      const drop = demoHostsEntries.filter((e) =>
        e.names.some((n) => /windowsupdate|google\.com|microsoft\.com/i.test(n)),
      );
      const keep = demoHostsEntries.filter((e) => !drop.includes(e));
      return pack(ctx, mutateNote(ctx, `drop ${drop.length} suspicious hosts-file lines`), {
        extra: { wouldDrop: drop, keep, simulated: true },
      }, drop.map((e) => ({
        id: `hosts:${e.names.join(",")}`,
        severity: "high" as const,
        title: `Sinkhole ${e.names.join(" ")} → ${e.ip}`,
        detail: "Would remove this hosts-file line.",
        resource: e.names[0],
      })));
    }
    case "disable-display-manager-guest":
      return pack(ctx, mutateNote(ctx, "disable LightDM/GDM guest and autologin"), {
        extra: {
          before: demoDisplayManager,
          after: {
            lightdmAllowGuest: false,
            lightdmAutologin: "",
            gdmAutomaticLoginEnable: false,
            gdmAutomaticLogin: "",
          },
        },
      });
    case "lock-root-account":
      return pack(ctx, mutateNote(ctx, "lock root password (passwd -l)"), {
        users: users.filter((u) => u.name === "root").map((u) => ({ ...u, locked: true })),
        extra: { target: "root", simulated: true },
      });
    case "enable-fail2ban":
      return pack(ctx, mutateNote(ctx, "install and enable fail2ban"), {
        extra: { before: demoFail2ban, after: { installed: true, active: true, packageAvailable: true } },
      });
    case "harden-host-conf":
      return pack(ctx, mutateNote(ctx, "write /etc/host.conf nospoof on"), {
        extra: { before: demoHostConf, after: { path: "/etc/host.conf", order: "hosts,bind", multi: "on", nospoof: "on" } },
      });
    case "set-ufw-logging":
      return pack(ctx, mutateNote(ctx, "ufw logging high + default deny incoming"), {
        policy: { firewallEnabled: true, ufwStatus: "active", ufwLogging: "high" },
        extra: { defaults: { incoming: "deny", outgoing: "allow", logging: "high" } },
      });
    case "restrict-cron-at":
      return pack(ctx, mutateNote(ctx, "restrict cron/at to root via cron.allow/at.allow"), {
        extra: { cronAllow: ["root"], atAllow: ["root"], wouldRemoveDeny: ["/etc/cron.deny", "/etc/at.deny"] },
      });
    case "hunt-shell-backdoors":
      return pack(
        ctx,
        `${demoShellBackdoors.length} shell backdoors in rc or profile files.`,
        {
          files: demoShellBackdoors,
          extra: { scorer: "demo" },
          report: statusCard("watch", [
            ["Checked", "/etc/profile, /etc/bash.bashrc, /root, /home"],
            ["Found", String(demoShellBackdoors.length)],
          ]),
        },
        demoShellBackdoors.map((f) => ({
          id: `shell:${f.path}`,
          severity: /sudo|wget|DownloadString/i.test(f.note ?? "") ? "critical" as const : "high" as const,
          title: `Shell backdoor ${f.path}`,
          detail: f.note ?? "",
          resource: f.path,
        })),
      );
    case "scan-malware-tools":
      return pack(ctx, mutateNote(ctx, "inventory clamav/chkrootkit; confirm would install then local-scan /home /tmp"), {
        extra: { ...demoMalwareTools, wouldInstall: ["clamav", "chkrootkit"], scanRoots: ["/home", "/tmp", "/opt"] },
      }, [
        {
          id: "clamav-absent",
          severity: "medium",
          title: "clamav not installed",
          detail: "dryRun inventory. confirm:true may install the distro package then scan locally.",
        },
      ]);
    case "round-start-wizard": {
      const items: ChecklistItem[] = [
        {
          id: "forensics",
          title: "1. Skim local README / forensics keywords",
          status: "fail",
          detail: `${demoReadmeHits.length} keyword hits on the image. CCS not contacted.`,
          relatedOpId: "skim-forensics-readme",
        },
        {
          id: "users",
          title: "2. Sync authorized users from allowlists",
          status: "fail",
          detail: "Extras (hacker123, toor, Guest, …) and missing dave. Do not invent passwords.",
          relatedOpId: "sync-authorized-users",
        },
        {
          id: "passwords",
          title: "3. Password policy + force change at next logon",
          status: "fail",
          detail: `min length ${demoPolicy.PASS_MIN_LEN}. Then force-password-change for README humans.`,
          relatedOpId: "enforce-password-policy",
        },
        {
          id: "firewall",
          title: "4. Firewall on, default-deny inbound, logging high",
          status: demoPolicy.firewallEnabled ? "pass" : "fail",
          detail: `ufw ${demoPolicy.ufwStatus}. Next: enable-firewall / apply-default-deny-inbound / set-ufw-logging.`,
          relatedOpId: "enable-firewall",
        },
        {
          id: "updates",
          title: "5. Security updates",
          status: Number(demoPolicy.pendingSecurityUpdates) > 0 ? "warn" : "pass",
          detail: `${demoPolicy.pendingSecurityUpdates} pending security updates.`,
          relatedOpId: "apply-security-updates",
        },
        {
          id: "prohibited",
          title: "6. Prohibited software",
          status: demoPackages.some((p) => p.prohibited) ? "fail" : "pass",
          detail: demoPackages.filter((p) => p.prohibited).map((p) => p.name).join(", ") || "None found",
          relatedOpId: "find-prohibited-software",
        },
      ];
      const failed = items.filter((i) => i.status === "fail").length;
      return pack(
        ctx,
        `Round-start wizard: ${items.length} sequenced steps, ${failed} failing. Read-only — open the related op to fix. CCS not contacted.`,
        { checklist: items, extra: { ccsContacted: false, sequence: items.map((i) => i.relatedOpId) } },
        items
          .filter((i) => i.status === "fail" || i.status === "warn")
          .map((i) => ({
            id: i.id,
            severity: i.status === "warn" ? ("medium" as const) : ("high" as const),
            title: i.title,
            detail: i.detail,
            remediationOpId: i.relatedOpId,
          })),
      );
    }
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
