import { existsSync } from "node:fs";
import path from "node:path";
import { resolveConfigFile } from "../paths.js";
import { asBoolean, asString, isSafeLocalPath, isSafeUsername } from "../safety.js";
import type { EngineContext, Finding, FindingSeverity, RunResult } from "../types.js";
import { runCmd } from "./exec.js";

const USER_OPS = new Set([
  "disable-user",
  "lock-user",
  "remove-user-from-admins",
  "expire-user-password",
  "force-password-change",
]);

const SLOW_OPS = new Set([
  "apply-security-updates",
  "scan-malware-tools",
  "enable-fail2ban",
  "enable-unattended-upgrades",
  "remove-games-samples",
  "remove-package",
  "sync-authorized-users",
]);

const SEVERITIES = new Set<FindingSeverity>(["info", "low", "medium", "high", "critical"]);

/** Unit names such as telnet.socket or serial-getty@ttyS0. No shell metacharacters. */
function isSafeUnit(value: string): boolean {
  return /^[A-Za-z0-9:_.@+-]{1,128}$/.test(value);
}

function isSafePackage(value: string): boolean {
  return /^[A-Za-z0-9._+-]{1,128}$/.test(value);
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asFindings(value: unknown): Finding[] {
  if (!Array.isArray(value)) return [];
  const findings: Finding[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    if (typeof rec.id !== "string" || typeof rec.title !== "string") continue;
    if (typeof rec.severity !== "string" || !SEVERITIES.has(rec.severity as FindingSeverity)) continue;
    findings.push({
      id: rec.id,
      severity: rec.severity as FindingSeverity,
      title: rec.title,
      detail: typeof rec.detail === "string" ? rec.detail : undefined,
      resource: typeof rec.resource === "string" ? rec.resource : undefined,
      remediationOpId: typeof rec.remediationOpId === "string" ? rec.remediationOpId : undefined,
    });
  }
  return findings;
}

function localPath(repoRoot: string, value: string | undefined, fallbackRel?: string): string | undefined {
  if (value && isSafeLocalPath(value)) {
    return path.isAbsolute(value) ? value : path.resolve(repoRoot, value);
  }
  if (fallbackRel) return resolveConfigFile(repoRoot, undefined, fallbackRel);
  return undefined;
}

export function linuxScriptPath(repoRoot: string, opId: string): string {
  return path.join(repoRoot, "engines", "linux", `${opId}.sh`);
}

interface ScriptPayload {
  ok?: boolean;
  status?: string;
  summary?: string;
  changed?: number;
  alreadyOk?: number;
  skipped?: number;
  preview?: unknown;
  details?: unknown;
  warnings?: unknown;
  backupDir?: string | null;
  exitCode?: number;
  findings?: unknown;
  extra?: Record<string, unknown>;
}

function parsePayload(stdout: string): ScriptPayload | undefined {
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start < 0 || end <= start) return undefined;
  try {
    const parsed = JSON.parse(stdout.slice(start, end + 1)) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    return parsed as ScriptPayload;
  } catch {
    return undefined;
  }
}

function withPreview(summary: string, preview: string[]): string {
  const extra = preview.filter((line) => line && !summary.includes(line));
  if (!extra.length) return summary;
  return `${summary}\n${extra.join("\n")}`;
}

/**
 * Run engines/linux/<id>.sh for a mutating op.
 * Returns undefined when the op is read-only or the script is not on disk,
 * so the TypeScript collectors stay in charge of reads.
 * --dry-run never confirms. confirm:true passes --confirm and CP_CONFIRM=1.
 */
