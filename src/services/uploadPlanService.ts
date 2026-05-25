import httpClient from "../api/httpClient";

export interface PlanAnalysisDTO {
  summary: string;
  completeness_score: number;
  found_information: Record<string, boolean>;
  missing_questions: Array<{
    question_number: number;
    question_text: string;
    category: string;
    priority: "high" | "medium" | "low";
  }>;
  recommendations: string;
}

export interface UploadPlanResponse {
  success: boolean;
  message?: string;
  business_info?: Record<string, unknown>;
  analysis?: PlanAnalysisDTO | null;
  per_question_answers?: Record<string, string | null> | null;
  source?: { session_id: string; title?: string };
}

export interface ImportableSource {
  id: string;
  title: string;
  business_name: string;
  industry: string;
  generated_at: string | null;
  artifact_chars: number;
}

/**
 * Upload a PDF / DOCX / TXT business plan file. The same endpoint is used
 * for the "Paste plan text" path — the caller wraps the text in a .txt File
 * before calling this so the backend extraction pipeline stays single-source.
 */
export async function uploadPlanFile(file: File): Promise<UploadPlanResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await httpClient.post<UploadPlanResponse>("/upload-plan", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });
  return data;
}

/**
 * List the current user's other ventures that have an Angel-generated
 * business plan available to reuse. The current session is excluded
 * server-side when `currentSessionId` is provided.
 */
export async function listImportableSources(
  currentSessionId?: string,
): Promise<ImportableSource[]> {
  const { data } = await httpClient.get<{ success: boolean; sources: ImportableSource[] }>(
    "/upload-plan/importable-sources",
    { params: currentSessionId ? { session_id: currentSessionId } : undefined },
  );
  return data.sources || [];
}

/**
 * Import a completed business plan from another venture and run it through
 * the same extraction pipeline as a file upload. Returns the same shape so
 * the modal's success handler is path-agnostic.
 */
export async function importPlanFromSession(
  sourceSessionId: string,
): Promise<UploadPlanResponse> {
  const { data } = await httpClient.post<UploadPlanResponse>("/upload-plan/from-session", {
    source_session_id: sourceSessionId,
  });
  return data;
}
