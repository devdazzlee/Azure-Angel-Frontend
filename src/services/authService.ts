
import axios from 'axios';
import httpClient from '../api/httpClient';
import type { AngelResponse, APIResponse, ChatResponse, IGeneratedBP, IRecentChats, BusinessContextPayload } from '../types/apiTypes';

const BASE = import.meta.env.VITE_API_BASE_URL as string; // e.g. "/api/v1/auth"

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

export async function signUp({
    fullName,
    email,
    password,
    confirmPassword,
    captchaToken,
}: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    captchaToken?: string;
}): Promise<void> {
    try {
        const payload: Record<string, unknown> = {
            full_name: fullName,
            email,
            password,
            confirm_password: confirmPassword,
        };

        if (captchaToken) {
            payload.captcha_token = captchaToken;
        }

        await axios.post<void>(`${BASE}/auth/signup`, payload);
    } catch (err: any) {
        // FastAPI standard: errors in response.data.detail
        // Also check message field for backward compatibility
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
        // FastAPI standard: errors in response.data.detail
        // Also check message field for backward compatibility
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
    const token = localStorage.getItem('sb_access_token');
    if (!token) throw new Error('Not authenticated');

    try {
        const { data } = await httpClient.post<APIResponse<IRecentChats>>(
            `${BASE}/angel/sessions`,
            { title },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return data.result;
    } catch (err) {
        const message = (err as ErrorResponse).response?.data.error || 'Session request failed';
        throw new Error(message);
    }
}

export async function fetchSessions(): Promise<IRecentChats> {
    const token = localStorage.getItem('sb_access_token');
    if (!token) throw new Error('Not authenticated');

    try {
        const { data } = await httpClient.get<APIResponse<IRecentChats>>(
            `${BASE}/angel/sessions`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return data.result;
    } catch (err) {
        const message = (err as ErrorResponse).response?.data.error || 'Session request failed';
        throw new Error(message);
    }
}

export async function fetchSessionHistory(sessionId: string): Promise<SessionHistoryRecord[]> {
    const token = localStorage.getItem('sb_access_token');
    if (!token) throw new Error('Not authenticated');

    try {
        const { data } = await httpClient.get<{
            success: boolean;
            message: string;
            data: SessionHistoryRecord[];
        }>(`${BASE}/angel/sessions/${sessionId}/history`, {
            headers: { Authorization: `Bearer ${token}` },
        });

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
    // Don't manually set Authorization header - let httpClient interceptor handle it
    // This ensures automatic token refresh on 401 errors
    try {
        const { data } = await httpClient.post<{
            success: boolean;
            message: string;
            result: SyncProgressResult;
        }>(`${BASE}/angel/sessions/${sessionId}/sync-progress`, payload);
        // Note: httpClient interceptor automatically adds Authorization header from localStorage
        // and handles token refresh if token expires

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
    context?: string
): Promise<AngelResponse> {
    const token = localStorage.getItem('sb_access_token');
    if (!token) throw new Error('Not authenticated');

    try {
        const body: { content: string; context?: string } = { content };
        if (context) body.context = context;

        const { data } = await httpClient.post<AngelResponse>(
            `${BASE}/angel/sessions/${sessionId}/chat`,
            body,
            { headers: { Authorization: `Bearer ${token}` } }
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
    const token = localStorage.getItem('sb_access_token');
    if (!token) throw new Error('Not authenticated');

    try {
        const { data } = await httpClient.post<IGeneratedBP>(
            `${BASE}/angel/sessions/${sessionId}/generate-plan`,
            { headers: { Authorization: `Bearer ${token}` } }
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
    const token = localStorage.getItem('sb_access_token');
    if (!token) throw new Error('Not authenticated');

    try {
        const { data } = await httpClient.get<{
            success: boolean;
            message: string;
            result: {
                business_context: BusinessContextPayload;
                source: string;
                updated: boolean;
            };
        }>(`${BASE}/angel/sessions/${sessionId}/business-context`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        return data;
    } catch (err) {
        const message = (err as ErrorResponse).response?.data.error || 'Business context request failed';
        throw new Error(message);
    }
}

export async function fetchRoadmapPlan(
    sessionId: string
): Promise<IGeneratedBP> {
    const token = localStorage.getItem('sb_access_token');
    if (!token) throw new Error('Not authenticated');

    try {
        const { data } = await httpClient.get<IGeneratedBP>(
            `${BASE}/angel/sessions/${sessionId}/roadmap-plan`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return data;
    } catch (err) {
        const message = (err as ErrorResponse).response?.data.error || 'Chat request failed';
        throw new Error(message);
    }
}

export async function uploadBusinessPlan(
    sessionId: string,
    file: File
): Promise<{ success: boolean; message?: string; error?: string; chat_message?: string }> {
    const token = localStorage.getItem('sb_access_token');
    if (!token) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const { data } = await httpClient.post<{ success: boolean; message?: string; error?: string; chat_message?: string }>(
            `${BASE}/angel/sessions/${sessionId}/upload-business-plan`,
            formData,
            { 
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                } 
            }
        );
        return data;
    } catch (err) {
        const message = (err as ErrorResponse).response?.data.error || 'Upload failed';
        throw new Error(message);
    }
}

export interface KycResponseConfig {
    affirmationIntensity: number; // 0-10
    constructiveFeedbackIntensity: number; // 0-10
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
    const token = localStorage.getItem('sb_access_token');
    if (!token) throw new Error('Not authenticated');

    try {
        const { data } = await httpClient.post<ChatResponse>(
            `${BASE}/angel/chat`,
            { userMessage, contextData },
            { headers: { Authorization: `Bearer ${token}` } }
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
    const token = localStorage.getItem('sb_access_token');
    if (!token) throw new Error('Not authenticated');

    try {
        const { data } = await httpClient.post<{ success: boolean; result: { both_accepted: boolean } }>(
            `${BASE}/auth/accept-terms`,
            { name, date },
            { headers: { Authorization: `Bearer ${token}` } }
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
    const token = localStorage.getItem('sb_access_token');
    if (!token) throw new Error('Not authenticated');

    try {
        const { data } = await httpClient.post<{ success: boolean; result: { both_accepted: boolean } }>(
            `${BASE}/auth/accept-privacy`,
            { name, date },
            { headers: { Authorization: `Bearer ${token}` } }
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
    const token = localStorage.getItem('sb_access_token');
    if (!token) throw new Error('Not authenticated');

    try {
        const { data } = await httpClient.get<{ success: boolean; result: AcceptanceStatus }>(
            `${BASE}/auth/acceptance-status`,
            { headers: { Authorization: `Bearer ${token}` } }
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
