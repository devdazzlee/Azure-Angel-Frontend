import { createApi } from '@reduxjs/toolkit/query/react';
import type { Budget, IGeneratedBP } from '../types/apiTypes';
import type { ImplementationCatalogPhase } from '../types/implementationNavigation';
import type { ServiceProviderRow } from '../utils/serviceProvider';
import { axiosBaseQuery } from './axiosBaseQuery';

/** Cache TTLs — server data is reused until invalidated or stale. */
const STALE_IMPLEMENTATION_TASKS_MS = 30_000;
const STALE_SERVICE_PROVIDERS_MS = 10 * 60_000;
const STALE_ROADMAP_MS = 15 * 60_000;
const STALE_TASK_HELP_MS = 10 * 60_000;
const STALE_BUDGET_MS = 60_000;
const STALE_TASK_DOCUMENTS_MS = 5 * 60_000;

export interface ImplementationTaskDocument {
  id?: string;
  file_id: string;
  original_filename: string;
  content_type?: string;
  size_bytes?: number;
  uploaded_at?: string;
  view_url?: string | null;
}

export interface TaskDocumentsQueryArgs {
  sessionId: string;
  taskId: string;
}

export interface ImplementationTasksResponse {
  success: boolean;
  message?: string;
  current_task?: Record<string, unknown> | null;
  completed_tasks?: string[];
  next_task_id?: string | null;
  task_catalog?: ImplementationCatalogPhase[];
  progress?: Record<string, unknown>;
}

export interface ImplementationTaskDetailArgs {
  sessionId: string;
  taskId: string;
}

export interface ImplementationTaskDetailResponse {
  success: boolean;
  task?: Record<string, unknown>;
  message?: string;
}

export interface ServiceProvidersQueryArgs {
  sessionId: string;
  taskId: string;
  taskContext: string;
  category: string;
  /** Active substep — included in cache key so provider lists refresh per step. */
  activeSubstep?: number;
}

export interface ServiceProvidersResponse {
  success: boolean;
  result?: {
    providers?: ServiceProviderRow[];
    total?: number;
  };
}

export interface TaskHelpQueryArgs {
  sessionId: string;
  taskId: string;
}

export interface TaskHelpResponse {
  success: boolean;
  help_content?: string;
  message?: string;
}

export interface ContactProvidersQueryArgs {
  sessionId: string;
  taskId: string;
}

export interface ContactProvidersResponse {
  success: boolean;
  service_providers?: unknown[];
  message?: string;
}

