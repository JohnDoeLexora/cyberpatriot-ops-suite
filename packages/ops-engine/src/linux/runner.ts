import { findingsFromUsers, scoreUsers } from "../heuristics/suspicious-users.js";
import { readNameList, resolveConfigFile } from "../paths.js";
import { asBoolean, asString, isSafeUsername } from "../safety.js";
import { SUSPICIOUS_PORTS, type EngineContext, type Finding, type RunResult, type ServiceRecord } from "../types.js";
import {
  collectLocalUsers,
  collectPorts,
  collectSensitivePerms,
  collectServices,
  enrichLastLogin,
  existsSync,
  findFiles,
  inspectPath,
  readKeyValueConfig,
  readText,
} from "./collect.js";
import { runCmd } from "./exec.js";
import {
  disableService as disableServiceLive,
  disableUser as disableUserLive,
  enableUfw,
  expirePassword,
  lockUser,
  removeFromSudo,
  removePackage,
  ufwDefaultDeny,
} from "./mutate.js";

function finish(
  ctx: EngineContext,
  startedAt: string,
  summary: string,
  data: RunResult["data"],
  findings: Finding[] = [],
  warnings: string[] = [],
  ok = true,
): RunResult {
  return {
    opId: ctx.op.id,
    title: ctx.op.title,
    category: ctx.op.category,
    platforms: ctx.op.platforms,
    risk: ctx.op.risk,
    mode: "live",
    ok,
    startedAt,
    finishedAt: new Date().toISOString(),
    summary,
    findings,
    data,
    warnings,
    engine: "linux",
  };
}

function loadList(ctx: EngineContext, param: unknown, rel: string): Set<string> {
  return new Set(readNameList(resolveConfigFile(ctx.repoRoot, param, rel)).map((s) => s.toLowerCase()));
}

function annotateServices(ctx: EngineContext, services: ServiceRecord[]): ServiceRecord[] {
  const required = loadList(ctx, undefined, "config/required-services.txt");
  const risky = loadList(ctx, undefined, "config/risky-services.txt");
  return services.map((s) => ({
    ...s,
    required: required.has(s.name.toLowerCase()),
    risky: risky.has(s.name.toLowerCase()),
  }));
}

async function liveUsers(ctx: EngineContext) {
  const collected = collectLocalUsers();
  await enrichLastLogin(collected.users);
  const allowlist = new Set(
    readNameList(resolveConfigFile(ctx.repoRoot, ctx.params.allowlistPath, "config/allowed-users.txt")),
  );
  const users = scoreUsers(collected.users, { allowlist, now: ctx.now });
  return { users, warnings: collected.warnings, findings: findingsFromUsers(users) };
}

