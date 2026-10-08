import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { describe, it } from "node:test";
import { createServer } from "../src/server.ts";

async function withServer(run: (base: string) => Promise<void>) {
  const app = createServer();
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const addr = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${addr.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
}

describe("POST /ops/:id/run", () => {
  it("blocks a live mutation without confirm", async () => {
    await withServer(async (base) => {
      const res = await fetch(`${base}/ops/enable-firewall/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "live", confirm: false }),
      });
      assert.equal(res.status, 200);
      const body = (await res.json()) as { ok: boolean; blocked?: { reason?: string } };
      assert.equal(body.ok, false);
      assert.match(body.blocked?.reason ?? "", /confirm/);
    });
  });

  it("returns a dry-run preview from params.dryRun and from top-level dryRun", async () => {
    await withServer(async (base) => {
      for (const payload of [
        { mode: "live", confirm: false, params: { dryRun: true } },
        { mode: "live", confirm: false, dryRun: true },
      ]) {
        const res = await fetch(`${base}/ops/enable-firewall/run`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        assert.equal(res.status, 200);
        const body = (await res.json()) as { blocked?: unknown; summary: string; ok: boolean };
        assert.equal(body.blocked, undefined);
        assert.match(body.summary, /Skipped: ufw|Preview:|Will enable/);
      }
    });
  });
});
