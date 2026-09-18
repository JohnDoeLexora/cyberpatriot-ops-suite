export { runOp } from "./run.js";
export { runDemo, demoNow, demoContext, DEFAULT_DEMO_ALLOWLIST } from "./demo/runner.js";
export { demoUsers, demoServices, demoPorts, demoFiles, DEMO_NOW } from "./demo/fixtures.js";
export {
  scoreUser,
  scoreUsers,
  findingsFromUsers,
  isHumanAccount,
  SIGNAL,
  NAME_PATTERN,
} from "./heuristics/suspicious-users.js";
export { findRepoRoot } from "./paths.js";
export type {
  ChecklistItem,
  EngineContext,
  FileRecord,
  Finding,
  FindingSeverity,
  PortRecord,
  RunData,
  RunMode,
  RunRequest,
  RunResult,
  ServiceRecord,
  UserRecord,
} from "./types.js";
