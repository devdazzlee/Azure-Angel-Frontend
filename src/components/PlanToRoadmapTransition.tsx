import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-toastify';
import BusinessPlanPaywall from './BusinessPlanPaywall';
import DocumentExportModal from './DocumentExportModal';
import PaymentForm from './PaymentForm';
import { PRICING } from '../config/pricing';
import { checkIsFreeIntroPeriod } from '../utils/freeIntroPeriod';

interface PlanToRoadmapTransitionProps {
  businessPlanSummary: string;
  businessPlanArtifact?: string | null;
  onApprove: () => void;
  onRevisit: (modificationAreas?: string[]) => void;
  loading?: boolean;
  sessionId?: string;
  initialQuote?: MotivationalQuote | null;
  nextStep?: 'budget' | 'roadmap'; // Indicates what the next step is
}

interface ModificationArea {
  id: string;
  title: string;
  description: string;
  questions: string[];
}

interface MotivationalQuote {
  quote: string;
  author: string;
  category?: string;
}

const FALLBACK_QUOTES: MotivationalQuote[] = [
  {
    quote: "Success is not final; failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    category: "Persistence"
  },
  {
    quote: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
    category: "Action"
  },
  {
    quote: "Innovation distinguishes between a leader and a follower.",
    author: "Steve Jobs",
    category: "Innovation"
  },
  {
    quote: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
    category: "Dreams"
  },
  {
    quote: "Don't be afraid to give up the good to go for the great.",
    author: "John D. Rockefeller",
    category: "Excellence"
  },
  {
    quote: "Opportunities don't happen, you create them.",
    author: "Chris Grosser",
    category: "Opportunity"
  },
  {
    quote: "If you really look closely, most overnight successes took a long time.",
    author: "Steve Jobs",
    category: "Discipline"
  },
  {
    quote: "Dream big. Start small. Act now.",
    author: "Robin Sharma",
    category: "Momentum"
  }
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-3xl font-semibold text-gray-900 mb-4">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-2xl font-semibold text-gray-900 mt-6 mb-3">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-xl font-semibold text-gray-800 mt-5 mb-2">{children}</h3>
  ),
  h4: ({ children }: { children?: React.ReactNode }) => (
    <h4 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{children}</h4>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-gray-700 leading-relaxed mb-3">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc ml-6 space-y-2 text-gray-700 mb-3">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal ml-6 space-y-2 text-gray-700 mb-3">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="text-gray-900 font-semibold">{children}</strong>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-4 border-blue-400 bg-blue-50 p-4 italic rounded-md my-4 text-gray-700">
      {children}
    </blockquote>
  )
};

const pickFallbackQuote = (exclude?: string): MotivationalQuote => {
  const available = FALLBACK_QUOTES.filter((q) => q.quote !== exclude);
  const pool = available.length > 0 ? available : FALLBACK_QUOTES;
  // Use timestamp + random for better randomization
  const seed = Date.now() + Math.random();
  return pool[Math.floor(seed % pool.length)];
};

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

