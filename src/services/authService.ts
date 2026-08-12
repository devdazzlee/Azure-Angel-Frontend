import axios from 'axios';
import httpClient from '../api/httpClient';
import { getAccessToken } from '../utils/tokenUtils';
import type { AngelResponse, APIResponse, ChatResponse, IGeneratedBP, IRecentChats, BusinessContextPayload } from '../types/apiTypes';

const BASE = import.meta.env.VITE_API_BASE_URL as string;

interface Session {
    access_token: string;
    refresh_token: string;
    user: {
        id: string;
        email: string;
        [key: string]: any;
    };
    [key: string]: any;
}

interface AuthResponse {
    session: Session;
    [key: string]: any;
}

interface ErrorResponse {
    response?: { data?: { error?: string; detail?: string } };
    message?: string;
}

interface SessionHistoryRecord {
    role: 'user' | 'assistant' | 'system';
    content: string;
    phase?: string;
    metadata?: Record<string, unknown>;
    created_at?: string;
}

interface SyncProgressPayload {
    phase: string;
    answered_count: number;
    asked_q?: string | null;
}

interface SyncProgressResult {
    session_id: string;
    current_phase: string;
    answered_count: number;
    asked_q?: string | null;
}

/** Structured Modify: sent with POST /chat so Angel reworks the snapshot from user guidance. */
export interface ModifyChatPayload {
    assistant_snapshot: string;
    user_guidance: string;
}

export type FetchQuestionOptions =
    | string
    | {
          context?: string;
          modify?: ModifyChatPayload;
      };

function requireAuth(): void {
    if (!getAccessToken()) throw new Error('Not authenticated');
}

export async function signUp({
    fullName,
    email,
    password,
    confirmPassword,
    acceptedTermsAndPrivacy,
    captchaToken,
}: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptedTermsAndPrivacy: boolean;
    captchaToken?: string;
}): Promise<void> {
    try {
        const payload: Record<string, unknown> = {
            full_name: fullName,
            email,
            password,
            confirm_password: confirmPassword,
            accepted_terms_and_privacy: acceptedTermsAndPrivacy,
        };

        if (captchaToken) {
            payload.captcha_token = captchaToken;
        }

        await axios.post<void>(`${BASE}/auth/signup`, payload);
    } catch (err: any) {
        const errorData = err?.response?.data;
        const message = errorData?.detail ||
            errorData?.message ||
            errorData?.error ||
            err?.message ||
            'Signup failed. Please try again.';
        throw new Error(message);
    }
}

export async function signIn({
    email,
    password,
}: {
    email: string;
    password: string;
}): Promise<Session> {
    try {
        const { data } = await axios.post<AuthResponse>(`${BASE}/auth/signin`, {
            email,
            password,
        });

        return data.result.session;
    } catch (err) {
        const message = (err as ErrorResponse).response?.data.error ||
            'Signin failed';
        throw new Error(message);
    }
}

export async function resetPassword({
    email,
}: {
    email: string;
}): Promise<void> {
    try {
        await axios.post<void>(`${BASE}/auth/reset-password`, { email });
    } catch (err: any) {
        const errorData = err?.response?.data;
        const message = errorData?.detail ||
            errorData?.message ||
            errorData?.error ||
            err?.message ||
            'Failed to send reset email. Please try again.';
        throw new Error(message);
    }
}

export async function updatePassword({
    token,
    password,
    confirmPassword,
}: {
    token: string;
    password: string;
    confirmPassword: string;
}): Promise<void> {
    try {
        await axios.post<void>(`${BASE}/auth/update-password`, {
            token,
            password,
            confirm_password: confirmPassword,
        });
    } catch (err: any) {
        const errorData = err?.response?.data;
        const message = errorData?.detail ||
            errorData?.error ||
            err?.message ||
            'Failed to update password. Please try again.';
        throw new Error(message);
    }
}

export async function createSessions(title: string): Promise<IRecentChats> {
    requireAuth();
    try {
        const { data } = await httpClient.post<APIResponse<IRecentChats>>(
            '/angel/sessions',
            { title }
        );
        return data.result;
    } catch (err) {
        const message = (err as ErrorResponse).response?.data.error || 'Session request failed';
        throw new Error(message);
    }
}

export async function fetchSessions(): Promise<IRecentChats> {
    requireAuth();
    try {
        const { data } = await httpClient.get<APIResponse<IRecentChats>>(
            '/angel/sessions'
        );
        return data.result;
    } catch (err) {
        const message = (err as ErrorResponse).response?.data.error || 'Session request failed';
        throw new Error(message);
    }
}

export async function fetchSessionHistory(sessionId: string): Promise<SessionHistoryRecord[]> {
    requireAuth();
    try {
        const { data } = await httpClient.get<{
            success: boolean;
            message: string;
            data: SessionHistoryRecord[];
        }>(`/angel/sessions/${sessionId}/history`);

        if (data?.success && Array.isArray(data.data)) {
            return data.data;
        }

        return [];
    } catch (err) {
        const message =
            (err as ErrorResponse).response?.data.error || 'History request failed';
        throw new Error(message);
    }
}

