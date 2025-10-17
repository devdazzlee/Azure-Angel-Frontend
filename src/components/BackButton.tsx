import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BackButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  currentQuestionNumber?: number | null;
  totalQuestions?: number;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  onClick, 
  disabled = false, 
  loading = false,
  currentQuestionNumber = null,
  totalQuestions = 0
}) => {
  const previousQuestionNumber = currentQuestionNumber ? currentQuestionNumber - 1 : null;
  const progressPercent = currentQuestionNumber && totalQuestions 
    ? ((currentQuestionNumber - 1) / totalQuestions) * 100 
    : 0;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 lg:left-6 lg:bottom-6 lg:translate-x-0"
    >
      <div className="flex flex-col items-center lg:items-start gap-2">
        {/* Main Back Button with Glass Morphism */}
        <motion.button
          whileHover={{ scale: disabled ? 1 : 1.05, y: -2 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          onClick={onClick}
          disabled={disabled || loading}
          className={`
            group relative overflow-hidden
            flex items-center gap-3 px-5 py-3
            bg-white/95 backdrop-blur-xl
            border-2 border-gray-200/50
            text-gray-800 font-semibold text-sm
            rounded-2xl shadow-2xl
            transition-all duration-300
            ${disabled || loading 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:shadow-teal-500/25 hover:border-teal-400/50 cursor-pointer'
            }
          `}
          title={previousQuestionNumber 
            ? `Go back to Question ${previousQuestionNumber}` 
            : "Go back to previous question"
          }
        >
          {/* Gradient overlay on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-teal-400/10 to-blue-400/10 opacity-0 group-hover:opacity-100"
            transition={{ duration: 0.3 }}
          />
          
          {/* Progress ring background */}
          {!loading && currentQuestionNumber && (
            <div className="absolute -left-1 -top-1 w-14 h-14">
              <svg className="transform -rotate-90" width="56" height="56">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  className="text-gray-200"
                />
                <motion.circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 150.8 }}
                  animate={{ strokeDashoffset: 150.8 - (150.8 * progressPercent / 100) }}
                  strokeDasharray="150.8"
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}
          
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-3 relative z-10"
              >
                <div className="w-6 h-6 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
                <span className="font-medium">Returning...</span>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-3 relative z-10"
              >
                {/* Animated arrow with gradient */}
                <motion.div
                  className="relative w-8 h-8 flex items-center justify-center bg-gradient-to-br from-teal-500 to-blue-500 rounded-full shadow-lg"
                  animate={{ 
                    x: [-4, 0, -4],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    times: [0, 0.5, 1]
                  }}
                >
                  {/* Gradient arrow with multiple layers */}
                  <div className="relative">
                    {/* Background glow */}
                    <motion.div
                      className="absolute inset-0 bg-white/30 rounded-full blur-sm"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    
                    {/* Main arrow */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-white drop-shadow-sm"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    
                    {/* Animated highlight */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
                    />
                  </div>
                </motion.div>
                
                {/* Text content */}
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold text-gray-900 leading-tight">
                    Previous Question
                  </span>
                  {previousQuestionNumber && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center gap-1.5 mt-0.5"
                    >
                      <span className="text-xs text-teal-600 font-semibold">
                        Question {previousQuestionNumber}
                      </span>
                      <span className="text-xs text-gray-400">of {totalQuestions}</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
        
        {/* Subtle hint badge */}
        {!loading && currentQuestionNumber && currentQuestionNumber > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100 rounded-full shadow-sm"
          >
            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
            <span className="text-[11px] font-medium text-gray-700">
              Currently: Question {currentQuestionNumber}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default BackButton;

