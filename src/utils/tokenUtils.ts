export const ACCESS_TOKEN_KEY = 'sb_access_token';
export const REFRESH_TOKEN_KEY = 'sb_refresh_token';

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

type SessionListener = () => void;
const sessionListeners = new Set<SessionListener>();

const notifySessionListeners = () => {
  sessionListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      /* ignore listener errors */
    }
  });
};

/** Notify in-tab listeners when session tokens change. */
export const subscribeSessionChange = (listener: SessionListener): (() => void) => {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
};

export const setSession = (access_token: string, refresh_token: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
  notifySessionListeners();
};

export const clearSession = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  notifySessionListeners();
};

export const hasSession = (): boolean =>
  Boolean(getAccessToken() && getRefreshToken());

/** Cross-tab: when another tab updates tokens, notify this tab's listeners. */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event: StorageEvent) => {
    if (
      event.key === ACCESS_TOKEN_KEY ||
      event.key === REFRESH_TOKEN_KEY ||
      event.key === null
    ) {
      notifySessionListeners();
    }
  });
}

const EMAIL_PENDING_KEY = 'email_pending_verification';

export const setEmailPendingVerification = (email: string) => {
  localStorage.setItem(EMAIL_PENDING_KEY, email);
};

export const getEmailPendingVerification = (): string | null =>
  localStorage.getItem(EMAIL_PENDING_KEY);

export const clearEmailPendingVerification = () => {
  localStorage.removeItem(EMAIL_PENDING_KEY);
};

const EMAIL_CONFIRM_PATTERNS = [
  'email not confirmed',
  'email is not confirmed',
  'email not verified',
  'email is not verified',
  'not been confirmed',
  'not been verified',
  'confirm your email',
  'verify your email',
  'email confirmation',
  'email verification',
  'unverified',
  'unconfirmed',
];

export const isEmailNotConfirmedError = (message: string): boolean => {
  const lower = message.toLowerCase();
  return EMAIL_CONFIRM_PATTERNS.some((pattern) => lower.includes(pattern));
};

export const EMAIL_VERIFICATION_MESSAGE =
  'If you just signed up, check your inbox for your validation link. ' +
  'Please confirm your email address before signing in.';
