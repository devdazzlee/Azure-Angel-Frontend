const VENTURE_ONBOARDING_TIPS_STORAGE_KEY_PREFIX = "founderport_venture_onboarding_tips_v2";

function getScopedKey(sessionId?: string): string {
  return `${VENTURE_ONBOARDING_TIPS_STORAGE_KEY_PREFIX}:${sessionId || "unknown"}`;
}

/**
 * Safe localStorage accessors. `localStorage` can throw in real browsers — Safari
 * private mode, third-party storage blocked, quota exceeded — so a bare get/set
 * would crash the whole onboarding flow. On failure we treat the user as
 * "already onboarded" to avoid showing the dialog repeatedly with no way to
 * remember the dismissal.
 */
function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable — silently drop the write. The user will see the
    // tutorial again next visit, which is a better failure mode than crashing.
  }
}

export function isVentureOnboardingTipsComplete(sessionId?: string): boolean {
  if (typeof window === "undefined") return true;
  if (!sessionId) return true;
  return safeGet(getScopedKey(sessionId)) === "1";
}

export function markVentureOnboardingTipsComplete(sessionId?: string): void {
  if (typeof window === "undefined") return;
  if (!sessionId) return;
  safeSet(getScopedKey(sessionId), "1");
}

const COACH_MARK_TOUR_STORAGE_KEY_PREFIX = "founderport_coach_tour_v1";

function getCoachTourKey(tourId: string, sessionId?: string): string {
  return `${COACH_MARK_TOUR_STORAGE_KEY_PREFIX}:${sessionId || "unknown"}:${tourId}`;
}

export function isCoachTourSeen(tourId: string, sessionId?: string): boolean {
  if (typeof window === "undefined") return true;
  if (!sessionId) return true;
  return safeGet(getCoachTourKey(tourId, sessionId)) === "1";
}

export function markCoachTourSeen(tourId: string, sessionId?: string): void {
  if (typeof window === "undefined") return;
  if (!sessionId) return;
  safeSet(getCoachTourKey(tourId, sessionId), "1");
}
