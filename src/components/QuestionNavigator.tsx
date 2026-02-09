import React, { useMemo } from 'react';
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
        kyc_completed: number;
        kyc_total: number;
        bp_completed: number;
        bp_total: number;
      };
    };
    phase_breakdown?: {
      kyc_completed: number;
      kyc_total: number;
      bp_completed: number;
      bp_total: number;
    };
  };
  currentQuestionNumber?: number | null; // Add current question number prop
  onEditPlan?: () => void;
  onUploadPlan?: () => void;
  showStepPercent?: boolean;
}

const phaseColors = {
  KYC: 'text-blue-600 bg-blue-50 border-blue-200',
  BUSINESS_PLAN: 'text-purple-600 bg-purple-50 border-purple-200',
  ROADMAP: 'text-teal-600 bg-teal-50 border-teal-200',
  IMPLEMENTATION: 'text-green-600 bg-green-50 border-green-200'
};

const phaseNames = {
  KYC: 'Getting to Know You',
  BUSINESS_PLAN: 'Business Plan',
  ROADMAP: 'Roadmap',
  IMPLEMENTATION: 'Implementation'
};

const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  questions,
  currentPhase,
  onQuestionSelect,
  currentProgress,
  currentQuestionNumber,
  onEditPlan,
  onUploadPlan,
  showStepPercent = true,
}) => {
  // Debug logging to see what progress data we receive
  console.log("🔍 QuestionNavigator Progress Data:", {
    phase: currentProgress.phase,
    answered: currentProgress.answered,
    total: currentProgress.total,
    percent: currentProgress.percent,
    overall_progress: currentProgress.overall_progress
  });
  
  // Group questions by phase
  const questionsByPhase = questions.reduce((acc, question) => {
    if (!acc[question.phase]) {
      acc[question.phase] = [];
    }
    acc[question.phase].push(question);
    return acc;
  }, {} as Record<string, Question[]>);

  const bpBreakdown =
    currentProgress.overall_progress?.phase_breakdown ?? currentProgress.phase_breakdown;
  
  console.log('🔍 QuestionNavigator - Full currentProgress object:', currentProgress);
  console.log('🔍 QuestionNavigator - overall_progress:', currentProgress.overall_progress);
  console.log('🔍 QuestionNavigator - phase_breakdown path:', currentProgress.overall_progress?.phase_breakdown);
  console.log('🔍 QuestionNavigator - bpBreakdown:', bpBreakdown);
  const inferredBpTotal =
    bpBreakdown?.bp_total ??
    (currentPhase === 'BUSINESS_PLAN'
      ? currentProgress.phase_total ?? currentProgress.total ?? 46
      : 46);
  const inferredBpCompleted =
    bpBreakdown?.bp_completed ??
    (currentPhase === 'BUSINESS_PLAN'
      ? currentProgress.phase_answered ?? currentProgress.answered ?? 0
      : 0);
  const bpTotal = inferredBpTotal > 0 ? inferredBpTotal : 46;
  const bpCurrentQuestionNumber = currentPhase === 'BUSINESS_PLAN'
    ? Math.min(Math.max(inferredBpCompleted + 1, 1), bpTotal)
    : Math.min(Math.max(inferredBpCompleted, 1), bpTotal);

  return (
    <div className="w-80 space-y-4">
      {/* Overall Progress Overview - Show for all phases - ALWAYS AT TOP */}
      <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
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
                {currentProgress.overall_progress?.answered || currentProgress.answered}
              </span>
              <span className="text-sm text-gray-400 font-medium">/</span>
              <span className="text-lg font-bold text-gray-700">
                {currentProgress.overall_progress?.total || currentProgress.total}
              </span>
            </div>
          </div>
          
          {/* Compact Progress Bar */}
          <div className="relative">
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-200">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                style={{ width: `${currentProgress.overall_progress?.percent || currentProgress.percent}%` }}
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 animate-shimmer"></div>
              </div>
            </div>
            
            {/* Progress Percentage */}
            <div className="mt-2 text-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent animate-gradient">
                {Math.round(currentProgress.overall_progress?.percent || currentProgress.percent)}%
              </span>
              <div className="text-xs text-gray-500 mt-0.5 font-medium uppercase tracking-wide">
                Complete
              </div>
            </div>
            
            {/* Compact Progress Milestones - Show only current phase */}
            <div className="mt-3 flex justify-center">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                    KYC
                  </span>
                  <span className="text-xs font-semibold text-blue-700 ml-1">
                    {bpBreakdown
                      ? Math.round(
                          (bpBreakdown.kyc_completed /
                            bpBreakdown.kyc_total) *
                            100
                        )
                      : Math.round(currentProgress.percent)}
                    %
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-purple-50 px-2 py-1 rounded-lg border border-purple-200">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span className="text-xs font-medium text-purple-700 uppercase tracking-wide">
                    BP
                  </span>
                  <span className="text-xs font-semibold text-purple-700 ml-1">
                    {bpBreakdown
                      ? Math.round(
                          (bpBreakdown.bp_completed /
                            bpBreakdown.bp_total) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sections by Phase */}
        
      </div>

      {/* KYC Progress Widget - Only show during KYC phase - BELOW OVERALL PROGRESS */}
      {currentPhase === 'KYC' && (
        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Getting to Know You</h3>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
            <div className="mb-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">KYC Progress</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg shadow-sm border border-gray-200">
                <span className="text-lg font-bold text-gray-900">
                  {currentProgress.answered}
                </span>
                <span className="text-sm text-gray-400 font-medium">/</span>
                <span className="text-lg font-bold text-gray-700">
                  {currentProgress.total}
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="relative">
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-200">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${currentProgress.percent}%` }}
                />
              </div>
              
              {/* Progress Percentage */}
              <div className="mt-2 text-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {Math.round(currentProgress.percent)}%
                </span>
                <div className="text-xs text-gray-500 mt-0.5 font-medium uppercase tracking-wide">
                  Complete
                </div>
              </div>
              
              {/* Step-by-Step Progress Indicators */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Question Steps
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: currentProgress.total }, (_, i) => {
                    const questionNumber = i + 1;
                    // Use currentQuestionNumber if available, otherwise fall back to answered
                    // currentQuestionNumber is the actual current question (e.g., 5)
                    // answered is the count of answered questions (e.g., 4)
                    const actualCurrentQuestion = currentQuestionNumber ?? (currentProgress.answered + 1);
                    const isCompleted = questionNumber < actualCurrentQuestion;
                    const isCurrent = questionNumber === actualCurrentQuestion;
                    
                    return (
                      <div
                        key={questionNumber}
                        className={`relative group`}
                        title={`Question ${questionNumber}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                            isCompleted
                              ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-md'
                              : isCurrent
                              ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg animate-pulse ring-2 ring-blue-300'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {isCompleted ? '✓' : questionNumber}
                        </div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          Question {questionNumber}
                          {isCompleted && ' ✓'}
                          {isCurrent && ' (Current)'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Business Plan Progress Widget - Only show during BUSINESS_PLAN phase - BELOW OVERALL PROGRESS */}
      {currentPhase === 'BUSINESS_PLAN' && (
        <BusinessPlanProgressWidget
          currentQuestionNumber={bpCurrentQuestionNumber}
          totalQuestions={bpTotal}
          className="shadow-xl"
        />
      )}
    </div>
  );
};

export default QuestionNavigator;
