export type Platform = "windows" | "linux" | "both";
export type Risk = "read" | "mutate";

export const CATEGORIES = [
  "users",
  "auth",
  "services",
  "ports",
  "network",
  "firewall",
  "files",
  "packages",
  "logging",
  "updates",
  "scheduled",
  "kernel",
  "windows",
  "evidence",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type ParamType = "string" | "number" | "boolean" | "array";

export interface ParamField {
  type: ParamType;
  description: string;
  default?: unknown;
  enum?: string[];
  items?: { type: "string" | "number" | "boolean" };
}

export interface ParamsSchema {
  type: "object";
  properties: Record<string, ParamField>;
  required?: string[];
}

/** Plain-language card so a first-time teammate can run the op without reading the engine. */
export interface OpExplain {
  /** One plain-English line: what running this op does. */
  whatItDoes: string;
  /** Why CyberPatriot rewards it, or the weakness it addresses. */
  whyItScores: string;
  /** Exactly what it modifies. Audits use "Nothing - read-only audit". */
  whatItChanges: string;
  /** Concrete undo, or "Nothing to undo" for a read-only op. */
  howToUndo: string;
}

export interface OpDefinition extends OpExplain {
  /** Kebab-case unique id, stable for dashboard docking and API routes. */
  id: string;
  title: string;
  category: Category;
  platforms: Platform;
  risk: Risk;
  description: string;
  paramsSchema: ParamsSchema;
  /** What the demo runner returns so UI authors can design against fixtures. */
  demoFixtureHint: string;
}

/** Catalog row before the required explainer fields are attached. */
export type OpSeed = Omit<OpDefinition, keyof OpExplain>;

export interface CatalogFilter {
  category?: Category;
  platform?: Platform | "linux" | "windows";
  risk?: Risk;
  query?: string;
}
