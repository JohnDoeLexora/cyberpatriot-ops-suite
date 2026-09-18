import type { Category, Platform, Risk } from "@cyberpatriot/ops-catalog";

/** Educational body for one catalog op. Titles/meta come from the catalog. */
export interface HowToBody {
  /** One-line search blurb. */
  summary: string;
  /** What the op is, in plain language. */
  what: string;
  /** Why CyberPatriot images typically score this. */
  whyItScores: string;
  /** When in a round to run it. */
  whenToRun: string;
  /** Normie-friendly steps. */
  steps: readonly string[];
  /** Observable “we’re done / this looks healthy” checks. */
  goodLooksLike: readonly string[];
  /** Confirm notes, README checks, and what this op will not do. */
  risks: readonly string[];
  /** Other catalog op ids to read next. */
  related: readonly string[];
  /** Extra search terms (commands, filenames, slang). */
  keywords: readonly string[];
}

export interface HowToGuide extends HowToBody {
  opId: string;
  title: string;
  category: Category;
  platforms: Platform;
  risk: Risk;
}
