import { existsSync, readFileSync, statSync } from "node:fs";
import { runCmd } from "./exec.js";
import type { FileRecord, PortRecord, ServiceRecord, UserRecord } from "../types.js";

const MAX_FIND = 200;

function readText(filePath: string): string | undefined {
  try {
    return readFileSync(filePath, "utf8");
  } catch {
    return undefined;
  }
}

export function parsePasswd(text: string): Array<{
  name: string;
  uid: number;
  gid: number;
  home: string;
  shell: string;
}> {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const [name, _pw, uid, gid, _gecos, home, shell] = line.split(":");
    if (!name || uid == null || gid == null) continue;
    rows.push({
      name,
      uid: Number(uid),
      gid: Number(gid),
      home: home ?? "",
      shell: shell ?? "",
    });
  }
  return rows;
}

export function parseGroup(text: string): Map<string, string[]> {
  const membership = new Map<string, string[]>();
  const add = (user: string, group: string) => {
    const list = membership.get(user) ?? [];
    if (!list.includes(group)) list.push(group);
    membership.set(user, list);
  };
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const [gname, _pw, _gid, members] = line.split(":");
    if (!gname) continue;
    for (const member of (members ?? "").split(",").map((m) => m.trim()).filter(Boolean)) {
      add(member, gname);
    }
  }
  return membership;
}

export type ShadowFlags = {
  passwordEmpty: boolean;
  passwordSet: boolean;
  locked: boolean;
  passwordNeverExpires: boolean;
  maxDays: number | null;
};

/** Classify shadow password + aging fields without returning the hash. */
export function classifyShadowField(field: string | undefined, maxDaysRaw?: string): ShadowFlags {
  let passwordEmpty = false;
  let passwordSet = false;
  let locked = false;
  if (field == null) {
    passwordEmpty = false;
    passwordSet = false;
    locked = false;
  } else if (field === "") {
    passwordEmpty = true;
    passwordSet = false;
    locked = false;
  } else if (field.startsWith("!") || field.startsWith("*")) {
    passwordEmpty = field === "!" || field === "!!" || field === "*";
    passwordSet = false;
    locked = true;
  } else {
    passwordEmpty = false;
    passwordSet = true;
    locked = false;
  }
  const maxDays =
    maxDaysRaw == null || maxDaysRaw === "" || Number.isNaN(Number(maxDaysRaw)) ? null : Number(maxDaysRaw);
  const passwordNeverExpires = maxDays == null || maxDays < 0 || maxDays >= 99999;
  return { passwordEmpty, passwordSet, locked, passwordNeverExpires, maxDays };
}

export function parseShadowFlags(text: string): Map<string, ShadowFlags> {
  const map = new Map<string, ShadowFlags>();
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(":");
    const name = parts[0];
    if (!name) continue;
    map.set(name, classifyShadowField(parts[1], parts[4]));
  }
  return map;
}

export function collectLocalUsers(): { users: UserRecord[]; warnings: string[] } {
  const warnings: string[] = [];
  const passwd = readText("/etc/passwd");
  if (!passwd) {
    return { users: [], warnings: ["/etc/passwd unreadable"] };
  }
  const groups = parseGroup(readText("/etc/group") ?? "");
  const shadowText = readText("/etc/shadow");
  if (!shadowText) warnings.push("/etc/shadow unreadable (empty-password checks limited; hashes never requested)");
  const shadow = shadowText ? parseShadowFlags(shadowText) : new Map();
  const lastlog = new Map<string, string | null>();

  const users: UserRecord[] = parsePasswd(passwd).map((row) => {
    const flags = shadow.get(row.name);
    let createdAt: string | null = null;
    try {
      if (row.home && existsSync(row.home)) {
        createdAt = statSync(row.home).ctime.toISOString();
      }
    } catch {
      createdAt = null;
    }
    return {
      name: row.name,
      uid: row.uid,
      gid: row.gid,
      home: row.home,
      shell: row.shell,
      groups: groups.get(row.name) ?? [],
      lastLogin: lastlog.has(row.name) ? lastlog.get(row.name) : undefined,
      createdAt,
      locked: flags?.locked,
      enabled: flags ? !flags.locked : undefined,
      passwordEmpty: flags?.passwordEmpty,
      passwordSet: flags?.passwordSet,
      passwordNeverExpires: flags?.passwordNeverExpires,
      passwordHidden: true,
      platform: "linux",
    };
  });
  return { users, warnings };
}

