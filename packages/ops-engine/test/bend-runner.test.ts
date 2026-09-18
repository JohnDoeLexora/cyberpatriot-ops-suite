import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getOp } from "@cyberpatriot/ops-catalog";
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
});
