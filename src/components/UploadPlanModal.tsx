import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-toastify';
import PlanAnalysisModal from './PlanAnalysisModal';
import {
  uploadPlanFile,
  listImportableSources,
  importPlanFromSession,
  type PlanAnalysisDTO as PlanAnalysis,
  type UploadPlanResponse,
  type ImportableSource,
} from '../services/uploadPlanService';

type UploadMode = 'upload' | 'paste' | 'session';

interface UploadPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (businessInfo: any, analysis?: PlanAnalysis | null, perQuestionAnswers?: Record<string, string | null> | null) => void;
  sessionId?: string;
  initialMode?: UploadMode;
  onStartAnswering?: (analysis?: PlanAnalysis, businessInfo?: any, perQuestionAnswers?: Record<string, string | null> | null) => void;
  /** Staggered spring entrance after the quick-actions coach tour */
  guidedEntrance?: boolean;
}

const MIN_PASTE_CHARS = 80;

/** Topics Angel maps to the 45-question business plan questionnaire (see upload_plan_service). */
const PLAN_CONTENT_SECTIONS: { title: string; items: string[] }[] = [
  {
    title: 'Business overview',
    items: [
      'Business name and one-line idea',
      'Problem you solve and your product or service',
      'Current stage (idea, building, launching)',
      'Team, roles, and near-term goals',
    ],
  },
  {
    title: 'Market & customers',
    items: [
      'Target customer and market size',
      'Customer needs and how you reach them',
      'Competitors and what makes you different',
    ],
  },
  {
    title: 'Operations',
    items: [
      'How you deliver the product or service',
      'Location, suppliers, tools, or technology',
    ],
  },
  {
    title: 'Brand & marketing',
    items: [
      'Mission, vision, and brand positioning',
      'Marketing channels and sales approach',
      'Pricing and revenue model',
    ],
  },
  {
    title: 'Legal & regulatory',
    items: [
      'Business structure (LLC, sole prop, etc.)',
      'Licenses, permits, insurance, compliance',
    ],
  },
  {
    title: 'Financials',
    items: [
      'Startup costs and funding needs',
      'Revenue projections and break-even',
    ],
  },
  {
    title: 'Growth & long-term',
    items: ['Scaling plans, milestones, partnerships'],
  },
  {
    title: 'Risk & vision',
    items: ['Key risks, contingency plans, long-term vision'],
  },
];

const IMPORT_METHOD_TABS: {
  id: UploadMode;
  label: string;
  icon: string;
  activeClass: string;
  idleClass: string;
}[] = [
  {
    id: 'upload',
    label: 'Upload file',
    icon: '📄',
    activeClass: 'border-blue-300 bg-white text-blue-900 shadow-sm ring-1 ring-blue-100',
    idleClass: 'border-transparent bg-transparent text-slate-600 hover:bg-white/70 hover:text-slate-900',
  },
  {
    id: 'paste',
    label: 'Paste plan text',
    icon: '📋',
    activeClass: 'border-indigo-300 bg-white text-indigo-900 shadow-sm ring-1 ring-indigo-100',
    idleClass: 'border-transparent bg-transparent text-slate-600 hover:bg-white/70 hover:text-slate-900',
  },
  {
    id: 'session',
    label: 'Another venture',
    icon: '🔄',
    activeClass: 'border-teal-300 bg-white text-teal-900 shadow-sm ring-1 ring-teal-100',
    idleClass: 'border-transparent bg-transparent text-slate-600 hover:bg-white/70 hover:text-slate-900',
  },
];

function ImportMethodTab({
  tab,
  isActive,
  onSelect,
  disabled,
}: {
  tab: (typeof IMPORT_METHOD_TABS)[number];
  isActive: boolean;
  onSelect: (mode: UploadMode) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`import-panel-${tab.id}`}
      id={`import-tab-${tab.id}`}
      onClick={() => onSelect(tab.id)}
      disabled={disabled}
      className={`flex min-h-[2.75rem] flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
        isActive ? tab.activeClass : tab.idleClass
      }`}
    >
      <span className="text-base leading-none" aria-hidden>
        {tab.icon}
      </span>
      <span className="text-center leading-tight">{tab.label}</span>
    </button>
  );
}

