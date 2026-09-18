import { getOp } from "@cyberpatriot/ops-catalog";
import { runDemo, demoNow } from "./demo/runner.js";
import { runLinux } from "./linux/runner.js";
import { findRepoRoot, readNameList, resolveConfigFile } from "./paths.js";
import { asBoolean, mutationBlocked, redactDeep } from "./safety.js";
import type { EngineContext, RunRequest, RunResult } from "./types.js";
import { runWindows } from "./windows/runner.js";

export async function runOp(request: RunRequest, repoRoot = findRepoRoot()): Promise<RunResult> {
  const startedAt = new Date().toISOString();
  const op = getOp(request.opId);
  if (!op) {
    return {
      opId: request.opId,
      title: request.opId,
      category: "evidence",
      platforms: "both",
      risk: "read",
      mode: request.mode,
      ok: false,
      startedAt,
      finishedAt: new Date().toISOString(),
      summary: `Unknown op '${request.opId}'`,
      findings: [],
      data: {},
      warnings: [`Op not in catalog: ${request.opId}`],
      engine: "none",
    };
  }

  let params = { ...(request.params ?? {}) };
  const confirm = request.confirm === true;
  const dryRun = asBoolean(params.dryRun, false);
  const mode = request.mode === "live" ? "live" : "demo";

  if (mode === "demo" && params.allowlistNames == null) {
    const file = resolveConfigFile(repoRoot, params.allowlistPath, "config/allowed-users.txt");
    const names = readNameList(file);
    if (names.length) params = { ...params, allowlistNames: names };
  }

  const ctx: EngineContext = {
    repoRoot,
    now: mode === "demo" ? demoNow() : new Date(),
    params,
    confirm,
    op,
    mode,
  };

  const blocked = mutationBlocked(op, mode, confirm, dryRun);
  if (blocked) {
    return {
      opId: op.id,
      title: op.title,
      category: op.category,
      platforms: op.platforms,
      risk: op.risk,
      mode,
      ok: false,
      startedAt,
      finishedAt: new Date().toISOString(),
      summary: "Blocked: live mutation requires confirm:true",
      findings: [],
      data: {},
      warnings: [blocked],
      blocked: { reason: blocked },
      engine: "none",
    };
  }

  let result: RunResult;
  if (mode === "demo") {
    result = runDemo(ctx);
  } else if (op.platforms === "windows") {
    result = await runWindows(ctx);
  } else if (op.platforms === "linux") {
    result = await runLinux(ctx);
  } else if (process.platform === "win32") {
    result = await runWindows(ctx);
  } else {
    result = await runLinux(ctx);
  }

  return redactDeep(result);
}