export async function syncSessionProgress(
    sessionId: string,
    payload: SyncProgressPayload
): Promise<SyncProgressResult> {
    requireAuth();
    try {
        const { data } = await httpClient.post<{
            success: boolean;
            message: string;
            result: SyncProgressResult;
        }>(`/angel/sessions/${sessionId}/sync-progress`, payload);

        if (data?.success && data.result) {
            return data.result;
        }

        throw new Error('Failed to sync session progress');
    } catch (err) {
        const message =
            (err as ErrorResponse).response?.data?.error ||
            (err as ErrorResponse).response?.data?.detail ||
            (err as Error).message ||
            'Sync progress request failed';
        throw new Error(message);
    }
}

export async function fetchQuestion(
    content: string,
    sessionId: string,
    options?: FetchQuestionOptions
): Promise<AngelResponse> {
    requireAuth();

    let context: string | undefined;
    let modify: ModifyChatPayload | undefined;
    if (typeof options === 'string') {
        context = options;
    } else if (options && typeof options === 'object') {
        context = options.context;
        modify = options.modify;
    }

    try {
        const body: { content: string; context?: string; modify?: ModifyChatPayload } = {
            content,
        };
        if (context) body.context = context;
        if (modify) body.modify = modify;

        const { data } = await httpClient.post<AngelResponse>(
            `/angel/sessions/${sessionId}/chat`,
            body
        );
        return data;
    } catch (err) {
        const message = (err as ErrorResponse).response?.data.error || 'Chat request failed';
        throw new Error(message);
    }
}

export async function fetchBusinessPlan(
    sessionId: string
): Promise<IGeneratedBP> {
    requireAuth();
    try {
        const { data } = await httpClient.post<IGeneratedBP>(
            `/angel/sessions/${sessionId}/generate-plan`
        );
        return data;
    } catch (err) {
        const message = (err as ErrorResponse).response?.data.error || 'Chat request failed';
        throw new Error(message);
    }
}

export async function fetchBusinessContext(
    sessionId: string
): Promise<{
    success: boolean;
    message: string;
    result: {
        business_context: BusinessContextPayload;
        source: string;
        updated: boolean;
    };
}> {
    requireAuth();
    try {
        const { data } = await httpClient.get<{
            success: boolean;
            message: string;
            result: {
                business_context: BusinessContextPayload;
                source: string;
                updated: boolean;
            };
        }>(`/angel/sessions/${sessionId}/business-context`);

        return data;
    } catch (err) {
        const message = (err as ErrorResponse).response?.data.error || 'Business context request failed';
        throw new Error(message);
    }
}

export async function fetchRoadmapPlan(
    sessionId: string
): Promise<IGeneratedBP> {
    requireAuth();
    try {
        const { data } = await httpClient.get<IGeneratedBP>(
            `/angel/sessions/${sessionId}/roadmap-plan`
        );
        return data;
    } catch (err) {
        const message = (err as ErrorResponse).response?.data.error || 'Chat request failed';
        throw new Error(message);
    }
}

export interface KycResponseConfig {
    affirmationIntensity: number;
    constructiveFeedbackIntensity: number;
    strictBusinessTypeAttention?: boolean;
    avoidBlindAgreement?: boolean;
}

export interface KycContextData {
    phase: 'gky';
    stepIndex: number;
    skipStep?: boolean;
    responseConfig?: KycResponseConfig;
}

export async function fetchNextQuestion(
    userMessage: string,
    contextData: KycContextData
): Promise<ChatResponse> {
    requireAuth();
    try {
        const { data } = await httpClient.post<ChatResponse>(
            '/angel/chat',
            { userMessage, contextData }
        );
        return data;
    } catch (err) {
        const message = (err as ErrorResponse).response?.data.error || 'Chat request failed';
        throw new Error(message);
    }
}

interface AcceptanceStatus {
    terms_accepted: boolean;
    privacy_accepted: boolean;
    both_accepted: boolean;
}

export async function acceptTerms(name: string, date: string): Promise<{ both_accepted: boolean }> {
    requireAuth();
    try {
        const { data } = await httpClient.post<{ success: boolean; result: { both_accepted: boolean } }>(
            '/auth/accept-terms',
            { name, date }
        );
        console.log('Terms acceptance response:', data);
        return data.result;
    } catch (err: any) {
        console.error('Terms acceptance error:', err);
        const errorData = err?.response?.data;
        const message = errorData?.detail ||
            errorData?.message ||
            errorData?.error ||
            err?.message ||
            'Failed to accept Terms and Conditions. Please try again.';
        throw new Error(message);
    }
}

export async function acceptPrivacy(name: string, date: string): Promise<{ both_accepted: boolean }> {
    requireAuth();
    try {
        const { data } = await httpClient.post<{ success: boolean; result: { both_accepted: boolean } }>(
            '/auth/accept-privacy',
            { name, date }
        );
        return data.result;
    } catch (err: any) {
        const errorData = err?.response?.data;
        const message = errorData?.detail ||
            errorData?.message ||
            errorData?.error ||
            err?.message ||
            'Failed to accept Privacy Policy. Please try again.';
        throw new Error(message);
    }
}

export async function checkAcceptanceStatus(): Promise<AcceptanceStatus> {
    requireAuth();
    try {
        const { data } = await httpClient.get<{ success: boolean; result: AcceptanceStatus }>(
            '/auth/acceptance-status'
        );
        return data.result;
    } catch (err: any) {
        const errorData = err?.response?.data;
        const message = errorData?.detail ||
            errorData?.message ||
            errorData?.error ||
            err?.message ||
            'Failed to check acceptance status. Please try again.';
        throw new Error(message);
    }
}