export async function runLinux(ctx: EngineContext): Promise<RunResult> {
  const startedAt = new Date().toISOString();
  const id = ctx.op.id;
  const username = asString(ctx.params.username);
  const service = asString(ctx.params.service);
  const pkg = asString(ctx.params.package);
  const dryRun = asBoolean(ctx.params.dryRun, false);

  const failParam = (msg: string): RunResult =>
    finish(ctx, startedAt, msg, {}, [], [msg], false);

  switch (id) {
    case "list-users": {
      const { users, warnings } = await liveUsers(ctx);
      return finish(ctx, startedAt, `Listed ${users.length} local accounts (hashes omitted).`, { users }, [], warnings);
    }
    case "flag-suspicious-users": {
      const { users, warnings, findings } = await liveUsers(ctx);
      return finish(
        ctx,
        startedAt,
        `Heuristic pack scored ${users.length} accounts; ${findings.length} above threshold.`,
        { users: users.filter((u) => (u.suspicionScore ?? 0) >= 10) },
        findings,
        warnings,
      );
    }
    case "list-admin-users": {
      const { users, warnings, findings } = await liveUsers(ctx);
      const admins = users.filter(
        (u) =>
          u.uid === 0 ||
          u.groups.some((g) => ["sudo", "wheel", "admin", "root"].includes(g.toLowerCase())),
      );
      return finish(ctx, startedAt, `${admins.length} privileged accounts.`, { users: admins }, findings.filter((f) => admins.some((u) => u.name === f.resource)), warnings);
    }
    case "audit-uid-zero":
    case "audit-duplicate-uids": {
      const { users, warnings } = await liveUsers(ctx);
      const zeros = users.filter((u) => u.uid === 0);
      const counts = new Map<number, string[]>();
      for (const u of users) {
        if (u.uid == null) continue;
        const list = counts.get(u.uid) ?? [];
        list.push(u.name);
        counts.set(u.uid, list);
      }
      const dups = [...counts.entries()].filter(([, names]) => names.length > 1);
      const findings: Finding[] = zeros
        .filter((u) => u.name !== "root")
        .map((u) => ({
          id: `uid0:${u.name}`,
          severity: "critical" as const,
          title: `Non-root UID 0: ${u.name}`,
          detail: `home=${u.home} shell=${u.shell}`,
          resource: u.name,
          remediationOpId: "disable-user",
        }));
      for (const [uid, names] of dups) {
        if (uid === 0) continue;
        findings.push({
          id: `dup:${uid}`,
          severity: "high",
          title: `Duplicate UID ${uid}`,
          detail: names.join(", "),
        });
      }
      return finish(ctx, startedAt, `${zeros.length} UID 0 account(s); ${dups.length} duplicate UID group(s).`, { users: zeros }, findings, warnings);
    }
    case "check-empty-passwords": {
      const { users, warnings } = await liveUsers(ctx);
      const empty = users.filter((u) => u.passwordEmpty);
      return finish(
        ctx,
        startedAt,
        empty.length ? `${empty.length} empty-password accounts (hashes omitted).` : "No empty passwords detected (or shadow unreadable).",
        { users: empty },
        empty.map((u) => ({
          id: `empty:${u.name}`,
          severity: "high" as const,
          title: `Empty password: ${u.name}`,
          detail: "Classification only; hash not returned.",
          resource: u.name,
          remediationOpId: "lock-user",
        })),
        warnings,
      );
    }
    case "audit-never-logged-in": {
      const { users, warnings } = await liveUsers(ctx);
      const never = users.filter((u) => u.interactive && !u.lastLogin);
      return finish(ctx, startedAt, `${never.length} interactive accounts with no last login.`, { users: never }, never.map((u) => ({
        id: `nologin:${u.name}`,
        severity: "medium" as const,
        title: `Never logged in: ${u.name}`,
        detail: "No lastlog timestamp.",
        resource: u.name,
      })), warnings);
    }
    case "check-user-shells": {
      const { users, warnings } = await liveUsers(ctx);
      const odd = users.filter((u) => (u.signals ?? []).includes("nonstandard-shell"));
      return finish(ctx, startedAt, `${odd.length} unusual shells.`, { users }, odd.map((u) => ({
        id: `shell:${u.name}`,
        severity: "medium" as const,
        title: `Unusual shell: ${u.name}`,
        detail: u.shell ?? "",
        resource: u.name,
      })), warnings);
    }
    case "list-groups": {
      const text = readText("/etc/group") ?? "";
      const groups = text
        .split(/\r?\n/)
        .filter((l) => l && !l.startsWith("#"))
        .map((line) => {
          const [name, _pw, _gid, members] = line.split(":");
          return {
            name: name ?? "",
            members: (members ?? "").split(",").map((m) => m.trim()).filter(Boolean),
            privileged: ["sudo", "wheel", "admin", "root", "docker"].includes((name ?? "").toLowerCase()),
          };
        })
        .filter((g) => g.name);
      return finish(ctx, startedAt, `${groups.length} groups.`, { groups });
    }
    case "audit-password-policy":
    case "check-password-aging": {
      const loginDefs = readKeyValueConfig("/etc/login.defs");
      const findings: Finding[] = [];
      const minlen = Number(loginDefs.PASS_MIN_LEN ?? loginDefs.PASS_MIN_LEN);
      const maxDays = Number(loginDefs.PASS_MAX_DAYS);
      if (!Number.isNaN(maxDays) && maxDays > 365) {
        findings.push({
          id: "maxdays",
          severity: "medium",
          title: `PASS_MAX_DAYS=${maxDays}`,
          detail: "Aging is effectively disabled.",
          remediationOpId: "enforce-password-policy",
        });
      }
      if (!Number.isNaN(minlen) && minlen < 14) {
        findings.push({
          id: "minlen",
          severity: "high",
          title: `PASS_MIN_LEN=${minlen}`,
          detail: "Typical CP baseline is ≥14.",
          remediationOpId: "enforce-password-policy",
        });
      }
      return finish(ctx, startedAt, "Read /etc/login.defs (no hashes).", { policy: loginDefs }, findings);
    }
    case "audit-pam": {
      const files = ["/etc/pam.d/common-auth", "/etc/pam.d/system-auth", "/etc/pam.d/sshd"].filter(existsSync);
      const blobs = files.map((f) => `${f}:\n${readText(f) ?? ""}`).join("\n");
      const findings: Finding[] = [];
      if (/\bnullok\b/.test(blobs)) {
        findings.push({ id: "nullok", severity: "high", title: "PAM nullok present", detail: "Empty passwords may authenticate." });
      }
      if (!/pam_faillock|pam_tally2/.test(blobs)) {
        findings.push({ id: "faillock", severity: "medium", title: "No faillock/tally2", detail: "Enable lockout.", remediationOpId: "enable-account-lockout" });
      }
      return finish(ctx, startedAt, `Inspected ${files.length} PAM files.`, { extra: { files } }, findings);
    }
    case "audit-sudoers": {
      const files = collectSensitivePerms().filter((f) => f.path.includes("sudoers"));
      const sudoers = readText("/etc/sudoers") ?? "";
      const findings: Finding[] = [];
      if (/NOPASSWD/i.test(sudoers)) {
        findings.push({ id: "nopasswd", severity: "high", title: "NOPASSWD in sudoers", detail: "Review /etc/sudoers (contents not fully dumped)." });
      }
      for (const f of files) {
        if (f.worldWritable) {
          findings.push({ id: `ww:${f.path}`, severity: "critical", title: `World-writable ${f.path}`, detail: `mode ${f.mode}` });
        }
      }
      return finish(ctx, startedAt, "Audited sudoers permissions and NOPASSWD (no full dump of rules).", { files }, findings);
    }
    case "list-services": {
      const { services, warnings } = await collectServices();
      return finish(ctx, startedAt, `${services.length} services.`, { services: annotateServices(ctx, services) }, [], warnings);
    }
    case "flag-risky-services": {
      const { services, warnings } = await collectServices();
      const annotated = annotateServices(ctx, services).filter((s) => s.risky && (s.enabled || s.state === "running"));
      return finish(
        ctx,
        startedAt,
        `${annotated.length} risky services enabled/running.`,
        { services: annotated },
        annotated.map((s) => ({
          id: `svc:${s.name}`,
          severity: /telnet|rsh|rexec/i.test(s.name) ? "critical" as const : "high" as const,
          title: `Risky service ${s.name}`,
          detail: `${s.state} enabled=${s.enabled}`,
          resource: s.name,
          remediationOpId: "disable-service",
        })),
        warnings,
      );
    }
    case "audit-ftp-telnet": {
      const { services, warnings } = await collectServices();
      const { ports } = await collectPorts();
      const hits = annotateServices(ctx, services).filter((s) => /telnet|ftp|vsftpd|proftpd/i.test(s.name));
      const badPorts = ports.filter((p) => p.port === 21 || p.port === 23);
      return finish(ctx, startedAt, `FTP/Telnet services=${hits.length} listeners=${badPorts.length}.`, {
        services: hits,
        ports: badPorts,
      }, badPorts.map((p) => ({
        id: `ftp:${p.port}`,
        severity: "high" as const,
        title: `Port ${p.port} open`,
        detail: p.process ?? "",
        remediationOpId: p.port === 23 ? "disable-telnet" : "disable-service",
      })), warnings);
    }
    case "audit-smb": {
      const { services, warnings } = await collectServices();
      const hits = services.filter((s) => /smbd|nmbd|samba/i.test(s.name));
      return finish(ctx, startedAt, `${hits.length} SMB-related services.`, { services: hits }, [], warnings);
    }
    case "audit-listening-ports": {
      const { ports, warnings } = await collectPorts();
      const required = loadList(ctx, undefined, "config/required-services.txt");
      const findings: Finding[] = [];
      for (const p of ports) {
        p.suspicious = SUSPICIOUS_PORTS.includes(p.port);
        p.required = required.has((p.process ?? "").toLowerCase()) || p.port === 22 || p.port === 80 || p.port === 443;
        if (p.suspicious && !p.required) {
          findings.push({
            id: `port:${p.port}`,
            severity: p.port === 31337 || p.port === 4444 ? "critical" : "high",
            title: `Listener ${p.address}:${p.port}/${p.protocol}`,
            detail: p.process ?? "unknown process",
            resource: `${p.port}/${p.protocol}`,
          });
        }
      }
      return finish(ctx, startedAt, `${ports.length} listeners, ${findings.length} suspicious.`, { ports }, findings, warnings);
    }
    case "ssh-hardening-audit": {
      const cfg = readText("/etc/ssh/sshd_config") ?? "";
      const pick = (key: string) => {
        const matches = [...cfg.matchAll(new RegExp(`^\\s*${key}\\s+(\\S+)`, "gim"))];
        return matches.at(-1)?.[1];
      };
      const policy = {
        PermitRootLogin: pick("PermitRootLogin") ?? "unset",
        PermitEmptyPasswords: pick("PermitEmptyPasswords") ?? "unset",
        X11Forwarding: pick("X11Forwarding") ?? "unset",
        PasswordAuthentication: pick("PasswordAuthentication") ?? "unset",
        Protocol: pick("Protocol") ?? "unset",
      };
      const findings: Finding[] = [];
      if (/^yes$/i.test(policy.PermitRootLogin)) {
        findings.push({ id: "rootlogin", severity: "high", title: "PermitRootLogin yes", remediationOpId: "disable-root-ssh" });
      }
      if (/^yes$/i.test(policy.PermitEmptyPasswords)) {
        findings.push({ id: "empty", severity: "critical", title: "PermitEmptyPasswords yes", remediationOpId: "harden-sshd" });
      }
      return finish(ctx, startedAt, "Parsed sshd_config.", { policy }, findings, cfg ? [] : ["/etc/ssh/sshd_config missing"]);
    }
    case "audit-hosts-file": {
      const text = readText("/etc/hosts") ?? "";
      const findings: Finding[] = [];
      if (/windowsupdate|virustotal|microsoft\.com|avast|avg/i.test(text)) {
        findings.push({ id: "hosts", severity: "medium", title: "Suspicious hosts redirects", detail: "Hosts file mentions vendor/update names." });
      }
      return finish(ctx, startedAt, "Read /etc/hosts.", { extra: { hosts: text.split(/\r?\n/).slice(0, 40) } }, findings);
    }
    case "check-ntp": {
      const t = await runCmd("timedatectl", ["status"], 5000);
      const chrony = await runCmd("chronyc", ["tracking"], 5000);
      return finish(ctx, startedAt, "Time sync status.", {
        extra: { timedatectl: t.stdout.slice(0, 2000), chrony: chrony.stdout.slice(0, 1000) },
      });
    }
    case "audit-firewall":
    case "list-firewall-rules": {
      const ufw = await runCmd("ufw", ["status", "verbose"], 5000);
      const ipt = await runCmd("iptables", ["-S"], 5000);
      const findings: Finding[] = [];
      if (/Status:\s+inactive/i.test(ufw.stdout) || ufw.missing) {
        findings.push({ id: "fw", severity: "high", title: "Host firewall inactive or missing", remediationOpId: "enable-firewall" });
      }
      return finish(ctx, startedAt, "Firewall status.", {
        extra: { ufw: ufw.stdout.slice(0, 4000), iptables: ipt.stdout.split(/\r?\n/).slice(0, 80) },
      }, findings);
    }
    case "find-world-writable": {
      const files = await findFiles(
        ["/home", "/etc", "/opt", "/tmp", "/var", "/usr/local", "-xdev", "-perm", "-0002", "-type", "f"],
        "world-writable",
      );
      files.forEach((f) => {
        f.worldWritable = true;
      });
      return finish(ctx, startedAt, `${files.length} world-writable files (capped).`, { files }, files.slice(0, 25).map((f) => ({
        id: `ww:${f.path}`,
        severity: /sudoers|cron|passwd|shadow/i.test(f.path) ? "critical" as const : "medium" as const,
        title: f.path,
        resource: f.path,
      })));
    }
    case "find-suid-sgid": {
      const files = await findFiles(
        ["/", "-xdev", "(", "-perm", "-4000", "-o", "-perm", "-2000", ")", "-type", "f"],
        "suid/sgid",
      );
      files.forEach((f) => {
        f.suid = true;
      });
      const unexpected = files.filter((f) => !f.path.startsWith("/usr/") && !f.path.startsWith("/bin") && !f.path.startsWith("/sbin"));
      return finish(ctx, startedAt, `${files.length} SUID/SGID files, ${unexpected.length} outside /usr|/bin|/sbin.`, { files: files.slice(0, 150) }, unexpected.slice(0, 20).map((f) => ({
        id: `suid:${f.path}`,
        severity: "high" as const,
        title: `SUID/SGID ${f.path}`,
        resource: f.path,
      })));
    }
    case "find-media-files": {
      const files = await findFiles(
        [
          "/home",
          "/tmp",
          "/var/tmp",
          "/opt",
          "-type",
          "f",
          "(",
          "-iname",
          "*.mp3",
          "-o",
          "-iname",
          "*.mp4",
          "-o",
          "-iname",
          "*.avi",
          "-o",
          "-iname",
          "*.mkv",
          "-o",
          "-iname",
          "*.mov",
          "-o",
          "-iname",
          "*.flac",
          "-o",
          "-iname",
          "*.wav",
          "-o",
          "-iname",
          "*.ogg",
          ")",
        ],
        "media",
      );
      return finish(ctx, startedAt, `${files.length} media files.`, { files }, files.map((f) => ({
        id: `media:${f.path}`,
        severity: "medium" as const,
        title: `Media ${f.path}`,
        resource: f.path,
      })));
    }
    case "audit-home-permissions": {
      const { users } = collectLocalUsers();
      const files = users
        .filter((u) => u.home && existsSync(u.home))
        .map((u) => inspectPath(u.home!, { owner: u.name, note: "home" }))
        .filter((x): x is NonNullable<typeof x> => Boolean(x));
      const findings = files
        .filter((f) => f.worldWritable || f.mode === "0777" || f.mode === "777")
        .map((f) => ({
          id: `home:${f.path}`,
          severity: "high" as const,
          title: `Unsafe home ${f.path}`,
          detail: `mode ${f.mode}`,
          resource: f.path,
        }));
      return finish(ctx, startedAt, `Checked ${files.length} home directories.`, { files }, findings);
    }
    case "check-sensitive-file-perms": {
      const files = collectSensitivePerms();
      const findings: Finding[] = [];
      for (const f of files) {
        if (f.path.endsWith("shadow") && f.mode && !["0640", "0000", "0600", "0400"].includes(f.mode)) {
          findings.push({ id: "shadow", severity: "critical", title: `${f.path} mode ${f.mode}`, resource: f.path });
        }
        if (f.worldWritable) {
          findings.push({ id: `ww:${f.path}`, severity: "critical", title: `World-writable ${f.path}`, resource: f.path });
        }
      }
      return finish(ctx, startedAt, `Checked ${files.length} sensitive paths.`, { files }, findings);
    }
    case "audit-ssh-authorized-keys": {
      const { users } = collectLocalUsers();
      const files = [];
      for (const u of users) {
        const p = `${u.home}/.ssh/authorized_keys`;
        if (existsSync(p)) {
          const rec = inspectPath(p, { owner: u.name });
          if (rec) files.push(rec);
        }
      }
      return finish(ctx, startedAt, `${files.length} authorized_keys files (fingerprints not dumped wholesale).`, { files });
    }
    case "find-hidden-executables":
    case "find-backdoor-binaries": {
      const hidden = await findFiles(["/home", "/tmp", "/var/tmp", "-type", "f", "-name", ".*", "-perm", "-0111"], "hidden executable");
      const nc = await findFiles(["/tmp", "/home", "/opt", "/usr/local", "-type", "f", "(", "-name", "nc", "-o", "-name", "ncat", "-o", "-name", "netcat", "-o", "-name", "socat", ")"], "netcat-like");
      const files = [...hidden, ...nc];
      return finish(ctx, startedAt, `${files.length} suspicious binaries/hidden executables.`, { files }, files.slice(0, 20).map((f) => ({
        id: `bin:${f.path}`,
        severity: "high" as const,
        title: f.path,
        resource: f.path,
      })));
    }
    case "list-installed-packages":
    case "find-prohibited-software": {
      const dpkg = await runCmd("dpkg-query", ["-W", "-f=${Package}\t${Version}\n"], 15000);
      const prohibited = loadList(ctx, undefined, "config/prohibited-software.txt");
      const packages = dpkg.stdout
        .split(/\r?\n/)
        .filter(Boolean)
        .slice(0, 4000)
        .map((line) => {
          const [name, version] = line.split("\t");
          return { name: name ?? "", version, prohibited: prohibited.has((name ?? "").toLowerCase()) };
        })
        .filter((p) => p.name);
      const bad = packages.filter((p) => p.prohibited);
      const findings = id === "find-prohibited-software"
        ? bad.map((p) => ({
            id: `pkg:${p.name}`,
            severity: "high" as const,
            title: `Prohibited ${p.name}`,
            resource: p.name,
            remediationOpId: "remove-package",
          }))
        : [];
      return finish(
        ctx,
        startedAt,
        id === "find-prohibited-software" ? `${bad.length} prohibited packages.` : `${packages.length} packages.`,
        { packages: id === "find-prohibited-software" ? bad : packages.slice(0, 500) },
        findings,
        dpkg.missing ? ["dpkg-query missing"] : [],
      );
    }
    case "audit-logging":
    case "check-auditd": {
      const audit = await runCmd("systemctl", ["is-active", "auditd"]);
      const rsyslog = await runCmd("systemctl", ["is-active", "rsyslog"]);
      const findings: Finding[] = [];
      if (audit.stdout.trim() !== "active") {
        findings.push({ id: "auditd", severity: "medium", title: "auditd not active", detail: audit.stdout.trim() || audit.stderr });
      }
      return finish(ctx, startedAt, `auditd=${audit.stdout.trim() || "unknown"} rsyslog=${rsyslog.stdout.trim() || "unknown"}`, {
        extra: { auditd: audit.stdout.trim(), rsyslog: rsyslog.stdout.trim() },
      }, findings);
    }
    case "check-pending-updates": {
      const apt = await runCmd("apt-get", ["-s", "upgrade"], 30000);
      const lines = apt.stdout.split(/\r?\n/).filter((l) => /^Inst /.test(l));
      return finish(ctx, startedAt, apt.missing ? "apt-get not available" : `${lines.length} simulated upgrades pending.`, {
        extra: { pending: lines.slice(0, 40) },
      }, lines.length ? [{ id: "updates", severity: "medium", title: `${lines.length} packages would upgrade`, remediationOpId: "apply-security-updates" }] : []);
    }
    case "audit-cron":
    case "audit-at-jobs": {
      const crontab = readText("/etc/crontab") ?? "";
      const files = await findFiles(["/etc/cron.d", "/etc/cron.daily", "/var/spool/cron", "-type", "f"], "cron");
      const blob = crontab + files.map((f) => f.path).join("\n");
      const findings: Finding[] = [];
      if (/wget|curl.*\|.*sh|nc\s|-e\s\/bin\/sh/i.test(blob)) {
        findings.push({ id: "cronplant", severity: "critical", title: "Suspicious cron command patterns", detail: "wget/curl|sh or nc found in crontab text." });
      }
      const at = await runCmd("atq", [], 3000);
      return finish(ctx, startedAt, "Cron/at inventory.", { files, extra: { crontab: crontab.split(/\r?\n/).slice(0, 40), atq: at.stdout } }, findings);
    }
    case "audit-sysctl": {
      const keys = [
        "net.ipv4.ip_forward",
        "net.ipv4.tcp_syncookies",
        "net.ipv4.conf.all.accept_redirects",
        "net.ipv4.conf.all.rp_filter",
        "kernel.randomize_va_space",
        "kernel.dmesg_restrict",
      ];
      const extra: Record<string, string> = {};
      const findings: Finding[] = [];
      for (const key of keys) {
        const r = await runCmd("sysctl", ["-n", key], 3000);
        extra[key] = r.stdout.trim();
      }
      if (extra["net.ipv4.ip_forward"] === "1") {
        findings.push({ id: "forward", severity: "high", title: "ip_forward=1", remediationOpId: "harden-sysctl" });
      }
      if (extra["net.ipv4.tcp_syncookies"] === "0") {
        findings.push({ id: "syncookies", severity: "medium", title: "tcp_syncookies=0", remediationOpId: "harden-sysctl" });
      }
      return finish(ctx, startedAt, "sysctl snapshot.", { extra: { sysctl: extra } }, findings);
    }
    case "audit-startup-items": {
      const enabled = await runCmd("systemctl", ["list-unit-files", "--state=enabled", "--no-pager", "--no-legend"], 10000);
      const rc = existsSync("/etc/rc.local") ? readText("/etc/rc.local") ?? "" : "";
      const findings: Finding[] = [];
      if (/\/tmp\/|nc\s|python3?\s+-c/i.test(rc)) {
        findings.push({ id: "rclocal", severity: "high", title: "Suspicious /etc/rc.local", detail: "Looks like a temp-path or interpreter plant." });
      }
      return finish(ctx, startedAt, "Enabled units + rc.local.", { extra: { enabled: enabled.stdout.split(/\r?\n/).slice(0, 80), rcLocal: rc.slice(0, 1500) } }, findings);
    }
    case "audit-shared-folders": {
      const smb = readText("/etc/samba/smb.conf") ?? "";
      return finish(ctx, startedAt, smb ? "Read smb.conf (truncated)." : "No smb.conf.", {
        extra: { smb: smb.split(/\r?\n/).slice(0, 80) },
      }, /guest ok\s*=\s*yes/i.test(smb) ? [{ id: "guest", severity: "high", title: "Samba guest ok = yes" }] : []);
    }
    case "export-evidence-bundle":
    case "one-click-hardening-checklist":
    case "score-image-heuristics": {
      const { users, warnings, findings } = await liveUsers(ctx);
      const { services } = await collectServices();
      const { ports } = await collectPorts();
      const files = collectSensitivePerms();
      return finish(ctx, startedAt, `Live ${id} assembled from local collectors.`, {
        users: users.filter((u) => (u.suspicionScore ?? 0) >= 10).slice(0, 40),
        services: annotateServices(ctx, services).filter((s) => s.risky).slice(0, 40),
        ports: ports.slice(0, 40),
        files,
        extra: { note: "Redacted live evidence. No shadow hashes, no private keys." },
      }, findings.slice(0, 20), warnings);
    }
    case "disable-user":
    case "lock-user":
    case "remove-user-from-admins":
    case "expire-user-password":
    case "disable-guest-account": {
      const target = id === "disable-guest-account" ? "guest" : username;
      if (!target) return failParam("username is required");
      if (!isSafeUsername(target)) return failParam("username failed safety check");
      if (dryRun) {
        return finish(ctx, startedAt, `dry-run: would ${id} ${target}`, { extra: { target, dryRun: true } });
      }
      const action =
        id === "lock-user"
          ? await lockUser(target)
          : id === "remove-user-from-admins"
            ? await removeFromSudo(target)
            : id === "expire-user-password"
              ? await expirePassword(target)
              : await disableUserLive(target);
      return finish(ctx, startedAt, action.detail, { extra: { target, ...action } }, [], action.ok ? [] : [action.detail], action.ok);
    }
    case "disable-service":
    case "disable-telnet":
    case "disable-legacy-r-services": {
      const target =
        service ??
        (id === "disable-telnet" ? "telnet.socket" : id === "disable-legacy-r-services" ? "rsh.socket" : undefined);
      if (!target) return failParam("service is required");
      const required = loadList(ctx, undefined, "config/required-services.txt");
      if (required.has(target.toLowerCase()) && !asBoolean(ctx.params.force, false)) {
        return failParam(`${target} is in required-services.txt; pass force=true to override`);
      }
      if (dryRun) return finish(ctx, startedAt, `dry-run: would disable ${target}`, { extra: { target, dryRun: true } });
      const action = await disableServiceLive(target);
      return finish(ctx, startedAt, action.detail, { extra: action }, [], action.ok ? [] : [action.detail], action.ok);
    }
    case "enable-firewall": {
      if (dryRun) return finish(ctx, startedAt, "dry-run: would ufw --force enable", { extra: { dryRun: true } });
      const action = await enableUfw();
      return finish(ctx, startedAt, action.detail, { extra: action }, [], action.ok ? [] : [action.detail], action.ok);
    }
    case "apply-default-deny-inbound": {
      if (dryRun) return finish(ctx, startedAt, "dry-run: would ufw default deny incoming", { extra: { dryRun: true } });
      const action = await ufwDefaultDeny();
      return finish(ctx, startedAt, action.detail, { extra: action }, [], action.ok ? [] : [action.detail], action.ok);
    }
    case "remove-package": {
      if (!pkg) return failParam("package is required");
      const requiredPkgs = new Set(["openssh-server", "apache2", "sudo", "bash", "systemd"]);
      if (requiredPkgs.has(pkg) && !asBoolean(ctx.params.force, false)) {
        return failParam(`${pkg} looks required; pass force=true to override`);
      }
      if (dryRun) return finish(ctx, startedAt, `dry-run: would remove ${pkg}`, { extra: { package: pkg, dryRun: true } });
      const action = await removePackage(pkg);
      return finish(ctx, startedAt, action.detail, { extra: action }, [], action.ok ? [] : [action.detail], action.ok);
    }
    case "harden-sshd":
    case "disable-root-ssh":
    case "enforce-password-policy":
    case "enable-account-lockout":
    case "harden-sysctl":
    case "apply-security-updates": {
      const script = `${ctx.repoRoot}/engines/linux/${id}.sh`;
      if (dryRun) {
        return finish(ctx, startedAt, `dry-run: would execute ${script} (see engines/linux).`, { extra: { script, dryRun: true } });
      }
      const bash = await runCmd("bash", [script, "--confirm"], 60000);
      const ok = bash.code === 0;
      return finish(
        ctx,
        startedAt,
        ok ? `Ran ${script}` : `Failed ${script}`,
        { extra: { stdout: bash.stdout.slice(0, 4000), stderr: bash.stderr.slice(0, 2000) } },
        [],
        ok ? [] : [bash.stderr || `exit ${bash.code}`],
        ok,
      );
    }
    default: {
      if (ctx.op.platforms === "windows") {
        return finish(
          ctx,
          startedAt,
          "This op is Windows-only. Use engines/windows/*.ps1 on a Windows image.",
          {},
          [],
          [`No Linux live handler for ${id}`],
          false,
        );
      }
      const { users, warnings } = await liveUsers(ctx);
      return finish(
        ctx,
        startedAt,
        `No specialized Linux handler for ${id}; returned user inventory as a safe read fallback.`,
        { users: users.slice(0, 30) },
        [],
        [...warnings, `Unhandled live op ${id}`],
        true,
      );
    }
  }
}
