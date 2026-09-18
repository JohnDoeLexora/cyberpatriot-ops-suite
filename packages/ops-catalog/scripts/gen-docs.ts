import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { catalog } from "../src/catalog.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function paramsSummary(op: (typeof catalog)[number]): string {
  const keys = Object.keys(op.paramsSchema.properties);
  if (keys.length === 0) return "none";
  return keys
    .map((k) => {
      const field = op.paramsSchema.properties[k];
      const req = op.paramsSchema.required?.includes(k) ? "*" : "";
      return `\`${k}${req}\` (${field?.type})`;
    })
    .join(", ");
}

const grouped = new Map<string, typeof catalog>();
for (const op of catalog) {
  const list = grouped.get(op.category) ?? [];
  list.push(op);
  grouped.set(op.category, list as typeof catalog);
}

const lines: string[] = [
  "# CyberPatriot ops catalog",
  "",
  "Typed operations exported from `@cyberpatriot/ops-catalog`.",
  "Every op is **defensive, authorized-image hardening** for CyberPatriot.",
  "See [SAFETY.md](./SAFETY.md) before running anything with `mode: \"live\"`.",
  "How-to explainers for every op: [howto/](./howto/).",
  "",
  `- **Count:** ${catalog.length}`,
  `- **Default run mode:** demo (Mac-safe fixtures, no host mutation)`,
  `- **Mutations:** live mode requires \`confirm: true\` in \`POST /ops/:id/run\``,
  "",
  "## Philosophy",
  "",
  "Stay inside CyberPatriot rules: authorized image only, no remote attacks,",
  "no scoring-server tricks, no exploit payloads. Push the envelope of *legal*",
  "automation — bulk audits, heuristic suspicion scoring, one-click checklists,",
  "exportable redacted evidence — like Sabbath coffee: creative, not cheating.",
  "",
  "## Index",
  "",
  "| ID | Title | Category | Platforms | Risk |",
  "| --- | --- | --- | --- | --- |",
];

for (const op of catalog) {
  lines.push(
    `| \`${op.id}\` | ${op.title} | ${op.category} | ${op.platforms} | ${op.risk} |`,
  );
}

lines.push("", "## Details", "");

for (const [category, ops] of grouped) {
  lines.push(`### ${category}`, "");
  for (const op of ops) {
    lines.push(`#### \`${op.id}\``, "");
    lines.push(`- **Title:** ${op.title}`);
    lines.push(`- **Platforms:** ${op.platforms}`);
    lines.push(`- **Risk:** ${op.risk}`);
    lines.push(`- **Params:** ${paramsSummary(op)}`);
    lines.push(`- **Demo fixture:** ${op.demoFixtureHint}`);
    lines.push("");
    lines.push(op.description);
    lines.push("");
  }
}

mkdirSync(path.join(root, "docs"), { recursive: true });
writeFileSync(path.join(root, "docs/OPS.md"), `${lines.join("\n")}\n`);
console.log(`Wrote docs/OPS.md with ${catalog.length} ops`);
