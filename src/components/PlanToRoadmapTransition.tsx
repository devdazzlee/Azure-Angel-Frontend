import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-toastify';
import BusinessPlanPaywall from './BusinessPlanPaywall';
import DocumentExportModal from './DocumentExportModal';
import PaymentForm from './PaymentForm';
import { PRICING } from '../config/pricing';
import { checkIsFreeIntroPeriod } from '../utils/freeIntroPeriod';
import { useAppDispatch, useAppSelector } from '../store';
import { upsertTransitionSession } from '../store/businessPlanTransitionSlice';
import httpClient from '../api/httpClient';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { responsiveMarkdownTableComponents } from './ResponsiveMarkdownTable';
import BusinessPlanModificationModal from './BusinessPlanModificationModal';

interface PlanToRoadmapTransitionProps {
  businessPlanSummary: string;
  businessPlanArtifact?: string | null;
  onApprove: () => void;
  onRevisit: (modificationAreas?: string[]) => void;
  /** Clears transition overlay state when already on `/ventures/:id` (same-URL navigate is a no-op). */
  onExitToChat?: () => void;
  loading?: boolean;
  sessionId?: string;
  nextStep?: 'budget' | 'roadmap'; // Indicates what the next step is
}


const normalizeBusinessPlanSummary = (summary: string): string => {
  if (!summary) return "";

  const lines = summary.split("\n");
  const normalized = lines.map((rawLine) => {
    const line = rawLine.trim();
    if (!line) return "";

    // Convert section headers with asterisks to proper markdown headers (bold)
    // Match patterns like "**1. Section Name**" or "**Section Name**"
    const headingMatch = line.match(/^\*\*(.+?)\*\*:?$/);
    if (headingMatch) {
      const heading = headingMatch[1].trim().replace(/:$/, "");
      if (/^\d+\./.test(heading)) {
        // Numbered section - use h3
        return `### ${heading}`;
      }
      // Regular section - use h2
      return `## ${heading}`;
    }
    
    // Also handle headers that might have asterisks in the middle: "**1. Business Overview**"
    const numberedHeadingMatch = line.match(/^\*\*(\d+\.\s*.+?)\*\*:?$/);
    if (numberedHeadingMatch) {
      const heading = numberedHeadingMatch[1].trim().replace(/:$/, "");
      return `### ${heading}`;
    }

    // Preserve bold markdown in regular text (not headers)
    return line.replace(/\*\*(.+?)\*\*/g, (_match, content) => `**${content.trim()}**`);
  });

  return normalized.join("\n");
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const convertSummaryToDocHtml = (markdown: string) => {
  const lines = markdown.split('\n');
  const htmlLines: string[] = [];
  let inList = false;
  
  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    
    if (!line) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      htmlLines.push('<br />');
      return;
    }
    
    // Handle headers
    if (line.startsWith('###')) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      const content = line.replace(/^###\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      htmlLines.push(`<h3 style="color: #111827; font-size: 18px; font-weight: 600; margin-top: 20px; margin-bottom: 10px;">${content}</h3>`);
      return;
    }
    
    if (line.startsWith('##')) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      const content = line.replace(/^##\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      htmlLines.push(`<h2 style="color: #111827; font-size: 22px; font-weight: 600; margin-top: 24px; margin-bottom: 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">${content}</h2>`);
      return;
    }
    
    if (line.startsWith('#')) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      const content = line.replace(/^#\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      htmlLines.push(`<h1 style="color: #111827; font-size: 28px; font-weight: 700; margin-top: 30px; margin-bottom: 15px;">${content}</h1>`);
      return;
    }
    
    // Handle lists
    if (line.startsWith('- ') || line.startsWith('• ')) {
      if (!inList) {
        htmlLines.push('<ul style="margin: 10px 0; padding-left: 30px;">');
        inList = true;
      }
      const content = line.replace(/^[-•]\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      htmlLines.push(`<li style="margin: 5px 0; line-height: 1.6;">${content}</li>`);
      return;
    }
    
    // Handle numbered lists
    if (/^\d+\.\s/.test(line)) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      const content = line.replace(/^\d+\.\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      htmlLines.push(`<p style="margin: 8px 0; line-height: 1.7; padding-left: 20px;"><strong style="color: #111827;">${line.match(/^\d+\./)?.[0]}</strong> ${content}</p>`);
      return;
    }
    
    // Regular paragraphs
    if (inList) {
      htmlLines.push('</ul>');
      inList = false;
    }
    
    const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #111827; font-weight: 600;">$1</strong>');
    htmlLines.push(`<p style="margin: 10px 0; line-height: 1.7; text-align: justify;">${formatted}</p>`);
  });
  
  if (inList) {
    htmlLines.push('</ul>');
  }

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="utf-8" />
    <meta name="ProgId" content="Word.Document" />
    <meta name="Generator" content="Microsoft Word" />
    <meta name="Originator" content="Microsoft Word" />
    <xml>
      <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
      </w:WordDocument>
    </xml>
    <style>
      @page {
        size: 8.5in 11in;
        margin: 1in 1in 1in 1in;
      }
      body {
        font-family: "Calibri", "Arial", sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #1f2937;
        max-width: 7.5in;
        margin: 0 auto;
      }
      h1 {
        color: #111827;
        font-size: 20pt;
        font-weight: 700;
        margin-top: 24pt;
        margin-bottom: 12pt;
        page-break-after: avoid;
      }
      h2 {
        color: #111827;
        font-size: 16pt;
        font-weight: 600;
        margin-top: 18pt;
        margin-bottom: 10pt;
        border-bottom: 1.5pt solid #e5e7eb;
        padding-bottom: 6pt;
        page-break-after: avoid;
      }
      h3 {
        color: #111827;
        font-size: 14pt;
        font-weight: 600;
        margin-top: 14pt;
        margin-bottom: 8pt;
        page-break-after: avoid;
      }
      p {
        margin: 8pt 0;
        line-height: 1.7;
        text-align: justify;
      }
      ul {
        margin: 10pt 0;
        padding-left: 30pt;
      }
      li {
        margin: 4pt 0;
        line-height: 1.6;
      }
      strong {
        color: #111827;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    ${htmlLines.join('\n')}
  </body>
</html>`;
};

const PlanToRoadmapTransition: React.FC<PlanToRoadmapTransitionProps> = ({
  businessPlanSummary,
  businessPlanArtifact: initialArtifact,
  onApprove,
  onRevisit,
  onExitToChat: _onExitToChat,
  loading = false,
  sessionId,
  nextStep = 'roadmap' // Default to roadmap for backward compatibility
}) => {
  const navigate = useNavigate(); // Initialize navigate hook
  const dispatch = useAppDispatch();
  const normalizedSessionId = sessionId ?? 'anonymous';
  const cachedTransition = useAppSelector(
    (state) => state.businessPlanTransition.bySessionId[normalizedSessionId]
  );
  const contentRef = useRef<HTMLDivElement>(null);
  const decisionSectionRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showModificationModal, setShowModificationModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [hasPaid, setHasPaid] = useState(false); // Track payment status
  const [businessPlanArtifact, setBusinessPlanArtifact] = useState<string | null>(
    cachedTransition?.artifact ?? initialArtifact ?? null
  );
  const [isGeneratingArtifact, setIsGeneratingArtifact] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const exportFileName = useMemo(() => {
    const timestamp = new Date().toISOString().split('T')[0];
    return `business-plan-summary-${timestamp}.doc`;
  }, []);

  const [actualSummary, setActualSummary] = useState<string>(
    cachedTransition?.summary ?? businessPlanSummary
  );
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Tracks WHICH action put the parent into a loading state so the full-screen
  // overlay can render the right message. Without this, clicking "Edit Plan"
  // (a backward navigation) used to flash the "Setting Up Your Budget" overlay
  // because the overlay copy was hardcoded to the forward path. Reset to null
  // whenever the parent's `loading` prop flips back to false.
  const [pendingAction, setPendingAction] = useState<'forward' | 'revisit' | null>(null);
  useEffect(() => {
    if (!loading) setPendingAction(null);
  }, [loading]);

  // Show floating control when the action buttons are below the viewport.
  useEffect(() => {
    const target = decisionSectionRef.current;
    if (!target || loading) {
      setShowScrollToBottom(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setShowScrollToBottom(!entry.isIntersecting),
      { threshold: 0.15, rootMargin: '0px 0px -48px 0px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [loading, actualSummary, isLoadingSummary, businessPlanArtifact]);

  const scrollToSummaryActions = () => {
    decisionSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const continueButtonTooltip = useMemo(() => {
    if (nextStep === 'budget') {
      return 'Confirm your business plan summary is accurate, then continue to the budget workspace to plan costs, revenue, and cash flow.';
    }
    if (!hasPaid) {
      return 'Confirm your summary and continue to generate your personalized launch roadmap. A subscription may be required.';
    }
    return 'Confirm your business plan summary is accurate, then generate your step-by-step launch roadmap.';
  }, [nextStep, hasPaid]);

  const modifyButtonTooltip =
    'Return to the business plan questionnaire to update specific answers or sections before you continue to the next phase.';

  const hasFetchedSummary = useRef(false); // Track if we've already attempted to fetch

  useEffect(() => {
    if (cachedTransition?.summary && cachedTransition.summary.trim()) {
      setActualSummary(cachedTransition.summary);
      hasFetchedSummary.current = true;
    }
    if (cachedTransition?.artifact !== undefined) {
      setBusinessPlanArtifact(cachedTransition.artifact ?? null);
    }
  }, [cachedTransition]);

  // Fetch actual summary when we don't have one yet (only once)
  useEffect(() => {
    if (cachedTransition?.summary && cachedTransition.summary.trim()) {
      setActualSummary(cachedTransition.summary);
      hasFetchedSummary.current = true;
      return;
    }
    
    // If we have a valid summary, use it immediately
    if (businessPlanSummary && businessPlanSummary.trim() !== "") {
      setActualSummary(businessPlanSummary);
      dispatch(upsertTransitionSession({
        sessionId: normalizedSessionId,
        summary: businessPlanSummary,
      }));
      hasFetchedSummary.current = true; // Mark as handled
      return;
    }
    
    // If summary is empty, fetch from API (only once)
    if ((!businessPlanSummary || businessPlanSummary.trim() === "") && sessionId && !hasFetchedSummary.current) {
      hasFetchedSummary.current = true; // Mark as fetching to prevent multiple calls
      setIsLoadingSummary(true);
      
      const fetchSummary = async () => {
        try {
          const { data } = await httpClient.get<any>(
            `/angel/sessions/${sessionId}/business-plan-summary`
          );
          if (data.success && data.result) {
            const summary =
              typeof data.result === 'string'
                ? data.result
                : data.result.summary || data.result.full_summary || '';

            if (summary && summary.trim()) {
              console.log('✅ Fetched actual business plan summary from backend');
              setActualSummary(summary);
              dispatch(
                upsertTransitionSession({
                  sessionId: normalizedSessionId,
                  summary,
                })
              );
            } else {
              setActualSummary(businessPlanSummary || '');
            }
          } else {
            setActualSummary(businessPlanSummary || '');
          }
        } catch (error) {
          console.error('Failed to fetch business plan summary:', error);
          // On error, use original
          setActualSummary(businessPlanSummary || "");
        } finally {
          setIsLoadingSummary(false);
        }
      };

      fetchSummary();
    }
  }, [businessPlanSummary, sessionId, cachedTransition?.summary, dispatch, normalizedSessionId]); // Removed isLoadingSummary from dependencies

  const normalizedSummary = useMemo(
    () => normalizeBusinessPlanSummary(actualSummary),
    [actualSummary]
  );

  // Check subscription status from backend on mount and show payment modal if needed
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      // 🆓 FREE INTRO PERIOD LOGIC (Valid until August 30, 2026)
      // If we are within the free intro period, bypass the Stripe subscription entirely!
      if (checkIsFreeIntroPeriod()) {
        console.log('🎉 Free intro period active - granting premium access automatically');
        setHasPaid(true);
        return;
      }

      try {
        const { data } = await httpClient.get<any>('/stripe/check-subscription-status');
        if (data.success && data.has_active_subscription && !data.payment_failed) {
          setHasPaid(true);
          console.log('✅ User has active subscription - download access granted');
        } else {
          setHasPaid(false);
          if (data.payment_failed) {
            console.log('⚠️ Payment failed - premium features disabled');
            toast.warning('Payment failed. Please update your payment method to restore premium access.');
          } else {
            console.log('ℹ️ No active subscription found - showing payment modal');
            // Show payment modal after transition is served
            setShowPaymentModal(true);
          }
        }
      } catch (error) {
        console.error('Failed to check subscription status:', error);
        setHasPaid(false);
        // Show payment modal on error as well
        setShowPaymentModal(true);
      }
    };

    checkSubscriptionStatus();
  }, []);

  // ✅ PROPER ARCHITECTURE: Generate artifact on-demand when user clicks button
  // No polling, no race conditions - just reliable synchronous generation
  // ⚠️ PAYMENT REQUIRED: Check subscription before generating
  const handleGenerateArtifact = async () => {
    if (!sessionId || isGeneratingArtifact || businessPlanArtifact) {
      return; // Already generating or already have artifact
    }

    // Check if user has active subscription - payment required to generate
    if (!hasPaid) {
      console.log('⚠️ Payment required - showing payment modal');
      setShowPaymentModal(true);
      return;
    }

    // User has paid - proceed with generation
    await generateArtifactAfterPayment();
  };

  // Generate artifact after payment verification
  const generateArtifactAfterPayment = async () => {
    if (!sessionId || isGeneratingArtifact) {
      return;
    }

    setIsGeneratingArtifact(true);
    console.log('📄 Generating business plan artifact on-demand...');

    try {
      const { data } = await httpClient.post<any>(
        `/angel/sessions/${sessionId}/generate-business-plan-artifact`
      );

      if (data.success && data.result?.business_plan_artifact) {
        console.log('✅ Business plan artifact generated successfully!');
        console.log(`📄 Artifact length: ${data.result.business_plan_artifact.length} characters`);
        setBusinessPlanArtifact(data.result.business_plan_artifact);
        dispatch(upsertTransitionSession({
          sessionId: normalizedSessionId,
          artifact: data.result.business_plan_artifact,
          summary: actualSummary || businessPlanSummary,
        }));

        toast.success('✅ Full Business Plan generated successfully!', {
          position: 'top-center',
          autoClose: 3000,
        });

        // Navigate to view the plan
        navigate(`/ventures/${sessionId}/business-plan`, {
          state: {
            businessPlan: data.result.business_plan_artifact,
            businessPlanSummary: actualSummary || businessPlanSummary,
            sessionId: sessionId,
            postSummaryFlow: nextStep === 'budget',
          },
        });
      } else {
        throw new Error(data.message || 'Failed to generate business plan');
      }
    } catch (error) {
      console.error('Failed to generate artifact:', error);
      toast.error('Failed to generate business plan. Please try again.', {
        position: 'top-center',
        autoClose: 5000,
      });
    } finally {
      setIsGeneratingArtifact(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleExportPlan = () => {
    // Check if user has already paid for this document
    if (hasPaid) {
      setShowExportModal(true);
    } else {
      // Show payment modal first
      setShowPaymentModal(true);
    }
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
        const { data } = await httpClient.get<any>('/stripe/check-subscription-status');
        console.log('Subscription check response:', data);
        
        if (data.success && data.has_active_subscription && !data.payment_failed) {
          setHasPaid(true);
          toast.dismiss(loadingToast);
          toast.success('✅ Subscription activated! You can now proceed to Roadmap phase.');
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

  const handleRevisitClick = () => {
    setShowModificationModal(true);
  };

  const handleConfirmModifications = (areaIds: string[]) => {
    setShowModificationModal(false);
    onRevisit(areaIds);
  };

  return (
    <>
      {/* Full-Screen Loading Overlay — copy depends on which action triggered
          the loading state. Revisit (Edit Plan) is a BACKWARD navigation and
          must never show "Setting Up Your Budget" / "Generating Your Roadmap"
          which imply forward progress. */}
      {loading && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-md flex items-center justify-center z-[9999]">
          <div className="text-center">
            <svg
              className={`animate-spin h-20 w-20 mx-auto mb-6 ${
                pendingAction === 'revisit' ? 'text-teal-500' : 'text-green-500'
              }`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">
              {pendingAction === 'revisit'
                ? '📝 Returning to Chat'
                : nextStep === 'budget'
                ? '💰 Setting Up Your Budget'
                : '🚀 Generating Your Roadmap'}
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              {pendingAction === 'revisit'
                ? 'Reopening your business plan so you can edit your answers…'
                : nextStep === 'budget'
                ? 'Preparing your budget setup...'
                : 'Creating your personalized launch roadmap...'}
            </p>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div
                className={`w-3 h-3 rounded-full animate-bounce ${
                  pendingAction === 'revisit' ? 'bg-teal-500' : 'bg-green-500'
                }`}
                style={{ animationDelay: '0ms' }}
              ></div>
              <div
                className={`w-3 h-3 rounded-full animate-bounce ${
                  pendingAction === 'revisit' ? 'bg-teal-500' : 'bg-green-500'
                }`}
                style={{ animationDelay: '150ms' }}
              ></div>
              <div
                className={`w-3 h-3 rounded-full animate-bounce ${
                  pendingAction === 'revisit' ? 'bg-teal-500' : 'bg-green-500'
                }`}
                style={{ animationDelay: '300ms' }}
              ></div>
            </div>
            <p className="text-base text-gray-500">
              {pendingAction === 'revisit' ? 'Just a moment…' : 'This may take 10-30 seconds...'}
            </p>
          </div>
        </div>
      )}
      
      <AnimatePresence>
        {!loading && showScrollToBottom && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 z-[100] sm:bottom-8 sm:right-8"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={scrollToSummaryActions}
                  aria-label="Scroll to continue and action buttons"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-white shadow-[0_4px_14px_rgba(15,23,42,0.35)] transition-colors hover:bg-slate-700 active:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.25}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" sideOffset={10} className="max-w-[220px] text-sm">
                Jump to Continue and Modify actions at the bottom
              </TooltipContent>
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center px-3 py-6 sm:px-4 sm:py-10 md:py-14">
        <div className="w-full max-w-4xl bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8">
        <header className="relative mb-6 sm:mb-10 pt-2 pb-5 sm:pb-6 border-b border-slate-200/70 overflow-hidden">
          {/* Ambient decorative orbs — softly float behind the title.
              `pointer-events-none` so they never block clicks. */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 left-1/4 h-40 w-40 rounded-full bg-teal-300/30 blur-3xl"
            animate={{
              x: [0, 20, -10, 0],
              y: [0, -15, 10, 0],
              scale: [1, 1.1, 0.95, 1],
            }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -top-8 right-1/4 h-32 w-32 rounded-full bg-blue-300/30 blur-3xl"
            animate={{
              x: [0, -25, 15, 0],
              y: [0, 12, -10, 0],
              scale: [1, 0.9, 1.15, 1],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Back button — slides in from the left, lifts on hover. */}
          <motion.button
            type="button"
            disabled={loading || isGeneratingArtifact}
            onClick={() => {
              setPendingAction('revisit');
              onRevisit();
            }}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.96 }}
            className="relative z-10 mb-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 backdrop-blur px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-white hover:border-teal-300 hover:text-teal-700 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:absolute sm:left-0 sm:top-1/2 sm:mb-0 sm:w-auto sm:-translate-y-1/2 sm:justify-start"
            title="Go back to the chat and edit your answers"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Edit Plan</span>
          </motion.button>

          {/* Title block — staggered fade-up with a shimmering eyebrow pill. */}
          <motion.div
            className="relative text-center sm:px-24"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
            }}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: -6 },
                show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
              }}
              className="relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-50 via-emerald-50 to-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 ring-1 ring-teal-200/70 mb-3 overflow-hidden"
            >
              {/* Shine sweep across the pill, perpetual. */}
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
              />
              <motion.span
                aria-hidden="true"
                animate={{ rotate: [0, 14, -10, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                ✦
              </motion.span>
              <span className="relative">Summary</span>
            </motion.div>

            <motion.h1
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
              }}
              className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-teal-700 to-blue-700 bg-clip-text text-transparent bg-[length:200%_100%]"
              style={{ backgroundPosition: '0% 50%' }}
            >
              <motion.span
                className="inline-block bg-gradient-to-r from-slate-900 via-teal-700 to-blue-700 bg-clip-text text-transparent bg-[length:200%_100%]"
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              >
                Business Plan Summary
              </motion.span>
            </motion.h1>

            <motion.p
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
              }}
              className="mx-auto mt-3 max-w-xl text-sm md:text-base leading-relaxed text-slate-500"
            >
              Review your summary below, then continue or generate your full plan.
            </motion.p>
          </motion.div>
        </header>

        {/* Info Banner - How to Generate Full Plan */}
        {!businessPlanArtifact && !isGeneratingArtifact && (
          <div className="mb-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">📄 Full Business Plan Available</h3>
                <p className="text-sm text-blue-800">
                  This is a high-level summary. Click the <strong>"Generate Full Business Plan"</strong> button above to create your complete, detailed business plan document. <strong>Payment is required</strong> to generate the full business plan (typically takes 30-60 seconds).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Business Plan Summary Overview */}
        <div className="mb-6 sm:mb-8" ref={contentRef} id="business-plan-summary-content">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl md:text-2xl">
              Business Plan Summary Overview
            </h2>
            <button
              type="button"
              disabled={isGeneratingArtifact}
              onClick={() => {
                if (businessPlanArtifact) {
                  navigate(`/ventures/${sessionId}/business-plan`, {
                    state: {
                      businessPlan: businessPlanArtifact,
                      businessPlanSummary: actualSummary || businessPlanSummary,
                      sessionId: sessionId,
                      postSummaryFlow: nextStep === 'budget',
                    },
                  });
                } else {
                  handleGenerateArtifact();
                }
              }}
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 sm:w-auto sm:px-5 sm:text-base"
              title={businessPlanArtifact ? 'View your complete business plan' : 'Click to generate your full business plan'}
            >
              {isGeneratingArtifact ? (
                <>
                  <svg className="h-5 w-5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Generating… (30–60s)</span>
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{businessPlanArtifact ? 'View Full Business Plan' : 'Generate Full Business Plan'}</span>
                </>
              )}
            </button>
          </div>
          
          {/* Full Viewable Business Plan Summary - No Height Restriction */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden relative">
            {/* Loading indicator - positioned at top, visible immediately */}
            {isLoadingSummary && (
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 py-8 flex items-center justify-center">
                <div className="text-center">
                  <svg className="animate-spin h-8 w-8 text-teal-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-gray-600 font-medium">Loading your business plan summary...</p>
                </div>
              </div>
            )}
            <div className="p-4 prose prose-sm max-w-none break-words sm:p-6 sm:prose-base md:p-8 md:prose-lg">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="mb-4 border-b-2 border-teal-500 pb-3 text-2xl font-bold text-gray-900 sm:mb-6 sm:pb-4 sm:text-3xl">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mb-3 mt-6 flex items-center gap-2 text-xl font-bold text-gray-900 sm:mb-4 sm:mt-8 sm:text-2xl">
                      <span className="w-2 h-8 bg-gradient-to-b from-teal-500 to-blue-500 rounded-full"></span>
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-lg font-semibold text-gray-700 mb-2 mt-4">
                      {children}
                    </h4>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 text-left text-gray-700 leading-relaxed sm:text-justify">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="space-y-3 mb-6">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="space-y-3 mb-6">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
                      <span className="text-teal-500 font-bold mt-1">•</span>
                      <span className="flex-1">{children}</span>
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-gray-900 font-bold">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="text-teal-700 font-medium not-italic">{children}</em>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-teal-500 bg-teal-50 pl-6 pr-4 py-4 my-6 rounded-r-lg">
                      <div className="text-gray-800 italic">{children}</div>
                    </blockquote>
                  ),
                  ...responsiveMarkdownTableComponents,
                  hr: () => (
                    <hr className="my-8 border-t-2 border-gray-200" />
                  ),
                  code: ({ children }) => (
                    <code className="bg-gray-100 text-teal-700 px-2 py-1 rounded text-sm font-mono">
                      {children}
                    </code>
                  ),
                }}
              >
                {normalizedSummary && normalizedSummary.trim() ? normalizedSummary : "Business plan summary is being generated. Please wait a moment and refresh the page."}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* What's Next Section - Moved before Roadmap Structure */}
        {nextStep === 'roadmap' && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            🚀 What's Next: Roadmap Generation
          </h2>
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-xl p-6">
            <p className="text-gray-700 mb-4">
              Based on your detailed business plan, I will now generate a comprehensive, actionable launch roadmap that translates your plan into explicit, chronological tasks. This roadmap will include:
            </p>
            
            {/* Five Phases Overview */}
            <div className="bg-white/70 rounded-lg p-4 mb-4 border border-teal-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 font-bold">1.</span>
                  <span className="text-gray-800"><strong>Legal Formation</strong> - Business structure, licensing, permits</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">2.</span>
                  <span className="text-gray-800"><strong>Financial Planning</strong> - Funding strategies, budgeting, accounting setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-600 font-bold">3.</span>
                  <span className="text-gray-800"><strong>Product & Operations</strong> - Supply chain, equipment, operational processes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-orange-600 font-bold">4.</span>
                  <span className="text-gray-800"><strong>Marketing & Sales</strong> - Brand positioning, customer acquisition, sales processes</span>
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <span className="text-teal-600 font-bold">5.</span>
                  <span className="text-gray-800"><strong>Full Launch & Scaling</strong> - Go-to-market strategy, growth planning</span>
                </div>
              </div>
            </div>
            
            {/* Research Sources Highlight */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-lg p-4 mb-4">
              <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                <span className="text-xl">🔬</span>
                Research-Backed Recommendations
              </h4>
              <p className="text-sm text-indigo-800 mb-3">
                The roadmap will be tailored specifically to your business, industry, and location, with research drawn from:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white/70 rounded-lg p-3 border border-indigo-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-indigo-600">🏛️</span>
                    <h5 className="font-semibold text-gray-900 text-sm">Government Sources</h5>
                  </div>
                  <p className="text-xs text-gray-600">SBA, IRS, SEC, state agencies, regulatory bodies</p>
                </div>
                <div className="bg-white/70 rounded-lg p-3 border border-indigo-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-indigo-600">🎓</span>
                    <h5 className="font-semibold text-gray-900 text-sm">Academic Research</h5>
                  </div>
                  <p className="text-xs text-gray-600">Universities, Google Scholar, JSTOR, research institutions</p>
                </div>
                <div className="bg-white/70 rounded-lg p-3 border border-indigo-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-indigo-600">📰</span>
                    <h5 className="font-semibold text-gray-900 text-sm">Industry Reports</h5>
                  </div>
                  <p className="text-xs text-gray-600">Bloomberg, WSJ, Forbes, Harvard Business Review</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">📋 Your Roadmap Will Include:</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• <strong>Actionable Steps:</strong> Specific tasks with clear timelines in table format</li>
                <li>• <strong>Research Citations:</strong> Source references for each step (Government, Academic, Industry)</li>
                <li>• <strong>Decision Points:</strong> Multiple options presented for informed choices</li>
                <li>• <strong>Service Providers:</strong> Local and credible providers for each task</li>
                <li>• <strong>Progress Tracking:</strong> Clear milestones and completion indicators</li>
              </ul>
            </div>
          </div>
        </div>
        )}

        {/* Budget Setup Info - Show when nextStep is 'budget' */}
        {nextStep === 'budget' && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            💰 What's Next: Budget Setup
          </h2>
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-xl p-6">
            <p className="text-gray-700 mb-4">
              Before we create your roadmap, let's set up your budget. Based on your business plan, I'll help you:
            </p>
            <ul className="text-gray-700 space-y-2 mb-4">
              <li>• <strong>Set your initial investment</strong> - How much capital you're starting with</li>
              <li>• <strong>Estimate expenses</strong> - AI-generated expense estimates based on your business plan</li>
              <li>• <strong>Plan revenues</strong> - Forecast your income streams</li>
              <li>• <strong>Visualize your budget</strong> - See everything in charts and graphs</li>
            </ul>
            <p className="text-gray-700">
              Once your budget is set, we'll proceed to create your comprehensive roadmap that incorporates your financial plan.
            </p>
          </div>
        </div>
        )}

        {/* Roadmap Structure Section */}
        {nextStep === 'roadmap' && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            🎯 Roadmap Structure
          </h2>
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
            <p className="text-gray-700 mb-6">
              Each phase of your roadmap is strategically sequenced to build a strong foundation for your business. Here's why this order is crucial for your success:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Legal Formation First</h3>
                    <p className="text-sm text-gray-600 mb-2">Business structure, licensing, permits</p>
                    <p className="text-xs text-gray-500">
                      <strong>Why first?</strong> Establishes your business foundation and protects your interests before any operations begin. 
                      This legal structure determines your tax obligations, liability protection, and business capabilities.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Financial Planning Second</h3>
                    <p className="text-sm text-gray-600 mb-2">Funding strategies, budgeting, accounting setup</p>
                    <p className="text-xs text-gray-500">
                      <strong>Why second?</strong> Sets up your financial systems and funding strategies to support all subsequent operations. 
                      Without proper financial foundation, you can't effectively manage cash flow or secure necessary resources.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Product & Operations Third</h3>
                    <p className="text-sm text-gray-600 mb-2">Supply chain, equipment, operational processes</p>
                    <p className="text-xs text-gray-500">
                      <strong>Why third?</strong> Builds your operational infrastructure once legal and financial foundations are secure. 
                      This ensures you can deliver your product or service efficiently and sustainably.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Marketing & Sales Fourth</h3>
                    <p className="text-sm text-gray-600 mb-2">Brand positioning, customer acquisition, sales processes</p>
                    <p className="text-xs text-gray-500">
                      <strong>Why fourth?</strong> Promotes your business once all systems are in place and ready to handle customer demand. 
                      This prevents overwhelming your unprepared operations with too much demand too soon.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    5
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Full Launch & Scaling Last</h3>
                    <p className="text-sm text-gray-600 mb-2">Go-to-market strategy, growth planning</p>
                    <p className="text-xs text-gray-500">
                      <strong>Why last?</strong> Executes your complete business strategy when all foundational elements are ready. 
                      This systematic approach maximizes your chances of sustainable success and growth.
                    </p>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600 text-sm">💡</span>
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-800">Strategic Sequencing</h4>
                      <p className="text-xs text-yellow-700">
                        Each phase builds upon the previous one, creating a strong foundation that supports sustainable growth. 
                        Skipping or rushing phases can lead to costly mistakes and operational challenges.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Decision Buttons */}
        <div
          ref={decisionSectionRef}
          id="summary-actions"
          className="mx-auto max-w-2xl scroll-mt-24 text-center"
        >
          <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
            Ready to move forward?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">
            Review your summary above. When you&apos;re satisfied, continue — or go back to refine
            anything that needs a change.
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-stretch sm:justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    if (nextStep === 'roadmap' && !hasPaid) {
                      setShowPaymentModal(true);
                      toast.info('Subscription required to proceed to Roadmap phase');
                      return;
                    }
                    setPendingAction('forward');
                    onApprove();
                  }}
                  disabled={loading || (nextStep === 'roadmap' && !hasPaid)}
                  className="inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[240px] sm:flex-1"
                >
                  {loading ? (
                    <>
                      <svg
                        className="h-5 w-5 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>
                        {nextStep === 'budget' ? 'Setting up budget…' : 'Generating roadmap…'}
                      </span>
                    </>
                  ) : (
                    <span>
                      {nextStep === 'budget' ? 'Continue to budget' : 'Continue to roadmap'}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8} className="max-w-[280px] text-sm leading-snug">
                {continueButtonTooltip}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleRevisitClick}
                  disabled={loading}
                  className="inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl border-2 border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-800 shadow-sm transition-colors hover:border-gray-400 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[240px] sm:flex-1"
                >
                  {loading ? (
                    <>
                      <svg
                        className="h-5 w-5 animate-spin text-gray-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Preparing…</span>
                    </>
                  ) : (
                    <span>Modify plan</span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8} className="max-w-[280px] text-sm leading-snug">
                {modifyButtonTooltip}
              </TooltipContent>
            </Tooltip>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            {loading
              ? nextStep === 'budget'
                ? 'Preparing your budget workspace.'
                : 'This may take 10–30 seconds.'
              : nextStep === 'budget'
                ? 'Next: set up your budget from this plan.'
                : 'Next: generate your launch roadmap.'}
          </p>
        </div>
      </div>

      {/* Business Plan Paywall Modal */}
      <BusinessPlanPaywall
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onPurchase={async () => {
          // No payment needed - artifact is free to view
          if (businessPlanArtifact) {
            toast.success('Full Business Plan Artifact is available!');
          } else {
            toast.info('Business Plan Artifact is being generated...');
          }
        }}
        businessPlanSummary={normalizedSummary}
        fullBusinessPlan={businessPlanArtifact || undefined}
        price={0}
        loading={false}
      />
      
      {/* Debug: Log artifact availability */}
      {businessPlanArtifact && (
        <div style={{ display: 'none' }}>
          Business Plan Artifact available: {businessPlanArtifact.length} characters
        </div>
      )}

      <BusinessPlanModificationModal
        isOpen={showModificationModal}
        onClose={() => setShowModificationModal(false)}
        onConfirm={handleConfirmModifications}
        loading={loading}
      />
      </div>
      
      {/* Custom CSS for table hover - only tbody rows */}
      <style>{`
        .tbody-hover-rows > tr:hover {
          background-color: #f0fdfa !important;
          transition: background-color 150ms ease-in-out;
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
        documentTitle="Business Plan Summary"
        documentContent={contentRef.current?.innerHTML || normalizedSummary}
        documentType="business-plan"
      />
    </>
  );
};

export default PlanToRoadmapTransition;
