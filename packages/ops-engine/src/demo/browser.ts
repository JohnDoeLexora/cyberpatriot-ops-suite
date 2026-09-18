/**
 * Browser-safe demo surface. No fs / child_process — Mac-safe fixtures only.
 * Live engines stay on the Node API (`POST /ops/:id/run`).
 */
export { runDemo, demoNow, demoContext, DEFAULT_DEMO_ALLOWLIST } from "./runner.js";
export {
  DEMO_NOW,
  demoUsers,
  demoServices,
  demoPorts,
  demoFiles,
  demoGroups,
} from "./fixtures.js";
export { scoreUser, scoreUsers, findingsFromUsers, isHumanAccount } from "../heuristics/suspicious-users.js";
export type {
  ChecklistItem,
  EngineContext,
  FileRecord,
  Finding,
  FindingSeverity,
  PortRecord,
  RunData,
  RunMode,
  RunResult,
  ServiceRecord,
  UserRecord,
} from "../types.js";
