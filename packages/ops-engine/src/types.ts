import type { Category, OpDefinition, Platform, Risk } from "@cyberpatriot/ops-catalog";

export type RunMode = "demo" | "live";

export interface RunRequest {
  opId: string;
  mode: RunMode;
  params?: Record<string, unknown>;
  confirm?: boolean;
}

export type FindingSeverity = "info" | "low" | "medium" | "high" | "critical";

export interface Finding {
  id: string;
  severity: FindingSeverity;
  title: string;
  detail?: string;
  resource?: string;
  score?: number;
  signals?: string[];
  remediationOpId?: string;
}

export interface UserRecord {
  name: string;
  uid?: number;
  gid?: number;
  sid?: string;
  home?: string;
  shell?: string;
  groups: string[];
  lastLogin?: string | null;
  createdAt?: string | null;
  locked?: boolean;
  enabled?: boolean;
  /** Classification only — hashes are never included. */
  passwordEmpty?: boolean;
  passwordSet?: boolean;
  passwordNeverExpires?: boolean;
  passwordHidden: true;
  interactive?: boolean;
  suspicionScore?: number;
  signals?: string[];
  platform: "linux" | "windows";
}

export interface ServiceRecord {
  name: string;
  state: "running" | "stopped" | "unknown";
  enabled: boolean;
  required?: boolean;
  risky?: boolean;
  description?: string;
  platform: "linux" | "windows";
}

export interface PortRecord {
  protocol: "tcp" | "udp";
  port: number;
  address: string;
  process?: string;
  pid?: number;
  required?: boolean;
  suspicious?: boolean;
  reason?: string;
}

export interface FileRecord {
  path: string;
  kind: "file" | "directory" | "symlink";
  mode?: string;
  owner?: string;
  suid?: boolean;
  sgid?: boolean;
  worldWritable?: boolean;
  hidden?: boolean;
  note?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  status: "pass" | "fail" | "warn" | "info";
  detail: string;
  relatedOpId: string;
}

export interface RunData {
  users?: UserRecord[];
  services?: ServiceRecord[];
  ports?: PortRecord[];
  files?: FileRecord[];
  groups?: Array<{ name: string; members: string[]; privileged?: boolean }>;
  packages?: Array<{ name: string; version?: string; prohibited?: boolean }>;
  checklist?: ChecklistItem[];
  policy?: Record<string, string | number | boolean | null>;
  shares?: Array<{ name: string; path?: string; guest?: boolean; writable?: boolean }>;
  checksums?: Record<string, string>;
  extra?: Record<string, unknown>;
}

export interface RunResult {
  opId: string;
  title: string;
  category: Category;
  platforms: Platform;
  risk: Risk;
  mode: RunMode;
  ok: boolean;
  startedAt: string;
  finishedAt: string;
  summary: string;
  findings: Finding[];
  data: RunData;
  warnings: string[];
  blocked?: { reason: string };
  engine: "demo" | "linux" | "windows" | "bend" | "none";
}

export interface EngineContext {
  repoRoot: string;
  now: Date;
  params: Record<string, unknown>;
  confirm: boolean;
  op: OpDefinition;
  mode: RunMode;
}

export const SUSPICIOUS_PORTS = [23, 21, 69, 111, 135, 139, 445, 512, 513, 514, 1433, 3306, 3389, 5900, 4444, 31337];
export const EXPECTED_SUID = new Set([
  "/usr/bin/passwd",
  "/usr/bin/sudo",
  "/usr/bin/su",
  "/usr/bin/newgrp",
  "/usr/bin/chfn",
  "/usr/bin/chsh",
  "/usr/bin/gpasswd",
  "/usr/bin/pkexec",
  "/bin/su",
  "/bin/passwd",
  "/usr/bin/ping",
  "/usr/bin/mount",
  "/usr/bin/umount",
]);