function ImportMethodTabs({
  activeMode,
  onSelect,
  disabled,
}: {
  activeMode: UploadMode;
  onSelect: (mode: UploadMode) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mb-5 rounded-xl border border-slate-200/90 bg-gradient-to-b from-slate-50 to-slate-100/80 px-3 py-3 shadow-inner">
      <p className="mb-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        Choose import method
      </p>
      <div
        role="tablist"
        aria-label="Business plan import method"
        className="grid grid-cols-1 gap-1.5 rounded-lg bg-slate-200/60 p-1 sm:grid-cols-3"
      >
        {IMPORT_METHOD_TABS.map((tab) => (
          <ImportMethodTab
            key={tab.id}
            tab={tab}
            isActive={activeMode === tab.id}
            onSelect={onSelect}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

function PlanRequirementsPanel({ mode }: { mode: UploadMode }) {
  if (mode === 'session') return null;
  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3.5">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-base leading-none" aria-hidden="true">
          📋
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-950">
            What to include {mode === 'upload' ? 'in your document' : 'in your text'}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/90">
            Angel reads your plan and maps it to our business questionnaire. The more topics you cover, the fewer questions you will need to answer afterward.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {PLAN_CONTENT_SECTIONS.map((section) => (
              <div key={section.title}>
                <p className="text-xs font-semibold text-amber-950">{section.title}</p>
                <ul className="mt-1 space-y-0.5 text-[11px] leading-snug text-amber-900/85">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-1.5">
                      <span className="text-amber-700" aria-hidden="true">
                        •
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-amber-800/90">
            <strong>Partial plans are fine.</strong> If a section is missing, Angel will ask you those questions during the business plan phase.
          </p>
        </div>
      </div>
    </div>
  );
}

const UploadPlanModal: React.FC<UploadPlanModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  sessionId,
  initialMode = 'upload',
  onStartAnswering,
  guidedEntrance = false,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeMode, setActiveMode] = useState<UploadMode>(initialMode);
  const [pastedText, setPastedText] = useState('');
  const [textError, setTextError] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState<PlanAnalysis | null>(null);
  const [uploadedBusinessInfo, setUploadedBusinessInfo] = useState<any>(null);
  const [uploadedPerQuestionAnswers, setUploadedPerQuestionAnswers] = useState<Record<string, string | null> | null>(null);
  const [importSources, setImportSources] = useState<ImportableSource[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sourcesError, setSourcesError] = useState<string>('');
  const [importingSourceId, setImportingSourceId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest('[data-angel-coach-tour]')
      ) {
        return;
      }
      if (
        isOpen &&
        modalContentRef.current &&
        !modalContentRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    // Handle ESC key to close
    const handleEscape = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape' && !showAnalysis) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, showAnalysis]);

  useEffect(() => {
    if (isOpen) {
      setActiveMode(initialMode);
      setPastedText('');
      setTextError('');
      setDragActive(false);
      setShowAnalysis(false);
      setAnalysisData(null);
      setUploadedBusinessInfo(null);
      setUploading(false);
      setImportSources([]);
      setSourcesError('');
      setImportingSourceId(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen, initialMode]);

  const loadImportSources = useCallback(async () => {
    setSourcesLoading(true);
    setSourcesError('');
    try {
      const sources = await listImportableSources(sessionId);
      setImportSources(sources);
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || 'Could not load your other ventures.';
      setSourcesError(message);
    } finally {
      setSourcesLoading(false);
    }
  }, [sessionId]);

  // Fetch the picker list lazily — only when the user actually opens the
  // "From another venture" tab, and refetch each time so newly-completed
  // plans in other tabs show up without a page reload.
  useEffect(() => {
    if (!isOpen || activeMode !== 'session') return;
    loadImportSources();
  }, [isOpen, activeMode, loadImportSources]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (uploading) {
      return; // Don't allow drag operations while uploading
    }
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      // Only set dragActive to false if we're actually leaving the drop zone
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setDragActive(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (uploading) {
      return; // Don't allow drop operations while uploading
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleTextSubmit = async () => {
    const trimmed = pastedText.trim();
    if (!trimmed) {
      setTextError('Please paste your business plan content before submitting.');
      return;
    }
    if (trimmed.length < MIN_PASTE_CHARS) {
      setTextError(`Please paste at least ${MIN_PASTE_CHARS} characters so Angel can extract useful details.`);
      return;
    }
    setTextError('');
    const blob = new Blob([pastedText], { type: 'text/plain' });
    const file = new File([blob], 'business-plan.txt', { type: 'text/plain' });
    await handleFileUpload(file);
    setPastedText('');
  };

  /** Shared success path for all three input modes (file, paste, session). */
  const applyUploadResponse = (response: UploadPlanResponse, successMessage: string) => {
    const businessInfo = response.business_info || {};
    const analysis = response.analysis || null;
    const perQuestionAnswers = response.per_question_answers || null;

    setUploadedBusinessInfo(businessInfo);
    setUploadedPerQuestionAnswers(perQuestionAnswers);
    toast.success(successMessage);

    if (analysis) {
      setAnalysisData(analysis);
      setShowAnalysis(true);
    } else {
      onUploadSuccess(businessInfo, null, perQuestionAnswers);
      onClose();
    }
  };

  const resetFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /** Translate axios errors into a user-actionable toast. 405 / 404 mean the
   *  endpoint isn't reachable at the configured backend — show that explicitly
   *  instead of the generic "Server error" the global interceptor would emit. */
  const reportUploadError = (error: any, fallback: string) => {
    console.error('Upload error:', error);
    const status = error?.response?.status;
    const detail = error?.response?.data?.detail || error?.response?.data?.message;
    if (status === 404 || status === 405) {
      toast.error(`Upload endpoint not reachable (HTTP ${status}). Check the backend deployment.`);
      return;
    }
    toast.error(detail || error?.message || fallback);
  };

  const handleFileUpload = async (file: File) => {
    // Backend supports PDF / DOCX / TXT only — legacy .doc is excluded because
    // the parser cannot read it. Use a strict extension regex so files like
    // "plan.pdf.exe" are rejected, and keep the MIME check as a second gate.
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (!/\.(pdf|docx|txt)$/i.test(file.name) || !allowedMimes.includes(file.type || 'text/plain')) {
      toast.error('Please upload a PDF, DOCX, or TXT file. Older .doc format is not supported — convert to .docx first.');
      resetFileInput();
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10 MB.');
      resetFileInput();
      return;
    }

    setUploading(true);
    setDragActive(false);

    try {
      const response = await uploadPlanFile(file);
      if (!response.success) {
        toast.error('Failed to upload business plan. Please try again.');
        return;
      }
      applyUploadResponse(response, 'Business plan analyzed successfully!');
    } catch (error) {
      reportUploadError(error, 'Failed to upload business plan. Please try again.');
    } finally {
      setUploading(false);
      setDragActive(false);
      resetFileInput();
    }
  };

  const handleImportFromSession = async (source: ImportableSource) => {
    setImportingSourceId(source.id);
    setUploading(true);
    try {
      const response = await importPlanFromSession(source.id);
      if (!response.success) {
        toast.error('Failed to import the selected business plan. Please try again.');
        return;
      }
      applyUploadResponse(
        response,
        `Imported business plan from "${source.title || 'venture'}"`,
      );
    } catch (error) {
      reportUploadError(error, 'Failed to import the selected business plan.');
    } finally {
      setImportingSourceId(null);
      setUploading(false);
    }
  };

  const openFilePicker = () => {
    if (!uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAnalysisClose = () => {
    setShowAnalysis(false);
    if (uploadedBusinessInfo) {
      onUploadSuccess(uploadedBusinessInfo, analysisData, uploadedPerQuestionAnswers);
    }
    onClose();
  };

  const handleStartAnswering = () => {
    setShowAnalysis(false);
    if (uploadedBusinessInfo) {
      onUploadSuccess(uploadedBusinessInfo, analysisData, uploadedPerQuestionAnswers);
    }
    onClose();
    if (onStartAnswering) {
      onStartAnswering(analysisData || undefined, uploadedBusinessInfo || null, uploadedPerQuestionAnswers);
    }
  };

  return (
    <>
      {/* Analysis Modal */}
      {showAnalysis && analysisData && (
        <PlanAnalysisModal
          isOpen={showAnalysis}
          onClose={handleAnalysisClose}
          analysis={analysisData}
          onStartAnswering={handleStartAnswering}
          sessionId={sessionId}
        />
      )}

      {/* Upload Modal - Hide when analysis is shown */}
      <AnimatePresence>
        {isOpen && !showAnalysis && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Close upload dialog"
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: guidedEntrance ? 0.45 : 0.22,
                ease: 'easeOut',
              }}
              onClick={onClose}
            />
            <motion.div
              ref={modalContentRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="upload-plan-modal-title"
              className="relative z-10 bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ring-1 ring-slate-900/5"
              initial={{
                opacity: 0,
                y: guidedEntrance ? 32 : 16,
                scale: guidedEntrance ? 0.94 : 0.98,
              }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={
                guidedEntrance
                  ? {
                      type: 'spring',
                      stiffness: 340,
                      damping: 30,
                      mass: 0.85,
                      delay: 0.12,
                    }
                  : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
              }
              onClick={(e) => e.stopPropagation()}
            >
              {guidedEntrance && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.38, duration: 0.35, ease: 'easeOut' }}
                  className="mx-6 mt-5 flex items-center gap-2 rounded-full border border-teal-200/80 bg-gradient-to-r from-teal-50 to-cyan-50 px-4 py-2 text-sm text-teal-900 shadow-sm"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                    ✓
                  </span>
                  <span>
                    <span className="font-semibold">Tour complete.</span>{' '}
                    Optional next step — import an existing plan or close to answer questions one by one.
                  </span>
                </motion.div>
              )}

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2
            id="upload-plan-modal-title"
            className="text-2xl font-bold text-gray-900 flex items-center gap-2"
          >
            📄 Upload Business Plan
          </h2>
          <button
            onClick={onClose}
            disabled={uploading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-1 hover:bg-gray-100 rounded-full"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="mb-6 text-sm leading-relaxed text-gray-600">
            If you already have a completed business plan, upload it below and Angel will map it to the questionnaire — only asking about gaps before your launch roadmap.
          </p>

          <ImportMethodTabs
            activeMode={activeMode}
            onSelect={setActiveMode}
            disabled={uploading}
          />

          <PlanRequirementsPanel mode={activeMode} />

          {/* Upload / paste / pick area */}
          <div
            className="space-y-6"
            role="tabpanel"
            id={`import-panel-${activeMode}`}
            aria-labelledby={`import-tab-${activeMode}`}
          >
            {activeMode === 'session' ? (
              <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-teal-900">
                      Reuse a plan from another venture
                    </p>
                    <p className="mt-1 text-xs text-teal-800/80">
                      Pick a completed business plan Angel has already generated for one of your other ventures.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={loadImportSources}
                    disabled={sourcesLoading || uploading}
                    className="text-xs font-medium text-teal-700 underline-offset-4 hover:underline disabled:opacity-50"
                  >
                    {sourcesLoading ? 'Refreshing…' : 'Refresh'}
                  </button>
                </div>

                {sourcesError && (
                  <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {sourcesError}
                  </div>
                )}

                {sourcesLoading ? (
                  <div className="flex items-center gap-2 py-8 text-sm text-teal-800">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Loading your other ventures…
                  </div>
                ) : importSources.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-teal-300 bg-white/60 px-4 py-6 text-center text-sm text-teal-900/80">
                    No other ventures with a completed business plan yet. Finish a plan in another venture
                    and it will show up here.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {importSources.map((source) => {
                      const generated = source.generated_at ? new Date(source.generated_at) : null;
                      const generatedLabel = generated && !Number.isNaN(generated.getTime())
                        ? generated.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                        : 'Date unknown';
                      const isThisImporting = importingSourceId === source.id;
                      return (
                        <li key={source.id}>
                          <button
                            type="button"
                            onClick={() => handleImportFromSession(source)}
                            disabled={uploading}
                            className="group flex w-full items-center justify-between gap-4 rounded-xl border border-teal-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-teal-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {source.title || 'Untitled venture'}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-slate-500">
                                {[source.business_name, source.industry].filter(Boolean).join(' • ') || 'Business plan ready to import'}
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-400">
                                Completed {generatedLabel} · {Math.round(source.artifact_chars / 1000)}k characters
                              </p>
                            </div>
                            <span className="shrink-0 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition group-hover:bg-teal-700">
                              {isThisImporting ? 'Importing…' : 'Import'}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : activeMode === 'upload' ? (
              <div
                role="button"
                tabIndex={uploading ? -1 : 0}
                aria-label="Upload business plan file"
                onClick={openFilePicker}
                onKeyDown={(event) => {
                  if (uploading) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openFilePicker();
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : uploading
                    ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Drop your business plan here
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      or click to browse files
                    </p>
                    <p className="mt-2 max-w-md text-xs leading-relaxed text-gray-500">
                      Your file should cover the topics listed above (overview, market, operations, marketing, legal, financials, growth, and risks).
                    </p>
                    <p className="text-xs text-gray-400">PDF, DOCX, or TXT — up to 10 MB</p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openFilePicker();
                    }}
                    disabled={uploading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {uploading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </span>
                    ) : (
                      'Choose File'
                    )}
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileInput}
                    disabled={uploading}
                    className="hidden"
                  />
                </div>
              </div>
            ) : activeMode === 'paste' ? (
              <div className="space-y-4">
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste your full business plan here. Include as many sections as you can: business overview, target market, operations, marketing, legal structure, financials, growth plans, and risks."
                  rows={12}
                  className="w-full border border-indigo-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-shadow"
                  disabled={uploading}
                />
                {textError && (
                  <div className="text-sm text-red-500">{textError}</div>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{pastedText.length.toLocaleString()} characters</span>
                  <span>Tip: use the checklist above — more sections means fewer follow-up questions.</span>
                </div>
                <button
                  onClick={handleTextSubmit}
                  disabled={uploading || !pastedText.trim()}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {uploading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </span>
                  ) : (
                    'Analyze This Text'
                  )}
                </button>
              </div>
            ) : null}

              {activeMode !== 'session' && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Supported File Types</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• PDF documents (.pdf)</li>
                  <li>• Microsoft Word (.docx only — convert legacy .doc first)</li>
                  <li>• Text files (.txt)</li>
                  <li>• Maximum file size: 10MB</li>
                </ul>
              </div>
              )}

              {/* What Happens Next */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• We'll extract key business information from your plan</li>
                  <li>• The information will be used to pre-fill your business planning questions</li>
                  <li>• You can still modify and customize everything during the planning process</li>
                  <li>• Your content will be processed instantly (not stored permanently)</li>
                </ul>
              </div>
            </div>
        </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default UploadPlanModal;
