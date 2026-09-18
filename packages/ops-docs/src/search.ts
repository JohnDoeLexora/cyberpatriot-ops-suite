import type { HowToGuide } from "./types.js";

export function guideSearchText(guide: HowToGuide): string {
  return [
    guide.opId,
    guide.title,
    guide.category,
    guide.platforms,
    guide.risk,
    guide.summary,
    guide.what,
    guide.whyItScores,
    guide.whenToRun,
    ...guide.steps,
    ...guide.goodLooksLike,
    ...guide.risks,
    ...guide.related,
    ...guide.keywords,
  ]
    .join("\n")
    .toLowerCase();
}

function scoreGuide(guide: HowToGuide, tokens: string[]): number {
  const id = guide.opId.toLowerCase();
  const title = guide.title.toLowerCase();
  const summary = guide.summary.toLowerCase();
  const body = guideSearchText(guide);
  let score = 0;
  for (const token of tokens) {
    if (id === token) score += 80;
    else if (id.includes(token)) score += 30;
    if (title.includes(token)) score += 20;
    if (summary.includes(token)) score += 10;
    if (body.includes(token)) score += 2;
  }
  return score;
}

/** Case-insensitive AND search across title + body. Empty query returns catalog order. */
export function searchGuides(
  query: string,
  guides: readonly HowToGuide[],
): HowToGuide[] {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return [...guides];
  const hits: { guide: HowToGuide; score: number }[] = [];
  for (const guide of guides) {
    const blob = guideSearchText(guide);
    if (!tokens.every((token) => blob.includes(token))) continue;
    hits.push({ guide, score: scoreGuide(guide, tokens) });
  }
  hits.sort((a, b) => b.score - a.score || a.guide.title.localeCompare(b.guide.title));
  return hits.map((h) => h.guide);
}
