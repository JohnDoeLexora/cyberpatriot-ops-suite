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

export interface OpDefinition {
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

export interface CatalogFilter {
  category?: Category;
  platform?: Platform | "linux" | "windows";
  risk?: Risk;
  query?: string;
}
