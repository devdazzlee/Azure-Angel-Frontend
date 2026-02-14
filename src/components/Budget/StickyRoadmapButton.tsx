import React from 'react';
import { ArrowRight, Map } from 'lucide-react';

interface StickyRoadmapButtonProps {
  handleGoToRoadmap: () => void;
}

const StickyRoadmapButton: React.FC<StickyRoadmapButtonProps> = ({ handleGoToRoadmap }) => {
  return (
    <button
      onClick={handleGoToRoadmap}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white pl-4 pr-5 py-3 rounded-full shadow-[0_8px_30px_rgba(16,185,129,0.35)] hover:shadow-[0_8px_40px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer group animate-[fadeSlideUp_0.5s_ease-out_0.8s_both]"
      style={{
        animation: 'fadeSlideUp 0.5s ease-out 0.8s both',
      }}
    >
      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
        <Map className="w-4 h-4 text-white" />
      </div>
      <span className="font-semibold text-sm whitespace-nowrap tracking-wide">Continue to Roadmap</span>
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />

      {/* Inline keyframe for the entry animation */}
      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </button>
  );
};

export default StickyRoadmapButton;
