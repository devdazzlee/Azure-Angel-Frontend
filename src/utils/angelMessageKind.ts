/**
 * Message-kind helpers for Angel chat UI.
 * Section summaries are not questionnaire questions — never label them "Question N".
 */

const SECTION_SUMMARY_HEADINGS = [
  "Summary of Your Information",
  "Educational Insights",
  "Critical Considerations",
  "Ready to Continue",
] as const;

/**
 * Normalize LLM section-summary markdown before ReactMarkdown.
 * Models often emit triple newlines after headings and between bullets; each
 * becomes an empty <p> with margin — the main cause of "too much space".
 */
export function normalizeSectionSummaryMarkdown(raw: string): string {
  let s = (raw || "")
    .replace(/\[\[ACCEPT_MODIFY_BUTTONS\]\]/g, "")
    .replace(/\r\n/g, "\n")
    .trim();

  for (const label of SECTION_SUMMARY_HEADINGS) {
    s = s.replace(
      new RegExp(`\\*\\*\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:?\\s*\\*\\*`, "gi"),
      `### ${label}`,
    );
  }

  s = s.replace(/^🎯\s*\*\*([^*]+)\*\*\s*$/gm, "### 🎯 $1");

  s = s.replace(/\n{3,}/g, "\n\n");
  s = s.replace(/(\n- [^\n]+)\n+(?=- )/g, "$1\n");
  s = s.replace(/(### [^\n]+)\n{2,}/g, "$1\n\n");
  s = s.replace(/\n{3,}/g, "\n\n");

  return s.trim();
}

export function isSectionSummaryContent(text: string | undefined | null): boolean {
  if (!text?.trim()) return false;
  return (
    /Section Complete/i.test(text) ||
    (/Summary of Your Information/i.test(text) &&
      /Educational Insights|Critical Considerations/i.test(text))
  );
}

export type AngelBadgeLabel = string;

/**
 * Badge text for GKY / Business Plan message headers.
 * Prefer `isSectionSummary` from the API; use `content` only when restoring history.
 */
export function getAngelMessageBadgeLabel(
  phase: string | undefined,
  opts: {
    isSectionSummary?: boolean;
    questionNumber?: number | null;
    content?: string | null;
  },
): AngelBadgeLabel | null {
  if (phase !== "GKY" && phase !== "BUSINESS_PLAN") return null;

  const isSummary =
    opts.isSectionSummary === true ||
    (opts.isSectionSummary !== false && isSectionSummaryContent(opts.content));

  if (isSummary) return "Section Summary";

  if (typeof opts.questionNumber === "number" && !Number.isNaN(opts.questionNumber)) {
    return `Question ${opts.questionNumber}`;
  }

  return null;
}
