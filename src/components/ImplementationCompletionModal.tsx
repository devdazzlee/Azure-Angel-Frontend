import React from 'react';
import { CheckCircle, Trophy, Rocket, Award, Star, X } from 'lucide-react';

interface ImplementationCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewSummary: () => void;
  progress: {
    completed: number;
    total: number;
    percent: number;
    phases_completed?: number;
  };
}

const ImplementationCompletionModal: React.FC<ImplementationCompletionModalProps> = ({
  isOpen,
  onClose,
  onViewSummary,
  progress
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header with Celebration */}
        <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-8 text-white rounded-t-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIzMCIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          <div className="relative z-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Trophy className="h-20 w-20 text-yellow-300 animate-bounce" />
                <Star className="h-8 w-8 text-yellow-200 absolute -top-2 -right-2 animate-pulse" />
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-2">🎉 Congratulations! 🎉</h2>
            <p className="text-xl text-green-100">
              You've Successfully Completed All Implementation Steps!
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Progress Summary */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border-2 border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Award className="h-6 w-6 text-green-600" />
                Implementation Complete
              </h3>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">
                  {progress.percent}%
                </div>
                <div className="text-sm text-gray-600">
                  {progress.completed}/{progress.total} tasks
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${progress.percent}%` }}
              ></div>
            </div>
            {progress.phases_completed !== undefined && (
              <p className="text-sm text-gray-700">
                <strong>{progress.phases_completed}/5 phases</strong> completed successfully
              </p>
            )}
          </div>

          {/* Accomplishments */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              What You've Accomplished
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: '🏛️', title: 'Legal Foundation', desc: 'Completed all legal formation steps' },
                { icon: '💰', title: 'Financial Systems', desc: 'Set up accounting and banking' },
                { icon: '⚙️', title: 'Operations Setup', desc: 'Established operational processes' },
                { icon: '📢', title: 'Marketing & Sales', desc: 'Launched marketing strategies' },
                { icon: '🚀', title: 'Launch Preparation', desc: 'Prepared for full business launch' },
                { icon: '📈', title: 'Scaling Ready', desc: 'Ready for growth and expansion' }
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-white border-2 border-green-100 rounded-lg p-4 hover:border-green-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              What's Next?
            </h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">→</span>
                <span>Review your complete implementation summary</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">→</span>
                <span>Export your roadmap and implementation plan</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">→</span>
                <span>Begin executing your launch strategy</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">→</span>
                <span>Monitor progress and adjust as needed</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onViewSummary}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              <Trophy className="h-5 w-5" />
              View Complete Summary
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
            >
              Continue Working
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 rounded-b-2xl border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            🎊 Your business is now ready to launch! 🎊
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImplementationCompletionModal;

