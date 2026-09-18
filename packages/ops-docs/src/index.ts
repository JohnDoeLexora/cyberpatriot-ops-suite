import { catalog, getOp } from "@cyberpatriot/ops-catalog";
import { BODIES } from "./guides/index.js";
import { DASHBOARD_TO_CATALOG } from "./map-dashboard.js";
import { searchGuides as searchGuidesImpl } from "./search.js";
import type { HowToBody, HowToGuide } from "./types.js";

export type { HowToBody, HowToGuide } from "./types.js";
export { DASHBOARD_TO_CATALOG } from "./map-dashboard.js";
export { guideSearchText, searchGuides } from "./search.js";

const MIN_STEPS = 3;
const MIN_GOOD = 2;
const MIN_RISKS = 2;

export function assembleGuides(
  bodies: Record<string, HowToBody> = BODIES,
): HowToGuide[] {
  const missing: string[] = [];
  const guides: HowToGuide[] = [];
  for (const op of catalog) {
    const body = bodies[op.id];
    if (!body) {
      missing.push(op.id);
      continue;
    }
    guides.push({
      opId: op.id,
      title: op.title,
      category: op.category,
      platforms: op.platforms,
      risk: op.risk,
      ...body,
    });
  }
  if (missing.length) {
    throw new Error(`Missing how-to bodies for: ${missing.join(", ")}`);
  }
  return guides;
}

export const GUIDES: readonly HowToGuide[] = Object.freeze(assembleGuides());

const byId = new Map(GUIDES.map((g) => [g.opId, g]));

export function getGuide(opId: string): HowToGuide | undefined {
  return byId.get(opId);
}

export function listGuides(): HowToGuide[] {
  return [...GUIDES];
}

/** Accept a catalog id or a dashboard dotted id (`users.list`). */
export function resolveHowtoOpId(dashboardOrCatalogId: string): string | undefined {
  if (byId.has(dashboardOrCatalogId)) return dashboardOrCatalogId;
  const mapped = DASHBOARD_TO_CATALOG[dashboardOrCatalogId];
  if (mapped && byId.has(mapped)) return mapped;
  return undefined;
}

export function searchHowto(query: string, guides: readonly HowToGuide[] = GUIDES): HowToGuide[] {
  return searchGuidesImpl(query, guides);
}

export function assertHowtoIntegrity(guides: readonly HowToGuide[] = GUIDES): void {
  if (guides.length !== catalog.length) {
    throw new Error(`Expected ${catalog.length} how-tos, found ${guides.length}`);
  }
  const seen = new Set<string>();
  for (const guide of guides) {
    if (seen.has(guide.opId)) throw new Error(`Duplicate how-to: ${guide.opId}`);
    seen.add(guide.opId);
    const op = getOp(guide.opId);
    if (!op) throw new Error(`How-to for unknown catalog id: ${guide.opId}`);
    if (guide.title !== op.title) {
      throw new Error(`Title mismatch for ${guide.opId}`);
    }
    if (!guide.summary.trim()) throw new Error(`Empty summary: ${guide.opId}`);
    if (!guide.what.trim()) throw new Error(`Empty what: ${guide.opId}`);
    if (!guide.whyItScores.trim()) throw new Error(`Empty whyItScores: ${guide.opId}`);
    if (!guide.whenToRun.trim()) throw new Error(`Empty whenToRun: ${guide.opId}`);
    if (guide.steps.length < MIN_STEPS) throw new Error(`Need ≥${MIN_STEPS} steps: ${guide.opId}`);
    if (guide.goodLooksLike.length < MIN_GOOD) {
      throw new Error(`Need ≥${MIN_GOOD} goodLooksLike: ${guide.opId}`);
    }
    if (guide.risks.length < MIN_RISKS) throw new Error(`Need ≥${MIN_RISKS} risks: ${guide.opId}`);
    if (guide.related.length < 2) throw new Error(`Need related ops: ${guide.opId}`);
    if (guide.related.includes(guide.opId)) {
      throw new Error(`related must not include self: ${guide.opId}`);
    }
    for (const rel of guide.related) {
      if (!getOp(rel)) throw new Error(`${guide.opId} related unknown id: ${rel}`);
    }
    if (op.risk === "mutate") {
      const blob = `${guide.risks.join(" ")} ${guide.steps.join(" ")}`;
      if (!/confirm/i.test(blob)) {
        throw new Error(`Mutate how-to must mention confirm: ${guide.opId}`);
      }
    }
  }
  const extra = Object.keys(BODIES).filter((id) => !getOp(id));
  if (extra.length) {
    throw new Error(`How-to bodies for unknown ids: ${extra.join(", ")}`);
  }
}
