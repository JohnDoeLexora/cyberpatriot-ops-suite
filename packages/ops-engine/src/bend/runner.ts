import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { runCmd } from "../linux/exec.js";
import type { EngineContext, FileRecord, Finding, FindingSeverity } from "../types.js";

export const BEND_KINDS = [
  "files-ww",
  "files-suid",
  "files-media",
  "files-hidden",
  "files-rats",
  "files-perms",
  "files-sticky",
  "files-sysprep",
  "files-readme",
  "users",
  "ports",
  "agg",
] as const;

export type BendKind = (typeof BEND_KINDS)[number];

export interface BendHit {
  path: string;
  severity: FindingSeverity | string;
  tags: string;
  score: number;
}

export interface BendScanResult {
  ok: boolean;
  engine: "bend" | "fallback";
  kind: string;
  count: number;
  totalScore: number;
  findings: BendHit[];
  raw: string;
}

const TAG_FILTER: Partial<Record<BendKind, string[]>> = {
  "files-ww": ["world-writable"],
  "files-suid": ["suid", "sgid"],
  "files-media": ["media"],
  "files-hidden": ["hidden", "netcat-like"],
  "files-rats": ["remote-access"],
  "files-perms": ["shadow", "sudoers", "world-writable"],
  "files-sticky": ["missing-sticky", "world-writable", "plant-path"],
  "files-sysprep": ["sysprep"],
  "files-readme": ["readme"],
};

export function bendDir(repoRoot: string): string {
  return path.join(repoRoot, "engines", "bend");
}

export function resolveBendBinary(): string | undefined {
  const home = process.env.HOME ?? "";
  const candidates = [
    process.env.BEND_BIN,
    "/home/box/.bend/bin/bend",
    home ? path.join(home, ".bend/bin/bend") : undefined,
  ].filter((p): p is string => Boolean(p));
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

function parseJsonObject(text: string): Record<string, unknown> | undefined {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return undefined;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function asHits(value: unknown): BendHit[] {
  if (!Array.isArray(value)) return [];
  const hits: BendHit[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    if (typeof rec.path !== "string") continue;
    hits.push({
      path: rec.path,
      severity: typeof rec.severity === "string" ? rec.severity : "medium",
      tags: typeof rec.tags === "string" ? rec.tags : "",
      score: typeof rec.score === "number" ? rec.score : Number(rec.score) || 0,
    });
  }
  return hits;
}

export function filterHits(kind: BendKind, hits: BendHit[]): BendHit[] {
  const tags = TAG_FILTER[kind];
  if (!tags) return hits;
  return hits.filter((hit) => tags.some((tag) => hit.tags.split(",").includes(tag)));
}

export function hitsToFiles(hits: BendHit[]): FileRecord[] {
  return hits.map((hit) => ({
    path: hit.path,
    kind: "file" as const,
    note: hit.tags,
    worldWritable: hit.tags.includes("world-writable"),
    suid: hit.tags.includes("suid"),
    sgid: hit.tags.includes("sgid"),
    hidden: hit.tags.includes("hidden"),
  }));
}

export function hitsToFindings(hits: BendHit[], remediationOpId?: string): Finding[] {
  return hits.slice(0, 40).map((hit) => {
    const severity: FindingSeverity =
      hit.severity === "critical" ||
      hit.severity === "high" ||
      hit.severity === "medium" ||
      hit.severity === "low" ||
      hit.severity === "info"
        ? hit.severity
        : hit.score >= 40
          ? "critical"
          : hit.score >= 25
            ? "high"
            : hit.score >= 10
              ? "medium"
              : "low";
    return {
      id: `bend:${hit.path}`,
      severity,
      title: hit.path,
      detail: hit.tags || "Bend parallel score",
      resource: hit.path,
      score: Math.min(100, hit.score),
      signals: hit.tags ? hit.tags.split(",").filter(Boolean) : undefined,
      remediationOpId,
    };
  });
}

export function bendDisabled(): boolean {
  return process.env.CP_BEND === "0" || process.env.BEND_DISABLE === "1";
}

export async function tryRunBend(
  ctx: EngineContext,
  kind: BendKind,
  timeout = 45000,
): Promise<BendScanResult | undefined> {
  const dir = bendDir(ctx.repoRoot);
  const collectPy = path.join(dir, "collect.py");
  const runSh = path.join(dir, "run.sh");
  if (!existsSync(collectPy)) return undefined;

  const bendBin = resolveBendBinary();
  const extraPath = `${path.dirname(bendBin ?? "/home/box/.bend/bin/bend")}${path.delimiter}${process.env.PATH ?? ""}`;

  if (!bendDisabled() && bendBin && existsSync(runSh)) {
    const viaScript = await runCmd("bash", [runSh, kind], timeout, { PATH: extraPath });
    const parsedScript = parseJsonObject(viaScript.stdout);
    if (parsedScript && parsedScript.ok === true) {
      const hits = filterHits(kind, asHits(parsedScript.findings));
      const engine = parsedScript.engine === "bend" ? "bend" : "fallback";
      return {
        ok: true,
        engine,
        kind: String(parsedScript.kind ?? kind),
        count: hits.length,
        totalScore: Number(parsedScript.totalScore ?? 0),
        findings: hits,
        raw: viaScript.stdout,
      };
    }

    const collect = await runCmd("python3", [collectPy, kind, "--repo", ctx.repoRoot], Math.min(timeout, 25000));
    if (collect.code === 0) {
      const tmp = mkdtempSync(path.join(tmpdir(), "cp-bend-"));
      const tsv = path.join(tmp, "inv.tsv");
      try {
        writeFileSync(tsv, collect.stdout, "utf8");
        const prog =
          kind === "users"
            ? path.join(dir, "score-users.bend")
            : kind === "ports"
              ? path.join(dir, "score-ports.bend")
              : kind === "agg"
                ? path.join(dir, "agg-checks.bend")
                : path.join(dir, "score-files.bend");
        const scored = await runCmd(bendBin, [prog], timeout, {
          CP_BEND_INPUT: tsv,
          PATH: extraPath,
        });
        const parsed = parseJsonObject(scored.stdout);
        if (parsed && parsed.ok === true) {
          const hits = filterHits(kind, asHits(parsed.findings));
          return {
            ok: true,
            engine: "bend",
            kind: String(parsed.kind ?? kind),
            count: hits.length,
            totalScore: Number(parsed.totalScore ?? 0),
            findings: hits,
            raw: scored.stdout,
          };
        }
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    }
  }

  const fallback = await runCmd("python3", [collectPy, kind, "--repo", ctx.repoRoot, "--score-fallback"], timeout);
  const parsed = parseJsonObject(fallback.stdout);
  if (!parsed || parsed.ok !== true) return undefined;
  const hits = filterHits(kind, asHits(parsed.findings));
  return {
    ok: true,
    engine: "fallback",
    kind: String(parsed.kind ?? kind),
    count: hits.length,
    totalScore: Number(parsed.totalScore ?? 0),
    findings: hits,
    raw: fallback.stdout,
  };
}

export function loadFixtureTsv(repoRoot: string, name: string): string {
  return readFileSync(path.join(bendDir(repoRoot), "fixtures", name), "utf8");
}
