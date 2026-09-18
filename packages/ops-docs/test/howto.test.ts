import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { catalog } from "@cyberpatriot/ops-catalog";
import {
  DASHBOARD_TO_CATALOG,
  GUIDES,
  assertHowtoIntegrity,
  getGuide,
  resolveHowtoOpId,
  searchHowto,
} from "../src/index.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

describe("how-to coverage", () => {
  it("has a guide for every catalog id", () => {
    assert.doesNotThrow(() => assertHowtoIntegrity(GUIDES));
    assert.equal(GUIDES.length, catalog.length);
    const missing = catalog.filter((op) => !getGuide(op.id)).map((op) => op.id);
    assert.deepEqual(missing, []);
  });

  it("docs/howto includes an index and a page per catalog id", () => {
    const dir = path.join(root, "docs/howto");
    const index = readFileSync(path.join(dir, "README.md"), "utf8");
    const files = new Set(readdirSync(dir));
    const missingPages: string[] = [];
    const missingIndex: string[] = [];
    for (const op of catalog) {
      if (!files.has(`${op.id}.md`)) missingPages.push(op.id);
      if (!index.includes(op.id)) missingIndex.push(op.id);
    }
    assert.deepEqual(missingPages, [], "missing markdown pages");
    assert.deepEqual(missingIndex, [], "index missing ids");
  });
});

describe("how-to search", () => {
  it("empty query returns every guide in catalog order", () => {
    const hits = searchHowto("");
    assert.equal(hits.length, GUIDES.length);
    assert.equal(hits[0]?.opId, catalog[0]?.id);
  });

  it("searches titles", () => {
    const hits = searchHowto("suspicious users");
    assert.ok(hits.some((g) => g.opId === "flag-suspicious-users"));
    assert.ok(hits.length < GUIDES.length);
  });

  it("searches body text (PermitRootLogin, remaining-work index, world-writable sudoers)", () => {
    const ssh = searchHowto("PermitRootLogin");
    assert.ok(ssh.some((g) => g.opId === "ssh-hardening-audit"));
    assert.ok(ssh.some((g) => g.opId === "disable-root-ssh"));

    const score = searchHowto("remaining-work index");
    assert.ok(score.some((g) => g.opId === "score-image-heuristics"));
    assert.equal(
      score.filter((g) => g.opId === "score-image-heuristics")[0]?.opId,
      "score-image-heuristics",
    );

    const ww = searchHowto("world-writable sudoers");
    assert.ok(ww.some((g) => g.opId === "find-world-writable"));
  });

  it("AND-matches tokens and returns nothing for nonsense", () => {
    const both = searchHowto("Guest blank password");
    assert.ok(both.some((g) => g.opId === "disable-guest-account"));
    assert.deepEqual(searchHowto("xyzzy-no-such-explainer-42"), []);
  });
});

describe("dashboard id mapping", () => {
  it("maps dotted dashboard ids onto catalog how-tos", () => {
    assert.equal(resolveHowtoOpId("users.list"), "list-users");
    assert.equal(resolveHowtoOpId("list-users"), "list-users");
    assert.equal(resolveHowtoOpId("auth.ssh-harden"), "ssh-hardening-audit");
    assert.equal(resolveHowtoOpId("no.such.op"), undefined);
    for (const catalogId of Object.values(DASHBOARD_TO_CATALOG)) {
      assert.ok(getGuide(catalogId), catalogId);
    }
  });
});

describe("competition-legal tone", () => {
  it("does not ship exploit recipes or scoring cheats", () => {
    const forbidden = [
      /how to exploit/i,
      /weaponize/i,
      /attack the scoring/i,
      /msfvenom/i,
      /cheat the CCS/i,
      /reverse.?shell payload/i,
    ];
    const offenders: string[] = [];
    for (const guide of GUIDES) {
      const blob = [
        guide.what,
        guide.whyItScores,
        guide.whenToRun,
        ...guide.steps,
        ...guide.goodLooksLike,
        ...guide.risks,
      ].join("\n");
      for (const re of forbidden) {
        if (re.test(blob)) offenders.push(`${guide.opId} ~ ${re}`);
      }
    }
    assert.deepEqual(offenders, []);
  });
});