export const implementationApi = createApi({
  reducerPath: 'implementationApi',
  baseQuery: axiosBaseQuery,
  tagTypes: [
    'ImplementationTasks',
    'ServiceProviders',
    'TaskHelp',
    'Roadmap',
    'Budget',
    'TaskDocuments',
  ],
  endpoints: (builder) => ({
    getImplementationTasks: builder.query<ImplementationTasksResponse, string>({
      query: (sessionId) => ({
        url: `/implementation/sessions/${sessionId}/tasks`,
        method: 'GET',
      }),
      providesTags: (_result, _error, sessionId) => [
        { type: 'ImplementationTasks', id: sessionId },
      ],
      keepUnusedDataFor: 300,
    }),

    getImplementationTaskDetail: builder.query<
      ImplementationTaskDetailResponse,
      ImplementationTaskDetailArgs
    >({
      query: ({ sessionId, taskId }) => ({
        url: `/implementation/sessions/${sessionId}/tasks/${taskId}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, { sessionId, taskId }) => [
        { type: 'ImplementationTasks', id: sessionId },
        { type: 'ImplementationTasks', id: `${sessionId}:${taskId}` },
      ],
      keepUnusedDataFor: 300,
    }),

    getServiceProviders: builder.query<ServiceProvidersResponse, ServiceProvidersQueryArgs>({
      query: ({ sessionId, taskContext, category }) => ({
        url: '/implementation/service-providers',
        method: 'POST',
        data: {
          session_id: sessionId,
          task_context: taskContext,
          category,
        },
      }),
      providesTags: (_result, _error, { sessionId, taskId, activeSubstep }) => [
        { type: 'ServiceProviders', id: `${sessionId}:${taskId}:${activeSubstep ?? 0}` },
      ],
      keepUnusedDataFor: 600,
    }),

    getTaskHelp: builder.query<TaskHelpResponse, TaskHelpQueryArgs>({
      query: ({ sessionId, taskId }) => ({
        url: `/implementation/sessions/${sessionId}/help`,
        method: 'POST',
        data: { task_id: taskId, help_type: 'detailed' },
      }),
      providesTags: (_result, _error, { sessionId, taskId }) => [
        { type: 'TaskHelp', id: `${sessionId}:${taskId}` },
      ],
      keepUnusedDataFor: 600,
    }),

    getContactProviders: builder.query<ContactProvidersResponse, ContactProvidersQueryArgs>({
      query: ({ sessionId, taskId }) => ({
        url: `/implementation/sessions/${sessionId}/contact`,
        method: 'POST',
        data: { task_id: taskId },
      }),
      providesTags: (_result, _error, { sessionId, taskId }) => [
        { type: 'ServiceProviders', id: `${sessionId}:${taskId}:contact` },
      ],
      keepUnusedDataFor: 600,
    }),

    getRoadmapPlan: builder.query<IGeneratedBP, string>({
      query: (sessionId) => ({
        url: `/angel/sessions/${sessionId}/roadmap-plan`,
        method: 'GET',
      }),
      providesTags: (_result, _error, sessionId) => [
        { type: 'Roadmap', id: sessionId },
      ],
      keepUnusedDataFor: 900,
    }),

    getBudget: builder.query<{ success: boolean; result?: Budget; message?: string }, string>({
      query: (sessionId) => ({
        url: `/api/sessions/${sessionId}/budget`,
        method: 'GET',
      }),
      providesTags: (_result, _error, sessionId) => [
        { type: 'Budget', id: sessionId },
      ],
      keepUnusedDataFor: 300,
    }),

    getTaskDocuments: builder.query<ImplementationTaskDocument[], TaskDocumentsQueryArgs>({
      query: ({ sessionId, taskId }) => ({
        url: `/implementation/sessions/${sessionId}/tasks/${taskId}/documents`,
        method: 'GET',
      }),
      transformResponse: (response: {
        success?: boolean;
        result?: { documents?: ImplementationTaskDocument[] };
      }) => response.result?.documents ?? [],
      providesTags: (_result, _error, { sessionId, taskId }) => [
        { type: 'TaskDocuments', id: `${sessionId}:${taskId}` },
      ],
      keepUnusedDataFor: 300,
    }),

    uploadTaskDocument: builder.mutation<
      ImplementationTaskDocument,
      TaskDocumentsQueryArgs & { file: File }
    >({
      query: ({ sessionId, taskId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/implementation/sessions/${sessionId}/tasks/${taskId}/upload-document`,
          method: 'POST',
          data: formData,
        };
      },
      transformResponse: (
        response: {
          success?: boolean;
          message?: string;
          filename?: string;
          file_id?: string;
          view_url?: string | null;
          document?: ImplementationTaskDocument;
        },
        _meta,
        { file },
      ) => {
        if (!response.success || !response.file_id) {
          throw new Error(response.message || 'Failed to upload document');
        }
        return (
          response.document ?? {
            file_id: response.file_id,
            original_filename: response.filename || file.name,
            view_url: response.view_url,
            uploaded_at: new Date().toISOString(),
          }
        );
      },
      invalidatesTags: (_result, _error, { sessionId, taskId }) => [
        { type: 'TaskDocuments', id: `${sessionId}:${taskId}` },
      ],
    }),
  }),
});

export const {
  useGetImplementationTasksQuery,
  useGetImplementationTaskDetailQuery,
  useLazyGetImplementationTaskDetailQuery,
  useGetServiceProvidersQuery,
  useGetTaskHelpQuery,
  useLazyGetContactProvidersQuery,
  useGetRoadmapPlanQuery,
  useGetBudgetQuery,
  useGetTaskDocumentsQuery,
  useUploadTaskDocumentMutation,
} = implementationApi;

/** Per-endpoint stale times (RTK Query v2+ supports endpoint-level override via hook options). */
export const implementationCachePolicy = {
  tasks: { staleTime: STALE_IMPLEMENTATION_TASKS_MS },
  serviceProviders: { staleTime: STALE_SERVICE_PROVIDERS_MS },
  roadmap: { staleTime: STALE_ROADMAP_MS },
  taskHelp: { staleTime: STALE_TASK_HELP_MS },
  budget: { staleTime: STALE_BUDGET_MS },
  taskDocuments: { staleTime: STALE_TASK_DOCUMENTS_MS },
} as const;
