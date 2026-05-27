import React from 'react';
import BusinessPlanProgressWidget from './BusinessPlanProgressWidget';

interface Question {
  id: string;
  phase: string;
  number: number;
  title: string;
  completed: boolean;
}

interface QuestionNavigatorProps {
  questions: Question[];
  currentPhase: string;
  onQuestionSelect: (questionId: string) => void;
  currentProgress: {
    phase: string;
    answered: number;
    total: number;
    percent: number;
    combined?: boolean;
    phase_answered?: number;
    phase_total?: number;
    overall_progress?: {
      answered: number;
      total: number;
      percent: number;
      phase_breakdown?: {
        gky_completed: number;
        gky_total: number;
        bp_completed: number;
        bp_total: number;
      };
    };
    phase_breakdown?: {
      gky_completed: number;
      gky_total: number;
      bp_completed: number;
      bp_total: number;
    };
  };
  currentQuestionNumber?: number | null; // Add current question number prop
  onEditPlan?: () => void;
  onUploadPlan?: () => void;
  showStepPercent?: boolean;
}

const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  questions: _questions,
  currentPhase,
  onQuestionSelect: _onQuestionSelect,
  currentProgress,
  currentQuestionNumber,
  onEditPlan: _onEditPlan,
  onUploadPlan,
  showStepPercent: _showStepPercent = true,
}) => {
  const bpTotal = 45;
  
  // Current question user is VIEWING (for section flow / "Question X of Y" display)
  const bpCurrentQuestionNumber = Math.min(Math.max(currentQuestionNumber ?? 1, 1), bpTotal);

  return (
    <div className="w-full max-w-80 space-y-4 overflow-hidden">
      {/* Overall Progress Overview - Hidden during GKY phase (no progress bars in GKY) */}
      {currentPhase !== 'GKY' && (
        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Progress Overview</h3>
          </div>

          {/* Overall Progress */}
          <div className="p-4 border-b border-gray-100 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
            <div className="mb-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Overall Progress</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg shadow-sm border border-gray-200">
                <span className="text-lg font-bold text-gray-900">
                  {currentProgress.overall_progress?.answered ?? currentProgress.answered}
                </span>
                <span className="text-sm text-gray-400 font-medium">/</span>
                <span className="text-lg font-bold text-gray-700">
                  {currentProgress.overall_progress?.total ?? currentProgress.total}
                </span>
              </div>
            </div>

            {/* Compact Progress Bar */}
            <div className="relative">
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-200">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                  style={{ width: `${currentProgress.overall_progress?.percent ?? currentProgress.percent}%` }}
                >
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 animate-shimmer"></div>
                </div>
              </div>

              {/* Progress Percentage */}
              <div className="mt-2 text-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent animate-gradient">
                  {Math.round(currentProgress.overall_progress?.percent ?? currentProgress.percent)}%
                </span>
                <div className="text-xs text-gray-500 mt-0.5 font-medium uppercase tracking-wide">
                  Complete
                </div>
              </div>
            </div>
          </div>

          {/* Sections by Phase */}

        </div>
      )}

      {/* Business Plan Progress Widget - Only show during BUSINESS_PLAN phase - BELOW OVERALL PROGRESS */}
      {currentPhase === 'BUSINESS_PLAN' && (
        <BusinessPlanProgressWidget
          currentQuestionNumber={bpCurrentQuestionNumber}
          className="shadow-xl"
        />
      )}

      {currentPhase === 'BUSINESS_PLAN' && onUploadPlan && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm">
          <p className="text-sm font-medium text-emerald-900 mb-2">Already have a business plan?</p>
          <p className="text-xs text-emerald-800/90 mb-3">
            Upload PDF, Word, or text—or paste your plan. Angel maps it to Founderport&rsquo;s questionnaire and focuses on gaps.
          </p>
          <button
            type="button"
            onClick={onUploadPlan}
            className="w-full rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition-colors"
          >
            Import existing plan
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionNavigator;
