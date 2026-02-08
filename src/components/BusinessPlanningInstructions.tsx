import React, { useEffect, useRef } from 'react';

interface Props {
  onClose: () => void;
}

const BusinessPlanningInstructions: React.FC<Props> = ({ onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Only close if the click was directly on the backdrop, not on the modal content
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={handleBackdropClick}>
      <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-teal-500 to-blue-500 p-6 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Business Planning Features</h2>
              <p className="text-sm opacity-90">How to use the quick actions.</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">💬</span>
              Support
            </h3>
            <p className="text-gray-700">
              Clicking 'Support' will ask Angel AI to provide more context, examples, or a more detailed explanation for the current question. Use this when you're unsure how to answer or need more guidance.
            </p>
          </div>

          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-5 border border-emerald-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">✍️</span>
              Draft
            </h3>
            <p className="text-gray-700">
              Clicking 'Draft' will have Angel AI generate a sample answer for you based on the information you've provided so far. You can then accept this answer, or modify it to better suit your needs.
            </p>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-5 border border-orange-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">🔧</span>
              Scrapping
            </h3>
            <p className="text-gray-700">
              'Scrapping' is for when you've written an answer, but you're not happy with it. Angel AI will take your text and "scrap" it, meaning it will polish the writing, fix grammar, and improve the overall quality of your response.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessPlanningInstructions;