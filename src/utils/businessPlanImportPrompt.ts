/**
 * Business plan import UX — offer import only at the start of the BUSINESS_PLAN phase.
 * Progress (answers + current question) is the source of truth; localStorage only
 * records whether the user dismissed the initial modal.
 */

export const IMPORT_PROMPT_STORAGE_PREFIX = 'angel_upload_prompt';

export function importPromptStorageKey(sessionId: string, suffix: 'seen' | 'uploaded'): string {
  return `${IMPORT_PROMPT_STORAGE_PREFIX}_${sessionId}_${suffix}`;
}

export function readImportPromptDismissed(sessionId: string | undefined): boolean {
  if (!sessionId || typeof window === 'undefined') return false;
  return (
    window.localStorage.getItem(importPromptStorageKey(sessionId, 'seen')) === 'true' ||
    window.localStorage.getItem(importPromptStorageKey(sessionId, 'uploaded')) === 'true'
  );
}

export function readPlanImported(sessionId: string | undefined): boolean {
  if (!sessionId || typeof window === 'undefined') return false;
  return window.localStorage.getItem(importPromptStorageKey(sessionId, 'uploaded')) === 'true';
}

export function persistImportPromptDismissed(sessionId: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(importPromptStorageKey(sessionId, 'seen'), 'true');
}

export function persistPlanImported(sessionId: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(importPromptStorageKey(sessionId, 'uploaded'), 'true');
  window.localStorage.setItem(importPromptStorageKey(sessionId, 'seen'), 'true');
}

export { hasImportedPlan as hasImportedBusinessPlanFromContext } from '../types/businessContext';

export type BusinessPlanHistoryPair = {
  phase?: string;
  isCommand?: boolean;
  questionNumber?: number;
};

/** Only numbered BP questionnaire answers count — not transition "I'm ready" replies. */
export function countNumberedBusinessPlanAnswers(
  pairs: BusinessPlanHistoryPair[],
): number {
  return pairs.filter(
    (p) =>
      p.phase === 'BUSINESS_PLAN' &&
      !p.isCommand &&
      typeof p.questionNumber === 'number' &&
      p.questionNumber >= 1,
  ).length;
}

export function resolveBusinessPlanAnsweredCount(params: {
  phaseAnswered?: number;
  backendAnswered?: number;
  bpHistoryPairs?: BusinessPlanHistoryPair[];
  /** @deprecated Prefer bpHistoryPairs — raw length counts transition messages */
  bpHistoryPairCount?: number;
  bpTotal: number;
}): number {
  const fromHistory = params.bpHistoryPairs
    ? Math.min(countNumberedBusinessPlanAnswers(params.bpHistoryPairs), params.bpTotal)
    : Math.min(params.bpHistoryPairCount ?? 0, params.bpTotal);
  const fromProgress =
    typeof params.phaseAnswered === 'number'
      ? params.phaseAnswered
      : typeof params.backendAnswered === 'number'
        ? params.backendAnswered
        : 0;
  return Math.max(fromProgress, fromHistory);
}

const PENDING_IMPORT_AFTER_TOUR_PREFIX = 'angel_pending_import_after_tour';

export function markPendingImportAfterTour(sessionId: string): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(`${PENDING_IMPORT_AFTER_TOUR_PREFIX}:${sessionId}`, '1');
}

export function hasPendingImportAfterTour(sessionId: string | undefined): boolean {
  if (!sessionId || typeof window === 'undefined') return false;
  return (
    window.sessionStorage.getItem(`${PENDING_IMPORT_AFTER_TOUR_PREFIX}:${sessionId}`) ===
    '1'
  );
}

export function consumePendingImportAfterTour(sessionId: string | undefined): boolean {
  if (!hasPendingImportAfterTour(sessionId)) return false;
  if (!sessionId || typeof window === 'undefined') return false;
  window.sessionStorage.removeItem(`${PENDING_IMPORT_AFTER_TOUR_PREFIX}:${sessionId}`);
  return true;
}

export type BusinessPlanImportOfferInput = {
  phase: string;
  bpAnswered: number;
  currentQuestionNumber: number | null | undefined;
  hasImportedPlan: boolean;
};

/**
 * True while the user has not started the numbered BP questionnaire yet
 * (transition "yes" does not count) and is still on question 1 or the
 * pre-Q1 transition prompt.
 */
export function isBusinessPlanImportOfferActive(input: BusinessPlanImportOfferInput): boolean {
  if (input.phase !== 'BUSINESS_PLAN') return false;
  if (input.hasImportedPlan) return false;
  if (input.bpAnswered > 0) return false;
  if (input.currentQuestionNumber != null && input.currentQuestionNumber > 1) {
    return false;
  }
  return true;
}

export function shouldAutoOpenImportModal(params: {
  offerActive: boolean;
  promptDismissed: boolean;
  modalIsOpen: boolean;
  /** Business Plan quick-actions coach tour finished or skipped for this session */
  quickActionsTourComplete: boolean;
}): boolean {
  return (
    params.offerActive &&
    !params.promptDismissed &&
    !params.modalIsOpen &&
    params.quickActionsTourComplete
  );
}
