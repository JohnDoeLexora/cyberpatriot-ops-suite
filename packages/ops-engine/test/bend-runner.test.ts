import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, it } from "node:test";
import { getOp } from "@cyberpatriot/ops-catalog";
import { runOp } from "../src/index.ts";
import { bendDisabled, resolveBendBinary, tryRunBend } from "../src/bend/runner.ts";
import { findRepoRoot } from "../src/paths.ts";
import type { EngineContext } from "../src/types.ts";

function ctx(): EngineContext {
  const op = getOp("find-world-writable");
  assert.ok(op);
  return {
    repoRoot: findRepoRoot(),
    now: new Date(),
    params: {},
    confirm: false,
    op,
    mode: "live",
  };
}

describe("Bend accelerator", () => {
  it("resolves the local bend binary on this builder", () => {
    if (bendDisabled()) return;
    const bin = resolveBendBinary();
    if (!bin) return;
    assert.match(bin, /bend$/);
  });

  it("scores a files-ww inventory with Bend or the Python fallback", async () => {
    const result = await tryRunBend(ctx(), "files-ww");
    assert.ok(result, "collector/scorer should return a result");
    assert.equal(result.ok, true);
    assert.ok(result.engine === "bend" || result.engine === "fallback");
    assert.ok(Array.isArray(result.findings));
  });

  it("falls back to Python scoring when Bend is disabled", async () => {
    const prev = process.env.CP_BEND;
    process.env.CP_BEND = "0";
    try {
      const result = await tryRunBend(ctx(), "users");
      assert.ok(result);
      assert.equal(result.ok, true);
      assert.equal(result.engine, "fallback");
    } finally {
      if (prev === undefined) delete process.env.CP_BEND;
      else process.env.CP_BEND = prev;
    }
  });

  it("scores ports against the expected-ports baseline", async () => {
    const op = getOp("diff-expected-ports");
    assert.ok(op);
    const result = await tryRunBend({ ...ctx(), op }, "ports");
    assert.ok(result);
    assert.equal(result.ok, true);
  });

  it("typechecks Bend 2 programs against fixture inventories", () => {
    const bin = resolveBendBinary();
    if (!bin || bendDisabled()) return;
    const root = findRepoRoot();
    const cases: Array<[string, string, string]> = [
      ["score-files.bend", "files.tsv", "suid_bash"],
      ["score-users.bend", "users.tsv", "toor"],
      ["score-ports.bend", "ports.tsv", "31337"],
      ["agg-checks.bend", "agg.tsv", "telnet"],
    ];
    for (const [prog, tsv, needle] of cases) {
      const result = spawnSync(bin, [path.join(root, "engines/bend", prog)], {
        encoding: "utf8",
        env: {
          ...process.env,
          CP_BEND_INPUT: path.join(root, "engines/bend/fixtures", tsv),
          PATH: `${path.dirname(bin)}:${process.env.PATH ?? ""}`,
        },
      });
      assert.equal(result.status, 0, `${prog}: ${result.stderr}`);
      assert.ok(result.stdout.includes(needle), `${prog} should mention ${needle}`);
      assert.ok(result.stdout.includes('"engine":"bend"'), prog);
    }
  });

  it("live find-world-writable prefers Bend then fallback", async () => {
    if (process.platform === "win32") return;
    const result = await runOp({ opId: "find-world-writable", mode: "live" });
    assert.equal(result.ok, true);
    assert.ok(result.engine === "bend" || result.engine === "linux");
    assert.ok(Array.isArray(result.data.files));
  });
});