export async function enrichLastLogin(users: UserRecord[]): Promise<void> {
  const result = await runCmd("lastlog", ["-t", "3650"], 8000);
  if (result.code !== 0) return;
  const lines = result.stdout.split(/\r?\n/).slice(1);
  const byName = new Map(users.map((u) => [u.name, u]));
  for (const line of lines) {
    const name = line.split(/\s+/)[0];
    if (!name || !byName.has(name)) continue;
    if (/never logged in/i.test(line)) {
      byName.get(name)!.lastLogin = null;
    } else {
      const match = line.match(/[A-Z][a-z]{2}\s+[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\S+\s+\d{4}/);
      byName.get(name)!.lastLogin = match ? match[0] : "logged-in (see lastlog)";
    }
  }
}

export async function collectServices(): Promise<{ services: ServiceRecord[]; warnings: string[] }> {
  const warnings: string[] = [];
  const result = await runCmd(
    "systemctl",
    ["list-units", "--type=service", "--all", "--no-pager", "--no-legend", "--plain"],
    10000,
  );
  if (result.missing || result.code !== 0) {
    warnings.push("systemctl unavailable; service list empty");
    return { services: [], warnings };
  }
  const services: ServiceRecord[] = [];
  for (const line of result.stdout.split(/\r?\n/)) {
    const cols = line.trim().split(/\s+/);
    if (cols.length < 4) continue;
    const name = (cols[0] ?? "").replace(/\.service$/, "");
    const active = cols[2] ?? "unknown";
    const state: ServiceRecord["state"] =
      active === "active" ? "running" : active === "inactive" || active === "failed" ? "stopped" : "unknown";
    services.push({
      name,
      state,
      enabled: false,
      platform: "linux",
      description: cols.slice(4).join(" ") || undefined,
    });
  }
  const enabled = await runCmd("systemctl", ["list-unit-files", "--type=service", "--no-pager", "--no-legend", "--plain"], 10000);
  if (enabled.code === 0) {
    const map = new Map<string, boolean>();
    for (const line of enabled.stdout.split(/\r?\n/)) {
      const [unit, preset] = line.trim().split(/\s+/);
      if (!unit) continue;
      map.set(unit.replace(/\.service$/, ""), /enabled/i.test(preset ?? ""));
    }
    for (const svc of services) {
      svc.enabled = map.get(svc.name) ?? false;
    }
  }
  return { services, warnings };
}

export async function collectPorts(): Promise<{ ports: PortRecord[]; warnings: string[] }> {
  const warnings: string[] = [];
  let result = await runCmd("ss", ["-lntup"], 8000);
  if (result.missing || result.code !== 0) {
    result = await runCmd("netstat", ["-lntup"], 8000);
  }
  if (result.code !== 0) {
    warnings.push("ss/netstat unavailable");
    return { ports: [], warnings };
  }
  const ports: PortRecord[] = [];
  const seen = new Set<string>();
  for (const line of result.stdout.split(/\r?\n/)) {
    if (!/^(tcp|udp)/i.test(line) && !/LISTEN|\bunconn\b/i.test(line)) continue;
    const proto = /udp/i.test(line.split(/\s+/)[0] ?? "") ? "udp" : "tcp";
    const match = line.match(/(\d{1,3}(?:\.\d{1,3}){3}|\[?[0-9a-fA-F:]+\]?|\*):(\d+)/);
    if (!match) continue;
    const address = match[1] === "*" ? "0.0.0.0" : match[1] ?? "0.0.0.0";
    const port = Number(match[2]);
    const proc = line.match(/users:\(\("([^"]+)/)?.[1] ?? line.match(/(\w+)\/\d+\s*$/)?.[1];
    const key = `${proto}:${address}:${port}`;
    if (seen.has(key)) continue;
    seen.add(key);
    ports.push({ protocol: proto, port, address, process: proc, suspicious: false });
  }
  return { ports, warnings };
}

function modeString(mode: number): string {
  return (mode & 0o7777).toString(8).padStart(4, "0");
}

export async function findFiles(args: string[], note?: string): Promise<FileRecord[]> {
  const result = await runCmd("find", args, 20000);
  const files: FileRecord[] = [];
  for (const line of result.stdout.split(/\r?\n/)) {
    if (!line) continue;
    files.push({ path: line, kind: "file", note });
    if (files.length >= MAX_FIND) break;
  }
  return files;
}

export function inspectPath(filePath: string, extra: Partial<FileRecord> = {}): FileRecord | undefined {
  try {
    const st = statSync(filePath);
    const mode = st.mode;
    return {
      path: filePath,
      kind: st.isDirectory() ? "directory" : st.isSymbolicLink() ? "symlink" : "file",
      mode: modeString(mode),
      worldWritable: Boolean(mode & 0o002),
      suid: Boolean(mode & 0o4000),
      sgid: Boolean(mode & 0o2000),
      ...extra,
    };
  } catch {
    return undefined;
  }
}

export function collectSensitivePerms(): FileRecord[] {
  const paths = [
    "/etc/passwd",
    "/etc/shadow",
    "/etc/gshadow",
    "/etc/group",
    "/etc/sudoers",
    "/etc/ssh/sshd_config",
    "/etc/crontab",
    "/etc/ssh/ssh_host_rsa_key",
    "/etc/ssh/ssh_host_ed25519_key",
  ];
  return paths.map((p) => inspectPath(p)).filter((x): x is FileRecord => Boolean(x));
}

/** Shadow aging flags only — password hashes are never returned. */
export function collectPasswordAging(): Array<{
  name: string;
  maxDays: number | null;
  neverExpires: boolean;
  passwordEmpty: boolean;
  locked: boolean;
}> {
  const passwd = readText("/etc/passwd") ?? "";
  const names = new Set(parsePasswd(passwd).map((p) => p.name));
  const shadow = readText("/etc/shadow");
  if (!shadow) return [];
  const rows = [];
  for (const line of shadow.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(":");
    const name = parts[0] ?? "";
    if (!name || !names.has(name)) continue;
    const field = parts[1] ?? "";
    const flags = classifyShadowField(field);
    const maxRaw = parts[4] ?? "";
    const maxDays = maxRaw === "" ? null : Number(maxRaw);
    const neverExpires = maxDays == null || Number.isNaN(maxDays) || maxDays < 0 || maxDays >= 99999;
    rows.push({
      name,
      maxDays: Number.isNaN(maxDays as number) ? null : maxDays,
      neverExpires,
      passwordEmpty: flags.passwordEmpty,
      locked: flags.locked,
    });
  }
  return rows;
}

export function collectSmbShareAcls(): Array<{
  name: string;
  path?: string;
  guest?: boolean;
  writable?: boolean;
  note?: string;
}> {
  const smb = readText("/etc/samba/smb.conf") ?? "";
  const shares: Array<{ name: string; path?: string; guest?: boolean; writable?: boolean; note?: string }> = [];
  let current: { name: string; path?: string; guest?: boolean; writable?: boolean; note?: string } | undefined;
  for (const raw of smb.split(/\r?\n/)) {
    const line = raw.trim();
    const header = line.match(/^\[([^\]]+)\]/);
    if (header) {
      if (current && current.name !== "global") shares.push(current);
      current = { name: header[1] ?? "share" };
      continue;
    }
    if (!current || !line || line.startsWith("#") || line.startsWith(";")) continue;
    const eq = line.split("=");
    if (eq.length < 2) continue;
    const key = (eq[0] ?? "").trim().toLowerCase();
    const val = eq.slice(1).join("=").trim();
    if (key === "path") current.path = val;
    if (key === "guest ok" && /^yes$/i.test(val)) current.guest = true;
    if ((key === "read only" && /^no$/i.test(val)) || (key === "writable" && /^yes$/i.test(val))) {
      current.writable = true;
    }
    if (key === "force user" || /everyone|world/i.test(val)) {
      current.note = `${key}=${val}`;
    }
  }
  if (current && current.name !== "global") shares.push(current);
  return shares;
}

