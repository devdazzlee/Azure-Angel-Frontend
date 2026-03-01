export const getAccessToken = () => localStorage.getItem('sb_access_token');
export const getRefreshToken = () => localStorage.getItem('sb_refresh_token');

export const setSession = (access_token: string, refresh_token: string) => {
    localStorage.setItem('sb_access_token', access_token);
    localStorage.setItem('sb_refresh_token', refresh_token);
};

export const clearSession = () => {
    localStorage.removeItem('sb_access_token');
    localStorage.removeItem('sb_refresh_token');
};

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
    return EMAIL_CONFIRM_PATTERNS.some(pattern => lower.includes(pattern));
};

export const EMAIL_VERIFICATION_MESSAGE =
    'If you just signed up, check your inbox for your validation link. ' +
    'Please confirm your email address before signing in.';
