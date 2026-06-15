export interface PersistedAngelMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  mode?: 'help' | 'draft' | 'brainstorm';
}

export interface PersistedResearchState {
  customQuery: string;
  researchResult: unknown;
  selectedTopic: string | null;
}

const chatKey = (sessionId: string) => `angel:implementation:chat:${sessionId}`;
const researchKey = (sessionId: string) => `angel:implementation:research:${sessionId}`;

export function loadImplementationChat(sessionId: string): PersistedAngelMessage[] {
  if (!sessionId || typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(chatKey(sessionId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveImplementationChat(
  sessionId: string,
  messages: PersistedAngelMessage[],
): void {
  if (!sessionId || typeof window === 'undefined') return;
  try {
    const key = chatKey(sessionId);
    if (messages.length === 0) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(messages));
  } catch {
    /* private mode / quota */
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
