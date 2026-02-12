import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Direct lookup table: internal BP question number → client spec display number.
 * Must match the mapping in venture.tsx BP_TO_CLIENT.
 */
const BP_TO_CLIENT: Record<number, string> = {
  1: '1', 2: '1.1', 3: '2', 4: '3',
  5: '5', 6: '6', 7: '7',
  8: '11', 9: '12', 10: '13', 11: '14', 12: '15', 13: '16',
  14: '15', 15: '16', 16: '17', 17: '18',
  18: '28', 19: '29', 20: '30', 21: '31', 22: '32', 23: '33',
  24: '34', 25: '35', 26: '36', 27: '37', 28: '38',
  29: '39', 30: '40', 31: '41', 32: '42', 33: '43', 34: '44',
  35: '45', 36: '45.1', 37: '45.2', 38: '45.3', 39: '45.4', 40: '45.5', 41: '45.6',
  42: '46', 43: '46.1', 44: '46.2', 45: '46.3',
};

const getClientDisplayNumber = (internalNumber: number): string => {
  return BP_TO_CLIENT[internalNumber] ?? String(internalNumber);
};

interface MissingQuestion {
  question_number: number;
  question_text: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

interface PlanAnalysis {
  summary: string;
  completeness_score: number;
  found_information: {
    business_name?: boolean;
    mission_vision?: boolean;
    problem_solution?: boolean;
    target_market?: boolean;
    competitors?: boolean;
    financial_projections?: boolean;
    marketing_strategy?: boolean;
    operational_plan?: boolean;
    legal_structure?: boolean;
    risk_analysis?: boolean;
  };
  missing_questions: MissingQuestion[];
  recommendations: string;
}

interface PlanAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: PlanAnalysis;
  onStartAnswering: (analysis?: PlanAnalysis, businessInfo?: any) => void;
  sessionId?: string;
}

const PlanAnalysisModal: React.FC<PlanAnalysisModalProps> = ({
  isOpen,
  onClose,
  analysis,
  onStartAnswering,
  sessionId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (!isOpen) return null;

  const completenessPercent = Math.round(analysis.completeness_score * 100);
  const missingCount = analysis.missing_questions.length;

  // Group missing questions by category
  const questionsByCategory: Record<string, MissingQuestion[]> = {};
  analysis.missing_questions.forEach((q) => {
    if (!questionsByCategory[q.category]) {
      questionsByCategory[q.category] = [];
    }
    questionsByCategory[q.category].push(q);
  });

  const categories = Object.keys(questionsByCategory);

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get found information icons
  const getInfoStatus = (found: boolean | undefined) => {
    if (found === true) {
      return <span className="text-green-600 text-lg">✓</span>;
    } else if (found === false) {
      return <span className="text-red-600 text-lg">✗</span>;
    }
    return <span className="text-gray-400 text-lg">?</span>;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl">
                📊
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Plan Analysis Complete</h2>
                <p className="text-sm text-gray-600">Review what's found and what's missing</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Summary Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Analysis Summary
              </h3>
              <p className="text-gray-700 mb-4">{analysis.summary}</p>
              
              {/* Completeness Score */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Completeness Score</span>
                  <span className="text-lg font-bold text-gray-900">{completenessPercent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      completenessPercent >= 80
                        ? 'bg-green-500'
                        : completenessPercent >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${completenessPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Found Information Grid */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-xl">✅</span>
                Information Found in Your Plan
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  {getInfoStatus(analysis.found_information.business_name)}
                  <span className="text-sm text-gray-700">Business Name</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  {getInfoStatus(analysis.found_information.mission_vision)}
                  <span className="text-sm text-gray-700">Mission & Vision</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  {getInfoStatus(analysis.found_information.problem_solution)}
                  <span className="text-sm text-gray-700">Problem & Solution</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  {getInfoStatus(analysis.found_information.target_market)}
                  <span className="text-sm text-gray-700">Target Market</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  {getInfoStatus(analysis.found_information.competitors)}
                  <span className="text-sm text-gray-700">Competitors</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  {getInfoStatus(analysis.found_information.financial_projections)}
                  <span className="text-sm text-gray-700">Financial Projections</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  {getInfoStatus(analysis.found_information.marketing_strategy)}
                  <span className="text-sm text-gray-700">Marketing Strategy</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  {getInfoStatus(analysis.found_information.operational_plan)}
                  <span className="text-sm text-gray-700">Operational Plan</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  {getInfoStatus(analysis.found_information.legal_structure)}
                  <span className="text-sm text-gray-700">Legal Structure</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  {getInfoStatus(analysis.found_information.risk_analysis)}
                  <span className="text-sm text-gray-700">Risk Analysis</span>
                </div>
              </div>
            </div>

            {/* Missing Questions */}
            {missingCount > 0 ? (
              <div className="bg-white rounded-xl border border-orange-200 p-6">
                <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>What happens next:</strong> Your uploaded plan has been analyzed. We found {missingCount} question{missingCount !== 1 ? 's' : ''} that need answers. 
                    When you click "Answer Missing Questions", we'll start from the first missing question and guide you through answering only what's needed to complete your plan.
                  </p>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    Missing Information ({missingCount} questions)
                  </h3>
                  {categories.length > 1 && (
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          selectedCategory === null
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        All
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            selectedCategory === cat
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {analysis.missing_questions
                    .filter((q) => selectedCategory === null || q.category === selectedCategory)
                    .map((question, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:bg-purple-50 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
                                Q{getClientDisplayNumber(question.question_number)}
                              </span>
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded border ${getPriorityColor(
                                  question.priority
                                )}`}
                              >
                                {question.priority.toUpperCase()} Priority
                              </span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {question.category}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800">{question.question_text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">Complete Plan!</h3>
                <p className="text-green-700">
                  Your business plan appears to be comprehensive. All required information has been found.
                </p>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  Recommendations
                </h3>
                <p className="text-gray-700">{analysis.recommendations}</p>
              </div>
            )}

            {/* What Happens Next - Detailed Explanation */}
            {missingCount > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  What Happens When You Answer Missing Questions
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    <p>We'll start from the <strong>first missing question</strong> (Question {analysis.missing_questions[0]?.question_number ? getClientDisplayNumber(analysis.missing_questions[0].question_number) : 'N/A'})</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    <p>You'll answer <strong>only the {missingCount} missing question{missingCount !== 1 ? 's' : ''}</strong> - we won't ask questions you've already answered in your plan</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    <p>Information found in your uploaded plan will be <strong>pre-filled</strong> where possible</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">4.</span>
                    <p>Once all missing questions are answered, we'll generate your <strong>complete launch roadmap</strong></p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Close
              </button>
              {missingCount > 0 && (
                <button
                  onClick={() => {
                    console.log("🔘 Answer Missing Questions clicked, analysis:", analysis);
                    onStartAnswering(analysis, null);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Answer Missing Questions ({missingCount})
                </button>
              )}
              {missingCount === 0 && (
                <button
                  onClick={() => {
                    console.log("🔘 Continue to Roadmap clicked, analysis:", analysis);
                    onStartAnswering(analysis, null);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Continue to Roadmap
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PlanAnalysisModal;

