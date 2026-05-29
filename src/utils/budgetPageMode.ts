/** Phases where the full-page budget editor uses setup chrome (footer CTA, no FAB). */
const BUDGET_SETUP_PHASES = new Set([
  'PLAN_TO_BUDGET_TRANSITION',
  'BUDGET',
  'ROADMAP',
  'ROADMAP_GENERATED',
  'ROADMAP_TO_IMPLEMENTATION_TRANSITION',
]);

/** Roadmap already generated — CTA should navigate, not re-run budget_to_roadmap. */
const ROADMAP_READY_PHASES = new Set([
  'ROADMAP',
  'ROADMAP_GENERATED',
  'ROADMAP_TO_IMPLEMENTATION_TRANSITION',
]);

function normalizePhase(phase: string | undefined | null): string | null {
  if (!phase || typeof phase !== 'string') return null;
  return phase.trim().toUpperCase();
}

export function isBudgetSetupPhase(phase: string | undefined | null): boolean {
  const normalized = normalizePhase(phase);
  return normalized != null && BUDGET_SETUP_PHASES.has(normalized);
}

export function isRoadmapReadyPhase(phase: string | undefined | null): boolean {
  const normalized = normalizePhase(phase);
  return normalized != null && ROADMAP_READY_PHASES.has(normalized);
}

export function resolveSessionPhase(sessionPayload: {
  progress?: { phase?: string };
  current_phase?: string;
} | null | undefined): string | null {
  if (!sessionPayload) return null;
  return normalizePhase(sessionPayload.progress?.phase ?? sessionPayload.current_phase);
}
