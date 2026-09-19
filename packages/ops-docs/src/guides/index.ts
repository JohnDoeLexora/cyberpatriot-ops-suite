import type { HowToBody } from "../types.js";
import { AUTH } from "./auth.js";
import { CP07 } from "./cp07.js";
import { EVIDENCE } from "./evidence.js";
import { FILES } from "./files.js";
import { NETWORK } from "./network.js";
import { PACKAGES } from "./packages.js";
import { SCHEDULED } from "./scheduled.js";
import { SERVICES } from "./services.js";
import { USERS } from "./users.js";
import { WINDOWS } from "./windows.js";

export const BODIES: Record<string, HowToBody> = {
  ...USERS,
  ...AUTH,
  ...SERVICES,
  ...NETWORK,
  ...FILES,
  ...PACKAGES,
  ...SCHEDULED,
  ...WINDOWS,
  ...EVIDENCE,
  ...CP07,
};
