export interface PersistedAngelMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  mode?: 'help' | 'draft' | 'brainstorm';
  task_id?: string | null;
}

export interface PersistedResearchState {
  customQuery: string;
  researchResult: unknown;
  selectedTopic: string | null;
}

const legacyChatKey = (sessionId: string) => `angel:implementation:chat:${sessionId}`;
const researchKey = (sessionId: string) => `angel:implementation:research:${sessionId}`;

/** @deprecated Implementation chat is stored in Supabase. Used only for one-time migration. */
export function loadLegacyImplementationChatFromLocalStorage(
  sessionId: string,
): PersistedAngelMessage[] {
  if (!sessionId || typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(legacyChatKey(sessionId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Remove legacy browser chat after successful DB migration. */
export function clearLegacyImplementationChatFromLocalStorage(sessionId: string): void {
  if (!sessionId || typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(legacyChatKey(sessionId));
  } catch {
    /* ignore */
  }
}

export function loadImplementationResearch(sessionId: string): PersistedResearchState | null {
  if (!sessionId || typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(researchKey(sessionId));
    if (!raw) return null;
    return JSON.parse(raw) as PersistedResearchState;
  } catch {
    return null;
  }
}

export function saveImplementationResearch(
  sessionId: string,
  state: PersistedResearchState,
): void {
  if (!sessionId || typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(researchKey(sessionId), JSON.stringify(state));
  } catch {
    /* quota */
  }
}

export function clearImplementationResearch(sessionId: string): void {
  if (!sessionId || typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(researchKey(sessionId));
  } catch {
    /* ignore */
  }
}
