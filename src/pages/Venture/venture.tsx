"use client";

// ChatPage.tsx
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  fetchBusinessPlan,
  fetchBusinessContext,
  fetchQuestion,
  fetchRoadmapPlan,
  fetchSessionHistory,
  fetchSessions,
  syncSessionProgress,
} from "../../services/authService";
import httpClient from "../../api/httpClient";
import { toast } from "react-toastify";
import ProgressCircle from "../../components/ProgressCircle";
import BusinessPlanModal from "../../components/BusinessPlanModal";
import VentureLoader from "../../components/VentureLoader";
import QuestionNavigator from "../../components/QuestionNavigator";
import SmartInput from "../../components/SmartInput";
import AcceptModifyButtons from "../../components/AcceptModifyButtons";
import YesNoButtons from "../../components/YesNoButtons";
import WebSearchIndicator from "../../components/WebSearchIndicator";
import PlanToRoadmapTransition from "../../components/PlanToRoadmapTransition";

import ModifyModal from "../../components/ModifyModal";
import RoadmapDisplay from "../../components/RoadmapDisplay";
import RoadmapToImplementationTransition from "../../components/RoadmapToImplementationTransition";
import UploadPlanModal from "../../components/UploadPlanModal";
import FounderportIcon from "../../assets/images/home/Founderport_Favicon_Mariner.svg?url";
import Implementation from "../Implementation";
import RoadmapEditModal from "../../components/RoadmapEditModal";
import BusinessQuestionFormatter from "../../components/BusinessQuestionFormatter";
import BackButton from "../../components/BackButton";
import AngelThinkingLoader from "../../components/AngelThinkingLoader";
import QuestionFormatter from "../../components/QuestionFormatter";
import ReactMarkdown from "react-markdown";
import type { Budget, BudgetItem, APIResponse } from "../../types/apiTypes";
import BusinessPlanningInstructions from "../../components/BusinessPlanningInstructions";
// GkyToBusinessPlanIntro modal removed — transition happens inline in chat
import { budgetService } from "../../services/budgetService";

interface ConversationPair {
  question: string;
  answer: string;
  acknowledgement?: string;
  questionNumber?: number;
  phase?: 'GKY' | 'BUSINESS_PLAN' | 'ROADMAP' | 'ROADMAP_GENERATED' | 'IMPLEMENTATION' | 'PLAN_TO_ROADMAP_TRANSITION' | 'PLAN_TO_SUMMARY_TRANSITION' | 'PLAN_TO_BUDGET_TRANSITION' | 'ROADMAP_TO_IMPLEMENTATION_TRANSITION';
  /** Draft, Support, Scrapping etc. - display in chat but exclude from progress */
  isCommand?: boolean;
}

type RawChatRecord = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  phase?: string;
  metadata?: Record<string, any>;
  created_at?: string;
};

interface ProgressState {
  phase: "GKY" | "BUSINESS_PLAN" | "PLAN_TO_ROADMAP_TRANSITION" | "PLAN_TO_SUMMARY_TRANSITION" | "PLAN_TO_BUDGET_TRANSITION" | "ROADMAP" | "ROADMAP_GENERATED" | "ROADMAP_TO_IMPLEMENTATION_TRANSITION" | "IMPLEMENTATION";
  answered: number;
  phase_answered?: number;  // Phase-specific step count
  total: number;
  percent: number;
  asked_q?: string;  // Current question tag (e.g., "BUSINESS_PLAN.44")
  combined?: boolean;  // Flag for combined progress
  overall_progress?: {  // Combined progress for GKY + Business Plan (50 total)
    answered: number;
    total: number;
    percent: number;
    phase_breakdown?: {
      gky_completed: number;
      gky_total: number;
      bp_completed: number;
      bp_total: number;
    };
  };
  phase_breakdown?: {
    gky_completed: number;
    gky_total: number;
    bp_completed: number;
    bp_total: number;
  };
}

type MotivationalQuote = {
  quote: string;
  author: string;
  category?: string;
};

interface BusinessContextInfo {
  business_name?: string;
  industry?: string;
  location?: string;
  business_type?: string;
}

const DISPLAY_FALLBACK_CONTEXT: Required<BusinessContextInfo> = {
  business_name: "Your Business",
  industry: "General Business",
  location: "United States",
  business_type: "Startup"
};

// Updated to include PLAN_TO_ROADMAP_TRANSITION phase

const QUESTION_COUNTS = {
  GKY: 5,  // 5 sequential questions (limited for simplified onboarding)
  BUSINESS_PLAN: 45,  // Updated to 45 questions (9 sections restructured)
  ROADMAP: 1,
  IMPLEMENTATION: 10,
};

const cleanContextValue = (value?: string | null) =>
  typeof value === "string" ? value.trim() : "";

const deriveContextFromSession = (session?: Record<string, any>): BusinessContextInfo => {
  if (!session) {
    return {};
  }

  const rawContext =
    session.business_context && typeof session.business_context === "object"
      ? session.business_context
      : {};

  return {
    business_name: cleanContextValue(rawContext.business_name ?? session.business_name),
    industry: cleanContextValue(rawContext.industry ?? session.industry),
    location: cleanContextValue(rawContext.location ?? session.location),
    business_type: cleanContextValue(rawContext.business_type ?? session.business_type),
  };
};

