/** Minimal task shape for building provider/chat context payloads. */
export interface ImplementationTaskContextSource {
  title?: string;
  description?: string;
  purpose?: string;
  current_substep?: number;
  substeps?: Array<{
    step_number?: number;
    title?: string;
    description?: string;
    completed?: boolean;
  }>;
}

export function resolveActiveSubstepIndex(task: ImplementationTaskContextSource | null | undefined): number {
  const substeps = Array.isArray(task?.substeps) ? task.substeps : [];
  if (substeps.length === 0) return 0;

  const byCurrentNumber = substeps.findIndex(
    (s) => s?.step_number === task?.current_substep,
  );
  if (byCurrentNumber >= 0) return byCurrentNumber;

  const firstIncomplete = substeps.findIndex((s) => !s?.completed);
  return firstIncomplete >= 0 ? firstIncomplete : 0;
}

export function resolveActiveSubstepNumber(task: ImplementationTaskContextSource | null | undefined): number {
  const substeps = Array.isArray(task?.substeps) ? task.substeps : [];
  if (substeps.length === 0) return 0;
  const idx = resolveActiveSubstepIndex(task);
  const active = substeps[idx];
  return active?.step_number ?? idx + 1;
}

/**
 * Rich task context for implementation APIs (providers, Angel chat).
 * Includes the active substep so backend can recommend vendors — not competitors.
 */
export function buildImplementationTaskContext(
  task: ImplementationTaskContextSource | null | undefined,
  fallbackTitle?: string,
): string {
  const parts: string[] = [];

  if (task?.title) parts.push(`Current Task: ${task.title}`);
  if (task?.description) parts.push(`Task Description: ${task.description}`);
  if (task?.purpose) parts.push(`Task Purpose: ${task.purpose}`);

  const substeps = Array.isArray(task?.substeps) ? task.substeps : [];
  if (substeps.length > 0) {
    const activeIdx = resolveActiveSubstepIndex(task);
    const active = substeps[activeIdx];
    if (active?.title) {
      parts.push(`Active Step ${active.step_number ?? activeIdx + 1}: ${active.title}`);
    }
    if (active?.description) {
      parts.push(`Active Step Description: ${active.description}`);
    }
    const stepsList = substeps
      .map(
        (s, i) =>
          `  ${s?.step_number ?? i + 1}. ${s?.title ?? ''}${s?.completed ? ' (completed)' : ''}`,
      )
      .join('\n');
    if (stepsList) parts.push(`All Steps for this task:\n${stepsList}`);
  }

  if (parts.length === 0 && fallbackTitle) parts.push(fallbackTitle);
  return parts.join('\n\n');
}
