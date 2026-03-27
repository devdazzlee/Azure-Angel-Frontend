import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-toastify';
import DocumentExportModal from '../../components/DocumentExportModal';
import PaymentForm from '../../components/PaymentForm';
import { PRICING, checkPaymentStatus, markAsPaid } from '../../config/pricing';
import { checkIsFreeIntroPeriod } from '../../utils/freeIntroPeriod';

interface LocationState {
  businessPlan?: string;
  businessPlanSummary?: string;
  sessionId?: string;
}

const BusinessPlanView: React.FC = () => {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState;
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Initialize with data from navigation state if available
  const [businessPlan, setBusinessPlan] = useState<string>(locationState?.businessPlan || '');
  const [businessPlanSummary, setBusinessPlanSummary] = useState<string>(locationState?.businessPlanSummary || '');
  const [loading, setLoading] = useState(!locationState?.businessPlan); // Only load if no data passed
  const [viewMode, setViewMode] = useState<'summary' | 'full'>('full');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [hasPaid, setHasPaid] = useState(false); // Track payment status
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [roadmapAvailable, setRoadmapAvailable] = useState(false);

  // Check subscription status from backend on mount
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      // 🆓 FREE INTRO PERIOD LOGIC
      if (checkIsFreeIntroPeriod()) {
        console.log('🎉 Free intro period active - granting premium access');
        setHasPaid(true);
        setCheckingSubscription(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/stripe/check-subscription-status`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('sb_access_token')}`,
            },
          }
        );

        const data = await response.json();
        if (data.success && data.has_active_subscription && !data.payment_failed) {
          setHasPaid(true);
          console.log('✅ User has active subscription - download access granted');
        } else {
          setHasPaid(false);
          if (data.payment_failed) {
            console.log('⚠️ Payment failed - premium features disabled');
            toast.warning('Payment failed. Please update your payment method to restore premium access.');
          } else {
            console.log('ℹ️ No active subscription found');
          }
        }
      } catch (error) {
        console.error('Failed to check subscription status:', error);
        setHasPaid(false);
      } finally {
        setCheckingSubscription(false);
      }
    };

    checkSubscriptionStatus();
  }, []);

  useEffect(() => {
    // Only fetch if data wasn't passed via navigation state
    if (!locationState?.businessPlan && !locationState?.businessPlanSummary) {
      fetchBusinessPlan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // ROOT CAUSE FIX: Poll for artifact if it's being generated
  useEffect(() => {
    if (!businessPlan && loading && sessionId) {
      console.log('📊 Polling for business plan artifact...');
      
      const pollInterval = setInterval(() => {
        fetchBusinessPlan();
      }, 3000); // Check every 3 seconds
      
      const timeout = setTimeout(() => {
        clearInterval(pollInterval);
        setLoading(false);
        toast.error('Business plan generation timed out. Please try again.');
        console.log('⏱️ Polling timeout reached');
      }, 90000); // 90 second timeout
      
      return () => {
        clearInterval(pollInterval);
        clearTimeout(timeout);
      };
    }
  }, [businessPlan, loading, sessionId]);

  const fetchBusinessPlan = async () => {
    if (!sessionId) {
      console.error('No session ID provided');
      toast.error('Invalid session ID');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching business plan for session:', sessionId);
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/angel/sessions/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('sb_access_token')}`,
          },
        }
      );

      const data = await response.json();
      
      if (data.success && data.result) {
        const session = data.result;
        console.log('Session data received:', {
          hasArtifact: !!session.business_plan_artifact,
          hasSummary: !!session.business_plan_summary,
          artifactLength: session.business_plan_artifact?.length || 0,
          summaryLength: session.business_plan_summary?.length || 0,
          hasRoadmap: !!session.roadmap_data
        });
        
        // Update state if we have data
        if (session.business_plan_artifact) {
          setBusinessPlan(session.business_plan_artifact);
          setLoading(false);
          console.log('✅ Business plan artifact loaded!');
        }
        if (session.business_plan_summary) {
          setBusinessPlanSummary(session.business_plan_summary);
          console.log('✅ Business plan summary loaded!');
        }
        
        // Check if roadmap is available
        if (session.roadmap_data) {
          setRoadmapAvailable(true);
          console.log('✅ Roadmap is available!');
        }
        
        // ROOT CAUSE FIX: If artifact is not ready, keep loading and poll
        if (!session.business_plan_artifact) {
          console.log('⏳ Business plan artifact not ready yet, will check again...');
          // Don't set loading to false - keep showing loading screen
          // Polling will continue in useEffect below
        }
      } else {
        toast.error(data.message || 'Failed to load business plan');
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch business plan:', error);
      toast.error('Failed to load business plan');
      setLoading(false);
    }
  };

  const handleDownload = () => {
    // Download is now free - no payment required
    // Payment is required only when generating the business plan, not for downloading
    setShowExportModal(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    
    // Show loading toast while checking subscription
    const loadingToast = toast.loading('Verifying your subscription...');
    
    // Poll for subscription status (webhooks can take a few seconds)
    let attempts = 0;
    const maxAttempts = 10; // Try for up to 20 seconds (10 attempts * 2 seconds)
    
    const checkSubscription = async (): Promise<boolean> => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/stripe/check-subscription-status`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('sb_access_token')}`,
            },
          }
        );

        if (!response.ok) {
          console.error('Subscription check failed:', response.status, response.statusText);
          return false;
        }

        const data = await response.json();
        console.log('Subscription check response:', data);
        
        if (data.success && data.has_active_subscription && !data.payment_failed) {
          setHasPaid(true);
          toast.dismiss(loadingToast);
          toast.success('Payment successful! You can now download your Business Plan.');
          setShowExportModal(true);
          return true;
        }
        
        if (data.payment_failed) {
          toast.dismiss(loadingToast);
          toast.error('Payment failed. Please update your payment method in your profile.');
          return false;
        }
        
        return false;
      } catch (error) {
        console.error('Failed to verify subscription after payment:', error);
        return false;
      }
    };
    
    // Try immediately first
    const immediateSuccess = await checkSubscription();
    if (immediateSuccess) return;
    
    // Poll every 2 seconds if not immediately successful
    const pollInterval = setInterval(async () => {
      attempts++;
      console.log(`Polling for subscription status (attempt ${attempts}/${maxAttempts})...`);
      
      const success = await checkSubscription();
      
      if (success) {
        clearInterval(pollInterval);
      } else if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        toast.dismiss(loadingToast);
        toast.warning('Payment is processing. Please refresh the page in a moment to verify your subscription.');
        console.warn('Subscription verification timeout after', maxAttempts, 'attempts');
      }
    }, 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <svg className="animate-spin h-16 w-16 text-teal-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-semibold text-gray-900 mb-2">Loading your business plan...</p>
          <p className="text-sm text-gray-600">
            Your comprehensive business plan is being generated. This typically takes 30-60 seconds.
          </p>
        </div>
      </div>
    );
  }

  const content = viewMode === 'full' ? businessPlan : businessPlanSummary;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 pt-4 sm:pt-6">
      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Document Header with Back Button and Actions */}
          <div className="bg-gradient-to-r from-teal-500 to-blue-500 p-8 text-white print:bg-white print:text-gray-900 print:border-b print:border-gray-300">
            {/* Back Button - Top Left */}
            <button
              onClick={() => navigate(-1)}
              className="mb-4 flex items-center gap-2 text-white/90 hover:text-white transition-colors print:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium">Back to Chat</span>
            </button>

            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">Business Plan</h1>
                <p className="text-lg opacity-90 print:opacity-100">
                  Generated on {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              {/* Action Buttons - In Header */}
              <div className="flex flex-col items-end gap-3 print:hidden flex-shrink-0">
                {/* View Toggle */}
                {businessPlan && businessPlanSummary && (
                  <div className="inline-flex bg-white/20 rounded-lg p-1 backdrop-blur-sm">
                    <button
                      onClick={() => setViewMode('summary')}
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${
                        viewMode === 'summary'
                          ? 'bg-white text-teal-600 shadow-md'
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      📋 Summary
                    </button>
                    <button
                      onClick={() => setViewMode('full')}
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${
                        viewMode === 'full'
                          ? 'bg-white text-teal-600 shadow-md'
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      📄 Full Plan
                    </button>
                  </div>
                )}

                {/* Download and Print Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-teal-600 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 whitespace-nowrap"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold border-2 border-white/50 transition-all duration-300 transform hover:scale-105 whitespace-nowrap"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="p-8 sm:p-12" ref={contentRef} id="document-content">
            {content ? (
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-3xl font-bold text-gray-900 mb-6 mt-8 pb-3 border-b-2 border-gray-200">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">
                        {children}
                      </h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="text-lg font-semibold text-gray-800 mb-2 mt-4">
                        {children}
                      </h4>
                    ),
                    p: ({ children }) => (
                      <p className="text-gray-700 leading-relaxed mb-4 text-justify">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc ml-8 space-y-2 text-gray-700 mb-4">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal ml-8 space-y-2 text-gray-700 mb-4">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="leading-relaxed">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="text-gray-900 font-bold">{children}</strong>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-6 shadow-md rounded-lg">
                        <table className="min-w-full border-collapse bg-white">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-gradient-to-r from-teal-600 to-blue-600 text-white">
                        {children}
                      </thead>
                    ),
                    tbody: ({ children }) => (
                      <tbody className="divide-y divide-gray-200 tbody-hover-rows">
                        {children}
                      </tbody>
                    ),
                    tr: ({ children }) => (
                      <tr>
                        {children}
                      </tr>
                    ),
                    th: ({ children }) => (
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {children}
                      </td>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-teal-500 pl-4 py-2 my-4 bg-teal-50 rounded-r-lg">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Business Plan Available
                </h3>
                <p className="text-gray-600 mb-6">
                  Complete the business planning phase to generate your business plan.
                </p>
                <button
                  onClick={() => navigate(`/venture/${sessionId}`)}
                  className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors"
                >
                  Return to Chat
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer - No Print */}
        <div className="mt-6 text-center text-sm text-gray-500 print:hidden">
          <p>This document was generated by Angel Business Assistant</p>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        /* Table hover - only tbody rows */
        .tbody-hover-rows > tr:hover {
          background-color: #f0fdfa !important;
          transition: background-color 150ms ease-in-out;
        }
        
        /* Print styles */
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .prose {
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Payment Modal - $20/month subscription for Roadmap and Implementation */}
      <PaymentForm
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
        amount={20} // $20/month subscription
        itemName="Founderport Premium Subscription"
      />

      {/* Export Modal */}
      <DocumentExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        documentTitle="Business Plan"
        documentContent={contentRef.current?.innerHTML || content}
        documentType="business-plan"
      />

      {/* Floating Continue to Roadmap Button - Right Side */}
      {roadmapAvailable && (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 print:hidden">
          <button
            onClick={async () => {
              if (!sessionId) return;
              
              // 🆓 FREE INTRO PERIOD LOGIC
              if (checkIsFreeIntroPeriod()) {
                navigate(`/ventures/${sessionId}`);
                return;
              }

              try {
                // Check subscription before allowing roadmap access
                const subscriptionCheck = await fetch(
                  `${import.meta.env.VITE_API_BASE_URL}/stripe/check-subscription-status`,
                  {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem('sb_access_token')}`,
                    },
                  }
                );

                const subscriptionData = await subscriptionCheck.json();
                
                if (!subscriptionData.success || !subscriptionData.has_active_subscription || subscriptionData.payment_failed) {
                  toast.error('Subscription required to access Roadmap phase. Please subscribe to continue.');
                  // Show payment modal
                  setShowPaymentModal(true);
                  return;
                }

                // Navigate to chat page which will show roadmap
                navigate(`/ventures/${sessionId}`);
              } catch (error) {
                console.error('Error navigating to roadmap:', error);
                toast.error('Failed to navigate to roadmap');
              }
            }}
            className="group bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 flex flex-col items-center gap-2 min-w-[140px] border-2 border-green-400"
            title="Continue to Roadmap"
          >
            <div className="text-2xl animate-pulse">🚀</div>
            <div className="text-sm font-bold text-center">Continue to</div>
            <div className="text-sm font-bold text-center">Roadmap</div>
            <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      )}
    </div>
  );
};

export default BusinessPlanView;

