import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';

interface RoadmapToImplementationTransitionProps {
  isOpen: boolean;
  onBeginImplementation: () => void;
  businessName: string;
  industry: string;
  location: string;
}

const RoadmapToImplementationTransition: React.FC<RoadmapToImplementationTransitionProps> = ({
  isOpen,
  onBeginImplementation,
  businessName,
  industry,
  location
}) => {
  const displayBusinessName = businessName.trim();
  const [isExiting, setIsExiting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Stop confetti after 5 seconds
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleBeginImplementation = () => {
    setIsExiting(true);
    setTimeout(() => {
      onBeginImplementation();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Confetti Animation */}
          {showConfetti && (
            <Confetti
              width={windowSize.width}
              height={windowSize.height}
              recycle={false}
              numberOfPieces={500}
              gravity={0.3}
            />
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[min(96dvh,56rem)] sm:max-h-[min(96dvh,60rem)] overflow-hidden flex flex-col"
            >
              {/* Header with Badge */}
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-4 py-5 sm:px-6 sm:py-6 text-white relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.1)_0%,_transparent_50%)]"></div>
                </div>
                
                <div className="relative z-10 text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                    className="inline-block mb-2 sm:mb-3"
                  >
                    <div className="text-5xl sm:text-6xl md:text-7xl leading-none">🏅</div>
                  </motion.div>
                  
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
                    EXECUTION READY BADGE UNLOCKED
                  </h1>
                  <p className="text-sm sm:text-base md:text-lg opacity-95 max-w-2xl mx-auto">
                    For completing your full roadmap journey and preparing for business launch.
                  </p>
                </div>
              </div>

              {/* Scrollable Content — min-h-0 so flex child can shrink and scroll inside max-h modal */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:p-6 md:p-8">
                {/* Opening Message */}
                <div className="text-center mb-6 sm:mb-8">
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    You've reviewed your full Launch Roadmap. Every milestone – from formation to marketing – laid out so you know what it will take to make it real. You're now ready to take the next step to bring your business,{' '}
                    <span className="break-words font-medium text-gray-900">{displayBusinessName}</span>, to life.
                  </p>
                </div>

                {/* Next Phase Introduction — body-sized type so long API names don't read like a huge headline */}
                <div className="mb-6 sm:mb-8">
                  <div
                    className="mb-3 sm:mb-4 flex flex-wrap items-start gap-2 text-sm sm:text-base text-gray-900 leading-relaxed"
                    role="heading"
                    aria-level={2}
                  >
                    <span aria-hidden className="shrink-0 select-none">
                      🚀
                    </span>
                    <p className="min-w-0 flex-1 text-left m-0">
                      <span className="font-semibold text-gray-900">Next Phase: Implementation</span>
                      <span className="text-gray-700"> – Walking through the steps from the Roadmap to build </span>
                      <span className="break-words font-medium text-gray-800">{displayBusinessName}</span>
                      <span className="text-gray-700">.</span>
                    </p>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 sm:p-6 rounded-r-lg mb-4">
                    <p className="text-gray-800 mb-3 leading-relaxed">
                      What you've done so far isn't just planning – it's progress. Now it's time to step into the Implementation Phase – where we turn the roadmap into real, measurable action.
                    </p>
                    <p className="text-gray-800 leading-relaxed">
                      Angel will stay with you, just as before, guiding you through each task one at a time – whether it's helping you complete documentation, preparing outreach to organizations, or building your first marketing campaign. Angel is here for you.
                    </p>
                  </div>
                </div>

                {/* How Angel Helps Table */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span>⚙️</span>
                    How Angel Helps in Implementation Phase
                  </h2>
                  
                  <p className="text-gray-700 mb-4">Here's what you can expect in this phase:</p>

                  <div className="overflow-x-auto shadow-md rounded-lg">
                    <table className="min-w-full border-collapse bg-white rounded-lg overflow-hidden">
                      <thead className="bg-gradient-to-r from-indigo-100 to-purple-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-bold text-indigo-900 border-b-2 border-indigo-300">
                            Function
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-indigo-900 border-b-2 border-indigo-300">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            Advice & Tips
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            I'll share focused, practical insights to guide every action
                          </td>
                        </tr>
                        <tr className="bg-gray-50 hover:bg-blue-50 transition-colors border-b border-gray-100">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            Kickstart
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            I can complete parts of tasks for you — like drafting outreach emails or setting up a checklist
                          </td>
                        </tr>
                        <tr className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            Help
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            Ask for deep, detailed guidance whenever you hit a roadblock
                          </td>
                        </tr>
                        <tr className="bg-gray-50 hover:bg-blue-50 transition-colors border-b border-gray-100">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            Who do I contact?
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            I'll connect you with trusted, relevant professionals or providers near you in {location}
                          </td>
                        </tr>
                        <tr className="hover:bg-blue-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            Dynamic Feedback
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            I'll notice when tasks look incomplete or off-track and help correct them quickly
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Progress Tracking */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span>📊</span>
                    Implementation Progress Tracking
                  </h2>
                  
                  <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-r-lg">
                    <p className="text-gray-800 mb-4">
                      Just like before, you'll have a visual tracker — so you can watch your real progress, not just your plans. Each task you complete gets you closer to full launch.
                    </p>
                    
                    <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">Implementation Progress:</span>
                        <span className="text-lg font-bold text-purple-600">0% → Ready to Begin</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "0%" }}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recognize Journey */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span>💪</span>
                    Take a Moment to Recognize Your Journey
                  </h2>
                  
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-6">
                    <p className="text-gray-800 mb-4 font-medium">
                      Before we dive in, take a second to recognize how far you've come with {displayBusinessName}:
                    </p>
                    
                    <div className="space-y-2 text-gray-800">
                      <div className="flex items-start gap-3">
                        <span className="text-green-600 font-bold text-xl">✅</span>
                        <span>You started with an idea</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-green-600 font-bold text-xl">✅</span>
                        <span>You've built a comprehensive plan</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-green-600 font-bold text-xl">✅</span>
                        <span>You've created a detailed roadmap</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-blue-600 font-bold text-xl">🚀</span>
                        <span className="font-semibold">Now, we'll bring it all to life — step by step</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ready to Begin */}
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    🎯 Ready to Begin Implementation?
                  </h2>
                  <p className="text-sm sm:text-base text-gray-700 mb-4">
                    When you're ready, we'll show you the first real-world action to take — and we'll tackle it together.
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 mb-8 italic">
                    "What you've done so far isn't just planning — it's progress. Now let's execute with precision and confidence."
                  </p>
                  
                  <div className="text-sm text-gray-500 italic">
                    This implementation process is tailored specifically to {displayBusinessName} in the {industry} industry, located in {location}. Every recommendation is designed to help you build the business of your dreams.
                  </div>
                </div>
              </div>

              {/* Footer with Action Button - Always Visible */}
              <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 sm:p-6 flex-shrink-0 shadow-lg">
                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: isExiting ? 1 : 1.05 }}
                    whileTap={{ scale: isExiting ? 1 : 0.95 }}
                    onClick={handleBeginImplementation}
                    disabled={isExiting}
                    className="group relative bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white px-12 py-5 rounded-xl text-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isExiting ? (
                      <div className="flex items-center justify-center gap-3">
                        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Starting Implementation...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-3xl">🚀</span>
                        <span>Begin Implementation</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RoadmapToImplementationTransition;
