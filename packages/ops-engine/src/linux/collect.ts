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

/** Classify shadow password field without returning the hash. */
export function classifyShadowField(field: string | undefined): {
  passwordEmpty: boolean;
  passwordSet: boolean;
  locked: boolean;
} {
  if (field == null) return { passwordEmpty: false, passwordSet: false, locked: false };
  if (field === "") return { passwordEmpty: true, passwordSet: false, locked: false };
  if (field.startsWith("!") || field.startsWith("*")) {
    return { passwordEmpty: field === "!" || field === "!!" || field === "*", passwordSet: false, locked: true };
  }
  return { passwordEmpty: false, passwordSet: true, locked: false };
}

export function parseShadowFlags(text: string): Map<string, ReturnType<typeof classifyShadowField>> {
  const map = new Map<string, ReturnType<typeof classifyShadowField>>();
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const [name, field] = line.split(":");
    if (!name) continue;
    map.set(name, classifyShadowField(field));
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
  ];
  return paths.map((p) => inspectPath(p)).filter((x): x is FileRecord => Boolean(x));
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

export { readText, existsSync };
