import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { readNameList } from "../paths.js";
import { isSafeLocalPath } from "../safety.js";
import type { ChecklistItem, FileRecord, Finding, ServiceRecord } from "../types.js";
import { existsSync, findFiles, inspectPath, readText } from "./collect.js";
import { runCmd } from "./exec.js";

const STICKY = 0o1000;

function octalMode(mode?: string): number {
  if (!mode) return 0;
  const n = Number.parseInt(mode, 8);
  return Number.isNaN(n) ? 0 : n;
}

function hasSticky(mode?: string): boolean {
  return (octalMode(mode) & STICKY) === STICKY;
}

function pickKv(blob: string, key: string): string | undefined {
  const re = new RegExp(`^\\s*${key}\\s*=\\s*(\\S+)`, "gim");
  const matches = [...blob.matchAll(re)];
  return matches.at(-1)?.[1];
}

function yes(value: string | undefined): boolean {
  return /^yes|on|1|true$/i.test(value ?? "");
}

export function collectStickyTmp(): {
  files: FileRecord[];
  findings: Finding[];
} {
  const mounts = ["/tmp", "/var/tmp", "/dev/shm"];
  const files: FileRecord[] = [];
  const findings: Finding[] = [];
  for (const p of mounts) {
    const rec = inspectPath(p, { note: "temp mount" });
    if (!rec) continue;
    files.push(rec);
    if (rec.worldWritable && rec.kind === "directory" && !hasSticky(rec.mode)) {
      findings.push({
        id: `sticky:${p}`,
        severity: p === "/tmp" ? "critical" : "high",
        title: `${p} is ${rec.mode} without sticky`,
        detail: "Expected 1777 (sticky) on shared temp dirs so users cannot delete each others' files.",
        resource: p,
      });
    }
  }
  return { files, findings };
}

export async function collectStickyTmpDeep(): Promise<{ files: FileRecord[]; findings: Finding[] }> {
  const base = collectStickyTmp();
  const extra = await findFiles(
    ["/tmp", "/var/tmp", "/dev/shm", "-xdev", "-perm", "-0002", "-type", "d"],
    "world-writable temp dir",
  );
  const seen = new Set(base.files.map((f) => f.path));
  for (const f of extra) {
    if (seen.has(f.path)) continue;
    const rec = inspectPath(f.path, { note: f.note }) ?? f;
    rec.worldWritable = true;
    base.files.push(rec);
    seen.add(rec.path);
    if (!hasSticky(rec.mode)) {
      base.findings.push({
        id: `wwtmp:${rec.path}`,
        severity: "high",
        title: `World-writable temp dir ${rec.path}`,
        detail: `mode ${rec.mode ?? "unknown"} missing sticky`,
        resource: rec.path,
      });
    }
  }
  return base;
}

export function collectAnonymousFtp(services: ServiceRecord[]): {
  extra: Record<string, unknown>;
  findings: Finding[];
} {
  const paths = ["/etc/vsftpd.conf", "/etc/vsftpd/vsftpd.conf", "/etc/proftpd/proftpd.conf", "/etc/pure-ftpd/pure-ftpd.conf"];
  const present = paths.filter(existsSync);
  const blobs = present.map((p) => `${p}\n${readText(p) ?? ""}`).join("\n");
  const cfg = {
    configFiles: present,
    anonymous_enable: pickKv(blobs, "anonymous_enable") ?? pickKv(blobs, "Anonymous"),
    write_enable: pickKv(blobs, "write_enable"),
    anon_upload_enable: pickKv(blobs, "anon_upload_enable"),
    chroot_local_user: pickKv(blobs, "chroot_local_user"),
    ssl_enable: pickKv(blobs, "ssl_enable"),
  };
  const findings: Finding[] = [];
  if (yes(cfg.anonymous_enable) || /Anonymous\s+yes/i.test(blobs) || /<Anonymous/i.test(blobs)) {
    findings.push({
      id: "anonftp",
      severity: "high",
      title: "Anonymous FTP enabled",
      detail: "anonymous_enable/Anonymous is on. Harden or disable unless the README requires FTP.",
      remediationOpId: "harden-vsftpd",
    });
  }
  if (yes(cfg.anon_upload_enable) || yes(cfg.write_enable) && yes(cfg.anonymous_enable)) {
    findings.push({
      id: "anonupload",
      severity: "critical",
      title: "Anonymous FTP write/upload enabled",
      detail: "anon_upload_enable or write_enable with anonymous.",
      remediationOpId: "harden-vsftpd",
    });
  }
  const ftpSvc = services.filter((s) => /vsftpd|proftpd|pure-ftpd|ftpd/i.test(s.name) && (s.enabled || s.state === "running"));
  if (ftpSvc.length && findings.length === 0 && present.length === 0) {
    findings.push({
      id: "ftpd",
      severity: "medium",
      title: `FTP service ${ftpSvc.map((s) => s.name).join(", ")} is enabled`,
      detail: "Config not found; still review anonymous settings.",
      remediationOpId: "audit-anonymous-ftp",
    });
  }
  return { extra: { vsftpd: cfg, ftpServices: ftpSvc.map((s) => s.name) }, findings };
}

