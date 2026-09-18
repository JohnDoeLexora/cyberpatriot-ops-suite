import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GUIDES, assertHowtoIntegrity, type HowToGuide } from "../src/index.ts";

assertHowtoIntegrity(GUIDES);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const outDir = path.join(root, "docs/howto");
mkdirSync(outDir, { recursive: true });

function bullets(items: readonly string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function relatedLinks(ids: readonly string[]): string {
  return ids
    .map((id) => {
      const g = GUIDES.find((x) => x.opId === id);
      const title = g?.title ?? id;
      return `- [\`${id}\`](./${id}.md) — ${title}`;
    })
    .join("\n");
}

function renderGuide(guide: HowToGuide): string {
  const confirmNote =
    guide.risk === "mutate"
      ? "Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md)."
      : "Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).";
  return [
    `# ${guide.title}`,
    "",
    `- **Catalog id:** \`${guide.opId}\``,
    `- **Category:** ${guide.category}`,
    `- **Platforms:** ${guide.platforms}`,
    `- **Risk:** ${guide.risk}`,
    "",
    `> ${guide.summary}`,
    "",
    confirmNote,
    "",
    "Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.",
    "",
    "## What it is",
    "",
    guide.what,
    "",
    "## Why it scores in CyberPatriot",
    "",
    guide.whyItScores,
    "",
    "## When to run it",
    "",
    guide.whenToRun,
    "",
    "## Step-by-step",
    "",
    guide.steps.map((step, i) => `${i + 1}. ${step}`).join("\n"),
    "",
    "## What “good” looks like",
    "",
    bullets(guide.goodLooksLike),
    "",
    "## Risks / confirm notes",
    "",
    bullets(guide.risks),
    "",
    "## Related ops",
    "",
    relatedLinks(guide.related),
    "",
  ].join("\n");
}

const indexLines: string[] = [
  "# How-to guides",
  "",
  "Searchable defensive explainers for every op in `@cyberpatriot/ops-catalog`.",
  "Source of truth: `packages/ops-docs`. The dashboard How-to drawer searches titles and bodies.",
  "",
  "Competition-legal only: authorized-image hardening. No offense, no exploit recipes, no CCS cheats.",
  "Mutations still require `confirm: true` in live mode — see [SAFETY.md](../SAFETY.md).",
  "",
  `- **Guides:** ${GUIDES.length}`,
  "- **Open in the dashboard:** How-to button on each OpPanel, or the header How-to control. Press `?` to open the focused pane’s guide.",
  "",
  "## Index",
  "",
  "| ID | Title | Category | Risk |",
  "| --- | --- | --- | --- |",
];

for (const guide of GUIDES) {
  indexLines.push(
    `| [\`${guide.opId}\`](./${guide.opId}.md) | ${guide.title} | ${guide.category} | ${guide.risk} |`,
  );
  writeFileSync(path.join(outDir, `${guide.opId}.md`), `${renderGuide(guide)}\n`);
}

indexLines.push(
  "",
  "## Browse by category",
  "",
);
const grouped = new Map<string, HowToGuide[]>();
for (const guide of GUIDES) {
  const list = grouped.get(guide.category) ?? [];
  list.push(guide);
  grouped.set(guide.category, list);
}
for (const [category, guides] of grouped) {
  indexLines.push(`### ${category}`, "");
  for (const guide of guides) {
    indexLines.push(`- [\`${guide.opId}\`](./${guide.opId}.md) — ${guide.title}`);
  }
  indexLines.push("");
}

writeFileSync(path.join(outDir, "README.md"), `${indexLines.join("\n")}\n`);
console.log(`Wrote ${GUIDES.length} how-to guides under docs/howto/`);
