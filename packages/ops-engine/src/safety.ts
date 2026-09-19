import type { OpDefinition } from "@cyberpatriot/ops-catalog";
import type { RunMode, RunResult } from "./types.js";

const SECRET_KEY =
  /(^|_|-)(password|passwd|shadow|hash|secret|token|private.?key|credential|api[_-]?key)$/i;
const CLASSIFICATION_KEYS = new Set(["passwordHidden", "passwordEmpty", "passwordSet"]);

export const USERNAME_RE = /^[A-Za-z0-9._\\$-]{1,64}$/;

export function isSafeUsername(name: string): boolean {
  if (!USERNAME_RE.test(name)) return false;
  if (name === "." || name === "..") return false;
  return true;
}

/** Local filesystem path only — never a URL or UNC share of another host. */
export function isSafeLocalPath(value: string): boolean {
  const p = value.trim();
  if (!p || p.includes("\0") || p.includes("://")) return false;
  if (/^\\\\/.test(p)) return false;
  if (p.startsWith("/")) return true;
  if (/^[A-Za-z]:[\\/]/.test(p)) return true;
  return false;
}

export function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

export function mutationBlocked(
  op: OpDefinition,
  mode: RunMode,
  confirm: boolean,
  dryRun: boolean,
): string | undefined {
  if (op.risk !== "mutate") return undefined;
  if (mode !== "live") return undefined;
  if (dryRun) return undefined;
  if (confirm === true) return undefined;
  return `Mutating op '${op.id}' in live mode requires confirm: true (or params.dryRun: true). Review the plan, then re-run with confirmation. See docs/SAFETY.md.`;
}

export function redactDeep<T>(value: T, key = ""): T {
  if (value == null) return value;
  if (SECRET_KEY.test(key) && !CLASSIFICATION_KEYS.has(key)) {
    return "[redacted]" as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactDeep(item, key)) as T;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = redactDeep(v, k);
    }
    return out as T;
  }
  return value;
}

export function baseResult(
  op: OpDefinition,
  mode: RunMode,
  startedAt: string,
  engine: RunResult["engine"],
): Omit<RunResult, "ok" | "finishedAt" | "summary" | "findings" | "data" | "warnings"> {
  return {
    opId: op.id,
    title: op.title,
    category: op.category,
    platforms: op.platforms,
    risk: op.risk,
    mode,
    startedAt,
    engine,
  };
}
