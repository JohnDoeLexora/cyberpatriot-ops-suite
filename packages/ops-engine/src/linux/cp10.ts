import { mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { readNameList, resolveConfigFile } from "../paths.js";
import { asBoolean, asString, isSafeLocalPath } from "../safety.js";
import type { EngineContext, FileRecord, Finding, RunResult } from "../types.js";
import { collectLocalUsers, collectPorts, collectServices, existsSync, inspectPath, readText } from "./collect.js";
import { runCmd } from "./exec.js";
import { disableService, installPackages } from "./mutate.js";

type Finish = (
  ctx: EngineContext,
  startedAt: string,
  summary: string,
  data: RunResult["data"],
  findings?: Finding[],
  warnings?: string[],
  ok?: boolean,
  engine?: RunResult["engine"],
) => RunResult;

const DEFAULT_MODULE_BLACKLIST = [
  "dccp",
  "sctp",
  "rds",
  "tipc",
  "cramfs",
  "freevxfs",
  "jffs2",
  "hfs",
  "hfsplus",
  "udf",
  "firewire-core",
];

const AA_COMMON = ["apache2", "httpd", "mysqld", "mariadbd", "ntpd", "chronyd", "named", "dhcpd", "ping", "tcpdump", "usr.sbin.sshd"];

const SNAP_FLAG =
  /^(steam|discord|skype|zoom|wine|vlc|anydesk|teamviewer|spotify|minecraft|chromium-ffmpeg|firefox-esr-unofficial)$/i;

function writeDropIn(filePath: string, content: string, mode = 0o644): { ok: boolean; detail: string } {
  try {
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, content, { encoding: "utf8", mode });
    return { ok: true, detail: `wrote ${filePath}` };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : String(error) };
  }
}

