import axios from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  setSession,
  clearSession,
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
  // Handle 422 validation errors with details array (Pydantic format)
  const details = response?.data?.details;
  if (Array.isArray(details) && details.length > 0) {
    const messages = details.map((d: { msg?: string }) => d.msg).filter(Boolean);
    return messages.length > 0 ? messages.join('. ') : '';
  }
  return response?.data?.detail
    || response?.data?.error
    || response?.data?.message
    || '';
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
      case 429:
        toast.error(ErrorMessages[ErrorCodes.RATE_LIMIT]);
        break;
      case 500:
        toast.error(ErrorMessages[ErrorCodes.SERVER_ERROR]);
        break;
      default:
        if (!navigator.onLine) {
          toast.error(ErrorMessages[ErrorCodes.NETWORK_ERROR]);
        } else {
          toast.error(ErrorMessages[ErrorCodes.SERVER_ERROR]);
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

// Request Interceptor
httpClient.interceptors.request.use(
  config => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Refresh logic
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

httpClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Skip retry logic if request was cancelled or doesn't have config
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const is401 = error?.response?.status === 401;
    const isRetry = originalRequest._retry === true;
    
    // Skip token refresh for signin/login endpoints - these are authentication attempts, not token refresh
    const isAuthEndpoint = originalRequest.url?.includes('/auth/signin') || 
                          originalRequest.url?.includes('/auth/signup') ||
                          originalRequest.url?.includes('/auth/login');

    // Handle 401 errors (token expired) with automatic refresh
    // BUT skip for authentication endpoints (signin/signup) - those should show actual error messages
    if (is401 && !isRetry && !isAuthEndpoint) {
      console.log('🔐 Token expired (401), attempting refresh...');
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        console.log('❌ No refresh token found, redirecting to login');
        toast.error(ErrorMessages[ErrorCodes.UNAUTHORIZED]);
        clearSession();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // If refresh is already in progress, queue this request
      if (isRefreshing) {
        console.log('⏳ Token refresh already in progress, queuing request');
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (token && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return httpClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      isRefreshing = true;
      console.log('🔄 Starting token refresh...');

      try {
        const res = await axios.post<IRefreshTokenResponse>(`${BASE}/auth/refresh-token`, {
          refresh_token: refreshToken,
        }, {
          // Don't use httpClient here to avoid infinite loop
          headers: { 'Content-Type': 'application/json' }
        });

        const session = res.data?.result?.session;
        if (!session) {
          throw new Error('Invalid session from refresh');
        }

        const { access_token, refresh_token: newRefreshToken } = session;
        setSession(access_token, newRefreshToken);

        // Update default headers
        httpClient.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        
        // Process queued requests
        processQueue(null, access_token);

        // Update original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        console.log('✅ Token refresh successful, retrying original request');
        return httpClient(originalRequest);
      } catch (refreshErr: any) {
        console.log('❌ Token refresh failed:', refreshErr);
        processQueue(refreshErr, null);
        
        // Check error message format (could be detail, error, or message)
        const errorMessage = 
          refreshErr?.response?.data?.detail ||
          refreshErr?.response?.data?.error ||
          refreshErr?.response?.data?.message ||
          refreshErr?.message ||
          '';
        
        if (errorMessage.includes('Already Used') || 
            errorMessage.includes('Session expired') ||
            errorMessage.includes('Invalid token') ||
            errorMessage.includes('expired')) {
          console.log('🔒 Refresh token invalid, redirecting to login');
          toast.error('Your session has expired. Please log in again.');
        } else {
          toast.error(ErrorMessages[ErrorCodes.UNAUTHORIZED]);
        }
        
        clearSession();
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // For non-401 errors, use standard error handling
    return handleError(error);
  }
);

export default httpClient;
