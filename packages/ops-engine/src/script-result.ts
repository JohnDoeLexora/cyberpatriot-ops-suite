import { hitsToFiles, hitsToFindings, type BendHit } from "./bend/runner.js";
import type {
  ChecklistItem,
  FileRecord,
  Finding,
  FindingSeverity,
  PortRecord,
  ReportTable,
  ReportTone,
  RunData,
  ServiceRecord,
  StatusReport,
  UserRecord,
} from "./types.js";

const SEVERITIES = new Set<FindingSeverity>(["info", "low", "medium", "high", "critical"]);
const REPORT_TONES = new Set<ReportTone>(["clear", "watch", "urgent", "info", "empty"]);

export interface MappedScript {
  ok: boolean;
  summary: string;
  findings: Finding[];
  data: RunData;
  warnings: string[];
  /** bend when the script delegated to engines/bend; otherwise the host engine. */
  engine: "linux" | "windows" | "bend";
  exitCode: number;
  status: string;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asFindings(value: unknown): Finding[] {
  if (!Array.isArray(value)) return [];
  const findings: Finding[] = [];
  for (const item of value) {
    const rec = asRecord(item);
    if (!rec) continue;
    if (typeof rec.id !== "string" || typeof rec.title !== "string") continue;
    if (typeof rec.severity !== "string" || !SEVERITIES.has(rec.severity as FindingSeverity)) continue;
    findings.push({
      id: rec.id,
      severity: rec.severity as FindingSeverity,
      title: rec.title,
      detail: typeof rec.detail === "string" ? rec.detail : undefined,
      resource: typeof rec.resource === "string" ? rec.resource : undefined,
      score: typeof rec.score === "number" ? rec.score : undefined,
      signals: asStringList(rec.signals),
      remediationOpId: typeof rec.remediationOpId === "string" ? rec.remediationOpId : undefined,
    });
  }
  return findings;
}

function asBendHits(value: unknown): BendHit[] {
  if (!Array.isArray(value)) return [];
  const hits: BendHit[] = [];
  for (const item of value) {
    const rec = asRecord(item);
    if (!rec || typeof rec.path !== "string") continue;
    if (typeof rec.id === "string" && typeof rec.title === "string") continue;
    hits.push({
      path: rec.path,
      severity: typeof rec.severity === "string" ? rec.severity : "medium",
      tags: typeof rec.tags === "string" ? rec.tags : "",
      score: typeof rec.score === "number" ? rec.score : Number(rec.score) || 0,
    });
  }
  return hits;
}

function asUsers(value: unknown): UserRecord[] {
  if (!Array.isArray(value)) return [];
  const users: UserRecord[] = [];
  for (const item of value) {
    const rec = asRecord(item);
    if (!rec || typeof rec.name !== "string" || !rec.name) continue;
    const platform = rec.platform === "windows" ? "windows" : "linux";
    users.push({
      name: rec.name,
      uid: typeof rec.uid === "number" ? rec.uid : undefined,
      gid: typeof rec.gid === "number" ? rec.gid : undefined,
      sid: typeof rec.sid === "string" ? rec.sid : undefined,
      home: typeof rec.home === "string" ? rec.home : undefined,
      shell: typeof rec.shell === "string" ? rec.shell : undefined,
      groups: asStringList(rec.groups),
      lastLogin: typeof rec.lastLogin === "string" || rec.lastLogin === null ? (rec.lastLogin as string | null) : undefined,
      createdAt: typeof rec.createdAt === "string" || rec.createdAt === null ? (rec.createdAt as string | null) : undefined,
      locked: typeof rec.locked === "boolean" ? rec.locked : undefined,
      enabled: typeof rec.enabled === "boolean" ? rec.enabled : undefined,
      passwordEmpty: typeof rec.passwordEmpty === "boolean" ? rec.passwordEmpty : undefined,
      passwordSet: typeof rec.passwordSet === "boolean" ? rec.passwordSet : undefined,
      passwordNeverExpires: typeof rec.passwordNeverExpires === "boolean" ? rec.passwordNeverExpires : undefined,
      passwordHidden: true,
      interactive: typeof rec.interactive === "boolean" ? rec.interactive : undefined,
      suspicionScore: typeof rec.suspicionScore === "number" ? rec.suspicionScore : undefined,
      signals: asStringList(rec.signals),
      platform,
    });
  }
  return users;
}

function asServices(value: unknown): ServiceRecord[] {
  if (!Array.isArray(value)) return [];
  const services: ServiceRecord[] = [];
  for (const item of value) {
    const rec = asRecord(item);
    if (!rec || typeof rec.name !== "string" || !rec.name) continue;
    const state = rec.state === "running" || rec.state === "stopped" || rec.state === "unknown" ? rec.state : "unknown";
    services.push({
      name: rec.name,
      state,
      enabled: rec.enabled === true,
      required: typeof rec.required === "boolean" ? rec.required : undefined,
      risky: typeof rec.risky === "boolean" ? rec.risky : undefined,
      description: typeof rec.description === "string" ? rec.description : undefined,
      platform: rec.platform === "windows" ? "windows" : "linux",
    });
  }
  return services;
}

function asPorts(value: unknown): PortRecord[] {
  if (!Array.isArray(value)) return [];
  const ports: PortRecord[] = [];
  for (const item of value) {
    const rec = asRecord(item);
    if (!rec || (rec.protocol !== "tcp" && rec.protocol !== "udp")) continue;
    if (typeof rec.port !== "number") continue;
    ports.push({
      protocol: rec.protocol,
      port: rec.port,
      address: typeof rec.address === "string" ? rec.address : "*",
      process: typeof rec.process === "string" ? rec.process : undefined,
      pid: typeof rec.pid === "number" ? rec.pid : undefined,
      required: typeof rec.required === "boolean" ? rec.required : undefined,
      suspicious: typeof rec.suspicious === "boolean" ? rec.suspicious : undefined,
      reason: typeof rec.reason === "string" ? rec.reason : undefined,
    });
  }
  return ports;
}

function asFiles(value: unknown): FileRecord[] {
  if (!Array.isArray(value)) return [];
  const files: FileRecord[] = [];
  for (const item of value) {
    const rec = asRecord(item);
    if (!rec || typeof rec.path !== "string" || !rec.path) continue;
    const kind = rec.kind === "directory" || rec.kind === "symlink" || rec.kind === "file" ? rec.kind : "file";
    files.push({
      path: rec.path,
      kind,
      mode: typeof rec.mode === "string" ? rec.mode : undefined,
      owner: typeof rec.owner === "string" ? rec.owner : undefined,
      suid: rec.suid === true,
      sgid: rec.sgid === true,
      worldWritable: rec.worldWritable === true,
      hidden: rec.hidden === true,
      note: typeof rec.note === "string" ? rec.note : undefined,
    });
  }
  return files;
}

function asGroups(value: unknown): RunData["groups"] {
  if (!Array.isArray(value)) return undefined;
  const groups = [];
  for (const item of value) {
    const rec = asRecord(item);
    if (!rec || typeof rec.name !== "string" || !rec.name) continue;
    groups.push({
      name: rec.name,
      members: asStringList(rec.members),
      privileged: rec.privileged === true,
    });
  }
  return groups;
}

function asPackages(value: unknown): RunData["packages"] {
  if (!Array.isArray(value)) return undefined;
  const packages = [];
  for (const item of value) {
    const rec = asRecord(item);
    if (!rec || typeof rec.name !== "string" || !rec.name) continue;
    packages.push({
      name: rec.name,
      version: typeof rec.version === "string" ? rec.version : undefined,
      prohibited: rec.prohibited === true,
    });
  }
  return packages;
}

function asChecklist(value: unknown): ChecklistItem[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items: ChecklistItem[] = [];
  for (const item of value) {
    const rec = asRecord(item);
    if (!rec || typeof rec.id !== "string" || typeof rec.title !== "string") continue;
    const status = rec.status === "pass" || rec.status === "fail" || rec.status === "warn" || rec.status === "info" ? rec.status : "info";
    items.push({
      id: rec.id,
      title: rec.title,
      status,
      detail: typeof rec.detail === "string" ? rec.detail : "",
      relatedOpId: typeof rec.relatedOpId === "string" ? rec.relatedOpId : "",
    });
  }
  return items;
}

function asPolicy(value: unknown): RunData["policy"] {
  const rec = asRecord(value);
  if (!rec) return undefined;
  const policy: Record<string, string | number | boolean | null> = {};
  for (const [key, item] of Object.entries(rec)) {
    if (typeof item === "string" || typeof item === "number" || typeof item === "boolean" || item === null) {
      policy[key] = item;
    }
  }
  return Object.keys(policy).length ? policy : undefined;
}

function asReport(value: unknown): StatusReport | undefined {
  const rec = asRecord(value);
  if (!rec) return undefined;
  const tone = rec.tone;
  if (typeof tone !== "string" || !REPORT_TONES.has(tone as ReportTone)) return undefined;
  const facts: StatusReport["facts"] = [];
  if (Array.isArray(rec.facts)) {
    for (const item of rec.facts) {
      const fact = asRecord(item);
      if (!fact || typeof fact.label !== "string" || !fact.label.trim()) continue;
      if (typeof fact.value !== "string" && typeof fact.value !== "number" && typeof fact.value !== "boolean") continue;
      facts.push({ label: fact.label.trim(), value: String(fact.value) });
    }
  }
  const table = asReportTable(rec.table);
  return table ? { tone: tone as ReportTone, facts, table } : { tone: tone as ReportTone, facts };
}

function asReportTable(value: unknown): ReportTable | undefined {
  const rec = asRecord(value);
  if (!rec || typeof rec.title !== "string" || !rec.title.trim()) return undefined;
  if (!Array.isArray(rec.columns) || !Array.isArray(rec.rows)) return undefined;
  const columns: ReportTable["columns"] = [];
  for (const item of rec.columns) {
    const column = asRecord(item);
    if (!column || typeof column.key !== "string" || typeof column.label !== "string") continue;
    columns.push({
      key: column.key,
      label: column.label,
      ...(column.mono === true ? { mono: true } : {}),
    });
  }
  if (!columns.length) return undefined;
  const rows: ReportTable["rows"] = [];
  for (const item of rec.rows) {
    const row = asRecord(item);
    if (!row) continue;
    const out: Record<string, string> = {};
    for (const column of columns) {
      const cell = row[column.key];
      out[column.key] = typeof cell === "string" || typeof cell === "number" || typeof cell === "boolean" ? String(cell) : "";
    }
    rows.push(out);
  }
  return { title: rec.title.trim(), columns, rows };
}

function asShares(value: unknown): RunData["shares"] {
  if (!Array.isArray(value)) return undefined;
  const shares = [];
  for (const item of value) {
    const rec = asRecord(item);
    if (!rec || typeof rec.name !== "string" || !rec.name) continue;
    shares.push({
      name: rec.name,
      path: typeof rec.path === "string" ? rec.path : undefined,
      guest: typeof rec.guest === "boolean" ? rec.guest : undefined,
      writable: typeof rec.writable === "boolean" ? rec.writable : undefined,
    });
  }
  return shares;
}

function bendHitsToPorts(hits: BendHit[]): PortRecord[] {
  const ports: PortRecord[] = [];
  for (const hit of hits) {
    const match = /^(tcp|udp)\/(\d+)$/i.exec(hit.path);
    if (!match) continue;
    const tags = hit.tags.split(",").filter(Boolean);
    ports.push({
      protocol: match[1].toLowerCase() === "udp" ? "udp" : "tcp",
      port: Number(match[2]),
      address: tags.includes("public-bind") ? "0.0.0.0" : "*",
      suspicious: tags.includes("unexpected") || tags.includes("suspicious-port"),
      required: tags.includes("expected"),
      reason: hit.tags || undefined,
    });
  }
  return ports;
}

function synthesizeSummary(data: RunData, findings: Finding[], parsed: Record<string, unknown> | undefined): string {
  if (data.users?.length) return `Listed ${data.users.length} local accounts (hashes omitted).`;
  if (data.services?.length) return `${data.services.length} services.`;
  if (data.ports?.length) return `${data.ports.length} listeners.`;
  if (data.files?.length) return `${data.files.length} files.`;
  if (data.packages?.length) return `${data.packages.length} packages.`;
  if (data.groups?.length) return `${data.groups.length} groups.`;
  if (data.checklist?.length) return `Checklist of ${data.checklist.length} items. Nothing was changed.`;
  if (data.shares?.length) return `${data.shares.length} shares.`;
  if (findings.length) return `${findings.length} findings.`;
  const note = asRecord(parsed?.extra)?.note;
  if (typeof note === "string" && note.trim()) return note.trim();
  if (typeof parsed?.note === "string" && parsed.note.trim()) return parsed.note.trim();
  return "Check finished.";
}

/**
 * Turn a script's JSON object into the RunResult pieces the dashboard already renders.
 * Scripts may use the cp_emit contract or a flatter `{ ok, users|services|ports|files, ... }` object.
 * Bend scorers emit `{ engine, kind, findings: [{ path, tags, score }] }`; those become files, ports, and findings.
 */
export function mapScriptPayload(
  parsed: Record<string, unknown> | undefined,
  processCode: number,
  fallbackEngine: "linux" | "windows",
  stderr = "",
): MappedScript {
  const exitCode = typeof parsed?.exitCode === "number" ? parsed.exitCode : processCode;
  let status = typeof parsed?.status === "string" ? parsed.status : "";
  if (!status) {
    if (parsed?.ok === false) status = "error";
    else if (exitCode === 0) status = "ok";
    else status = "error";
  }

  const bendHits = asBendHits(parsed?.findings);
  const findings = asFindings(parsed?.findings);
  const bendFindings = bendHits.length ? hitsToFindings(bendHits) : [];
  const mergedFindings = findings.length ? findings : bendFindings;

  let files = asFiles(parsed?.files);
  let ports = asPorts(parsed?.ports);
  const kind = typeof parsed?.kind === "string" ? parsed.kind : "";
  if (!files.length && bendHits.length && (kind === "files" || kind.startsWith("files"))) {
    files = hitsToFiles(bendHits);
  }
  if (!ports.length && bendHits.length && kind === "ports") {
    ports = bendHitsToPorts(bendHits);
  }

  const preview = asStringList(parsed?.preview);
  const details = asStringList(parsed?.details);
  const warnings = asStringList(parsed?.warnings);
  const extraIn = asRecord(parsed?.extra) ?? {};
  const extra: Record<string, unknown> = {
    ...extraIn,
    preview,
    details,
    exitCode,
    status,
    backupDir: typeof parsed?.backupDir === "string" ? parsed.backupDir : (extraIn.backupDir ?? null),
    changed: typeof parsed?.changed === "number" ? parsed.changed : extraIn.changed,
    alreadyOk: typeof parsed?.alreadyOk === "number" ? parsed.alreadyOk : extraIn.alreadyOk,
    skipped: typeof parsed?.skipped === "number" ? parsed.skipped : extraIn.skipped,
  };
  if (typeof parsed?.engine === "string") extra.scorer = parsed.engine;
  if (typeof parsed?.totalScore === "number") extra.totalScore = parsed.totalScore;

  const data: RunData = {
    users: asUsers(parsed?.users),
    services: asServices(parsed?.services),
    ports,
    files,
    groups: asGroups(parsed?.groups),
    packages: asPackages(parsed?.packages),
    checklist: asChecklist(parsed?.checklist),
    policy: asPolicy(parsed?.policy),
    shares: asShares(parsed?.shares),
    report: asReport(parsed?.report),
    extra,
  };
  const filesExplicit = Array.isArray(parsed?.files) || kind === "files" || kind.startsWith("files");
  if (!data.users?.length && !Array.isArray(parsed?.users)) delete data.users;
  if (!data.services?.length && !Array.isArray(parsed?.services)) delete data.services;
  if (!data.ports?.length && !Array.isArray(parsed?.ports) && kind !== "ports") delete data.ports;
  if (!data.files?.length && !filesExplicit) delete data.files;

  let summary = typeof parsed?.summary === "string" ? parsed.summary.trim() : "";
  if (!summary) summary = synthesizeSummary(data, mergedFindings, parsed);
  const extraLines = preview.filter((line) => line && !summary.includes(line));
  if (extraLines.length) summary = `${summary}\n${extraLines.join("\n")}`;

  const skipped = status === "skipped" || exitCode === 3;
  const refused = status === "refused" || exitCode === 2;
  const explicitFail = parsed?.ok === false || status === "error";
  const ok = exitCode === 0 && !skipped && !refused && !explicitFail;

  if (!ok) {
    const err = stderr.trim();
    if (err && !summary.includes(err.slice(0, 180)) && !warnings.includes(err.slice(0, 2000))) {
      warnings.push(err.slice(0, 2000));
    }
    if (!warnings.length) warnings.push(summary);
  }

  const engine = parsed?.engine === "bend" ? "bend" : fallbackEngine;
  return { ok, summary, findings: mergedFindings, data, warnings, engine, exitCode, status };
}
