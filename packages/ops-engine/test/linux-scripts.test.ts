import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, it } from "node:test";
import { catalog } from "@cyberpatriot/ops-catalog";
import { findRepoRoot, runOp } from "../src/index.ts";

const execFileAsync = promisify(execFile);
const root = findRepoRoot();
const linuxDir = path.join(root, "engines/linux");

function sha(file: string): string {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

async function runBash(script: string, args: string[], env: Record<string, string>, timeout = 20000) {
  try {
    const { stdout, stderr } = await execFileAsync("bash", [script, ...args], {
      timeout,
      maxBuffer: 2_000_000,
      env: { ...process.env, ...env },
    });
    return { code: 0, stdout: String(stdout), stderr: String(stderr) };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; code?: number | string };
    return {
      code: typeof err.code === "number" ? err.code : 1,
      stdout: String(err.stdout ?? ""),
      stderr: String(err.stderr ?? ""),
    };
  }
}

function parseJson(stdout: string): Record<string, unknown> {
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  assert.ok(start >= 0 && end > start, stdout.slice(0, 400));
  return JSON.parse(stdout.slice(start, end + 1)) as Record<string, unknown>;
}

describe("linux engine scripts", () => {
  it("has a shell script for every non-windows catalog op", () => {
    const missing = catalog
      .filter((op) => op.platforms !== "windows")
      .map((op) => op.id)
      .filter((id) => !existsSync(path.join(linuxDir, `${id}.sh`)));
    assert.deepEqual(missing, []);
  });

  it("dry-runs every Linux mutating script without touching the fixture or /etc/login.defs", async () => {
    const loginDefs = "/etc/login.defs";
    const before = existsSync(loginDefs) ? sha(loginDefs) : "";
    const dir = mkdtempSync(path.join(tmpdir(), "cp-dry-"));
    const fixture = path.join(dir, "root");
    mkdirSync(path.join(fixture, "etc"), { recursive: true });
    writeFileSync(path.join(fixture, "etc/login.defs"), "PASS_MAX_DAYS\t99999\n");
    const fixtureHash = sha(path.join(fixture, "etc/login.defs"));
    const env = {
      CP_ROOT: fixture,
      CP_BACKUP_ROOT: path.join(dir, "backups"),
      CP_REPO_ROOT: root,
      CP_FAST: "1",
      CP_SKIP_BEND: "1",
      CP_SCAN_ROOT: path.join(dir, "scan"),
      CP_OUTPUT_DIR: path.join(dir, "out"),
      CP_USERNAME: "hacker123",
      CP_SERVICE: "telnet.socket",
      CP_PACKAGE: "nmap",
    };
    mkdirSync(env.CP_SCAN_ROOT, { recursive: true });
    mkdirSync(env.CP_OUTPUT_DIR, { recursive: true });
    const mutate = catalog.filter((op) => op.risk === "mutate" && op.platforms !== "windows");
    try {
      for (const op of mutate) {
        const script = path.join(linuxDir, `${op.id}.sh`);
        const result = await runBash(script, ["--dry-run"], env, 25000);
        const payload = parseJson(result.stdout);
        assert.ok([0, 1, 2, 3].includes(result.code), `${op.id} exit ${result.code} ${result.stderr}`);
        if (typeof payload.opId === "string") assert.equal(payload.opId, op.id);
        assert.match(String(payload.status), /^(ok|preview|skipped|error|refused)$/, op.id);
        assert.equal(typeof payload.summary, "string", op.id);
        assert.match(String(payload.summary), /\S/, op.id);
        const blob = `${result.stdout}\n${result.stderr}`;
        assert.doesNotMatch(blob, /\$[156]\$[A-Za-z0-9./]{8,}/, op.id);
        assert.doesNotMatch(blob, /psk\s*=\s*\S+/i, op.id);
      }
      assert.equal(sha(path.join(fixture, "etc/login.defs")), fixtureHash);
      if (before) assert.equal(sha(loginDefs), before);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("applies enforce-password-policy twice inside a fixture and the second run is already compliant", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "cp-idem-"));
    const fixture = path.join(dir, "root");
    mkdirSync(path.join(fixture, "etc/security/pwquality.conf.d"), { recursive: true });
    const defs = path.join(fixture, "etc/login.defs");
    writeFileSync(defs, "PASS_MAX_DAYS\t99999\nPASS_MIN_DAYS\t0\nPASS_MIN_LEN\t5\nPASS_WARN_AGE\t7\n");
    const script = path.join(linuxDir, "enforce-password-policy.sh");
    const env = {
      CP_ROOT: fixture,
      CP_BACKUP_ROOT: path.join(dir, "backups"),
      CP_REPO_ROOT: root,
      CP_FAST: "1",
    };
    try {
      const first = await runBash(script, ["--confirm"], env);
      const firstJson = parseJson(first.stdout);
      assert.equal(first.code, 0, first.stderr);
      assert.equal(firstJson.status, "ok");
      assert.match(String(firstJson.summary), /Changed [1-9]/);
      assert.match(readFileSync(defs, "utf8"), /PASS_MAX_DAYS\t90/);
      const backups = readdirSync(env.CP_BACKUP_ROOT);
      assert.ok(backups.length >= 1, "backup directory was created");
      const second = await runBash(script, ["--confirm"], env);
      const secondJson = parseJson(second.stdout);
      assert.equal(second.code, 0, second.stderr);
      assert.match(String(secondJson.summary), /Changed 0 settings/);
      assert.match(String(secondJson.summary), /already OK/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("skips with exit 3 when a required command is missing", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "cp-skip-"));
    const script = path.join(dir, "missing.sh");
    writeFileSync(
      script,
      `#!/usr/bin/env bash
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "${linuxDir}/_lib.sh"
cp_need_cmd __cp_definitely_missing_tool__ "Install it with: this fixture only."
`,
    );
    try {
      const result = await runBash(script, [], { CP_REPO_ROOT: root });
      assert.equal(result.code, 3, result.stderr);
      const payload = parseJson(result.stdout);
      assert.equal(payload.status, "skipped");
      assert.match(String(payload.summary), /Skipped: __cp_definitely_missing_tool__ is not installed/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("live read scripts return JSON and do not print hashes", async () => {
    const reads = ["list-users", "list-groups", "audit-hosts-file", "ssh-hardening-audit", "audit-firewall"];
    for (const id of reads) {
      const result = await runBash(path.join(linuxDir, `${id}.sh`), [], {
        CP_REPO_ROOT: root,
        CP_SKIP_BEND: "1",
        CP_FAST: "1",
        CP_SCAN_ROOT: "/tmp",
      });
      const payload = parseJson(result.stdout);
      assert.equal(typeof payload.summary === "string" || typeof payload.ok === "boolean", true, id);
      const blob = `${result.stdout}\n${result.stderr}`;
      assert.doesNotMatch(blob, /\$[156]\$[A-Za-z0-9./]{8,}/, id);
      if (id === "audit-firewall" && result.code === 3) {
        assert.match(String(payload.summary), /Skipped:/);
      }
    }
  });
});

describe("runner dry-run contract", () => {
  it("preflight for a missing firewall tool is a structured skip or a preview", async () => {
    const result = await runOp({ opId: "enable-firewall", mode: "live", params: { dryRun: true } });
    assert.equal(result.blocked, undefined);
    assert.match(result.summary, /Skipped: ufw|Preview:|Will enable/);
    assert.equal(result.engine, "linux");
  });

  it("propagates a script error instead of a silent pass", async () => {
    const result = await runOp({
      opId: "disable-user",
      mode: "live",
      params: { username: "hacker123", dryRun: true },
    });
    assert.equal(result.blocked, undefined);
    assert.equal(typeof result.summary, "string");
    const exitCode = result.data.extra?.exitCode;
    if (result.ok === false) {
      assert.equal(typeof exitCode, "number");
      assert.notEqual(exitCode, 0);
    }
  });

  it("apparmor preflight does not report success when aa-enforce is missing", async () => {
    const result = await runOp({ opId: "enforce-apparmor-profiles", mode: "live", params: { dryRun: true } });
    assert.equal(result.blocked, undefined);
    assert.match(result.summary, /Skipped: aa-enforce|Preview:|Will enforce/);
    if (/Skipped: aa-enforce/.test(result.summary)) assert.equal(result.ok, false);
  });
});
