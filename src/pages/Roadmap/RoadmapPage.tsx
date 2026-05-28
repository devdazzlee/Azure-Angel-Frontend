import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchRoadmapPlan } from "../../services/authService";
import { isRoadmapStepCompleted } from "../../utils/roadmapMatching";
import { parseRoadmapMarkdown } from "../../utils/roadmapParse";
import {
  downloadRoadmapExcel,
  downloadRoadmapWord,
} from "../../utils/roadmapExport";
import httpClient from "../../api/httpClient";

const RoadmapPage: React.FC = () => {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [roadmapContent, setRoadmapContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [exporting, setExporting] = useState<"excel" | "word" | null>(null);
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

  const handleExportExcel = () => {
    setExporting("excel");
    try {
      downloadRoadmapExcel(stages, roadmapContent);
      toast.success("Roadmap saved as Excel (.xlsx).");
    } catch {
      toast.error("Failed to export roadmap to Excel.");
    } finally {
      setExporting(null);
    }
  };

  const handleExportWord = async () => {
    setExporting("word");
    try {
      await downloadRoadmapWord(stages, roadmapContent);
      toast.success("Roadmap saved as Word (.docx).");
    } catch {
      toast.error("Failed to export roadmap to Word.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Beautiful Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-4xl backdrop-blur-sm shadow-lg">
                🗺️
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Founderport Launch Roadmap</h1>
                <p className="text-indigo-100 text-sm">Customized directly from your completed business plan</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={!sessionId}
                onClick={() => sessionId && navigate(`/ventures/${sessionId}/budget`)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all backdrop-blur-sm font-medium disabled:opacity-50 disabled:pointer-events-none"
              >
                ← Back to Budget
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
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
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Roadmap Overview</h2>
                  <p className="text-gray-600">
                    Your personalized launch roadmap is structured into <strong className="text-indigo-600">{stages.length} key stages</strong> with a total of <strong className="text-indigo-600">{totalTasks} actionable tasks</strong>.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="text-center bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
                    <div className="text-3xl font-bold text-indigo-600">{stages.length}</div>
                    <div className="text-sm text-gray-600 mt-1">Stages</div>
                  </div>
                  <div className="text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                    <div className="text-3xl font-bold text-purple-600">{totalTasks}</div>
                    <div className="text-sm text-gray-600 mt-1">Tasks</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stages */}
            <div className="space-y-8">
              {stages.map((stage, stageIdx) => (
                <div
                  key={stageIdx}
                  className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Stage Header */}
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">{stage.title}</h3>
                        {stage.goal && (
                          <p className="text-indigo-100 text-sm leading-relaxed">
                            <strong>Goal:</strong> {stage.goal}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-white/80">{stage.tasks.length}</div>
                        <div className="text-xs text-indigo-200">Tasks</div>
                      </div>
                    </div>
                  </div>

                  {/* Tasks Table — Status column shows the user's actual
                      Implementation completions; the LLM-guessed status and
                      dependencies columns are intentionally removed. */}
                  <div className="overflow-x-auto">
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
            <div className="mt-12 flex flex-wrap gap-4 justify-center items-center">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={exporting !== null}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-all font-semibold transform hover:scale-105"
                title="Best for tables: all tasks in one spreadsheet plus a stage summary"
              >
                {exporting === "excel" ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting…
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Excel
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => void handleExportWord()}
                disabled={exporting !== null}
                className="bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-all font-semibold transform hover:scale-105"
                title="Formatted document with a table per stage"
              >
                {exporting === "word" ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting…
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Word
                  </>
                )}
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
                      toast.success("Implementation transition prepared!");
                      navigate(`/ventures/${sessionId}`);
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
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-all font-semibold transform hover:scale-105 disabled:transform-none"
              >
                {isTransitioning ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Preparing...
                  </>
                ) : (
                  <>
                    <span className="text-xl">🚀</span>
                    Proceed to Implementation
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RoadmapPage;

