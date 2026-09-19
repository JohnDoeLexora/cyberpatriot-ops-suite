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
      "diff-expected-ports",
      "audit-share-acls",
      "audit-persistence-deep",
      "hunt-remote-access-tools",
      "report-password-never-expires",
      "audit-critical-perm-drift",
      "audit-sticky-tmp",
      "audit-anonymous-ftp",
      "harden-vsftpd",
      "audit-web-server",
      "select-unauthorized-users",
      "skim-forensics-readme",
      "remove-games-samples",
    ]) {
      assert.ok(existsSync(path.join(root, "engines/linux", `${id}.sh`)), id);
    }
  });

  it("has Bend 2 programs and a runner with fallback", () => {
    const root = findRepoRoot();
    for (const rel of [
      "engines/bend/cp_lib.bend",
      "engines/bend/score-files.bend",
      "engines/bend/score-users.bend",
      "engines/bend/score-ports.bend",
      "engines/bend/agg-checks.bend",
      "engines/bend/collect.py",
      "engines/bend/run.sh",
      "engines/bend/README.md",
      "config/expected-ports.txt",
      "config/remote-access-tools.txt",
      "config/games-samples.txt",
      "config/forensics-keywords.txt",
    ]) {
      assert.ok(existsSync(path.join(root, rel)), rel);
    }
  });
});
