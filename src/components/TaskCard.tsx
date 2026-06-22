import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Loader2, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Lightbulb, 
  Rocket, 
  Phone, 
  FileText,
  Upload,
  X,
  ExternalLink,
  Target,
  TrendingUp,
  Shield,
  DollarSign,
  Settings,
  Megaphone,
  ChevronRight,
  ChevronDown,
  Circle
} from 'lucide-react';
import { toast } from 'react-toastify';
import httpClient from '../api/httpClient';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  fetchImplementationTaskDocuments,
  invalidateImplementationTaskDocuments,
  refreshImplementationDocumentViewUrl,
  type ImplementationTaskDocument,
} from '../services/implementationDocumentsService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/** Radix Select items cannot use an empty string as a value. */
const OPTIONAL_APPROACH_NONE = '__optional_none__';

interface ImplementationSubstep {
  step_number: number;
  title: string;
  description: string;
  angel_can_help: string;
  estimated_time: string;
  required: boolean;
  completed?: boolean;
  // The user's most recent note on this substep, returned by the backend
  // GET tasks endpoint. Used to pre-fill the completion modal when editing
  // an already-completed step and rendered inline on the substep tile so
  // the dashboard shows what the user wrote.
  note?: string;
}

interface ImplementationTask {
  id: string;
  title: string;
  description: string;
  purpose: string;
  options: string[];
  angel_actions: string[];
  estimated_time: string;
  priority: string;
  phase_name: string;
  substeps?: ImplementationSubstep[];
  current_substep?: number;
  business_context: {
    business_name: string;
    industry: string;
    location: string;
    business_type: string;
  };
}

export interface TaskCompletionResult {
  success?: boolean;
  message?: string;
  progress?: Record<string, unknown>;
  result?: {
    task_id?: string;
    substep_number?: number;
    notes?: string;
  };
}

