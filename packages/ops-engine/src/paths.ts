import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function findRepoRoot(start = process.cwd()): string {
  let dir = path.resolve(start);
  for (let i = 0; i < 10; i++) {
    if (
      existsSync(path.join(dir, "packages/ops-catalog")) &&
      existsSync(path.join(dir, "packages/ops-engine"))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
}

export function readNameList(filePath: string): string[] {
  if (!existsSync(filePath)) return [];
  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

export function resolveConfigFile(
  repoRoot: string,
  paramPath: unknown,
  fallbackRel: string,
): string {
  if (typeof paramPath === "string" && paramPath.trim()) {
    return path.isAbsolute(paramPath) ? paramPath : path.resolve(repoRoot, paramPath);
  }
  return path.resolve(repoRoot, fallbackRel);
}
