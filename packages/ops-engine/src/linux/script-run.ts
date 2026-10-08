import { existsSync } from "node:fs";
import path from "node:path";
import {
  findingsFromUnauthorized,
  findingsFromUsers,
  scoreUsers,
  selectUnauthorizedUsers,
} from "../heuristics/suspicious-users.js";
import { readNameList, resolveConfigFile } from "../paths.js";
import { mapScriptPayload } from "../script-result.js";
import { asBoolean, asString, isSafeLocalPath, isSafeUsername } from "../safety.js";
import type { EngineContext, RunResult, UserRecord } from "../types.js";
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
  "find-world-writable",
  "find-suid-sgid",
  "find-media-files",
  "find-hidden-executables",
  "find-backdoor-binaries",
  "find-prohibited-software",
  "hunt-remote-access-tools",
  "hunt-shell-backdoors",
  "hunt-sysprep-leftovers",
  "audit-listening-ports",
  "diff-expected-ports",
  "audit-critical-perm-drift",
  "audit-sticky-tmp",
  "skim-forensics-readme",
  "scoreboard-preflight",
  "post-harden-checklist",
  "one-click-hardening-checklist",
  "score-image-heuristics",
  "list-installed-packages",
  "check-pending-updates",
]);

/** Unit names such as telnet.socket or serial-getty@ttyS0. No shell metacharacters. */
function isSafeUnit(value: string): boolean {
  return /^[A-Za-z0-9:_.@+-]{1,128}$/.test(value);
}

function isSafePackage(value: string): boolean {
  return /^[A-Za-z0-9._+-]{1,128}$/.test(value);
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

function parsePayload(stdout: string): Record<string, unknown> | undefined {
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start < 0 || end <= start) return undefined;
  try {
    const parsed = JSON.parse(stdout.slice(start, end + 1)) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    return parsed as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function allowlistOf(ctx: EngineContext): Set<string> {
  const file = localPath(ctx.repoRoot, asString(ctx.params.allowlistPath), "config/allowed-users.txt");
  return new Set(file ? readNameList(file) : []);
}

/**
 * The shell inventory is the only collector. Scoring stays here so the user
 * table and findings match the shape the dashboard already renders.
 */
function scoreReadUsers(ctx: EngineContext, users: UserRecord[], mappedSummary: string, mappedFindings: RunResult["findings"]) {
  const scored = scoreUsers(users, { allowlist: allowlistOf(ctx), now: ctx.now });
  if (ctx.op.id === "flag-suspicious-users") {
    const findings = findingsFromUsers(scored);
    return {
      users: scored.filter((user) => (user.suspicionScore ?? 0) >= 10),
      findings,
      summary: `Heuristic pack scored ${scored.length} accounts; ${findings.length} above threshold.`,
      extra: { unauthorizedNames: selectUnauthorizedUsers(scored, allowlistOf(ctx)).names },
    };
  }
  if (ctx.op.id === "select-unauthorized-users") {
    const allowlist = allowlistOf(ctx);
    const sel = selectUnauthorizedUsers(scored, allowlist);
    return {
      users: sel.unauthorized,
      findings: findingsFromUnauthorized(sel),
      summary: `${sel.names.length} unauthorized/extra-admin accounts; ${sel.missingAllowlist.length} allowlist names missing.`,
      extra: {
        unauthorizedNames: sel.names,
        extraAdmins: sel.extraAdmins.map((user) => user.name),
        missingAllowlist: sel.missingAllowlist,
      },
    };
  }
  return { users, findings: mappedFindings, summary: mappedSummary, extra: {} };
}

/**
 * Run engines/linux/<id>.sh. Reads and mutations share this path.
 * --dry-run never confirms. confirm:true on a mutating op passes --confirm and CP_CONFIRM=1.
 * Returns undefined only when the script file is not on disk.
 */
export async function runLinuxScript(ctx: EngineContext, startedAt: string): Promise<RunResult | undefined> {
  const script = linuxScriptPath(ctx.repoRoot, ctx.op.id);
  if (!existsSync(script)) return undefined;

  const dryRun = asBoolean(ctx.params.dryRun, false);
  const mutating = ctx.op.risk === "mutate";
  const args = [script];
  if (mutating) args.push(dryRun ? "--dry-run" : "--confirm");
  else if (dryRun) args.push("--dry-run");
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
  const mapped = mapScriptPayload(parsed, bash.code, "linux", bash.stderr);
  let { summary, findings, data, warnings, ok, engine } = mapped;
  data = { ...data, extra: { ...(data.extra ?? {}), script, dryRun } };

  const scoredIds = ctx.op.id === "flag-suspicious-users" || ctx.op.id === "select-unauthorized-users";
  if (scoredIds && data.users?.length && data.users.every((user) => user.suspicionScore == null)) {
    const scored = scoreReadUsers(ctx, data.users, summary, findings);
    summary = scored.summary;
    findings = scored.findings;
    data = {
      ...data,
      users: scored.users,
      extra: { ...(data.extra ?? {}), ...scored.extra },
    };
  }

  if (!parsed && bash.code !== 0 && !summary) {
    const err = bash.stderr.trim().split("\n").filter(Boolean).slice(-3).join(" ");
    summary = err || `${path.basename(script)} failed (exit ${bash.code}). Re-run with --dry-run and read the message above.`;
  }

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
    engine,
  };
}
