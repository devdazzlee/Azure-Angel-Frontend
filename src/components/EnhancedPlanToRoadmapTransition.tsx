import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';

interface EnhancedPlanToRoadmapTransitionProps {
  isOpen: boolean;
  businessPlanSummary: string;
  businessName: string;
  founderName: string;
  onGenerateRoadmap: () => void;
  onReviewPlan: () => void;
  onGetAdvice: () => void;
}

const EnhancedPlanToRoadmapTransition: React.FC<EnhancedPlanToRoadmapTransitionProps> = ({
  isOpen,
  businessPlanSummary,
  businessName,
  founderName,
  onGenerateRoadmap,
  onReviewPlan,
  onGetAdvice
}) => {
  const [currentScene, setCurrentScene] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    if (isOpen) {
      // Scene 1: Show confetti and badge
      setShowConfetti(true);
      setTimeout(() => setShowBadge(true), 500);
      setTimeout(() => setShowConfetti(false), 4000);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleValidateAndProceed = () => {
    setValidationComplete(true);
    setCurrentScene(6); // Move to generation animation
    setIsGenerating(true);
    setTimeout(() => {
      onGenerateRoadmap();
    }, 3000); // 3 second generation animation
  };

  if (!isOpen) return null;

  // Extract summary highlights for Scene 2
  const extractHighlights = (summary: string) => {
    return [
      { section: 'Mission & Vision', highlight: 'Empowering entrepreneurs through AI-guided business creation.' },
      { section: 'Target Market', highlight: 'Novice and blue-collar entrepreneurs nationwide.' },
      { section: 'Problem & Solution', highlight: 'Fragmented startup resources → centralized AI-driven experience.' },
      { section: 'Revenue Model', highlight: 'Subscription-based pricing.' },
      { section: 'Marketing & Growth', highlight: 'Digital ads, video content, and strategic partnerships.' },
      { section: 'Legal & Ops', highlight: 'Formal legal structure with compliant operations.' },
    ];
  };

  const highlights = extractHighlights(businessPlanSummary);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Scene 1: Confetti */}
          {showConfetti && (
            <Confetti
              width={windowSize.width}
              height={windowSize.height}
              recycle={false}
              numberOfPieces={300}
              gravity={0.15}
              colors={['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B']}
            />
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden"
            >
              {/* Scene 1: Header with Badge */}
              <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 p-8 text-white relative overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0 opacity-20">
                  <motion.div
                    animate={{
                      backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                    className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.1)_0%,_transparent_50%)]"
                  />
                </div>

                <div className="relative z-10 text-center">
                  {/* Angel Avatar with Pulse */}
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.9, 1, 0.9],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="inline-block mb-4"
                  >
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl backdrop-blur-sm border-2 border-white/40">
                      👼
                    </div>
                  </motion.div>

                  {/* Badge Animation */}
                  <AnimatePresence>
                    {showBadge && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", bounce: 0.6, duration: 0.8 }}
                        className="mb-4"
                      >
                        <div className="inline-block bg-amber-500 text-white px-6 py-3 rounded-full text-lg font-bold shadow-2xl border-4 border-amber-300">
                          🏆 Planning Champion Award
                        </div>
                        <p className="text-sm mt-2 opacity-90">Recognized for completing the full Business Planning Phase.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <h1 className="text-4xl font-bold mb-3">
                    Congratulations, {founderName}!
                  </h1>
                  <p className="text-xl opacity-95 max-w-3xl mx-auto">
                    You've just accomplished something that many aspiring founders never finish — a complete, strategic business plan. 
                    Every decision, insight, and vision you entered is now shaping the roadmap to bring {businessName} to life.
                  </p>

                  {/* Motivational Quote */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="mt-6 p-4 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20"
                  >
                    <p className="text-lg italic">
                      "The best way to predict the future is to create it." – Peter Drucker
                    </p>
                  </motion.div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto max-h-[calc(95vh-280px)] p-8">
                {/* Scene 2: Plan Summary Recap with Highlights Table */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>📋</span>
                    Plan Summary Recap
                  </h2>

                  <p className="text-gray-700 mb-4">
                    Here's a snapshot of everything you've built. Take a moment to appreciate how clear this now looks — it's your foundation for success.
                  </p>

                  {/* Highlights Table */}
                  <div className="overflow-x-auto shadow-md rounded-lg mb-6">
                    <table className="min-w-full border-collapse bg-white rounded-lg overflow-hidden">
                      <thead className="bg-gradient-to-r from-blue-100 to-purple-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 border-b-2 border-blue-300">
                            Section
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 border-b-2 border-blue-300">
                            Highlights
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {highlights.map((item, idx) => (
                          <tr
                            key={idx}
                            className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors border-b border-gray-100`}
                          >
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                              {item.section}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {item.highlight}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Scene 3: Introduction to Roadmap Phase */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>🗺️</span>
                    Introduction to the Roadmap Phase
                  </h2>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                    <p className="text-gray-800 mb-3 font-medium">
                      Now we'll transform your plan into action. I'm going to generate your personalized Launch Roadmap — 
                      a chronological, dependency-aware checklist designed specifically for {businessName}.
                    </p>
                    <p className="text-gray-700">
                      It's not just a list of tasks — it's your guided journey to launch.
                    </p>
                  </div>
                </div>

                {/* Scene 4: Feature Preview Table */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>✨</span>
                    Feature Preview and User Orientation
                  </h2>

                  <p className="text-gray-700 mb-4">
                    Throughout the Roadmap, I'll proactively surface insights tailored to {businessName} — from licensing timelines 
                    to marketing ideas to investor outreach templates. I'll flag anything that seems off and offer solutions right away.
                  </p>

                  <div className="overflow-x-auto shadow-md rounded-lg">
                    <table className="min-w-full border-collapse bg-white rounded-lg overflow-hidden">
                      <thead className="bg-gradient-to-r from-indigo-100 to-purple-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-bold text-indigo-900 border-b-2 border-indigo-300">
                            Feature
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-bold text-indigo-900 border-b-2 border-indigo-300">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-bold text-indigo-900 border-b-2 border-indigo-300">
                            Example
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            Milestone Sequencing
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            Tasks grouped into stages (Legal Formation, Financial Setup, Product Development, Marketing, Launch & Scaling).
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 italic">
                            "Register C-Corp → Trademark → Marketing Assets."
                          </td>
                        </tr>
                        <tr className="bg-gray-50 hover:bg-blue-50 transition-colors border-b border-gray-100">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            Dynamic Dependencies
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            Angel knows what must be done first.
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 italic">
                            "You'll file for your trademark only after incorporation is verified."
                          </td>
                        </tr>
                        <tr className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            Interactive Commands
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            Help, Kickstart, and Who do I contact? appear dynamically.
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 italic">
                            "Need a lawyer? Type 'Who do I contact?'."
                          </td>
                        </tr>
                        <tr className="bg-gray-50 hover:bg-blue-50 transition-colors border-b border-gray-100">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            Progress Indicators
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            Circular trackers per stage + horizontal bar for overall completion.
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 italic">
                            "Stage 1: 20% done."
                          </td>
                        </tr>
                        <tr className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            Advice Panels
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            Context-specific tips pop up automatically.
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 italic">
                            "Here's how to file your C-Corp in California online."
                          </td>
                        </tr>
                        <tr className="bg-gray-50 hover:bg-blue-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            Motivational Elements
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            Badges, quotes, and accomplishment alerts keep momentum high.
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 italic">
                            "You're on track to launch in record time!"
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Scene 5: Validation Check */}
                {!validationComplete && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span>✅</span>
                      Validation Check
                    </h2>

                    <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
                      <p className="text-gray-800 mb-4 font-medium">
                        Before I generate your Roadmap, let's make sure everything looks solid. This ensures the steps I build 
                        match your real-world timeline and needs.
                      </p>

                      {/* Validation Checklist */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2 }}
                          className="bg-white p-3 rounded-lg border-2 border-green-400 flex items-center gap-2"
                        >
                          <span className="text-2xl">✅</span>
                          <span className="text-sm font-semibold text-gray-900">Business Type</span>
                        </motion.div>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3 }}
                          className="bg-white p-3 rounded-lg border-2 border-green-400 flex items-center gap-2"
                        >
                          <span className="text-2xl">✅</span>
                          <span className="text-sm font-semibold text-gray-900">Revenue Model</span>
                        </motion.div>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.4 }}
                          className="bg-white p-3 rounded-lg border-2 border-green-400 flex items-center gap-2"
                        >
                          <span className="text-2xl">✅</span>
                          <span className="text-sm font-semibold text-gray-900">Licensing</span>
                        </motion.div>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 }}
                          className="bg-white p-3 rounded-lg border-2 border-green-400 flex items-center gap-2"
                        >
                          <span className="text-2xl">✅</span>
                          <span className="text-sm font-semibold text-gray-900">Marketing Plan</span>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scene 6: Generation Animation */}
                {isGenerating && (
                  <div className="mb-8">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-xl">
                      <div className="text-center">
                        <motion.div
                          animate={{
                            rotate: 360,
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="inline-block text-6xl mb-4"
                        >
                          ⚙️
                        </motion.div>
                        <h3 className="text-2xl font-bold mb-2">Generating Your Personalized Roadmap</h3>
                        <p className="text-lg opacity-90">
                          Excellent — your plan checks out! I'm now building your personalized Launch Roadmap, sequencing every step 
                          and integrating resources to help you execute with confidence.
                        </p>

                        {/* Blueprint Animation */}
                        <div className="mt-6 relative h-4 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 3, ease: "easeInOut" }}
                            className="h-full bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full"
                          />
                        </div>

                        {/* Timeline nodes animation */}
                        <div className="mt-6 flex justify-around">
                          {['Legal', 'Financial', 'Product', 'Marketing', 'Launch', 'Scaling'].map((stage, idx) => (
                            <motion.div
                              key={stage}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.4 }}
                              className="text-center"
                            >
                              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-lg">
                                <span className="text-sm font-bold text-blue-600">{idx + 1}</span>
                              </div>
                              <p className="text-xs opacity-90">{stage}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full Business Plan Summary */}
                {!isGenerating && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Complete Business Plan Summary</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 max-h-96 overflow-y-auto">
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-gray-800 font-sans leading-relaxed">
                          {businessPlanSummary}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Scene 8: Action Buttons */}
              {!isGenerating && (
                <div className="border-t border-gray-200 bg-gray-50 p-6">
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      Ready to take your first step toward launch?
                    </h2>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleValidateAndProceed}
                      className="group relative bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl">🚀</span>
                        <span>Generate My Roadmap</span>
                      </div>
                      <div className="text-sm opacity-90 mt-1">Validate and proceed to roadmap generation</div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onReviewPlan}
                      className="group relative bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl">📘</span>
                        <span>Review My Plan</span>
                      </div>
                      <div className="text-sm opacity-90 mt-1">Make adjustments before proceeding</div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onGetAdvice}
                      className="group relative bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl">💬</span>
                        <span>Get Advice</span>
                      </div>
                      <div className="text-sm opacity-90 mt-1">Ask Angel before proceeding</div>
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EnhancedPlanToRoadmapTransition;

