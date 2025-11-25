import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface BusinessPlanPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: () => void;
  businessPlanSummary: string;
  fullBusinessPlan?: string;
  price?: number;
  loading?: boolean;
}

const BusinessPlanPaywall: React.FC<BusinessPlanPaywallProps> = ({
  isOpen,
  onClose,
  onPurchase,
  businessPlanSummary,
  fullBusinessPlan,
  price = 99,
  loading = false
}) => {
  // Always show full plan if available, otherwise show summary
  const [viewingSummary, setViewingSummary] = useState(!fullBusinessPlan);

  // If fullBusinessPlan is available, show it immediately (no payment needed)
  useEffect(() => {
    if (fullBusinessPlan) {
      setViewingSummary(false);
    }
  }, [fullBusinessPlan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                📋 Your Business Plan
              </h2>
              <p className="text-gray-600 text-sm">
                View your comprehensive business plan document
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewingSummary ? (
            /* Summary View (Free) */
            <div>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <span className="text-blue-600 text-xl">ℹ️</span>
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      Business Plan Summary (Free Preview)
                    </p>
                    <p className="text-sm text-blue-800">
                      This is a <strong>high-level summary</strong> of your comprehensive Business Plan. 
                      {fullBusinessPlan ? (
                        <> Click below to view the complete <strong>Business Plan Artifact</strong> (the full, detailed document).</>
                      ) : (
                        <> The complete <strong>Business Plan Artifact</strong> will be available once generated.</>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 max-h-96 overflow-y-auto prose prose-sm max-w-none text-gray-800">
                <div className="whitespace-pre-wrap">{businessPlanSummary}</div>
              </div>

              {/* Show button to view full plan if available */}
              {fullBusinessPlan && (
                <div className="my-8 text-center">
                  <button
                    onClick={() => setViewingSummary(false)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    📄 View Complete Business Plan Artifact
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Full Plan View (After Purchase) */
            <div>
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✅</span>
                  <div>
                    <p className="text-sm font-semibold text-green-900 mb-1">
                      Full Business Plan Artifact
                    </p>
                    <p className="text-sm text-green-800">
                      You have full access to your complete Business Plan document. 
                      You can download, print, or share this document as needed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 max-h-[60vh] overflow-y-auto prose prose-sm max-w-none text-gray-800">
                {fullBusinessPlan ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-bold text-gray-900 mb-3 mt-5">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">{children}</h3>,
                      p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-3">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc ml-6 space-y-2 text-gray-700 mb-3">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal ml-6 space-y-2 text-gray-700 mb-3">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      strong: ({ children }) => <strong className="text-gray-900 font-semibold">{children}</strong>,
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-6 shadow-md rounded-lg">
                          <table className="min-w-full border-collapse bg-white">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                          {children}
                        </thead>
                      ),
                      tbody: ({ children }) => <tbody className="divide-y divide-gray-200">{children}</tbody>,
                      tr: ({ children }) => (
                        <tr className="hover:bg-gray-50 transition-colors duration-150 border-b border-gray-200">
                          {children}
                        </tr>
                      ),
                      th: ({ children }) => (
                        <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-6 py-4 text-sm text-gray-700 whitespace-normal">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {fullBusinessPlan}
                  </ReactMarkdown>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Loading full business plan...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Toggle and Close buttons */}
        {fullBusinessPlan && (
          <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  ✅ Full Business Plan Available
                </h3>
                <p className="text-sm text-gray-600">
                  Your complete Business Plan Artifact is ready to view
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setViewingSummary(!viewingSummary)}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  {viewingSummary ? '📄 View Full Plan' : '📋 View Summary'}
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Footer when no full plan available yet */}
        {!fullBusinessPlan && (
          <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Business Plan Summary
                </h3>
                <p className="text-sm text-gray-600">
                  Full Business Plan Artifact will be available once generated
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessPlanPaywall;

