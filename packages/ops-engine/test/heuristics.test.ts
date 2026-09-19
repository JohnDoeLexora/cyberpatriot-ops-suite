import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scoreUsers, selectUnauthorizedUsers, SIGNAL } from "../src/heuristics/suspicious-users.ts";
import type { UserRecord } from "../src/types.ts";

const now = new Date("2026-09-18T18:00:00.000Z");
const allowlist = new Set(["root", "alice", "bob", "coach", "Administrator"]);

function u(partial: Partial<UserRecord> & Pick<UserRecord, "name">): UserRecord {
  return {
    groups: [],
    passwordHidden: true,
    platform: "linux",
    ...partial,
  };
}

describe("suspicious user heuristics", () => {
  it("flags never-logged-in humans, nonstandard shell, UID weirdness, home, name, recent, allowlist", () => {
    const users = scoreUsers(
      [
        u({
          name: "alice",
          uid: 1000,
          home: "/home/alice",
          shell: "/bin/bash",
          groups: ["sudo"],
          lastLogin: "2026-09-18T12:00:00.000Z",
          createdAt: "2025-01-01T00:00:00.000Z",
        }),
        u({
          name: "toor",
          uid: 0,
          home: "/tmp/toor",
          shell: "/bin/bash",
          lastLogin: "2026-09-18T03:00:00.000Z",
          createdAt: "2026-09-16T00:00:00.000Z",
        }),
        u({
          name: "hacker123",
          uid: 1010,
          home: "/home/hacker123",
          shell: "/bin/bash",
          lastLogin: "2026-09-18T01:00:00.000Z",
          createdAt: "2026-09-12T00:00:00.000Z",
        }),
        u({
          name: "zygote",
          uid: 666,
          home: "/var/tmp/zygote",
          shell: "/usr/bin/python3",
          groups: ["docker"],
          lastLogin: null,
          createdAt: "2026-09-17T18:00:00.000Z",
        }),
        u({
          name: "nologin_admin",
          uid: 1005,
          home: "/home/nologin_admin",
          shell: "/bin/bash",
          groups: ["sudo"],
          lastLogin: null,
          createdAt: "2026-09-01T00:00:00.000Z",
        }),
      ],
      { allowlist, now },
    );

    const byName = Object.fromEntries(users.map((user) => [user.name, user]));
    assert.ok((byName.alice?.suspicionScore ?? 99) < 10);

    assert.ok(byName.toor?.signals?.includes(SIGNAL.uidWeirdness));
    assert.ok(byName.toor?.signals?.includes(SIGNAL.homeOutsideHome));
    assert.ok(byName.toor?.signals?.includes(SIGNAL.namePattern));
    assert.ok((byName.toor?.suspicionScore ?? 0) >= 50);

    assert.ok(byName.hacker123?.signals?.includes(SIGNAL.namePattern));
    assert.ok(byName.hacker123?.signals?.includes(SIGNAL.notInAllowlist));

    assert.ok(byName.zygote?.signals?.includes(SIGNAL.nonstandardShell));
    assert.ok(byName.zygote?.signals?.includes(SIGNAL.homeOutsideHome));
    assert.ok(byName.zygote?.signals?.includes(SIGNAL.recentCreate));
    assert.ok(byName.zygote?.signals?.includes(SIGNAL.notInAllowlist));
    assert.ok(byName.zygote?.signals?.includes(SIGNAL.neverLoggedIn));

    assert.ok(byName.nologin_admin?.signals?.includes(SIGNAL.neverLoggedIn));
    assert.ok(byName.nologin_admin?.signals?.includes(SIGNAL.notInAllowlist));
    assert.ok(byName.nologin_admin?.signals?.includes(SIGNAL.extraAdmin));
  });

  it("does not treat well-known nologin service accounts as missing allowlist humans", () => {
    const [www] = scoreUsers(
      [
        u({
          name: "www-data",
          uid: 33,
          home: "/var/www",
          shell: "/usr/sbin/nologin",
          lastLogin: null,
        }),
      ],
      { allowlist, now },
    );
    assert.ok(!(www?.signals ?? []).includes(SIGNAL.notInAllowlist));
    assert.ok((www?.suspicionScore ?? 0) < 10);
  });

  it("selectUnauthorizedUsers bulk-selects allowlist misses and extra admins", () => {
    const users = scoreUsers(
      [
        u({
          name: "alice",
          uid: 1000,
          home: "/home/alice",
          shell: "/bin/bash",
          groups: ["sudo"],
          lastLogin: "2026-09-18T12:00:00.000Z",
        }),
        u({
          name: "hacker123",
          uid: 1010,
          home: "/home/hacker123",
          shell: "/bin/bash",
          lastLogin: "2026-09-18T01:00:00.000Z",
        }),
        u({
          name: "nologin_admin",
          uid: 1005,
          home: "/home/nologin_admin",
          shell: "/bin/bash",
          groups: ["sudo"],
          lastLogin: null,
        }),
      ],
      { allowlist, now },
    );
    const sel = selectUnauthorizedUsers(users, new Set(["alice", "bob", "coach"]));
    assert.ok(sel.names.includes("hacker123"));
    assert.ok(sel.names.includes("nologin_admin"));
    assert.ok(!sel.names.includes("alice"));
    assert.ok(sel.missingAllowlist.includes("bob"));
    assert.ok(sel.extraAdmins.some((u) => u.name === "nologin_admin"));
  });
});
