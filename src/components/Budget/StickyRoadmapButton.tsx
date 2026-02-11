import React from 'react';
import { Button } from '@/components/ui/button';

interface StickyRoadmapButtonProps {
  handleGoToRoadmap: () => void;
}

const StickyRoadmapButton: React.FC<StickyRoadmapButtonProps> = ({ handleGoToRoadmap }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50">
      <div className="max-w-7xl mx-auto">
        <Button
          onClick={handleGoToRoadmap}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 font-medium rounded-lg transition-colors duration-200"
        >
          <div className="flex items-center justify-center gap-2">
            <span>Continue to Roadmap</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </Button>
      </div>
    </div>
  );
};

export default StickyRoadmapButton;
