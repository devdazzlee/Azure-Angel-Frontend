/**
 * Message-kind helpers for Angel chat UI.
 * Section summaries are not questionnaire questions — never label them "Question N".
 */

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