const TRANSITION_QUOTE_STORAGE_PREFIX = "angel_transition_quote_";

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
  loading = false,
  sessionId,
  initialQuote = null,
  nextStep = 'roadmap' // Default to roadmap for backward compatibility
}) => {
  const navigate = useNavigate(); // Initialize navigate hook
  const contentRef = useRef<HTMLDivElement>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showModificationModal, setShowModificationModal] = useState(false);
  const [selectedModifications, setSelectedModifications] = useState<string[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [hasPaid, setHasPaid] = useState(false); // Track payment status
  const [businessPlanArtifact, setBusinessPlanArtifact] = useState<string | null>(initialArtifact || null);
  const [isGeneratingArtifact, setIsGeneratingArtifact] = useState(false);
  const [quoteState, setQuoteState] = useState<MotivationalQuote>(() =>
    initialQuote ?? pickFallbackQuote()
  );
  const [quoteLoading, setQuoteLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const exportFileName = useMemo(() => {
    const timestamp = new Date().toISOString().split('T')[0];
    return `business-plan-summary-${timestamp}.doc`;
  }, []);

  const storageKey = useMemo(
    () => `${TRANSITION_QUOTE_STORAGE_PREFIX}${sessionId ?? 'anonymous'}`,
    [sessionId]
  );

  const [actualSummary, setActualSummary] = useState<string>(businessPlanSummary);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const hasFetchedSummary = useRef(false); // Track if we've already attempted to fetch

  // Fetch actual summary if we only have the fallback message (only once)
  useEffect(() => {
    const fallbackMessage = "Your business plan has been completed successfully!";
    
    // If we have a valid summary, use it immediately
    if (businessPlanSummary && businessPlanSummary.trim() !== fallbackMessage && businessPlanSummary.trim() !== "") {
      setActualSummary(businessPlanSummary);
      hasFetchedSummary.current = true; // Mark as handled
      return;
    }
    
    // If summary is empty or is the fallback message, try to fetch the actual summary (only once)
    if ((!businessPlanSummary || businessPlanSummary.trim() === fallbackMessage) && sessionId && !hasFetchedSummary.current) {
      hasFetchedSummary.current = true; // Mark as fetching to prevent multiple calls
      setIsLoadingSummary(true);
      
      const fetchSummary = async () => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/angel/sessions/${sessionId}/business-plan-summary`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('sb_access_token')}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.result) {
              // Handle both old format (string) and new format (object with summary field)
              const summary = typeof data.result === 'string' 
                ? data.result 
                : data.result.summary || data.result.full_summary || '';
              
              if (summary && summary.trim() && summary.trim() !== fallbackMessage) {
                console.log('✅ Fetched actual business plan summary from backend');
                setActualSummary(summary);
              } else {
                // If fetched summary is still fallback or empty, use the original
                setActualSummary(businessPlanSummary || "");
              }
            } else {
              // No valid result, use original
              setActualSummary(businessPlanSummary || "");
            }
          } else {
            // Fetch failed, use original
            setActualSummary(businessPlanSummary || "");
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
  }, [businessPlanSummary, sessionId]); // Removed isLoadingSummary from dependencies

  const normalizedSummary = useMemo(
    () => normalizeBusinessPlanSummary(actualSummary),
    [actualSummary]
  );

  const persistQuote = useCallback((quote: MotivationalQuote) => {
    setQuoteState(quote);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, quote.quote);
    }
  }, [storageKey]);

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
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/angel/sessions/${sessionId}/generate-business-plan-artifact`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('sb_access_token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (data.success && data.result?.business_plan_artifact) {
        console.log('✅ Business plan artifact generated successfully!');
        console.log(`📄 Artifact length: ${data.result.business_plan_artifact.length} characters`);
        setBusinessPlanArtifact(data.result.business_plan_artifact);

        toast.success('✅ Full Business Plan generated successfully!', {
          position: 'top-center',
          autoClose: 3000,
        });

        // Navigate to view the plan
        navigate(`/ventures/${sessionId}/business-plan`, {
          state: {
            businessPlan: data.result.business_plan_artifact,
            businessPlanSummary: businessPlanSummary,
            sessionId: sessionId,
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

  useEffect(() => {
    let isMounted = true;
    const lastQuote =
      typeof window !== 'undefined' ? localStorage.getItem(storageKey) ?? undefined : undefined;

    if (initialQuote) {
      const quoteToUse =
        initialQuote.quote === lastQuote ? pickFallbackQuote(lastQuote) : initialQuote;
      persistQuote(quoteToUse);
      return () => {
        isMounted = false;
      };
    }

    const fetchQuote = async () => {
      if (!sessionId) {
        persistQuote(pickFallbackQuote(lastQuote));
        return;
      }

      const token = localStorage.getItem('sb_access_token');
      if (!token) {
        persistQuote(pickFallbackQuote(lastQuote));
        return;
      }

      try {
        setQuoteLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/angel/sessions/${sessionId}/motivational-quote`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        const data = await response.json();
        if (isMounted && data?.success && data.quote) {
          const incoming = data.quote as MotivationalQuote;
          if (incoming.quote === lastQuote) {
            persistQuote(pickFallbackQuote(lastQuote));
          } else {
            persistQuote(incoming);
          }
        } else if (isMounted) {
          persistQuote(pickFallbackQuote(lastQuote));
        }
      } catch (error) {
        console.error('Failed to fetch motivational quote:', error);
        if (isMounted) {
          persistQuote(pickFallbackQuote(lastQuote));
        }
      } finally {
        if (isMounted) {
          setQuoteLoading(false);
        }
      }
    };

    fetchQuote();

    return () => {
      isMounted = false;
    };
  }, [initialQuote, persistQuote, sessionId, storageKey]);

  // Define modification areas based on business plan sections
  const modificationAreas: ModificationArea[] = [
    {
      id: 'business-overview',
      title: 'Business Overview',
      description: 'Core business concept, mission, vision, and value proposition',
      questions: [
        'Is your business concept clearly defined?',
        'Are your mission and vision statements compelling?',
        'Is your value proposition unique and marketable?'
      ]
    },
    {
      id: 'market-research',
      title: 'Market Research & Analysis',
      description: 'Target market, customer segments, and competitive landscape',
      questions: [
        'Have you thoroughly researched your target market?',
        'Are your customer personas detailed and accurate?',
        'Is your competitive analysis comprehensive?'
      ]
    },
    {
      id: 'financial-projections',
      title: 'Financial Projections',
      description: 'Revenue models, cost structure, and financial forecasts',
      questions: [
        'Are your revenue projections realistic?',
        'Have you accounted for all startup costs?',
        'Do you have a clear path to profitability?'
      ]
    },
    {
      id: 'operations',
      title: 'Operations & Logistics',
      description: 'Day-to-day operations, supply chain, and resource requirements',
      questions: [
        'Are your operational processes clearly defined?',
        'Have you identified key suppliers and partners?',
        'Is your resource planning complete?'
      ]
    },
    {
      id: 'marketing-strategy',
      title: 'Marketing & Sales Strategy',
      description: 'Customer acquisition, branding, and sales processes',
      questions: [
        'Is your marketing strategy comprehensive?',
        'Have you defined your sales process?',
        'Are your branding elements consistent?'
      ]
    },
    {
      id: 'legal-compliance',
      title: 'Legal & Compliance',
      description: 'Business structure, licenses, permits, and regulatory requirements',
      questions: [
        'Is your business structure optimal?',
        'Have you identified all required licenses?',
        'Are you compliant with regulations?'
      ]
    }
  ];

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

  const handleModificationToggle = (areaId: string) => {
    setSelectedModifications(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  };

  const handleConfirmModifications = () => {
    if (selectedModifications.length === 0) {
      toast.warning('Please select at least one area to modify');
      return;
    }
    
    setShowModificationModal(false);
    onRevisit(selectedModifications);
    setSelectedModifications([]);
  };

  const handleCancelModifications = () => {
    setShowModificationModal(false);
    setSelectedModifications([]);
  };

  return (
    <>
      {/* Full-Screen Loading Overlay - Fixed Position */}
      {loading && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-md flex items-center justify-center z-[9999]">
          <div className="text-center">
            <svg className="animate-spin h-20 w-20 text-green-500 mx-auto mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">
              {nextStep === 'budget' ? '💰 Setting Up Your Budget' : '🚀 Generating Your Roadmap'}
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              {nextStep === 'budget' ? 'Preparing your budget setup...' : 'Creating your personalized launch roadmap...'}
            </p>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-base text-gray-500">This may take 10-30 seconds...</p>
          </div>
        </div>
      )}
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center px-4">
        <div className="w-full max-w-4xl bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-4xl mx-auto mb-4">
            🏆
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
            🎉 CONGRATULATIONS! Planning Champion Award 🎉
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            You've successfully completed your comprehensive business plan! This is a significant milestone in your entrepreneurial journey.
          </p>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
            <blockquote className="text-lg font-medium text-blue-800 italic">
              {quoteLoading ? 'Loading inspiration…' : `“${quoteState.quote}”`}
            </blockquote>
            {!quoteLoading && (
              <cite className="text-sm text-blue-600 mt-2 block">– {quoteState.author}</cite>
            )}
          </div>
        </div>

        {/* Info Banner - How to Generate Full Plan */}
        {!businessPlanArtifact && !isGeneratingArtifact && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
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
        <div className="mb-8" ref={contentRef} id="business-plan-summary-content">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              📋 Business Plan Summary Overview
            </h2>
            <div className="flex gap-2">
              <button
                disabled={isGeneratingArtifact}
                onClick={() => {
                  if (businessPlanArtifact) {
                    // Artifact exists - navigate to view it
                    navigate(`/ventures/${sessionId}/business-plan`, {
                      state: {
                        businessPlan: businessPlanArtifact,
                        businessPlanSummary: businessPlanSummary,
                        sessionId: sessionId
                      }
                    });
                  } else {
                    // Artifact doesn't exist - generate it on-demand
                    handleGenerateArtifact();
                  }
                }}
                className={`bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none`}
                title={businessPlanArtifact ? 'View your complete business plan' : 'Click to generate your full business plan'}
              >
                {isGeneratingArtifact ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>⏳ Generating... (30-60s)</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{businessPlanArtifact ? '📄 View Full Business Plan' : '🎯 Generate Full Business Plan'}</span>
                  </>
                )}
              </button>
            </div>
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
            <div className="p-8 prose prose-lg max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-teal-500">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8 flex items-center gap-2">
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
                    <p className="text-gray-700 leading-relaxed mb-4 text-justify">
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
                  table: ({ children }) => (
                    <div className="my-8 overflow-x-auto shadow-lg rounded-lg">
                      <table className="min-w-full border-collapse bg-white">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-gradient-to-r from-teal-600 to-blue-600">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="divide-y divide-gray-200 bg-white tbody-hover-rows">
                      {children}
                    </tbody>
                  ),
                  tr: ({ children }) => (
                    <tr>
                      {children}
                    </tr>
                  ),
                  th: ({ children }) => (
                    <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-6 py-4 text-sm text-gray-700 leading-relaxed">
                      {children}
                    </td>
                  ),
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
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Ready to Move Forward?
          </h2>
          <p className="text-gray-600 mb-8">
            Please review your business plan summary above. If everything looks accurate and complete, you can:
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                // Check subscription only for roadmap transition, not for budget
                if (nextStep === 'roadmap' && !hasPaid) {
                  setShowPaymentModal(true);
                  toast.info('Subscription required to proceed to Roadmap phase');
                  return;
                }
                onApprove();
              }}
              disabled={loading || (nextStep === 'roadmap' && !hasPaid)}
              className="group relative bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-10 py-5 rounded-xl text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-2 border-green-400"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-7 w-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-2xl font-bold">
                      {nextStep === 'budget' ? 'Setting Up Budget...' : 'Generating Roadmap...'}
                    </span>
                  </div>
                  <div className="text-sm opacity-95 font-medium">
                    {nextStep === 'budget' ? 'Preparing your budget setup' : 'This may take 10-30 seconds'}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl animate-pulse">🚀</span>
                    <span className="text-2xl">
                      {nextStep === 'budget' ? 'Continue to Budget' : 'Continue to Roadmap'}
                    </span>
                  </div>
                  <div className="text-sm opacity-95 font-medium">
                    {nextStep === 'budget' ? 'Proceed to budget setup' : 'Proceed to roadmap generation'}
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            <button
              onClick={handleRevisitClick}
              disabled={loading}
              className="group relative bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-lg font-semibold">Loading...</span>
                  </div>
                  <div className="text-sm opacity-90">Preparing review mode</div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl">🔄</span>
                    <span>Modify</span>
                  </div>
                  <div className="text-sm opacity-90 mt-1">Adjust any aspects that need refinement</div>
                </>
              )}
              <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
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

      {/* Modification Modal */}
      {showModificationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Areas to Modify</h2>
              <p className="text-gray-600">
                Choose which sections of your business plan need adjustment. We'll guide you through the modification process for each selected area.
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {modificationAreas.map((area) => (
                  <div
                    key={area.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      selectedModifications.includes(area.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleModificationToggle(area.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedModifications.includes(area.id)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedModifications.includes(area.id) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{area.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{area.description}</p>
                        <div className="space-y-1">
                          {area.questions.map((question) => (
                            <p key={question} className="text-xs text-gray-500">• {question}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedModifications.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-blue-900 mb-2">Selected Areas:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedModifications.map((areaId) => {
                      const area = modificationAreas.find(a => a.id === areaId);
                      return (
                        <span
                          key={areaId}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          {area?.title}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelModifications}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmModifications}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  Proceed with Modifications ({selectedModifications.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
