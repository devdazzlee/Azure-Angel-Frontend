import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchRoadmapPlan } from "../../services/authService";
import { isRoadmapStepCompleted } from "../../utils/roadmapMatching";
import { parseRoadmapMarkdown } from "../../utils/roadmapParse";
import { ArrowLeft, Map } from "lucide-react";
import DocumentExportModal from "../../components/DocumentExportModal";
import RoadmapTaskMobileCards from "../../components/RoadmapTaskMobileCards";
import {
  roadmapFooterActionsRow,
  roadmapFooterBtnDownload,
  roadmapFooterBtnProceed,
} from "../../components/roadmapFooterButtons";
import VentureBrandMark from "../../components/layout/VentureBrandMark";
import httpClient from "../../api/httpClient";

const RoadmapPage: React.FC = () => {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [roadmapContent, setRoadmapContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  /** Synchronous guard so rapid double-clicks cannot start two transitions before React re-renders. */
  const implementationTransitionLockRef = useRef(false);
  // Real completions sourced from the Implementation phase. Used to overlay
  // a checkmark on the corresponding roadmap rows.
  const [completedRoadmapStepKeys, setCompletedRoadmapStepKeys] = useState<string[]>([]);

  useEffect(() => {
    const loadRoadmap = async () => {
      if (!sessionId) {
        setError("Session ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetchRoadmapPlan(sessionId);
        setRoadmapContent(response.result.plan);
        setError("");
      } catch (err) {
        setError((err as Error).message || "Failed to load roadmap");
        toast.error("Failed to load roadmap");
      } finally {
        setLoading(false);
      }
    };

    loadRoadmap();
  }, [sessionId]);

  // Pull the user's actual Implementation completions so we can render the
  // real Status overlay instead of the LLM-generated guess. Done via raw
  // fetch so a transient session-fetch error doesn't surface a toast — the
  // roadmap simply renders without completion checkmarks in that case.
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await httpClient.get<any>(`/angel/sessions/${sessionId}`);
        if (cancelled) return;
        const keys = data?.result?.business_context?.completed_roadmap_step_keys;
        if (Array.isArray(keys)) {
          setCompletedRoadmapStepKeys(keys);
        }
      } catch {
        // Non-fatal: roadmap simply won't show completion checkmarks.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // When returning from Implementation in the same tab, session data may update;
  // refresh completion keys whenever the page becomes visible again.
  useEffect(() => {
    if (!sessionId) return;
    const refreshCompletions = async () => {
      try {
        const { data } = await httpClient.get<any>(`/angel/sessions/${sessionId}`);
        const keys = data?.result?.business_context?.completed_roadmap_step_keys;
        if (Array.isArray(keys)) {
          setCompletedRoadmapStepKeys(keys);
        }
      } catch {
        /* non-fatal */
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshCompletions();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [sessionId]);

  const stages = parseRoadmapMarkdown(roadmapContent);
  const totalTasks = stages.reduce((sum, stage) => sum + stage.tasks.length, 0);

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <VentureBrandMark />
            <button
              type="button"
              disabled={!sessionId}
              onClick={() =>
                sessionId &&
                navigate(`/ventures/${sessionId}/budget`, {
                  state: { fromTransition: true },
                })
              }
              className="inline-flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-indigo-700 disabled:pointer-events-none disabled:opacity-50 sm:px-0"
              aria-label="Back to Budget"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Back to Budget</span>
              <span className="sm:hidden">Back</span>
            </button>

            <div className="hidden h-10 w-px shrink-0 bg-gray-200 sm:block" aria-hidden />

            <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm ring-1 ring-indigo-500/20 sm:h-12 sm:w-12"
                aria-hidden
              >
                <Map className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 sm:text-xs">
                  Founderport
                </p>
                <h1 className="truncate text-lg font-bold tracking-tight text-gray-900 sm:text-2xl">
                  Launch Roadmap
                </h1>
                <p className="mt-0.5 truncate text-xs text-gray-500 sm:text-sm">
                  Personalized from your completed business plan
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl min-w-0 px-3 py-5 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500 space-y-6">
            <div className="text-6xl animate-pulse">🗺️</div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Generating Your Roadmap</h3>
              <p className="text-sm">This may take 30-60 seconds...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
            <div className="text-5xl">⚠️</div>
            <h2 className="text-lg font-bold text-gray-800">Error</h2>
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => navigate(`/ventures/${sessionId}`)}
              className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            >
              Go Back
            </button>
          </div>
        ) : stages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
            <div className="text-5xl">📋</div>
            <h2 className="text-lg font-bold text-gray-800">Roadmap Format Issue</h2>
            <p className="text-sm text-gray-600 mb-4">
              The roadmap is being regenerated. Please refresh the page in a moment.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg"
            >
              Refresh Page
            </button>
          </div>
        ) : (
          <>
            {/* Roadmap Summary Card */}
            <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:mb-8 sm:p-6 md:p-8 md:shadow-md">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
                <div className="min-w-0">
                  <h2 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">Roadmap Overview</h2>
                  <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
                    Your personalized launch roadmap is structured into{' '}
                    <strong className="text-indigo-600">{stages.length} key stages</strong> with a total of{' '}
                    <strong className="text-indigo-600">{totalTasks} actionable tasks</strong>.
                  </p>
                </div>
                <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:gap-4">
                  <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-3 text-center sm:p-4">
                    <div className="text-2xl font-bold text-indigo-600 sm:text-3xl">{stages.length}</div>
                    <div className="mt-1 text-xs text-gray-600 sm:text-sm">Stages</div>
                  </div>
                  <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-3 text-center sm:p-4">
                    <div className="text-2xl font-bold text-purple-600 sm:text-3xl">{totalTasks}</div>
                    <div className="mt-1 text-xs text-gray-600 sm:text-sm">Tasks</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stages */}
            <div className="space-y-5 sm:space-y-6 md:space-y-8">
              {stages.map((stage, stageIdx) => (
                <div
                  key={stageIdx}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition-shadow duration-300 hover:shadow-lg md:shadow-lg"
                >
                  {/* Stage Header */}
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold leading-snug text-white sm:text-xl md:text-2xl">
                          {stage.title}
                        </h3>
                        {stage.goal && (
                          <p className="mt-2 text-sm leading-relaxed text-indigo-100">
                            <strong className="font-semibold text-white/95">Goal:</strong> {stage.goal}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end sm:gap-0 sm:text-right">
                        <span className="text-2xl font-bold text-white/90 sm:text-3xl">{stage.tasks.length}</span>
                        <span className="text-xs uppercase tracking-wide text-indigo-200">Tasks</span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile / tablet: task cards */}
                  <RoadmapTaskMobileCards
                    tasks={stage.tasks}
                    completedRoadmapStepKeys={completedRoadmapStepKeys}
                  />

                  {/* Desktop: table */}
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="min-w-full border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200">
                            Task
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200">
                            Description
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200">
                            Angel's Role
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 w-20">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stage.tasks.map((task, taskIdx) => {
                          const completed = isRoadmapStepCompleted(task.task, completedRoadmapStepKeys);
                          return (
                            <tr
                              key={taskIdx}
                              className={`${
                                taskIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                              } hover:bg-indigo-50 transition-colors`}
                            >
                              <td className="px-4 py-4 align-top">
                                <div className={`text-sm font-semibold ${completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                  {task.task}
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="text-sm text-gray-700 leading-relaxed">
                                  {task.description}
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="text-sm text-indigo-700">
                                  {task.angelRole}
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top text-center">
                                {completed ? (
                                  <span
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700"
                                    title="Completed in Implementation"
                                    aria-label="Completed"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </span>
                                ) : (
                                  <span className="text-gray-300 text-xs">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Actions */}
            <div className={roadmapFooterActionsRow}>
              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                disabled={!roadmapContent.trim()}
                className={roadmapFooterBtnDownload}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!sessionId || isTransitioning || implementationTransitionLockRef.current) return;
                  implementationTransitionLockRef.current = true;

                  // Flip the button into the loading state synchronously so the
                  // user gets an instant acknowledgement of their click — the
                  // network round-trips happen after this paint.
                  setIsTransitioning(true);

                  try {
                    const { data: subscriptionData } = await httpClient.get<any>(
                      '/stripe/check-subscription-status'
                    );

                    if (!subscriptionData.success || !subscriptionData.has_active_subscription || subscriptionData.payment_failed) {
                      toast.error('Subscription required to proceed to Implementation phase. Please subscribe to continue.');
                      setIsTransitioning(false);
                      implementationTransitionLockRef.current = false;
                      return;
                    }

                    const { data } = await httpClient.post<any>(
                      `/angel/sessions/${sessionId}/roadmap-to-implementation-transition`
                    );

                    if (data.success) {
                      navigate(`/ventures/${sessionId}/implementation-transition`);
                    } else {
                      if (data.requires_subscription) {
                        toast.error(data.message || "Subscription required to proceed to Implementation phase");
                      } else {
                        toast.error(data.message || "Failed to prepare implementation transition");
                      }
                      setIsTransitioning(false);
                      implementationTransitionLockRef.current = false;
                    }
                  } catch (error) {
                    console.error("Error preparing implementation transition:", error);
                    toast.error("Something went wrong.");
                    setIsTransitioning(false);
                    implementationTransitionLockRef.current = false;
                  }
                }}
                disabled={isTransitioning}
                className={roadmapFooterBtnProceed}
              >
                {isTransitioning ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Preparing…
                  </>
                ) : (
                  "Proceed to Implementation"
                )}
              </button>
            </div>
          </>
        )}
      </div>

      <DocumentExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        documentTitle="Launch Roadmap"
        documentContent={roadmapContent}
        documentType="roadmap"
      />
    </div>
  );
};

export default RoadmapPage;