function pickKv(blob: string, key: string): string | undefined {
  const re = new RegExp(`^\\s*${key}\\s*=\\s*(\\S+)`, "gim");
  const matches = [...blob.matchAll(re)];
  return matches.at(-1)?.[1]?.replace(/['"]/g, "");
}

function readMany(paths: string[]): string {
  return paths.map((p) => (existsSync(p) ? (readText(p) ?? "") : "")).join("\n");
}

function collectMail(): { extra: Record<string, unknown>; findings: Finding[] } {
  const findings: Finding[] = [];
  const postfix = readText("/etc/postfix/main.cf") ?? "";
  const exim = readText("/etc/exim4/exim4.conf.template") ?? readText("/etc/exim4/exim4.conf") ?? readText("/etc/exim.conf") ?? "";
  const dovecot = readMany(["/etc/dovecot/dovecot.conf", "/etc/dovecot/conf.d/10-auth.conf", "/etc/dovecot/conf.d/10-ssl.conf"]);
  const present = {
    postfix: Boolean(postfix) || existsSync("/usr/sbin/postfix"),
    exim: Boolean(exim) || existsSync("/usr/sbin/exim4") || existsSync("/usr/sbin/exim"),
    dovecot: Boolean(dovecot.trim()) || existsSync("/usr/sbin/dovecot"),
  };
  if (present.postfix) {
    const inet = pickKv(postfix, "inet_interfaces") ?? "all";
    const nets = pickKv(postfix, "mynetworks") ?? "";
    const vrfy = pickKv(postfix, "disable_vrfy_command") ?? "no";
    if (/all|0\.0\.0\.0/i.test(inet)) {
      findings.push({
        id: "postfix-inet",
        severity: "medium",
        title: `postfix inet_interfaces=${inet}`,
        detail: "Listening on all interfaces. Restrict to loopback if mail is not a required service.",
        remediationOpId: "disable-service",
      });
    }
    if (/0\.0\.0\.0\/0|::\/0/.test(nets)) {
      findings.push({
        id: "postfix-relay",
        severity: "critical",
        title: "Postfix mynetworks includes 0.0.0.0/0",
        detail: "Open relay. Local config only — mail was not sent.",
        remediationOpId: "disable-service",
      });
    }
    if (!/^yes$/i.test(vrfy)) {
      findings.push({
        id: "postfix-vrfy",
        severity: "medium",
        title: "postfix disable_vrfy_command is not yes",
        detail: `disable_vrfy_command=${vrfy}`,
      });
    }
  }
  if (present.dovecot && /disable_plaintext_auth\s*=\s*no/i.test(dovecot)) {
    findings.push({
      id: "dovecot-plain",
      severity: "high",
      title: "Dovecot disable_plaintext_auth=no",
      detail: "Plaintext auth allowed.",
    });
  }
  if (!present.postfix && !present.exim && !present.dovecot) {
    findings.push({
      id: "nomail",
      severity: "info",
      title: "No postfix/exim/dovecot config found",
      detail: "Mail stack absent — nothing to harden.",
    });
  }
  return { extra: { present, postfixInet: pickKv(postfix, "inet_interfaces") ?? null }, findings };
}

function collectDatabase(): { extra: Record<string, unknown>; findings: Finding[] } {
  const findings: Finding[] = [];
  const my = readMany([
    "/etc/mysql/my.cnf",
    "/etc/mysql/mysql.conf.d/mysqld.cnf",
    "/etc/mysql/mariadb.conf.d/50-server.cnf",
    "/etc/my.cnf",
  ]);
  const pg = readMany([
    "/etc/postgresql/16/main/postgresql.conf",
    "/etc/postgresql/15/main/postgresql.conf",
    "/etc/postgresql/14/main/postgresql.conf",
    "/var/lib/pgsql/data/postgresql.conf",
  ]);
  const hba = readMany([
    "/etc/postgresql/16/main/pg_hba.conf",
    "/etc/postgresql/15/main/pg_hba.conf",
    "/etc/postgresql/14/main/pg_hba.conf",
    "/var/lib/pgsql/data/pg_hba.conf",
  ]);
  const bind = pickKv(my, "bind-address") ?? pickKv(my, "bind_address");
  const skipGrant = /skip-grant-tables/i.test(my) || existsSync("/etc/systemd/system/mysql.service.d") || existsSync("/etc/systemd/system/mariadb.service.d");
  const listen = pickKv(pg, "listen_addresses");
  if (bind && bind !== "127.0.0.1" && bind !== "::1" && bind !== "localhost") {
    findings.push({
      id: "mysql-bind",
      severity: "high",
      title: `mysqld bind-address=${bind}`,
      detail: "Database listening beyond localhost. Passwords not printed; SQL was not queried.",
    });
  }
  if (skipGrant && /skip-grant-tables/i.test(my)) {
    findings.push({
      id: "skip-grant",
      severity: "critical",
      title: "skip-grant-tables set",
      detail: "MySQL auth bypass knob. SQL was not queried.",
    });
  }
  if (listen && listen !== "localhost" && listen !== "127.0.0.1") {
    findings.push({
      id: "pg-listen",
      severity: "high",
      title: `postgres listen_addresses=${listen}`,
      detail: "Postgres listening beyond localhost.",
    });
  }
  if (/host\s+all\s+all\s+0\.0\.0\.0\/0\s+trust/i.test(hba) || /host\s+all\s+all\s+::\/0\s+trust/i.test(hba)) {
    findings.push({
      id: "pg-trust",
      severity: "critical",
      title: "pg_hba trust from anywhere",
      detail: "host all all 0.0.0.0/0 trust. Do not probe remote DBs.",
    });
  }
  const present = {
    mysql: Boolean(my.trim()) || existsSync("/usr/sbin/mysqld") || existsSync("/usr/bin/mariadbd"),
    postgres: Boolean(pg.trim()) || existsSync("/usr/lib/postgresql") || existsSync("/usr/bin/postgres"),
  };
  if (!present.mysql && !present.postgres) {
    findings.push({ id: "nodb", severity: "info", title: "No MySQL/MariaDB/Postgres config found", detail: "Database stack absent." });
  }
  return {
    extra: { present, bindAddress: bind ?? null, listenAddresses: listen ?? null, note: "No SQL connections; config files only." },
    findings,
  };
}

function collectPhp(): { extra: Record<string, unknown>; findings: Finding[] } {
  const findings: Finding[] = [];
  const ini = readMany([
    "/etc/php/8.3/apache2/php.ini",
    "/etc/php/8.2/apache2/php.ini",
    "/etc/php/8.1/apache2/php.ini",
    "/etc/php/8.3/fpm/php.ini",
    "/etc/php/8.2/fpm/php.ini",
    "/etc/php.ini",
  ]);
  if (!ini.trim() && !existsSync("/usr/bin/php") && !existsSync("/usr/bin/php8.2")) {
    return { extra: { present: false }, findings: [{ id: "nophp", severity: "info", title: "PHP not installed", detail: "LAMP PHP stack absent." }] };
  }
  const expose = pickKv(ini, "expose_php") ?? "On";
  const display = pickKv(ini, "display_errors") ?? "Off";
  const include = pickKv(ini, "allow_url_include") ?? "Off";
  const fopen = pickKv(ini, "allow_url_fopen") ?? "On";
  const disable = pickKv(ini, "disable_functions") ?? "";
  if (/^(on|1)$/i.test(expose)) {
    findings.push({ id: "expose", severity: "medium", title: "expose_php=On", detail: "X-Powered-By leaks the PHP version." });
  }
  if (/^(on|1)$/i.test(display)) {
    findings.push({ id: "display", severity: "medium", title: "display_errors=On", detail: "Errors may leak paths." });
  }
  if (/^(on|1)$/i.test(include)) {
    findings.push({ id: "include", severity: "high", title: "allow_url_include=On", detail: "Remote include enabled. No exploit payload." });
  }
  const expected = ["exec", "passthru", "shell_exec", "system", "proc_open", "popen"];
  const missing = expected.filter((fn) => !new RegExp(`\\b${fn}\\b`, "i").test(disable));
  if (missing.length) {
    findings.push({
      id: "disable-fn",
      severity: "medium",
      title: "PHP disable_functions incomplete",
      detail: `Not disabled: ${missing.join(", ")}. Inventory only — not an exploit recipe.`,
    });
  }
  const infoPhp: string[] = [];
  for (const root of ["/var/www/html", "/var/www", "/srv/www", "/usr/share/nginx/html"]) {
    if (!existsSync(root)) continue;
    try {
      for (const name of readdirSync(root)) {
        if (/^info\.php$/i.test(name) || /^phpinfo\.php$/i.test(name)) infoPhp.push(path.join(root, name));
      }
    } catch {
      /* ignore */
    }
  }
  for (const p of infoPhp) {
    findings.push({
      id: `info:${p}`,
      severity: "medium",
      title: "phpinfo helper present",
      detail: `${p} (contents not dumped).`,
      resource: p,
    });
  }
  return { extra: { expose_php: expose, display_errors: display, allow_url_include: include, allow_url_fopen: fopen, disable_functions: disable, infoPhp }, findings };
}

async function collectSnapFlatpak(): Promise<{ extra: Record<string, unknown>; findings: Finding[]; packages: Array<{ name: string; prohibited?: boolean }> }> {
  const snap = await runCmd("snap", ["list"], 8000);
  const flatpak = await runCmd("flatpak", ["list", "--columns=application"], 8000);
  const apps: Array<{ kind: string; name: string; suspicious: boolean }> = [];
  for (const line of snap.stdout.split(/\r?\n/).slice(1)) {
    const name = line.trim().split(/\s+/)[0];
    if (!name || /^core\d*$/i.test(name) || name === "snapd" || name === "bare" || name === "gtk-common-themes") continue;
    apps.push({ kind: "snap", name, suspicious: SNAP_FLAG.test(name) || /game|steam|discord|anydesk|teamviewer/i.test(name) });
  }
  for (const line of flatpak.stdout.split(/\r?\n/)) {
    const name = line.trim();
    if (!name) continue;
    apps.push({
      kind: "flatpak",
      name,
      suspicious: /steam|discord|anydesk|teamviewer|vlc|skype|zoom|wine|minecraft/i.test(name),
    });
  }
  const findings: Finding[] = apps
    .filter((a) => a.suspicious)
    .map((a) => ({
      id: `${a.kind}:${a.name}`,
      severity: /anydesk|teamviewer|steam/i.test(a.name) ? ("high" as const) : ("medium" as const),
      title: `${a.kind} ${a.name}`,
      detail: "Flagged for authorized removal. This op does not uninstall.",
      resource: a.name,
      remediationOpId: "remove-package",
    }));
  if (snap.missing && flatpak.missing) {
    findings.push({ id: "none", severity: "info", title: "snap/flatpak tools not installed", detail: "Nothing to audit." });
  }
  return {
    extra: { apps, snapMissing: snap.missing, flatpakMissing: flatpak.missing },
    findings,
    packages: apps.filter((a) => a.suspicious).map((a) => ({ name: a.name, prohibited: true })),
  };
}

function collectIpv6(): { extra: Record<string, unknown>; findings: Finding[] } {
  const sys = (key: string) => {
    try {
      return readText(`/proc/sys/${key.replace(/\./g, "/")}`)?.trim() ?? null;
    } catch {
      return null;
    }
  };
  const extra = {
    use_tempaddr: sys("net.ipv6.conf.all.use_tempaddr"),
    accept_ra: sys("net.ipv6.conf.all.accept_ra"),
    forwarding: sys("net.ipv6.conf.all.forwarding"),
    disable_ipv6: sys("net.ipv6.conf.all.disable_ipv6"),
  };
  const findings: Finding[] = [];
  if (extra.use_tempaddr === "0") {
    findings.push({ id: "privacy", severity: "low", title: "IPv6 use_tempaddr=0", detail: "Privacy extensions off." });
  }
  if (extra.accept_ra === "1" && extra.forwarding === "1") {
    findings.push({
      id: "ra-fwd",
      severity: "medium",
      title: "accept_ra=1 and forwarding=1",
      detail: "Router advertisements accepted on a forwarding host.",
      remediationOpId: "harden-sysctl",
    });
  }
  return { extra, findings };
}

function collectLogPersistence(): { extra: Record<string, unknown>; findings: Finding[] } {
  const journald = readText("/etc/systemd/journald.conf") ?? "";
  const storage = pickKv(journald, "Storage") ?? "auto";
  const journalDir = existsSync("/var/log/journal");
  const rsyslog = existsSync("/etc/rsyslog.conf") || existsSync("/etc/rsyslog.d");
  const findings: Finding[] = [];
  if (/^volatile$/i.test(storage) || (!journalDir && /^auto$/i.test(storage))) {
    findings.push({
      id: "volatile",
      severity: "high",
      title: `journald Storage=${storage}`,
      detail: journalDir ? "Storage volatile." : "/var/log/journal missing — logs may not persist across reboot.",
    });
  }
  if (!rsyslog) {
    findings.push({ id: "rsyslog", severity: "low", title: "rsyslog config not found", detail: "File logging daemon may be absent." });
  }
  return { extra: { journaldStorage: storage, journalDir, rsyslogConfig: rsyslog }, findings };
}

function collectBrowserPolicy(): { extra: Record<string, unknown>; findings: Finding[] } {
  const findings: Finding[] = [];
  const policyPaths = [
    "/etc/firefox/policies/policies.json",
    "/usr/lib/firefox/distribution/policies.json",
    "/etc/firefox/syspref.js",
    "/etc/chromium/policies/managed/policy.json",
    "/etc/opt/chrome/policies/managed/policy.json",
  ];
  const blob = readMany(policyPaths);
  const homepage =
    blob.match(/"URL"\s*:\s*"([^"]+)"/i)?.[1] ??
    blob.match(/browser\.startup\.homepage["'\s,:=]+(\S+)/i)?.[1] ??
    null;
  const proxy =
    blob.match(/"HTTPProxy"\s*:\s*"([^"]+)"/i)?.[1] ??
    blob.match(/network\.proxy\.http["'\s,:=]+(\S+)/i)?.[1] ??
    null;
  if (homepage && /10\.|192\.168\.|pwn|hack|evil/i.test(homepage)) {
    findings.push({ id: "home", severity: "high", title: "Unexpected browser homepage", detail: homepage });
  }
  if (proxy) {
    findings.push({ id: "proxy", severity: "high", title: `Browser/system proxy ${proxy}`, detail: "PAC/cookies/passwords not dumped." });
  }
  const envProxy = process.env.http_proxy || process.env.HTTP_PROXY || process.env.https_proxy;
  if (envProxy) {
    findings.push({ id: "env-proxy", severity: "medium", title: "http_proxy environment set", detail: envProxy });
  }
  const aptProxy = readText("/etc/apt/apt.conf.d/01proxy") ?? readText("/etc/apt/apt.conf") ?? "";
  if (/Acquire::http::Proxy/i.test(aptProxy)) {
    findings.push({ id: "apt-proxy", severity: "medium", title: "APT HTTP proxy configured", detail: "Local apt config only." });
  }
  const extensionDirs: string[] = [];
  const homeRoot = "/home";
  if (existsSync(homeRoot)) {
    try {
      for (const user of readdirSync(homeRoot)) {
        const extRoots = [
          path.join(homeRoot, user, ".mozilla/firefox"),
          path.join(homeRoot, user, ".config/google-chrome"),
          path.join(homeRoot, user, ".config/chromium"),
        ];
        for (const root of extRoots) {
          if (!existsSync(root)) continue;
          extensionDirs.push(root);
        }
      }
    } catch {
      /* ignore */
    }
  }
  if (!blob.trim() && !findings.length) {
    findings.push({
      id: "nopolicy",
      severity: "info",
      title: "No system browser policy found",
      detail: "Cookies, history, and saved passwords are not dumped.",
    });
  }
  return {
    extra: { homepage, proxy: proxy ?? envProxy ?? null, policyPresent: Boolean(blob.trim()), extensionDirs, note: "Cookies, history, saved passwords, and extension source are not dumped." },
    findings,
  };
}

function collectTimeTimezone(): { extra: Record<string, unknown>; findings: Finding[] } {
  const tz = (readText("/etc/timezone") ?? "").trim() || (existsSync("/etc/localtime") ? "localtime-symlink" : "unknown");
  const timesyncd = readText("/etc/systemd/timesyncd.conf") ?? "";
  const chrony = readText("/etc/chrony/chrony.conf") ?? readText("/etc/chrony.conf") ?? "";
  const ntp = readText("/etc/ntp.conf") ?? "";
  const blob = `${timesyncd}\n${chrony}\n${ntp}`;
  const servers = [...blob.matchAll(/^\s*(?:NTP|server|pool)\s*=?\s*(\S+)/gim)].map((m) => m[1] ?? "").filter(Boolean);
  const findings: Finding[] = [];
  for (const s of servers) {
    if (/^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(s) || /evil|pwn|hack/i.test(s)) {
      findings.push({
        id: `ntp:${s}`,
        severity: "high",
        title: `Unexpected NTP server ${s}`,
        detail: "Local config only — not an NTP amplification test.",
        resource: s,
        remediationOpId: "check-ntp",
      });
    }
  }
  if (/Etc\/GMT\+|UTC\+|right\//i.test(tz) && !/UTC$/.test(tz)) {
    findings.push({ id: "tz", severity: "medium", title: `Timezone ${tz}`, detail: "Unusual timezone — confirm against the README." });
  }
  return { extra: { timezone: tz, ntpServers: servers }, findings };
}

async function collectCoachPacket(
  ctx: EngineContext,
): Promise<{ extra: Record<string, unknown>; findings: Finding[]; warnings: string[] }> {
  const { users } = collectLocalUsers();
  const { services } = await collectServices();
  const { ports } = await collectPorts();
  const redactedUsers = users.slice(0, 80).map((u) => ({
    name: u.name,
    uid: u.uid,
    groups: u.groups,
    locked: u.locked,
    enabled: u.enabled,
    passwordHidden: true as const,
  }));
  const summaryLines = [
    "# Coach packet",
    "",
    "Redacted authorized-image handoff. No hashes, no private keys, no Wi-Fi PSKs, no CCS URLs.",
    "",
    `- Users: ${users.length} (hashes omitted)`,
    `- Services: ${services.length}`,
    `- Listeners: ${ports.length}`,
    `- Generated: ${new Date().toISOString()}`,
    "",
  ];
  const files = ["SUMMARY.md", "findings.json", "users.json", "services.json", "ports.json", "NOTES.md"];
  const payload = {
    SUMMARY: summaryLines.join("\n"),
    findings: [] as Finding[],
    users: redactedUsers,
    services: services.slice(0, 80).map((s) => ({ name: s.name, state: s.state, enabled: s.enabled })),
    ports: ports.slice(0, 80).map((p) => ({ protocol: p.protocol, port: p.port, address: p.address, process: p.process })),
    NOTES: "Coach packet. Competition-legal. CCS not contacted.\n",
  };
  const warnings: string[] = [];
  let written: string | null = null;
  const requested = asString(ctx.params.outputDir);
  if (requested && !isSafeLocalPath(requested)) {
    warnings.push("outputDir rejected (must be a local filesystem path, not a URL/UNC)");
  } else {
    const dir = requested && isSafeLocalPath(requested) ? requested : path.join(os.tmpdir(), "cp-ops-coach-packet");
    try {
      mkdirSync(dir, { recursive: true });
      writeFileSync(path.join(dir, "SUMMARY.md"), payload.SUMMARY);
      writeFileSync(path.join(dir, "findings.json"), "[]\n");
      writeFileSync(path.join(dir, "users.json"), `${JSON.stringify(payload.users, null, 2)}\n`);
      writeFileSync(path.join(dir, "services.json"), `${JSON.stringify(payload.services, null, 2)}\n`);
      writeFileSync(path.join(dir, "ports.json"), `${JSON.stringify(payload.ports, null, 2)}\n`);
      writeFileSync(path.join(dir, "NOTES.md"), payload.NOTES);
      const zipPath = path.join(dir, "coach-packet.zip");
      const zip = await runCmd(
        "python3",
        ["-c", "import os,sys,zipfile; d=sys.argv[1]; z=sys.argv[2]; zf=zipfile.ZipFile(z,'w'); [zf.write(os.path.join(d,n),n) for n in os.listdir(d) if n.endswith(('.md','.json'))]; zf.close()", dir, zipPath],
        8000,
      );
      written = zip.code === 0 ? zipPath : dir;
      if (zip.code !== 0) warnings.push("zip helper failed; wrote unpacked files instead");
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : String(error));
    }
  }
  return {
    extra: {
      files,
      redacted: true,
      containsSecrets: false,
      ccsContacted: false,
      wifiKeysIncluded: false,
      hashesIncluded: false,
      written,
      note: "Coach handoff packet. Authorized-image only.",
    },
    findings: [],
    warnings,
  };
}

export async function runCp10Linux(
  ctx: EngineContext,
  startedAt: string,
  finish: Finish,
): Promise<RunResult | undefined> {
  const id = ctx.op.id;
  const dryRun = asBoolean(ctx.params.dryRun, false);

  switch (id) {
    case "audit-mail-services": {
      const { extra, findings } = collectMail();
      return finish(ctx, startedAt, findings.some((f) => f.severity === "critical") ? "Mail stack has open-relay/plaintext findings." : "Mail services audited.", { extra }, findings);
    }
    case "audit-database-bind": {
      const { extra, findings } = collectDatabase();
      return finish(ctx, startedAt, "Database bind-address / trust audit (no SQL, no passwords).", { extra }, findings);
    }
    case "audit-php-hardening": {
      const { extra, findings } = collectPhp();
      return finish(ctx, startedAt, "PHP/LAMP hardening audit (info.php contents omitted).", { extra }, findings);
    }
    case "audit-snap-flatpak": {
      const { extra, findings, packages } = await collectSnapFlatpak();
      return finish(ctx, startedAt, `${findings.filter((f) => f.severity !== "info").length} snap/flatpak leftovers flagged.`, { packages, extra }, findings);
    }
    case "audit-ipv6-privacy": {
      const { extra, findings } = collectIpv6();
      const disable = asBoolean(ctx.params.disableIPv6, false);
      if (!disable) {
        return finish(ctx, startedAt, "IPv6 privacy/forwarding audit (disable not requested).", { extra }, findings);
      }
      if (!dryRun && !ctx.confirm) {
        return finish(
          ctx,
          startedAt,
          "disableIPv6 requires confirm:true (or dryRun:true). Audit completed; IPv6 was not disabled.",
          { extra: { ...extra, disableRequested: true } },
          findings,
          ["Live IPv6 disable requires confirm:true. See docs/SAFETY.md."],
          false,
        );
      }
      const body =
        "net.ipv6.conf.all.disable_ipv6 = 1\nnet.ipv6.conf.default.disable_ipv6 = 1\nnet.ipv6.conf.lo.disable_ipv6 = 1\n";
      if (dryRun) {
        return finish(ctx, startedAt, "dry-run: would write sysctl to disable IPv6.", { extra: { ...extra, wouldWrite: body, dryRun: true } }, findings);
      }
      const written = writeDropIn("/etc/sysctl.d/99-cp-ipv6-disable.conf", body);
      await runCmd("sysctl", ["--system"], 8000);
      return finish(ctx, startedAt, written.ok ? "Wrote sysctl to disable IPv6." : written.detail, { extra: { ...extra, ...written } }, findings, written.ok ? [] : [written.detail], written.ok);
    }
    case "audit-log-persistence": {
      const { extra, findings } = collectLogPersistence();
      const rsyslog = await runCmd("systemctl", ["is-active", "rsyslog"], 4000);
      extra.rsyslogActive = rsyslog.stdout.trim();
      if (rsyslog.stdout.trim() !== "active") {
        findings.push({
          id: "rsyslog-inactive",
          severity: "medium",
          title: "rsyslog not active",
          detail: rsyslog.stdout.trim() || rsyslog.stderr.slice(0, 200),
          remediationOpId: "audit-logging",
        });
      }
      return finish(ctx, startedAt, "journald/rsyslog persistence audit.", { extra }, findings);
    }
    case "audit-browser-policy": {
      const { extra, findings } = collectBrowserPolicy();
      return finish(ctx, startedAt, "Browser homepage/proxy/extension-id audit (no cookies/passwords).", { extra }, findings);
    }
    case "audit-time-timezone": {
      const { extra, findings } = collectTimeTimezone();
      const timedate = await runCmd("timedatectl", ["status"], 5000);
      extra.timedatectl = timedate.stdout.slice(0, 1500);
      if (/NTP service:\s*inactive/i.test(timedate.stdout) || /System clock synchronized:\s*no/i.test(timedate.stdout)) {
        findings.push({
          id: "unsynced",
          severity: "medium",
          title: "Clock not NTP-synchronized",
          detail: "timedatectl reports NTP inactive or unsynced.",
          remediationOpId: "check-ntp",
        });
      }
      return finish(ctx, startedAt, "Time sync + timezone audit.", { extra }, findings);
    }
    case "export-coach-packet": {
      const { extra, findings, warnings } = await collectCoachPacket(ctx);
      return finish(
        ctx,
        startedAt,
        extra.written
          ? `Redacted coach packet written to ${extra.written}. CCS not contacted.`
          : "Redacted coach packet assembled in-memory (write skipped).",
        { extra },
        findings,
        warnings,
      );
    }
    case "blacklist-kernel-modules": {
      const usb = asBoolean(ctx.params.usbStorage, false);
      const listed = readNameList(resolveConfigFile(ctx.repoRoot, undefined, "config/kernel-module-blacklist.txt"));
      const mods = [...new Set([...(listed.length ? listed : DEFAULT_MODULE_BLACKLIST), ...(usb ? ["usb-storage"] : [])])];
      const body = mods.map((m) => `blacklist ${m}\ninstall ${m} /bin/true\n`).join("");
      if (dryRun) {
        return finish(ctx, startedAt, `dry-run: would blacklist ${mods.length} modules${usb ? " including usb-storage" : ""}.`, {
          extra: { modules: mods, usbStorage: usb, dryRun: true },
        });
      }
      const written = writeDropIn("/etc/modprobe.d/cp-blacklist.conf", body);
      return finish(
        ctx,
        startedAt,
        written.ok ? `Wrote blacklist for ${mods.length} modules.` : written.detail,
        { extra: { modules: mods, usbStorage: usb, ...written } },
        [],
        written.ok ? [] : [written.detail],
        written.ok,
      );
    }
    case "enforce-apparmor-profiles": {
      const status = await runCmd("aa-status", [], 5000);
      if (dryRun) {
        return finish(ctx, startedAt, "dry-run: would aa-enforce common daemon profiles if AppArmor is present.", {
          extra: { aaStatus: status.stdout.slice(0, 1500), missing: status.missing, dryRun: true },
        });
      }
      if (status.missing) {
        return finish(ctx, startedAt, "aa-status not installed; AppArmor enforce skipped.", { extra: { missing: true } }, [
          { id: "noaa", severity: "low", title: "AppArmor tools missing", detail: "Install apparmor-utils if the README expects MAC." },
        ]);
      }
      const results: Array<{ profile: string; code: number }> = [];
      for (const profile of AA_COMMON) {
        const r = await runCmd("aa-enforce", [profile], 5000);
        if (!r.missing) results.push({ profile, code: r.code });
      }
      return finish(
        ctx,
        startedAt,
        `aa-enforce attempted on ${results.length} common profiles.`,
        { extra: { results, aaStatus: status.stdout.slice(0, 1500) } },
      );
    }
    case "enable-unattended-upgrades": {
      if (dryRun) {
        const periodic = readText("/etc/apt/apt.conf.d/20auto-upgrades") ?? "";
        return finish(ctx, startedAt, "dry-run: would enable unattended-upgrades and write 20auto-upgrades.", {
          extra: { current: periodic, dryRun: true },
        });
      }
      const inst = await installPackages(["unattended-upgrades"]);
      const body = 'APT::Periodic::Update-Package-Lists "1";\nAPT::Periodic::Unattended-Upgrade "1";\n';
      const written = writeDropIn("/etc/apt/apt.conf.d/20auto-upgrades", body);
      const enable = await runCmd("systemctl", ["enable", "--now", "unattended-upgrades"], 8000);
      const ok = written.ok || inst.ok || enable.code === 0;
      return finish(
        ctx,
        startedAt,
        ok ? "unattended-upgrades enabled / 20auto-upgrades written." : "Could not enable unattended-upgrades (need root / apt?).",
        { extra: { install: inst, written, enable: enable.stdout || enable.stderr } },
        [],
        ok ? [] : [inst.detail, written.detail, enable.stderr].filter(Boolean),
        ok,
      );
    }
    case "disable-ctrl-alt-del": {
      if (dryRun) {
        return finish(ctx, startedAt, "dry-run: would mask ctrl-alt-del.target and disable serial-getty@ttyS0.", {
          extra: { dryRun: true },
        });
      }
      const mask = await runCmd("systemctl", ["mask", "ctrl-alt-del.target"], 5000);
      const serial = await disableService("serial-getty@ttyS0");
      const ok = mask.code === 0 || serial.ok;
      return finish(
        ctx,
        startedAt,
        ok ? "Masked ctrl-alt-del.target; extra serial getty disabled." : "Could not mask CAD (need root?).",
        { extra: { mask: mask.stdout || mask.stderr, serial } },
        [],
        ok ? [] : [mask.stderr, serial.detail].filter(Boolean),
        ok,
      );
    }
    case "harden-usb-storage": {
      const disableUsb = asBoolean(ctx.params.disableUsbStorage, false);
      const udev = [
        'ACTION=="add", SUBSYSTEM=="block", ENV{ID_USB_DRIVER}=="usb-storage", ENV{UDISKS_AUTO}="0", ENV{UDISKS_PRESENTATION_HIDE}="1"',
        "",
      ].join("\n");
      const gdm = "[org/gnome/desktop/media-handling]\nautomount=false\nautomount-open=false\n";
      if (dryRun) {
        return finish(ctx, startedAt, `dry-run: would disable USB automount${disableUsb ? " and blacklist usb-storage" : ""}.`, {
          extra: { disableUsbStorage: disableUsb, dryRun: true },
        });
      }
      const writes = [
        writeDropIn("/etc/udev/rules.d/99-cp-usb.rules", udev),
        writeDropIn("/etc/dconf/db/local.d/00-cp-usb", gdm),
      ];
      if (disableUsb) {
        writes.push(writeDropIn("/etc/modprobe.d/usb-storage.conf", "blacklist usb-storage\ninstall usb-storage /bin/true\n"));
      }
      const ok = writes.some((w) => w.ok);
      return finish(
        ctx,
        startedAt,
        ok ? "USB autorun/automount policy applied." : "Could not write USB policy (need root?).",
        { extra: { disableUsbStorage: disableUsb, writes } },
        [],
        ok ? [] : writes.map((w) => w.detail),
        ok,
      );
    }
    default:
      return undefined;
  }
}

export { inspectPath };
export type { FileRecord };
