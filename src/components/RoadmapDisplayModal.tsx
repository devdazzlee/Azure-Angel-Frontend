import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { parseRoadmapMarkdown } from "../utils/roadmapParse";
import {
  downloadRoadmapExcel,
  downloadRoadmapWord,
} from "../utils/roadmapExport";

interface RoadmapDisplayModalProps {
  open: boolean;
  onClose: () => void;
  roadmapContent: string;
  loading?: boolean;
  error?: string;
  onProceedToImplementation?: () => void;
}

const RoadmapDisplayModal: React.FC<RoadmapDisplayModalProps> = ({
  open,
  onClose,
  roadmapContent,
  loading = false,
  error,
  onProceedToImplementation,
}) => {
  const [exporting, setExporting] = useState<"excel" | "word" | null>(null);

  if (!open) return null;

  const stages = parseRoadmapMarkdown(roadmapContent);
  
  // Debug logging
  React.useEffect(() => {
    if (roadmapContent) {
      console.log("📋 Roadmap content length:", roadmapContent.length);
      console.log("📋 Roadmap content preview:", roadmapContent.substring(0, 500));
      console.log("📋 Has 'Stage' keyword:", roadmapContent.includes("Stage"));
      console.log("📋 Has table format:", roadmapContent.includes("| Task | Description | Dependencies | Angel's Role | Status |"));
      console.log("📋 Parsed stages count:", stages.length);
      if (stages.length === 0) {
        console.warn("⚠️ No stages parsed from roadmap content. Content may be in wrong format.");
      }
    }
  }, [roadmapContent, stages.length]);

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

  const getStatusIcon = (status: string) => {
    const statusText = status.trim().toLowerCase();
    if (statusText === '✓' || statusText === '✅' || statusText.includes('complete') || statusText.includes('done')) {
      return { icon: '✅', color: 'text-green-600' };
    } else if (statusText === '→' || statusText === '🔜' || statusText.includes('soon') || statusText.includes('upcoming')) {
      return { icon: '🔜', color: 'text-blue-600' };
    } else if (statusText === '⏳' || statusText.includes('progress') || statusText.includes('pending')) {
      return { icon: '⏳', color: 'text-orange-600' };
    }
    return { icon: status.trim() || '⏳', color: 'text-orange-600' };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-7xl h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 px-6 py-4 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-2xl">🗺️</div>
            <div>
              <h2 className="text-xl font-bold">Founderport Launch Roadmap</h2>
              <p className="text-indigo-100 text-sm">(Customized directly from the completed business plan inputs)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded-full transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gradient-to-br from-gray-50 to-white">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-6">
              <div className="text-6xl animate-pulse">🗺️</div>
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Generating Your Roadmap</h3>
                <p className="text-sm">This may take 30-60 seconds...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 text-center">
              <div className="text-5xl">⚠️</div>
              <h2 className="text-lg font-bold text-gray-800">Error</h2>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : stages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 text-center">
              <div className="text-5xl">📋</div>
              <h2 className="text-lg font-bold text-gray-800">Roadmap Format Issue</h2>
              <p className="text-sm text-gray-600 mb-4">
                The roadmap is being regenerated in the new 8-stage format. Please refresh the page in a moment.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                Refresh Page
              </button>
              {roadmapContent && (
                <details className="mt-4 text-left max-w-2xl">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Debug: View raw roadmap content
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                    {roadmapContent.substring(0, 2000)}
                  </pre>
                </details>
              )}
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Roadmap Summary */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6 border border-indigo-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Roadmap Overview</h3>
                    <p className="text-sm text-gray-700">
                      <strong>{stages.length} Stages</strong> with <strong>{stages.reduce((sum, s) => sum + s.tasks.length, 0)} Total Tasks</strong>
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Customized based on your business plan: {roadmapContent.includes('business_name') ? 'Your Business' : 'Your specific business context'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-indigo-600">{stages.length}</div>
                    <div className="text-xs text-gray-600">Stages</div>
                  </div>
                </div>
              </div>

              {stages.map((stage, stageIdx) => (
                <div
                  key={stageIdx}
                  className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
                >
                  {/* Stage Header */}
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                    <h3 className="text-2xl font-bold text-white mb-2">{stage.title}</h3>
                    {stage.goal && (
                      <p className="text-indigo-100 text-sm">
                        <strong>Goal:</strong> {stage.goal}
                      </p>
                    )}
                  </div>

                  {/* Tasks Table */}
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
                            Dependencies
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
                          const statusInfo = getStatusIcon(task.status);
                          return (
                            <tr
                              key={taskIdx}
                              className={`${
                                taskIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                              } hover:bg-indigo-50 transition-colors`}
                            >
                              <td className="px-4 py-4 align-top">
                                <div className="text-sm font-semibold text-gray-900">
                                  {task.task}
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="text-sm text-gray-700 leading-relaxed">
                                  {task.description}
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="text-sm text-gray-600 italic">
                                  {task.dependencies || 'None'}
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="text-sm text-indigo-700">
                                  {task.angelRole}
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top text-center">
                                <span className={`text-2xl ${statusInfo.color}`}>
                                  {statusInfo.icon}
                                </span>
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
          )}

          {/* Footer Actions */}
          {!loading && !error && roadmapContent.trim() && (
            <div className="mt-8 flex flex-wrap gap-3 justify-center border-t border-gray-200 pt-6">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={exporting !== null}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg shadow-sm flex items-center gap-2 transition-colors font-medium"
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
                className="bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg shadow-sm flex items-center gap-2 transition-colors font-medium"
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
              {onProceedToImplementation && (
                <button
                  onClick={onProceedToImplementation}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-all font-semibold transform hover:scale-105"
                >
                  <span className="text-xl">🚀</span>
                  Proceed to Implementation
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoadmapDisplayModal;

