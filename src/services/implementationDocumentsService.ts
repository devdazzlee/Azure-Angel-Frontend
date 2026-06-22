import httpClient from '../api/httpClient';

export interface ImplementationTaskDocument {
  id?: string;
  file_id: string;
  original_filename: string;
  content_type?: string;
  size_bytes?: number;
  uploaded_at?: string;
  view_url?: string | null;
}

interface DocumentsListResponse {
  success: boolean;
  result?: {
    documents?: ImplementationTaskDocument[];
  };
}

interface UploadDocumentResponse {
  success: boolean;
  message?: string;
  filename?: string;
  file_id?: string;
  view_url?: string | null;
  document?: ImplementationTaskDocument;
}

const documentsCache = new Map<
  string,
  { docs: ImplementationTaskDocument[]; fetchedAt: number }
>();
const DOCUMENTS_CACHE_TTL_MS = 5 * 60 * 1000;

export function invalidateImplementationTaskDocuments(
  sessionId: string,
  taskId: string,
): void {
  documentsCache.delete(`${sessionId}:${taskId}`);
}

export async function fetchImplementationTaskDocuments(
  sessionId: string,
  taskId: string,
  options?: { force?: boolean },
): Promise<ImplementationTaskDocument[]> {
  const cacheKey = `${sessionId}:${taskId}`;
  if (!options?.force) {
    const cached = documentsCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < DOCUMENTS_CACHE_TTL_MS) {
      return cached.docs;
    }
  }

  const { data } = await httpClient.get<DocumentsListResponse>(
    `/implementation/sessions/${sessionId}/tasks/${taskId}/documents`,
  );
  const docs = data.result?.documents ?? [];
  documentsCache.set(cacheKey, { docs, fetchedAt: Date.now() });
  return docs;
}

export async function refreshImplementationDocumentViewUrl(
  sessionId: string,
  taskId: string,
  fileId: string,
): Promise<string | null> {
  const { data } = await httpClient.get<{
    success: boolean;
    result?: { document?: ImplementationTaskDocument };
  }>(`/implementation/sessions/${sessionId}/tasks/${taskId}/documents/${fileId}/view-url`);
  return data.result?.document?.view_url ?? null;
}

export async function uploadImplementationTaskDocument(
  sessionId: string,
  taskId: string,
  file: File,
): Promise<ImplementationTaskDocument> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await httpClient.post<UploadDocumentResponse>(
    `/implementation/sessions/${sessionId}/tasks/${taskId}/upload-document`,
    formData,
  );

  if (!data.success || !data.file_id) {
    throw new Error(data.message || 'Failed to upload document');
  }

  return (
    data.document ?? {
      file_id: data.file_id,
      original_filename: data.filename || file.name,
      view_url: data.view_url,
      uploaded_at: new Date().toISOString(),
    }
  );
}
