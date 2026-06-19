import httpClient from '../api/httpClient';
import type { PersistedAngelMessage } from '../utils/implementationSupportStorage';

export interface ImplementationChatApiMessage extends PersistedAngelMessage {
  task_id?: string | null;
}

interface ChatListResponse {
  success: boolean;
  result?: {
    messages?: ImplementationChatApiMessage[];
  };
}

interface ChatImportResponse {
  success: boolean;
  result?: {
    imported_count?: number;
  };
}

interface ChatSendResponse {
  success: boolean;
  result?: {
    response?: string;
    mode?: 'help' | 'draft' | 'brainstorm';
    timestamp?: string;
    user_message?: ImplementationChatApiMessage;
    assistant_message?: ImplementationChatApiMessage;
  };
}

function mapApiMessage(raw: Record<string, unknown>): ImplementationChatApiMessage {
  const createdAt = raw.created_at ?? raw.timestamp;
  return {
    id: String(raw.id ?? ''),
    role: raw.role as 'user' | 'assistant',
    content: String(raw.content ?? ''),
    mode: raw.mode as ImplementationChatApiMessage['mode'],
    timestamp:
      typeof createdAt === 'string'
        ? createdAt
        : createdAt instanceof Date
          ? createdAt.toISOString()
          : new Date().toISOString(),
    task_id: raw.task_id != null ? String(raw.task_id) : null,
  };
}

export async function fetchImplementationChat(
  sessionId: string,
): Promise<ImplementationChatApiMessage[]> {
  const { data } = await httpClient.get<ChatListResponse>(
    `/implementation/sessions/${sessionId}/chat`,
  );
  const rows = data.result?.messages ?? [];
  return rows.map((row) => mapApiMessage(row as unknown as Record<string, unknown>));
}

export async function clearImplementationChat(sessionId: string): Promise<void> {
  await httpClient.delete(`/implementation/sessions/${sessionId}/chat`);
}

export async function importImplementationChatMessages(
  sessionId: string,
  messages: PersistedAngelMessage[],
): Promise<number> {
  if (messages.length === 0) return 0;
  const { data } = await httpClient.post<ChatImportResponse>(
    `/implementation/sessions/${sessionId}/chat/import`,
    {
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        mode: m.mode,
        timestamp: m.timestamp,
      })),
    },
  );
  return data.result?.imported_count ?? 0;
}

export interface SendImplementationChatParams {
  sessionId: string;
  message: string;
  mode: 'help' | 'draft' | 'brainstorm';
  businessContext: Record<string, unknown>;
  taskContext: string;
  taskId?: string;
}

export async function sendImplementationChatMessage(
  params: SendImplementationChatParams,
): Promise<{
  assistantText: string;
  userMessage?: ImplementationChatApiMessage;
  assistantMessage?: ImplementationChatApiMessage;
}> {
  const { data } = await httpClient.post<ChatSendResponse>('/implementation/chat-with-angel', {
    session_id: params.sessionId,
    message: params.message,
    mode: params.mode,
    business_context: params.businessContext,
    task_context: params.taskContext,
    task_id: params.taskId,
  });

  const result = data.result;
  return {
    assistantText: result?.response ?? 'No response received',
    userMessage: result?.user_message
      ? mapApiMessage(result.user_message as unknown as Record<string, unknown>)
      : undefined,
    assistantMessage: result?.assistant_message
      ? mapApiMessage(result.assistant_message as unknown as Record<string, unknown>)
      : undefined,
  };
}
