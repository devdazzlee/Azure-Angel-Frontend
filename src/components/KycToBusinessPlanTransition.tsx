import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface KycToBusinessPlanTransitionProps {
  isOpen: boolean;
  onContinue: () => void;
  onReview: () => void;
  kycSummary: string;
}

const KycToBusinessPlanTransition: React.FC<KycToBusinessPlanTransitionProps> = ({
  isOpen,
  onContinue,
  onReview,
  kycSummary
}) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleContinue = () => {
    setIsExiting(true);
    setTimeout(() => {
      onContinue();
    }, 300);
  };

  const handleReview = () => {
    setIsExiting(true);
    setTimeout(() => {
      onReview();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isExiting) {
              // Prevent closing by clicking outside during transition
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header with Congratulations */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white relative overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.1)_0%,_transparent_50%)]"></div>
              </div>
              
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="text-center mb-4"
                >
                  <div className="text-6xl mb-2">🎉</div>
                  <h1 className="text-3xl font-bold mb-2">
                    CONGRATULATIONS!
                  </h1>
                  <p className="text-xl opacity-90">
                    You've officially completed the full Business Planning Phase with Angel inside Founderport!
                  </p>
                </motion.div>
                
                <p className="text-center text-lg opacity-95 mt-4">
                  You've defined your entrepreneurial profile and shared valuable insights about your experience, goals, and preferences — an incredible milestone in your entrepreneurial journey.
                </p>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-300px)] p-8">
              {/* KYC Summary Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🧭</span>
                  Recap of Your Accomplishments
                </h2>
                
                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-4">
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-gray-800">
                      {kycSummary}
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 text-center font-medium">
                  Angel now has everything needed to guide you through creating your comprehensive business plan.
                </p>
              </div>

              {/* What Happens Next Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>⚙️</span>
                  What Happens Next: Business Planning Phase
                </h2>
                
                <p className="text-gray-700 mb-4">
                  Your completed entrepreneurial profile will now be used to create a fully personalized business planning experience. Here's what we'll build together:
                </p>

                {/* Business Plan Components */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 mb-4">
                  <h3 className="font-bold text-gray-900 mb-3">Your business plan will include:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-800">
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✅</span>
                      <span>A fully defined mission and vision statement</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✅</span>
                      <span>Market positioning, customer segments, and competitive differentiation</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✅</span>
                      <span>Clear pricing and financial projections</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✅</span>
                      <span>Comprehensive marketing, legal, and operational frameworks</span>
                    </div>
                    <div className="flex items-start gap-2 md:col-span-2">
                      <span className="text-green-600 mt-0.5">✅</span>
                      <span>Scalable growth and risk management strategies</span>
                    </div>
                  </div>
                </div>

                {/* How Angel Will Help */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-3">How Angel Will Help:</h3>
                  <div className="space-y-2 text-sm text-gray-800">
                    <div className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">📊</span>
                      <span><strong>Background Research</strong> - I'll conduct research automatically to provide you with industry insights, competitive analysis, and market data</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">💡</span>
                      <span><strong>Support</strong> - When you're unsure or want deeper guidance on any question</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">✍️</span>
                      <span><strong>Scrapping</strong> - When you have rough ideas that need polishing</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">📝</span>
                      <span><strong>Draft</strong> - When you want me to create complete responses based on what I've learned about your business</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">🎯</span>
                      <span><strong>Proactive Guidance</strong> - I'll provide both supportive encouragement and constructive coaching at every step</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Before We Continue */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🎯</span>
                  Before We Continue
                </h2>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
                  <p className="text-gray-800 mb-3">
                    The Business Planning phase is comprehensive and detailed. This ensures your final business plan is thorough and provides you with a strong starting point for launching your business.
                  </p>
                  <p className="text-gray-800 font-medium">
                    The more detailed answers you provide, the better I can help support you to bring your business to life.
                  </p>
                </div>

                <div className="text-center mt-4">
                  <p className="text-lg font-semibold text-gray-800 italic">
                    "The best way to predict the future is to create it." – Peter Drucker
                  </p>
                </div>
              </div>

              {/* Ready to Move Forward */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Ready to Move Forward?
                </h2>
                <p className="text-gray-600 mb-6">
                  Once you're ready, we'll begin the Business Planning phase where we'll dive deep into every aspect of your business idea — from your product and market to finances and growth strategy.
                </p>
                <p className="text-xl font-bold text-gray-900 mb-8">
                  Let's build the business of your dreams together!
                </p>
                
                <div className="text-center text-sm text-gray-500 italic mb-4">
                  "The way to get started is to quit talking and begin doing." – Walt Disney
                </div>
              </div>
            </div>

            {/* Footer with Action Buttons */}
            <div className="border-t border-gray-200 bg-gray-50 p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleContinue}
                  disabled={isExiting}
                  className="group relative bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">🚀</span>
                    <span>Continue to Business Planning</span>
                  </div>
                  <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReview}
                  disabled={isExiting}
                  className="group relative bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">📋</span>
                    <span>Review My Profile</span>
                  </div>
                  <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default KycToBusinessPlanTransition;