export function collectWebServer(): { checklist: ChecklistItem[]; findings: Finding[] } {
  const files = [
    "/etc/apache2/apache2.conf",
    "/etc/apache2/httpd.conf",
    "/etc/httpd/conf/httpd.conf",
    "/etc/apache2/conf-enabled/security.conf",
    "/etc/apache2/sites-enabled/000-default.conf",
    "/etc/nginx/nginx.conf",
    "/etc/nginx/sites-enabled/default",
  ].filter(existsSync);
  const blob = files.map((p) => readText(p) ?? "").join("\n");
  const items: ChecklistItem[] = [];
  const add = (id: string, title: string, fail: boolean, detail: string) => {
    items.push({
      id,
      title,
      status: fail ? "fail" : files.length ? "pass" : "info",
      detail,
      relatedOpId: "audit-web-server",
    });
  };
  add("indexes", "Directory listings disabled", /Options\s+[^#\n]*Indexes/i.test(blob) && !/Options\s+[^#\n]*-Indexes/i.test(blob), "Options Indexes");
  add("servertokens", "ServerTokens Prod", /ServerTokens\s+(OS|Full|Major|Minor)/i.test(blob), "ServerTokens not Prod");
  add("signature", "ServerSignature Off", /ServerSignature\s+On/i.test(blob), "ServerSignature On");
  add("autoindex", "nginx autoindex off", /autoindex\s+on/i.test(blob), "autoindex on");
  add("tls", "No SSLv3/TLSv1", /SSLProtocol[^\n]*(SSLv3|TLSv1)(?!\.2|\.3)/i.test(blob) || /ssl_protocols[^\n]*(SSLv3|TLSv1)(?![\.2]|[\.3])/i.test(blob), "Legacy TLS still listed");
  add("trace", "TraceEnable Off", /TraceEnable\s+On/i.test(blob), "TraceEnable On");
  if (!files.length) {
    items.push({
      id: "noweb",
      title: "Apache/nginx config present",
      status: "info",
      detail: "No apache/nginx config found on this image.",
      relatedOpId: "list-services",
    });
  }
  const findings: Finding[] = items
    .filter((i) => i.status === "fail")
    .map((i) => ({
      id: i.id,
      severity: i.id === "tls" ? "high" as const : "medium" as const,
      title: i.title,
      detail: i.detail,
      remediationOpId: "audit-web-server",
    }));
  return { checklist: items, findings };
}

export function collectIdleLock(): { extra: Record<string, unknown>; findings: Finding[] } {
  const profile = [readText("/etc/profile"), readText("/etc/bash.bashrc"), readText("/etc/profile.d/tmout.sh")]
    .filter(Boolean)
    .join("\n");
  const logind = readText("/etc/systemd/logind.conf") ?? "";
  const tmout = profile.match(/\bTMOUT\s*=\s*(\d+)/)?.[1];
  const idleAction = logind.match(/^\s*IdleAction\s*=\s*(\S+)/m)?.[1] ?? "unset";
  const idleSec = logind.match(/^\s*IdleActionSec\s*=\s*(\S+)/m)?.[1];
  const findings: Finding[] = [];
  if (!tmout || Number(tmout) <= 0 || Number(tmout) > 900) {
    findings.push({
      id: "tmout",
      severity: "medium",
      title: "Shell TMOUT not set to a short idle lock",
      detail: tmout ? `TMOUT=${tmout}` : "TMOUT unset in /etc/profile",
    });
  }
  if (!/lock|sleep|hybrid-sleep/i.test(idleAction)) {
    findings.push({
      id: "idleaction",
      severity: "medium",
      title: `logind IdleAction=${idleAction}`,
      detail: "Workstation images typically lock or sleep on idle.",
    });
  }
  return { extra: { TMOUT: tmout ?? null, IdleAction: idleAction, IdleActionSec: idleSec ?? null }, findings };
}

export async function collectSysprepLeftovers(): Promise<{ files: FileRecord[]; findings: Finding[] }> {
  const named = [
    "/root/unattend.xml",
    "/root/autounattend.xml",
    "/root/sysprep.xml",
    "/unattend.xml",
    "/autounattend.xml",
  ];
  const files: FileRecord[] = [];
  for (const p of named) {
    const rec = inspectPath(p, { note: "sysprep leftover" });
    if (rec) files.push(rec);
  }
  const found = await findFiles(
    [
      "/home",
      "/root",
      "/tmp",
      "/opt",
      "/var/tmp",
      "-xdev",
      "-maxdepth",
      "4",
      "(",
      "-iname",
      "*unattend*",
      "-o",
      "-iname",
      "*sysprep.xml",
      "-o",
      "-iname",
      "ks.cfg",
      ")",
    ],
    "sysprep leftover",
  );
  const seen = new Set(files.map((f) => f.path));
  for (const f of found) {
    if (!seen.has(f.path)) {
      files.push(f);
      seen.add(f.path);
    }
  }
  const findings: Finding[] = [];
  for (const f of files) {
    const text = readText(f.path) ?? "";
    const keys: string[] = [];
    if (/AutoLogon/i.test(text)) keys.push("AutoLogon");
    if (/Password/i.test(text)) keys.push("Password");
    if (/AdministratorPassword/i.test(text)) keys.push("AdministratorPassword");
    findings.push({
      id: `sysprep:${f.path}`,
      severity: "high",
      title: `Unattend/sysprep leftover ${f.path}`,
      detail: keys.length ? `Contains ${keys.join(", ")} keys (values omitted).` : "Leftover answer file.",
      resource: f.path,
    });
  }
  return { files, findings };
}

export function collectSnmp(services: ServiceRecord[]): { extra: Record<string, unknown>; findings: Finding[] } {
  const cfg = readText("/etc/snmp/snmpd.conf") ?? readText("/etc/snmpd.conf") ?? "";
  const communities: string[] = [];
  for (const m of cfg.matchAll(/\b(?:rocommunity|rwcommunity|com2sec)\s+(\S+)/gi)) {
    const name = (m[1] ?? "").replace(/['"]/g, "");
    if (name && !communities.includes(name)) communities.push(name);
  }
  const svc = services.filter((s) => /snmp/i.test(s.name) && (s.enabled || s.state === "running"));
  const findings: Finding[] = [];
  for (const c of communities) {
    if (/^(public|private|snmp)$/i.test(c)) {
      findings.push({
        id: `comm:${c}`,
        severity: /^private$/i.test(c) ? "critical" : "high",
        title: `SNMP default community ${c}`,
        detail: "Default community string. Do not use it against other hosts — disable/change on this image.",
        remediationOpId: "disable-service",
      });
    }
  }
  if (svc.length && !cfg) {
    findings.push({
      id: "snmpd",
      severity: "medium",
      title: "SNMP service enabled",
      detail: svc.map((s) => s.name).join(", "),
      remediationOpId: "disable-service",
    });
  }
  return { extra: { communities, services: svc.map((s) => s.name), hasConfig: Boolean(cfg) }, findings };
}

export async function collectMacEnforcement(): Promise<{ extra: Record<string, unknown>; findings: Finding[] }> {
  const getenforce = await runCmd("getenforce", [], 4000);
  const sestatus = await runCmd("sestatus", [], 4000);
  const aa = await runCmd("aa-status", [], 4000);
  const selinux = (getenforce.stdout.trim() || sestatus.stdout.match(/Current mode:\s+(\S+)/i)?.[1] || "unknown").replace(/\s+/g, " ");
  const findings: Finding[] = [];
  if (/permissive|disabled/i.test(selinux)) {
    findings.push({
      id: "selinux",
      severity: /disabled/i.test(selinux) ? "high" : "medium",
      title: `SELinux ${selinux}`,
      detail: "Suggest enforcing if the image shipped with SELinux and the README does not forbid it. This op does not flip the mode.",
    });
  }
  if (!aa.missing && /complain/i.test(aa.stdout)) {
    findings.push({
      id: "apparmor-complain",
      severity: "medium",
      title: "AppArmor complain-mode profiles present",
      detail: "Move required profiles to enforce after a README check.",
    });
  }
  if (aa.missing && getenforce.missing) {
    findings.push({
      id: "nomac",
      severity: "low",
      title: "No AppArmor/SELinux tools found",
      detail: "If this is a Debian/Ubuntu image, install/enable apparmor if the README expects it.",
    });
  }
  return {
    extra: {
      selinux,
      apparmor: aa.missing ? "missing" : aa.stdout.slice(0, 1500),
      sestatus: sestatus.stdout.slice(0, 800),
    },
    findings,
  };
}

function firefoxPrefsBlob(): string {
  const roots = ["/etc/firefox/policies/policies.json", "/usr/lib/firefox/distribution/policies.json", "/etc/firefox/syspref.js", "/etc/firefox/firefox.js"];
  return roots.map((p) => readText(p) ?? "").join("\n");
}

export function collectBrowserBaseline(): { extra: Record<string, unknown>; findings: Finding[] } {
  const blob = firefoxPrefsBlob();
  const findings: Finding[] = [];
  if (/safebrowsing[^\\n]{0,40}false/i.test(blob) || /"DisableSafeBrowsing"\s*:\s*true/i.test(blob)) {
    findings.push({
      id: "safebrowsing",
      severity: "medium",
      title: "Firefox Safe Browsing disabled",
      detail: "Re-enable malware/phishing protection in enterprise policy.",
    });
  }
  if (/signon.rememberSignons["'\s:=]+true/i.test(blob) || /PasswordManagerEnabled["'\s:]+true/i.test(blob)) {
    findings.push({
      id: "pwsave",
      severity: "medium",
      title: "Browser password saving enabled",
      detail: "Shared CP images should not save user passwords in the browser.",
    });
  }
  if (/network.protocol-handler.external.shell["'\s:=]+true/i.test(blob)) {
    findings.push({
      id: "extshell",
      severity: "high",
      title: "Firefox external shell protocol handler enabled",
      detail: "Insecure protocol handler.",
    });
  }
  if (!blob.trim()) {
    findings.push({
      id: "nopolicy",
      severity: "info",
      title: "No system Firefox policy found",
      detail: "Check user.js under homes if Firefox is installed; cookies/history not dumped.",
    });
  }
  return { extra: { policyPresent: Boolean(blob.trim()), note: "Cookies, history, and saved passwords are not dumped." }, findings };
}

export function collectAutoUpdates(): { extra: Record<string, unknown>; findings: Finding[] } {
  const periodic = readText("/etc/apt/apt.conf.d/20auto-upgrades") ?? readText("/etc/apt/apt.conf.d/10periodic") ?? "";
  const uu = readText("/etc/apt/apt.conf.d/50unattended-upgrades") ?? "";
  const unattended = periodic.match(/Unattended-Upgrade\s+"?(\d+)"?/)?.[1];
  const updatePkg = periodic.match(/Update-Package-Lists\s+"?(\d+)"?/)?.[1];
  const findings: Finding[] = [];
  if (unattended === "0" || (!periodic && existsSync("/etc/apt"))) {
    findings.push({
      id: "uu",
      severity: "medium",
      title: "unattended-upgrades not enabled",
      detail: periodic ? `APT::Periodic::Unattended-Upgrade ${unattended ?? "unset"}` : "20auto-upgrades missing",
      remediationOpId: "apply-security-updates",
    });
  }
  if (uu && /\/\/\s*"\$\{distro_id\}:\$\{distro_codename\}-security"/.test(uu) && !/"\$\{distro_id\}:\$\{distro_codename\}-security"/.test(uu.replace(/\/\/[^\n]*/g, ""))) {
    findings.push({
      id: "securitypocket",
      severity: "medium",
      title: "Security pocket commented out in 50unattended-upgrades",
      detail: "Uncomment the security origin.",
      remediationOpId: "apply-security-updates",
    });
  }
  return {
    extra: {
      unattendedUpgrade: unattended ?? null,
      updatePackageLists: updatePkg ?? null,
      has50: Boolean(uu),
    },
    findings,
  };
}

export async function collectInstalledPackageNames(): Promise<Set<string>> {
  const dpkg = await runCmd("dpkg-query", ["-W", "-f=${Package}\n"], 15000);
  const names = new Set<string>();
  for (const line of dpkg.stdout.split(/\r?\n/)) {
    const n = line.trim().toLowerCase();
    if (n) names.add(n);
  }
  return names;
}

const HASHISH = /^[a-f0-9]{32,}$/i;

function walkReadmeFiles(root: string, maxDepth: number, acc: string[], depth = 0): void {
  if (acc.length >= 80 || depth > maxDepth) return;
  let entries: string[] = [];
  try {
    entries = readdirSync(root);
  } catch {
    return;
  }
  for (const name of entries) {
    if (acc.length >= 80) return;
    const full = path.join(root, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (name === "proc" || name === "sys" || name === "dev" || name === ".git" || name === "node_modules") continue;
      walkReadmeFiles(full, maxDepth, acc, depth + 1);
    } else if (st.isFile() && st.size < 400_000) {
      if (/^(readme|forensic|question)/i.test(name) || /\.(txt|md)$/i.test(name) && /readme|forensic|question/i.test(name)) {
        acc.push(full);
      }
    }
  }
}

export function collectForensicsReadme(
  repoRoot: string,
  searchRoot: string | undefined,
  keywordsPath: string,
): { extra: Record<string, unknown>; findings: Finding[] } {
  const keywords = readNameList(keywordsPath).map((k) => k.toLowerCase()).filter((k) => k.length >= 3);
  const roots: string[] = [];
  if (searchRoot && isSafeLocalPath(searchRoot) && existsSync(searchRoot)) {
    roots.push(searchRoot);
  } else {
    for (const p of ["/home", "/root", "/opt", "/usr/local/share", "/tmp"]) {
      if (existsSync(p)) roots.push(p);
    }
  }
  const files: string[] = [];
  for (const root of roots) walkReadmeFiles(root, root === "/tmp" ? 2 : 3, files);
  const hits: Array<{ path: string; keyword: string; line: string }> = [];
  for (const file of files) {
    const text = readText(file);
    if (!text) continue;
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || HASHISH.test(trimmed.replace(/\s/g, ""))) continue;
      if (/https?:\/\//i.test(trimmed) && /ccs|scoreboard|scoring/i.test(trimmed)) continue;
      const low = trimmed.toLowerCase();
      for (const kw of keywords) {
        if (low.includes(kw)) {
          hits.push({ path: file, keyword: kw, line: trimmed.slice(0, 160) });
          break;
        }
      }
      if (hits.length >= 60) break;
    }
    if (hits.length >= 60) break;
  }
  return {
    extra: {
      hits,
      filesSkimmed: files.slice(0, 40),
      ccsContacted: false,
      note: "Local files only. CCS scoring server is never contacted. Hash-looking lines omitted.",
    },
    findings: hits.slice(0, 40).map((h) => ({
      id: `readme:${h.path}:${h.keyword}`,
      severity: "info" as const,
      title: `${h.keyword} in ${h.path}`,
      detail: h.line,
      resource: h.path,
    })),
  };
}

export { pickKv, yes };
