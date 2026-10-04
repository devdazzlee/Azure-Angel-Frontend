export type GuestChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type GuestSessionSnapshot = {
  guest_token: string;
  session_id: string;
  title?: string;
  current_phase?: string;
  asked_q?: string;
  answered_count?: number;
  user_message_count?: number;
  message_limit?: number;
  messages_remaining?: number;
  awaiting_gky_proceed?: boolean;
  requires_auth_to_continue?: boolean;
  business_context?: Record<string, unknown>;
  history?: GuestChatMessage[];
  expires_at?: number;
};

const STORAGE_KEY = 'fp_guest_chat_v1';

export function saveGuestSnapshot(snapshot: GuestSessionSnapshot): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore quota / private mode */
  }
}

export function getGuestSnapshot(): GuestSessionSnapshot | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestSessionSnapshot;
    if (!parsed?.guest_token || !parsed?.session_id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearGuestSnapshot(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function hasGuestSnapshot(): boolean {
  return Boolean(getGuestSnapshot());
}

/** Login/signup return URL when a guest chat is in progress. */
export function guestAuthReturnPath(): string {
  return '/login?from=guest';
}

export function guestSignupReturnPath(): string {
  return '/signup?from=guest';
}
