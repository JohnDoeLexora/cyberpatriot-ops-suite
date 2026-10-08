import path from "node:path";
import { runCmd } from "../linux/exec.js";
import { mapScriptPayload } from "../script-result.js";
import { asBoolean, asString } from "../safety.js";
import type { EngineContext, RunResult } from "../types.js";

export function windowsScriptPath(repoRoot: string, opId: string): string {
  return path.join(repoRoot, "engines", "windows", `${opId}.ps1`);
}

export async function runWindows(ctx: EngineContext): Promise<RunResult> {
  const startedAt = new Date().toISOString();
  const script = windowsScriptPath(ctx.repoRoot, ctx.op.id);
  const dispatcher = path.join(ctx.repoRoot, "engines", "windows", "Invoke-CpOp.ps1");
  const dryRun = asBoolean(ctx.params.dryRun, false);

  const base = {
    opId: ctx.op.id,
    title: ctx.op.title,
    category: ctx.op.category,
    platforms: ctx.op.platforms,
    risk: ctx.op.risk,
    mode: ctx.mode,
    startedAt,
    engine: "windows" as const,
    findings: [] as RunResult["findings"],
    data: { extra: { script, dispatcher } },
  };

  if (process.platform !== "win32") {
    return {
      ...base,
      ok: false,
      finishedAt: new Date().toISOString(),
      summary: `Windows live engine is documented at ${script}. This host is ${process.platform}; PowerShell was not executed.`,
      warnings: [
        "Live Windows ops require a Windows CyberPatriot image.",
        `Per-op script: ${script}`,
        `Dispatcher: ${dispatcher} -OpId ${ctx.op.id}`,
      ],
    };
  }

  const args = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script];
  const username = asString(ctx.params.username);
  const service = asString(ctx.params.service);
  const pkg = asString(ctx.params.package);
  const allow = asString(ctx.params.allowlistPath);
  const admins = asString(ctx.params.adminsPath);
  const template = asString(ctx.params.templatePath);
  const profile = asString(ctx.params.profilePath);
  const features = asString(ctx.params.featuresPath);
  if (username) args.push("-Username", username);
  if (service) args.push("-Service", service);
  if (pkg) args.push("-Package", pkg);
  if (allow) args.push("-AllowlistPath", allow);
  if (admins) args.push("-AdminsPath", admins);
  if (template) args.push("-TemplatePath", template);
  if (profile) args.push("-ProfilePath", profile);
  if (features) args.push("-FeaturesPath", features);
  if (dryRun) args.push("-DryRun");
  if (ctx.confirm) args.push("-ConfirmLive");
  const timeout = ctx.op.id === "run-sfc-scan" ? 180000 : 60000;
  const result = await runCmd("powershell.exe", args, timeout);
  let parsed: Record<string, unknown> | undefined;
  try {
    const start = result.stdout.indexOf("{");
    const end = result.stdout.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const value = JSON.parse(result.stdout.slice(start, end + 1)) as unknown;
      if (value && typeof value === "object" && !Array.isArray(value)) parsed = value as Record<string, unknown>;
    }
  } catch {
    parsed = undefined;
  }
  const mapped = mapScriptPayload(parsed, result.code, "windows", result.stderr);
  return {
    ...base,
    ok: mapped.ok,
    finishedAt: new Date().toISOString(),
    summary: mapped.summary,
    findings: mapped.findings,
    data: { ...mapped.data, extra: { ...(mapped.data.extra ?? {}), script, dispatcher } },
    warnings: mapped.warnings,
    engine: mapped.engine,
  };
}
