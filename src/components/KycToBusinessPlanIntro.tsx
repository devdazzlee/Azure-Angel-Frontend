import React from 'react';

interface GkyToBusinessPlanIntroProps {
  onStart: () => void;
  isLoading?: boolean;
}

const GkyToBusinessPlanIntro: React.FC<GkyToBusinessPlanIntroProps> = ({ onStart, isLoading }) => {
  // No auto-dismiss — user must click "Start Business Planning" to proceed

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-blue-500 p-6 text-white sticky top-0 z-10 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold mb-1">Get to Know You Complete!</h2>
          <p className="text-sm opacity-90">Congratulations on completing your entrepreneurial profile.</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-gray-700 leading-relaxed space-y-3">
            <p>You've successfully established your profile. Now, let's dive into building the foundation for your venture: **Business Planning**.</p>
            <p>In this phase, we will meticulously craft your business strategy, covering every aspect from market analysis to financial projections. This structured approach ensures a robust roadmap for your success.</p>
            <p className="font-semibold">Here's what to expect:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Define your vision, mission, and unique value proposition.</li>
              <li>Analyze your target market and competitive landscape.</li>
              <li>Develop your product/service strategy and operational plan.</li>
              <li>Outline your revenue model and initial financial forecasts.</li>
            </ul>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Quick actions during Business Planning</p>
              <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-slate-700">
                <li><span className="font-semibold">Support</span>: get guided help for the current question.</li>
                <li><span className="font-semibold">Draft</span>: generate a first-pass answer you can edit.</li>
                <li><span className="font-semibold">Scrapping</span>: paste text you wrote and have Angel polish it.</li>
              </ul>
            </div>
          </div>
          <button
            onClick={onStart}
            disabled={isLoading}
            className="w-full group relative bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-xl">🚀</span>
              <span>{isLoading ? 'Starting...' : 'Start Business Planning'}</span>
              {isLoading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GkyToBusinessPlanIntro;