export async function runLinuxScript(ctx: EngineContext, startedAt: string): Promise<RunResult | undefined> {
  if (ctx.op.risk !== "mutate") return undefined;
  const script = linuxScriptPath(ctx.repoRoot, ctx.op.id);
  if (!existsSync(script)) return undefined;

  const dryRun = asBoolean(ctx.params.dryRun, false);
  const args = [script, dryRun ? "--dry-run" : "--confirm"];
  const username = asString(ctx.params.username);
  const service = asString(ctx.params.service);
  const pkg = asString(ctx.params.package);
  if (USER_OPS.has(ctx.op.id) && username && isSafeUsername(username)) args.push(username);

  const env: Record<string, string> = {
    CP_REPO_ROOT: ctx.repoRoot,
    CP_OP_ID: ctx.op.id,
    CP_DRY_RUN: dryRun ? "1" : "0",
    CP_CONFIRM: !dryRun && ctx.confirm ? "1" : "0",
  };
  if (username && isSafeUsername(username)) env.CP_USERNAME = username;
  if (service && isSafeUnit(service)) env.CP_SERVICE = service;
  if (pkg && isSafePackage(pkg)) env.CP_PACKAGE = pkg;
  if (asBoolean(ctx.params.force, false)) env.CP_FORCE = "1";
  if (asBoolean(ctx.params.disableIPv6, false)) env.CP_DISABLE_IPV6 = "1";
  if (asBoolean(ctx.params.usbStorage, false) || asBoolean(ctx.params.disableUsbStorage, false)) {
    env.CP_USB_STORAGE = "1";
    env.CP_DISABLE_USB_STORAGE = "1";
  }
  const allow = localPath(ctx.repoRoot, asString(ctx.params.allowlistPath), "config/allowed-users.txt");
  const admins = localPath(ctx.repoRoot, asString(ctx.params.adminsPath), "config/allowed-admins.txt");
  const games = localPath(ctx.repoRoot, asString(ctx.params.gamesListPath));
  const outputDir = localPath(ctx.repoRoot, asString(ctx.params.outputDir));
  if (allow) env.CP_ALLOWLIST = allow;
  if (admins) env.CP_ADMINS = admins;
  if (games) env.CP_GAMES_LIST = games;
  if (outputDir) env.CP_OUTPUT_DIR = outputDir;

  const timeout = SLOW_OPS.has(ctx.op.id) ? 120_000 : 25_000;
  const bash = await runCmd("bash", args, timeout, env);
  const parsed = parsePayload(bash.stdout);
  const preview = asStringList(parsed?.preview);
  const details = asStringList(parsed?.details);
  const scriptWarnings = asStringList(parsed?.warnings);
  const findings = asFindings(parsed?.findings);

  let summary: string;
  if (parsed && typeof parsed.summary === "string" && parsed.summary.trim()) {
    summary = withPreview(parsed.summary.trim(), preview);
  } else if (bash.code === 0) {
    summary = `Ran ${path.basename(script)} but it did not return a summary.`;
  } else {
    const err = bash.stderr.trim().split("\n").filter(Boolean).slice(-3).join(" ");
    summary = err || `${path.basename(script)} failed (exit ${bash.code}). Re-run with --dry-run and read the message above.`;
  }

  const status = parsed?.status;
  const previewOk = parsed?.ok === true && (status === "ok" || status === "preview" || status == null);
  const ok = bash.code === 0 && previewOk;

  const warnings = [...scriptWarnings];
  if (!ok) {
    const err = bash.stderr.trim();
    if (err && !summary.includes(err.slice(0, 180))) warnings.push(err.slice(0, 2000));
    if (!warnings.length) warnings.push(summary);
  }

  const extra: Record<string, unknown> = {
    ...(parsed?.extra ?? {}),
    script,
    dryRun,
    status: status ?? (ok ? "ok" : "error"),
    preview,
    details,
    backupDir: parsed?.backupDir ?? null,
    exitCode: typeof parsed?.exitCode === "number" ? parsed.exitCode : bash.code,
    changed: parsed?.changed,
    alreadyOk: parsed?.alreadyOk,
    skipped: parsed?.skipped,
  };

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
    data: { extra },
    warnings,
    engine: "linux",
  };
}
