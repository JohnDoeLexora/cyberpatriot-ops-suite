import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PLAYLIST_IDS,
  PLAYLISTS,
  assertPlaylistsIntegrity,
  beginnerOpIds,
  getOp,
  getPlaylist,
  isBeginnerOp,
} from "../src/index.ts";

describe("round playlists", () => {
  it("exports the five required playlists", () => {
    assert.deepEqual(
      PLAYLISTS.map((p) => p.id),
      [...PLAYLIST_IDS],
    );
    for (const id of [
      "linux-starter",
      "windows-starter",
      "linux-deep",
      "windows-deep",
      "forensics-first",
    ]) {
      assert.ok(getPlaylist(id), id);
    }
  });

  it("every step is a catalog op with no required params and a short tip", () => {
    assert.doesNotThrow(() => assertPlaylistsIntegrity());
  });

  it("starter playlists stay in-platform and include firewall + users", () => {
    const linux = getPlaylist("linux-starter");
    const windows = getPlaylist("windows-starter");
    assert.ok(linux && windows);
    assert.equal(linux.platform, "linux");
    assert.equal(windows.platform, "windows");
    const linuxIds = linux.steps.map((s) => s.opId);
    const winIds = windows.steps.map((s) => s.opId);
    for (const id of ["list-users", "enable-firewall", "skim-forensics-readme"]) {
      assert.ok(linuxIds.includes(id), `linux-starter missing ${id}`);
      assert.ok(winIds.includes(id), `windows-starter missing ${id}`);
    }
    assert.ok(linuxIds.includes("ssh-hardening-audit"));
    assert.ok(winIds.includes("enable-windows-defender"));
    for (const id of linuxIds) {
      const op = getOp(id);
      assert.ok(op);
      assert.ok(op.platforms === "linux" || op.platforms === "both", id);
    }
    for (const id of winIds) {
      const op = getOp(id);
      assert.ok(op);
      assert.ok(op.platforms === "windows" || op.platforms === "both", id);
    }
  });

  it("forensics-first stays on both-platform evidence ops", () => {
    const pl = getPlaylist("forensics-first");
    assert.ok(pl);
    assert.equal(pl.steps[0]?.opId, "skim-forensics-readme");
    for (const s of pl.steps) {
      const op = getOp(s.opId);
      assert.equal(op?.platforms, "both", s.opId);
    }
  });

  it("describes the audience, the time, and why each step is now", () => {
    for (const pl of PLAYLISTS) {
      assert.match(pl.summary, /for /i, pl.id);
      assert.match(pl.summary, /\d+\s*[–-]\s*\d+\s*minutes/i, pl.id);
      for (const s of pl.steps) {
        assert.ok(s.whyNow.trim().length > 8, `${pl.id}/${s.opId}`);
      }
    }
    const order = (id: string) => getPlaylist(id)!.steps.map((s) => s.opId);
    const linux = order("linux-starter");
    const windows = order("windows-starter");
    const before = (ids: string[], earlier: string, later: string) => {
      assert.ok(ids.indexOf(earlier) < ids.indexOf(later), `${earlier} before ${later}`);
    };
    for (const ids of [linux, windows]) {
      before(ids, "skim-forensics-readme", "list-users");
      before(ids, "list-users", "audit-password-policy");
      before(ids, "audit-password-policy", "enable-firewall");
      before(ids, "enable-firewall", "find-prohibited-software");
      before(ids, "find-prohibited-software", "audit-logging");
    }
    before(linux, "enable-firewall", "ssh-hardening-audit");
    before(order("linux-deep"), "enable-account-lockout", "harden-sysctl");
    before(order("windows-deep"), "apply-security-template", "enable-audit-policy");
    before(order("forensics-first"), "skim-forensics-readme", "find-media-files");
  });

  it("beginner ops are the starter + forensics lists; deep-only ops are advanced", () => {
    const beginner = beginnerOpIds();
    assert.ok(beginner.has("list-users"));
    assert.ok(beginner.has("enable-firewall"));
    assert.ok(isBeginnerOp("skim-forensics-readme"));
    assert.equal(isBeginnerOp("audit-iis"), false);
    assert.equal(isBeginnerOp("harden-sysctl"), false);
    assert.ok(getPlaylist("linux-deep")?.steps.some((s) => s.opId === "harden-sysctl"));
  });
});