export function collectPersistenceHints(): FileRecord[] {
  const files: FileRecord[] = [];
  const candidates = [
    "/etc/rc.local",
    "/etc/xdg/autostart",
    "/etc/profile.d",
    "/etc/cron.d",
    "/var/spool/cron/crontabs",
  ];
  for (const p of candidates) {
    const rec = inspectPath(p, { note: "persistence" });
    if (rec) files.push(rec);
  }
  return files;
}

const EXPECTED_MODES: Record<string, string[]> = {
  "/etc/shadow": ["0640", "0000", "0600", "0400"],
  "/etc/gshadow": ["0640", "0000", "0600", "0400"],
  "/etc/sudoers": ["0440", "0400"],
  "/etc/ssh/ssh_host_rsa_key": ["0600", "0400"],
  "/etc/ssh/ssh_host_ed25519_key": ["0600", "0400"],
  "/etc/ssh/ssh_host_ecdsa_key": ["0600", "0400"],
};

export function collectCriticalPerms(): FileRecord[] {
  const paths = [
    "/etc/passwd",
    "/etc/shadow",
    "/etc/gshadow",
    "/etc/group",
    "/etc/sudoers",
    "/etc/ssh/sshd_config",
    "/etc/crontab",
    "/etc/ssh/ssh_host_rsa_key",
    "/etc/ssh/ssh_host_ed25519_key",
    "/etc/ssh/ssh_host_ecdsa_key",
  ];
  return paths
    .map((p) => inspectPath(p, { note: EXPECTED_MODES[p]?.join("|") }))
    .filter((x): x is FileRecord => Boolean(x));
}

