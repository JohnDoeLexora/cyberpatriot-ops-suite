import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  CATEGORIES,
  assertCatalogIntegrity,
  catalog,
  getOp,
  listOps,
} from "../src/index.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

describe("ops catalog integrity", () => {
  it("has at least 50 operations", () => {
    assert.ok(catalog.length >= 50, `expected ≥50 ops, got ${catalog.length}`);
  });

  it("has unique kebab-case ids and required fields", () => {
    assert.doesNotThrow(() => assertCatalogIntegrity(catalog));
  });

  it("covers both platforms, both risk levels, and several categories", () => {
    const platforms = new Set(catalog.map((o) => o.platforms));
    const risks = new Set(catalog.map((o) => o.risk));
    const categories = new Set(catalog.map((o) => o.category));
    assert.ok(platforms.has("linux"));
    assert.ok(platforms.has("windows"));
    assert.ok(platforms.has("both"));
    assert.ok(risks.has("read"));
    assert.ok(risks.has("mutate"));
    assert.ok(categories.size >= 8);
    for (const c of categories) {
      assert.ok((CATEGORIES as readonly string[]).includes(c), c);
    }
  });

  it("looks up ops by id and supports filters", () => {
    const flagged = getOp("flag-suspicious-users");
    assert.ok(flagged);
    assert.equal(flagged.category, "users");
    assert.equal(flagged.risk, "read");
    const mutateLinux = listOps({ risk: "mutate", platform: "linux" });
    assert.ok(mutateLinux.length > 0);
    assert.ok(mutateLinux.every((o) => o.risk === "mutate"));
    assert.ok(mutateLinux.every((o) => o.platforms === "linux" || o.platforms === "both"));
    const search = listOps({ query: "suspicious" });
    assert.ok(search.some((o) => o.id === "flag-suspicious-users"));
  });

  it("includes the heuristic pack, evidence ops, and cp-05 expansions", () => {
    for (const id of [
      "flag-suspicious-users",
      "one-click-hardening-checklist",
      "export-evidence-bundle",
      "score-image-heuristics",
      "diff-expected-ports",
      "audit-share-acls",
      "audit-persistence-deep",
      "hunt-remote-access-tools",
      "report-password-never-expires",
      "audit-critical-perm-drift",
      "package-forensics-evidence",
      "scoreboard-preflight",
      "post-harden-checklist",
    ]) {
      assert.ok(getOp(id), id);
    }
  });

  it("mutate ops mention confirm in the description", () => {
    const missing = catalog.filter(
      (o) => o.risk === "mutate" && !/confirm/i.test(o.description),
    );
    assert.deepEqual(
      missing.map((o) => o.id),
      [],
      "every mutate op should mention confirm:true",
    );
  });
});

describe("generated docs", () => {
  it("docs/OPS.md lists every catalog id", () => {
    const docs = readFileSync(path.join(root, "docs/OPS.md"), "utf8");
    const missing = catalog.filter((o) => !docs.includes(o.id));
    assert.deepEqual(
      missing.map((o) => o.id),
      [],
      "docs/OPS.md must list every op id",
    );
  });
});
