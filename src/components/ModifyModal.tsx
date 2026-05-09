import React, { useState, useEffect, useRef } from 'react';

export interface ModifyModalSavePayload {
  userGuidance: string;
  assistantSnapshot: string;
}

interface ModifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  assistantSnapshot: string;
  onSave: (payload: ModifyModalSavePayload) => void;
  loading?: boolean;
}

const ModifyModal: React.FC<ModifyModalProps> = ({
  isOpen,
  onClose,
  assistantSnapshot,
  onSave,
  loading = false,
}) => {
  const [guidance, setGuidance] = useState('');
  const guidanceRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setGuidance('');
      setTimeout(() => {
        guidanceRef.current?.focus();
      }, 100);
    }
  }, [isOpen, assistantSnapshot]);

  const guidanceTrimmed = guidance.trim();
  const snapshotTrimmed = assistantSnapshot.trim();
  const wordCount = guidanceTrimmed
    ? guidanceTrimmed.split(/\s+/).filter((w) => w.length > 0).length
    : 0;

  const handleSave = () => {
    if (!guidanceTrimmed || !snapshotTrimmed || loading) return;
    onSave({
      userGuidance: guidanceTrimmed,
      assistantSnapshot: snapshotTrimmed,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Refine this response</h2>
              <p className="text-sm text-gray-600">
                Tell Angel what to change, ask a follow-up, or suggest a direction — the full message is kept as context below.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5 min-h-0">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Angel&apos;s message (reference)</h3>
            <div className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
              {snapshotTrimmed || '—'}
            </div>
          </div>

          <div className="flex flex-col flex-1 min-h-0">
            <label htmlFor="modify-guidance" className="block text-sm font-medium text-gray-700 mb-2">
              What should Angel do differently?
            </label>
            <textarea
              ref={guidanceRef}
              id="modify-guidance"
              value={guidance}
              onChange={(e) => setGuidance(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="w-full flex-1 min-h-[160px] p-4 border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder-gray-500 leading-relaxed"
              placeholder="Examples: “Shorter bullets”, “More formal tone”, “Add a risk section”, “Why did you assume X?”"
            />
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>{wordCount} words in your request</span>
              <span>Ctrl+Enter to send · Esc to close</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || !guidanceTrimmed || !snapshotTrimmed}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Applying…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Apply refinement
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModifyModal;
