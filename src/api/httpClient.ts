import axios from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  setSession,
  clearSession,
  subscribeSessionChange,
  isEmailNotConfirmedError,
  getEmailPendingVerification,
  EMAIL_VERIFICATION_MESSAGE,
} from '../utils/tokenUtils';
import { toast } from 'react-toastify';
import type { IRefreshTokenResponse } from '../types/apiTypes';

const BASE = import.meta.env.VITE_API_BASE_URL;

export const ErrorCodes = {
  RATE_LIMIT: 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_INPUT: 'INVALID_INPUT',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

const ErrorMessages = {
  [ErrorCodes.RATE_LIMIT]: 'Too many requests. Please wait a moment before trying again.',
  [ErrorCodes.UNAUTHORIZED]: 'Session expired. Please log in again.',
  [ErrorCodes.INVALID_INPUT]: 'Invalid request. Please check your input.',
  [ErrorCodes.SERVER_ERROR]: 'Server error. Please try again later.',
  [ErrorCodes.NETWORK_ERROR]: 'Network error. Please check your connection.',
} as const;

function isAxiosError(error: any): boolean {
  return error && error.isAxiosError === true;
}

const extractErrorMessage = (response: any): string => {
  const details = response?.data?.details;
  if (Array.isArray(details) && details.length > 0) {
    const messages = details.map((d: { msg?: string }) => d.msg).filter(Boolean);
    return messages.length > 0 ? messages.join('. ') : '';
  }
  const detail = response?.data?.detail;
  if (detail && typeof detail === 'object') {
    return detail.message || detail.error || detail.detail || JSON.stringify(detail);
  }
  return detail || response?.data?.error || response?.data?.message || '';
};

const handleError = (error: any): never => {
  if (isAxiosError(error)) {
    const { response } = error;
    const status = response?.status;
    const errorCode = response?.data?.code;
    const serverMsg = extractErrorMessage(response);

    if (
      (status === 400 || status === 401 || status === 403) &&
      (isEmailNotConfirmedError(serverMsg) || (getEmailPendingVerification() && serverMsg))
    ) {
      toast.info(EMAIL_VERIFICATION_MESSAGE, { autoClose: 8000, toastId: 'email-verify' });
      throw error;
    }

    if (errorCode === ErrorCodes.RATE_LIMIT) {
      toast.error(ErrorMessages[ErrorCodes.RATE_LIMIT]);
      throw new Error(ErrorMessages[ErrorCodes.RATE_LIMIT]);
    }

    switch (status) {
      case 400:
        toast.error(serverMsg || ErrorMessages[ErrorCodes.INVALID_INPUT]);
        break;
      case 422:
        toast.error(serverMsg || ErrorMessages[ErrorCodes.INVALID_INPUT]);
        break;
      case 401: {
        const msg401 = serverMsg || ErrorMessages[ErrorCodes.UNAUTHORIZED];
        toast.error(msg401);
        break;
      }
      case 404:
      case 405: {
        const method = (error.config?.method || 'request').toUpperCase();
        const path = error.config?.url || '';
        toast.error(
          `This action isn't available at the backend yet (HTTP ${status} on ${method} ${path}).`
        );
        break;
      }
      case 429:
        toast.error(ErrorMessages[ErrorCodes.RATE_LIMIT]);
        break;
      case 500:
        toast.error(serverMsg || ErrorMessages[ErrorCodes.SERVER_ERROR]);
        break;
      default:
        if (!navigator.onLine) {
          toast.error(ErrorMessages[ErrorCodes.NETWORK_ERROR]);
        } else {
          toast.error(serverMsg || ErrorMessages[ErrorCodes.SERVER_ERROR]);
        }
    }
  } else {
    toast.error('An unexpected error occurred. Please try again.');
  }

  throw error;
};

const httpClient = axios.create({
  baseURL: BASE,
});

const syncDefaultAuthHeader = () => {
  const token = getAccessToken();
  if (token) {
    httpClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete httpClient.defaults.headers.common.Authorization;
  }
};

syncDefaultAuthHeader();
subscribeSessionChange(syncDefaultAuthHeader);

httpClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      // Always overwrite with latest token (ignore stale caller snapshots).
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/** Single-flight refresh — all concurrent 401s share one Promise. */
let refreshPromise: Promise<string> | null = null;
let isRedirectingToLogin = false;

const forceReauth = (message?: string) => {
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;
  toast.error(message || ErrorMessages[ErrorCodes.UNAUTHORIZED], {
    toastId: 'session-expired',
  });
  clearSession();
  window.location.href = '/login';
};

const refreshAccessToken = async (): Promise<string> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshTokenUsed = getRefreshToken();
    if (!refreshTokenUsed) {
      throw new Error('No refresh token');
    }

    const res = await axios.post<IRefreshTokenResponse>(
      `${BASE}/auth/refresh-token`,
      { refresh_token: refreshTokenUsed },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const session = res.data?.result?.session;
    if (!session?.access_token || !session?.refresh_token) {
      throw new Error('Invalid session from refresh');
    }

    setSession(session.access_token, session.refresh_token);
    syncDefaultAuthHeader();
    return session.access_token;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

const isAuthEndpoint = (url?: string): boolean => {
  if (!url) return false;
  return (
    url.includes('/auth/signin') ||
    url.includes('/auth/signup') ||
    url.includes('/auth/login') ||
    url.includes('/auth/refresh-token')
  );
};

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const is401 = error?.response?.status === 401;
    const isRetry = originalRequest._retry === true;

    if (is401 && !isRetry && !isAuthEndpoint(originalRequest.url)) {
      originalRequest._retry = true;

      const refreshTokenBefore = getRefreshToken();
      if (!refreshTokenBefore) {
        forceReauth(ErrorMessages[ErrorCodes.UNAUTHORIZED]);
        return Promise.reject(error);
      }

      try {
        const accessToken = await refreshAccessToken();
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return httpClient(originalRequest);
      } catch (refreshErr: any) {
        const currentRefresh = getRefreshToken();
        // Another request already rotated successfully — retry with new token.
        if (currentRefresh && currentRefresh !== refreshTokenBefore) {
          const accessToken = getAccessToken();
          if (accessToken) {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            return httpClient(originalRequest);
          }
        }

        const errorMessage = extractErrorMessage(refreshErr?.response) || refreshErr?.message || '';

        forceReauth(
          String(errorMessage).includes('Already Used') ||
            String(errorMessage).includes('Session expired') ||
            String(errorMessage).includes('expired')
            ? 'Your session has expired. Please log in again.'
            : ErrorMessages[ErrorCodes.UNAUTHORIZED]
        );
        return Promise.reject(refreshErr);
      }
    }

    return handleError(error);
  }
);

export default httpClient;
