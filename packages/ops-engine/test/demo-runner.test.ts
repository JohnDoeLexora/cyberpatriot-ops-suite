import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { catalog } from "@cyberpatriot/ops-catalog";
import { runOp } from "../src/index.ts";

function assertShape(result: Awaited<ReturnType<typeof runOp>>) {
  assert.equal(typeof result.opId, "string");
  assert.equal(typeof result.title, "string");
  assert.equal(typeof result.summary, "string");
  assert.equal(typeof result.ok, "boolean");
  assert.equal(typeof result.startedAt, "string");
  assert.equal(typeof result.finishedAt, "string");
  assert.ok(Array.isArray(result.findings));
  assert.ok(Array.isArray(result.warnings));
  assert.equal(typeof result.data, "object");
  assert.ok(result.engine === "demo" || result.engine === "linux" || result.engine === "windows" || result.engine === "none");
}

describe("demo runner output shape", () => {
  it("returns rich users for list-users", async () => {
    const result = await runOp({ opId: "list-users", mode: "demo" });
    assertShape(result);
    assert.equal(result.ok, true);
    assert.equal(result.mode, "demo");
    assert.ok(result.data.users && result.data.users.length >= 8);
    for (const user of result.data.users) {
      assert.equal(user.passwordHidden, true);
      assert.ok(!("hash" in user));
      assert.ok(!("password" in user) || user.password === undefined);
    }
  });

  it("returns rich services", async () => {
    const result = await runOp({ opId: "list-services", mode: "demo" });
    assertShape(result);
    assert.ok(result.data.services && result.data.services.length >= 8);
    assert.ok(result.data.services.some((s) => s.name === "sshd"));
    assert.ok(result.data.services.some((s) => s.name === "telnet"));
  });

  it("returns rich ports", async () => {
    const result = await runOp({ opId: "audit-listening-ports", mode: "demo" });
    assertShape(result);
    assert.ok(result.data.ports && result.data.ports.length >= 6);
    assert.ok(result.findings.length >= 1);
    assert.ok(result.data.ports.some((p) => p.port === 22));
    assert.ok(result.data.ports.some((p) => p.port === 31337));
  });

  it("returns rich files for media and suid", async () => {
    const media = await runOp({ opId: "find-media-files", mode: "demo" });
    const suid = await runOp({ opId: "find-suid-sgid", mode: "demo" });
    assertShape(media);
    assertShape(suid);
    assert.ok(media.data.files && media.data.files.length >= 2);
    assert.ok(suid.data.files && suid.data.files.length >= 1);
    assert.ok(media.data.files.some((f) => f.path.endsWith(".mp3") || f.path.endsWith(".mp4")));
  });

  it("flag-suspicious-users returns scored findings", async () => {
    const result = await runOp({ opId: "flag-suspicious-users", mode: "demo" });
    assertShape(result);
    assert.ok(result.findings.length >= 3);
    const names = new Set((result.data.users ?? []).map((u) => u.name));
    assert.ok(names.has("toor"));
    assert.ok(names.has("hacker123"));
    assert.ok(result.findings.some((f) => (f.signals ?? []).includes("uid-weirdness")));
    assert.ok(result.findings.some((f) => (f.signals ?? []).includes("not-in-allowlist")));
  });

  it("every catalog op produces a demo result", async () => {
    for (const op of catalog) {
      const result = await runOp({ opId: op.id, mode: "demo", params: { username: "hacker123", service: "telnet", package: "nmap" } });
      assertShape(result);
      assert.equal(result.opId, op.id, op.id);
      assert.equal(result.ok, true, op.id);
      assert.equal(result.engine, "demo", op.id);
    }
  });

  it("live mutate without confirm is blocked", async () => {
    const result = await runOp({ opId: "disable-user", mode: "live", params: { username: "hacker123" } });
    assert.equal(result.ok, false);
    assert.ok(result.blocked?.reason);
    assert.match(result.blocked?.reason ?? "", /confirm/);
  });

  it("live mutate dryRun is not blocked", async () => {
    const result = await runOp({
      opId: "disable-user",
      mode: "live",
      params: { username: "hacker123", dryRun: true },
    });
    assert.equal(result.blocked, undefined);
    assert.equal(typeof result.summary, "string");
  });

  it("demo timestamps are deterministic", async () => {
    const a = await runOp({ opId: "list-users", mode: "demo" });
    const b = await runOp({ opId: "list-users", mode: "demo" });
    assert.equal(a.startedAt, b.startedAt);
    assert.equal(a.startedAt, "2026-09-18T18:00:00.000Z");
  });

  it("live list-users returns a user inventory on Linux", async () => {
    if (process.platform === "win32") return;
    const result = await runOp({ opId: "list-users", mode: "live" });
    assertShape(result);
    assert.equal(result.engine, "linux");
    assert.ok(result.data.users && result.data.users.length >= 1);
    assert.ok(result.data.users.every((u) => u.passwordHidden === true));
  });

  it("evidence ops return checklist or score data", async () => {
    const check = await runOp({ opId: "one-click-hardening-checklist", mode: "demo" });
    const score = await runOp({ opId: "score-image-heuristics", mode: "demo" });
    assert.ok(check.data.checklist && check.data.checklist.length >= 8);
    assert.equal(typeof score.data.extra?.remainingWork, "number");
  });
});
