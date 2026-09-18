import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { catalog } from "@cyberpatriot/ops-catalog";
import { findRepoRoot } from "../src/index.ts";

describe("engine scripts on disk", () => {
  it("has a Windows ps1 wrapper for every catalog op", () => {
    const root = findRepoRoot();
    const missing = catalog
      .map((op) => op.id)
      .filter((id) => !existsSync(path.join(root, "engines/windows", `${id}.ps1`)));
    assert.deepEqual(missing, []);
    assert.ok(existsSync(path.join(root, "engines/windows/Invoke-CpOp.ps1")));
    assert.ok(existsSync(path.join(root, "engines/windows/lib/CpOps.psm1")));
  });

  it("has a Linux shell subset for core read ops", () => {
    const root = findRepoRoot();
    for (const id of [
      "list-users",
      "flag-suspicious-users",
      "audit-listening-ports",
      "list-services",
      "find-world-writable",
      "find-suid-sgid",
      "harden-sshd",
      "harden-sysctl",
    ]) {
      assert.ok(existsSync(path.join(root, "engines/linux", `${id}.sh`)), id);
    }
  });
});
