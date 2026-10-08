import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { findRepoRoot } from "../src/index.ts";

const root = findRepoRoot();

describe("engine lint", () => {
  it("shellchecks Linux and Bend scripts", () => {
    const linux = readdirSync(path.join(root, "engines/linux"))
      .filter((name) => name.endsWith(".sh"))
      .map((name) => path.join("engines/linux", name));
    const bend = readdirSync(path.join(root, "engines/bend"))
      .filter((name) => name.endsWith(".sh"))
      .map((name) => path.join("engines/bend", name));
    execFileSync("shellcheck", ["-S", "warning", "-x", ...linux, ...bend], {
      cwd: root,
      stdio: "inherit",
    });
  });

  it("parses Windows scripts and runs Pester helpers when pwsh is installed", () => {
    const result = execFileSync("node", ["packages/ops-engine/scripts/parse-windows.mjs"], {
      cwd: root,
      encoding: "utf8",
    });
    assert.match(result, /Parsed|pwsh is not installed/);
  });
});