export function expectedModesFor(filePath: string): string[] | undefined {
  return EXPECTED_MODES[filePath];
}

export function parseExpectedPorts(lines: string[]): Array<{ protocol: "tcp" | "udp"; port: number }> {
  const out: Array<{ protocol: "tcp" | "udp"; port: number }> = [];
  for (const raw of lines) {
    const line = raw.trim().toLowerCase();
    if (!line) continue;
    const slash = line.match(/^(tcp|udp)\/(\d+)/);
    if (slash) {
      out.push({ protocol: slash[1] as "tcp" | "udp", port: Number(slash[2]) });
      continue;
    }
    const spaced = line.match(/^(tcp|udp)\s+(\d+)/);
    if (spaced) {
      out.push({ protocol: spaced[1] as "tcp" | "udp", port: Number(spaced[2]) });
      continue;
    }
    const only = line.match(/^(\d+)$/);
    if (only) out.push({ protocol: "tcp", port: Number(only[1]) });
  }
  return out;
}

export function readKeyValueConfig(filePath: string): Record<string, string> {
  const text = readText(filePath) ?? "";
  const out: Record<string, string> = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const cleaned = line.replace(/^\s*#\s*/, "");
    const eq = cleaned.match(/^([A-Za-z0-9_.]+)\s+(.*)$/) || cleaned.match(/^([A-Za-z0-9_./]+)\s*=\s*(.*)$/);
    if (!eq) continue;
    out[eq[1] ?? ""] = (eq[2] ?? "").trim();
  }
  return out;
}

export type FindScanKind = "world-writable" | "suid" | "media" | "hidden" | "backdoor";

const FIND_SPECS: Record<FindScanKind, { code: string; args: string[] }> = {
  "world-writable": {
    code: "W",
    args: ["/home", "/etc", "/opt", "/tmp", "/var", "/usr/local", "-xdev", "-perm", "-0002", "(", "-type", "f", "-o", "-type", "d", ")"],
  },
  suid: {
    code: "S",
    args: ["/", "-xdev", "(", "-perm", "-4000", "-o", "-perm", "-2000", ")", "-type", "f"],
  },
  media: {
    code: "M",
    args: [
      "/home",
      "/tmp",
      "/var/tmp",
      "/opt",
      "/usr/local",
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
  },
  hidden: {
    code: "H",
    args: ["/home", "/tmp", "/var/tmp", "-type", "f", "-name", ".*", "-perm", "-0111"],
  },
  backdoor: {
    code: "B",
    args: [
      "/tmp",
      "/home",
      "/opt",
      "/usr/local",
      "-type",
      "f",
      "(",
      "-name",
      "nc",
      "-o",
      "-name",
      "ncat",
      "-o",
      "-name",
      "netcat",
      "-o",
      "-name",
      "socat",
      ")",
    ],
  },
};

/** KIND|PATH|MODE lines for Bend, capped. Falls back to path-only when -printf is unavailable. */
export async function collectFindInventory(kind: FindScanKind, limit = 400): Promise<{ inventory: string; warnings: string[] }> {
  const spec = FIND_SPECS[kind];
  const printf = await runCmd("find", [...spec.args, "-printf", `${spec.code}|%p|%m\\n`], 20000);
  let lines: string[] = [];
  const warnings: string[] = [];
  if (printf.code === 0 && printf.stdout.trim()) {
    lines = printf.stdout.split(/\r?\n/).filter(Boolean).slice(0, limit);
  } else {
    const plain = await findFiles(spec.args, kind);
    lines = plain.slice(0, limit).map((f) => `${spec.code}|${f.path}|`);
    if (printf.code !== 0) warnings.push("find -printf unavailable; inventory has no modes");
  }
  return { inventory: `${lines.join("\n")}\n`, warnings };
}

export function portsToInventory(ports: PortRecord[]): string {
  return ports.map((p) => `${p.port}|${p.address}|${p.process ?? ""}`).join("\n") + "\n";
}

export { readText, existsSync };
