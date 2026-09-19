import type { OpDefinition, ParamsSchema, Platform, Risk, Category } from "./types.js";

export const emptyParams: ParamsSchema = {
  type: "object",
  properties: {},
};

export const usernameParams: ParamsSchema = {
  type: "object",
  properties: {
    username: {
      type: "string",
      description: "Local account name (letters, digits, dot, underscore, hyphen)",
    },
  },
  required: ["username"],
};

export const usernameDryRunParams: ParamsSchema = {
  type: "object",
  properties: {
    username: {
      type: "string",
      description: "Local account name",
    },
    dryRun: {
      type: "boolean",
      description: "Describe the change without applying it",
      default: false,
    },
  },
  required: ["username"],
};

export const serviceParams: ParamsSchema = {
  type: "object",
  properties: {
    service: {
      type: "string",
      description: "systemd unit, SysV name, or Windows service name",
    },
    dryRun: {
      type: "boolean",
      description: "Describe the change without applying it",
      default: false,
    },
  },
  required: ["service"],
};

export const packageParams: ParamsSchema = {
  type: "object",
  properties: {
    package: {
      type: "string",
      description: "Package name (apt/dnf/choco) or Windows product name",
    },
    dryRun: {
      type: "boolean",
      description: "Describe the change without applying it",
      default: false,
    },
  },
  required: ["package"],
};

export const allowlistParams: ParamsSchema = {
  type: "object",
  properties: {
    allowlistPath: {
      type: "string",
      description: "Path to allowed-users.txt (one username per line)",
      default: "config/allowed-users.txt",
    },
  },
};

export const mutateFlagParams: ParamsSchema = {
  type: "object",
  properties: {
    dryRun: {
      type: "boolean",
      description: "Describe the change without applying it",
      default: false,
    },
  },
};

export const expectedPortsParams: ParamsSchema = {
  type: "object",
  properties: {
    expectedPortsPath: {
      type: "string",
      description: "Path to expected-ports.txt (proto/port per line)",
      default: "config/expected-ports.txt",
    },
  },
};

export const forensicsSkimParams: ParamsSchema = {
  type: "object",
  properties: {
    searchRoot: {
      type: "string",
      description:
        "Optional local directory to skim (Desktop, homes, README files). Never a URL; CCS is never contacted.",
    },
    keywordsPath: {
      type: "string",
      description: "Path to forensics-keywords.txt",
      default: "config/forensics-keywords.txt",
    },
  },
};

export const gamesSamplesParams: ParamsSchema = {
  type: "object",
  properties: {
    gamesListPath: {
      type: "string",
      description: "Path to games-samples.txt (package/AppX names to remove)",
      default: "config/games-samples.txt",
    },
    dryRun: {
      type: "boolean",
      description: "Describe the change without applying it",
      default: false,
    },
  },
};

export function op(
  id: string,
  title: string,
  category: Category,
  platforms: Platform,
  risk: Risk,
  description: string,
  demoFixtureHint: string,
  paramsSchema: ParamsSchema = emptyParams,
): OpDefinition {
  return {
    id,
    title,
    category,
    platforms,
    risk,
    description,
    paramsSchema,
    demoFixtureHint,
  };
}
