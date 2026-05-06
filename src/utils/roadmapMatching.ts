// Utilities for matching a Roadmap row's task name against the set of
// keys that the backend has marked as "completed" (sourced from real
// Implementation-phase task completions, not the LLM's initial guesses).
//
// We match by significant-word overlap rather than exact string equality
// because the Roadmap markdown rows are LLM-generated and the
// Implementation task identifiers come from a separate, hand-coded space —
// the wording will not be identical even when the two refer to the same
// piece of work.

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'your', 'this', 'that', 'from', 'into',
  'a', 'an', 'of', 'to', 'in', 'on', 'at', 'by', 'as', 'or', 'is', 'be',
  'business', 'company',
]);

export const normalizeRoadmapStepName = (name: string): string => {
  return name
    .toLowerCase()
    // Strip leading numbering like "1.1 ", "Step 2: ", "Phase 1 — ", etc.
    .replace(/^\s*(?:phase|step|stage)?\s*\d+(?:\.\d+)*[\s.:\-—–]+/i, '')
    // Collapse non-alphanumeric to spaces
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const significantTokens = (s: string): Set<string> => {
  const set = new Set<string>();
  for (const token of s.split(/\s+/)) {
    if (token.length >= 3 && !STOPWORDS.has(token)) {
      set.add(token);
    }
  }
  return set;
};

export const isRoadmapStepCompleted = (
  rowName: string,
  completedKeys: string[] | undefined,
): boolean => {
  if (!completedKeys || completedKeys.length === 0) return false;
  const rowTokens = significantTokens(normalizeRoadmapStepName(rowName));
  if (rowTokens.size === 0) return false;

  for (const key of completedKeys) {
    const keyTokens = significantTokens(normalizeRoadmapStepName(key));
    if (keyTokens.size === 0) continue;

    let overlap = 0;
    for (const token of keyTokens) {
      if (rowTokens.has(token)) overlap += 1;
    }
    // Treat the row as complete if at least half of the key's distinctive
    // words also appear in the row name. This is intentionally tolerant —
    // false negatives are fine (row simply shows no checkmark), but false
    // positives must be rare.
    if (overlap / keyTokens.size >= 0.5 && overlap >= 2) return true;
  }
  return false;
};
