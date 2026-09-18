import path from "node:path";
import type { EngineContext, RunResult } from "../types.js";
import { runCmd } from "../linux/exec.js";
import { asBoolean } from "../safety.js";

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
  if (dryRun) args.push("-DryRun");
  if (ctx.confirm) args.push("-ConfirmLive");
  const result = await runCmd("powershell.exe", args, 60000);
  const ok = result.code === 0;
  let data: RunResult["data"] = { extra: { script, stdout: result.stdout.slice(0, 8000) } };
  try {
    const parsed = JSON.parse(result.stdout);
    if (parsed && typeof parsed === "object") data = parsed as RunResult["data"];
  } catch {
    // keep raw stdout
  }
  return {
    ...base,
    ok,
    finishedAt: new Date().toISOString(),
    summary: ok ? `PowerShell ${ctx.op.id} completed` : `PowerShell ${ctx.op.id} failed`,
    data,
    warnings: ok ? [] : [result.stderr.slice(0, 2000) || `exit ${result.code}`],
  };
}
