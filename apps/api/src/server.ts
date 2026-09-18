import cors from "cors";
import express, { type Express, type Request, type Response } from "express";
import { CATALOG_VERSION, catalog, getOp, listOps } from "@cyberpatriot/ops-catalog";
import { runOp, type RunMode } from "@cyberpatriot/ops-engine";

function modeOf(value: unknown): RunMode {
  return value === "live" ? "live" : "demo";
}

export function createServer(): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(
    cors({
      origin: true,
      credentials: false,
    }),
  );
  app.use(express.json({ limit: "64kb" }));

  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      ok: true,
      service: "cp-ops-api",
      catalogVersion: CATALOG_VERSION,
      ops: catalog.length,
      modeDefault: "demo",
    });
  });

  app.get("/ops", (req: Request, res: Response) => {
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const platform = typeof req.query.platform === "string" ? req.query.platform : undefined;
    const risk = typeof req.query.risk === "string" ? req.query.risk : undefined;
    const query = typeof req.query.q === "string" ? req.query.q : undefined;
    const ops = listOps({
      category: category as never,
      platform: platform as never,
      risk: risk as never,
      query,
    });
    res.json({ count: ops.length, ops });
  });

  app.post("/ops/:id/run", async (req: Request, res: Response) => {
    const id = req.params.id;
    const op = getOp(id ?? "");
    if (!op) {
      res.status(404).json({ ok: false, error: `unknown op '${id}'` });
      return;
    }
    const body = (req.body ?? {}) as {
      mode?: unknown;
      params?: unknown;
      confirm?: unknown;
    };
    const params =
      body.params && typeof body.params === "object" && !Array.isArray(body.params)
        ? (body.params as Record<string, unknown>)
        : {};
    try {
      const result = await runOp({
        opId: op.id,
        mode: modeOf(body.mode),
        params,
        confirm: body.confirm === true,
      });
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "run failed";
      res.status(500).json({ ok: false, error: message });
    }
  });

  return app;
}
