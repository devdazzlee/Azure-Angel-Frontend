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
      className="fixed bottom-6 left-6 z-50 md:bottom-8 md:left-8"
    >
      <div className="flex flex-col items-start gap-2">
        {/* Main Back Button with Glass Morphism */}
        <motion.button
          whileHover={{ scale: disabled ? 1 : 1.05, y: -2 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          onClick={onClick}
          disabled={disabled || loading}
          className={`
            group relative overflow-hidden
            flex items-center gap-2 px-3 py-2 md:gap-3 md:px-5 md:py-3
            bg-white/95 backdrop-blur-xl
            border-2 border-gray-200/50
            text-gray-800 font-semibold text-xs md:text-sm
            rounded-xl md:rounded-2xl shadow-lg md:shadow-2xl
            transition-all duration-300
            max-w-xs md:max-w-none
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
            <div className="absolute -left-0.5 -top-0.5 md:-left-1 md:-top-1 w-10 h-10 md:w-14 md:h-14">
              <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 56 56">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-gray-200"
                />
                <motion.circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="url(#gradient)"
                  strokeWidth="2"
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
                  className="relative w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full shadow-lg flex items-center justify-center"
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
                  {/* Background glow */}
                  <motion.div
                    className="absolute inset-0 bg-white/30 rounded-full blur-sm"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  
                  {/* Perfectly centered arrow */}
                  <div className="flex items-center justify-center w-full h-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 md:h-4 md:w-4 text-white drop-shadow-sm"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                  
                  {/* Animated highlight */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </motion.div>
                
                {/* Text content */}
                <div className="flex flex-col items-start">
                  <span className="text-xs md:text-sm font-bold text-gray-900 leading-tight">
                    Previous Question
                  </span>
                  {previousQuestionNumber && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center gap-1 md:gap-1.5 mt-0.5"
                    >
                      <span className="text-xs text-teal-600 font-semibold">
                        Q{previousQuestionNumber}
                      </span>
                      <span className="text-xs text-gray-400 hidden md:inline">of {totalQuestions}</span>
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
            className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100 rounded-full shadow-sm"
          >
            <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-teal-500 rounded-full animate-pulse" />
            <span className="text-[10px] md:text-[11px] font-medium text-gray-700">
              <span className="hidden md:inline">Currently: Question </span>
              <span className="md:hidden">Q</span>{currentQuestionNumber}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default BackButton;

