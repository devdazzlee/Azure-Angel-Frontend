import axios from 'axios';
import {
  clearGuestSnapshot,
  getGuestSnapshot,
  saveGuestSnapshot,
  type GuestSessionSnapshot,
} from '../utils/guestSession';
import { getAccessToken } from '../utils/tokenUtils';

const BASE = import.meta.env.VITE_API_BASE_URL as string;

/** Lightweight client — no Bearer token (avoids httpClient 401 → /login). */
const guestHttp = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

export type GuestChatResult = {
  reply: string;
  progress?: {
    phase?: string;
    answered?: number;
    total?: number;
    percent?: number;
    asked_q?: string;
  };
  session_id: string;
  awaiting_gky_proceed?: boolean;
  requires_auth_to_continue?: boolean;
  transition_phase?: string | null;
  guest?: GuestSessionSnapshot;
};

function persistFromResult(result: GuestChatResult): GuestSessionSnapshot | null {
  const guest = result.guest;
  if (!guest?.guest_token || !guest?.session_id) return null;
  saveGuestSnapshot(guest);
  return guest;
}

export async function startGuestChat(title = 'Guest chat'): Promise<GuestChatResult> {
  const { data } = await guestHttp.post<{ success: boolean; result: GuestChatResult }>(
    '/guest/sessions',
    { title },
  );
  persistFromResult(data.result);
  return data.result;
}

export async function sendGuestMessage(
  sessionId: string,
  guestToken: string,
  content: string,
): Promise<GuestChatResult> {
  const { data } = await guestHttp.post<{ success: boolean; result: GuestChatResult }>(
    `/guest/sessions/${sessionId}/chat`,
    { content },
    { headers: { 'X-Guest-Token': guestToken } },
  );
  persistFromResult(data.result);
  return data.result;
}

export async function fetchGuestHistory(
  sessionId: string,
  guestToken: string,
): Promise<{ role: string; content: string }[]> {
  const { data } = await guestHttp.get<{ success: boolean; data: { role: string; content: string }[] }>(
    `/guest/sessions/${sessionId}/history`,
    { headers: { 'X-Guest-Token': guestToken } },
  );
  return data.data || [];
}

export type ClaimGuestResult = {
  session_id: string;
  resume_path: string;
  awaiting_gky_proceed?: boolean;
};

/**
 * After login/signup — attach guest chat to the real user and return resume path.
 * Safe to call when no guest snapshot exists (returns null).
 */
export async function claimGuestSessionIfPresent(): Promise<ClaimGuestResult | null> {
  const snapshot = getGuestSnapshot();
  if (!snapshot?.guest_token) return null;

  const token = getAccessToken();
  if (!token) return null;

  try {
    const { data } = await axios.post<{ success: boolean; result: ClaimGuestResult }>(
      `${BASE}/guest/sessions/claim`,
      {
        guest_token: snapshot.guest_token,
        snapshot,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );
    clearGuestSnapshot();
    return data.result;
  } catch (err) {
    console.error('Failed to claim guest session', err);
    // Keep snapshot so user can retry; caller may still go to /ventures
    return null;
  }
}

export function getGuestAuthError(err: unknown): {
  code?: string;
  message: string;
  requiresAuth: boolean;
} | null {
  const ax = err as {
    response?: { status?: number; data?: { detail?: unknown } };
  };
  const detail = ax?.response?.data?.detail;
  if (!detail) return null;

  if (typeof detail === 'object' && detail !== null) {
    const d = detail as { code?: string; message?: string; requires_auth?: boolean };
    if (d.requires_auth || d.code === 'GUEST_LIMIT' || d.code === 'GUEST_AUTH_REQUIRED') {
      return {
        code: d.code,
        message: d.message || 'Please log in or sign up to continue.',
        requiresAuth: true,
      };
    }
  }

  if (ax.response?.status === 403) {
    return {
      message: typeof detail === 'string' ? detail : 'Please log in or sign up to continue.',
      requiresAuth: true,
    };
  }

  return null;
}