const TRANSITION_FALLBACK_QUOTES: MotivationalQuote[] = [
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
    quote: "Dream big. Start small. Act now.",
    author: "Robin Sharma",
    category: "Momentum"
  },
  {
    quote: "Innovation distinguishes between a leader and a follower.",
    author: "Steve Jobs",
    category: "Innovation"
  },
  {
    quote: "The future depends on what you do today.",
    author: "Mahatma Gandhi",
    category: "Action"
  }
];
const parseQuestionNumberFromTag = (tag?: string | null): number | null => {
  if (!tag) return null;
  const match = tag.match(/\.(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

/**
 * Direct lookup table: internal BP question number → client spec display string.
 * Sub-questions use dot notation (e.g. "1.1", "45.1") so the user can see
 * they belong to a parent question without duplicate numbers.
 * Matches the client's exact document numbering (Q1-Q46).
 */
const BP_TO_CLIENT: Record<number, string> = {
  // Section 1: Product/Service Details
  1: '1',      // Describe your business idea in detail
  2: '1.1',    // What product or service will you offer? (sub of Q1)
  3: '2',      // What makes your product or service unique?
  4: '3',      // What is the current stage of your business?
  // Section 2: Business Overview
  5: '5',      // Business Name
  6: '6',      // What industry?
  7: '7',      // Short-term business goals
  // Section 3: Market Research
  8: '11',     // Who is your target customer?
  9: '12',     // Where will products be available for purchase?
  10: '13',    // What problem(s) are you solving?
  11: '14',    // Competitor research [WEB SEARCH]
  12: '15',    // Industry trends [WEB SEARCH]
  13: '16',    // How will you differentiate?
  // Section 4: Location & Operations
  14: '15',    // Where will your business be located?
  15: '16',    // What facilities or resources will you need?
  16: '17',    // Primary method of delivering product/service?
  17: '18',    // Short-term operational needs [WEB SEARCH]
  // Section 5: Marketing & Sales Strategy
  18: '28',    // Business Mission Statement
  19: '29',    // How do you plan to market?
  20: '30',    // Sales team / marketing firm / self-market?
  21: '31',    // What is your USP?
  22: '32',    // Promotional strategies to launch?
  23: '33',    // Short-term marketing needs [WEB SEARCH]
  // Section 6: Legal & Regulatory Compliance
  24: '34',    // Business structure (LLC, sole proprietorship, etc.)
  25: '35',    // Have you registered your business name?
  26: '36',    // Permits and licenses [WEB SEARCH]
  27: '37',    // Insurance policies [WEB SEARCH]
  28: '38',    // How to ensure adherence / compliance?
  // Section 7: Revenue Model & Financials
  29: '39',    // How will your business make money?
  30: '40',    // Pricing strategy
  31: '41',    // Track financials and accounting
  32: '42',    // Initial funding source
  33: '43',    // Financial goals for first year
  34: '44',    // Main costs [WEB SEARCH]
  // Section 8: Growth & Scaling
  35: '45',    // Scaling plan / decision tree [WEB SEARCH]
  36: '45.1',  // Sub: Long-term business goals
  37: '45.2',  // Sub: Long-term operational needs
  38: '45.3',  // Sub: Long-term financial needs
  39: '45.4',  // Sub: Long-term marketing goals
  40: '45.5',  // Sub: Expanding product/service lines
  41: '45.6',  // Sub: Long-term administrative goals
  // Section 9: Challenges & Contingency Planning
  42: '46',    // Contingency plans [WEB SEARCH]
  43: '46.1',  // Sub: How will you adapt?
  44: '46.2',  // Sub: Will you seek additional funding?
  45: '46.3',  // Sub: Overall vision
};

const getClientDisplayNumber = (
  internalNumber: number | null | undefined,
  phase?: string
): string | number | null => {
  if (internalNumber === null || internalNumber === undefined) return null;
  if (phase !== 'BUSINESS_PLAN') return internalNumber;
  return BP_TO_CLIENT[internalNumber] ?? String(internalNumber);
};

const deriveQuestionNumber = (
  backendQuestionNumber: number | null | undefined,
  replyText: string,
  progressPayload?: Record<string, any>
): number | null => {
  // For GKY phase, questions are now sequential (1-5), use directly
  if (progressPayload?.phase === 'GKY' && typeof backendQuestionNumber === "number" && !Number.isNaN(backendQuestionNumber)) {
    return backendQuestionNumber;
  }

  // For Business Plan phase, use sequential numbering starting from 1
  if (progressPayload?.phase === 'BUSINESS_PLAN' && typeof backendQuestionNumber === "number" && !Number.isNaN(backendQuestionNumber)) {
    // Business Plan questions are sequential (1, 2, 3, etc.) — internal numbering
    return backendQuestionNumber;
  }

  const askedTag = progressPayload?.asked_q;
  const tagNumber = parseQuestionNumberFromTag(askedTag);
  if (tagNumber !== null) {
    return tagNumber;
  }

  const replyMatch = replyText?.match(/\[\[Q:[A-Z_]+\.(\d{2})]]/);
  if (replyMatch) {
    return parseInt(replyMatch[1], 10);
  }

  return null;
};

export default function ChatPage() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const [needsInitialQuestion, setNeedsInitialQuestion] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInitialIntroShown = useRef(false);
  const [sessionBusinessContext, setSessionBusinessContext] = useState<BusinessContextInfo>({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);

  // Load user profile and subscription details
  const loadProfileData = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const token = localStorage.getItem('sb_access_token');
      if (!token) {
        toast.error('Please sign in to view your profile');
        return;
      }

      // Fetch subscription status
      const subscriptionResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/stripe/check-subscription-status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const subscriptionData = await subscriptionResponse.json();
      setSubscriptionDetails(subscriptionData);

      // Get user info from token or localStorage
      try {
        // Try to decode JWT token
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          setUserProfile({
            email: payload.email || payload.user?.email || 'N/A',
            id: payload.sub || payload.user_id || payload.user?.id || 'N/A',
          });
        } else {
          // Fallback: try to get from localStorage session
          const sessionStr = localStorage.getItem('sb_session');
          if (sessionStr) {
            const session = JSON.parse(sessionStr);
            setUserProfile({
              email: session.user?.email || 'N/A',
              id: session.user?.id || 'N/A',
            });
          } else {
            setUserProfile({
              email: 'N/A',
              id: 'N/A',
            });
          }
        }
      } catch (decodeError) {
        console.error('Failed to decode token:', decodeError);
        // Get from subscription response if available
        setUserProfile({
          email: subscriptionData.user_email || 'N/A',
          id: 'N/A',
        });
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
      toast.error('Failed to load profile information');
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  // Cancel subscription
  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? It will remain active until the end of your current billing period.')) {
      return;
    }

    setCancellingSubscription(true);
    try {
      const token = localStorage.getItem('sb_access_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/stripe/cancel-subscription`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Subscription will be canceled at the end of your billing period');
        await loadProfileData(); // Refresh subscription details
      } else {
        toast.error(data.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setCancellingSubscription(false);
    }
  };

  const loadBusinessContext = useCallback(async () => {
    if (!sessionId) return;
    try {
      const response = await fetchBusinessContext(sessionId);
      if (response?.result?.business_context) {
        setSessionBusinessContext(response.result.business_context);
      }
    } catch (error) {
      console.error("Failed to fetch business context:", error);
    }
  }, [sessionId]);

  useEffect(() => {
    setSessionBusinessContext({});
  }, [sessionId]);

  useEffect(() => {
    loadBusinessContext();
  }, [loadBusinessContext]);

  // Function to extract business information from conversation history
  const extractBusinessInfo = () => {
    const businessInfo = {
      business_name: "",
      industry: "",
      location: "",
      business_type: ""
    };

    // PRIORITY 1: Check for domain-like business names in ALL answers (highest confidence)
    history.forEach(pair => {
      const answer = pair.answer.trim();
      const answerLower = answer.toLowerCase();
      
      // Skip command responses
      if (['support', 'draft', 'scrapping', 'scraping', 'accept', 'modify'].includes(answerLower) || answer.length > 500) {
        return;
      }
      
      // Look for domain names ANYWHERE in history
      if ((answer.includes('.com') || answer.includes('.net') || answer.includes('.org') || answer.includes('.co')) &&
          answer.length < 100) {
        businessInfo.business_name = answer.trim();
        console.log(`📊 HIGH PRIORITY: Found domain business name: ${businessInfo.business_name}`);
      }
    });

    // PRIORITY 2: Extract other fields from conversation
    history.forEach((pair, index) => {
      const question = pair.question.toLowerCase();
      const answer = pair.answer;
      const answerLower = answer.toLowerCase().trim();
      
      // Skip command responses
      if (['support', 'draft', 'scrapping', 'scraping', 'accept', 'modify'].includes(answerLower) || answer.length > 500) {
        return;
      }
      
      // Extract location from Business Plan location questions
      if ((question.includes('where are you located') || question.includes('what city') || 
           question.includes('where will your business be located')) &&
          answerLower !== 'yes' && answerLower !== 'no' && answer.length > 2 && answer.length < 100) {
        // Extract city name (first part before comma)
        const cityName = answer.split(',')[0].trim();
        businessInfo.location = cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase();
        console.log(`📊 Extracted location: ${businessInfo.location}`);
      }
      
      // Extract business structure from GKY (LLC, Corporation, etc.)
      if (question.includes('legal business structure') || 
          (question.includes('register') && question.includes('business'))) {
        const structureTypes = ['llc', 'corporation', 'partnership', 'sole proprietorship', 'private limited', 'limited company'];
        if (structureTypes.some(type => answerLower.includes(type))) {
          // Extract just the structure type
          for (const type of structureTypes) {
            if (answerLower.includes(type)) {
              businessInfo.business_type = type.toUpperCase();
              console.log(`📊 Extracted business type: ${businessInfo.business_type}`);
              break;
            }
          }
        }
      }
      
      // 🔥 PRIORITY 1: Extract industry/business type from multiple sources (HIGHEST WEIGHT)
      // This is CRITICAL - check EVERY answer for industry indicators
      if (!businessInfo.industry || businessInfo.industry === 'General Business') {
        // EXPANDED industry keywords including service trades, retail, and all major sectors
        const industryKeywords = {
          // Service Trades (NEW - CRITICAL for plumbing, HVAC, etc.)
          'Plumbing Services': ['plumbing', 'plumber', 'plumbers', 'pipe', 'pipes', 'drain', 'drains', 'water heater', 'faucet', 'toilet', 'sewer', 'leak repair'],
          'HVAC Services': ['hvac', 'heating', 'cooling', 'air conditioning', 'furnace', 'ac repair', 'ventilation'],
          'Electrical Services': ['electrical', 'electrician', 'wiring', 'circuit', 'lighting installation'],
          'Construction': ['construction', 'contractor', 'building', 'renovation', 'remodeling', 'carpentry'],
          'Auto Repair': ['auto repair', 'mechanic', 'car repair', 'automotive service', 'brake', 'engine repair'],
          'Landscaping': ['landscaping', 'lawn care', 'gardening', 'yard maintenance', 'tree service'],
          'Cleaning Services': ['cleaning', 'janitorial', 'maid service', 'house cleaning', 'commercial cleaning'],
          
          // Food & Beverage
          'Beverage': ['beverage', 'drink', 'juice', 'soft drink', 'refreshing', 'coke', 'cola', 'soda', 'tea', 'coffee'],
          'Food & Restaurant': ['food', 'restaurant', 'cafe', 'culinary', 'catering', 'bakery', 'dining', 'food service'],
          
          // Technology
          'Technology & Software': ['technology', 'software', 'app', 'tech', 'ai', 'development', 'digital platform', 'online platform', 'saas', 'web app', 'mobile app'],
          
          // Retail & E-commerce
          'Retail': ['retail', 'store', 'shop', 'boutique', 'merchandise', 'storefront'],
          'E-commerce': ['ecommerce', 'e-commerce', 'marketplace', 'online marketplace', 'online store', 'online shop', 'dropshipping'],
          
          // Healthcare
          'Healthcare': ['health', 'medical', 'clinic', 'wellness', 'pharmacy', 'healthcare', 'dental', 'therapy'],
          
          // Education & Training
          'Education': ['education', 'learning', 'training', 'course', 'teaching', 'tutoring', 'school', 'academy'],
          
          // Professional Services
          'Consulting': ['consulting', 'consultant', 'advisory', 'business consulting', 'management consulting'],
          'Legal Services': ['legal', 'law firm', 'attorney', 'lawyer', 'legal services'],
          'Accounting': ['accounting', 'bookkeeping', 'cpa', 'tax services', 'financial services'],
          'Marketing': ['marketing', 'advertising', 'digital marketing', 'social media marketing', 'seo', 'marketing agency'],
          
          // Real Estate
          'Real Estate': ['real estate', 'property', 'realtor', 'real estate agent', 'property management'],
          
          // Transportation
          'Transportation': ['transportation', 'logistics', 'delivery', 'shipping', 'freight', 'courier'],
          
          // Entertainment & Media
          'Entertainment': ['entertainment', 'event', 'events', 'party planning', 'wedding planning'],
          'Media': ['media', 'production', 'video production', 'photography', 'content creation'],
          
          // Manufacturing
          'Manufacturing': ['manufacturing', 'production', 'factory', 'assembly', 'fabrication'],
          
          // Hospitality
          'Hospitality': ['hospitality', 'hotel', 'lodging', 'accommodation', 'bed and breakfast', 'inn'],
          
          // Fitness & Wellness
          'Fitness': ['fitness', 'gym', 'personal training', 'yoga', 'wellness center', 'sports'],
          
          // Pet Services
          'Pet Services': ['pet', 'pets', 'grooming', 'veterinary', 'pet care', 'dog walking'],
        };
        
        // Check ALL answers for industry keywords (not just one)
        for (const [industry, keywords] of Object.entries(industryKeywords)) {
          if (keywords.some(keyword => answerLower.includes(keyword))) {
            businessInfo.industry = industry;
            console.log(`📊 🔥 HIGH PRIORITY: Extracted industry from keyword match: ${businessInfo.industry}`);
            break;
          }
        }
        
        // Also check the QUESTION text for explicit industry mentions
        if (question.includes('what industry') || question.includes('what type of business') || question.includes('business idea')) {
          // This answer is likely the industry/business type - capture it directly if not matched above
          if (businessInfo.industry === 'General Business' && answer.length < 100) {
            businessInfo.industry = answer.trim();
            console.log(`📊 🔥 DIRECT ANSWER: Captured industry from direct question: ${businessInfo.industry}`);
          }
        }
      }
    });

    console.log('📊 Final extracted business info:', businessInfo);
    return businessInfo;
  };

  const [history, setHistory] = useState<ConversationPair[]>([]);
  const historyDerivedBusinessInfo = useMemo(() => extractBusinessInfo(), [history]);
  const mergedBusinessContext = useMemo(() => {
    const backendContext = {
      business_name: sessionBusinessContext.business_name?.trim() || "",
      industry: sessionBusinessContext.industry?.trim() || "",
      location: sessionBusinessContext.location?.trim() || "",
      business_type: sessionBusinessContext.business_type?.trim() || "",
    };

    return {
      business_name: backendContext.business_name || historyDerivedBusinessInfo.business_name || DISPLAY_FALLBACK_CONTEXT.business_name,
      industry: backendContext.industry || historyDerivedBusinessInfo.industry || DISPLAY_FALLBACK_CONTEXT.industry,
      location: backendContext.location || historyDerivedBusinessInfo.location || DISPLAY_FALLBACK_CONTEXT.location,
      business_type: backendContext.business_type || historyDerivedBusinessInfo.business_type || DISPLAY_FALLBACK_CONTEXT.business_type,
    };
  }, [sessionBusinessContext, historyDerivedBusinessInfo]);
  const renderGkySummaryContent = (summary: string) => {
    if (!summary) return null;

    let cleanedSummary = summary
      .replace(/\*\*/g, "")
      .replace(/^#+\s*/gm, "")
      .replace(/^[-]{3,}$/gm, "") // Remove horizontal rules
      .replace(/^[-–—•]\s*/gm, "") // Remove dashes from list items
      .replace(/\n\s*[-–—•]\s*/g, "\n") // Remove dashes mid-text
      .replace(/\n{3,}/g, "\n\n") // Remove excessive line breaks
      .replace(/^\s*[-–—•]\s*/gm, "") // Remove leading dashes
      .trim();

    const bulletIndicators = [
      "✅",
      "📌",
      "🧩",
      "🎯",
      "🚀",
      "💡",
      "📘",
      "📗",
      "📙",
      "📕",
      "📊",
      "📈",
      "📝",
      "📚",
      "🌟",
      "✨",
      "🎉",
      "🎯",
      "🛠️",
      "🧠",
      "🧭",
      "🛡️",
      "✓",
    ];

    const normalized = cleanedSummary.replace(
      /\s*(?=✅|📌|🧩|🎯|🚀|💡|📘|📗|📙|📕|📊|📈|📝|📚|🌟|✨|🎉|🛠️|🧠|🧭|🛡️|✓)/g,
      "\n"
    );

    const lines = normalized
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    type Group =
      | { type: "paragraph"; content: string }
      | { type: "list"; content: string[] };

    const groups: Group[] = [];
    let currentList: string[] | null = null;

    lines.forEach((line) => {
      const indicator = line.charAt(0);
      const isBullet = bulletIndicators.includes(indicator);

      if (isBullet) {
        if (!currentList) {
          currentList = [];
          groups.push({ type: "list", content: currentList });
        }
        currentList.push(line);
      } else {
        if (currentList) {
          currentList = null;
        }
        groups.push({ type: "paragraph", content: line });
      }
    });

    return groups.map((group, idx) => {
      if (group.type === "paragraph") {
        return (
          <p key={`gky-summary-paragraph-${idx}`} className="mb-4 text-gray-700">
            {group.content}
          </p>
        );
      }

      return (
        <ul
          key={`gky-summary-list-${idx}`}
          className="space-y-2 text-gray-700"
        >
          {group.content.map((item, itemIdx) => {
            const indicator = item.charAt(0);
            const text = item.slice(1).trim();
            return (
              <li
                key={`gky-summary-list-item-${idx}-${itemIdx}`}
                className="flex items-start gap-2"
              >
                <span className="text-lg leading-6">{indicator}</span>
                <span>{text}</span>
              </li>
            );
          })}
        </ul>
      );
    });
  };

  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentAcknowledgement, setCurrentAcknowledgement] = useState("");
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number | null>(null);
  const [currentInput, setCurrentInput] = useState("");
  const [loading, setLoading] = useState(false);
  /** User's answer displayed while waiting for Angel's reply (keeps question + reply visible during loading) */
  const [pendingUserReply, setPendingUserReply] = useState<string | null>(null);
  const [backButtonLoading, setBackButtonLoading] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({
    phase: "GKY",
    answered: 0,
    total: QUESTION_COUNTS.GKY,
    percent: 0,
    overall_progress: {
      answered: 0,
      total: 50, // 5 GKY + 45 Business Plan
      percent: 0,
      phase_breakdown: {
        gky_completed: 0,
        gky_total: 5,
        bp_completed: 0,
        bp_total: 45,
      },
    },
  });
  const [backendTotals, setBackendTotals] = useState({
    answered: 0,
    total: QUESTION_COUNTS.GKY,
    overallAnswered: 0,
    overallTotal: 50, // 5 GKY + 45 Business Plan
  });
  const [transitionQuote, setTransitionQuote] = useState<MotivationalQuote | null>(null);
  const pickFallbackTransitionQuote = useCallback((exclude?: string) => {
    const available = TRANSITION_FALLBACK_QUOTES.filter((q) => q.quote !== exclude);
    const pool = available.length > 0 ? available : TRANSITION_FALLBACK_QUOTES;
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  const fetchTransitionQuote = useCallback(async () => {
    if (!sessionId) {
      setTransitionQuote((prev) => prev ?? pickFallbackTransitionQuote());
      return;
    }

    const token = localStorage.getItem('sb_access_token');
    if (!token) {
      setTransitionQuote((prev) => prev ?? pickFallbackTransitionQuote());
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/angel/sessions/${sessionId}/motivational-quote`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (data?.success && data.quote) {
        setTransitionQuote(data.quote as MotivationalQuote);
      } else {
        setTransitionQuote((prev) => prev ?? pickFallbackTransitionQuote());
      }
    } catch (error) {
      console.error("Failed to fetch motivational quote:", error);
      setTransitionQuote((prev) => prev ?? pickFallbackTransitionQuote());
    }
  }, [pickFallbackTransitionQuote, sessionId]);

  const applyProgressUpdate = (progressData: ProgressState) => {
    // DEBUG: Log raw API response to see if phase_breakdown is present
    console.log("🔍 DEBUG - Raw API Response progressData:", progressData);
    console.log("🔍 DEBUG - Backend Progress Data:", {
      phase: progressData.phase,
      answered: progressData.answered,
      phase_answered: progressData.phase_answered,
      total: progressData.total,
      overall_progress: progressData.overall_progress,
      asked_q: progressData.asked_q
    });
    
    setProgress((prev) => ({
      ...progressData,
      overall_progress: progressData.overall_progress
        ? {
            ...progressData.overall_progress,
            phase_breakdown:
              progressData.overall_progress.phase_breakdown ??
              prev.overall_progress?.phase_breakdown,
          }
        : prev.overall_progress,
    }));
    setBackendTotals((prev) => {
      const phaseKey = progressData.phase as keyof typeof QUESTION_COUNTS;
      const phaseTotal =
        typeof progressData.total === "number"
          ? progressData.total
          : QUESTION_COUNTS[phaseKey] ?? prev.total;
      const phaseAnswered =
        typeof progressData.phase_answered === "number"
          ? progressData.phase_answered
          : typeof progressData.answered === "number"
            ? progressData.answered
            : prev.answered;
      
      // Calculate combined totals for GKY and BUSINESS_PLAN phases
      let combinedTotal: number;
      let combinedAnswered: number;
      let phaseAnsweredForDisplay: number;
      
      if (progressData.phase === "GKY" || progressData.phase === "BUSINESS_PLAN") {
        combinedTotal = QUESTION_COUNTS.GKY + QUESTION_COUNTS.BUSINESS_PLAN;
        
        if (progressData.phase === "GKY") {
          phaseAnsweredForDisplay = phaseAnswered;
          combinedAnswered = phaseAnsweredForDisplay;
        } else {
          phaseAnsweredForDisplay = phaseAnswered;
          combinedAnswered = QUESTION_COUNTS.GKY + phaseAnswered;
        }
      } else {
        combinedTotal = phaseTotal;
        phaseAnsweredForDisplay = phaseAnswered;
        combinedAnswered = phaseAnswered;
      }
      
      const overallAnswered =
        typeof progressData.overall_progress?.answered === "number"
          ? progressData.overall_progress.answered
          : combinedAnswered;
      const overallTotal =
        typeof progressData.overall_progress?.total === "number"
          ? progressData.overall_progress.total
          : combinedTotal;

      return {
        answered: phaseAnsweredForDisplay,
        total: phaseTotal,
        overallAnswered,
        overallTotal,
      };
    });
  };
  
  // Track question numbers per phase to prevent skips
  const [phaseQuestionTracker, setPhaseQuestionTracker] = useState<{
    currentPhase: string;
    questionCount: number;
    lastQuestionNumber: number | null;
  }>({
    currentPhase: "GKY",
    questionCount: 0,
    lastQuestionNumber: null,
  });

  // Console logging for progress debugging
  useEffect(() => {
    console.log("🔄 Progress State Updated:", {
      phase: progress.phase,
      answered: progress.answered,
      total: progress.total,
      percent: progress.percent,
      overall_progress: progress.overall_progress,
      timestamp: new Date().toISOString()
    });
  }, [progress]);

  // Reset question tracker when phase changes
  useEffect(() => {
    if (phaseQuestionTracker.currentPhase !== progress.phase) {
      console.log("🔄 Phase transition detected - resetting question tracker");
      setPhaseQuestionTracker({
        currentPhase: progress.phase,
        questionCount: 0,
        lastQuestionNumber: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.phase]);

  // DEPRECATED: Frontend fallback detection is now disabled
  // Backend now provides reliable show_accept_modify detection
  // This useEffect has been disabled to prevent overriding backend decisions
  // useEffect(() => {
  //   if (currentQuestion) {
  //     const isVerification = isVerificationMessage(currentQuestion);
  //     if (isVerification) {
  //       setShowVerificationButtons(isVerification);
  //     }
  //   }
  // }, [currentQuestion]);
  const [planState, setPlanState] = useState({
    showModal: false,
    loading: false,
    error: "",
    plan: "",
  });
  const [showVerificationButtons, setShowVerificationButtons] = useState(false);
  const [showYesNoButtons, setShowYesNoButtons] = useState(false);
  const [webSearchStatus, setWebSearchStatus] = useState<{
    is_searching: boolean;
    query?: string;
    completed?: boolean;
  }>({
    is_searching: false,
    query: undefined,
    completed: false
  });
  const [transitionData, setTransitionData] = useState<{
    businessPlanSummary: string;
    businessPlanArtifact?: string | null;
    transitionPhase: string;
    estimatedExpenses?: string;
    businessContext?: {
      business_name?: string;
      industry?: string;
      location?: string;
      business_type?: string;
    };
  } | null>(null);
  const [gkyTransitionCompleted, setGkyTransitionCompleted] = useState(false); // Track if user completed GKY transition
  const [modifyModal, setModifyModal] = useState<{
    isOpen: boolean;
    currentText: string;
  }>({
    isOpen: false,
    currentText: ""
  });
  const [roadmapData, setRoadmapData] = useState<{
    roadmapContent: string;
    isGenerated: boolean;
  } | null>(null);
  const [roadmapToImplementationTransition, setRoadmapToImplementationTransition] = useState<{
    roadmapContent: string;
    isActive: boolean;
  } | null>(null);
  const [roadmapEditModal, setRoadmapEditModal] = useState<{
    isOpen: boolean;
    roadmapContent: string;
  }>({
    isOpen: false,
    roadmapContent: ""
  });
  const [uploadPlanModal, setUploadPlanModal] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false
  });
  const [uploadAnalysis, setUploadAnalysis] = useState<{
    missingQuestions: Array<{ question_number: number; question_text: string; category: string; priority: string }>;
    businessInfo: any;
  } | null>(null);
  const [hasSeenUploadPrompt, setHasSeenUploadPrompt] = useState(false);
  const [hasUploadedPlan, setHasUploadedPlan] = useState(false);
  const [uploadPromptInitialized, setUploadPromptInitialized] = useState(false);
  const [budgetSetupModal, setBudgetSetupModal] = useState<{
    isOpen: boolean;
    businessPlanCompleted: boolean;
  }>({
    isOpen: false,
    businessPlanCompleted: false
  });
  const [showInstructions, setShowInstructions] = useState(false);
  // Modal state removed — GKY→BP transition is now fully inline

  const markUploadPromptAsSeen = useCallback(() => {
    if (hasSeenUploadPrompt) {
      return;
    }
    if (typeof window === "undefined" || !sessionId) {
      setHasSeenUploadPrompt(true);
      return;
    }
    window.localStorage.setItem(`angel_upload_prompt_${sessionId}_seen`, "true");
    setHasSeenUploadPrompt(true);
  }, [hasSeenUploadPrompt, sessionId]);

  const markUploadPlanAsUploaded = useCallback(() => {
    if (typeof window === "undefined" || !sessionId) {
      setHasUploadedPlan(true);
      if (!hasSeenUploadPrompt) {
        setHasSeenUploadPrompt(true);
      }
      return;
    }
    window.localStorage.setItem(`angel_upload_prompt_${sessionId}_uploaded`, "true");
    setHasUploadedPlan(true);
    if (!hasSeenUploadPrompt) {
      window.localStorage.setItem(`angel_upload_prompt_${sessionId}_seen`, "true");
      setHasSeenUploadPrompt(true);
    }
  }, [hasSeenUploadPrompt, sessionId]);

  const openUploadPlanModal = useCallback(() => {
    markUploadPromptAsSeen();
    setUploadPlanModal({ isOpen: true });
  }, [markUploadPromptAsSeen]);

  const handleUploadModalClose = useCallback(() => {
    setUploadPlanModal({ isOpen: false });
  }, []);

  const handleBudgetSetupComplete = useCallback(async (budgetData: {
    initialInvestment: number;
    estimatedExpenses: any[];
    estimatedRevenue: any[];
  }) => {
    try {
      // Create budget object
      const budgetPayload = {
        session_id: sessionId!,
        initial_investment: budgetData.initialInvestment,
        total_estimated_expenses: budgetData.estimatedExpenses.reduce((sum, item) => sum + item.estimated_amount, 0),
        total_estimated_revenue: budgetData.estimatedRevenue.reduce((sum, item) => sum + item.estimated_amount, 0),
        items: [...budgetData.estimatedExpenses, ...budgetData.estimatedRevenue]
      };

      // Save budget to backend
      const response = await budgetService.saveBudget(sessionId!, budgetPayload);
      
      if (response.success) {
        toast.success('Budget setup completed successfully!');
        
        // Add budget setup completion message to history
        const initialInvestment = Number(budgetData?.initialInvestment) || 0;
        const totalEstimatedExpenses = Number(budgetPayload?.total_estimated_expenses) || 0;
        const totalEstimatedRevenue = Number(budgetPayload?.total_estimated_revenue) || 0;
        setHistory(prev => [...prev, {
          question: "Budget Setup",
          answer: `Great! I've set up your budget with an initial investment of $${initialInvestment.toLocaleString()}, estimated expenses of $${totalEstimatedExpenses.toLocaleString()}, and estimated revenue of $${totalEstimatedRevenue.toLocaleString()}. You can view and manage your budget anytime by clicking the Budget tab.`,
          phase: 'BUSINESS_PLAN'
        }]);
      } else {
        toast.error('Failed to save budget setup');
      }
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error('Failed to save budget setup');
    }
    
    setBudgetSetupModal({ isOpen: false, businessPlanCompleted: false });
  }, [sessionId]);

  useEffect(() => {
    fetchTransitionQuote();
  }, [fetchTransitionQuote]);

  useEffect(() => {
    if (transitionData?.transitionPhase === "PLAN_TO_ROADMAP") {
      fetchTransitionQuote();
    }
  }, [fetchTransitionQuote, transitionData]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setUploadPromptInitialized(false);

    if (!sessionId) {
      setHasSeenUploadPrompt(false);
      setHasUploadedPlan(false);
      setUploadPromptInitialized(true);
      return;
    }

    const seen = window.localStorage.getItem(`angel_upload_prompt_${sessionId}_seen`) === "true";
    const uploaded = window.localStorage.getItem(`angel_upload_prompt_${sessionId}_uploaded`) === "true";

    setHasSeenUploadPrompt(seen || uploaded);
    setHasUploadedPlan(uploaded);
    setUploadPromptInitialized(true);
  }, [sessionId]);

  useEffect(() => {
    if (!uploadPromptInitialized || !sessionId) {
      return;
    }
    if (hasSeenUploadPrompt || hasUploadedPlan || uploadPlanModal.isOpen) {
      return;
    }
    // CRITICAL: Don't show upload modal automatically if user just completed GKY transition
    // The upload modal will be shown by handleStartBusinessPlanning after user clicks Continue
    if (!gkyTransitionCompleted && progress.phase === "BUSINESS_PLAN") {
      // If we're in BUSINESS_PLAN but transition wasn't completed via Continue button,
      // it means user might have navigated directly or refreshed - allow upload modal
      // But if transition was just completed, wait for handleStartBusinessPlanning to show it
      const answeredCount =
        typeof progress.phase_answered === "number"
          ? progress.phase_answered
          : backendTotals.answered;
      
      if ((answeredCount ?? 0) === 0) {
        // Only show if we're truly at the start (not from a fresh transition)
        // This handles cases where user refreshes or navigates directly to business planning
        return; // Don't show automatically - let handleStartBusinessPlanning handle it
      }
    }
    if (progress.phase !== "BUSINESS_PLAN") {
      return;
    }

    const answeredCount =
      typeof progress.phase_answered === "number"
        ? progress.phase_answered
        : backendTotals.answered;

    if ((answeredCount ?? 0) > 0) {
      return;
    }

    // Only show upload modal if we're NOT in the middle of GKY transition
    // This prevents modal collision - upload will be shown after user clicks Continue
    openUploadPlanModal();
  }, [
    backendTotals.answered,
    hasSeenUploadPrompt,
    hasUploadedPlan,
    gkyTransitionCompleted,
    openUploadPlanModal,
    progress.phase,
    progress.phase_answered,
    sessionId,
    uploadPlanModal.isOpen,
    uploadPromptInitialized,
  ]);

  // AI-powered detection of whether Accept/Modify buttons should be shown
  // const isVerificationMessage = (message: string): boolean => {
  //   if (!message || message.length < 100) return false;
    
  //   const lowerMessage = message.toLowerCase();
    
  //   // Quick check for explicit verification keywords (fast path)
  //   const explicitVerificationKeywords = [
  //     "does this look accurate",
  //     "does this look correct",
  //     "is this accurate",
  //     "is this correct",
  //     "please let me know where you'd like to modify",
  //     "here's what i've captured so far"
  //   ];
    
  //   const hasExplicitVerification = explicitVerificationKeywords.some(keyword => lowerMessage.includes(keyword));
  //   if (hasExplicitVerification) return true;
    
  //   // AI-powered detection for substantial, actionable content
  //   // Check if this is a substantive response that could be an answer (not just a question)
    
  //   // 1. Check if it's just asking a new question (should NOT show buttons)
  //   const hasQuestionTag = message.match(/\[\[Q:[A-Z_]+\.\d{2}\]\]/);
  //   const isJustAskingQuestion = hasQuestionTag && message.length < 1000;
  //   if (isJustAskingQuestion) return false;
    
  //   // 2. Check if it's a substantial, structured response (likely an answer/draft)
  //   const isSubstantialResponse = (
  //     message.length > 500 && // Substantial length
  //     (
  //       // Has multiple sections/structure
  //       (lowerMessage.match(/\*\*/g) || []).length >= 4 ||
  //       // Has numbered/bulleted lists
  //       (lowerMessage.match(/\n\d+\./g) || []).length >= 3 ||
  //       (lowerMessage.match(/\n-/g) || []).length >= 5 ||
  //       (lowerMessage.match(/\n•/g) || []).length >= 5
  //     ) &&
  //     // Contains actionable/informative content keywords
  //     (
  //       lowerMessage.includes("consider") ||
  //       lowerMessage.includes("focus on") ||
  //       lowerMessage.includes("strategy") ||
  //       lowerMessage.includes("recommendation") ||
  //       lowerMessage.includes("insight") ||
  //       lowerMessage.includes("action step") ||
  //       lowerMessage.includes("implementation") ||
  //       lowerMessage.includes("key points") ||
  //       lowerMessage.includes("features") ||
  //       lowerMessage.includes("benefits")
  //     )
  //   );
    
  //   if (isSubstantialResponse) return true;
    
  //   // 3. Check if it's a response to a user's modification request
  //   // (when user says "give me unique", "explain better", "make it simpler", etc.)
  //   const hasCustomRequestIndicators = (
  //     (lowerMessage.includes("here's") || lowerMessage.includes("here is")) &&
  //     (
  //       lowerMessage.includes("unique") ||
  //       lowerMessage.includes("simplified") ||
  //       lowerMessage.includes("detailed") ||
  //       lowerMessage.includes("enhanced") ||
  //       lowerMessage.includes("refined") ||
  //       lowerMessage.includes("improved")
  //     ) &&
  //     message.length > 400
  //   );
    
  //   if (hasCustomRequestIndicators) return true;
    
  //   return false;
  // };

  // Function to extract the actionable content from AI responses (removes question tags, tips, markdown, thought starters)
  const extractGuidanceContent = (message: string): string | null => {
    if (!message || message.length < 100) return null;
    
    let cleanedContent = message;
    
    // Remove question tags like [[Q:BUSINESS_PLAN.06]]
    cleanedContent = cleanedContent.replace(/\[\[Q:[A-Z_]+\.\d{2}\]\]/g, '').trim();
    
    // Remove draft/support prefixes
    cleanedContent = cleanedContent.replace(/^Here's a (research-backed )?draft for you:\s*/i, '').trim();
    cleanedContent = cleanedContent.replace(/^Here's a draft based on.*?:\s*/i, '').trim();
    
    // Remove trailing tips and verification prompts
    cleanedContent = cleanedContent.replace(/💡 \*\*Quick Tip\*\*:.*$/s, '').trim();
    cleanedContent = cleanedContent.replace(/💡 \*\*Pro Tip\*\*:.*$/s, '').trim();
    cleanedContent = cleanedContent.replace(/💡\s*Quick Tip:.*$/s, '').trim();
    cleanedContent = cleanedContent.replace(/\n\nVerification:.*$/s, '').trim();
    cleanedContent = cleanedContent.replace(/🎯 \*\*Areas Where You May Need Additional Support:\*\*.*$/s, '').trim();
    
    // Remove Thought Starter lines (🧠 Thought Starter: ...)
    cleanedContent = cleanedContent.replace(/🧠\s*Thought Starter:.*$/gm, '').trim();
    cleanedContent = cleanedContent.replace(/💭\s*Thought Starter:.*$/gm, '').trim();
    
    // Remove "Follow-up prompts:" sections
    cleanedContent = cleanedContent.replace(/\n\s*Follow-up prompts?:[\s\S]*$/i, '').trim();
    cleanedContent = cleanedContent.replace(/\n\s*Follow-up questions?:[\s\S]*$/i, '').trim();
    
    // Remove "I'm sorry, but I can't accommodate" contradictory guardrail messages
    cleanedContent = cleanedContent.replace(/I'm sorry, but I can't accommodate that request\..*$/s, '').trim();
    
    // Remove ** markdown bold markers for clean text display
    cleanedContent = cleanedContent.replace(/\*\*/g, '').trim();
    
    // Clean up extra blank lines left by removals
    cleanedContent = cleanedContent.replace(/\n{3,}/g, '\n\n').trim();
    
    // If the cleaned content is substantial, return it
    if (cleanedContent.length > 200) {
      return cleanedContent;
    }
    
    return null;
  };

  // Handle Accept button click
  const handleAccept = async () => {
    setShowVerificationButtons(false);
    setLoading(true);
    
    try {
      // Extract the guidance content from the current question
      // This contains the Support/Draft/Scrapping response that should be saved as the user's answer
      const guidanceContent = extractGuidanceContent(currentQuestion);
      
      if (guidanceContent) {
        // Save the guidance content as the user's answer to the current question
        setHistory((prev) => [
          ...prev,
          { question: currentQuestion, answer: guidanceContent, acknowledgement: currentAcknowledgement || undefined, questionNumber: currentQuestionNumber },
        ]);
      }
      
      // IMPORTANT: Send only "Accept" to the backend, not the full content
      // The backend will understand "Accept" as a command to move to the next question
      const {
        result: { reply, progress, web_search_status, immediate_response, show_accept_modify, question_number },
      } = await fetchQuestion("Accept", sessionId!);
      const { acknowledgement: ack, question: parsedQ } = parseAngelReply(reply);
      const questionNumber = deriveQuestionNumber(question_number, reply, progress);
      setCurrentQuestion(parsedQ);
      setCurrentAcknowledgement(ack);
      setCurrentQuestionNumber(questionNumber);
      updateQuestionTracker(progress.phase, questionNumber);
      applyProgressUpdate(progress);
      setWebSearchStatus(web_search_status || { is_searching: false, query: undefined, completed: false });
      
      // Use backend detection for showing buttons (always respect backend decision)
      setShowVerificationButtons(show_accept_modify || false);
      
      // Show immediate response if available
      if (immediate_response) {
        // toast.info(immediate_response, { 
        //   autoClose: 5000,
        //   position: "top-center",
        //   className: "bg-blue-50 border border-blue-200 text-blue-800"
        // });
      }
    } catch (error: any) {
      console.error("❌ Failed to fetch question (Accept):", error);
      const errorMessage = 
        error?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to proceed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle Modify button click
  const handleModify = (currentText: string) => {
    // Extract the guidance content from the current question
    const guidanceContent = extractGuidanceContent(currentQuestion);
    const contentToModify = guidanceContent || currentText;
    
    setModifyModal({
      isOpen: true,
      currentText: contentToModify
    });
  };

  const handleYes = async () => {
    setShowYesNoButtons(false);
    setLoading(true);
    
    try {
      const {
        result: { reply, progress, web_search_status, immediate_response, show_accept_modify, question_number },
      } = await fetchQuestion("Yes", sessionId!);
      const { acknowledgement: ack, question: parsedQ } = parseAngelReply(reply);
      const questionNumber = deriveQuestionNumber(question_number, reply, progress);
      setCurrentQuestion(parsedQ);
      setCurrentAcknowledgement(ack);
      setCurrentQuestionNumber(questionNumber);
      updateQuestionTracker(progress.phase, questionNumber);
      applyProgressUpdate(progress);
      setWebSearchStatus(web_search_status || { is_searching: false, query: undefined, completed: false });
      setShowVerificationButtons(show_accept_modify || false);
    } catch (error: any) {
      console.error("❌ Failed to handle Yes:", error);
      const errorMessage = 
        error?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to proceed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNo = async () => {
    setShowYesNoButtons(false);
    setLoading(true);
    
    try {
      const {
        result: { reply, progress, web_search_status, immediate_response, show_accept_modify, question_number },
      } = await fetchQuestion("No", sessionId!);
      const { acknowledgement: ack, question: parsedQ } = parseAngelReply(reply);
      const questionNumber = deriveQuestionNumber(question_number, reply, progress);
      setCurrentQuestion(parsedQ);
      setCurrentAcknowledgement(ack);
      setCurrentQuestionNumber(questionNumber);
      updateQuestionTracker(progress.phase, questionNumber);
      applyProgressUpdate(progress);
      setWebSearchStatus(web_search_status || { is_searching: false, query: undefined, completed: false });
      setShowVerificationButtons(show_accept_modify || false);
    } catch (error: any) {
      console.error("❌ Failed to handle No:", error);
      const errorMessage = 
        error?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to proceed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle Draft Answer button click
  const handleDraftMore = async () => {
    setLoading(true);
    
    try {
      const {
        result: { reply, progress, web_search_status, immediate_response, show_accept_modify, question_number },
      } = await fetchQuestion("Draft Answer", sessionId!);
      const { acknowledgement: ack, question: parsedQ } = parseAngelReply(reply);
      const questionNumber = deriveQuestionNumber(question_number, reply, progress);
      setCurrentQuestion(parsedQ);
      setCurrentAcknowledgement(ack);
      setCurrentQuestionNumber(questionNumber);
      updateQuestionTracker(progress.phase, questionNumber);
      applyProgressUpdate(progress);
      setWebSearchStatus(web_search_status || { is_searching: false, query: undefined, completed: false });
      
      // Use backend detection for showing buttons (always respect backend decision)
      setShowVerificationButtons(show_accept_modify || false);
      
      // Show immediate response if available
      if (immediate_response) {
        // toast.info(immediate_response, { 
        //   autoClose: 5000,
        //   position: "top-center",
        //   className: "bg-blue-50 border border-blue-200 text-blue-800"
        // });
      }
    } catch (error: any) {
      console.error("❌ Failed to fetch question (Draft More):", error);
      const errorMessage = 
        error?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to generate draft. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle saving modified text
  const handleModifySave = async (modifiedText: string) => {
    setModifyModal(prev => ({ ...prev, isOpen: false }));
    setShowVerificationButtons(false);
    
    try {
      setLoading(true);
      await handleNext(modifiedText);
    } catch (error) {
      console.error("Error sending modified text:", error);
      toast.error("Failed to send modifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle starting implementation (triggers roadmap to implementation transition)
  const handleStartImplementation = async () => {
    try {
      setLoading(true);
      toast.info("Preparing implementation transition...");
      
      // Call the roadmap to implementation transition endpoint
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/angel/sessions/${sessionId}/roadmap-to-implementation-transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sb_access_token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Implementation transition prepared!");
        setRoadmapData(null);
        if (data.result?.progress) {
          applyProgressUpdate(data.result.progress);
        }
        
        // Set the roadmap to implementation transition
        setRoadmapToImplementationTransition({
          roadmapContent: data.result.reply,
          isActive: true
        });
      } else {
        toast.error(data.message || "Failed to prepare implementation transition");
      }
    } catch (error: any) {
      console.error("❌ Error preparing implementation transition:", error);
      const errorMessage = 
        error?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to prepare implementation. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle GKY to Business Plan transition
  const handleStartBusinessPlanning = async () => {
    try {
      setLoading(true);
      toast.info("Starting business planning phase...");
      
      // Fetch the first business plan question
      const {
        result: { reply, progress, web_search_status, immediate_response, question_number },
      } = await fetchQuestion("", sessionId!);
      
      const { acknowledgement: ack, question: parsedQ } = parseAngelReply(reply);
      const questionNumber = deriveQuestionNumber(question_number, reply, progress);
      setCurrentQuestion(parsedQ);
      setCurrentAcknowledgement(ack);
      setCurrentQuestionNumber(questionNumber);
      updateQuestionTracker(progress.phase, questionNumber);
      applyProgressUpdate(progress);
      setWebSearchStatus(web_search_status || { is_searching: false, query: undefined, completed: false });
      
      toast.success("Welcome to the Business Planning phase!");
      
      // Mark that GKY transition is completed (user clicked Continue)
      setGkyTransitionCompleted(true);
      
      // Show upload modal after transition message is displayed
      // Small delay to let the BP Q1 render first
      setTimeout(() => {
        // Only show upload modal if user hasn't already uploaded and we're at the start of business planning
        const progressWithPhaseAnswered = progress as ProgressState & { phase_answered?: number };
        const answeredCount = progressWithPhaseAnswered.phase_answered ?? 0;
        
        if (!hasUploadedPlan && !hasSeenUploadPrompt && answeredCount === 0) {
          console.log("📄 Showing upload plan modal after GKY completion");
          openUploadPlanModal();
        }
      }, 300);
      
      // Smooth scroll to bottom after phase transition - increased delay to override other scroll effects
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
          console.log('📜 Smooth scrolled to bottom after business planning phase start (handleStartBusinessPlanning)');
        }
      }, 500); // Increased delay to ensure this happens last
    } catch (error) {
      console.error("Error starting business planning:", error);
      toast.error("Failed to start business planning");
    } finally {
      setLoading(false);
    }
  };

  // Handle actual implementation start (from transition screen)
  const handleActualStartImplementation = async () => {
    try {
      setLoading(true);
      toast.info("Starting implementation phase...");
      
      // Call the start implementation endpoint
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/angel/sessions/${sessionId}/start-implementation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sb_access_token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Implementation phase activated!");
        
        // CRITICAL: Clear transition state FIRST so it doesn't block the Implementation component
        setRoadmapToImplementationTransition(null);
        setRoadmapData(null);
        setTransitionData(null);
        
        // Update progress to IMPLEMENTATION phase - this will trigger the Implementation component to show
        if (data.result?.progress) {
          console.log("🔄 Updating progress to IMPLEMENTATION:", data.result.progress);
          applyProgressUpdate(data.result.progress);
        } else {
          // Fallback: manually set progress to IMPLEMENTATION if endpoint doesn't return it
          console.log("⚠️ No progress in response, manually setting to IMPLEMENTATION");
          applyProgressUpdate({
            phase: "IMPLEMENTATION",
            answered: 0,
            total: 10,
            percent: 0
          });
        }
      } else {
        toast.error(data.message || "Failed to start implementation");
      }
    } catch (error: any) {
      console.error("❌ Error starting implementation:", error);
      const errorMessage = 
        error?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to start implementation. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const [roadmapState, setRoadmapState] = useState({
    showModal: false,
    loading: false,
    error: "",
    plan: "",
  });

  // const cleanQuestionText = (text: string): string => {
  //   return text.replace(/\[\[Q:[A-Z_]+\.\d{2}]]\s*/g, "").trim();
  // };

  // 🔢 Helper to extract question number from AI response
  // const extractQuestionNumber = (text: string): number | null => {
  //   // Check if this is an introduction message (not a question)
  //   const isIntroduction = text.toLowerCase().includes('welcome to founderport') || 
  //                         text.toLowerCase().includes('congratulations on taking your first step') ||
  //                         text.toLowerCase().includes('angel\'s mission is simple') ||
  //                         text.toLowerCase().includes('phase 1 - know your customer') ||
  //                         text.toLowerCase().includes('phase 2 - business planning') ||
  //                         text.toLowerCase().includes('phase 3 - roadmap') ||
  //                         text.toLowerCase().includes('phase 4: implementation') ||
  //                         text.toLowerCase().includes('your journey starts now') ||
  //                         text.toLowerCase().includes('every great business begins') ||
  //                         text.toLowerCase().includes('are you ready to begin your journey') ||
  //                         text.toLowerCase().includes('let\'s start with the getting to know you questionnaire') ||
  //                         // Check if it's the introduction with the first question embedded
  //                         (text.toLowerCase().includes('welcome to founderport') && text.toLowerCase().includes('what\'s your name and preferred name'));
    
  //   if (isIntroduction) {
  //     return null; // Don't show question number for introductions
  //   }
    
  //   // Look for patterns like [[Q:GKY.01]] or Question 1 of 20
  //   const tagMatch = text.match(/\[\[Q:[A-Z_]+\.(\d+)\]\]/);
  //   if (tagMatch) {
  //     return parseInt(tagMatch[1], 10);
  //   }
    
  //   const questionMatch = text.match(/Question (\d+) of \d+/i);
  //   if (questionMatch) {
  //     return parseInt(questionMatch[1], 10);
  //   }
    
  //   // If no tag found but this is a GKY question, try to determine the number from context
  //   if (progress.phase === "GKY" && text.includes("?")) {
  //     // Check for specific GKY questions and assign numbers
  //     if (text.toLowerCase().includes("what is your preferred communication style")) {
  //       return 2; // This is GKY.02
  //     }
  //     if (text.toLowerCase().includes("have you started a business before")) {
  //       return 3; // This is GKY.03
  //     }
  //     if (text.toLowerCase().includes("what's your current work situation")) {
  //       return 4; // This is GKY.04
  //     }
  //     if (text.toLowerCase().includes("do you already have a business idea")) {
  //       return 5; // This is GKY.05
  //     }
  //     if (text.toLowerCase().includes("have you shared any of your previous ideas or concepts with others")) {
  //       return 6; // This is GKY.06
  //     }
  //     if (text.toLowerCase().includes("how comfortable are you with these business skills")) {
  //       return 7; // This is GKY.07
  //     }
  //     if (text.toLowerCase().includes("what kind of business are you trying to build")) {
  //       return 8; // This is GKY.08
  //     }
  //     if (text.toLowerCase().includes("what motivates you to start this business")) {
  //       return 9; // This is GKY.09
  //     }
  //     if (text.toLowerCase().includes("where will your business operate")) {
  //       return 10; // This is GKY.10
  //     }
  //     if (text.toLowerCase().includes("what industry does your business fall into")) {
  //       return 11; // This is GKY.11
  //     }
  //     if (text.toLowerCase().includes("do you have any initial funding available")) {
  //       return 12; // This is GKY.12
  //     }
  //     if (text.toLowerCase().includes("are you planning to seek outside funding in the future")) {
  //       return 13; // This is GKY.13
  //     }
  //     if (text.toLowerCase().includes("how do you plan to generate revenue")) {
  //       return 14; // This is GKY.14
  //     }
  //     if (text.toLowerCase().includes("will your business be primarily:")) {
  //       return 15; // This is GKY.15
  //     }
  //     // Add fallback for questions that might not have tags
  //     if (progress.phase === "GKY" && text.includes("?") && !text.toLowerCase().includes('welcome to founderport')) {
  //       // Try to determine question number from context or history
  //       const historyLength = history.length;
  //       if (historyLength >= 0 && historyLength < 19) {
  //         return historyLength + 2; // Start from question 2 (since question 1 is the introduction)
  //       }
  //     }
  //     // Add more specific question patterns as needed
  //   }
    
  //   // If no tag found but this is a BUSINESS_PLAN question, try to determine the number from context
  //   if (progress.phase === "BUSINESS_PLAN" && text.includes("?")) {
  //     // Check for specific Business Plan questions and assign numbers
  //     if (text.toLowerCase().includes("what is your business name")) {
  //       return 1; // This is BP.01
  //     }
  //     if (text.toLowerCase().includes("what is your business tagline or mission statement")) {
  //       return 2; // This is BP.02
  //     }
  //     if (text.toLowerCase().includes("what problem does your business solve")) {
  //       return 3; // This is BP.03
  //     }
  //     if (text.toLowerCase().includes("what makes your business unique")) {
  //       return 4; // This is BP.04
  //     }
  //     if (text.toLowerCase().includes("describe your core product or service")) {
  //       return 5; // This is BP.05
  //     }
  //     if (text.toLowerCase().includes("what are the key features and benefits")) {
  //       return 6; // This is BP.06
  //     }
  //     if (text.toLowerCase().includes("what is your product development timeline")) {
  //       return 7; // This is BP.07
  //     }
  //     if (text.toLowerCase().includes("who is your target market")) {
  //       return 8; // This is BP.08
  //     }
  //     if (text.toLowerCase().includes("what is the size of your target market")) {
  //       return 9; // This is BP.09
  //     }
  //     if (text.toLowerCase().includes("who are your main competitors")) {
  //       return 10; // This is BP.10
  //     }
  //     if (text.toLowerCase().includes("how is your target market currently solving this problem")) {
  //       return 11; // This is BP.11
  //     }
  //     if (text.toLowerCase().includes("where will your business be located")) {
  //       return 12; // This is BP.12
  //     }
  //     if (text.toLowerCase().includes("what are your space and facility requirements")) {
  //       return 13; // This is BP.13
  //     }
  //     if (text.toLowerCase().includes("what are your short-term operational needs")) {
  //       return 14; // This is BP.14
  //     }
  //     if (text.toLowerCase().includes("what suppliers or vendors will you need")) {
  //       return 15; // This is BP.15
  //     }
  //     if (text.toLowerCase().includes("what are your staffing needs")) {
  //       return 16; // This is BP.16
  //     }
  //     if (text.toLowerCase().includes("how will you price your product")) {
  //       return 17; // This is BP.17
  //     }
  //     if (text.toLowerCase().includes("what are your projected sales for the first year")) {
  //       return 18; // This is BP.18
  //     }
  //     if (text.toLowerCase().includes("what are your estimated startup costs")) {
  //       return 19; // This is BP.19
  //     }
  //     if (text.toLowerCase().includes("what are your estimated monthly operating expenses")) {
  //       return 20; // This is BP.20
  //     }
  //     if (text.toLowerCase().includes("when do you expect to break even")) {
  //       return 21; // This is BP.21
  //     }
  //     if (text.toLowerCase().includes("how much funding do you need to get started")) {
  //       return 22; // This is BP.22
  //     }
  //     if (text.toLowerCase().includes("what are your financial projections for years 1-3")) {
  //       return 23; // This is BP.23
  //     }
  //     if (text.toLowerCase().includes("how will you track and manage your finances")) {
  //       return 24; // This is BP.24
  //     }
  //     if (text.toLowerCase().includes("how will you reach your target customers")) {
  //       return 25; // This is BP.25
  //     }
  //     if (text.toLowerCase().includes("what is your sales process")) {
  //       return 26; // This is BP.26
  //     }
  //     if (text.toLowerCase().includes("what is your customer acquisition cost")) {
  //       return 27; // This is BP.27
  //     }
  //     if (text.toLowerCase().includes("what is your customer lifetime value")) {
  //       return 28; // This is BP.28
  //     }
  //     if (text.toLowerCase().includes("how will you build brand awareness")) {
  //       return 29; // This is BP.29
  //     }
  //     if (text.toLowerCase().includes("what partnerships or collaborations could help")) {
  //       return 30; // This is BP.30
  //     }
  //     if (text.toLowerCase().includes("what business structure will you use")) {
  //       return 31; // This is BP.31
  //     }
  //     if (text.toLowerCase().includes("what licenses and permits do you need")) {
  //       return 32; // This is BP.32
  //     }
  //     if (text.toLowerCase().includes("what insurance coverage do you need")) {
  //       return 33; // This is BP.33
  //     }
  //     if (text.toLowerCase().includes("how will you protect your intellectual property")) {
  //       return 34; // This is BP.34
  //     }
  //     if (text.toLowerCase().includes("what contracts and agreements will you need")) {
  //       return 35; // This is BP.35
  //     }
  //     if (text.toLowerCase().includes("how will you handle taxes and compliance")) {
  //       return 36; // This is BP.36
  //     }
  //     if (text.toLowerCase().includes("what data privacy and security measures")) {
  //       return 37; // This is BP.37
  //     }
  //     if (text.toLowerCase().includes("what are the key milestones you hope to achieve")) {
  //       return 38; // This is BP.38
  //     }
  //     if (text.toLowerCase().includes("what additional products or services could you offer")) {
  //       return 39; // This is BP.39
  //     }
  //     if (text.toLowerCase().includes("how will you expand to new markets")) {
  //       return 40; // This is BP.40
  //     }
  //     if (text.toLowerCase().includes("what partnerships or strategic alliances could accelerate")) {
  //       return 41; // This is BP.41
  //     }
  //     if (text.toLowerCase().includes("what are the biggest risks and challenges")) {
  //       return 42; // This is BP.42
  //     }
  //     if (text.toLowerCase().includes("what contingency plans do you have")) {
  //       return 43; // This is BP.43
  //     }
  //     if (text.toLowerCase().includes("what is your biggest concern or fear about launching")) {
  //       return 44; // This is BP.44
  //     }
  //     if (text.toLowerCase().includes("what additional considerations or final thoughts")) {
  //       return 45; // This is BP.45
  //     }
  //     // Add fallback for Business Plan questions that might not have tags
  //     if (progress.phase === "BUSINESS_PLAN" && text.includes("?") && !text.toLowerCase().includes('congratulations')) {
  //       // Try to determine question number from context or history
  //       const historyLength = history.length;
  //       if (historyLength >= 0 && historyLength < 45) {
  //         return historyLength + 1; // Business Plan starts from question 1
  //       }
  //     }
  //   }
    
  //   return null;
  // };

  // 🔄 UPDATE PHASE TRACKER
  // Call this whenever we set a new question number
  const updateQuestionTracker = (phase: string, questionNumber: number | null) => {
    if (questionNumber !== null) {
      setPhaseQuestionTracker(prev => {
        // Reset counter if phase changed
        if (prev.currentPhase !== phase) {
          console.log("🔄 Phase changed from", prev.currentPhase, "to", phase, "- resetting tracker");
          return {
            currentPhase: phase,
            questionCount: 1,
            lastQuestionNumber: questionNumber,
          };
        }
        
        // Update counter for same phase
        return {
          ...prev,
          questionCount: prev.questionCount + 1,
          lastQuestionNumber: questionNumber,
        };
      });
    }
  };

  // Dedicated function to clean up Angel introduction text
  const cleanAngelIntroductionText = (text: string): string => {
    if (!text.toLowerCase().includes('welcome to founderport')) {
      return text;
    }
    
    let cleaned = text;
    
    // Aggressively clean up spacing around the journey question
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n"); // Replace 3+ newlines with 2
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, "\n\n"); // Remove empty lines between content
    
    // Multiple patterns to catch various spacing scenarios around the journey question
    cleaned = cleaned.replace(/\s*\n\s*\n\s*Are you ready to begin your journey\?\s*\n\s*\n\s*/g, "\n\nAre you ready to begin your journey?\n\n");
    cleaned = cleaned.replace(/\n\s*\n\s*\n\s*Are you ready to begin your journey\?\s*\n\s*\n\s*\n/g, "\n\nAre you ready to begin your journey?\n\n");
    cleaned = cleaned.replace(/\n{2,}\s*Are you ready to begin your journey\?\s*\n{2,}/g, "\n\nAre you ready to begin your journey?\n\n");
    cleaned = cleaned.replace(/\n\s*\n\s*Are you ready to begin your journey\?\s*\n\s*\n\s*\n/g, "\n\nAre you ready to begin your journey?\n\n");
    
    // Clean up spacing around the questionnaire introduction
    cleaned = cleaned.replace(/\n\s*\n\s*Let's start with the Getting to Know You questionnaire/g, "\n\nLet's start with the Getting to Know You questionnaire");
    
    return cleaned;
  };

  const formatAngelMessage = (text: string | any): string => {
    // Ensure we have a string to work with
    if (typeof text !== 'string') {
      console.warn('formatAngelMessage received non-string input:', text);
      return String(text || '');
    }
    
    // Remove machine tags
    let formatted = text.replace(/\[\[Q:[A-Z_]+\.\d{2}]]\s*/g, "");

    // ── Section summaries: preserve full markdown for ReactMarkdown rendering ──
    const isSectionSummary =
      /Section Complete/i.test(formatted) ||
      (/Summary of Your Information/i.test(formatted) && /Educational Insights|Critical Considerations/i.test(formatted));

    if (isSectionSummary) {
      // Only do light cleanup — keep **bold**, bullets, numbered lists intact
      formatted = formatted.replace(/\[\[ACCEPT_MODIFY_BUTTONS\]\]/g, '');
      formatted = formatted.replace(/\n{3,}/g, "\n\n");
      return formatted.trim();
    }

    // ── Regular messages: aggressive formatting cleanup ──
    
    // Special handling for Angel introduction text
    if (formatted.toLowerCase().includes('welcome to founderport') && formatted.toLowerCase().includes('are you ready to begin your journey')) {
      formatted = formatted.replace(/\n{3,}/g, "\n\n");
      formatted = formatted.replace(/\n\s*\n\s*\n/g, "\n\n");
      formatted = formatted.replace(/\s*\n\s*\n\s*Are you ready to begin your journey\?\s*\n\s*\n\s*/g, "\n\nAre you ready to begin your journey?\n\n");
      formatted = formatted.replace(/\n\s*\n\s*\n\s*Are you ready to begin your journey\?\s*\n\s*\n\s*\n/g, "\n\nAre you ready to begin your journey?\n\n");
      formatted = formatted.replace(/\n{2,}\s*Are you ready to begin your journey\?\s*\n{2,}/g, "\n\nAre you ready to begin your journey?\n\n");
      formatted = formatted.replace(/\n\s*\n\s*Are you ready to begin your journey\?\s*\n\s*\n\s*\n/g, "\n\nAre you ready to begin your journey?\n\n");
    }

    // Preserve markdown bold (**text**) but remove other asterisks
    const boldPlaceholder = "___MARKDOWN_BOLD___";
    const boldMatches: string[] = [];
    formatted = formatted.replace(/\*\*([\s\S]+?)\*\*/g, (_match, content) => {
      boldMatches.push(content);
      return `${boldPlaceholder}${boldMatches.length - 1}${boldPlaceholder}`;
    });

    // Preserve markdown italic (*text*)
    const italicPlaceholder = "___MARKDOWN_ITALIC___";
    const italicMatches: string[] = [];
    formatted = formatted.replace(/\*([^\s*][^*]*?[^\s*])\*/g, (_match, content) => {
      italicMatches.push(content);
      return `${italicPlaceholder}${italicMatches.length - 1}${italicPlaceholder}`;
    });
    
    // Remove remaining stray asterisks
    formatted = formatted.replace(/\*+/g, "");
    
    // Restore markdown bold
    formatted = formatted.replace(new RegExp(`${boldPlaceholder}(\\d+)${boldPlaceholder}`, 'g'), (_match, index) => {
      return `**${boldMatches[parseInt(index)]}**`;
    });

    // Restore markdown italic
    formatted = formatted.replace(new RegExp(`${italicPlaceholder}(\\d+)${italicPlaceholder}`, 'g'), (_match, index) => {
      return `*${italicMatches[parseInt(index)]}*`;
    });

    // Remove ALL hashes
    formatted = formatted.replace(/#+/g, "");

    // Remove ALL dashes and similar symbols at start of lines or standalone
    formatted = formatted.replace(/^[-–—•]+\s*/gm, "");
    formatted = formatted.replace(/[-–—]{2,}/g, "");

    // Clean up bullet points - replace with simple dash
    formatted = formatted.replace(/^[•\-–—*]\s+/gm, "- ");

    // Clean up numbered lists - keep simple format
    formatted = formatted.replace(/^(\d+)\.\s+/gm, "$1. ");

    // Remove any remaining standalone formatting symbols
    formatted = formatted.replace(/^[*#\-–—•]+\s*$/gm, "");

    // Clean up excessive whitespace
    formatted = formatted.replace(/\n{3,}/g, "\n\n");
    formatted = formatted.replace(/\n\s*\n\s*\n/g, "\n\n");
    formatted = formatted.replace(/[ \t]{2,}/g, " ");
    
    // Compact spacing between numbered list items
    formatted = formatted.replace(/(\d+\.\s+[^\n]+)\n\n(\d+\.\s+)/g, "$1\n$2");
    
    // Remove excessive spacing around specific phrases
    formatted = formatted.replace(/\n{3,}\s*Are you ready to begin your journey\?\s*\n{3,}/g, "\n\nAre you ready to begin your journey?\n\n");
    formatted = formatted.replace(/\n\s*\n\s*\n\s*Are you ready to begin your journey\?\s*\n\s*\n\s*\n/g, "\n\nAre you ready to begin your journey?\n\n");
    formatted = formatted.replace(/\n\s*\n\s*Let's start with the Getting to Know You questionnaire/g, "\n\nLet's start with the Getting to Know You questionnaire");
    
    // Additional cleanup for Angel introduction text
    if (formatted.toLowerCase().includes('welcome to founderport')) {
      formatted = formatted.replace(/\n\s*\n\s*\n/g, "\n\n");
      formatted = formatted.replace(/\n{2,}\s*Are you ready to begin your journey\?\s*\n{2,}/g, "\n\nAre you ready to begin your journey?\n\n");
    }

    return formatted.trim();
  };

  const parseAngelReply = (raw: string): { acknowledgement: string; question: string } => {
    if (!raw || typeof raw !== 'string') return { acknowledgement: '', question: String(raw || '') };

    const text = raw.trim();

    const isSectionSummary =
      /Section Complete/i.test(text) ||
      (/Summary of Your Information/i.test(text) && /Educational Insights|Critical Considerations/i.test(text));
    if (isSectionSummary) return { acknowledgement: '', question: formatAngelMessage(text) };

    const isIntro =
      text.toLowerCase().includes('welcome to founderport') ||
      text.toLowerCase().includes("hello! i'm angel");
    if (isIntro) return { acknowledgement: '', question: formatAngelMessage(text) };

    const tagIndex = text.search(/\[\[Q:[A-Z_]+\.\d{2}\]\]/);
    if (tagIndex > 0) {
      const ack = text.slice(0, tagIndex).trim();
      const q = text.slice(tagIndex).trim();
      if (ack.length > 0) {
        return { acknowledgement: formatAngelMessage(ack), question: formatAngelMessage(q) };
      }
    }

    const questionOfMatch = text.search(/Question\s+\d+\s+of\s+\d+\s*:/i);
    if (questionOfMatch > 0) {
      const ack = text.slice(0, questionOfMatch).trim();
      const q = text.slice(questionOfMatch).trim();
      if (ack.length > 0) {
        return { acknowledgement: formatAngelMessage(ack), question: formatAngelMessage(q) };
      }
    }

    const paragraphs = text.split(/\n\s*\n/);
    if (paragraphs.length >= 2) {
      const boldQuestionIdx = paragraphs.findIndex(
        (p, i) => i > 0 && /\*\*[^*]{10,}\?\*\*/.test(p.trim())
      );
      if (boldQuestionIdx > 0) {
        const ack = paragraphs.slice(0, boldQuestionIdx).join('\n\n').trim();
        const q = paragraphs.slice(boldQuestionIdx).join('\n\n').trim();
        if (ack.length > 0 && q.length > 0) {
          return { acknowledgement: formatAngelMessage(ack), question: formatAngelMessage(q) };
        }
      }
    }

    return { acknowledgement: '', question: formatAngelMessage(text) };
  };

  // Format questions with bold styling and spacing
  const formatQuestionText = (text: string): string => {
    if (typeof text !== 'string') {
      return String(text || '');
    }

    // Remove machine tags
    let formatted = text.replace(/\[\[Q:[A-Z_]+\.\d{2}]]\s*/g, "");
    
    // Special handling for Angel introduction text
    if (formatted.toLowerCase().includes('welcome to founderport') && formatted.toLowerCase().includes('are you ready to begin your journey')) {
      // Aggressively clean up spacing around the journey question
      formatted = formatted.replace(/\n{3,}/g, "\n\n"); // Replace 3+ newlines with 2
      formatted = formatted.replace(/\n\s*\n\s*\n/g, "\n\n"); // Remove empty lines between content
      formatted = formatted.replace(/\s*\n\s*\n\s*Are you ready to begin your journey\?\s*\n\s*\n\s*/g, "\n\nAre you ready to begin your journey?\n\n");
      
      // Additional specific cleanup for the journey question - be very aggressive
      formatted = formatted.replace(/\n\s*\n\s*\n\s*Are you ready to begin your journey\?\s*\n\s*\n\s*\n/g, "\n\nAre you ready to begin your journey?\n\n");
      formatted = formatted.replace(/\n{2,}\s*Are you ready to begin your journey\?\s*\n{2,}/g, "\n\nAre you ready to begin your journey?\n\n");
      formatted = formatted.replace(/\n\s*\n\s*Are you ready to begin your journey\?\s*\n\s*\n\s*\n/g, "\n\nAre you ready to begin your journey?\n\n");
    }

    // Preserve markdown bold (**text**) but remove other asterisks
    // First, temporarily replace markdown bold with a placeholder
    const boldPlaceholder = "___MARKDOWN_BOLD___";
    const boldMatches: string[] = [];
    formatted = formatted.replace(/\*\*([\s\S]+?)\*\*/g, (_match, content) => {
      boldMatches.push(content);
      return `${boldPlaceholder}${boldMatches.length - 1}${boldPlaceholder}`;
    });

    // Preserve markdown italic (*text*) — single asterisks for quotes/emphasis
    const italicPlaceholder = "___MARKDOWN_ITALIC___";
    const italicMatches: string[] = [];
    formatted = formatted.replace(/\*([^\s*][^*]*?[^\s*])\*/g, (_match, content) => {
      italicMatches.push(content);
      return `${italicPlaceholder}${italicMatches.length - 1}${italicPlaceholder}`;
    });
    
    // Remove remaining stray asterisks
    formatted = formatted.replace(/\*+/g, "");
    
    // Restore markdown bold
    formatted = formatted.replace(new RegExp(`${boldPlaceholder}(\\d+)${boldPlaceholder}`, 'g'), (_match, index) => {
      return `**${boldMatches[parseInt(index)]}**`;
    });

    // Restore markdown italic
    formatted = formatted.replace(new RegExp(`${italicPlaceholder}(\\d+)${italicPlaceholder}`, 'g'), (_match, index) => {
      return `*${italicMatches[parseInt(index)]}*`;
    });

    // Remove ALL hashes
    formatted = formatted.replace(/#+/g, "");

    // Remove ALL dashes and similar symbols at start of lines or standalone
    formatted = formatted.replace(/^[-–—•]+\s*/gm, "");
    formatted = formatted.replace(/[-–—]{2,}/g, "");

    // Clean up bullet points - replace with simple dash
    formatted = formatted.replace(/^[•\-–—*]\s+/gm, "- ");

    // Clean up numbered lists - keep simple format
    formatted = formatted.replace(/^(\d+)\.\s+/gm, "$1. ");

    // Remove any remaining standalone formatting symbols
    formatted = formatted.replace(/^[*#\-–—•]+\s*$/gm, "");

    // Clean up excessive whitespace - be more aggressive with line breaks
    formatted = formatted.replace(/\n{3,}/g, "\n\n");
    formatted = formatted.replace(/\n\s*\n\s*\n/g, "\n\n"); // Remove empty lines between content
    formatted = formatted.replace(/[ \t]{2,}/g, " ");
    
    // Remove excessive spacing around specific phrases - be more aggressive
    formatted = formatted.replace(/\n{3,}\s*Are you ready to begin your journey\?\s*\n{3,}/g, "\n\nAre you ready to begin your journey?\n\n");
    formatted = formatted.replace(/\n\s*\n\s*\n\s*Are you ready to begin your journey\?\s*\n\s*\n\s*\n/g, "\n\nAre you ready to begin your journey?\n\n");
    formatted = formatted.replace(/\n\s*\n\s*Let's start with the Getting to Know You questionnaire/g, "\n\nLet's start with the Getting to Know You questionnaire");
    
    // Additional cleanup for Angel introduction text
    if (formatted.toLowerCase().includes('welcome to founderport')) {
      // Clean up excessive spacing in the introduction
      formatted = formatted.replace(/\n\s*\n\s*\n/g, "\n\n"); // Remove triple+ line breaks
      formatted = formatted.replace(/\n{2,}\s*Are you ready to begin your journey\?\s*\n{2,}/g, "\n\nAre you ready to begin your journey?\n\n");
    }

    // Remove rating options and instructions for skills question
    if (formatted.toLowerCase().includes('how comfortable are you with these business skills')) {
      // Remove the rating instructions and options
      formatted = formatted.replace(/Rate each skill from 1 to 5.*?5 = Very comfortable/gs, '');
      formatted = formatted.replace(/\*\*📋 Business Planning\*\*.*?🔘 ○ ○ ○ ○/gs, '');
      formatted = formatted.replace(/\*\*💰 Financial Modeling\*\*.*?🔘 ○ ○ ○ ○/gs, '');
      formatted = formatted.replace(/\*\*⚖️ Legal Formation\*\*.*?🔘 ○ ○ ○ ○/gs, '');
      formatted = formatted.replace(/\*\*📢 Marketing\*\*.*?🔘 ○ ○ ○ ○/gs, '');
      formatted = formatted.replace(/\*\*🚚 Operations\/Logistics\*\*.*?🔘 ○ ○ ○ ○/gs, '');
      formatted = formatted.replace(/\*\*💻 Technology\/Infrastructure\*\*.*?🔘 ○ ○ ○ ○/gs, '');
      formatted = formatted.replace(/\*\*💼 Fundraising\/Investor Outreach\*\*.*?🔘 ○ ○ ○ ○/gs, '');
      formatted = formatted.replace(/\*\*Super Easy Response:\*\*.*?\(One number for each skill in order\)/gs, '');
      formatted = formatted.replace(/\*\*What the numbers mean:\*\*.*?5 = Very comfortable/gs, '');
      formatted = formatted.replace(/1\s+2\s+3\s+4\s+5/g, '');
      formatted = formatted.replace(/🔘\s*○\s*○\s*○\s*○/g, '');
      
      // Remove additional patterns that might appear
      formatted = formatted.replace(/📋 Business Planning\s*/g, '');
      formatted = formatted.replace(/💰 Financial Modeling\s*/g, '');
      formatted = formatted.replace(/⚖️ Legal Formation\s*/g, '');
      formatted = formatted.replace(/📢 Marketing\s*/g, '');
      formatted = formatted.replace(/🚚 Operations\/Logistics\s*/g, '');
      formatted = formatted.replace(/💻 Technology\/Infrastructure\s*/g, '');
      formatted = formatted.replace(/💼 Fundraising\/Investor Outreach\s*/g, '');
      formatted = formatted.replace(/Super Easy Response:\s*Just type:.*?\n/g, '');
      formatted = formatted.replace(/If yes: Can you describe it briefly\?/g, '');
      
      // Remove the rating circles pattern
      formatted = formatted.replace(/○\s*○\s*○\s*○\s*○\s*/g, '');
      formatted = formatted.replace(/\n\s*○\s*○\s*○\s*○\s*○\s*\n/g, '\n');
      
      // Remove text-based rating displays like "○ Business Planning: ○ Marketing: ○ Financial Management: ○ Operations: ○ Leadership:"
      formatted = formatted.replace(/○\s*Business Planning:\s*○\s*Marketing:\s*○\s*Financial Management:\s*○\s*Operations:\s*○\s*Leadership:/g, '');
      formatted = formatted.replace(/○\s*[^:]+:\s*(○\s*[^:]+:\s*)*○\s*[^:]+:/g, '');
      formatted = formatted.replace(/○\s*[A-Za-z\s]+:\s*/g, '');
      
      // Remove numbered list patterns like "1. Business planning 2. Financial management..."
      formatted = formatted.replace(/\d+\.\s*[A-Za-z\s]+\s*2\.\s*[A-Za-z\s]+\s*3\.\s*[A-Za-z\s]+\s*4\.\s*[A-Za-z\s]+\s*5\.\s*[A-Za-z\s]+/g, '');
      formatted = formatted.replace(/\d+\.\s*[A-Za-z\s]+/g, '');
      
      // Remove specific patterns like "1. Business planning\n2. Financial management\n3. Marketing strategies\n4. Sales techniques\n5. Operations management"
      formatted = formatted.replace(/1\.\s*Business planning\s*2\.\s*Financial management\s*3\.\s*Marketing strategies\s*4\.\s*Sales techniques\s*5\.\s*Operations management/g, '');
      formatted = formatted.replace(/1\.\s*Business planning\s*\n\s*2\.\s*Financial management\s*\n\s*3\.\s*Marketing strategies\s*\n\s*4\.\s*Sales techniques\s*\n\s*5\.\s*Operations management/g, '');
      
      // Remove standalone circles pattern "○ ○ ○ ○ ○"
      formatted = formatted.replace(/○\s*○\s*○\s*○\s*○/g, '');
    }

    // Remove multiple choice options for all questions
    // Remove communication style options
    if (formatted.toLowerCase().includes('what is your preferred communication style') || 
        formatted.toLowerCase().includes('choose the style that feels most natural')) {
      formatted = formatted.replace(/Choose the style that feels most natural to you:.*?Simply type your choice:.*?Structured/gs, '');
      formatted = formatted.replace(/🟢 Conversational Q&A.*?Great for comprehensive planning/gs, '');
      formatted = formatted.replace(/🟡 Structured Form-based.*?Great for comprehensive planning/gs, '');
      formatted = formatted.replace(/Simply type your choice:.*?Structured/gs, '');
    }

    // Remove funding options
    if (formatted.toLowerCase().includes('are you planning to seek outside funding in the future')) {
      formatted = formatted.replace(/Yes\s*No\s*Unsure/g, '');
      formatted = formatted.replace(/\n\s*(Yes|No|Unsure)\s*\n/g, '\n');
    }

    // Remove Angel preference options
    if (formatted.toLowerCase().includes('would you like angel to:')) {
      formatted = formatted.replace(/Be more hands-on.*?Alternate based on the task/gs, '');
      formatted = formatted.replace(/\n\s*(Be more hands-on|Be more of a mentor|Alternate based on the task)\s*\n/g, '\n');
    }

    // Remove service provider options
    if (formatted.toLowerCase().includes('do you want to connect with service providers')) {
      formatted = formatted.replace(/Yes\s*No\s*Later/g, '');
      formatted = formatted.replace(/\n\s*(Yes|No|Later)\s*\n/g, '\n');
    }

    // Remove general option patterns
    formatted = formatted.replace(/Feel free to provide your comfort level for each skill!/g, '');
    formatted = formatted.replace(/Choose the style that feels most natural to you:/g, '');
    formatted = formatted.replace(/Simply type your choice:/g, '');

    // Find and format questions (sentences ending with ?)
    // Look for question patterns in the text
    const questionPatterns = [
      // GKY Questions
      /(What's your name and preferred name or nickname\?)/gi,
      /(What is your preferred communication style\?)/gi,
      /(Have you started a business before\?)/gi,
      /(What's your current work situation\?)/gi,
      /(Do you already have a business idea in mind\?)/gi,
      /(Have you shared your business idea with anyone yet\?)/gi,
      /(Have you shared any of your previous ideas or concepts with others\?)/gi,
      /(How comfortable are you with these business skills\?)/gi,
      /(What kind of business are you trying to build\?)/gi,
      /(What motivates you to start this business\?)/gi,
      /(Where will your business operate\?)/gi,
      /(What industry does your business fall into\?)/gi,
      /(What industry does your business fall into \(or closely resemble\)\?)/gi,
      /(Do you have any initial funding available\?)/gi,
      /(Are you planning to seek outside funding in the future\?)/gi,
      /(How do you plan to generate revenue\?)/gi,
      /(Will your business be primarily:)/gi,
      /(Have you shared your business idea with anyone yet \(friends, potential customers, advisors\)\?)/gi,
      /(Have you shared any of your previous ideas or concepts with others \(friends, potential customers, advisors\)\?)/gi,
      
      // Business Plan Questions
      /(What is your business name\?)/gi,
      /(What is your business tagline or mission statement\?)/gi,
      /(What problem does your business solve\?)/gi,
      /(What makes your business unique\?)/gi,
      /(Describe your core product or service in detail\?)/gi,
      /(What are the key features and benefits of your product\/service\?)/gi,
      /(Do you have any intellectual property \(patents, trademarks, copyrights\) or proprietary technology\?)/gi,
      /(What is your product development timeline\?)/gi,
      /(Who is your target market\?)/gi,
      /(What is the size of your target market\?)/gi,
      /(Who are your main competitors\?)/gi,
      /(How is your target market currently solving this problem\?)/gi,
      /(Where will your business be located\?)/gi,
      /(What are your space and facility requirements\?)/gi,
      /(What are your short-term operational needs\?)/gi,
      /(What suppliers or vendors will you need\?)/gi,
      /(What are your staffing needs\?)/gi,
      /(How will you price your product\/service\?)/gi,
      /(What are your projected sales for the first year\?)/gi,
      /(What are your estimated startup costs\?)/gi,
      /(What are your estimated monthly operating expenses\?)/gi,
      /(When do you expect to break even\?)/gi,
      /(How much funding do you need to get started\?)/gi,
      /(What are your financial projections for years 1-3\?)/gi,
      /(How will you track and manage your finances\?)/gi,
      /(How will you reach your target customers\?)/gi,
      /(What is your sales process\?)/gi,
      /(What is your customer acquisition cost\?)/gi,
      /(What is your customer lifetime value\?)/gi,
      /(How will you build brand awareness and credibility in your market\?)/gi,
      /(What partnerships or collaborations could help you reach more customers\?)/gi,
      /(What business structure will you use \(LLC, Corporation, etc\.\)\?)/gi,
      /(What licenses and permits do you need\?)/gi,
      /(What insurance coverage do you need\?)/gi,
      /(How will you protect your intellectual property\?)/gi,
      /(What contracts and agreements will you need\?)/gi,
      /(How will you handle taxes and compliance\?)/gi,
      /(What data privacy and security measures will you implement\?)/gi,
      /(What are the key milestones you hope to achieve in the first year of your business\?)/gi,
      /(What additional products or services could you offer in the future\?)/gi,
      /(How will you expand to new markets or customer segments\?)/gi,
      /(What partnerships or strategic alliances could accelerate your growth\?)/gi,
      /(What are the biggest risks and challenges your business might face\?)/gi,
      /(What contingency plans do you have for major risks or setbacks\?)/gi,
      /(What is your biggest concern or fear about launching this business\?)/gi,
      /(What additional considerations or final thoughts do you have about your business plan\?)/gi
    ];

    // Apply question formatting with enhanced spacing using HTML breaks
    questionPatterns.forEach(pattern => {
      formatted = formatted.replace(pattern, (match) => {
        return `\n\n<br/><br/>**${match}**<br/><br/>\n\n`;
      });
    });

    // Also check for any remaining sentences ending with ? that weren't caught by patterns
    const lines = formatted.split('\n');
    const formattedLines = lines.map(line => {
      const trimmedLine = line.trim();
      // Check if line ends with ? and is a standalone question (not part of a longer sentence)
      if (trimmedLine.endsWith('?') && trimmedLine.length < 300 && !trimmedLine.includes('**')) {
        return `\n\n<br/><br/>**${trimmedLine}**<br/><br/>\n\n`;
      }
      return line;
    });

    // Additional pass to catch any remaining questions in the text
    let finalFormatted = formattedLines.join('\n');
    
    // Look for any remaining questions that might have been missed
    const questionRegex = /([^.!?]*\?[^.!?]*)/g;
    finalFormatted = finalFormatted.replace(questionRegex, (match) => {
      const trimmed = match.trim();
      if (trimmed.length > 10 && trimmed.length < 300 && !trimmed.includes('**') && !trimmed.includes('💡') && !trimmed.includes('🎯')) {
        return `\n\n<br/><br/>**${trimmed}**<br/><br/>\n\n`;
      }
      return match;
    });

    // Final cleanup - preserve question spacing but clean up excessive whitespace elsewhere
    let finalCleanup = finalFormatted;
    
    // Clean up excessive line breaks but preserve HTML breaks around questions
    finalCleanup = finalCleanup.replace(/\n{4,}/g, '\n\n');
    
    // Clean up excessive whitespace in non-question areas
    finalCleanup = finalCleanup.replace(/[ \t]{2,}/g, ' ');
    
    finalCleanup = finalCleanup.trim();
    
    // Remove any remaining option indicators
    finalCleanup = finalCleanup.replace(/○\s*○\s*○\s*○\s*○/g, '');
    finalCleanup = finalCleanup.replace(/🟢\s*/g, '');
    finalCleanup = finalCleanup.replace(/🟡\s*/g, '');
    finalCleanup = finalCleanup.replace(/🔘\s*/g, '');
    
    // Remove text-based rating displays
    finalCleanup = finalCleanup.replace(/○\s*[A-Za-z\s]+:\s*/g, '');
    finalCleanup = finalCleanup.replace(/○\s*[^:]+:\s*(○\s*[^:]+:\s*)*/g, '');
    
    // Remove numbered skill lists
    finalCleanup = finalCleanup.replace(/\d+\.\s*[A-Za-z\s]+/g, '');
    finalCleanup = finalCleanup.replace(/\d+\.\s*[A-Za-z\s]+\s*2\.\s*[A-Za-z\s]+\s*3\.\s*[A-Za-z\s]+\s*4\.\s*[A-Za-z\s]+\s*5\.\s*[A-Za-z\s]+/g, '');
    
    // Remove specific skill list patterns
    finalCleanup = finalCleanup.replace(/1\.\s*Business planning\s*2\.\s*Financial management\s*3\.\s*Marketing strategies\s*4\.\s*Sales techniques\s*5\.\s*Operations management/g, '');
    finalCleanup = finalCleanup.replace(/1\.\s*Business planning\s*\n\s*2\.\s*Financial management\s*\n\s*3\.\s*Marketing strategies\s*\n\s*4\.\s*Sales techniques\s*\n\s*5\.\s*Operations management/g, '');
    
    // Remove standalone circles
    finalCleanup = finalCleanup.replace(/○\s*○\s*○\s*○\s*○/g, '');
    
    // Remove standalone option words
    finalCleanup = finalCleanup.replace(/^\s*(Yes|No|Unsure|Later|Conversational|Structured)\s*$/gm, '');
    finalCleanup = finalCleanup.replace(/^\s*(Be more hands-on|Be more of a mentor|Alternate based on the task)\s*$/gm, '');
    
    // Clean up excessive whitespace again
    finalCleanup = finalCleanup.replace(/\n{3,}/g, '\n\n');
    finalCleanup = finalCleanup.replace(/[ \t]{2,}/g, ' ');
    
    return finalCleanup.trim();
  };



  // Get options for multiple choice questions
  const getMultipleChoiceOptions = (text: string): string[] => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('what is your preferred communication style')) {
      return ['Conversational', 'Structured'];
    }
    if (lowerText.includes('what\'s your current work situation')) {
      return ['Full-time employed', 'Part-time', 'Student', 'Unemployed', 'Self-employed/freelancer', 'Other'];
    }
    if (lowerText.includes('what kind of business are you trying to build')) {
      return ['Side hustle', 'Small business', 'Scalable startup', 'Nonprofit/social venture', 'Other'];
    }
    if (lowerText.includes('do you have any initial funding available')) {
      return ['None', 'Personal savings', 'Friends/family', 'External funding (loan, investor)', 'Other'];
    }
    if (lowerText.includes('are you planning to seek outside funding in the future')) {
      return ['Yes', 'No', 'Unsure'];
    }
    if (lowerText.includes('would you like angel to:')) {
      return ['Be more hands-on (do more tasks for you)', 'Be more of a mentor (guide but let you take the lead)', 'Alternate based on the task'];
    }
    if (lowerText.includes('do you want to connect with service providers')) {
      return ['Yes', 'No', 'Later'];
    }
    if (lowerText.includes('how do you plan to generate revenue')) {
      return ['Product sales', 'Service fees', 'Subscription/membership', 'Advertising revenue', 'Commission/fees', 'Licensing', 'Consulting', 'Other'];
    }
    if (lowerText.includes('will your business be primarily:')) {
      return ['Online only', 'Physical location only', 'Both online and physical', 'Unsure'];
    }
    if (lowerText.includes('how comfortable are you with your business information being kept completely private')) {
      return ['Very important - complete privacy', 'Somewhat important', 'Not very important', 'I\'m open to networking opportunities'];
    }
    if (lowerText.includes('would you like me to be proactive in suggesting next steps and improvements throughout our process')) {
      return ['Yes, please be proactive', 'Only when I ask', 'Let me decide each time'];
    }
    
    return [];
  };

  // Skills rating component
  // const SkillsRatingComponent = () => {
  //   const [ratings, setRatings] = useState<{[key: string]: number}>({});
    
  //   const skills = [
  //     { key: 'business_planning', label: '📋 Business Planning', emoji: '📋' },
  //     { key: 'financial_modeling', label: '💰 Financial Modeling', emoji: '💰' },
  //     { key: 'legal_formation', label: '⚖️ Legal Formation', emoji: '⚖️' },
  //     { key: 'marketing', label: '📢 Marketing', emoji: '📢' },
  //     { key: 'operations', label: '🚚 Operations/Logistics', emoji: '🚚' },
  //     { key: 'technology', label: '💻 Technology/Infrastructure', emoji: '💻' },
  //     { key: 'fundraising', label: '💼 Fundraising/Investor Outreach', emoji: '💼' }
  //   ];

  //   const handleRatingChange = (skill: string, rating: number) => {
  //     setRatings(prev => ({ ...prev, [skill]: rating }));
  //   };

  //   const handleSubmit = () => {
  //     const ratingString = skills.map(skill => ratings[skill.key] || 0).join(', ');
  //     handleNext(ratingString);
  //   };

  //   return (
  //     <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
  //       <div className="mb-4">
  //         <h3 className="text-lg font-semibold text-gray-800 mb-2">Rate Your Comfort Level</h3>
  //         <p className="text-sm text-gray-600 mb-4">
  //           Rate each skill from 1 to 5 (where 1 = not comfortable, 5 = very comfortable)
  //         </p>
  //       </div>
        
  //       <div className="space-y-4">
  //         {skills.map((skill) => (
  //           <div key={skill.key} className="bg-white p-4 rounded-lg border border-gray-200">
  //             <div className="flex items-center justify-between mb-3">
  //               <span className="font-medium text-gray-800">{skill.label}</span>
  //               <span className="text-sm text-gray-500">
  //                 {ratings[skill.key] ? `${ratings[skill.key]}/5` : 'Not rated'}
  //               </span>
  //             </div>
              
  //             <div className="flex items-center space-x-2">
  //               {[1, 2, 3, 4, 5].map((rating) => (
  //                 <button
  //                   key={rating}
  //                   onClick={() => handleRatingChange(skill.key, rating)}
  //                   className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
  //                     ratings[skill.key] === rating
  //                       ? 'bg-blue-500 border-blue-500 text-white shadow-lg transform scale-110'
  //                       : 'bg-white border-gray-300 text-gray-400 hover:border-blue-300 hover:text-blue-500'
  //                   }`}
  //                 >
  //                   {rating}
  //                 </button>
  //               ))}
  //             </div>
              
  //             <div className="mt-2 text-xs text-gray-500">
  //               {ratings[skill.key] === 1 && 'Not comfortable at all'}
  //               {ratings[skill.key] === 2 && 'Slightly uncomfortable'}
  //               {ratings[skill.key] === 3 && 'Somewhat comfortable'}
  //               {ratings[skill.key] === 4 && 'Quite comfortable'}
  //               {ratings[skill.key] === 5 && 'Very comfortable'}
  //             </div>
  //           </div>
  //         ))}
  //       </div>
        
  //       <div className="mt-6 flex justify-center">
  //         <button
  //           onClick={handleSubmit}
  //           disabled={Object.keys(ratings).length < 7}
  //           className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
  //         >
  //           Submit Ratings
  //         </button>
  //       </div>
        
  //       <div className="mt-4 text-center">
  //         <p className="text-xs text-gray-500">
  //           💡 Quick tip: You can also type your ratings like "3, 2, 1, 4, 3, 2, 1"
  //         </p>
  //       </div>
  //     </div>
  //   );
  // };

  // Multiple choice component
  // const MultipleChoiceComponent = ({ options }: { options: string[] }) => {
  //   const [selectedOption, setSelectedOption] = useState<string>('');

  //   const handleOptionSelect = (option: string) => {
  //     setSelectedOption(option);
  //     handleNext(option);
  //   };

  //   return (
  //     <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
  //       <div className="mb-4">
  //         <h3 className="text-lg font-semibold text-gray-800 mb-2">Choose Your Answer</h3>
  //         <p className="text-sm text-gray-600">Select the option that best describes your situation:</p>
  //       </div>
        
  //       <div className="space-y-3">
  //         {options.map((option, index) => (
  //           <button
  //             key={index}
  //             onClick={() => handleOptionSelect(option)}
  //             className="w-full p-4 text-left bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-md"
  //           >
  //             <div className="flex items-center justify-between">
  //               <span className="font-medium text-gray-800">{option}</span>
  //               <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
  //                 {selectedOption === option && (
  //                   <div className="w-3 h-3 rounded-full bg-green-500"></div>
  //                 )}
  //               </div>
  //             </div>
  //           </button>
  //         ))}
  //       </div>
        
  //       <div className="mt-4 text-center">
  //         <p className="text-xs text-gray-500">
  //           💡 Click on any option to select it
  //         </p>
  //       </div>
  //     </div>
  //   );
  // };

  // Auto-focus input after response is sent
  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading]);

  // Enhanced scroll behavior with smooth animations
  useEffect(() => {
    if (!chatContainerRef.current || !currentQuestion) return;
    
    // CRITICAL: Check if this is the very first intro message
    // Most reliable indicator: history.length === 0 (no conversation history yet)
    // Also check: GKY phase and answered <= 1 (initial question might be counted as answered: 1)
    const isFirstQuestionInNewVenture = (
        history.length === 0 && 
        progress.phase === 'GKY' &&
      progress.answered <= 1  // Changed from === 0 to <= 1 to handle initial question being counted
    );
    
    // Secondary check: Question contains intro-related text
    const questionLower = currentQuestion.toLowerCase();
    const hasIntroText = (
      questionLower.includes('welcome') ||
      questionLower.includes('founderport') ||
      questionLower.includes("angel") ||
      questionLower.includes("journey") ||
      questionLower.includes("getting to know you") ||
      questionLower.includes("questionnaire")
    );
    
    // If it's the first question in a new venture, NEVER scroll
    if (isFirstQuestionInNewVenture) {
      isInitialIntroShown.current = true;
      console.log('📜 FIRST INTRO DETECTED - NO SCROLL ALLOWED', {
        historyLength: history.length,
        phase: progress.phase,
        answered: progress.answered,
        hasIntroText: hasIntroText,
        questionPreview: currentQuestion.substring(0, 100)
      });
      
      // IMMEDIATELY lock scroll to top - no delays, no animations
      chatContainerRef.current.scrollTop = 0;
      
      // Also prevent any delayed scrolls by checking again after render
      // Use more lenient check: history.length === 0 is the key indicator
      setTimeout(() => {
        if (chatContainerRef.current && history.length === 0 && progress.phase === 'GKY') {
          chatContainerRef.current.scrollTop = 0;
          console.log('📜 Re-locked scroll to TOP after render (100ms)');
        }
      }, 100);
      
      // Additional check after a longer delay to catch any late scrolls
      setTimeout(() => {
        if (chatContainerRef.current && history.length === 0 && progress.phase === 'GKY') {
          chatContainerRef.current.scrollTop = 0;
          console.log('📜 Re-locked scroll to TOP after render (300ms)');
        }
      }, 300);
      
      // One more check after content fully renders
      setTimeout(() => {
        if (chatContainerRef.current && history.length === 0 && progress.phase === 'GKY') {
          chatContainerRef.current.scrollTop = 0;
          console.log('📜 Re-locked scroll to TOP after render (500ms)');
        }
      }, 500);
      
      // CRITICAL: Return early - do NOT execute any scroll logic below
      return;
    }
    
    // Also check the ref - if we've shown the intro and user hasn't answered yet, don't scroll
    // Use history.length === 0 as primary check (most reliable)
    if (isInitialIntroShown.current && history.length === 0 && progress.phase === 'GKY') {
      chatContainerRef.current.scrollTop = 0;
      console.log('📜 Using ref check: Preventing scroll during initial intro');
      return;
    }
    
    // Reset the ref once user starts answering (history has items)
    if (history.length > 0) {
      isInitialIntroShown.current = false;
    }
    
    // FINAL SAFEGUARD: If history is still empty and we're in GKY, this is definitely the intro
    // Prevent ALL scrolling regardless of other checks
    if (history.length === 0 && progress.phase === 'GKY') {
      chatContainerRef.current.scrollTop = 0;
      console.log('📜 FINAL SAFEGUARD: Preventing scroll - intro message detected');
      return;
    }
      
      // Detect any phase transition or intro messages
    // IMPORTANT: Make these checks more specific to avoid matching intro text that just mentions phases
    // Only match actual transition messages, not descriptions of phases
      const isPhaseTransition = (
      // Check for actual transition phrases, not just phase mentions
      (questionLower.includes('moving into') && (questionLower.includes('phase 2') || questionLower.includes('phase 3') || questionLower.includes('phase 4'))) ||
        questionLower.includes('ready to dive into your business planning') ||
      questionLower.includes('now moving into') ||
      questionLower.includes('transitioning to') ||
      questionLower.includes('entering phase 2') ||
      questionLower.includes('entering phase 3') ||
      questionLower.includes('entering phase 4') ||
      // Only match "business planning phase" if it's an actual transition, not a description
      (questionLower.includes('business planning phase') && (questionLower.includes('starting') || questionLower.includes('beginning') || questionLower.includes('moving')))
      );
      
      // Business Plan phase started - always scroll to bottom
    // BUT: Don't scroll if it's still the intro (history.length === 0)
    const isBusinessPlanPhase = progress.phase === 'BUSINESS_PLAN' && history.length > 0;
    
    if ((isPhaseTransition || isBusinessPlanPhase) && history.length > 0) {
        // For phase transitions and business plan questions, ALWAYS scroll to bottom
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
              top: chatContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
            console.log('📜 Smooth scrolled to BOTTOM for phase transition/business plan');
          }
        }, 150); // Increased delay to ensure content is fully rendered
      } else {
        // Normal conversation flow - scroll to bottom with smooth animation
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
              top: chatContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
            console.log('📜 Smooth scrolled to BOTTOM for conversation flow');
          }
        }, 50);
    }
  }, [history, currentQuestion, progress.phase, progress.answered]);

  // Auto-scroll to show user message + loader when user sends a message
  useEffect(() => {
    if (pendingUserReply && chatContainerRef.current) {
      if (history.length === 0 && progress.phase === 'GKY') return;
      const timer = setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [pendingUserReply, history.length, progress.phase]);

  // Use useEffect to navigate to roadmap page when roadmap is generated
  useEffect(() => {
    if (roadmapData && roadmapData.isGenerated && !planState.showModal && sessionId) {
      // Navigate to roadmap page instead of opening modal
      navigate(`/ventures/${sessionId}/roadmap`);
    }
  }, [roadmapData, planState.showModal, sessionId, navigate]);

  // Handle phase transitions with smooth scrolling
  useEffect(() => {
    if (progress.phase && chatContainerRef.current) {
      // CRITICAL: Do NOT scroll during initial GKY intro - let user read it
      // Use history.length === 0 as primary check (most reliable indicator)
      if (progress.phase === "GKY" && history.length === 0) {
        console.log('📜 NO SCROLL - Initial GKY intro phase, user should read naturally', {
          phase: progress.phase,
          answered: progress.answered,
          historyLength: history.length
        });
        // Also lock scroll to top here as backup
        chatContainerRef.current.scrollTop = 0;
        return;
      }
      
      // Detect phase changes and ensure smooth scroll to bottom
      const currentPhase = progress.phase;
      
      if (currentPhase === "BUSINESS_PLAN" && progress.answered === 0) {
        // New business planning phase - scroll to bottom with animation
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
              top: chatContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
            console.log('📜 Smooth scrolled to bottom for new business planning phase (useEffect)');
          }
        }, 600); // Increased delay to ensure this happens after other effects
      } else if (currentPhase === "ROADMAP" && progress.answered === 0) {
        // New roadmap phase - scroll to bottom with animation
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
              top: chatContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
            console.log('📜 Smooth scrolled to bottom for new roadmap phase (useEffect)');
          }
        }, 600); // Increased delay to ensure this happens after other effects
      } else if (currentPhase === "IMPLEMENTATION" && progress.answered === 0) {
        // New implementation phase - scroll to bottom with animation
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
              top: chatContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
            console.log('📜 Smooth scrolled to bottom for new implementation phase (useEffect)');
          }
        }, 600); // Increased delay to ensure this happens after other effects
      }
    }
  }, [progress.phase, progress.answered]);

  useEffect(() => {
    if (!sessionId || !needsInitialQuestion) return;

    let cancelled = false;

    const getInitialQuestion = async () => {
      setLoading(true);
      try {
        const {
          result: { reply, progress, web_search_status, immediate_response, question_number },
        } = await fetchQuestion("", sessionId!);
        if (cancelled) return;

        console.log("📥 Initial Question API Response:", {
          reply: reply.substring(0, 100) + "...",
          progress: progress,
          sessionId: sessionId,
          web_search_status: web_search_status,
          immediate_response: immediate_response,
          question_number: question_number
        });
        const { acknowledgement: ack, question: parsedQ } = parseAngelReply(reply);
        const questionNumber = deriveQuestionNumber(question_number, reply, progress);
        setCurrentQuestion(parsedQ);
        setCurrentAcknowledgement(ack);
        setCurrentQuestionNumber(questionNumber);
        updateQuestionTracker(progress.phase, questionNumber);
        applyProgressUpdate(progress);
        setWebSearchStatus(web_search_status || { is_searching: false, query: undefined, completed: false });
        setNeedsInitialQuestion(false);
        
        // CRITICAL: If this is the initial intro (GKY phase, no history), immediately lock scroll to top
        // Use history.length === 0 as the key indicator (most reliable)
        if (progress.phase === 'GKY') {
          // Use requestAnimationFrame to ensure DOM is ready, then lock scroll
          requestAnimationFrame(() => {
            setTimeout(() => {
              if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = 0;
                console.log('📜 IMMEDIATE: Locked scroll to TOP after initial question load', {
                  phase: progress.phase,
                  answered: progress.answered
                });
              }
            }, 0);
          });
          
          // Additional immediate lock after a short delay
          setTimeout(() => {
            if (chatContainerRef.current && history.length === 0) {
              chatContainerRef.current.scrollTop = 0;
              console.log('📜 IMMEDIATE: Re-locked scroll to TOP (50ms delay)');
            }
          }, 50);
        }
        
        if (immediate_response) {
          toast.info(immediate_response, { autoClose: 5000 });
        }
      } catch (error) {
        if (!cancelled) {
        console.error("Failed to fetch initial question:", error);
        toast.error("Failed to fetch initial question");
        }
      } finally {
        if (!cancelled) {
        setLoading(false);
      }
    }
    };

    getInitialQuestion();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, needsInitialQuestion]);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    const restoreSessionFromHistory = async () => {
      setLoading(true);

      const buildConversationFromHistory = (records: RawChatRecord[]) => {
        const pairs: ConversationPair[] = [];
        let pendingQuestion: string | null = null;
        let pendingAcknowledgement: string | null = null;
        let pendingNumber: number | null = null;
        let pendingPhase: ConversationPair['phase'] | null = null;
        const phaseCounters: Record<string, number> = {};

        records.forEach((record) => {
          if (record.role === 'assistant') {
            if (!record.content) return;
            const { acknowledgement, question } = parseAngelReply(record.content);
            const tagMatch = record.content.match(/\[\[Q:([A-Z_]+)\.(\d{2})]]/);
            const rawPhase = tagMatch ? tagMatch[1] : record.phase;
            const rawUpper = rawPhase ? rawPhase.toUpperCase() : 'GKY';
            const normalizedPhase = rawUpper === 'KYC' ? 'GKY' : rawUpper;
            const counter = phaseCounters[normalizedPhase] ?? 0;
            const parsedNumber = tagMatch ? parseInt(tagMatch[2], 10) : null;

            if (parsedNumber) {
              phaseCounters[normalizedPhase] = Math.max(counter, parsedNumber);
              pendingNumber = parsedNumber;
            } else {
              phaseCounters[normalizedPhase] = counter + 1;
              pendingNumber = phaseCounters[normalizedPhase];
            }

            pendingQuestion = question;
            pendingAcknowledgement = acknowledgement;
            pendingPhase = normalizedPhase as ConversationPair['phase'];
          } else if (record.role === 'user') {
            if (!pendingQuestion) return;
            const answerText = (record.content || '').trim();
            if (!answerText || answerText.toUpperCase() === 'EMPTY') {
              return;
            }
            pairs.push({
              question: pendingQuestion,
              answer: answerText,
              acknowledgement: pendingAcknowledgement || undefined,
              questionNumber: pendingNumber ?? undefined,
              phase: pendingPhase ?? undefined,
            });
            pendingQuestion = null;
            pendingAcknowledgement = null;
            pendingNumber = null;
            pendingPhase = null;
          }
        });

        return { pairs, pendingQuestion, pendingAcknowledgement, pendingNumber, pendingPhase };
      };

      try {
        const [sessionsResponse, historyResponse] = await Promise.all([
          fetchSessions(),
          fetchSessionHistory(sessionId),
        ]);
        if (cancelled) return;

        const sessionsArray = Array.isArray(sessionsResponse) ? sessionsResponse : [sessionsResponse];
        const sessionMeta = sessionsArray.find((session) => session.id === sessionId);

        if (!sessionMeta) {
          toast.error("We couldn't locate this venture. Returning to your ventures list.");
          navigate('/ventures');
          setLoading(false);
          return;
        }

        setSessionBusinessContext(deriveContextFromSession(sessionMeta));

        const reconstructed = buildConversationFromHistory(historyResponse || []);
        
        // CRITICAL: Prioritize backend's asked_q over reconstructed history
        // If backend says we're on a different question than what history shows,
        // trust the backend (e.g., after going back, backend knows the correct question)
        const numberFromTag = parseQuestionNumberFromTag(sessionMeta.asked_q);
        const rawSessionPhase = ((sessionMeta.current_phase as string) || "GKY").toUpperCase();
        const phase = (rawSessionPhase === 'KYC' ? 'GKY' : rawSessionPhase) as ProgressState['phase'];
        
        // Filter history to only include Q&A pairs up to the backend's asked_q
        // If backend says we're on Q2, we should only show Q1 as answered
        let filteredPairs = reconstructed.pairs;
        let currentQuestionFromHistory: string | null = null;
        
        if (numberFromTag !== null) {
          // Backend says we're on question numberFromTag
          // So we should only have pairs with questionNumber < numberFromTag
          // IMPORTANT: Keep ALL pairs with questionNumber < numberFromTag, including duplicates
          // (e.g., if Question 4 was asked twice, keep both attempts)
          filteredPairs = reconstructed.pairs.filter((pair) => {
            if (pair.phase !== phase) return true; // Keep pairs from other phases
            if (typeof pair.questionNumber !== 'number') return true; // Keep pairs without numbers
            // Keep all questions before the current one (including re-asked questions)
            return pair.questionNumber < numberFromTag;
          });
          
          // Ensure we have all questions in sequence - check for missing question numbers
          const questionNumbers = new Set(
            filteredPairs
              .filter(p => p.phase === phase && typeof p.questionNumber === 'number')
              .map(p => p.questionNumber as number)
          );
          
          // Log if we're missing any questions (for debugging)
          if (questionNumbers.size > 0) {
            const minQ = Math.min(...Array.from(questionNumbers));
            const maxQ = Math.max(...Array.from(questionNumbers));
            const missing: number[] = [];
            for (let i = minQ; i < maxQ; i++) {
              if (!questionNumbers.has(i)) {
                missing.push(i);
              }
            }
            if (missing.length > 0) {
              console.warn('⚠️ Missing question numbers in history:', missing, {
                allNumbers: Array.from(questionNumbers).sort((a, b) => a - b),
                currentQuestion: numberFromTag
              });
            }
          }
          
          // Find the current question text from history (even if not in a completed pair)
          // Look for assistant messages with the current question number
          if (historyResponse && Array.isArray(historyResponse)) {
            for (let i = historyResponse.length - 1; i >= 0; i--) {
              const record = historyResponse[i];
              if (record.role === 'assistant' && record.content) {
                const tagMatch = record.content.match(/\[\[Q:([A-Z_]+)\.(\d{2})]]/);
                if (tagMatch) {
                  const recordPhase = tagMatch[1].toUpperCase();
                  const recordNumber = parseInt(tagMatch[2], 10);
                  if (recordPhase === phase && recordNumber === numberFromTag) {
                    currentQuestionFromHistory = formatAngelMessage(record.content);
                    break;
                  }
                }
              }
            }
          }
          
          // Update pending question to match backend's asked_q
          if (currentQuestionFromHistory) {
            reconstructed.pendingQuestion = currentQuestionFromHistory;
            reconstructed.pendingNumber = numberFromTag;
            reconstructed.pendingPhase = phase as ConversationPair['phase'];
          } else if (reconstructed.pendingNumber !== null && reconstructed.pendingNumber >= numberFromTag) {
            // The pending question is ahead of where backend says we are, so clear it
            // We'll need to fetch the question
            reconstructed.pendingQuestion = null;
            reconstructed.pendingNumber = null;
            reconstructed.pendingPhase = null;
          }
        }
        
        setHistory(filteredPairs);

        const phaseQuestionSets: Record<string, Set<number>> = {};
        filteredPairs.forEach((pair) => {
          const pairPhase = (pair.phase || 'GKY').toUpperCase();
          if (!phaseQuestionSets[pairPhase]) {
            phaseQuestionSets[pairPhase] = new Set<number>();
          }
          if (typeof pair.questionNumber === 'number') {
            phaseQuestionSets[pairPhase].add(pair.questionNumber);
          }
        });

        const answeredPhase = phaseQuestionSets[phase]?.size ?? 0;
        // Backend is source of truth — use max(backend, history-derived) to avoid undercounting
        // when tags are missing in history or backend has correct count from chat responses
        const backendAnswered = typeof sessionMeta?.answered_count === "number" ? sessionMeta.answered_count : 0;
        const effectiveAnsweredPhase = Math.max(answeredPhase, backendAnswered);

        const totalPhase = QUESTION_COUNTS[phase as keyof typeof QUESTION_COUNTS] || QUESTION_COUNTS.GKY;
        const phasePercent = totalPhase > 0 ? Math.min(Math.round((effectiveAnsweredPhase / totalPhase) * 100), 100) : 0;

        // Overall progress always includes ALL question phases (GKY + BP = 50)
        const overallTotal = QUESTION_COUNTS.GKY + QUESTION_COUNTS.BUSINESS_PLAN; // 5 + 45 = 50
        let overallAnswered = 0;
        Object.entries(phaseQuestionSets).forEach(([phaseKey, questions]) => {
          const normalizedPhase = phaseKey.toUpperCase();
          const phaseTotal = QUESTION_COUNTS[normalizedPhase as keyof typeof QUESTION_COUNTS];
          if (phaseTotal) {
            overallAnswered += questions.size;
          }
        });
        // Use max(history-derived, backend) so we never undercount
        overallAnswered = Math.max(overallAnswered, backendAnswered);
        if (overallAnswered === 0) {
          overallAnswered = effectiveAnsweredPhase;
        }
        const overallPercent = overallTotal > 0 ? Math.min(Math.round((overallAnswered / overallTotal) * 100), 100) : phasePercent;

        // Use backend's asked_q as the source of truth for current question
        const pendingNumber = numberFromTag ?? reconstructed.pendingNumber;

        // Calculate phase_breakdown from actual data (don't rely on previous state which is empty on restore)
        const gkyTotal = QUESTION_COUNTS.GKY || 5;
        const bpTotalCalc = QUESTION_COUNTS.BUSINESS_PLAN || 45;
        let gkyCompleted = 0;
        let bpCompleted = 0;
        
        if (phase === "GKY") {
          gkyCompleted = Math.min(effectiveAnsweredPhase, gkyTotal);
          bpCompleted = 0;
        } else if (phase === "BUSINESS_PLAN") {
          gkyCompleted = gkyTotal; // GKY is complete if in BP
          bpCompleted = Math.min(effectiveAnsweredPhase, bpTotalCalc);
        } else {
          gkyCompleted = gkyTotal;
          bpCompleted = bpTotalCalc;
        }
        
        setProgress((prev) => ({
          ...prev,
          phase,
          answered: overallAnswered,
          phase_answered: effectiveAnsweredPhase,
          total: totalPhase,
          percent: phasePercent,
          overall_progress: {
            answered: overallAnswered,
            total: overallTotal,
            percent: overallPercent,
            phase_breakdown: {
              gky_completed: gkyCompleted,
              gky_total: gkyTotal,
              bp_completed: bpCompleted,
              bp_total: bpTotalCalc,
            },
          },
        }));

        setPhaseQuestionTracker({
          currentPhase: phase,
          questionCount: effectiveAnsweredPhase,
          lastQuestionNumber: pendingNumber ?? null,
        });

        // Backward compat: normalize KYC.XX → GKY.XX for existing sessions
        const rawAskedQ = sessionMeta.asked_q ? sessionMeta.asked_q.replace(/^KYC\./, 'GKY.') : null;
        const askedTag = rawAskedQ || (pendingNumber ? `${phase}.${pendingNumber.toString().padStart(2, '0')}` : undefined);

        try {
          await syncSessionProgress(sessionId, {
            phase,
            answered_count: overallAnswered,
            asked_q: askedTag,
          });
        } catch (syncError) {
          console.warn("Progress sync failed:", syncError);
        }

        setBackendTotals({
          answered: effectiveAnsweredPhase,
          total: totalPhase,
          overallAnswered,
          overallTotal,
        });

        // CRITICAL: Check if we're in PLAN_TO_SUMMARY_TRANSITION phase
        // If so, fetch business plan summary and artifact
        if ((phase as string) === "PLAN_TO_SUMMARY_TRANSITION") {
          console.log("🎯 Detected PLAN_TO_SUMMARY_TRANSITION phase - fetching complete session data");
          try {
            const sessionResponse = await httpClient.get(
              `${import.meta.env.VITE_API_BASE_URL}/angel/sessions/${sessionId}`
            );
            const sessionData = sessionResponse.data as { success?: boolean; result?: any };
            const freshSession = sessionData?.success ? sessionData.result : null;

            const summary = freshSession?.business_plan_summary || "Your business plan has been completed successfully!";
            const artifact = freshSession?.business_plan_artifact || null;

            setTransitionData({
              businessPlanSummary: summary,
              businessPlanArtifact: artifact,
              transitionPhase: "PLAN_TO_SUMMARY"
            });

            setBackendTotals({ answered: effectiveAnsweredPhase, total: totalPhase, overallAnswered, overallTotal });
            setLoading(false);
            return;
          } catch (summaryError) {
            console.error("Failed to fetch business plan data for summary transition:", summaryError);
            setTransitionData({
              businessPlanSummary: "Your business plan has been completed successfully!",
              businessPlanArtifact: null,
              transitionPhase: "PLAN_TO_SUMMARY"
            });
            setBackendTotals({ answered: effectiveAnsweredPhase, total: totalPhase, overallAnswered, overallTotal });
            setLoading(false);
            return;
          }
        }

        // CRITICAL: Check if we're in PLAN_TO_BUDGET_TRANSITION phase
        // If so, fetch business plan summary AND artifact (which may be generating in background)
        if ((phase as string) === "PLAN_TO_BUDGET_TRANSITION") {
          console.log("🎯 Detected PLAN_TO_BUDGET_TRANSITION phase - fetching complete session data");
          try {
            // ROOT CAUSE FIX: Fetch FRESH session data to get transition data
            const sessionResponse = await httpClient.get(
              `${import.meta.env.VITE_API_BASE_URL}/angel/sessions/${sessionId}`
            );
            
            const sessionData = sessionResponse.data as { success?: boolean; result?: any };
            const freshSession = sessionData?.success ? sessionData.result : null;
            
            console.log("📄 Fresh session data for budget transition:", {
              hasArtifact: !!freshSession?.business_plan_artifact,
              hasSummary: !!freshSession?.business_plan_summary,
              hasTransitionData: !!freshSession?.transition_data,
              transitionDataType: freshSession?.transition_data?.transition_type
            });
            
            // Get transition data from session
            const transitionData = freshSession?.transition_data || {};
            const summary = freshSession?.business_plan_summary || transitionData.business_plan_summary || "Your business plan has been completed successfully!";
            const artifact = freshSession?.business_plan_artifact || transitionData.business_plan_artifact || null;
            const estimatedExpenses = transitionData.estimated_expenses || "";
            const businessContext = transitionData.business_context || {};
            
            console.log("📊 Restoring budget transition data:", {
              hasSummary: !!summary,
              hasArtifact: !!artifact,
              hasEstimatedExpenses: !!estimatedExpenses,
              hasBusinessContext: !!businessContext
            });
            
            setTransitionData({
              businessPlanSummary: summary,
              businessPlanArtifact: artifact,
              transitionPhase: "PLAN_TO_BUDGET",
              estimatedExpenses: estimatedExpenses,
              businessContext: businessContext
            });
            
            setBackendTotals({ answered: effectiveAnsweredPhase, total: totalPhase, overallAnswered, overallTotal });
            setLoading(false);
            return;
          } catch (error) {
            console.error("❌ Error restoring budget transition:", error);
            // Fallback: still set transition data even if fetch fails
            setTransitionData({
              businessPlanSummary: "Your business plan has been completed successfully!",
              businessPlanArtifact: null,
              transitionPhase: "PLAN_TO_BUDGET",
              estimatedExpenses: "",
              businessContext: {}
            });
            setBackendTotals({ answered: effectiveAnsweredPhase, total: totalPhase, overallAnswered, overallTotal });
            setLoading(false);
            return;
          }
        }

        if (phase === "PLAN_TO_ROADMAP_TRANSITION") {
          console.log("🎯 Detected PLAN_TO_ROADMAP_TRANSITION phase - fetching complete session data");
          try {
            // ROOT CAUSE FIX: Fetch FRESH session data to get the artifact
            // The artifact is generated in background, so we need to fetch it separately
            const sessionResponse = await httpClient.get(
              `${import.meta.env.VITE_API_BASE_URL}/angel/sessions/${sessionId}`
            );
            
            const sessionData = sessionResponse.data as { success?: boolean; result?: any };
            const freshSession = sessionData?.success ? sessionData.result : null;
            
            console.log("📄 Fresh session data:", {
              hasArtifact: !!freshSession?.business_plan_artifact,
              hasSummary: !!freshSession?.business_plan_summary,
              artifactLength: freshSession?.business_plan_artifact?.length || 0,
              summaryLength: freshSession?.business_plan_summary?.length || 0
            });
            
            // Get summary and artifact from fresh session data
            const summary = freshSession?.business_plan_summary || "Your business plan has been completed successfully!";
            const artifact = freshSession?.business_plan_artifact || null;
            
            // If artifact is still being generated, show a message
            if (!artifact) {
              console.log("⏳ Business plan artifact is still being generated in background");
              toast.info("Your business plan is being generated. You can view it shortly.", {
                autoClose: 5000
              });
            }
            
            setTransitionData({
              businessPlanSummary: summary,
              businessPlanArtifact: artifact,
              transitionPhase: "PLAN_TO_ROADMAP"
            });
            
            setBackendTotals({ answered: effectiveAnsweredPhase, total: totalPhase, overallAnswered, overallTotal });
            setLoading(false);
            return;
          } catch (summaryError) {
            console.error("Failed to fetch business plan data:", summaryError);
            // Fallback: still show modal with default message
            setTransitionData({
              businessPlanSummary: "Your business plan has been completed successfully!",
              businessPlanArtifact: null,
              transitionPhase: "PLAN_TO_ROADMAP"
            });
            setBackendTotals({ answered: effectiveAnsweredPhase, total: totalPhase, overallAnswered, overallTotal });
            setLoading(false);
            return;
          }
        }

        // CRITICAL: Check if we're in ROADMAP_TO_IMPLEMENTATION_TRANSITION phase
        if (phase === "ROADMAP_TO_IMPLEMENTATION_TRANSITION") {
          console.log("🚀 Detected ROADMAP_TO_IMPLEMENTATION_TRANSITION phase - fetching transition content");
          
          // Show loading state
          setLoading(true);
          
          try {
            // Fetch the transition content from the endpoint
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/angel/sessions/${sessionId}/roadmap-to-implementation-transition`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('sb_access_token')}`
              }
            });

            const data = await response.json();
            
            if (data.success && data.result?.reply) {
              console.log("✅ Roadmap to Implementation transition content received");
              setRoadmapToImplementationTransition({
                roadmapContent: data.result.reply,
                isActive: true
              });
              if (data.result?.progress) {
                applyProgressUpdate(data.result.progress);
              }
              setBackendTotals({ answered: effectiveAnsweredPhase, total: totalPhase, overallAnswered, overallTotal });
              setLoading(false);
              return;
            } else {
              console.warn("⚠️ Transition endpoint did not return expected data");
              setLoading(false);
            }
          } catch (transitionError) {
            console.error("Failed to fetch transition content:", transitionError);
            setLoading(false);
            // Continue with normal flow
          }
        }

        // CRITICAL: Check if we're in ROADMAP phase - automatically load and display roadmap
        if (phase === "ROADMAP" || phase === "ROADMAP_GENERATED") {
          console.log("🗺️ Detected ROADMAP phase - loading roadmap and opening modal");
          try {
            // Always fetch roadmap from API to ensure we get the new 8-stage format
            // The API will regenerate if it's in old format
            try {
              const roadmapResponse = await fetchRoadmapPlan(sessionId);
              const roadmapContent = roadmapResponse?.result?.plan || '';
              
              if (roadmapContent) {
                // Check if it's in the new format (has Stage and tables)
                const hasStageFormat = roadmapContent.includes("Stage") && 
                                      roadmapContent.includes("| Task | Description | Dependencies | Angel's Role | Status |");
                
                if (hasStageFormat) {
                  setRoadmapData({
                    roadmapContent: roadmapContent,
                    isGenerated: true
                  });
                  
                  // Navigate to roadmap page
                  console.log("✅ Roadmap loaded (8-stage format) - navigating to roadmap page");
                  navigate(`/ventures/${sessionId}/roadmap`);
                } else {
                  // Old format detected - navigate anyway, the page will handle it
                  console.warn("⚠️ Roadmap is not in expected 8-stage format - navigating anyway");
                  navigate(`/ventures/${sessionId}/roadmap`);
                }
              } else {
                console.warn("⚠️ No roadmap content returned from API - navigating anyway");
                navigate(`/ventures/${sessionId}/roadmap`);
              }
            } catch (fetchError) {
              console.error("Could not fetch roadmap:", fetchError);
              // Navigate anyway, the page will show error state
              navigate(`/ventures/${sessionId}/roadmap`);
            }
          } catch (roadmapError) {
            console.error("Failed to load roadmap:", roadmapError);
            // Navigate anyway, the page will show error state
            navigate(`/ventures/${sessionId}/roadmap`);
          }
        }

        if (reconstructed.pendingQuestion) {
          setCurrentQuestion(reconstructed.pendingQuestion);
          setCurrentAcknowledgement(reconstructed.pendingAcknowledgement || '');
          setCurrentQuestionNumber(pendingNumber);
          setNeedsInitialQuestion(false);
          setBackendTotals({ answered: effectiveAnsweredPhase, total: totalPhase, overallAnswered, overallTotal });
          setLoading(false);
          return;
        }

        setNeedsInitialQuestion(true);
        setBackendTotals({ answered: effectiveAnsweredPhase, total: totalPhase, overallAnswered, overallTotal });
      } catch (error: any) {
        console.error("❌ Failed to restore venture session:", error);
        
        // Extract meaningful error message
        const errorResponse = error?.response?.data;
        const errorMessage = 
          error?.message ||
          errorResponse?.detail ||
          errorResponse?.error ||
          errorResponse?.message ||
          "Failed to load venture session";
        
        console.error("Session restoration error details:", {
          message: errorMessage,
          status: error?.response?.status,
          data: errorResponse,
          sessionId: sessionId
        });
        
        // Only navigate away if it's a 404 (session not found) or 401 (unauthorized)
        // For other errors, try to continue (might be temporary network issue)
        if (!cancelled) {
          if (error?.response?.status === 404) {
            toast.error("This venture could not be found. Redirecting to your ventures list.");
            navigate('/ventures');
            setLoading(false);
            return;
          } else if (error?.response?.status === 401) {
            // Don't navigate away immediately - let httpClient handle token refresh
            // Only show error if refresh also fails
            console.warn("⚠️ 401 error during session restoration - httpClient should handle refresh");
          }
          
          // For other errors, allow user to continue (they might be able to proceed)
          toast.warning(`Unable to restore session history: ${errorMessage}. Starting fresh.`, {
            autoClose: 4000,
          });
          setHistory([]);
          setNeedsInitialQuestion(true);
          setBackendTotals({ answered: 0, total: QUESTION_COUNTS.GKY, overallAnswered: 0, overallTotal: 50 });
        }
      }
    };

    restoreSessionFromHistory();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, navigate]);

  const handleNext = async (inputOverride?: string) => {
    const input = (inputOverride ?? currentInput).trim();
    if (!input) {
      toast.warning("Please enter your response.");
      return;
    }

    const previousQuestion = currentQuestion;
    const previousAcknowledgement = currentAcknowledgement;
    const previousQuestionNumber = currentQuestionNumber;

    setLoading(true);
    setCurrentInput("");
    setPendingUserReply(input);

    try {
      const response = await fetchQuestion(input, sessionId!);
      const {
        result: { reply, progress, web_search_status, immediate_response, transition_phase, business_plan_summary, show_accept_modify, question_number },
      } = response;
      
      // Get business_plan_artifact from response if available
      const business_plan_artifact = (response as any)?.result?.business_plan_artifact;
      
      console.log("📥 Question API Response:", {
        input: input,
        reply: reply.substring(0, 100) + "...",
        progress: progress,
        sessionId: sessionId,
        web_search_status: web_search_status,
        immediate_response: immediate_response,
        transition_phase: transition_phase,
        show_accept_modify: show_accept_modify,
        business_plan_summary: business_plan_summary ? "Present" : "None",
        business_plan_artifact: business_plan_artifact ? "Present" : "None",
        question_number: question_number
      });
      
      applyProgressUpdate(progress);
      await loadBusinessContext();
      
      // Handle transition phases - return early (no history add for modal transitions)
      if (transition_phase === "PLAN_TO_SUMMARY") {
        console.log("🎯 PLAN_TO_SUMMARY transition detected - showing business plan summary first");
        setTransitionData({
          businessPlanSummary: business_plan_summary || "",
          businessPlanArtifact: business_plan_artifact || null,
          transitionPhase: transition_phase
        });
        setLoading(false);
        return;
      }

      if (transition_phase === "PLAN_TO_BUDGET") {
        console.log("🎯 PLAN_TO_BUDGET transition detected - navigating to full budget page");
        setLoading(false);
        navigate(`/ventures/${sessionId}/budget`, {
          state: { fromTransition: true }
        });
        return;
      }

      if (transition_phase === "PLAN_TO_ROADMAP") {
        console.log("🎯 PLAN_TO_ROADMAP transition detected - showing modal instead of chat");
        setTransitionData({
          businessPlanSummary: business_plan_summary || "",
          businessPlanArtifact: business_plan_artifact || null,  // Include artifact if available
          transitionPhase: transition_phase
        });
        // Trigger budget setup modal
        setBudgetSetupModal({ isOpen: true, businessPlanCompleted: true });
        if (business_plan_artifact) {
          console.log("✅ Business Plan Artifact received in transition response");
          toast.success("Full Business Plan Artifact has been generated and is available for download!");
        } else {
          // Show loading toast if artifact is still being generated
          toast.info("Generating your complete Business Plan Artifact... This may take 30-60 seconds.", {
            autoClose: 5000
          });
        }
        setLoading(false);
        return;
      }

        // Handle GKY to Business Plan transition — display the congratulation /
        // transition message as a normal question.  The user reads it and types
        // a response (e.g. "yes, I'm ready").  Their response goes through the
        // regular handleNext → fetchQuestion flow which returns BP Q1.
        // NO modal, NO auto-start, NO upload popup.
        if (transition_phase === "GKY_TO_BUSINESS_PLAN") {
          const { acknowledgement: ack, question: parsedQ } = parseAngelReply(reply);
          setCurrentQuestion(parsedQ);
          setCurrentAcknowledgement(ack);
          setCurrentQuestionNumber(null);
          applyProgressUpdate(progress);
          setLoading(false);
          return;
        }      
      // Handle roadmap generation
      if (transition_phase === "ROADMAP_GENERATED") {
        setRoadmapData({
          roadmapContent: reply,
          isGenerated: true
        });
        // Keep the optimistic update for this transition
        return;
      }
      
      const { acknowledgement: ack, question: parsedQ } = parseAngelReply(reply);
      // Section summary: stay on current question until user accepts (don't advance to next)
      const sectionSummaryMarkers = ["Section Complete", "Summary of Your Information", "Ready to Continue"];
      const isSectionSummary = show_accept_modify && sectionSummaryMarkers.some((m) => reply?.includes(m));
      const nextQuestionNumber = isSectionSummary && previousQuestionNumber != null
        ? previousQuestionNumber
        : deriveQuestionNumber(question_number, reply, progress);

      const COMMAND_INPUTS = ["draft", "support", "scrapping", "scraping", "draft more", "draft answer"];
      const wasCommand = COMMAND_INPUTS.includes(input.toLowerCase().trim());

      // Add to history only when Angel reply arrives (progress increments here, not on submit)
      // Commands (Draft, Support, etc.) add for display but isCommand excludes from progress
      setHistory((prev) => [
        ...prev,
        {
          question: previousQuestion,
          answer: input,
          acknowledgement: ack || undefined,
          questionNumber: previousQuestionNumber,
          phase: progress.phase,
          ...(wasCommand && { isCommand: true }),
        },
      ]);

      setCurrentQuestion(parsedQ);
      setCurrentAcknowledgement(ack);
      setCurrentQuestionNumber(nextQuestionNumber);
      updateQuestionTracker(progress.phase, nextQuestionNumber);
      setWebSearchStatus(web_search_status || { is_searching: false, query: undefined, completed: false });

      if (show_accept_modify !== undefined) {
        setShowVerificationButtons(show_accept_modify);
      } else if (wasCommand) {
        setShowVerificationButtons(true);
      }
      
      // Show immediate response if available
      if (immediate_response) {
        // toast.info(immediate_response, { 
        //   autoClose: 5000,
        //   position: "top-center",
        //   className: "bg-blue-50 border border-blue-200 text-blue-800"
        // });
      }
    } catch (error: any) {
      console.error("❌ Failed to fetch question:", error);
      
      // Extract meaningful error message
      let errorMessage = "Something went wrong. Please try again.";
      const errorResponse = error?.response?.data;
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (errorResponse?.detail) {
        errorMessage = errorResponse.detail;
      } else if (errorResponse?.error) {
        errorMessage = errorResponse.error;
      } else if (errorResponse?.message) {
        errorMessage = errorResponse.message;
      } else if (error?.code === 'ERR_NETWORK') {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error?.response?.status === 401) {
        errorMessage = "Your session has expired. Please refresh the page to continue.";
      } else if (error?.response?.status === 500) {
        errorMessage = "Server error. Our team has been notified. Please try again in a moment.";
      } else if (error?.response?.status === 429) {
        errorMessage = "Too many requests. Please wait a moment before trying again.";
      }
      
      // Log full error details for debugging
      console.error("Error details:", {
        message: error?.message,
        status: error?.response?.status,
        data: errorResponse,
        input: input.substring(0, 100),
        sessionId: sessionId,
        phase: progress.phase,
        questionNumber: currentQuestionNumber
      });
      
      toast.error(errorMessage, {
        autoClose: 5000,
      });
      setCurrentInput(input);
    } finally {
      setLoading(false);
      setPendingUserReply(null);
    }
  };

  const handleViewPlan = async () => {
    setPlanState((prev) => ({
      ...prev,
      loading: true,
      error: "",
      showModal: true,
    }));

    try {
      const response = await fetchBusinessPlan(sessionId!);
      setPlanState((prev) => ({
        ...prev,
        loading: false,
        plan: response.result.plan,
      }));
    } catch (err) {
      setPlanState((prev) => ({
        ...prev,
        loading: false,
        error: (err as Error).message,
      }));
    }
  };

  const handleViewRoadmap = async () => {
    setRoadmapState((prev) => ({
      ...prev,
      loading: true,
      error: "",
      showModal: true,
    }));

    try {
      const response = await fetchRoadmapPlan(sessionId!);
      setRoadmapState((prev) => ({
        ...prev,
        loading: false,
        plan: response.result.plan,
      }));
    } catch (err) {
      setRoadmapState((prev) => ({
        ...prev,
        loading: false,
        error: (err as Error).message,
      }));
    }
  };

  const handleEditPlan = () => {
    // Close the business plan modal and allow editing
    setPlanState(prev => ({ ...prev, showModal: false }));
    toast.info("Business Plan editing mode activated. You can now modify your responses.");
  };

  const handleEditRoadmap = () => {
    // Always open the roadmap edit modal for debugging
    console.log("Opening roadmap edit modal with data:", roadmapData);
    setRoadmapEditModal({
      isOpen: true,
      roadmapContent: roadmapData?.roadmapContent || "No roadmap content available"
    });
    // Close the roadmap modal
    setRoadmapState(prev => ({ ...prev, showModal: false }));
  };

  const handleSaveEditedRoadmap = async (updatedContent: string) => {
    try {
      console.log("Saving roadmap with content:", updatedContent);
      toast.info("Saving roadmap changes...");
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/roadmap/sessions/${sessionId}/update-roadmap`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sb_access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          updated_content: updatedContent
        })
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to save roadmap: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log("Roadmap saved successfully, updating local state");
        // Update local roadmap data
        setRoadmapData(prev => prev ? {
          ...prev,
          roadmapContent: updatedContent
        } : null);
        
        // Close edit modal
        setRoadmapEditModal({
          isOpen: false,
          roadmapContent: ""
        });
        
        toast.success("Roadmap saved successfully!");
      } else {
        toast.error(data.message || "Failed to save roadmap");
      }
    } catch (error) {
      console.error("Error saving roadmap:", error);
      toast.error("Failed to save roadmap");
    }
  };

  // Handle going back to previous question
  const handleGoBack = async () => {
    if (history.length === 0 || backButtonLoading || loading) {
      return;
    }

    try {
      setBackButtonLoading(true);
      
      // Call backend API to go to previous question
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/angel/sessions/${sessionId}/go-back`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sb_access_token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        // PROFESSIONAL FLOW - Senior Developer Best Practices
      if (data.result?.progress) {
        applyProgressUpdate(data.result.progress);
        console.log("📊 Progress updated:", data.result.progress);
      }

      const replyText = data.result?.reply ?? '';
      const { acknowledgement: prevAck, question: prevQ } = parseAngelReply(replyText);
      const tagMatch = replyText.match(/\[\[Q:([A-Z_]+)\.(\d{2})]]/);
      const previousQuestionNumber = tagMatch ? parseInt(tagMatch[2], 10) : null;
      const previousPhase = tagMatch ? tagMatch[1] : progress.phase;

        if (previousQuestionNumber !== null) {
          setPhaseQuestionTracker((prev) => ({
            ...prev,
            questionCount: Math.max(prev.questionCount - 1, 0),
            lastQuestionNumber: previousQuestionNumber,
          }));
        }

        setCurrentQuestion(prevQ);
        setCurrentAcknowledgement(prevAck);
        setCurrentQuestionNumber(previousQuestionNumber);
        console.log("✅ Current question reset to previous:", {
          questionNumber: previousQuestionNumber,
          replyPreview: prevQ.substring(0, 80),
        });

        // CRITICAL: Sync session progress to backend so reload restores correct question
      const progressData = data.result?.progress;
        if (progressData && sessionId) {
          const askedTag = progressData.phase && previousQuestionNumber 
            ? `${progressData.phase}.${previousQuestionNumber.toString().padStart(2, '0')}`
            : undefined;
          
          try {
            await syncSessionProgress(sessionId, {
              phase: progressData.phase || previousPhase,
              answered_count: progressData.phase_answered ?? progressData.answered ?? 0,
              asked_q: askedTag,
            });
            console.log("✅ Session progress synced after going back:", {
              phase: progressData.phase || previousPhase,
              answered_count: progressData.phase_answered ?? progressData.answered ?? 0,
              asked_q: askedTag,
            });
          } catch (syncError) {
            console.warn('Failed to sync progress after going back:', syncError);
          }
        }

        // CRITICAL: Refresh history from backend to ensure we're in sync with what was actually deleted
        // The backend should have deleted the records, so we need to fetch the updated history
      try {
        const refreshedHistory = await fetchSessionHistory(sessionId);
        if (refreshedHistory && Array.isArray(refreshedHistory)) {
          // Rebuild conversation pairs from refreshed history
          const buildPairs = (records: RawChatRecord[]) => {
            const pairs: ConversationPair[] = [];
            let pendingQuestion: string | null = null;
            let pendingAck: string | null = null;
            let pendingNumber: number | null = null;
            let pendingPhase: ConversationPair['phase'] | null = null;

            records.forEach((record) => {
              if (record.role === 'assistant') {
                if (!record.content) return;
                const { acknowledgement, question } = parseAngelReply(record.content);
                const tagMatch = record.content.match(/\[\[Q:([A-Z_]+)\.(\d{2})]]/);
                const rawPhase = tagMatch ? tagMatch[1] : record.phase;
                const rawUpper2 = rawPhase ? rawPhase.toUpperCase() : 'GKY';
                const normalizedPhase = rawUpper2 === 'KYC' ? 'GKY' : rawUpper2;
                const parsedNumber = tagMatch ? parseInt(tagMatch[2], 10) : null;

                pendingQuestion = question;
                pendingAck = acknowledgement;
                pendingNumber = parsedNumber;
                pendingPhase = normalizedPhase as ConversationPair['phase'];
              } else if (record.role === 'user') {
                if (!pendingQuestion) return;
                const answerText = (record.content || '').trim();
                if (!answerText || answerText.toUpperCase() === 'EMPTY') {
                  return;
                }
                pairs.push({
                  question: pendingQuestion,
                  answer: answerText,
                  acknowledgement: pendingAck || undefined,
                  questionNumber: pendingNumber ?? undefined,
                  phase: pendingPhase ?? undefined,
                });
                pendingQuestion = null;
                pendingAck = null;
                pendingNumber = null;
                pendingPhase = null;
              }
            });

            return pairs;
          };

            const refreshedPairs = buildPairs(refreshedHistory);
            setHistory((prevHistory) => {
              console.log("✅ History refreshed from backend after going back:", {
                oldLength: prevHistory.length,
                newLength: refreshedPairs.length,
            pairs: refreshedPairs.map(p => ({ q: p.questionNumber, phase: p.phase }))
              });
              return refreshedPairs;
          });
        }
      } catch (refreshError) {
          console.warn('Failed to refresh history after going back:', refreshError);
          // Continue with manually updated history as fallback
        }

        // Clear input and reset UI state
      setCurrentInput("");
      
        // Scroll to current question smoothly
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
        }, 100);
      
        // User feedback
      toast.success(`Returned to Question ${previousQuestionNumber ?? 'previous'}`, {
        autoClose: 2000
      });
      } else {
        toast.error(data.message || "Cannot go back");
      }
    } catch (error) {
      console.error("Error going back:", error);
      toast.error("Failed to go back. Please try again.");
    } finally {
      setBackButtonLoading(false);
    }
  };

  const handleApprovePlan = async (transitionType?: string) => {
    setLoading(true);
    try {
      // Determine transition type based on current phase
      const currentTransitionType = transitionType || 
        (transitionData?.transitionPhase === "PLAN_TO_SUMMARY" ? "summary_to_budget" : "plan_to_roadmap");
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/angel/sessions/${sessionId}/transition-decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sb_access_token')}`
        },
        body: JSON.stringify({ 
          decision: 'approve',
          transition_type: currentTransitionType
        })
      });

      const data = await response.json();
      
      if (data.success) {
        if (data.result?.action === "transition_to_budget") {
          // Summary approved - transition to budget
          setTransitionData({
            businessPlanSummary: data.result.business_plan_summary || transitionData?.businessPlanSummary || "",
            businessPlanArtifact: data.result.business_plan_artifact || transitionData?.businessPlanArtifact || null,
            transitionPhase: "PLAN_TO_BUDGET",
            estimatedExpenses: data.result.estimated_expenses || "",
            businessContext: data.result.business_context || {}
          });
          if (data.result?.progress) {
            applyProgressUpdate(data.result.progress);
          }
          toast.success("Proceeding to budget setup");
        } else {
          // Transition to roadmap
          setTransitionData(null);
          if (data.result?.progress) {
            applyProgressUpdate(data.result.progress);
          }
          if (data.result?.business_plan) {
            setPlanState(prev => ({
              ...prev,
              plan: data.result.business_plan,
              error: "",
              loading: false,
            }));
            toast.info("Full Business Plan Artifact generated. You can download it from the Plan viewer.");
          }
          
          // Navigate to roadmap phase and show roadmap modal immediately
          if (data.result.roadmap) {
            const roadmapContent = data.result.roadmap;
            setRoadmapData({
              roadmapContent: roadmapContent,
              isGenerated: true
            });
            
            // Immediately open the roadmap modal with the generated content
            setRoadmapState({
              showModal: true,
              plan: roadmapContent,
              loading: false,
              error: ""
            });
            
            toast.success("Roadmap Generated");
            console.log("✅ Roadmap generated and modal opened:", roadmapContent.substring(0, 200));
          }
        }
      } else {
        if (data.requires_subscription) {
          toast.error(data.message || "Subscription required to proceed to Roadmap phase");
          // The PlanToRoadmapTransition component will handle showing the payment modal
        } else {
          toast.error(data.message || "Failed to approve plan");
        }
      }
    } catch (error: any) {
      console.error("❌ Failed to approve plan:", error);
      const errorMessage = 
        error?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to approve plan. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRevisitPlan = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/angel/sessions/${sessionId}/transition-decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sb_access_token')}`
        },
        body: JSON.stringify({ decision: 'revisit' })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Plan review mode activated");
        setTransitionData(null);
        if (data.result?.progress) {
          applyProgressUpdate(data.result.progress);
        }
        
        // Refresh to get the first business plan question
        await fetchQuestion("", sessionId!);
      } else {
        toast.error(data.message || "Failed to activate review mode");
      }
    } catch (error) {
      console.error("❌ Failed to revisit plan:", error);
      const errorMessage = 
        (error as any)?.message ||
        (error as any)?.response?.data?.detail ||
        (error as any)?.response?.data?.error ||
        (error as any)?.response?.data?.message ||
        "Failed to revisit plan. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPlanSuccess = (businessInfo: any, analysis?: any) => {
    toast.success("Business plan uploaded and processed successfully!");
    markUploadPlanAsUploaded();
    
    // Store analysis data for later use when answering questions
    // Normalize structure: backend uses missing_questions (snake_case), normalize to missingQuestions (camelCase)
    if (analysis) {
      const missingQuestions = analysis.missing_questions || analysis.missingQuestions || [];
      if (missingQuestions.length > 0) {
        setUploadAnalysis({
          missingQuestions: missingQuestions,
          businessInfo: businessInfo || {}
        });
        console.log("📊 Stored analysis with missing questions:", missingQuestions.length);
        console.log("📊 Missing questions:", missingQuestions.map((q: any) => q.question_number || q.questionNumber));
      }
    }
    
    // If we have business info, we could potentially pre-fill some fields
    if (businessInfo && Object.keys(businessInfo).length > 0) {
      console.log("Extracted business info:", businessInfo);
      // The backend should have already applied this to the session
    }
  };

  // Progress: history is source of truth — each pair = one answered question.
  // Exclude transition ack ("I'm ready"): it has phase GKY but no questionNumber.
  const gkyTotal = QUESTION_COUNTS.GKY;
  const bpTotal = QUESTION_COUNTS.BUSINESS_PLAN;
  const isGKY = progress.phase === "GKY";
  // Exclude command responses (Draft, Support, etc.) from progress - they don't count as answered
  const gkyPairs = history.filter(
    (p) =>
      !p.isCommand &&
      ((p.phase === "GKY" && typeof p.questionNumber === "number" && p.questionNumber <= 5) ||
        (!p.phase && typeof p.questionNumber === "number" && p.questionNumber <= 5))
  );
  const bpPairs = history.filter(
    (p) => p.phase === "BUSINESS_PLAN" && !p.isCommand
  );
  const historyPhaseAnswered = isGKY
    ? Math.min(gkyPairs.length, gkyTotal)
    : Math.min(bpPairs.length, bpTotal);
  const total = backendTotals.total;
  const answeredCount = Math.max(backendTotals.answered, historyPhaseAnswered);
  const percent = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  const overallTotal = progress.overall_progress?.total ?? backendTotals.overallTotal ?? 50;
  const historyOverall = Math.min(gkyPairs.length + bpPairs.length, overallTotal);
  const backendOverall = progress.overall_progress?.answered ?? backendTotals.overallAnswered ?? 0;
  const rawOverallAnswered = Math.max(backendOverall, historyOverall);
  const overallPercent = overallTotal > 0 ? Math.round((rawOverallAnswered / overallTotal) * 100) : percent;

  // For header "X of Y": show answered count (not inflated by current question)
  const currentStep = answeredCount;

  // Short-form phase labels for the header (user requested abbreviations)
  const phaseDisplayLabel: Record<string, string> = {
    GKY: "GKY",
    BUSINESS_PLAN: "BP",
    PLAN_TO_SUMMARY_TRANSITION: "Summary",
    PLAN_TO_BUDGET_TRANSITION: "Budget",
    PLAN_TO_ROADMAP_TRANSITION: "Roadmap",
    ROADMAP: "Roadmap",
    ROADMAP_GENERATED: "Roadmap",
    ROADMAP_TO_IMPLEMENTATION_TRANSITION: "Implementation",
    IMPLEMENTATION: "Implementation",
  };
  const headerPhaseLabel = phaseDisplayLabel[progress.phase] ?? progress.phase;

  // Console logging for calculated display values
  console.log("📊 Display Values Calculated:", {
    currentStep: currentStep,
    total: total,
    percent: percent,
    progressPhase: progress.phase,
    progressAnswered: progress.answered,
    progressPhaseAnswered: progress.phase_answered,
    progressTotal: progress.total,
    progressPercent: progress.percent,
    questionCounts: QUESTION_COUNTS
  });
  const showBusinessPlanButton = ["ROADMAP", "IMPLEMENTATION"].includes(
    progress.phase
  );

  if (loading && currentQuestion === "")
    return (
      <VentureLoader
        title="Loading…"
        subtitle="Please wait"
      />
    );

  // Show GKY to Business Plan transition
  if (transitionData && transitionData.transitionPhase === "PLAN_TO_SUMMARY") {
    return (
      <PlanToRoadmapTransition
        businessPlanSummary={transitionData.businessPlanSummary}
        businessPlanArtifact={transitionData.businessPlanArtifact}
        onApprove={() => handleApprovePlan("summary_to_budget")}
        onRevisit={handleRevisitPlan}
        loading={loading}
        sessionId={sessionId}
        initialQuote={transitionQuote}
        nextStep="budget"
      />
    );
  }

  if (transitionData && transitionData.transitionPhase === "PLAN_TO_BUDGET") {
    // Navigate to full budget page instead of showing modal
    navigate(`/ventures/${sessionId}/budget`, { state: { fromTransition: true } });
    setTransitionData(null);
  }

  if (transitionData && transitionData.transitionPhase === "PLAN_TO_ROADMAP") {
    return (
      <PlanToRoadmapTransition
        businessPlanSummary={transitionData.businessPlanSummary}
        businessPlanArtifact={transitionData.businessPlanArtifact}
        onApprove={handleApprovePlan}
        onRevisit={handleRevisitPlan}
        loading={loading}
        sessionId={sessionId}
        initialQuote={transitionQuote}
      />
    );
  }

  // Show loading screen while fetching roadmap → implementation transition (generic copy; no "roadmap" in loading text)
  if (progress.phase === "ROADMAP_TO_IMPLEMENTATION_TRANSITION" && !roadmapToImplementationTransition?.isActive) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-50 to-teal-50">
        <VentureLoader title="Loading…" subtitle="Please wait" />
      </div>
    );
  }

  // Show roadmap to implementation transition
  if (roadmapToImplementationTransition && roadmapToImplementationTransition.isActive) {
    return (
      <RoadmapToImplementationTransition
        isOpen={true}
        onBeginImplementation={handleActualStartImplementation}
        businessName={mergedBusinessContext.business_name}
        industry={mergedBusinessContext.industry}
        location={mergedBusinessContext.location}
      />
    );
  }

  // Show implementation phase
  if (progress.phase === "IMPLEMENTATION") {
    console.log("✅ Rendering Implementation component - phase is IMPLEMENTATION");
    const sessionData = {
      sessionId: sessionId!,
      currentPhase: progress.phase,
      business_name: mergedBusinessContext.business_name,
      industry: mergedBusinessContext.industry,
      location: mergedBusinessContext.location,
      business_type: mergedBusinessContext.business_type
    };

    return (
      <Implementation
        sessionId={sessionId!}
        sessionData={sessionData}
        onPhaseChange={(phase) => {
          // Handle phase changes if needed
          console.log('Phase changed to:', phase);
        }}
      />
    );
  }
  
  console.log("📊 Current phase:", progress.phase, "- Not showing Implementation component");

  // Transform history into questions array
  const questions = history.map((pair, index) => ({
    id: `${progress.phase}.${index + 1}`,
    phase: progress.phase,
    number: index + 1,
    title: pair.question,
    completed: true,
  }));

  // Add current question
  if (currentQuestion) {
    questions.push({
      id: `${progress.phase}.${questions.length + 1}`,
      phase: progress.phase,
      number: questions.length + 1,
      title: currentQuestion,
      completed: false,
    });
  }

  // Console logging for question tracking
  console.log("❓ Question Tracking:", {
    historyLength: history.length,
    currentQuestion: currentQuestion ? currentQuestion.substring(0, 50) + "..." : "None",
    totalQuestions: questions.length,
    questions: questions.map(q => ({ id: q.id, number: q.number, completed: q.completed }))
  });

  const handleQuestionSelect = async (questionId: string) => {
    const numberStr = questionId.split(".")[1];
    const number = Number.parseInt(numberStr) - 1;
    if (number < history.length) {
      // Navigate to a previous question
      const pair = history[number];
      setCurrentQuestion(pair.question);
      setCurrentAcknowledgement(pair.acknowledgement || '');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 text-sm flex flex-col lg:flex-row">
      {/* Left Sidebar - Quick Actions (Support, Draft, Scrapping, Previous Question) */}
      {(progress.phase === ("IMPLEMENTATION" as ProgressState['phase']) ||
        progress.phase === ("BUSINESS_PLAN" as ProgressState['phase']) ||
        (progress.phase === 'GKY' && history.length > 0)) && (
        <div className="hidden lg:flex flex-col gap-3 w-32 flex-shrink-0 border-r border-gray-200 bg-white/50 backdrop-blur-sm p-4 sticky top-0 h-screen overflow-y-auto">
          {/* Support Button */}
          {(progress.phase === ("IMPLEMENTATION" as ProgressState['phase']) ||
            progress.phase === ("BUSINESS_PLAN" as ProgressState['phase'])) && (
            <button
              onClick={() => handleNext("Support")}
              disabled={loading}
              className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 hover:border-blue-300 rounded-xl p-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex flex-col items-center space-y-2"
              title="Support - Get guided help"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform duration-300">
                💬
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold text-blue-800 group-hover:text-blue-900">Support</div>
                <div className="text-[10px] text-blue-600 group-hover:text-blue-700">Get help</div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          )}

          {/* Draft Button */}
          {(progress.phase === ("IMPLEMENTATION" as ProgressState['phase']) ||
            progress.phase === ("BUSINESS_PLAN" as ProgressState['phase'])) && (
            <button
              onClick={() => handleNext("Draft")}
              disabled={loading}
              className="group relative bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 border border-emerald-200 hover:border-emerald-300 rounded-xl p-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex flex-col items-center space-y-2"
              title="Draft - Generate content"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform duration-300">
                ✍️
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold text-emerald-800 group-hover:text-emerald-900">Draft</div>
                <div className="text-[10px] text-emerald-600 group-hover:text-emerald-700">Generate</div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          )}

          {/* Scrapping Button */}
          {(progress.phase === ("IMPLEMENTATION" as ProgressState['phase']) ||
            progress.phase === ("BUSINESS_PLAN" as ProgressState['phase'])) && (
            <button
              onClick={() => handleNext(currentInput.trim() ? `Scrapping: ${currentInput}` : "Scrapping")}
              disabled={loading}
              className="group relative bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border border-orange-200 hover:border-orange-300 rounded-xl p-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex flex-col items-center space-y-2"
              title="Scrapping - Polish existing text"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform duration-300">
                🔧
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold text-orange-800 group-hover:text-orange-900">Scrapping</div>
                <div className="text-[10px] text-orange-600 group-hover:text-orange-700">Polish text</div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          )}

          {/* Save Button */}
          {(progress.phase === ("IMPLEMENTATION" as ProgressState['phase']) ||
            progress.phase === ("BUSINESS_PLAN" as ProgressState['phase']) ||
            (progress.phase === 'GKY' && history.length > 0)) && (
            <button
              onClick={async () => {
                try {
                  toast.info("Saving your progress...");
                  const phase = progress.phase === 'GKY' ? 'GKY' : progress.phase === 'BUSINESS_PLAN' ? 'BUSINESS_PLAN' : 'IMPLEMENTATION';
                  const askedTag = progress.asked_q || undefined;
                  await syncSessionProgress(sessionId!, {
                    phase,
                    answered_count: progress.answered ?? 0,
                    asked_q: askedTag,
                  });
                  toast.success("Progress saved successfully!");
                } catch (err) {
                  console.error("Failed to save progress:", err);
                  toast.error("Failed to save progress");
                }
              }}
              disabled={loading}
              className="group relative bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 border border-violet-200 hover:border-violet-300 rounded-xl p-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex flex-col items-center space-y-2"
              title="Save - Save your progress"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform duration-300">
                💾
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold text-violet-800 group-hover:text-violet-900">Save</div>
                <div className="text-[10px] text-violet-600 group-hover:text-violet-700">Progress</div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          )}

          {/* Previous Question Button - At bottom of list */}
      {history.length > 0 && (progress.phase === 'GKY' || progress.phase === 'BUSINESS_PLAN') && (
            <button
          onClick={handleGoBack} 
              disabled={history.length === 0 || loading || backButtonLoading}
              className="group relative bg-gradient-to-br from-teal-50 to-blue-50 hover:from-teal-100 hover:to-blue-100 border border-teal-200 hover:border-teal-300 rounded-xl p-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex flex-col items-center space-y-2 mt-auto"
              title={currentQuestionNumber ? `Go back to Question ${currentQuestionNumber - 1}` : "Go back to previous question"}
            >
              {backButtonLoading ? (
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform duration-300">
                    ←
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-teal-800 group-hover:text-teal-900">Previous</div>
                    <div className="text-[10px] text-teal-600 group-hover:text-teal-700">Question</div>
                  </div>
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          )}
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Section */}
        <div className="flex-shrink-0 px-3 py-4 lg:px-3 lg:py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              {/* Back to Ventures - Redesigned with better positioning */}
              <motion.button
                whileHover={{ scale: 1.02, x: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/ventures")}
                className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-teal-600 bg-white/60 hover:bg-white/90 backdrop-blur-sm rounded-full border border-gray-200/50 hover:border-teal-300/50 transition-all duration-200 shadow-sm hover:shadow-md text-sm group"
              >
                <svg
                  className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="font-medium">All Ventures</span>
              </motion.button>

              <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-blue-500 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-md">
                    <img 
                      src={FounderportIcon} 
                      alt="Angel" 
                      className="!w-14 !h-14 object-cover"
                    />
                  </div>
                <div className="hidden sm:block">
                  <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                    <div className="relative">
                      <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-2 h-2 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-ping opacity-60"></div>
                    </div>
                    <span className="text-sm font-semibold text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text">
                      {headerPhaseLabel}
                    </span>
                    <div className="h-4 w-px bg-gradient-to-b from-emerald-300 to-teal-300"></div>
                    <span className="text-sm font-medium text-gray-700">
                      {currentStep} of {total}
                    </span>
                  </div>
                </div>
                <div className="sm:hidden">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-md border border-emerald-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                    <div className="relative">
                      <div className="w-1.5 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-1.5 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-ping opacity-60"></div>
                    </div>
                    <span className="text-xs font-semibold text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text">
                      {headerPhaseLabel}
                    </span>
                    <span className="text-xs font-medium text-gray-700">
                      {currentStep}/{total}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Button */}
              <button
                onClick={() => {
                  setShowProfileModal(true);
                  loadProfileData();
                }}
                className="p-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-white transition-colors"
                title="View Profile"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </button>

              {/* Mobile Navigation Toggle */}
              <button
                onClick={() => setShowMobileNav(!showMobileNav)}
                className="lg:hidden p-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-white transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>

            {progress.phase !== 'GKY' && (
              <ProgressCircle
                progress={percent}
                phase={progress.phase}
                combined={progress.combined}
                phase_breakdown={progress.phase_breakdown}
              />
            )}

            {showBusinessPlanButton && (
              <div className="mt-6 flex justify-center">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleViewPlan}
                    className="group relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                  >
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-base">📊</span>
                      <span>Business Plan</span>
                    </div>
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>

                  <button
                    onClick={handleViewRoadmap}
                    className="group relative bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                  >
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-base">🗺️</span>
                      <span>Roadmap Plan</span>
                    </div>
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modals */}
          <BusinessPlanModal
            open={planState.showModal}
            onClose={() =>
              setPlanState((prev) => ({ ...prev, showModal: false }))
            }
            plan={planState.plan}
            loading={planState.loading}
            error={planState.error}
            onEditPlan={handleEditPlan}
          />

          {/* Profile Modal */}
          {showProfileModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-500 to-blue-500 p-6 text-white sticky top-0 z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">👤 My Profile</h2>
                      <p className="text-sm opacity-90">Manage your account and subscription</p>
                    </div>
                    <button
                      onClick={() => setShowProfileModal(false)}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {loadingProfile ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
                    </div>
                  ) : (
                    <>
                      {/* User Information */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <span className="mr-2">📧</span>
                          Account Information
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Email:</span>
                            <span className="text-sm font-medium text-gray-900">{userProfile?.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">User ID:</span>
                            <span className="text-sm font-mono text-gray-700 text-xs">{userProfile?.id || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Subscription Details */}
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-5 border border-emerald-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <span className="mr-2">💳</span>
                          Subscription Details
                        </h3>
                        {subscriptionDetails?.has_active_subscription ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Status:</span>
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                {subscriptionDetails.subscription?.subscription_status?.toUpperCase() || 'ACTIVE'}
                              </span>
                            </div>
                            {subscriptionDetails.subscription && (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Amount:</span>
                                  <span className="text-sm font-semibold text-gray-900">
                                    ${subscriptionDetails.subscription.amount || 0} {subscriptionDetails.subscription.currency?.toUpperCase() || 'USD'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Current Period Start:</span>
                                  <span className="text-sm text-gray-900">
                                    {subscriptionDetails.subscription.current_period_start 
                                      ? new Date(subscriptionDetails.subscription.current_period_start).toLocaleDateString()
                                      : 'N/A'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Current Period End:</span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {subscriptionDetails.subscription.current_period_end 
                                      ? new Date(subscriptionDetails.subscription.current_period_end).toLocaleDateString()
                                      : 'N/A'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Cancel at Period End:</span>
                                  <span className="text-sm text-gray-900">
                                    {subscriptionDetails.subscription.cancel_at_period_end ? 'Yes' : 'No'}
                                  </span>
                                </div>
                              </>
                            )}
                            {!subscriptionDetails.subscription?.cancel_at_period_end && (
                              <div className="pt-4 border-t border-emerald-200">
                                <button
                                  onClick={handleCancelSubscription}
                                  disabled={cancellingSubscription}
                                  className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                  {cancellingSubscription ? (
                                    <>
                                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                      <span>Cancelling...</span>
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      <span>Cancel Subscription</span>
                                    </>
                                  )}
                                </button>
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                  Your subscription will remain active until the end of your current billing period
                                </p>
                              </div>
                            )}
                            {subscriptionDetails.subscription?.cancel_at_period_end && (
                              <div className="pt-4 border-t border-emerald-200">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                  <p className="text-sm text-yellow-800">
                                    ⚠️ Your subscription is scheduled to cancel at the end of your current billing period.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-gray-600 mb-4">No active subscription found</p>
                            <p className="text-sm text-gray-500">Subscribe to access premium features and download your documents</p>
                          </div>
                        )}
                      </div>

                      {/* Additional Information */}
                      <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <span className="mr-2">ℹ️</span>
                          Account Details
                        </h3>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p>• Access to all premium features</p>
                          <p>• Download business plans and roadmaps</p>
                          <p>• Priority support</p>
                          <p>• Regular updates and new features</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Roadmap is now shown as a full page, not a modal */}
        </div>

        {/* Scrollable Chat Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-3 pb-4 lg:pb-4 chat-container"
          style={{ 
            maxHeight: "calc(100vh - 320px)",
            minHeight: "calc(100vh - 320px)"
          }}
        >
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Chat History */}
            {history.map((pair, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-100"
              >
                <div className="p-3 sm:p-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-blue-50">
                  <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-blue-500 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-md">
                    <img 
                      src={FounderportIcon} 
                      alt="Angel" 
                      className="!w-14 !h-14 object-cover"
                    />
                  </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 mb-1 text-sm">
                        Angel
                      </div>
                      {(progress.phase === "GKY" || progress.phase === "BUSINESS_PLAN") && pair.questionNumber && (
                        <div className="mb-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Question {pair.questionNumber}
                          </span>
                        </div>
                      )}
                      <div className="space-y-3">
                        {pair.acknowledgement && (
                          <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-4 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-1.5">Angel Response</p>
                            <div className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-strong:font-semibold prose-strong:text-gray-900">
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => <p className="whitespace-pre-wrap mb-2 last:mb-0">{children}</p>,
                                  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                }}
                              >
                                {pair.acknowledgement}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                        <div className={pair.acknowledgement ? "space-y-2" : ""}>
                          {pair.acknowledgement && (
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">Next Question</p>
                          )}
                          <div className={pair.acknowledgement ? "rounded-lg border border-blue-200 bg-blue-50/70 px-4 py-3" : ""}>
                            <div className="text-gray-800 whitespace-pre-wrap text-sm">
                              <QuestionFormatter text={pair.question} phase={progress.phase} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 sm:p-4 bg-gray-50">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-6 h-6 bg-gray-300 rounded flex items-center justify-center text-xs flex-shrink-0">
                      👤
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 mb-1 text-sm">
                        You
                      </div>
                      <div className="text-gray-700 whitespace-pre-wrap text-sm">
                        {pair.answer}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Current Question - Angel asks (must appear BEFORE user's answer) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="p-3 sm:p-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-blue-50">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-blue-500 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-md">
                    <img 
                      src={FounderportIcon} 
                      alt="Angel" 
                      className="!w-14 !h-14 object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 mb-1 text-sm">
                      Angel
                    </div>
                    {(progress.phase === "GKY" || progress.phase === "BUSINESS_PLAN") && currentQuestionNumber && (
                      <div className="mb-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Question {currentQuestionNumber}
                        </span>
                      </div>
                    )}
                    <div className="text-gray-800 whitespace-pre-wrap text-sm angel-intro-text">
                      {progress.phase === "ROADMAP" || progress.phase === "ROADMAP_GENERATED" ? (
                        loading ? (
                          <AngelThinkingLoader />
                        ) : (
                          <div className="space-y-4">
                          <QuestionFormatter text={currentQuestion || "Your roadmap is ready!"} phase={progress.phase} />
                          <div className="mt-4 flex gap-3">
                            <button
                              onClick={() => navigate(`/ventures/${sessionId}/roadmap`)}
                              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2"
                            >
                              <span className="text-xl">🗺️</span>
                              <span>View Your Roadmap</span>
                            </button>
                            <button
                              onClick={handleStartImplementation}
                              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2"
                            >
                              <span className="text-xl">🚀</span>
                              <span>Start Implementation</span>
                            </button>
                          </div>
                          </div>
                        )
                      ) : loading && !pendingUserReply ? (
                        <div className="space-y-4">
                          <AngelThinkingLoader />
                        </div>
                      ) : (
                        <div className="space-y-3">
                            {currentAcknowledgement && (
                              <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-4 py-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-1.5">Angel Response</p>
                                <div className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-strong:font-semibold prose-strong:text-gray-900">
                                  <ReactMarkdown
                                    components={{
                                      p: ({ children }) => <p className="whitespace-pre-wrap mb-2 last:mb-0">{children}</p>,
                                      strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                    }}
                                  >
                                    {currentAcknowledgement}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            )}
                            <div className={currentAcknowledgement ? "space-y-2" : ""}>
                              {currentAcknowledgement && (
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">Next Question</p>
                              )}
                              <div className={currentAcknowledgement ? "rounded-lg border border-blue-200 bg-blue-50/70 px-4 py-3" : ""}>
                                <QuestionFormatter text={currentQuestion || "Loading…"} phase={progress.phase} />
                              </div>
                            </div>
                          </div>
                      )}
                    </div>
                    
                  </div>
                </div>
              </div>
            </div>

            {/* User's answer + Angel thinking - shown AFTER the question while waiting for response */}
            {pendingUserReply && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                  <div className="p-3 sm:p-4 bg-gray-50">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-6 h-6 bg-gray-300 rounded flex items-center justify-center text-xs flex-shrink-0">
                        👤
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 mb-1 text-sm">
                          You
                        </div>
                        <div className="text-gray-700 whitespace-pre-wrap text-sm">
                          {pendingUserReply}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <AngelThinkingLoader />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Input Area */}
        <div className="flex-shrink-0 bg-gradient-to-br from-slate-50 to-teal-50 px-3 py-3">
          <div className="max-w-4xl mx-auto">
            {/* Web Search Progress Indicator */}
            <WebSearchIndicator 
              isSearching={webSearchStatus.is_searching} 
              searchQuery={webSearchStatus.query} 
            />

            {/* Accept/Modify Buttons for Verification */}
            {showVerificationButtons && !loading && (
              <div className="mb-4">
                <AcceptModifyButtons
                  onAccept={handleAccept}
                  onModify={handleModify}
                  onDraftMore={handleDraftMore}
                  disabled={loading}
                  currentText={currentQuestion}
                  showDraftMore={currentQuestion?.toLowerCase().includes('draft') || false}
                />
              </div>
            )}

            {/* Yes/No Buttons for Section Verification */}
            {showYesNoButtons && !loading && (
              <div className="mb-4">
                <YesNoButtons
                  onYes={handleYes}
                  onNo={handleNo}
                  disabled={loading}
                />
              </div>
            )}

            {/* Skip Button for Business Plan (Testing Only) */}
            {progress.phase === ("BUSINESS_PLAN" as ProgressState['phase']) && !loading && (
              <div className="mb-3 flex justify-center">
                <button
                  onClick={() => handleNext("jump to question 45")}
                  disabled={loading}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm flex items-center gap-2"
                >
                  <span>⏭️</span>
                  <span>Skip to Question 45 (Testing)</span>
                </button>
              </div>
            )}
            
            {progress.phase !== 'GKY' && (
              <div className="mb-3 flex justify-center">
                <button
                  onClick={() => setShowInstructions(true)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  title="Help"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4 0 2.21-1.79 4-4 4-1.742 0-3.223-.835-3.772-2M12 18v.01M12 2a10 10 0 100 20 10 10 0 000-20z"></path></svg>
                </button>
              </div>
            )}

            <SmartInput
              value={currentInput}
              onChange={setCurrentInput}
              onSubmit={handleNext}
              placeholder="Type your response... (Enter to send)"
              disabled={loading}
              loading={loading}
              currentQuestion={currentQuestion}
              currentPhase={progress.phase}
            />

            {/* Quick Actions Row - Mobile only (desktop shows in left sidebar) */}
            {(progress.phase === ("IMPLEMENTATION" as ProgressState['phase']) ||
              progress.phase === ("BUSINESS_PLAN" as ProgressState['phase'])) && (
              <div className="mt-4 lg:hidden">
                <div className="text-center mb-3">
                  <p className="text-gray-500 text-sm font-medium">🚀 Quick Actions</p>
                  <p className="text-gray-400 text-xs">Choose a tool to help with your response</p>
                </div>
                
                <div className="grid grid-cols-4 gap-3">
                  {/* Support Button */}
                  <button
                    onClick={() => handleNext("Support")}
                    disabled={loading}
                    className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 hover:border-blue-300 rounded-xl p-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm group-hover:scale-110 transition-transform duration-300">
                        💬
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold text-blue-800 group-hover:text-blue-900">Support</div>
                      </div>
                </div>
                  </button>

                  {/* Draft Button */}
                <button
                    onClick={() => handleNext("Draft")}
                    disabled={loading}
                    className="group relative bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 border border-emerald-200 hover:border-emerald-300 rounded-xl p-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white text-sm group-hover:scale-110 transition-transform duration-300">
                        ✍️
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold text-emerald-800 group-hover:text-emerald-900">Draft</div>
                      </div>
                    </div>
                  </button>

                  {/* Scrapping Button */}
                  <button
                    onClick={() => handleNext(currentInput.trim() ? `Scrapping: ${currentInput}` : "Scrapping")}
                    disabled={loading}
                    className="group relative bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border border-orange-200 hover:border-orange-300 rounded-xl p-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white text-sm group-hover:scale-110 transition-transform duration-300">
                        🔧
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold text-orange-800 group-hover:text-orange-900">Scrapping</div>
                      </div>
                    </div>
                </button>

                  {/* Save Button */}
                  <button
                    onClick={async () => {
                      try {
                        toast.info("Saving your progress...");
                        const phase = progress.phase === 'GKY' ? 'GKY' : progress.phase === 'BUSINESS_PLAN' ? 'BUSINESS_PLAN' : 'IMPLEMENTATION';
                        const askedTag = progress.asked_q || undefined;
                        await syncSessionProgress(sessionId!, {
                          phase,
                          answered_count: progress.answered ?? 0,
                          asked_q: askedTag,
                        });
                        toast.success("Progress saved successfully!");
                      } catch (err) {
                        console.error("Failed to save progress:", err);
                        toast.error("Failed to save progress");
                      }
                    }}
                    disabled={loading}
                    className="group relative bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 border border-violet-200 hover:border-violet-300 rounded-xl p-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm group-hover:scale-110 transition-transform duration-300">
                        💾
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold text-violet-800 group-hover:text-violet-900">Save</div>
                      </div>
                    </div>
                  </button>
                </div>
                </div>
              )}

              {progress.phase === "GKY" && (
                <div className="mt-2.5">
                  <p className="text-gray-400 text-xs text-center">
                    💡 Press Enter to send or Shift+Enter for new line
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Right Navigation Panel - Desktop */}
      <div className="hidden lg:block w-80 flex-shrink-0 border-l border-gray-200 h-screen sticky top-0 overflow-y-auto">
        <QuestionNavigator
          questions={questions}
          currentPhase={progress.phase}
          onQuestionSelect={handleQuestionSelect}
          currentProgress={{
            phase: progress.phase,
            answered: answeredCount,
            total,
            percent,
            phase_answered: answeredCount,
            overall_progress: {
              answered: rawOverallAnswered,
              total: overallTotal,
              percent: overallPercent,
              phase_breakdown: progress.overall_progress?.phase_breakdown ?? {
                gky_completed: 0,
                gky_total: 5,
                bp_completed: 0,
                bp_total: 45,
              },
            },
          }}
          currentQuestionNumber={currentQuestionNumber}
          showStepPercent={false}
          onEditPlan={progress.phase === "BUSINESS_PLAN" ? handleEditPlan : undefined}
        />
      </div>

      {/* Mobile Navigation Panel - Overlay */}
      {showMobileNav && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileNav(false)}
          />
          
          {/* Navigation Panel */}
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-blue-50">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-blue-500 rounded flex items-center justify-center text-white text-sm">
                  <img 
                    src={FounderportIcon} 
                    alt="Angel" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
              </div>
              <button
                onClick={() => setShowMobileNav(false)}
                className="p-2 rounded-lg hover:bg-white/80 transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            
            <div className="h-full flex flex-col">
              {/* Progress Summary */}
              <div className="p-4 border-b border-gray-100 bg-white">
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600 mb-1">Current Progress</div>
                  <div className="text-lg font-bold text-gray-900">{headerPhaseLabel}</div>
                  <div className="text-sm text-gray-500">Step {currentStep} of {total}</div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Questions List - Scrollable Area */}
              <div className="flex-1 overflow-y-auto px-4 py-2">
                <div className="space-y-3">
                  {questions.map((question) => (
                    <div
                      key={question.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        question.completed
                          ? 'bg-green-50 border-green-200 hover:bg-green-100'
                          : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                      }`}
                      onClick={() => {
                        handleQuestionSelect(question.id);
                        setShowMobileNav(false);
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0 ${
                          question.completed
                            ? 'bg-green-500'
                            : 'bg-blue-500'
                        }`}>
                          {question.completed ? '✓' : '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 mb-1">
                            {question.phase} • Q{question.number}
                          </div>
                          <div className="text-sm font-medium text-gray-900 line-clamp-3">
                            {question.title}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Bottom Actions */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-3">
                {showBusinessPlanButton && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleViewPlan();
                        setShowMobileNav(false);
                      }}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-2.5 rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-teal-600 transition-colors"
                    >
                      📊 Plan
                    </button>
                    <button
                      onClick={() => {
                        handleViewRoadmap();
                        setShowMobileNav(false);
                      }}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-2.5 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-600 transition-colors"
                    >
                      🗺️ Roadmap
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowMobileNav(false)}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modify Modal */}
      <ModifyModal
        isOpen={modifyModal.isOpen}
        onClose={() => setModifyModal(prev => ({ ...prev, isOpen: false }))}
        currentText={modifyModal.currentText}
        onSave={handleModifySave}
        loading={loading}
      />

      {/* Roadmap Edit Modal */}
      <RoadmapEditModal
        isOpen={roadmapEditModal.isOpen}
        onClose={() => setRoadmapEditModal(prev => ({ ...prev, isOpen: false }))}
        roadmapContent={roadmapEditModal.roadmapContent}
        sessionId={sessionId!}
        onSave={handleSaveEditedRoadmap}
        loading={loading}
      />

      {/* Upload Plan Modal */}
      <UploadPlanModal
        isOpen={uploadPlanModal.isOpen}
        onClose={handleUploadModalClose}
        onUploadSuccess={handleUploadPlanSuccess}
        sessionId={sessionId}
        onStartAnswering={async (analysis?: any, businessInfo?: any) => {
          // Close upload modal
          handleUploadModalClose();
          
          // Normalize analysis data structure (backend uses snake_case, frontend uses camelCase)
          let normalizedAnalysis = analysis || uploadAnalysis;
          if (normalizedAnalysis && normalizedAnalysis.missing_questions && !normalizedAnalysis.missingQuestions) {
            normalizedAnalysis = {
              ...normalizedAnalysis,
              missingQuestions: normalizedAnalysis.missing_questions
            };
          }
          
          const analysisToUse = normalizedAnalysis;
          const businessInfoToUse = businessInfo || (uploadAnalysis?.businessInfo);
          
          // Ensure we're in BUSINESS_PLAN phase (or set it if not)
          try {
            setLoading(true);
            
            console.log("🎯 onStartAnswering called with:", {
              hasAnalysis: !!analysisToUse,
              hasBusinessInfo: !!businessInfoToUse,
              missingCount: analysisToUse?.missingQuestions?.length || 0,
              analysisStructure: analysisToUse ? Object.keys(analysisToUse) : [],
              firstMissing: analysisToUse?.missingQuestions?.[0]
            });
            
            // If we have missing questions from analysis, save found info and start from first missing question
            if (analysisToUse && analysisToUse.missingQuestions && analysisToUse.missingQuestions.length > 0) {
              const firstMissing = analysisToUse.missingQuestions[0];
              // Handle both question_number (backend) and questionNumber (frontend) formats
              const firstMissingNumber = firstMissing.question_number || firstMissing.questionNumber;
              
              if (!firstMissingNumber) {
                console.error("❌ First missing question has no question_number:", firstMissing);
                toast.error("Invalid analysis data. Please try uploading again.");
                return;
              }
              
              // First, ensure session is in BUSINESS_PLAN phase
              try {
                await syncSessionProgress(sessionId!, {
                  phase: "BUSINESS_PLAN",
                  answered_count: 0,
                  asked_q: undefined, // Will be set by jump message
                });
                console.log("✅ Set session phase to BUSINESS_PLAN");
              } catch (phaseError) {
                console.warn("Failed to set phase (continuing anyway):", phaseError);
              }
              
              // Extract missing question numbers from analysis
              const missingNumbers = analysisToUse.missingQuestions.map((q: any) => q.question_number || q.questionNumber).filter((n: any) => n != null);
              
              // Save found information to chat history
              // NOTE: Backend will process ALL 46 questions and determine which are truly found vs missing
              // We send the original missing_questions from analysis, but backend will update it based on actual extraction results
              try {
                const saveResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/upload-plan/save-found-info`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('sb_access_token')}`
                  },
                  body: JSON.stringify({
                    session_id: sessionId,
                    business_info: businessInfoToUse || {},
                    found_questions: [],  // Backend will determine actual found questions by extracting answers
                    missing_questions: missingNumbers  // Original missing questions from analysis
                  })
                });
                
                const saveData = await saveResponse.json();
                if (saveData.success) {
                  console.log(`✅ Saved ${saveData.saved_count} found information entries to chat history`);
                  console.log(`📊 Actual found questions: ${saveData.found_questions || []}`);
                  console.log(`📊 Updated missing questions: ${saveData.missing_questions || []}`);
                  console.log(`⚠️ Questions that failed extraction: ${saveData.failed_extraction || []}`);
                  
                  // Update analysis with actual found/missing questions from backend
                  const actualFoundQuestions = saveData.found_questions || [];
                  const actualMissingQuestions = saveData.missing_questions || [];
                  
                  // Update the analysis state with backend's actual results
                  if (actualMissingQuestions.length > 0) {
                    setUploadAnalysis({
                      missingQuestions: actualMissingQuestions.map((qNum: number) => ({
                        question_number: qNum,
                        question_text: `Question ${qNum}`,
                        category: "General",
                        priority: "medium"
                      })),
                      businessInfo: businessInfoToUse || {}
                    });
                  }
                  
                  toast.success(`Saved ${saveData.saved_count} answers from your plan! ${actualMissingQuestions.length} questions still need answers.`);
                  
                  // CRITICAL: Refresh history to show uploaded Q&A pairs in the UI
                  // The Q&A pairs are already saved to the database, now we need to reload them
                  try {
                    const refreshedHistory = await fetchSessionHistory(sessionId);
                    
                    // Rebuild conversation pairs from history (same logic as restoreSessionFromHistory)
                    const buildPairs = (records: any[]) => {
                      const pairs: ConversationPair[] = [];
                      let pendingQuestion: string | null = null;
                      let pendingAck: string | null = null;
                      let pendingNumber: number | null = null;
                      let pendingPhase: ConversationPair['phase'] | null = null;
                      const phaseCounters: Record<string, number> = {};

                      records.forEach((record) => {
                        if (record.role === 'assistant') {
                          if (!record.content) return;
                          const hasQuestionTag = record.content.match(/\[\[Q:([A-Z_]+)\.(\d{2})]]/);
                          if (!hasQuestionTag) return;
                          
                          const { acknowledgement, question } = parseAngelReply(record.content);
                          const tagMatch = record.content.match(/\[\[Q:([A-Z_]+)\.(\d{2})]]/);
                          const rawPhase = tagMatch ? tagMatch[1] : record.phase;
                          const rawUpper3 = rawPhase ? rawPhase.toUpperCase() : 'GKY';
                          const normalizedPhase = rawUpper3 === 'KYC' ? 'GKY' : rawUpper3;
                          const counter = phaseCounters[normalizedPhase] ?? 0;
                          const parsedNumber = tagMatch ? parseInt(tagMatch[2], 10) : null;

                          if (parsedNumber) {
                            phaseCounters[normalizedPhase] = Math.max(counter, parsedNumber);
                            pendingNumber = parsedNumber;
                          } else {
                            phaseCounters[normalizedPhase] = counter + 1;
                            pendingNumber = phaseCounters[normalizedPhase];
                          }

                          pendingQuestion = question;
                          pendingAck = acknowledgement;
                          pendingPhase = normalizedPhase as ConversationPair['phase'];
                        } else if (record.role === 'user') {
                          if (!pendingQuestion) return;
                          const answerText = (record.content || '').trim();
                          if (!answerText || answerText.toUpperCase() === 'EMPTY') {
                            return;
                          }
                          pairs.push({
                            question: pendingQuestion,
                            answer: answerText,
                            acknowledgement: pendingAck || undefined,
                            questionNumber: pendingNumber ?? undefined,
                            phase: pendingPhase ?? undefined,
                          });
                          pendingQuestion = null;
                          pendingAck = null;
                          pendingNumber = null;
                          pendingPhase = null;
                        }
                      });

                      return pairs;
                    };
                    
                    const newPairs = buildPairs(refreshedHistory || []);
                    setHistory(newPairs);
                    console.log(`✅ Refreshed history - now showing ${newPairs.length} Q&A pairs (including ${saveData.saved_count} from uploaded plan)`);
                  } catch (refreshError) {
                    console.warn("Failed to refresh history after save:", refreshError);
                    // Don't show error to user - history will refresh on next page load
                  }
                }
              } catch (saveError) {
                console.warn("Failed to save found info (continuing anyway):", saveError);
                toast.warning("Some information may not have been saved. Please continue.");
              }
              
              // Get updated missing questions from the save response (if we got it)
              // Use the actual missing questions returned by backend, or fallback to original
              let finalMissingQuestions = missingNumbers;
              let finalFirstMissing = firstMissingNumber;
              
              // Try to get updated missing questions from the save response
              // (The save response should have the actual missing questions after extraction)
              // Note: We already called save-found-info above, so we should use those results
              // But if that failed, we'll use the original analysis
              
              // Send a message to backend to jump to the first missing question
              // Include missing questions list in the message for backend to track
              const missingNumbersList = finalMissingQuestions.join(',');
              const jumpMessage = `Start from question ${finalFirstMissing} to answer missing questions from uploaded plan. Missing questions: ${missingNumbersList}`;
              
              console.log(`🚀 Sending jump message: "${jumpMessage}"`);
              console.log(`📋 First missing question: ${finalFirstMissing}`);
              console.log(`📋 Total missing questions: ${finalMissingQuestions.length}`);
              console.log(`📋 Missing questions list: [${missingNumbersList}]`);
              
              // Small delay to ensure session phase is synced
              await new Promise(resolve => setTimeout(resolve, 100));
              
              try {
                const {
                  result: { reply, progress: updatedProgress, question_number },
                } = await fetchQuestion(jumpMessage, sessionId!);
                
                console.log(`✅ Received reply from backend, question_number: ${question_number}`);
                
                // Update session with missing questions list
                try {
                  await syncSessionProgress(sessionId!, {
                    phase: updatedProgress.phase,
                    answered_count: updatedProgress.answered || 0,
                    asked_q: `BUSINESS_PLAN.${firstMissingNumber.toString().padStart(2, '0')}`,
                  });
                } catch (syncError) {
                  console.warn("Failed to sync progress:", syncError);
                }
                
                const { acknowledgement: ack, question: parsedQ } = parseAngelReply(reply);
                const questionNumber = deriveQuestionNumber(question_number, reply, updatedProgress);
                
                console.log(`📊 Derived question number: ${questionNumber}, Expected: ${firstMissingNumber}`);
                
                if (questionNumber !== firstMissingNumber) {
                  console.warn(`⚠️ Expected question ${firstMissingNumber} but got ${questionNumber}`);
                  console.warn(`⚠️ Reply preview: ${reply.substring(0, 200)}`);
                }
                
                setCurrentQuestion(parsedQ);
                setCurrentAcknowledgement(ack);
                setCurrentQuestionNumber(questionNumber);
                updateQuestionTracker(updatedProgress.phase, questionNumber);
                applyProgressUpdate(updatedProgress);
                
                if (questionNumber === firstMissingNumber) {
                  toast.success(`Starting from Question ${firstMissingNumber} - ${analysisToUse.missingQuestions.length} questions to answer!`);
                } else {
                  toast.warning(`Expected Question ${firstMissingNumber} but got Question ${questionNumber}. Please check the backend logs.`);
                }
              } catch (fetchError) {
                console.error("❌ Error fetching question:", fetchError);
                toast.error("Failed to jump to missing question. Please try again.");
                throw fetchError;
              }
            } else {
                // No missing questions or analysis - start from beginning
                // Ensure phase is set first
                try {
                  await syncSessionProgress(sessionId!, {
                    phase: "BUSINESS_PLAN",
                    answered_count: 0,
                    asked_q: undefined,
                  });
                } catch (phaseError) {
                  console.warn("Failed to set phase:", phaseError);
                }
                
                const {
                  result: { reply, progress: updatedProgress, question_number },
                } = await fetchQuestion("", sessionId!);
                const { acknowledgement: ack2, question: parsedQ2 } = parseAngelReply(reply);
                const questionNumber = deriveQuestionNumber(question_number, reply, updatedProgress);
                setCurrentQuestion(parsedQ2);
                setCurrentAcknowledgement(ack2);
                setCurrentQuestionNumber(questionNumber);
                updateQuestionTracker(updatedProgress.phase, questionNumber);
                applyProgressUpdate(updatedProgress);
                toast.success("Ready to answer questions!");
              }
            } catch (error) {
              console.error("Failed to start answering:", error);
              toast.error("Failed to start answering questions");
            } finally {
              setLoading(false);
            }
        }}
      />

      {/* Budget Setup Modal */}
      {/* <BudgetSetupModal
        isOpen={budgetSetupModal.isOpen}
        onClose={() => setBudgetSetupModal({ isOpen: false, businessPlanCompleted: false })}
        onComplete={handleBudgetSetupComplete}
        businessContext={mergedBusinessContext}
      /> */}

      {/* GKY-to-Business-Plan modal removed — transition happens inline in chat */}

      {showInstructions && (
        <BusinessPlanningInstructions onClose={() => setShowInstructions(false)} />
      )}
    </div>
  );
}