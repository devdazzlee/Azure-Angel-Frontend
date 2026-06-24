/**
 * Resolve the assistant message Modify should send to the backend.
 *
 * Command assists (Draft / Support / Scrapping) store the full raw API reply
 * separately from the active questionnaire prompt. The active-question ref must
 * NOT win over a pending command assist — that was causing Modify to revise the
 * question text instead of the draft body.
 */

export interface AssistHistoryRow {
  isCommand?: boolean;
  assistReply?: string;
}

export function resolveModifyAssistantSnapshot(args: {
  pendingAssistReply: string | null | undefined;
  activeQuestionReply: string | null | undefined;
  goBackReviewAnswer: string | null | undefined;
  history: AssistHistoryRow[];
}): string {
  const pending = args.pendingAssistReply?.trim();
  if (pending) {
    return pending;
  }

  for (let i = args.history.length - 1; i >= 0; i--) {
    const row = args.history[i];
    const stored = row.assistReply?.trim();
    if (row.isCommand && stored) {
      return stored;
    }
  }

  const goBack = args.goBackReviewAnswer?.trim();
  if (goBack) {
    return goBack;
  }

  return args.activeQuestionReply?.trim() ?? "";
}

/** Shown in chat history instead of the full modify guidance blob. */
export const MODIFY_HISTORY_ANSWER_LABEL = "Modify refinement";