interface TaskCardProps {
  task: ImplementationTask;
  /** True when this main task id is in the session completed list */
  isTaskCompleted?: boolean;
  onComplete: (result?: TaskCompletionResult) => void;
  onGetServiceProviders: () => void;
  onGetHelp: () => void;
  onUploadDocument: (file: File) => Promise<{
    filename: string;
    file_id: string;
    view_url?: string | null;
  }>;
  sessionId?: string;
  helpContent?: string;
  helpLoading?: boolean;
  isRefreshing?: boolean;
  /** True while task progress / completion state is still loading from the API */
  isProgressLoading?: boolean;
  /** Keeps Angel panel / parent state aligned when user reviews a completed step */
  onSubstepFocus?: (stepNumber: number) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isTaskCompleted = false,
  onComplete,
  onGetServiceProviders,
  onGetHelp,
  onUploadDocument,
  sessionId,
  helpContent,
  helpLoading,
  isRefreshing = false,
  isProgressLoading = false,
  onSubstepFocus,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [uploadedViewUrl, setUploadedViewUrl] = useState<string | null>(null);
  const [existingDocuments, setExistingDocuments] = useState<ImplementationTaskDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [documentsPickerOpen, setDocumentsPickerOpen] = useState(false);
  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentsRequestKeyRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mentorInsights, setMentorInsights] = useState<string>('');
  const [showSubstepModal, setShowSubstepModal] = useState(false);
  const [substepToComplete, setSubstepToComplete] = useState<ImplementationSubstep | null>(null);
  const [substepNote, setSubstepNote] = useState<string>('');
  // Set of substep `step_number`s that are currently mid-flight to the
  // backend. We close the completion modal synchronously for snappy UX
  // (Task 7), but the substep tile underneath still needs to show "Saving…"
  // until the parent's `loadImplementationData()` refetch returns and the
  // tile flips to "Completed". Without this the user could click Complete,
  // see the modal vanish, and stare at an unchanged tile for 5–10 s.
  const [pendingSubsteps, setPendingSubsteps] = useState<Set<number>>(new Set());
  /** User-selected step for review; only reset when the implementation task changes. */
  const [focusedSubstepNumber, setFocusedSubstepNumber] = useState<number | null>(null);
  /** Prevents duplicate full-task submissions before refetch lands */
  const [taskCompletionLocked, setTaskCompletionLocked] = useState(false);

  const isMainTaskComplete =
    !isProgressLoading && (isTaskCompleted || taskCompletionLocked);

  useEffect(() => {
    loadTaskInsights();
    setFocusedSubstepNumber(null);
    setTaskCompletionLocked(false);
    setUploadedFile(null);
    setUploadedFileId(null);
    setUploadedViewUrl(null);
    setUploadState('idle');
    setUploadError(null);
    setSelectedDocumentId(null);
    setDocumentsPickerOpen(false);
    documentsRequestKeyRef.current = null;
    void loadExistingDocuments();
  }, [task.id, sessionId]);

  useEffect(() => {
    if (existingDocuments.length === 0) {
      setSelectedDocumentId(null);
      return;
    }
    setSelectedDocumentId((current) =>
      current && existingDocuments.some((doc) => doc.file_id === current)
        ? current
        : existingDocuments[0].file_id,
    );
  }, [existingDocuments]);

  const loadExistingDocuments = async (options?: { force?: boolean }) => {
    if (!sessionId || !task.id) {
      setExistingDocuments([]);
      return;
    }

    const requestKey = `${sessionId}:${task.id}`;
    if (!options?.force && documentsRequestKeyRef.current === requestKey) {
      return;
    }

    documentsRequestKeyRef.current = requestKey;
    setDocumentsLoading(true);
    try {
      const docs = await fetchImplementationTaskDocuments(sessionId, task.id, options);
      setExistingDocuments(docs);
    } catch (err) {
      console.error('Failed to load task documents:', err);
      setExistingDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const formatDocumentDate = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (bytes == null || Number.isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const openDocument = async (doc: ImplementationTaskDocument) => {
    if (!sessionId || !task.id) return;
    setOpeningDocumentId(doc.file_id);
    try {
      let url = doc.view_url;
      if (!url) {
        url = await refreshImplementationDocumentViewUrl(sessionId, task.id, doc.file_id);
      }
      if (!url) {
        toast.error('Could not open this document. Please try again.');
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Failed to open document:', err);
      toast.error('Could not open this document.');
    } finally {
      setOpeningDocumentId(null);
    }
  };

  const resolveActiveSubstepIndex = (): number => {
    if (!task.substeps?.length) return 0;

    if (focusedSubstepNumber != null) {
      const focusedIdx = task.substeps.findIndex(
        (s) => s.step_number === focusedSubstepNumber,
      );
      if (focusedIdx >= 0 && !task.substeps[focusedIdx].completed) {
        return focusedIdx;
      }
    }

    if (task.current_substep != null) {
      const fromServer = task.substeps.findIndex(
        (s) => s.step_number === task.current_substep,
      );
      if (fromServer >= 0 && !task.substeps[fromServer].completed) {
        return fromServer;
      }
    }

    const incompleteIndex = task.substeps.findIndex((s) => !s.completed);
    if (incompleteIndex >= 0) return incompleteIndex;
    return task.substeps.length - 1;
  };

  const currentSubstepIndex = resolveActiveSubstepIndex();

  const focusSubstep = (substep: ImplementationSubstep) => {
    setFocusedSubstepNumber(substep.step_number);
    onSubstepFocus?.(substep.step_number);
  };

  const loadTaskInsights = async () => {
    try {
      const token = localStorage.getItem('sb_access_token');
      if (!token) return;

      // Load mentor insights for this task
      const response = await httpClient.post('/specialized-agents/agent-guidance', {
        question: `Provide expert guidance for implementation task: ${task.title}`,
        agent_type: 'comprehensive',
        business_context: task.business_context
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if ((response.data as any).success) {
        setMentorInsights((response.data as any).result.guidance || 'Expert guidance will be provided as you work through this task.');
      }
    } catch (err) {
      console.error('Error loading task insights:', err);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadState('uploading');
    setUploadError(null);

    try {
      const result = await onUploadDocument(file);
      setUploadedFile(file);
      setUploadedFileId(result.file_id);
      setUploadedViewUrl(result.view_url ?? null);
      setUploadState('success');
      setExistingDocuments((prev) => {
        const nextDoc: ImplementationTaskDocument = {
          file_id: result.file_id,
          original_filename: result.filename,
          view_url: result.view_url,
          uploaded_at: new Date().toISOString(),
        };
        return [nextDoc, ...prev.filter((d) => d.file_id !== result.file_id)];
      });
      setSelectedDocumentId(result.file_id);
      invalidateImplementationTaskDocuments(sessionId, task.id);
    } catch (err: unknown) {
      setUploadedFile(null);
      setUploadedFileId(null);
      setUploadState('error');
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (err instanceof Error ? err.message : 'Upload failed');
      setUploadError(typeof message === 'string' ? message : 'Failed to upload document');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openFilePicker = () => {
    if (uploadState !== 'uploading' && uploadState !== 'success' && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
    setUploadedFileId(null);
    setUploadedViewUrl(null);
    setUploadState('idle');
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubstepClick = (substep: ImplementationSubstep) => {
    focusSubstep(substep);
    setSubstepToComplete(substep);
    setSubstepNote(substep.note ?? '');
    setShowSubstepModal(true);
  };

  const firstIncompleteIndex =
    task.substeps?.findIndex((s) => !s.completed) ?? -1;

  const isSubstepNavigable = (substep: ImplementationSubstep, index: number) =>
    substep.completed ||
    (firstIncompleteIndex >= 0 && index <= firstIncompleteIndex);

  const handleSubstepRowClick = (substep: ImplementationSubstep, index: number) => {
    if (isSubstepNavigable(substep, index)) {
      focusSubstep(substep);
    }
  };

  const handleCompleteSubstep = async () => {
    if (!substepToComplete) return;

    const currentSessionId = sessionId || (window.location.pathname.match(/\/venture\/([^\/]+)/) || [])[1] || '';
    if (!currentSessionId) {
      setError('Session ID not found');
      return;
    }
    const token = localStorage.getItem('sb_access_token');
    if (!token) {
      setError('Authentication required');
      return;
    }

    // Snapshot the values we need before clearing local modal state.
    const stepNumber = substepToComplete.step_number;
    const stepTitle = substepToComplete.title;
    const note = substepNote.trim();
    const completionData = {
      substep_number: stepNumber,
      completion_notes: note || `Completed step: ${stepTitle}`,
      notes: note,
      completed_at: new Date().toISOString(),
    };

    // Optimistic UX: close the modal *synchronously* so the user gets an
    // instant acknowledgement of their click. The backend round-trip is
    // 5–10s (it generates the next task's substeps and runs RAG research)
    // and there is no reason to block the modal on it — the parent
    // component's `onComplete()` call will refetch fresh state when the
    // network round-trip completes, at which point the substep tile flips
    // to "Completed" and the next step becomes active.
    setShowSubstepModal(false);
    setSubstepToComplete(null);
    setSubstepNote('');
    setError(null);
    // Mark the step as mid-flight so the tile renders "Saving…" instead of
    // its idle "Mark Complete" / "Click to Edit" affordance — closes the
    // gap between modal-close and the refetch landing.
    setPendingSubsteps(prev => {
      const next = new Set(prev);
      next.add(stepNumber);
      return next;
    });
    toast.success(`Step ${stepNumber} marked complete — saving…`);

    try {
      const response = await httpClient.post(
        `/implementation/sessions/${currentSessionId}/tasks/${task.id}/complete`,
        completionData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if ((response.data as any).success) {
        onComplete(response.data as TaskCompletionResult);
        const nextIncomplete =
          task.substeps?.find((s) => s.step_number > stepNumber && !s.completed) ??
          task.substeps?.find((s) => s.step_number !== stepNumber && !s.completed);
        if (nextIncomplete) {
          setFocusedSubstepNumber(nextIncomplete.step_number);
          onSubstepFocus?.(nextIncomplete.step_number);
        } else {
          setFocusedSubstepNumber(null);
        }
      } else {
        const message = (response.data as any).message || 'Failed to complete step';
        toast.error(`Step ${stepNumber}: ${message}`);
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to complete step';
      toast.error(`Step ${stepNumber}: ${message}`);
    } finally {
      // Clear the in-flight marker either way — on success the refetch will
      // already be re-rendering the tile as "Completed", on failure we want
      // the user to be able to try again.
      setPendingSubsteps(prev => {
        if (!prev.has(stepNumber)) return prev;
        const next = new Set(prev);
        next.delete(stepNumber);
        return next;
      });
    }
  };

  const handleComplete = async () => {
    if (isMainTaskComplete) {
      toast.info('This task is already completed.');
      return;
    }

    // CRITICAL: Check if all substeps are completed before allowing task completion
    if (task.substeps && task.substeps.length > 0) {
      const incompleteSubsteps = task.substeps.filter(s => !s.completed);
      if (incompleteSubsteps.length > 0) {
        const incompleteNumbers = incompleteSubsteps.map(s => s.step_number).join(', ');
        setError(`Please complete all substeps first. Remaining steps: ${incompleteNumbers}`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('sb_access_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const currentSessionId = sessionId || (window.location.pathname.match(/\/venture\/([^\/]+)/) || [])[1] || '';
      if (!currentSessionId) {
        setError('Session ID not found');
        return;
      }

      const completionData = {
        decision: selectedOption,
        completion_notes: completionNotes,
        uploaded_file: uploadedFile?.name,
        file_id: uploadedFileId,
        completed_at: new Date().toISOString()
      };

      const response = await httpClient.post(
        `/implementation/sessions/${currentSessionId}/tasks/${task.id}/complete`, 
        completionData, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = response.data as TaskCompletionResult & { already_completed?: boolean };
      if (data.success) {
        if (data.already_completed) {
          toast.info('This task is already completed.');
        } else {
          toast.success('Task completed successfully!');
        }
        setTaskCompletionLocked(true);
        onComplete(data);
      } else {
        setError(data.message || 'Failed to complete task');
      }
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err?.message ||
        'Failed to complete task';
      setError(typeof message === 'string' ? message : 'Failed to complete task');
    } finally {
      setLoading(false);
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase.toLowerCase()) {
      case 'legal_formation':
        return <Shield className="h-5 w-5 text-blue-600" />;
      case 'financial_setup':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'operations_development':
        return <Settings className="h-5 w-5 text-purple-600" />;
      case 'marketing_sales':
        return <Megaphone className="h-5 w-5 text-orange-600" />;
      case 'launch_scaling':
        return <Rocket className="h-5 w-5 text-red-600" />;
      default:
        return <Target className="h-5 w-5 text-gray-600" />;
    }
  };

  const selectedDocument = existingDocuments.find((doc) => doc.file_id === selectedDocumentId);
  const selectedDocumentMeta = selectedDocument
    ? [formatDocumentDate(selectedDocument.uploaded_at), formatFileSize(selectedDocument.size_bytes)]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <div className="relative w-full bg-white rounded-lg shadow-sm border border-gray-200">
      {isRefreshing && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 overflow-hidden rounded-t-lg bg-gray-100"
          aria-hidden
        >
          <div className="h-full w-1/3 animate-pulse bg-gradient-to-r from-teal-500 to-blue-500" />
        </div>
      )}
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getPhaseIcon(task.phase_name)}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  <Clock className="h-3 w-3" />
                  {task.estimated_time}
                </span>
              </div>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
            {task.phase_name.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Task Description */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Task Description</h3>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="text-sm text-gray-700 leading-relaxed mb-2">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-5 space-y-1 text-sm text-gray-700">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => <code className="bg-gray-100 text-gray-900 px-1.5 py-0.5 rounded text-xs">{children}</code>,
              }}
            >
              {task.description}
            </ReactMarkdown>
          </div>
        </div>

        {/* Purpose */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Purpose</h3>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="text-sm text-gray-700 leading-relaxed mb-2">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-5 space-y-1 text-sm text-gray-700">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => <code className="bg-gray-100 text-gray-900 px-1.5 py-0.5 rounded text-xs">{children}</code>,
              }}
            >
              {task.purpose}
            </ReactMarkdown>
          </div>
        </div>

        {/* Substeps - CRITICAL: Show 3-5 synchronous substeps */}
        {task.substeps && task.substeps.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              Implementation Steps ({task.substeps.length} steps)
            </h3>
            {isProgressLoading ? (
              <div className="space-y-3" aria-busy="true" aria-label="Loading step progress">
                {task.substeps.map((substep) => (
                  <div
                    key={substep.step_number}
                    className="animate-pulse rounded-xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-2/3 rounded bg-gray-200" />
                        <div className="h-3 w-full rounded bg-gray-100" />
                        <div className="h-3 w-5/6 rounded bg-gray-100" />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  Loading your progress…
                </div>
              </div>
            ) : (
            <div className="space-y-3">
              {task.substeps.map((substep, index) => {
                const isActive = index === currentSubstepIndex;
                const isNavigable = isSubstepNavigable(substep, index);

                return (
                <div
                  key={substep.step_number}
                  role={isNavigable ? 'button' : undefined}
                  tabIndex={isNavigable ? 0 : undefined}
                  onClick={() => isNavigable && handleSubstepRowClick(substep, index)}
                  onKeyDown={(e) => {
                    if (isNavigable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleSubstepRowClick(substep, index);
                    }
                  }}
                  className={`rounded-xl p-3 sm:p-4 transition-all shadow-sm ${
                    substep.completed
                      ? 'bg-green-50 border border-green-200'
                      : isActive
                      ? 'bg-gradient-to-r from-blue-50 via-white to-blue-50 border border-blue-200 shadow-md'
                      : index < currentSubstepIndex
                      ? 'bg-gray-50 border border-gray-200'
                      : 'bg-white border border-gray-100'
                  } ${isNavigable ? 'cursor-pointer hover:shadow-md' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      substep.completed
                        ? 'bg-green-500 text-white'
                        : index === currentSubstepIndex
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {substep.completed ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        substep.step_number
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`font-semibold leading-tight ${
                          substep.completed ? 'text-green-800' : isActive ? 'text-blue-800' : 'text-gray-700'
                        }`}>
                          {substep.title}
                        </h4>
                        {pendingSubsteps.has(substep.step_number) ? (
                          <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded inline-flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Saving…
                          </span>
                        ) : substep.completed ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubstepClick(substep);
                            }}
                            className="text-xs font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1 rounded transition-colors flex items-center gap-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Edit notes
                          </button>
                        ) : isActive ? (
                          <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                            Current Step
                          </span>
                        ) : null}
                      </div>
                      <div className="prose prose-sm max-w-none mb-1">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="text-sm text-gray-700 leading-relaxed mb-1">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc ml-4 space-y-0.5 text-sm text-gray-700">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal ml-4 space-y-0.5 text-sm text-gray-700">{children}</ol>,
                            li: ({ children }) => <li className="text-xs leading-relaxed">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                            code: ({ children }) => <code className="bg-gray-100 text-gray-900 px-1 py-0.5 rounded text-xs">{children}</code>,
                          }}
                        >
                          {substep.description}
                        </ReactMarkdown>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                          <span className="text-[11px] font-semibold text-blue-800">Angel can help</span>
                          <div className="text-[11px] text-blue-700 leading-snug">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => <p className="m-0 text-[11px]">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc ml-4 space-y-0.5">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal ml-4 space-y-0.5">{children}</ol>,
                                li: ({ children }) => <li className="text-[11px] leading-snug">{children}</li>,
                                strong: ({ children }) => <strong className="font-semibold text-blue-900">{children}</strong>,
                                code: ({ children }) => <code className="bg-blue-100 text-blue-900 px-1 py-0.5 rounded text-[10px]">{children}</code>,
                              }}
                            >
                              {substep.angel_can_help}
                            </ReactMarkdown>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {substep.estimated_time}
                        </span>
                        {pendingSubsteps.has(substep.step_number) ? (
                          <span className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded font-semibold inline-flex items-center gap-1.5 cursor-default">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Saving…
                          </span>
                        ) : !substep.completed && isActive ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubstepClick(substep);
                            }}
                            disabled={loading}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-semibold transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Mark Complete
                          </button>
                        ) : substep.completed ? (
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Completed
                          </span>
                        ) : null}
                      </div>
                      {/* Surface the user's saved note inline on the
                          substep tile so the dashboard reflects what the
                          user wrote when they marked the step complete.
                          Pre-line preserves any newlines they typed. */}
                      {substep.note && substep.note.trim() && (
                        <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 mb-1">
                            Your note
                          </p>
                          <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-line">
                            {substep.note}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
            )}
            {!isProgressLoading && (
            <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="text-xs text-indigo-800">
                <strong>Flow:</strong> Complete each step in order. Click any completed step to review it. Current: Step {task.substeps[currentSubstepIndex]?.step_number || 1}.
              </p>
            </div>
            )}
          </div>
        )}

        {/* Decision Options - only while the main task is still open */}
        {!isMainTaskComplete && !isProgressLoading && task.options.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Optional: what did you choose?
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Help us track your decisions (e.g., "LLC" for business structure, "Online Registration" for registration). This is optional.
            </p>
            <Select
              value={selectedOption || OPTIONAL_APPROACH_NONE}
              onValueChange={(value) =>
                setSelectedOption(value === OPTIONAL_APPROACH_NONE ? '' : value)
              }
            >
              <SelectTrigger className="h-9 w-full border-gray-300 bg-white text-sm text-gray-900 shadow-sm [&_[data-slot=select-value]]:text-gray-900">
                <SelectValue
                  placeholder="Optional: Select your approach"
                  className="text-gray-900 data-[placeholder]:text-gray-500"
                />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[100]">
                <SelectItem value={OPTIONAL_APPROACH_NONE}>
                  Optional: Select your approach
                </SelectItem>
                {task.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}


        {/* Research / Help (preloaded Get Help content) */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span role="img" aria-label="detailed guidance" className="text-lg">
              🗂️
            </span>
            Detailed Guidance
          </h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            {helpLoading ? (
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span>Loading detailed guidance...</span>
              </div>
            ) : helpContent ? (
              <div className="prose prose-sm max-w-none text-blue-900">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="text-lg font-bold text-blue-900 mb-3 mt-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-semibold text-blue-900 mb-2 mt-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold text-blue-800 mb-2 mt-3">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-sm font-medium text-blue-800 mb-1 mt-2">{children}</h4>,
                    p: ({ children }) => <p className="text-sm text-blue-800 leading-relaxed mb-2">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc ml-5 space-y-1 text-sm text-blue-800 mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal ml-5 space-y-1 text-sm text-blue-800 mb-2">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-blue-900">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    code: ({ children, ...props }: any) => {
                      const isInline = props.inline !== false;
                      return isInline ? (
                        <code className="bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                      ) : (
                        <pre className="bg-blue-100 text-blue-900 p-2 rounded text-xs font-mono overflow-x-auto mb-2"><code>{children}</code></pre>
                      );
                    },
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-400 bg-blue-100 p-2 italic rounded my-2 text-sm text-blue-800">
                        {children}
                      </blockquote>
                    ),
                    hr: () => <hr className="my-3 border-blue-300" />,
                  }}
                >
                  {helpContent}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-blue-800">
                Detailed guidance will appear here as soon as it finishes loading.
              </p>
            )}
          </div>
        </div>

        {/* Completion Notes — hidden once the task is finished */}
        {!isMainTaskComplete && !isProgressLoading && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Completion Notes</label>
          <textarea
            placeholder="Describe what you accomplished, decisions made, or any important details..."
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        )}

        {/* Document Upload */}
        {!isProgressLoading && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload documentation
            <span className="ml-1 font-normal text-gray-500">(optional)</span>
          </label>

          {(documentsLoading || existingDocuments.length > 0) && (
            <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Previously uploaded
                </p>
                {!documentsLoading && existingDocuments.length > 0 && (
                  <span className="text-xs text-gray-400">
                    {existingDocuments.length}{' '}
                    {existingDocuments.length === 1 ? 'file' : 'files'}
                  </span>
                )}
              </div>
              {documentsLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Loading documents…
                </div>
              ) : (
                <div className="flex gap-2">
                  <Popover open={documentsPickerOpen} onOpenChange={setDocumentsPickerOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex min-h-[3.25rem] min-w-0 flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30"
                        aria-label="Select uploaded document"
                        aria-expanded={documentsPickerOpen}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                          <FileText className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1 py-0.5">
                          {selectedDocument ? (
                            <>
                              <span className="block truncate text-sm font-medium leading-snug text-gray-900">
                                {selectedDocument.original_filename}
                              </span>
                              {selectedDocumentMeta ? (
                                <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                                  {selectedDocumentMeta}
                                </span>
                              ) : null}
                            </>
                          ) : (
                            <span className="block text-sm leading-snug text-gray-500">
                              Choose a document…
                            </span>
                          )}
                        </span>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200',
                            documentsPickerOpen && 'rotate-180',
                          )}
                          aria-hidden
                        />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      side="bottom"
                      sideOffset={6}
                      collisionPadding={12}
                      className="z-[100] w-[var(--radix-popover-trigger-width)] overflow-hidden border border-gray-200 bg-white p-0 shadow-lg"
                    >
                      <div
                        className="max-h-[min(16rem,var(--radix-popover-content-available-height,16rem))] overflow-y-auto overscroll-y-contain bg-white p-1.5 [-webkit-overflow-scrolling:touch]"
                        onWheel={(event) => event.stopPropagation()}
                      >
                        <ul role="listbox" aria-label="Uploaded documents">
                          {existingDocuments.map((doc) => {
                            const meta = [
                              formatDocumentDate(doc.uploaded_at),
                              formatFileSize(doc.size_bytes),
                            ]
                              .filter(Boolean)
                              .join(' · ');
                            const isSelected = doc.file_id === selectedDocumentId;

                            return (
                              <li key={doc.file_id}>
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={isSelected}
                                  onClick={() => {
                                    setSelectedDocumentId(doc.file_id);
                                    setDocumentsPickerOpen(false);
                                  }}
                                  className={cn(
                                    'flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors',
                                    isSelected
                                      ? 'bg-teal-50 ring-1 ring-inset ring-teal-200'
                                      : 'hover:bg-gray-50',
                                  )}
                                >
                                  <FileText
                                    className="mt-0.5 h-4 w-4 shrink-0 text-teal-600"
                                    aria-hidden
                                  />
                                  <span className="min-w-0 flex-1 py-0.5">
                                    <span className="block truncate text-sm font-medium leading-snug text-gray-900">
                                      {doc.original_filename}
                                    </span>
                                    {meta ? (
                                      <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                                        {meta}
                                      </span>
                                    ) : null}
                                  </span>
                                  {isSelected ? (
                                    <CheckCircle
                                      className="mt-0.5 h-4 w-4 shrink-0 text-teal-600"
                                      aria-hidden
                                    />
                                  ) : (
                                    <span className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedDocument) void openDocument(selectedDocument);
                    }}
                    disabled={
                      !selectedDocumentId ||
                      openingDocumentId === selectedDocumentId
                    }
                    className="inline-flex min-h-[3.25rem] shrink-0 items-center gap-1.5 rounded-lg border border-teal-200 bg-white px-3.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {openingDocumentId === selectedDocumentId ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    )}
                    View
                  </button>
                </div>
              )}
            </div>
          )}

          {!isMainTaskComplete && (
          <div
            role={uploadState !== 'uploading' && uploadState !== 'success' ? 'button' : undefined}
            tabIndex={uploadState !== 'uploading' && uploadState !== 'success' ? 0 : undefined}
            aria-label={
              uploadState !== 'uploading' && uploadState !== 'success'
                ? 'Attach proof of completion'
                : undefined
            }
            onClick={uploadState !== 'uploading' && uploadState !== 'success' ? openFilePicker : undefined}
            onKeyDown={(event) => {
              if (uploadState === 'uploading' || uploadState === 'success') return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openFilePicker();
              }
            }}
            className={`rounded-xl border-2 border-dashed p-4 transition-colors ${
              uploadState === 'error'
                ? 'border-red-300 bg-red-50/50'
                : uploadState === 'success'
                  ? 'border-green-300 bg-green-50/40'
                  : 'border-gray-200 bg-gray-50/60 hover:border-blue-300 hover:bg-blue-50/30'
            } ${
              uploadState !== 'uploading' && uploadState !== 'success'
                ? 'cursor-pointer'
                : uploadState === 'uploading'
                  ? 'cursor-not-allowed'
                  : ''
            }`}
          >
            {uploadState === 'success' && uploadedFile ? (
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
                    <FileText className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{uploadedFile.name}</p>
                    <p className="mt-0.5 text-xs text-green-700">Uploaded successfully</p>
                    {uploadedViewUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          window.open(uploadedViewUrl, '_blank', 'noopener,noreferrer')
                        }
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        View uploaded document
                      </button>
                    )}
                    <p className="mt-1 text-[11px] text-gray-500">
                      PDF, DOC, DOCX, JPG, or PNG · max 10 MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearUploadedFile}
                  className="shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-white hover:text-gray-800"
                  aria-label="Remove uploaded file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center sm:justify-between sm:gap-4">
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    {uploadState === 'uploading' ? (
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    ) : (
                      <Upload className="h-5 w-5" aria-hidden />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {uploadState === 'uploading' ? 'Uploading…' : 'Attach proof of completion'}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      PDF, DOC, DOCX, JPG, or PNG · max 10 MB
                    </p>
                  </div>
                </div>
                <span className="mt-3 inline-flex shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm sm:mt-0">
                  Choose file
                </span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
              onChange={handleFileUpload}
              className="sr-only"
            />
          </div>
          )}
          {uploadError && (
            <p className="mt-2 text-xs text-red-600">{uploadError}</p>
          )}
        </div>
        )}

        {isProgressLoading && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6" aria-busy="true">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Loading completion options…
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isProgressLoading ? null : isMainTaskComplete ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                <CheckCircle className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="font-semibold text-green-900">Task completed</p>
                <p className="text-sm text-green-800">
                  All steps are done. Move on to the next task in your roadmap.
                </p>
              </div>
            </div>
          </div>
        ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleComplete}
            disabled={loading || isMainTaskComplete}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Completing Task...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Complete Task
              </>
            )}
          </button>

        </div>
        )}
      </div>

      {/* Substep Completion Modal */}
      {showSubstepModal && substepToComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Complete Step {substepToComplete.step_number}</h3>
                  <p className="text-blue-100 text-sm mt-1">{substepToComplete.title}</p>
                </div>
                <button
                  onClick={() => {
                    setShowSubstepModal(false);
                    setSubstepToComplete(null);
                    setSubstepNote('');
                  }}
                  className="text-white hover:text-blue-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>What you did:</strong> {substepToComplete.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add a note (optional)
                </label>
                <textarea
                  value={substepNote}
                  onChange={(e) => setSubstepNote(e.target.value)}
                  placeholder="What did you accomplish? Any details to remember?"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSubstepModal(false);
                  setSubstepToComplete(null);
                  setSubstepNote('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSubstep}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Complete Step
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;