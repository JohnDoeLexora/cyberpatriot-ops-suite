import type { EngineContext, RunResult } from "../types.js";
import { runLinuxScript } from "./script-run.js";

/**
 * Live Linux execution is engines/linux/<op-id>.sh.
 * The old TypeScript collectors (collect.ts, cp07-collect.ts, cp09.ts, cp10.ts, mutate.ts)
 * are retired from this path. Demo mode still uses the in-process fixtures.
 */
export async function runLinux(ctx: EngineContext): Promise<RunResult> {
  const startedAt = new Date().toISOString();
  const scripted = await runLinuxScript(ctx, startedAt);
  if (scripted) return scripted;

  const summary =
    ctx.op.platforms === "windows"
      ? "This op is Windows-only. Use engines/windows/*.ps1 on a Windows image."
      : `No engine script for ${ctx.op.id}. Live reads and changes run engines/linux/${ctx.op.id}.sh.`;
  return {
    opId: ctx.op.id,
    title: ctx.op.title,
    category: ctx.op.category,
    platforms: ctx.op.platforms,
    risk: ctx.op.risk,
    mode: "live",
    ok: false,
    startedAt,
    finishedAt: new Date().toISOString(),
    summary,
    findings: [],
    data: {},
    warnings: [summary],
    engine: "linux",
  };
}
