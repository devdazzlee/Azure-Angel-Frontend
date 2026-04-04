import type { AuthResponse, Session } from '../types/apiTypes';
import httpClient from './httpClient';

interface ErrorResponse {
  response: { data: { error: string } };
}

export async function signUp({
  fullName,
  contactNumber,
  email,
  password,
  confirmPassword,
  captchaToken,
}: {
  fullName: string;
  contactNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  captchaToken?: string;
}): Promise<void> {
  const payload: Record<string, unknown> = {
    full_name: fullName,
    contact_number: contactNumber,
    email,
    password,
    confirm_password: confirmPassword,
  };

  if (captchaToken) {
    payload.captcha_token = captchaToken;
  }

  await httpClient.post('/auth/signup', payload);
}

export async function signIn({ email, password }: { email: string; password: string }): Promise<Session> {
  try {
    const { data } = await httpClient.post<AuthResponse>('/auth/signin', { email, password });
    return data.result.session;
  } catch (err: any) {
    // Extract actual error message from response (FastAPI returns in 'detail' field)
    const errorMessage = err?.response?.data?.detail || 
                        err?.response?.data?.error || 
                        err?.response?.data?.message || 
                        err?.message || 
                        'Signin failed. Please check your credentials and try again.';
    throw new Error(errorMessage);
  }
}

export async function resetPassword({ email }: { email: string }): Promise<void> {
  try {
    await httpClient.post('/auth/reset-password', { email });
  } catch (err) {
    const message = (err as ErrorResponse).response?.data.error || 'Reset password failed';
    throw new Error(message);
  }
}

export interface ChatResponse {
  success: boolean;
  message: string;
  result: {
    angelReply: string;
  };
}

export async function fetchNextQuestion(
  userMessage: string,
  contextData: { phase: 'gky'; stepIndex: number }
): Promise<ChatResponse> {
  try {
    const { data } = await httpClient.post<ChatResponse>('/angel/chat', { userMessage, contextData });
    return data;
  } catch (err) {
    const message = (err as ErrorResponse).response?.data.error || 'Chat request failed';
    throw new Error(message);
  }
}
