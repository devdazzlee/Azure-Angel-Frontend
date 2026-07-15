"use client";

// ChatPage.tsx
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  fetchBusinessPlan,
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
import UploadPlanModal from "../../components/UploadPlanModal";
import VentureOnboardingTips from "../../components/VentureOnboardingTips";
import GkyProceedButton from "../../components/GkyProceedButton";
import { isVentureOnboardingTipsComplete } from "@/constants/ventureOnboarding";
import FounderportIcon from "../../assets/images/home/Founderport_Favicon_Mariner.svg?url";
import VentureBrandMark from "../../components/layout/VentureBrandMark";
import Implementation from "../Implementation";
import RoadmapEditModal from "../../components/RoadmapEditModal";
import BusinessQuestionFormatter from "../../components/BusinessQuestionFormatter";
import BackButton from "../../components/BackButton";
import AngelThinkingLoader from "../../components/AngelThinkingLoader";
import QuestionFormatter from "../../components/QuestionFormatter";
import {
  getAngelMessageBadgeLabel,
  isAutoResearchContent,
  isSectionSummaryContent,
  normalizeAngelMarkdown,
  normalizeSectionSummaryMarkdown,
} from "../../utils/angelMessageKind";
import {
  consumePendingImportAfterTour,
  hasPendingImportAfterTour,
  isBusinessPlanImportOfferActive,
  markPendingImportAfterTour,
  persistImportPromptDismissed,
  persistPlanImported,
  readImportPromptDismissed,
  readPlanImported,
  resolveBusinessPlanAnsweredCount,
  shouldAutoOpenImportModal,
} from "../../utils/businessPlanImportPrompt";
import { useBusinessContext } from "../../hooks/useBusinessContext";
import { normalizeBusinessContext } from "../../types/businessContext";
import {
  MODIFY_HISTORY_ANSWER_LABEL,
  extractCommandAssistBody,
  resolveModifyAssistantSnapshot,
} from "../../utils/resolveModifyAssistantSnapshot";
import ReactMarkdown from "react-markdown";
import type { Budget, BudgetItem, APIResponse } from "../../types/apiTypes";
import BusinessPlanningInstructions from "../../components/BusinessPlanningInstructions";
// GkyToBusinessPlanIntro modal removed — transition happens inline in chat
import { budgetService } from "../../services/budgetService";
import {
  CoachMarkProvider,
  useCoachMarks,
  BUSINESS_PLAN_TOUR_ID,
  businessPlanQuickActionSteps,
} from "../../components/coachmarks";
import { isCoachTourSeen } from "../../constants/ventureOnboarding";

interface ConversationPair {
  question: string;
  answer: string;
  acknowledgement?: string;
  questionNumber?: number;
  phase?: 'GKY' | 'BUSINESS_PLAN' | 'ROADMAP' | 'ROADMAP_GENERATED' | 'IMPLEMENTATION' | 'PLAN_TO_ROADMAP_TRANSITION' | 'PLAN_TO_SUMMARY_TRANSITION' | 'PLAN_TO_BUDGET_TRANSITION' | 'ROADMAP_TO_IMPLEMENTATION_TRANSITION';
  /** Section-end summary content shown after this Q&A once accepted */
  sectionSummary?: string;
  sectionSummaryAccepted?: boolean;
  /** Draft, Support, Scrapping etc. - display in chat but exclude from progress */
  isCommand?: boolean;
  /** Which quick action produced this row — used for the response card title only */
  commandKind?: "draft" | "support" | "scrapping" | "modify";
  /** Full raw Angel API reply for Draft/Support/Scrapping/Modify — used for Modify snapshot */
  assistReply?: string;
}

/**
 * Strip standalone option-word lines from Angel's message body. The option picker
 * UI renders Yes/No/work-situation/mentor-style/rating choices as buttons, so
 * leaving them inline in the text duplicates them visibly. A line qualifies only if
 * it is *just* the option(s) (after trimming optional leading dash from bullet
 * normalization and optional trailing punctuation) — partial matches like
 * "No worries" or sentences containing numbers are safe.
 */
const PICKER_OPTION_LINE_REGEX =
  /^[\s\-–—]*(?:Yes\s*\/\s*No|Yes|No|Later|Full-time employed|Part-time|Student|Unemployed|Self-employed\/freelancer|Self-employed|Freelancer|Other|Be more hands-on|Be more of a mentor|Alternate based on the task)[\s.]*$/gim;

// Standalone rating-scale lines, e.g. "1 2 3 4 5", "1  2  3  4  5", "1-5",
// "1, 2, 3, 4, 5", or empty-circle/filled-circle variants like "○ ○ ○ ○ ○".
const PICKER_RATING_LINE_REGEX =
  /^[\s\-–—]*(?:(?:[1-5][\s,.\-–—]+){2,4}[1-5]|[○●◯•][\s]*(?:[○●◯•][\s]*){3,4}|1\s*[-–—]\s*5)[\s.]*$/gm;

function stripPickerOptionLines(text: string): string {
  return text
    .replace(PICKER_OPTION_LINE_REGEX, "")
    .replace(PICKER_RATING_LINE_REGEX, "");
}

/** Map user quick-action text to command kind (case-insensitive; supports `Scrapping: notes`). */
function inferCommandKindFromUserInput(userInput: string): ConversationPair["commandKind"] | undefined {
  const a = userInput.toLowerCase().trim();
  if (a.startsWith("scrapping:") || a === "scrapping" || a === "scraping") return "scrapping";
  if (a === "support") return "support";
  if (a === "draft" || a === "draft more" || a === "draft answer") return "draft";
  return undefined;
}

function commandQuickActionResponseTitle(kind: ConversationPair["commandKind"]): string {
  if (kind === "support") return "Support Response";
  if (kind === "scrapping") return "Scrapping Response";
  if (kind === "modify") return "Modified Response";
  if (kind === "draft") return "Draft Response";
  return "Angel Response";
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
  overall_progress?: {  // Phase-scoped UI progress (GKY: X/5, BP: X/45 — not mixed)
    answered: number;
    total: number;
    percent: number;
    scope?: 'gky' | 'business_plan';
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

// Updated to include PLAN_TO_ROADMAP_TRANSITION phase

const QUESTION_COUNTS = {
  GKY: 5,  // 5 sequential questions (limited for simplified onboarding)
  BUSINESS_PLAN: 45,  // Updated to 45 questions (9 sections restructured)
  ROADMAP: 1,
  IMPLEMENTATION: 10,
};

/** Seed hook from session list row before /business-context round-trip completes. */
function businessContextSeedFromSession(session?: Record<string, unknown>) {
  if (!session) return null;
  const rawContext =
    session.business_context && typeof session.business_context === "object"
      ? (session.business_context as Record<string, unknown>)
      : {};
  return normalizeBusinessContext({
    business_name: rawContext.business_name ?? session.business_name,
    industry: rawContext.industry ?? session.industry,
    location: rawContext.location ?? session.location,
    business_type: rawContext.business_type ?? session.business_type,
    uploaded_plan_mode: rawContext.uploaded_plan_mode,
  });
}

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

/**
 * Resolve the displayed question number. The session's `asked_q` is the
 * source of truth — the backend always sends it in `progress.asked_q`
 * (see Angel-Backend/utils/progress.py). `result.question_number` is a
 * convenience parse of the same tag and is null on command turns
 * (Support/Draft/Scrapping/Modify) where no new tag is emitted; in those
 * turns we fall back to the tag and recover the same number.
 *
 * The old `[[Q:GKY.NN]]` reply-text regex fallback was removed: the router
 * strips those markers from `display_reply` before sending, so the regex
 * could never match. Keeping it hid the real contract gap on `asked_q`.
 */
const deriveQuestionNumber = (
  backendQuestionNumber: number | null | undefined,
  _replyText: string,
  progressPayload?: Record<string, any>,
  options?: { isSectionSummary?: boolean },
): number | null => {
  if (options?.isSectionSummary) return null;
  if (typeof backendQuestionNumber === "number" && !Number.isNaN(backendQuestionNumber)) {
    return backendQuestionNumber;
  }
  return parseQuestionNumberFromTag(progressPayload?.asked_q);
};

/** Map API reply metadata to display state (section summaries are not questions). */
const resolveDisplayFromAngelResult = (
  result: { question_number?: number | null; is_section_summary?: boolean },
  progress: Record<string, any>,
) => {
  const isSectionSummary = Boolean(result.is_section_summary);
  const questionNumber = isSectionSummary
    ? null
    : deriveQuestionNumber(result.question_number, "", progress);
  return { isSectionSummary, questionNumber };
};

const isAcceptUserInput = (text: string) => text.trim().toLowerCase() === "accept";

/**
 * Rebuild ConversationPair[] from persisted chat_history.
 * Tagged assistant messages start Q&A pairs; section summaries (no [[Q:…]]
 * tag) attach to the preceding pair; Accept is not a separate Q&A row.
 */
function buildHistoryPairs(
  records: Array<{ role: string; content?: string; phase?: string }>,
  parseReply: (raw: string) => { acknowledgement: string; question: string },
): {
  pairs: ConversationPair[];
  pendingQuestion: string | null;
  pendingAcknowledgement: string | null;
  pendingNumber: number | null;
  pendingPhase: ConversationPair["phase"] | null;
} {
  const pairs: ConversationPair[] = [];
  let pendingQuestion: string | null = null;
  let pendingAck: string | null = null;
  let pendingNumber: number | null = null;
  let pendingPhase: ConversationPair["phase"] | null = null;
  // Whether the pending (tagged) assistant turn carried an auto-generated answer
  // (auto-research, e.g. Q11/Q12). Such turns are accepted, not typed — we must
  // still preserve them as a Q&A pair rather than discard them on "Accept".
  let pendingIsAutoResearch = false;
  const phaseCounters: Record<string, number> = {};

  for (const record of records) {
    if (record.role === "assistant") {
      if (!record.content) continue;
      const content = record.content;

      if (isSectionSummaryContent(content)) {
        const { question: summaryText } = parseReply(content);
        const summary = (summaryText || content).trim();
        if (pairs.length > 0 && summary) {
          const lastIdx = pairs.length - 1;
          pairs[lastIdx] = { ...pairs[lastIdx], sectionSummary: summary };
        }
        pendingQuestion = null;
        pendingAck = null;
        pendingNumber = null;
        pendingPhase = null;
        pendingIsAutoResearch = false;
        continue;
      }

      const tagMatch = content.match(/\[\[Q:([A-Z_]+)\.(\d{2})]]/);
      if (!tagMatch) continue;

      const { acknowledgement, question } = parseReply(content);
      const rawPhase = tagMatch[1] || record.phase || "GKY";
      const normalizedPhase = (rawPhase.toUpperCase() === "KYC" ? "GKY" : rawPhase.toUpperCase()) as ConversationPair["phase"];
      const counter = phaseCounters[normalizedPhase as string] ?? 0;
      const parsedNumber = parseInt(tagMatch[2], 10);
      if (!Number.isNaN(parsedNumber)) {
        phaseCounters[normalizedPhase as string] = Math.max(counter, parsedNumber);
        pendingNumber = parsedNumber;
      } else {
        phaseCounters[normalizedPhase as string] = counter + 1;
        pendingNumber = phaseCounters[normalizedPhase as string];
      }
      pendingQuestion = question;
      pendingAck = acknowledgement;
      pendingPhase = normalizedPhase;
      pendingIsAutoResearch = isAutoResearchContent(content);
    } else if (record.role === "user") {
      const answerText = (record.content || "").trim();
      if (!answerText || answerText.toUpperCase() === "EMPTY") continue;

      if (isAcceptUserInput(answerText)) {
        // Accepting an auto-generated answer (auto-research) is the only way those
        // turns get "answered". Preserve the question + generated body as a pair so
        // it stays in the chat; otherwise the next tagged turn overwrites it and the
        // content is lost on reload.
        if (pendingQuestion && pendingIsAutoResearch) {
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
          pendingIsAutoResearch = false;
          continue;
        }
        if (pairs.length > 0 && pairs[pairs.length - 1].sectionSummary) {
          const lastIdx = pairs.length - 1;
          pairs[lastIdx] = { ...pairs[lastIdx], sectionSummaryAccepted: true };
        }
        continue;
      }

      if (!pendingQuestion) continue;
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
      pendingIsAutoResearch = false;
    }
  }

  return {
    pairs,
    pendingQuestion,
    pendingAcknowledgement: pendingAck,
    pendingNumber,
    pendingPhase,
  };
}

/**
 * Tiny effect-only child that lives inside the CoachMarkProvider so it can
 * call the hook. Kicks off the Business Plan quick-actions tour the first
 * time the user crosses into that phase. The provider itself short-circuits
 * if the tour has already been seen for this session.
 */
function BusinessPlanTourTrigger({
  phase,
  uploadModalOpen,
}: {
  phase: string;
  uploadModalOpen: boolean;
}) {
  const { startTour } = useCoachMarks();
  useEffect(() => {
    if (phase !== "BUSINESS_PLAN") return;
    if (uploadModalOpen) return;
    startTour(BUSINESS_PLAN_TOUR_ID, businessPlanQuickActionSteps);
  }, [phase, uploadModalOpen, startTour]);
  return null;
}

export default function ChatPage() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [needsInitialQuestion, setNeedsInitialQuestion] = useState(false);
  const [ventureOnboardingOpen, setVentureOnboardingOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInitialIntroShown = useRef(false);
  /** Raw last Angel reply before a command turn — active questionnaire prompt + research. */
  const lastFullAssistantReplyRef = useRef<string>("");
  /** Full API reply from the latest Draft/Support/Scrapping/Modify assist — Modify snapshot source. */
  const lastCommandAssistReplyRef = useRef<string>("");
  /**
   * Backend-authoritative flag for whether lastFullAssistantReplyRef is an
   * auto-research answer (Q11/12/17/23/26/27/34/35/42). Set from the API
   * response's `is_auto_research` field whenever a new reply arrives — do not
   * re-derive this from message text; that duplicated regex-based guess is
   * what let accepted auto-research answers silently vanish before.
   */
  const lastReplyIsAutoResearchRef = useRef<boolean>(false);
  const {
    context: businessContext,
    refresh: refreshBusinessContext,
    seed: seedBusinessContext,
    hasImportedPlan: hasImportedPlanFromDb,
  } = useBusinessContext(sessionId);
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

      const { data: subscriptionData } = await httpClient.get<any>('/stripe/check-subscription-status');
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
      const { data } = await httpClient.post<any>('/stripe/cancel-subscription');
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

  const [history, setHistory] = useState<ConversationPair[]>([]);
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
  const [isCurrentSectionSummary, setIsCurrentSectionSummary] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const [loading, setLoading] = useState(false);
  /** User's answer displayed while waiting for Angel's reply (keeps question + reply visible during loading) */
  const [pendingUserReply, setPendingUserReply] = useState<string | null>(null);
  /** Prior answer restored by go-back — shown with Accept/Modify for review */
  const [goBackReviewAnswer, setGoBackReviewAnswer] = useState<string | null>(null);
  const [goBackUserDisplay, setGoBackUserDisplay] = useState<string | null>(null);
  const goBackAcceptPayloadRef = useRef<string>("accept");
  /** Modified answer body awaiting Accept — separate from go-back resubmit */
  const pendingModifyAcceptRef = useRef<string>("");
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

  useEffect(() => {
    if (!sessionId) return;
    if (progress.phase === "ROADMAP_TO_IMPLEMENTATION_TRANSITION") {
      navigate(`/ventures/${sessionId}/implementation-transition`, { replace: true });
    }
  }, [sessionId, progress.phase, navigate]);

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
        // Backend sends phase-scoped overall_progress (never GKY+BP mixed in BP UI).
        const scoped = progressData.overall_progress;
        phaseAnsweredForDisplay = phaseAnswered;
        combinedTotal =
          typeof scoped?.total === "number"
            ? scoped.total
            : progressData.phase === "GKY"
              ? QUESTION_COUNTS.GKY
              : QUESTION_COUNTS.BUSINESS_PLAN;
        combinedAnswered =
          typeof scoped?.answered === "number" ? scoped.answered : phaseAnswered;
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
  const [awaitingGkyProceed, setAwaitingGkyProceed] = useState(false);
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
  const [modifyModal, setModifyModal] = useState<{
    isOpen: boolean;
    assistantSnapshot: string;
  }>({
    isOpen: false,
    assistantSnapshot: ""
  });
  const [roadmapData, setRoadmapData] = useState<{
    roadmapContent: string;
    isGenerated: boolean;
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
    guidedEntrance?: boolean;
  }>({
    isOpen: false,
    guidedEntrance: false,
  });
  const [uploadAnalysis, setUploadAnalysis] = useState<{
    missingQuestions: Array<{ question_number: number; question_text: string; category: string; priority: string }>;
    businessInfo: any;
  } | null>(null);
  const [hasSeenUploadPrompt, setHasSeenUploadPrompt] = useState(false);
  const [hasUploadedPlan, setHasUploadedPlan] = useState(false);
  const [uploadPromptInitialized, setUploadPromptInitialized] = useState(false);
  /** Quick-actions coach tour must finish before auto-opening the import modal. */
  const [quickActionsTourComplete, setQuickActionsTourComplete] = useState(false);
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
    if (hasSeenUploadPrompt) return;
    if (sessionId) persistImportPromptDismissed(sessionId);
    setHasSeenUploadPrompt(true);
  }, [hasSeenUploadPrompt, sessionId]);

  const markUploadPlanAsUploaded = useCallback(() => {
    if (sessionId) persistPlanImported(sessionId);
    setHasUploadedPlan(true);
    setHasSeenUploadPrompt(true);
  }, [sessionId]);

  const openUploadPlanModal = useCallback((options?: { guidedEntrance?: boolean }) => {
    setUploadPlanModal({
      isOpen: true,
      guidedEntrance: options?.guidedEntrance ?? false,
    });
  }, []);

  const handleUploadModalClose = useCallback(() => {
    setUploadPlanModal({ isOpen: false, guidedEntrance: false });
    markUploadPromptAsSeen();
  }, [markUploadPromptAsSeen]);

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

    setHasSeenUploadPrompt(readImportPromptDismissed(sessionId));
    setHasUploadedPlan(readPlanImported(sessionId));
    setUploadPromptInitialized(true);
  }, [sessionId]);

  useEffect(() => {
    if (hasImportedPlanFromDb) {
      setHasUploadedPlan(true);
      setHasSeenUploadPrompt(true);
    }
  }, [hasImportedPlanFromDb]);

  useEffect(() => {
    if (!sessionId) return;
    setQuickActionsTourComplete(isCoachTourSeen(BUSINESS_PLAN_TOUR_ID, sessionId));
  }, [sessionId]);

  const importAutoOpenRef = useRef({
    sessionId: sessionId as string | undefined,
    uploadPromptInitialized: false,
    phase: progress.phase,
    phaseAnswered: progress.phase_answered,
    hasSeenUploadPrompt: false,
    hasUploadedPlan: false,
    hasImportedPlanFromDb: false,
    uploadModalOpen: false,
    history,
    backendAnswered: backendTotals.answered,
    currentQuestionNumber: currentQuestionNumber as number | null,
  });

  useEffect(() => {
    importAutoOpenRef.current = {
      sessionId,
      uploadPromptInitialized,
      phase: progress.phase,
      phaseAnswered: progress.phase_answered,
      hasSeenUploadPrompt,
      hasUploadedPlan,
      hasImportedPlanFromDb,
      uploadModalOpen: uploadPlanModal.isOpen,
      history,
      backendAnswered: backendTotals.answered,
      currentQuestionNumber,
    };
  });

  const tryOpenImportModalIfEligible = useCallback(
    (options?: { afterTour?: boolean }) => {
      const r = importAutoOpenRef.current;
      if (!r.sessionId || !r.uploadPromptInitialized || r.phase !== "BUSINESS_PLAN") {
        return false;
      }
      if (r.hasUploadedPlan || r.hasImportedPlanFromDb || r.uploadModalOpen) {
        return false;
      }
      // After tour, always offer import once (user may have a stale localStorage "seen").
      if (!options?.afterTour && r.hasSeenUploadPrompt) {
        return false;
      }

      const bpAnswered = resolveBusinessPlanAnsweredCount({
        phaseAnswered: r.phaseAnswered,
        backendAnswered: r.backendAnswered,
        bpHistoryPairs: r.history,
        bpTotal: QUESTION_COUNTS.BUSINESS_PLAN,
      });
      const offerActive = isBusinessPlanImportOfferActive({
        phase: r.phase,
        bpAnswered,
        currentQuestionNumber: r.currentQuestionNumber,
        hasImportedPlan: r.hasUploadedPlan || r.hasImportedPlanFromDb,
      });

      if (offerActive) {
        openUploadPlanModal({ guidedEntrance: options?.afterTour ?? false });
        if (r.sessionId) consumePendingImportAfterTour(r.sessionId);
        return true;
      }
      return false;
    },
    [openUploadPlanModal],
  );

  const handleBpQuickTourEnded = useCallback(
    (tourId: string) => {
      if (tourId !== BUSINESS_PLAN_TOUR_ID) return;
      setQuickActionsTourComplete(true);
      if (sessionId) markPendingImportAfterTour(sessionId);
      // Brief pause so the coach tour can finish exiting before this step appears.
      window.setTimeout(() => {
        tryOpenImportModalIfEligible({ afterTour: true });
      }, 420);
    },
    [sessionId, tryOpenImportModalIfEligible],
  );

  useEffect(() => {
    if (!uploadPromptInitialized || !sessionId || progress.phase !== "BUSINESS_PLAN") {
      return;
    }

    const bpAnswered = resolveBusinessPlanAnsweredCount({
      phaseAnswered: progress.phase_answered,
      backendAnswered: backendTotals.answered,
      bpHistoryPairs: history,
      bpTotal: QUESTION_COUNTS.BUSINESS_PLAN,
    });

    const hasImportedPlan = hasUploadedPlan || hasImportedPlanFromDb;

    const offerActive = isBusinessPlanImportOfferActive({
      phase: progress.phase,
      bpAnswered,
      currentQuestionNumber,
      hasImportedPlan,
    });

    if (!offerActive) {
      if (
        !hasSeenUploadPrompt &&
        (bpAnswered > 0 ||
          (typeof currentQuestionNumber === "number" && currentQuestionNumber > 1))
      ) {
        persistImportPromptDismissed(sessionId);
        setHasSeenUploadPrompt(true);
      }
      return;
    }

    const pendingAfterTour = hasPendingImportAfterTour(sessionId);

    const openWithGuidedEntrance =
      pendingAfterTour || (quickActionsTourComplete && !hasSeenUploadPrompt);

    if (
      shouldAutoOpenImportModal({
        offerActive,
        promptDismissed: hasSeenUploadPrompt && !pendingAfterTour,
        modalIsOpen: uploadPlanModal.isOpen,
        quickActionsTourComplete,
      }) ||
      (pendingAfterTour && quickActionsTourComplete && !uploadPlanModal.isOpen)
    ) {
      openUploadPlanModal({ guidedEntrance: openWithGuidedEntrance });
      consumePendingImportAfterTour(sessionId);
    }
  }, [
    backendTotals.answered,
    currentQuestionNumber,
    hasSeenUploadPrompt,
    hasUploadedPlan,
    history,
    openUploadPlanModal,
    progress.phase,
    progress.phase_answered,
    hasImportedPlanFromDb,
    quickActionsTourComplete,
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
    cleanedContent = cleanedContent.replace(/^Here's a revised draft(?:\s+for you)?:\s*/i, '').trim();
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

  /** Strip draft/support lead-in lines so Accept can persist the body from a command card. */
  const extractDraftBodyFromAssistantMessage = (message: string): string | null => {
    const cleaned = extractCommandAssistBody(message);
    return cleaned.length > 0 ? cleaned : null;
  };

  // Handle Accept button click
  const handleAccept = async () => {
    if (loading) {
      return;
    }

    const lastHistoryRow = history.length > 0 ? history[history.length - 1] : null;

    // Invariant: a Support response is informational guidance, never a candidate
    // answer. Accept must not commit it (the button is hidden, but enforce here so
    // UI state desync can't persist guidance as the user's answer and advance).
    if (
      !goBackReviewAnswer &&
      lastHistoryRow?.isCommand &&
      lastHistoryRow.commandKind === "support"
    ) {
      return;
    }

    // Auto-generated answers (auto-research: Q11 competitors, Q12 trends, etc.) are
    // accepted rather than typed, so unlike typed answers they were never pushed to
    // history by handleNext. Snapshot this turn now (current question + the generated
    // body in its acknowledgement) so accepting it preserves the content in the chat
    // for later reference instead of discarding it when we advance.
    //
    // Whether this is an auto-research turn comes from lastReplyIsAutoResearchRef —
    // set from the backend's `is_auto_research` field when the reply arrived. This
    // used to be guessed here via a regex on the message text (isAutoResearchContent),
    // a second, independently-maintained copy of logic the backend already computes
    // authoritatively; the two could drift out of sync and silently fail to match,
    // which is what dropped the content after Accept instead of preserving it.
    const acceptedAutoResearchPair: ConversationPair | null =
      !isCurrentSectionSummary &&
      !goBackReviewAnswer &&
      !lastHistoryRow?.isCommand &&
      lastReplyIsAutoResearchRef.current
        ? {
            question: currentQuestion,
            answer: "Accept",
            acknowledgement: currentAcknowledgement || undefined,
            questionNumber: currentQuestionNumber ?? undefined,
            phase: progress.phase as ConversationPair["phase"],
          }
        : null;

    setShowVerificationButtons(false);

    // Accepting a Draft/Scrapping/Modify command must submit the GENERATED
    // body as the answer — not the literal word "Accept". Modify was already
    // handled this way; Draft and Scrapping were not, so the backend persisted
    // "Accept" as the raw chat_history answer for that question. Since
    // "Accept" is filtered out as a command token during identity extraction
    // (get_tagged_user_answer), the scanner fell through to whatever the user
    // typed for a LATER question and mis-attributed it back to this one —
    // e.g. a Draft-accepted industry answer showing a completely unrelated
    // later reply as "the industry". Support is deliberately excluded: it's
    // informational guidance, never a candidate answer (see the invariant
    // above), and the Accept button is hidden for it anyway.
    const pendingCommandBody =
      lastHistoryRow?.commandKind === "modify" ||
      lastHistoryRow?.commandKind === "draft" ||
      lastHistoryRow?.commandKind === "scrapping"
        ? extractCommandAssistBody(
            lastHistoryRow.assistReply || lastHistoryRow.acknowledgement || "",
          )
        : "";

    const goBackResubmit =
      goBackReviewAnswer &&
      goBackAcceptPayloadRef.current !== "accept"
        ? goBackAcceptPayloadRef.current
        : null;
    if (goBackReviewAnswer) {
      setGoBackReviewAnswer(null);
      setGoBackUserDisplay(null);
      goBackAcceptPayloadRef.current = "accept";
    }

    const pendingModifyAccept = pendingModifyAcceptRef.current.trim();

    let acceptPayload: string;
    if (isCurrentSectionSummary) {
      acceptPayload = "Accept";
      pendingModifyAcceptRef.current = "";
    } else if (goBackResubmit) {
      acceptPayload = goBackResubmit;
    } else if (pendingModifyAccept) {
      acceptPayload = pendingModifyAccept;
      pendingModifyAcceptRef.current = "";
    } else if (pendingCommandBody.length > 0) {
      acceptPayload = pendingCommandBody;
    } else {
      acceptPayload = "Accept";
    }

    // Commit the live section summary into the last Q&A row before advancing.
    const summaryToArchive =
      isCurrentSectionSummary &&
      (currentQuestion?.trim() || lastFullAssistantReplyRef.current?.trim())
        ? currentQuestion?.trim() || lastFullAssistantReplyRef.current!.trim()
        : null;

    if (summaryToArchive) {
      setHistory((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (last.sectionSummary) return prev;
        return [
          ...prev.slice(0, -1),
          {
            ...last,
            sectionSummary: summaryToArchive,
            sectionSummaryAccepted: true,
          },
        ];
      });
    }

    setLoading(true);
    
    try {
      const {
        result: { reply, progress, web_search_status, immediate_response, show_accept_modify, question_number, is_section_summary, is_auto_research },
      } = await fetchQuestion(acceptPayload, sessionId!);
      const { acknowledgement: ack, question: parsedQ } = parseAngelReply(reply);
      const { isSectionSummary, questionNumber } = resolveDisplayFromAngelResult(
        { question_number, is_section_summary },
        progress,
      );
      setCurrentQuestion(parsedQ);
      setCurrentAcknowledgement(ack);
      setIsCurrentSectionSummary(isSectionSummary);
      setCurrentQuestionNumber(questionNumber);
      updateQuestionTracker(progress.phase, questionNumber);
      applyProgressUpdate(progress);
      setWebSearchStatus(web_search_status || { is_searching: false, query: undefined, completed: false });
      
      // Use backend detection for showing buttons (always respect backend decision)
      setShowVerificationButtons(show_accept_modify || false);

      // Accept advances to a new active question. Refresh the snapshot ref so a
      // later Draft/Support/Scrapping turn references THIS question — not the
      // stale section summary that was active before Accept (which otherwise
      // gets re-rendered as the question of every following command turn).
      lastFullAssistantReplyRef.current = reply;
      lastReplyIsAutoResearchRef.current = Boolean(is_auto_research);

      lastCommandAssistReplyRef.current = "";

      // After Draft/Support/Scrapping, the last row stays isCommand — that hides the next
      // question card. Also, currentQuestion is only the short parsed question, so merge the
      // accepted body from the command card and clear isCommand.
      setHistory((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (!last.isCommand) return prev;

        const fromQuestion = extractGuidanceContent(currentQuestion);
        const fromAck = last.acknowledgement
          ? extractDraftBodyFromAssistantMessage(last.acknowledgement)
          : null;
        const acceptedBody =
          (fromQuestion && fromQuestion.length > 0 ? fromQuestion : null) ??
          fromAck ??
          ((last.acknowledgement?.trim() || "").trim() || last.answer);

        const snapped = last.question || "";
        const { acknowledgement: histAck, question: histQ } = parseAngelReply(snapped);

        return [
          ...prev.slice(0, -1),
          {
            ...last,
            isCommand: false,
            acknowledgement: histAck || undefined,
            question: histQ || last.question,
            answer:
              typeof acceptedBody === "string" && acceptedBody.length > 0
                ? acceptedBody
                : last.answer,
          },
        ];
      });

      // Preserve an accepted auto-generated (auto-research) answer as its own
      // chat turn so it stays visible after we advance to the next question.
      if (acceptedAutoResearchPair) {
        setHistory((prev) => [...prev, acceptedAutoResearchPair]);
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

  const handleModify = (currentText: string) => {
    const snapshot = resolveModifyAssistantSnapshot({
      pendingAssistReply: lastCommandAssistReplyRef.current,
      activeQuestionReply: lastFullAssistantReplyRef.current,
      goBackReviewAnswer,
      history,
    });
    setModifyModal({
      isOpen: true,
      assistantSnapshot: snapshot || currentText,
    });
  };

  const handleYes = async () => {
    setShowYesNoButtons(false);
    setLoading(true);
    
    try {
      const {
        result: { reply, progress, web_search_status, immediate_response, show_accept_modify, question_number, is_auto_research },
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
      // Keep the command-snapshot ref pointing at the new active question.
      lastFullAssistantReplyRef.current = reply;
      lastReplyIsAutoResearchRef.current = Boolean(is_auto_research);
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
        result: { reply, progress, web_search_status, immediate_response, show_accept_modify, question_number, is_auto_research },
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
      // Keep the command-snapshot ref pointing at the new active question.
      lastFullAssistantReplyRef.current = reply;
      lastReplyIsAutoResearchRef.current = Boolean(is_auto_research);
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

  // Handle saving Modify refinement (guidance + snapshot via structured /chat payload)
  const handleModifySave = async (payload: {
    userGuidance: string;
    assistantSnapshot: string;
  }) => {
    setModifyModal(prev => ({ ...prev, isOpen: false }));
    setShowVerificationButtons(false);

    try {
      setLoading(true);
      await handleNext(undefined, {
        modify: {
          user_guidance: payload.userGuidance,
          assistant_snapshot: payload.assistantSnapshot,
        },
      });
    } catch (error) {
      console.error("Error sending modify refinement:", error);
      toast.error("Failed to send modifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle starting implementation (triggers roadmap to implementation transition)
  const handleStartImplementation = async () => {
    try {
      setLoading(true);
      
      const { data } = await httpClient.post<any>(
        `/angel/sessions/${sessionId}/roadmap-to-implementation-transition`
      );
      
      if (data.success) {
        setRoadmapData(null);
        if (data.result?.progress) {
          applyProgressUpdate(data.result.progress);
        }
        
        navigate(`/ventures/${sessionId}/implementation-transition`);
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
      return normalizeSectionSummaryMarkdown(formatted);
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

    // Preserve markdown bold (**text**) but remove other asterisks. If the model
    // emitted a bold span that crosses a blank line, split it into one bold span
    // per paragraph — CommonMark closes inline runs at paragraph breaks, so a
    // multi-paragraph **...** would otherwise render as literal asterisks.
    const boldPlaceholder = "___MARKDOWN_BOLD___";
    const boldMatches: string[] = [];
    formatted = formatted.replace(/\*\*([\s\S]+?)\*\*/g, (_match, content) => {
      const paragraphs = content.split(/\n{2,}/);
      return paragraphs
        .map((p: string) => {
          if (!p.trim()) return p;
          boldMatches.push(p);
          return `${boldPlaceholder}${boldMatches.length - 1}${boldPlaceholder}`;
        })
        .join("\n\n");
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

    // Strip option-only lines that the option picker UI already renders as buttons.
    // Without this, choices like "Yes" / "No" appear both inline in the message body
    // AND as buttons below — a visible duplicate.
    formatted = stripPickerOptionLines(formatted);

    // Clean up excessive whitespace (ReactMarkdown turns extra newlines into empty <p> gaps)
    formatted = normalizeAngelMarkdown(formatted);
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
      // The canonical question is always emitted as the FINAL bold-wrapped
      // line in the reply (the backend composes
      //   `[[Q:tag]]\n\n{ack}\n\n**{canonical_question_text}**`
      // deterministically). 10 of the 45 BUSINESS_PLAN canonical questions
      // end in `.` or `:` rather than `?` — Q1 ("…in detail."), Q5
      // ("Business Name (if decided):"), Q11/Q12/Q17/Q18/Q26/Q27/Q34/Q42.
      // The old regex `\*\*[^*]{10,}\?\*\*` only matched `?`-terminated
      // bolds, so every non-`?` question fell through to the catch-all and
      // got dumped wholesale into the "question" slot. Two coordinated
      // changes:
      //   1. Broaden the terminator from `\?` to `[?.:]`.
      //   2. Scan paragraphs from the END so we lock onto the FINAL bold
      //      sentence — that's the canonical line. Scanning forward used
      //      to false-positive on any earlier `**bold!**` inside the ack.
      const CANONICAL_BOLD_RE = /^\*\*[^*\n]{10,}[?.:]\*\*$/;
      let boldQuestionIdx = -1;
      for (let i = paragraphs.length - 1; i > 0; i--) {
        if (CANONICAL_BOLD_RE.test(paragraphs[i].trim())) {
          boldQuestionIdx = i;
          break;
        }
      }
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

    // Preserve markdown bold (**text**) but remove other asterisks. Split bold
    // spans that cross a blank line into one bold span per paragraph (CommonMark
    // closes inline runs at paragraph breaks, so multi-paragraph **...** would
    // otherwise render as literal asterisks).
    const boldPlaceholder = "___MARKDOWN_BOLD___";
    const boldMatches: string[] = [];
    formatted = formatted.replace(/\*\*([\s\S]+?)\*\*/g, (_match, content) => {
      const paragraphs = content.split(/\n{2,}/);
      return paragraphs
        .map((p: string) => {
          if (!p.trim()) return p;
          boldMatches.push(p);
          return `${boldPlaceholder}${boldMatches.length - 1}${boldPlaceholder}`;
        })
        .join("\n\n");
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

    // Strip option-only lines (Yes / No / work-situation / mentor-style) — the
    // option picker UI renders these as buttons; leaving them inline duplicates them.
    formatted = stripPickerOptionLines(formatted);

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

  useEffect(() => {
    setVentureOnboardingOpen(false);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || loading || needsInitialQuestion) return;
    if (progress.phase !== "GKY" || history.length !== 0) return;
    if (!currentQuestion.trim()) return;
    if (isVentureOnboardingTipsComplete(sessionId)) return;
    setVentureOnboardingOpen(true);
  }, [
    sessionId,
    loading,
    needsInitialQuestion,
    progress.phase,
    history.length,
    currentQuestion,
  ]);

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
          result: { reply, progress, web_search_status, immediate_response, question_number, transition_phase, awaiting_gky_proceed, is_auto_research },
        } = await fetchQuestion("", sessionId!);
        if (cancelled) return;

        if (transition_phase === 'GKY_TO_BUSINESS_PLAN' || awaiting_gky_proceed) {
          setAwaitingGkyProceed(true);
          setShowVerificationButtons(false);
        }
        if (progress.phase === 'BUSINESS_PLAN') {
          setAwaitingGkyProceed(false);
        }

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
        lastFullAssistantReplyRef.current = reply;
        lastReplyIsAutoResearchRef.current = Boolean(is_auto_research);
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

    const restorePlanSummaryOverview =
      (location.state as { restorePlanSummaryOverview?: boolean })?.restorePlanSummaryOverview === true;

    let cancelled = false;

    const restoreSessionFromHistory = async () => {
      setLoading(true);

      const buildConversationFromHistory = (records: RawChatRecord[]) =>
        buildHistoryPairs(records, parseAngelReply);

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

        const sessionContext = businessContextSeedFromSession(sessionMeta);
        if (sessionContext) {
          seedBusinessContext(sessionContext);
        }
        if (sessionContext?.uploaded_plan_mode && sessionId) {
          persistPlanImported(sessionId);
          setHasUploadedPlan(true);
          setHasSeenUploadPrompt(true);
        }

        const introPhase = ((sessionMeta.current_phase as string) || '').toUpperCase();
        if (introPhase === 'BUSINESS_PLAN_INTRO') {
          const gkyTotal = QUESTION_COUNTS.GKY || 5;
          const bpTotal = QUESTION_COUNTS.BUSINESS_PLAN || 45;
          const reconstructedIntro = buildConversationFromHistory(historyResponse || []);
          const gkyPairs = reconstructedIntro.pairs.filter(
            (pair) => (pair.phase || 'GKY').toUpperCase() === 'GKY' && !pair.isCommand
          );

          setHistory(gkyPairs);
          setProgress({
            phase: 'GKY',
            answered: gkyTotal,
            total: gkyTotal,
            percent: 100,
            asked_q: 'GKY.05_ACK',
            overall_progress: {
              answered: gkyTotal,
              total: gkyTotal,
              percent: 100,
              scope: 'gky',
              phase_breakdown: {
                gky_completed: gkyTotal,
                gky_total: gkyTotal,
                bp_completed: 0,
                bp_total: bpTotal,
              },
            },
          });
          setAwaitingGkyProceed(true);
          setNeedsInitialQuestion(true);
          setBackendTotals({
            answered: gkyTotal,
            total: gkyTotal,
            overallAnswered: gkyTotal,
            overallTotal: gkyTotal,
          });
          setLoading(false);
          return;
        }

        const reconstructed = buildConversationFromHistory(historyResponse || []);
        
        // CRITICAL: Prioritize backend's asked_q over reconstructed history
        // If backend says we're on a different question than what history shows,
        // trust the backend (e.g., after going back, backend knows the correct question)
        const numberFromTag = parseQuestionNumberFromTag(sessionMeta.asked_q);
        const rawSessionPhase = ((sessionMeta.current_phase as string) || "GKY").toUpperCase();
        const phase = (rawSessionPhase === 'KYC' ? 'GKY' : rawSessionPhase) as ProgressState['phase'];

        // Section summary: asked_q stays on the last question of the section (e.g. .04),
        // but the active UI is the summary — not "Question 4".
        let pausedOnSectionSummary = false;
        let pausedOnAutoResearch = false;
        let sectionSummaryContent: string | null = null;
        if (historyResponse && Array.isArray(historyResponse)) {
          for (let i = historyResponse.length - 1; i >= 0; i--) {
            const rec = historyResponse[i];
            if (rec.role === "assistant" && rec.content) {
              lastFullAssistantReplyRef.current = rec.content;
              if (isSectionSummaryContent(rec.content)) {
                pausedOnSectionSummary = true;
                sectionSummaryContent = rec.content;
              } else if (isAutoResearchContent(rec.content)) {
                pausedOnAutoResearch = true;
              }
              break;
            }
          }
        }
        // Restore the authoritative auto-research flag for the resumed question so
        // handleAccept (which now trusts this ref instead of re-matching content)
        // still preserves the answer correctly after a page reload.
        lastReplyIsAutoResearchRef.current = pausedOnAutoResearch;

        // Filter history to only include Q&A pairs up to the backend's asked_q
        // If backend says we're on Q2, we should only show Q1 as answered
        let filteredPairs = reconstructed.pairs;
        let currentQuestionFromHistory: string | null = null;
        
        if (numberFromTag !== null) {
          // Normal: asked_q is the next question → keep pairs with number < tag.
          // Section summary: asked_q is still the section's last question → keep <= tag.
          filteredPairs = reconstructed.pairs.filter((pair) => {
            if (pair.phase !== phase) return true; // Keep pairs from other phases
            if (typeof pair.questionNumber !== 'number') return true; // Keep pairs without numbers
            if (pausedOnSectionSummary) {
              return pair.questionNumber <= numberFromTag;
            }
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
          
          if (pausedOnSectionSummary && sectionSummaryContent) {
            const { question } = parseAngelReply(sectionSummaryContent);
            reconstructed.pendingQuestion = question;
            reconstructed.pendingNumber = null;
            reconstructed.pendingPhase = phase as ConversationPair['phase'];
          } else if (historyResponse && Array.isArray(historyResponse)) {
            // Find the current question text from history (tagged assistant message)
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
          if (!pausedOnSectionSummary && currentQuestionFromHistory) {
            reconstructed.pendingQuestion = currentQuestionFromHistory;
            reconstructed.pendingNumber = numberFromTag;
            reconstructed.pendingPhase = phase as ConversationPair['phase'];
          } else if (!pausedOnSectionSummary && reconstructed.pendingNumber !== null && reconstructed.pendingNumber >= numberFromTag) {
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

        // Use backend's asked_q as the source of truth for current question
        const pendingNumber = numberFromTag ?? reconstructed.pendingNumber;

        const gkyTotal = QUESTION_COUNTS.GKY || 5;
        const bpTotalCalc = QUESTION_COUNTS.BUSINESS_PLAN || 45;

        // Match backend: progress from asked_q tag, not a drifting answered_count counter.
        const tagDerivedAnswered =
          numberFromTag !== null
            ? pausedOnSectionSummary
              ? numberFromTag
              : Math.max(0, numberFromTag - 1)
            : Math.max(effectiveAnsweredPhase, backendAnswered);

        const scopedAnswered =
          phase === "GKY" || phase === "BUSINESS_PLAN"
            ? tagDerivedAnswered
            : effectiveAnsweredPhase;
        const scopedTotal =
          phase === "BUSINESS_PLAN" ? bpTotalCalc : phase === "GKY" ? gkyTotal : totalPhase;
        const scopedPercent =
          scopedTotal > 0
            ? Math.min(Math.round((scopedAnswered / scopedTotal) * 100), 100)
            : 0;

        let gkyCompleted = 0;
        let bpCompleted = 0;
        if (phase === "GKY") {
          gkyCompleted = scopedAnswered;
          bpCompleted = 0;
        } else if (phase === "BUSINESS_PLAN") {
          gkyCompleted = gkyTotal;
          bpCompleted = scopedAnswered;
        } else {
          gkyCompleted = gkyTotal;
          bpCompleted = bpTotalCalc;
        }

        setProgress((prev) => ({
          ...prev,
          phase,
          answered: scopedAnswered,
          phase_answered: scopedAnswered,
          total: totalPhase,
          percent: scopedPercent,
          overall_progress: {
            answered: scopedAnswered,
            total: scopedTotal,
            percent: scopedPercent,
            scope: phase === "BUSINESS_PLAN" ? "business_plan" : phase === "GKY" ? "gky" : undefined,
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
            answered_count: scopedAnswered,
            asked_q: askedTag,
          });
        } catch (syncError) {
          console.warn("Progress sync failed:", syncError);
        }

        setBackendTotals({
          answered: scopedAnswered,
          total: totalPhase,
          overallAnswered: scopedAnswered,
          overallTotal: scopedTotal,
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

            const summary = freshSession?.business_plan_summary || "";
            const artifact = freshSession?.business_plan_artifact || null;

            setTransitionData({
              businessPlanSummary: summary,
              businessPlanArtifact: artifact,
              transitionPhase: "PLAN_TO_SUMMARY"
            });

            setBackendTotals({ answered: scopedAnswered, total: totalPhase, overallAnswered: scopedAnswered, overallTotal: scopedTotal });
            setLoading(false);
            return;
          } catch (summaryError) {
            console.error("Failed to fetch business plan data for summary transition:", summaryError);
            setTransitionData({
              businessPlanSummary: "",
              businessPlanArtifact: null,
              transitionPhase: "PLAN_TO_SUMMARY"
            });
            setBackendTotals({ answered: scopedAnswered, total: totalPhase, overallAnswered: scopedAnswered, overallTotal: scopedTotal });
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
            const summary = freshSession?.business_plan_summary || transitionData.business_plan_summary || "";
            const artifact = freshSession?.business_plan_artifact || transitionData.business_plan_artifact || null;
            const estimatedExpenses = transitionData.estimated_expenses || "";
            const businessContext = transitionData.business_context || {};
            
            console.log("📊 Restoring budget transition data:", {
              hasSummary: !!summary,
              hasArtifact: !!artifact,
              hasEstimatedExpenses: !!estimatedExpenses,
              hasBusinessContext: !!businessContext
            });

            // Back from budget: show Business Plan Summary Overview (same screen user left from), not auto-redirect to budget
            const summaryOverviewPhase = restorePlanSummaryOverview ? "PLAN_TO_SUMMARY" : "PLAN_TO_BUDGET";

            setTransitionData({
              businessPlanSummary: summary,
              businessPlanArtifact: artifact,
              transitionPhase: summaryOverviewPhase,
              estimatedExpenses: estimatedExpenses,
              businessContext: businessContext
            });

            if (restorePlanSummaryOverview) {
              navigate(`/ventures/${sessionId}`, {
                replace: true,
                state: { preferVentureChat: true },
              });
            }

            setBackendTotals({ answered: scopedAnswered, total: totalPhase, overallAnswered: scopedAnswered, overallTotal: scopedTotal });
            setLoading(false);
            return;
          } catch (error) {
            console.error("❌ Error restoring budget transition:", error);
            setTransitionData({
              businessPlanSummary: "",
              businessPlanArtifact: null,
              transitionPhase: restorePlanSummaryOverview ? "PLAN_TO_SUMMARY" : "PLAN_TO_BUDGET",
              estimatedExpenses: "",
              businessContext: {}
            });
            if (restorePlanSummaryOverview) {
              navigate(`/ventures/${sessionId}`, {
                replace: true,
                state: { preferVentureChat: true },
              });
            }
            setBackendTotals({ answered: scopedAnswered, total: totalPhase, overallAnswered: scopedAnswered, overallTotal: scopedTotal });
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
            const summary = freshSession?.business_plan_summary || "";
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
            
            setBackendTotals({ answered: scopedAnswered, total: totalPhase, overallAnswered: scopedAnswered, overallTotal: scopedTotal });
            setLoading(false);
            return;
          } catch (summaryError) {
            console.error("Failed to fetch business plan data:", summaryError);
            setTransitionData({
              businessPlanSummary: "",
              businessPlanArtifact: null,
              transitionPhase: "PLAN_TO_ROADMAP"
            });
            setBackendTotals({ answered: scopedAnswered, total: totalPhase, overallAnswered: scopedAnswered, overallTotal: scopedTotal });
            setLoading(false);
            return;
          }
        }

        // CRITICAL: Check if we're in ROADMAP phase - automatically load and display roadmap
        const preferVentureChat =
          (location.state as { preferVentureChat?: boolean } | null)?.preferVentureChat === true;
        if (phase === "ROADMAP" || phase === "ROADMAP_GENERATED") {
          if (preferVentureChat) {
            console.log(
              "🗺️ ROADMAP phase but preferVentureChat set — staying on Angel chat (e.g. back from budget)"
            );
          } else {
            console.log("🗺️ Detected ROADMAP phase - loading roadmap and opening modal");
            try {
              // Always fetch roadmap from API to ensure we get the new 8-stage format
              // The API will regenerate if it's in old format
              try {
                const roadmapResponse = await fetchRoadmapPlan(sessionId);
                const roadmapContent = roadmapResponse?.result?.plan || '';

                if (roadmapContent) {
                  // Check if it's in the new format (has Stage and tables)
                  const hasStageFormat =
                    roadmapContent.includes("Stage") &&
                    roadmapContent.includes(
                      "| Task | Description | Dependencies | Angel's Role | Status |"
                    );

                  if (hasStageFormat) {
                    setRoadmapData({
                      roadmapContent: roadmapContent,
                      isGenerated: true,
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
        }

        if (reconstructed.pendingQuestion) {
          setCurrentQuestion(reconstructed.pendingQuestion);
          setCurrentAcknowledgement(reconstructed.pendingAcknowledgement || '');
          setIsCurrentSectionSummary(pausedOnSectionSummary);
          setCurrentQuestionNumber(pausedOnSectionSummary ? null : pendingNumber);
          if (pausedOnSectionSummary || pausedOnAutoResearch) {
            setShowVerificationButtons(true);
          }
          setNeedsInitialQuestion(false);
          setBackendTotals({ answered: scopedAnswered, total: totalPhase, overallAnswered: scopedAnswered, overallTotal: scopedTotal });
          setLoading(false);
          return;
        }

        setNeedsInitialQuestion(true);
        setBackendTotals({ answered: scopedAnswered, total: totalPhase, overallAnswered: scopedAnswered, overallTotal: scopedTotal });
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

  const handleNext = async (
    inputOverride?: string,
    options?: {
      modify?: {
        assistant_snapshot: string;
        user_guidance: string;
      };
    }
  ) => {
    if (loading) {
      return;
    }
    if (!sessionId) {
      toast.error("Session is still loading. Please try again in a moment.");
      return;
    }

    const input = options?.modify
      ? options.modify.user_guidance.trim()
      : (inputOverride ?? currentInput).trim();
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
      const response = options?.modify
        ? await fetchQuestion(input, sessionId!, { modify: options.modify })
        : await fetchQuestion(input, sessionId!);
      const {
        result: {
          reply,
          progress,
          web_search_status,
          immediate_response,
          transition_phase,
          business_plan_summary,
          show_accept_modify,
          question_number,
          is_section_summary,
          awaiting_gky_proceed,
          is_auto_research,
        },
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
      if (awaiting_gky_proceed) {
        setAwaitingGkyProceed(true);
        setShowVerificationButtons(false);
      }
      if (progress.phase === 'BUSINESS_PLAN') {
        setAwaitingGkyProceed(false);
      }
      try {
        await refreshBusinessContext();
      } catch (refreshError) {
        console.warn("Business context refresh failed after chat turn:", refreshError);
      }
      
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

        if (transition_phase === "GKY_TO_BUSINESS_PLAN") {
          setHistory((prev) => [
            ...prev,
            {
              question: previousQuestion,
              answer: input,
              questionNumber: previousQuestionNumber,
              phase: "GKY",
            },
          ]);

          const { acknowledgement: ack, question: parsedQ } = parseAngelReply(reply);
          setCurrentQuestion(parsedQ);
          setCurrentAcknowledgement(ack);
          setCurrentQuestionNumber(null);
          setAwaitingGkyProceed(true);
          setShowVerificationButtons(false);
          applyProgressUpdate(progress);
          setPendingUserReply(null);
          lastFullAssistantReplyRef.current = reply;
          lastReplyIsAutoResearchRef.current = Boolean(is_auto_research);
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
      const { isSectionSummary, questionNumber: nextQuestionNumber } = resolveDisplayFromAngelResult(
        { question_number, is_section_summary },
        progress,
      );

      if (options?.modify) {
        const reviseDisplay = reply.trim();
        const modifiedBody =
          extractCommandAssistBody(reviseDisplay) || reviseDisplay;

        lastCommandAssistReplyRef.current = reply;

        setGoBackUserDisplay(null);
        setGoBackReviewAnswer(modifiedBody);
        pendingModifyAcceptRef.current = modifiedBody;
        setPendingUserReply(null);

        setHistory((prev) => {
          const modifyRow = {
            answer: MODIFY_HISTORY_ANSWER_LABEL,
            acknowledgement: reviseDisplay || undefined,
            questionNumber: previousQuestionNumber,
            phase: progress.phase,
            isCommand: true,
            commandKind: "modify" as const,
            assistReply: reply,
          };
          if (prev.length === 0) {
            return [
              {
                question: previousQuestion,
                ...modifyRow,
              },
            ];
          }
          const last = prev[prev.length - 1];
          if (last.isCommand) {
            return [
              ...prev.slice(0, -1),
              {
                ...last,
                ...modifyRow,
              },
            ];
          }
          return [
            ...prev,
            {
              question: previousQuestion,
              ...modifyRow,
            },
          ];
        });

        setCurrentQuestion(previousQuestion);
        setCurrentAcknowledgement("");
        setIsCurrentSectionSummary(false);
        setCurrentQuestionNumber(previousQuestionNumber);
        if (typeof previousQuestionNumber === "number") {
          updateQuestionTracker(progress.phase, previousQuestionNumber);
        }
        setWebSearchStatus(web_search_status || { is_searching: false, query: undefined, completed: false });
        if (show_accept_modify !== undefined) {
          setShowVerificationButtons(show_accept_modify);
        } else {
          setShowVerificationButtons(true);
        }
        setLoading(false);
        return;
      }

      const COMMAND_INPUTS = ["draft", "support", "scrapping", "scraping", "draft more", "draft answer"];
      const cmdKindFromInput = inferCommandKindFromUserInput(input);
      const wasCommand =
        COMMAND_INPUTS.includes(input.toLowerCase().trim()) || cmdKindFromInput !== undefined;
      const commandDisplay = wasCommand
        ? ((ack && ack.trim().length > 0 ? ack : parsedQ) || "").trim()
        : ack;

      const questionSnapshotForHistory =
        wasCommand &&
        lastFullAssistantReplyRef.current &&
        lastFullAssistantReplyRef.current.trim().length > 0
          ? lastFullAssistantReplyRef.current
          : previousQuestion;

      // Add to history only when Angel reply arrives (progress increments here, not on submit)
      // Commands (Draft, Support, etc.) add for display but isCommand excludes from progress
      setHistory((prev) => {
        // A Draft generated right after Support supersedes that Support turn — the
        // research was the input to the draft, not a separate answer. Drop the
        // trailing Support row so only the resulting draft remains.
        const base =
          cmdKindFromInput === "draft" &&
          prev.length > 0 &&
          prev[prev.length - 1]?.isCommand &&
          prev[prev.length - 1]?.commandKind === "support"
            ? prev.slice(0, -1)
            : prev;
        return [
          ...base,
          {
            question: questionSnapshotForHistory,
            answer: input,
            acknowledgement: commandDisplay || undefined,
            questionNumber: previousQuestionNumber,
            phase: progress.phase,
            ...(wasCommand && { isCommand: true }),
            ...(wasCommand && cmdKindFromInput ? { commandKind: cmdKindFromInput } : {}),
            ...(wasCommand && { assistReply: reply }),
          },
        ];
      });

      if (wasCommand && !options?.modify) {
        lastCommandAssistReplyRef.current = reply;
        // Command turns (Draft/Support/Scrapping) should not replace the active question UI.
        // Keep the same question visible while showing command output in chat history.
        setCurrentQuestion(previousQuestion);
        // Hide previous long acknowledgment block during command turns to avoid
        // duplicate "Next Question" confusion around Draft responses.
        setCurrentAcknowledgement("");
        setIsCurrentSectionSummary(false);
        setCurrentQuestionNumber(previousQuestionNumber);
        if (typeof previousQuestionNumber === "number") {
          updateQuestionTracker(progress.phase, previousQuestionNumber);
        }
      } else {
        setCurrentQuestion(parsedQ);
        setCurrentAcknowledgement(ack);
        setIsCurrentSectionSummary(isSectionSummary);
        setCurrentQuestionNumber(nextQuestionNumber);
        updateQuestionTracker(progress.phase, nextQuestionNumber);
        lastFullAssistantReplyRef.current = reply;
        lastReplyIsAutoResearchRef.current = Boolean(is_auto_research);
      }
      setWebSearchStatus(web_search_status || { is_searching: false, query: undefined, completed: false });

      if (isSectionSummary) {
        setShowVerificationButtons(true);
      } else if (is_auto_research) {
        setShowVerificationButtons(true);
      } else if (show_accept_modify !== undefined) {
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
      
      const { data } = await httpClient.post<any>(`/roadmap/sessions/${sessionId}/update-roadmap`, {
        updated_content: updatedContent,
      });
      
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
      
      const { data } = await httpClient.post<any>(`/angel/sessions/${sessionId}/go-back`);

      if (data.success) {
        // PROFESSIONAL FLOW - Senior Developer Best Practices
      if (data.result?.progress) {
        applyProgressUpdate(data.result.progress);
        console.log("📊 Progress updated:", data.result.progress);
      }

      const replyText = data.result?.reply ?? '';
      const { acknowledgement: prevAck, question: prevQ } = parseAngelReply(replyText);
      const tagMatch = replyText.match(/\[\[Q:([A-Z_]+)\.(\d{2})]]/);
      const previousQuestionNumber = tagMatch ? parseInt(tagMatch[2], 10) : data.result?.question_number ?? null;
      const previousPhase = tagMatch ? tagMatch[1] : progress.phase;

      const reviewText =
        (data.result?.review_answer_text as string | undefined) || "";
      const displayAnswer =
        (data.result?.display_user_answer as string | undefined) || "";
      const prevStored = (data.result?.previous_answer as string | undefined)?.trim().toLowerCase();
      goBackAcceptPayloadRef.current =
        prevStored && prevStored !== "accept" && prevStored !== "yes"
          ? (data.result?.previous_answer as string)
          : "accept";
      setGoBackReviewAnswer(reviewText.trim() || null);
      setGoBackUserDisplay(displayAnswer.trim() || null);
      setShowVerificationButtons(Boolean(data.result?.show_accept_modify ?? reviewText));
      setIsCurrentSectionSummary(false);

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
          const refreshed = buildHistoryPairs(refreshedHistory, parseAngelReply);
          let refreshedPairs = refreshed.pairs;
          if (
            previousQuestionNumber != null &&
            refreshedPairs.length > 0 &&
            refreshedPairs[refreshedPairs.length - 1].questionNumber === previousQuestionNumber
          ) {
            refreshedPairs = refreshedPairs.slice(0, -1);
          }
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
      
      const { data } = await httpClient.post<any>(`/angel/sessions/${sessionId}/transition-decision`, {
        decision: 'approve',
        transition_type: currentTransitionType,
      });
      
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

  const handleRevisitPlan = async (modificationAreas?: string[]) => {
    setLoading(true);
    try {
      const { data } = modificationAreas?.length
        ? await httpClient.post<any>(`/angel/sessions/${sessionId}/revisit-plan-with-areas`, {
            modification_areas: modificationAreas,
          })
        : await httpClient.post<any>(`/angel/sessions/${sessionId}/transition-decision`, {
            decision: 'revisit',
          });

      if (!data.success) {
        toast.error(data.message || "Failed to activate review mode");
        return;
      }

      toast.success("Plan review mode activated");
      setTransitionData(null);
      if (data.result?.progress) {
        applyProgressUpdate(data.result.progress);
      }

      // Refresh the chat state from the backend. We MUST consume the response
      // and update currentQuestion / acknowledgement, otherwise the chat
      // renders the empty-string fallback (`currentQuestion || "Loading…"`)
      // and the user is stuck staring at "Loading…" with no way forward.
      const refreshed = await fetchQuestion("", sessionId!);
      const { reply, progress: refreshedProgress, question_number } = refreshed.result;
      const { acknowledgement, question } = parseAngelReply(reply);
      const qn = deriveQuestionNumber(question_number, reply, refreshedProgress);

      setCurrentQuestion(question);
      setCurrentAcknowledgement(acknowledgement);
      setCurrentQuestionNumber(qn);
      updateQuestionTracker(refreshedProgress.phase, qn);
      applyProgressUpdate(refreshedProgress);
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

  /**
   * Re-open the Business Plan Summary screen from the chat. Used by the
   * "View Business Plan Summary" call-to-action that appears when there is no
   * active question left to answer in BUSINESS_PLAN phase — without it the
   * user has no way to leave the chat surface, since the sidebar's "Business
   * Plan" button is only visible during ROADMAP / IMPLEMENTATION phases.
   */
  const handleReopenPlanSummary = async () => {
    setLoading(true);
    try {
      const { result } = await fetchQuestion(
        "All business plan questions are answered. Continue to the launch roadmap.",
        sessionId!,
      );
      // handleNext-style transition handling — we want the modal, not a chat bubble.
      const business_plan_summary = (result as any).business_plan_summary || "";
      const business_plan_artifact = (result as any).business_plan_artifact || null;
      const transition_phase = (result as any).transition_phase;

      if (transition_phase === "PLAN_TO_SUMMARY" || transition_phase === "PLAN_TO_ROADMAP") {
        setTransitionData({
          businessPlanSummary: business_plan_summary,
          businessPlanArtifact: business_plan_artifact,
          transitionPhase: transition_phase,
        });
        if (result.progress) applyProgressUpdate(result.progress);
        return;
      }

      // Fall through: backend didn't fire a transition. Update chat state so
      // we don't leave the user staring at "Loading…".
      const { acknowledgement, question } = parseAngelReply(result.reply);
      const qn = deriveQuestionNumber(result.question_number, result.reply, result.progress);
      setCurrentQuestion(question);
      setCurrentAcknowledgement(acknowledgement);
      setCurrentQuestionNumber(qn);
      updateQuestionTracker(result.progress.phase, qn);
      applyProgressUpdate(result.progress);
    } catch (error) {
      console.error("❌ Failed to re-open Business Plan Summary:", error);
      toast.error("Could not open the Business Plan Summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPlanSuccess = (businessInfo: any, analysis?: any, _perQuestionAnswers?: Record<string, string | null> | null) => {
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
    (p) => p.phase === "BUSINESS_PLAN" && !p.isCommand,
  );
  const businessPlanImportOfferActive = isBusinessPlanImportOfferActive({
    phase: progress.phase,
    bpAnswered: resolveBusinessPlanAnsweredCount({
      phaseAnswered: progress.phase_answered,
      backendAnswered: backendTotals.answered,
      bpHistoryPairs: history,
      bpTotal,
    }),
    currentQuestionNumber,
    hasImportedPlan:
      hasUploadedPlan || hasImportedPlanFromDb,
  });
  const historyPhaseAnswered = isGKY
    ? Math.min(gkyPairs.length, gkyTotal)
    : Math.min(bpPairs.length, bpTotal);
  const total = backendTotals.total;
  const answeredCount = Math.max(backendTotals.answered, historyPhaseAnswered);
  const percent = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  // Phase-scoped progress for header + sidebar (GKY: X/5, Business Plan: X/45).
  // Must align with asked_q / currentQuestionNumber — not a separate drift counter.
  const isBusinessPlanPhase = progress.phase === "BUSINESS_PLAN";
  const isGKYPhase = progress.phase === "GKY";
  const phaseScopedTotal =
    isBusinessPlanPhase || isGKYPhase
      ? (progress.overall_progress?.total ??
        (isBusinessPlanPhase ? bpTotal : gkyTotal))
      : total;
  const phaseScopedAnswered =
    isBusinessPlanPhase || isGKYPhase
      ? (progress.overall_progress?.answered ?? progress.answered ?? answeredCount)
      : answeredCount;
  const phaseScopedPercent =
    phaseScopedTotal > 0
      ? Math.round((phaseScopedAnswered / phaseScopedTotal) * 100)
      : progress.overall_progress?.percent ?? percent;

  // Active question index for non-questionnaire phases / fallbacks.
  const headerStep = Math.max(
    0,
    Math.min(
      typeof currentQuestionNumber === "number" && !Number.isNaN(currentQuestionNumber)
        ? currentQuestionNumber
        : answeredCount,
      total
    )
  );

  const headerDisplayAnswered =
    isBusinessPlanPhase || isGKYPhase ? phaseScopedAnswered : headerStep;
  const headerDisplayTotal =
    isBusinessPlanPhase || isGKYPhase ? phaseScopedTotal : total;

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
    headerStep: headerStep,
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

  // Bridge the gap between the backend flipping to a transition phase and
  // `transitionData` becoming available (it's populated by a follow-up fetch,
  // see the PLAN_TO_SUMMARY_TRANSITION/PLAN_TO_BUDGET_TRANSITION handlers above).
  // Without this, the old Q&A view kept rendering during that fetch with its
  // phase-gated widgets (sidebar, progress circle, etc.) already hidden because
  // `progress.phase` no longer matched BUSINESS_PLAN/GKY/IMPLEMENTATION — producing
  // a broken, half-collapsed layout for a moment on every phase transition.
  if (
    !transitionData &&
    [
      "PLAN_TO_SUMMARY_TRANSITION",
      "PLAN_TO_ROADMAP_TRANSITION",
      "PLAN_TO_BUDGET_TRANSITION",
    ].includes(progress.phase as string)
  ) {
    return (
      <VentureLoader
        title="Wrapping up…"
        subtitle="Preparing your next step"
      />
    );
  }

  // Show GKY to Business Plan transition
  if (transitionData && transitionData.transitionPhase === "PLAN_TO_SUMMARY") {
    return (
      <PlanToRoadmapTransition
        businessPlanSummary={transitionData.businessPlanSummary}
        businessPlanArtifact={transitionData.businessPlanArtifact}
        onApprove={() => handleApprovePlan("summary_to_budget")}
        onRevisit={handleRevisitPlan}
        onExitToChat={() => setTransitionData(null)}
        loading={loading}
        sessionId={sessionId}
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
        onExitToChat={() => setTransitionData(null)}
        loading={loading}
        sessionId={sessionId}
      />
    );
  }

  // Show implementation phase
  if (progress.phase === "IMPLEMENTATION") {
    console.log("✅ Rendering Implementation component - phase is IMPLEMENTATION");

    return (
      <Implementation
        sessionId={sessionId!}
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

  // For command turns (Draft/Support/Scrapping), show the question snapshot inside that
  // history card and hide the duplicate standalone current-question card below.
  const latestHistoryPair = history.length > 0 ? history[history.length - 1] : null;
  const hideStandaloneCurrentQuestionCard = Boolean(
    latestHistoryPair?.isCommand && !loading
  );
  const pendingModifyReviewActive = Boolean(
    showVerificationButtons &&
      latestHistoryPair?.commandKind === "modify" &&
      !loading
  );
  // Support is informational guidance, not a candidate answer. When the pending
  // verification belongs to a Support response, hide Accept and surface only
  // Modify/Draft. Go-back review answers are answerable, so they keep Accept.
  const isSupportResponsePending = Boolean(
    !goBackReviewAnswer &&
      latestHistoryPair?.isCommand &&
      latestHistoryPair?.commandKind === "support"
  );

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

  const showProgressSidebar = progress.phase !== "GKY";
  const chatContentMaxWidth = progress.phase === "GKY" ? "max-w-5xl" : "max-w-4xl";

  return (
    <CoachMarkProvider sessionId={sessionId} onTourEnd={handleBpQuickTourEnded}>
      <BusinessPlanTourTrigger
        phase={progress.phase}
        uploadModalOpen={uploadPlanModal.isOpen}
      />
      <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-teal-50 text-sm lg:flex-row">
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
              data-coachmark="support"
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
              data-coachmark="draft"
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
              data-coachmark="scrapping"
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

          {/* {progress.phase === ("BUSINESS_PLAN" as ProgressState['phase']) &&
            businessPlanImportOfferActive && (
            <button
              type="button"
              onClick={() => openUploadPlanModal()}
              disabled={loading}
              className="group relative bg-gradient-to-br from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 border border-teal-200 hover:border-teal-300 rounded-xl p-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex flex-col items-center space-y-2"
              title="Import a business plan you created outside Founderport"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform duration-300">
                📤
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold text-teal-800 group-hover:text-teal-900">Import plan</div>
                <div className="text-[10px] text-teal-600 group-hover:text-teal-700">External file</div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          )} */}

          {/* Skip to Q45 — testing only (desktop sidebar) */}
          {progress.phase === ("BUSINESS_PLAN" as ProgressState['phase']) && (
            <button
              type="button"
              onClick={() => handleNext("jump to question 45")}
              disabled={loading}
              className="group relative flex flex-col items-center space-y-2 rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 p-3 transition-all duration-300 hover:scale-105 hover:border-rose-300 hover:from-rose-100 hover:to-pink-100 hover:shadow-lg disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
              title="Skip to Question 45 (Testing only)"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-xl text-white transition-transform duration-300 group-hover:scale-110">
                ⏭️
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold text-rose-800 group-hover:text-rose-900">Skip Q45</div>
                <div className="text-[10px] text-rose-600 group-hover:text-rose-700">Testing</div>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-rose-500/10 to-pink-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
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
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header Section */}
        <div className="flex-shrink-0 px-2 py-2 sm:px-3 sm:py-3 lg:px-3 lg:py-4">
          <div className="max-w-6xl mx-auto">
            {/* Mobile header — single compact row */}
            <div className="mb-2 flex h-16 min-w-0 items-center gap-1.5 sm:gap-2 lg:hidden">
              <motion.button
                whileHover={{ scale: 1.02, x: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/ventures")}
                className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-gray-200/50 bg-white/60 px-2 py-1.5 text-[10px] font-medium text-gray-600 shadow-sm transition-all duration-200 hover:border-teal-300/50 hover:bg-white/90 hover:text-teal-600 group sm:px-2.5 sm:text-xs"
                aria-label="Back to all ventures"
              >
                <svg
                  className="h-3.5 w-3.5 shrink-0 group-hover:-translate-x-0.5 transition-transform sm:h-4 sm:w-4"
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
                <span className="max-[340px]:hidden sm:inline">Ventures</span>
              </motion.button>
              <VentureBrandMark />

              <div className="flex min-w-0 flex-1 items-center justify-center overflow-hidden">
                <div className="flex min-w-0 max-w-[10rem] items-center gap-1 rounded-md border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-1.5 py-1 shadow-sm sm:max-w-none sm:gap-1.5 sm:px-2.5 sm:py-1.5">
                  <div className="relative shrink-0">
                    <div className="h-1 w-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse sm:h-1.5 sm:w-1.5"></div>
                    <div className="absolute inset-0 h-1 w-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 animate-ping opacity-60 sm:h-1.5 sm:w-1.5"></div>
                  </div>
                  <span className="truncate text-[10px] font-semibold leading-none text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text sm:text-xs">
                    {headerPhaseLabel}
                  </span>
                  <span className="shrink-0 text-[10px] font-medium leading-none text-gray-700 sm:text-xs">
                    {`${headerDisplayAnswered}/${headerDisplayTotal}`}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => {
                    setShowProfileModal(true);
                    loadProfileData();
                  }}
                  className="rounded-md border border-gray-200 bg-white/80 p-1.5 backdrop-blur-sm transition-colors hover:bg-white sm:rounded-lg sm:p-2"
                  title="View Profile"
                >
                  <svg
                    className="h-4 w-4 text-gray-600 sm:h-5 sm:w-5"
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

                {showProgressSidebar && (
                  <button
                    onClick={() => setShowMobileNav(!showMobileNav)}
                    className="rounded-md border border-gray-200 bg-white/80 p-1.5 backdrop-blur-sm transition-colors hover:bg-white sm:rounded-lg sm:p-2"
                    aria-label="Open progress menu"
                  >
                    <svg
                      className="h-4 w-4 text-gray-600 sm:h-5 sm:w-5"
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
                )}
              </div>
            </div>

            {/* Desktop header — unchanged layout */}
            <div className="mb-3 hidden h-20 items-center gap-4 lg:flex">
              <div className="flex h-full min-w-0 items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02, x: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/ventures")}
                  className="flex items-center gap-2 rounded-full border border-gray-200/50 bg-white/60 px-3 py-1.5 text-sm text-gray-600 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-teal-300/50 hover:bg-white/90 hover:text-teal-600 hover:shadow-md group"
                >
                  <svg
                    className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
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
                <VentureBrandMark />
              </div>

              <div className="flex flex-1 items-center justify-center">
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
                      {`${headerDisplayAnswered} of ${headerDisplayTotal}`}
                    </span>
                  </div>
                </div>
              </div>

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

              {showProgressSidebar && (
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
              )}
            </div>

            {/* Single source of truth for BP progress: sidebar “Overall” bar. Hide floating circle on BP,
               and during phase-transition states — those get their own dedicated transition screen, so a
               raw percent/phase badge here would just flash confusingly for a moment. */}
            {![
              'GKY',
              'BUSINESS_PLAN',
              'PLAN_TO_ROADMAP_TRANSITION',
              'PLAN_TO_SUMMARY_TRANSITION',
              'PLAN_TO_BUDGET_TRANSITION',
              'ROADMAP_TO_IMPLEMENTATION_TRANSITION',
            ].includes(progress.phase) && (
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
                      <span>Launch Roadmap</span>
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

        {/* Single scroll: messages + input + picker */}
        <div
          ref={chatContainerRef}
          className="chat-container min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-8 sm:pb-6 lg:pb-4"
        >
          <div className={`mx-auto flex min-h-full flex-col ${chatContentMaxWidth}`}>
            <div className="flex-1 space-y-5 pb-3 sm:space-y-4 lg:space-y-4 lg:pb-0">
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
                      {(() => {
                        // This badge labels THIS row's question. A trailing section
                        // summary lives in pair.sectionSummary and renders below with
                        // its own "Section Summary" badge — it must not relabel the
                        // question row (e.g. the last question of a section was being
                        // shown as "Section Summary" instead of "Question N").
                        const badgeLabel = getAngelMessageBadgeLabel(pair.phase ?? progress.phase, {
                          questionNumber: pair.questionNumber,
                          content: pair.question,
                        });
                        return badgeLabel ? (
                          <div className="mb-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {badgeLabel}
                            </span>
                          </div>
                        ) : null;
                      })()}
                      {pair.isCommand ? (
                        pair.question?.trim() ? (
                          (() => {
                            const { acknowledgement: snapAck, question: snapQ } = parseAngelReply(
                              pair.question
                            );
                            const hasRichSplit =
                              snapAck.trim().length > 0 &&
                              snapQ.trim().length > 0 &&
                              snapQ.trim() !== snapAck.trim();
                            if (hasRichSplit) {
                              return (
                                <div className="space-y-3">
                                  <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-4 py-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-1.5">
                                      Angel Response
                                    </p>
                                    <div className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-strong:font-semibold prose-strong:text-gray-900">
                                      <ReactMarkdown
                                        components={{
                                          p: ({ children }) => (
                                            <p className="whitespace-pre-wrap mb-2 last:mb-0">{children}</p>
                                          ),
                                          strong: ({ children }) => (
                                            <strong className="font-semibold text-gray-900">{children}</strong>
                                          ),
                                        }}
                                      >
                                        {normalizeAngelMarkdown(snapAck)}
                                      </ReactMarkdown>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">
                                      Next Question
                                    </p>
                                    <div className="rounded-lg border border-blue-200 bg-blue-50/70 px-4 py-3">
                                      <div className="text-gray-800 whitespace-normal text-sm">
                                        <QuestionFormatter text={snapQ} phase={progress.phase} />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <div>
                                <div className="rounded-lg border border-blue-200 bg-blue-50/70 px-4 py-3">
                                  <div className="text-gray-800 whitespace-normal text-sm">
                                    <QuestionFormatter text={pair.question} phase={progress.phase} />
                                  </div>
                                </div>
                              </div>
                            );
                          })()
                        ) : null
                      ) : (
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
                                  {normalizeAngelMarkdown(pair.acknowledgement)}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}
                          <div className={pair.acknowledgement ? "space-y-2" : ""}>
                            {pair.acknowledgement && (
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">Next Question</p>
                            )}
                            <div className={pair.acknowledgement ? "rounded-lg border border-blue-200 bg-blue-50/70 px-4 py-3" : ""}>
                              <div className="text-gray-800 whitespace-normal text-sm">
                                <QuestionFormatter text={pair.question} phase={progress.phase} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
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
                        {pair.commandKind === "modify"
                          ? MODIFY_HISTORY_ANSWER_LABEL
                          : pair.answer}
                      </div>
                    </div>
                  </div>
                </div>
                {pair.sectionSummary && (
                  <div className="border-t border-gray-100 bg-gradient-to-r from-teal-50 to-blue-50 p-3 sm:p-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-md">
                        <img
                          src={FounderportIcon}
                          alt="Angel"
                          className="!h-14 !w-14 object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 text-sm font-semibold text-gray-800">Angel</div>
                        <div className="mb-2">
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            Section Summary
                          </span>
                        </div>
                        <QuestionFormatter text={pair.sectionSummary} phase={pair.phase ?? progress.phase} />
                        {pair.sectionSummaryAccepted && (
                          <p className="mt-2 text-xs font-medium text-emerald-700">Accepted — continued to next section</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {pair.isCommand && pair.acknowledgement && (
                  <div className="p-3 sm:p-4 border-t border-gray-100 bg-emerald-50/40">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-blue-500 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-md">
                        <img
                          src={FounderportIcon}
                          alt="Angel"
                          className="!w-14 !h-14 object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 mb-1 text-sm">Angel</div>
                        <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-4 py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-1.5">
                            {commandQuickActionResponseTitle(pair.commandKind)}
                          </p>
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
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Current Question - Angel asks (must appear BEFORE user's answer) */}
            {!hideStandaloneCurrentQuestionCard && (
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
                    {(() => {
                      const badgeLabel = getAngelMessageBadgeLabel(progress.phase, {
                        isSectionSummary: isCurrentSectionSummary,
                        questionNumber: currentQuestionNumber,
                        content: currentQuestion,
                      });
                      return badgeLabel ? (
                        <div className="mb-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {badgeLabel}
                          </span>
                        </div>
                      ) : null;
                    })()}
                    <div className="text-gray-800 whitespace-normal text-sm angel-intro-text">
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
                                    {normalizeAngelMarkdown(currentAcknowledgement)}
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
            )}

            {/* User's answer + Angel thinking - shown AFTER the question while waiting for response */}
            {(pendingUserReply || (goBackUserDisplay && !pendingModifyReviewActive)) && (
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
                          {goBackUserDisplay && !pendingUserReply
                            ? goBackUserDisplay
                            : pendingUserReply}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {pendingUserReply && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <AngelThinkingLoader />
                </div>
                )}
              </div>
            )}
            </div>

            {/* "View Business Plan Summary" CTA — recovery affordance for a user
                with no active question left to answer in BUSINESS_PLAN phase
                (there's no next question, and the sidebar's "Business Plan"
                button only appears in ROADMAP / IMPLEMENTATION phases).
                Gated on the absence of a live current question, NOT on
                "bpPairs.length >= bpTotal": answering the final question
                (BUSINESS_PLAN.45) never adds a history pair for its own
                answer (the summary transition modal replaces that chat bubble
                instead), so a history-derived count reads as "done" the whole
                time the user is still looking at an unanswered Q45 — showing
                this button before the final question was actually answered.
                Checking currentQuestion directly is authoritative: whenever
                there IS a live question on screen (including Q45 itself, or
                the question restored by "Edit Plan"), the CTA must stay
                hidden and answering it is what should drive the transition. */}
            {progress.phase === "BUSINESS_PLAN" && !currentQuestion?.trim() && !pendingUserReply && (
              <div className="mt-4 flex justify-center print:hidden">
                <button
                  type="button"
                  onClick={handleReopenPlanSummary}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-teal-600 hover:to-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>View Business Plan Summary</span>
                </button>
              </div>
            )}

            {/* Input + actions — one scroll with chat; extra vertical rhythm on mobile only */}
            <div className="mt-6 flex flex-shrink-0 flex-col gap-4 border-t border-gray-200/70 bg-gradient-to-br from-slate-50 to-teal-50 px-3 pb-5 pt-5 sm:mt-5 sm:gap-3 sm:px-3 sm:pb-4 sm:pt-4 lg:mt-4 lg:gap-0 lg:px-0 lg:py-3">
              <div className="flex w-full min-w-0 max-w-full flex-col gap-4 sm:gap-3 lg:gap-0">
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
                  // Route "Draft Answer" through the unified command-turn flow so it
                  // appends a visible draft row (like the Draft button) instead of
                  // writing to currentQuestion, which is hidden whenever the last row
                  // is a command (e.g. right after Support) — that made the draft
                  // silently disappear behind the Support response.
                  onDraftMore={() => handleNext("Draft Answer")}
                  showAccept={!isSupportResponsePending}
                  disabled={loading}
                  currentText={
                    goBackReviewAnswer?.trim() ||
                    (history.length > 0 && history[history.length - 1]?.isCommand &&
                    history[history.length - 1]?.acknowledgement?.trim()
                      ? history[history.length - 1].acknowledgement!.trim()
                      : currentQuestion || "")
                  }
                  // Draft Answer is only offered on a Support turn (Modify + Draft).
                  // After a Draft is generated the choices are Accept/Modify only —
                  // drafting again from a draft is not offered.
                  showDraftMore={isSupportResponsePending}
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

            {awaitingGkyProceed && !loading && (
              <div className="mb-4">
                <GkyProceedButton
                  onProceed={() => handleNext('Proceed')}
                  disabled={loading}
                />
              </div>
            )}

            {progress.phase !== 'GKY' && (
              <div className="mb-1 flex justify-center sm:mb-3 lg:mb-3">
                <button
                  onClick={() => setShowInstructions(true)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  title="Help"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4 0 2.21-1.79 4-4 4-1.742 0-3.223-.835-3.772-2M12 18v.01M12 2a10 10 0 100 20 10 10 0 000-20z"></path></svg>
                </button>
              </div>
            )}

            {!awaitingGkyProceed && (
              <SmartInput
                value={currentInput}
                onChange={setCurrentInput}
                onSubmit={handleNext}
                placeholder="Type your response..."
                disabled={loading}
                loading={loading}
                currentQuestion={currentQuestion}
                currentPhase={progress.phase}
              />
            )}

            {/* Quick Actions Row - Mobile only (desktop shows in left sidebar) */}
            {(progress.phase === ("IMPLEMENTATION" as ProgressState['phase']) ||
              progress.phase === ("BUSINESS_PLAN" as ProgressState['phase'])) && (
              <div className="mt-2 border-t border-gray-200/60 pt-5 sm:mt-4 sm:border-0 sm:pt-0 lg:hidden">
                {progress.phase === ("BUSINESS_PLAN" as ProgressState['phase']) &&
                  businessPlanImportOfferActive && (
                  <div className="mb-3">
                    <button
                      type="button"
                      onClick={() => openUploadPlanModal()}
                      disabled={loading}
                      className="w-full rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-900 shadow-sm hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      📤 Import existing business plan
                    </button>
                  </div>
                )}
                <div className="text-center mb-3">
                  <p className="text-gray-500 text-sm font-medium">🚀 Quick Actions</p>
                  <p className="text-gray-400 text-xs">Choose a tool to help with your response</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                  {/* Support Button */}
                  <button
                    onClick={() => handleNext("Support")}
                    disabled={loading}
                    data-coachmark="support"
                    className="group relative min-h-[4.5rem] bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 hover:border-blue-300 rounded-xl p-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none sm:min-h-0"
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
                    data-coachmark="draft"
                    className="group relative min-h-[4.5rem] bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 border border-emerald-200 hover:border-emerald-300 rounded-xl p-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none sm:min-h-0"
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
                    data-coachmark="scrapping"
                    className="group relative min-h-[4.5rem] bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border border-orange-200 hover:border-orange-300 rounded-xl p-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none sm:min-h-0"
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
                    className="group relative min-h-[4.5rem] bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 border border-violet-200 hover:border-violet-300 rounded-xl p-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none sm:min-h-0"
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
        </div>
      </div>

      {/* Right Navigation Panel - Desktop (hidden during GKY — sidebar has no useful content) */}
      {showProgressSidebar && (
      <div className="hidden h-screen w-80 flex-shrink-0 border-l border-gray-200 bg-gradient-to-b from-white via-slate-50/80 to-teal-50/60 lg:sticky lg:top-0 lg:flex lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-4 pb-6">
        <QuestionNavigator
          className="w-full"
          questions={questions}
          currentPhase={progress.phase}
          onQuestionSelect={handleQuestionSelect}
          currentProgress={{
            phase: progress.phase,
            answered: phaseScopedAnswered,
            total: phaseScopedTotal,
            percent: phaseScopedPercent,
            phase_answered: phaseScopedAnswered,
            overall_progress: progress.overall_progress ?? {
              answered: phaseScopedAnswered,
              total: phaseScopedTotal,
              percent: phaseScopedPercent,
              phase_breakdown: {
                gky_completed: isGKYPhase ? phaseScopedAnswered : gkyTotal,
                gky_total: gkyTotal,
                bp_completed: isBusinessPlanPhase ? phaseScopedAnswered : 0,
                bp_total: bpTotal,
              },
            },
          }}
          currentQuestionNumber={currentQuestionNumber}
          showStepPercent={false}
          onEditPlan={progress.phase === "BUSINESS_PLAN" ? handleEditPlan : undefined}
        />
        </div>
      </div>
      )}

      {/* Mobile Navigation Panel - Overlay */}
      {showProgressSidebar && showMobileNav && (
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
              {/* Progress Summary — during Business Plan, align bar with full-journey overall (matches desktop sidebar). */}
              <div className="p-4 border-b border-gray-100 bg-white">
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600 mb-1">Current Progress</div>
                  <div className="text-lg font-bold text-gray-900">{headerPhaseLabel}</div>
                  <div className="text-sm text-gray-500">
                    {`${headerDisplayAnswered} of ${headerDisplayTotal}`}
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${phaseScopedPercent}%`,
                      }}
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

      <VentureOnboardingTips
        open={ventureOnboardingOpen}
        sessionId={sessionId}
        onOpenChange={setVentureOnboardingOpen}
      />

      {/* Modify Modal */}
      <ModifyModal
        isOpen={modifyModal.isOpen}
        onClose={() => setModifyModal(prev => ({ ...prev, isOpen: false }))}
        assistantSnapshot={modifyModal.assistantSnapshot}
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
        guidedEntrance={uploadPlanModal.guidedEntrance}
        onClose={handleUploadModalClose}
        onUploadSuccess={handleUploadPlanSuccess}
        sessionId={sessionId}
        onStartAnswering={async (analysis?: any, businessInfo?: any, perQuestionAnswers?: Record<string, string | null> | null) => {
          handleUploadModalClose();

          // Backend uses snake_case (missing_questions); frontend reads camelCase.
          let normalizedAnalysis = analysis || uploadAnalysis;
          if (normalizedAnalysis && normalizedAnalysis.missing_questions && !normalizedAnalysis.missingQuestions) {
            normalizedAnalysis = { ...normalizedAnalysis, missingQuestions: normalizedAnalysis.missing_questions };
          }
          const analysisToUse = normalizedAnalysis;
          const businessInfoToUse = businessInfo || (uploadAnalysis?.businessInfo);
          const missingFromAnalysis = (analysisToUse?.missingQuestions || [])
            .map((q: any) => q.question_number || q.questionNumber)
            .filter((n: any) => typeof n === "number");

          try {
            setLoading(true);

            console.log("🎯 onStartAnswering:", {
              hasAnalysis: !!analysisToUse,
              hasBusinessInfo: !!businessInfoToUse,
              missingCount: missingFromAnalysis.length,
            });

            // No analysis at all → caller wants to start the questionnaire from scratch.
            // Reset and let the chat ask BP.01. This is the only path that should ever
            // produce "Q1 after upload" — never the "all questions found" path.
            if (!analysisToUse) {
              try {
                await syncSessionProgress(sessionId!, {
                  phase: "BUSINESS_PLAN",
                  answered_count: 0,
                  asked_q: undefined,
                });
              } catch (phaseError) {
                console.warn("Failed to set phase:", phaseError);
              }
              const { result } = await fetchQuestion("", sessionId!);
              const { acknowledgement, question } = parseAngelReply(result.reply);
              const qn = deriveQuestionNumber(result.question_number, result.reply, result.progress);
              setCurrentQuestion(question);
              setCurrentAcknowledgement(acknowledgement);
              setCurrentQuestionNumber(qn);
              updateQuestionTracker(result.progress.phase, qn);
              applyProgressUpdate(result.progress);
              toast.success("Ready to answer questions!");
              return;
            }

            // Force phase to BUSINESS_PLAN so save-found-info / jump / completion
            // all operate on the right session state regardless of where the user
            // triggered the upload from.
            try {
              await syncSessionProgress(sessionId!, {
                phase: "BUSINESS_PLAN",
                answered_count: 0,
                asked_q: undefined,
              });
            } catch (phaseError) {
              console.warn("Failed to set phase (continuing anyway):", phaseError);
            }

            // ALWAYS persist extracted answers, regardless of missing count.
            // Previously this only ran when missing > 0, so a 100%-complete upload
            // silently discarded every extracted answer.
            let savedCount = 0;
            let actualMissing: number[] = missingFromAnalysis;
            try {
              const { data: saveData } = await httpClient.post<any>('/upload-plan/save-found-info', {
                session_id: sessionId,
                business_info: businessInfoToUse || {},
                per_question_answers: perQuestionAnswers || {},
                found_questions: [],
                missing_questions: missingFromAnalysis,
              });
              if (saveData?.success) {
                savedCount = saveData.saved_count || 0;
                actualMissing = Array.isArray(saveData.missing_questions)
                  ? saveData.missing_questions
                  : missingFromAnalysis;
                console.log(`✅ save-found-info: saved=${savedCount}, missing=[${actualMissing.join(",")}]`);

                if (actualMissing.length > 0) {
                  setUploadAnalysis({
                    missingQuestions: actualMissing.map((qNum: number) => ({
                      question_number: qNum,
                      question_text: `Question ${qNum}`,
                      category: "General",
                      priority: "medium",
                    })),
                    businessInfo: businessInfoToUse || {},
                  });
                }

                // Refresh chat history so the saved Q&A pairs show up in the UI.
                try {
                  const refreshedHistory = await fetchSessionHistory(sessionId);
                  const { pairs: newPairs } = buildHistoryPairs(refreshedHistory || [], parseAngelReply);
                  setHistory(newPairs);
                  console.log(`✅ History refreshed: ${newPairs.length} pairs (incl. ${savedCount} from upload)`);
                } catch (refreshError) {
                  console.warn("Failed to refresh history after save:", refreshError);
                }
              }
            } catch (saveError) {
              console.warn("Failed to save found info (continuing anyway):", saveError);
              toast.warning("Some information may not have been saved. Please continue.");
            }

            // Branch on whether the plan is complete or has gaps.
            if (actualMissing.length === 0) {
              // PLAN IS COMPLETE — every BUSINESS_PLAN question has an answer in
              // the session. Trigger BP completion through the SAME path the chat
              // uses (handleNext), so the response's transition_phase is honored
              // (PLAN_TO_SUMMARY → PlanToRoadmapTransition modal, PLAN_TO_BUDGET
              // → budget navigation, PLAN_TO_ROADMAP → roadmap flow). Calling
              // fetchQuestion directly here dropped the transition_phase field on
              // the floor and rendered the "Planning Champion Award" body as a
              // chat bubble instead of opening the dedicated summary screen.
              toast.success(`Plan is complete (${savedCount} answers saved). Continuing…`);
              await handleNext(
                "All business plan questions are answered from my uploaded plan. Continue to the launch roadmap.",
              );
              return;
            }

            // GAPS REMAIN — jump to the first missing question.
            const firstMissingNumber = actualMissing[0];
            const jumpMessage = `Start from question ${firstMissingNumber} to answer missing questions from uploaded plan. Missing questions: ${actualMissing.join(",")}`;
            console.log(`🚀 Jump message: "${jumpMessage}"`);

            await new Promise((resolve) => setTimeout(resolve, 100));

            try {
              const { result } = await fetchQuestion(jumpMessage, sessionId!);
              try {
                await syncSessionProgress(sessionId!, {
                  phase: result.progress.phase,
                  answered_count: result.progress.answered || 0,
                  asked_q: `BUSINESS_PLAN.${String(firstMissingNumber).padStart(2, "0")}`,
                });
              } catch (syncError) {
                console.warn("Failed to sync progress after jump:", syncError);
              }

              const { acknowledgement, question } = parseAngelReply(result.reply);
              const qn = deriveQuestionNumber(result.question_number, result.reply, result.progress);
              setCurrentQuestion(question);
              setCurrentAcknowledgement(acknowledgement);
              setCurrentQuestionNumber(qn);
              updateQuestionTracker(result.progress.phase, qn);
              applyProgressUpdate(result.progress);

              if (qn === firstMissingNumber) {
                toast.success(`Starting from Question ${firstMissingNumber} — ${actualMissing.length} questions to answer.`);
              } else {
                console.warn(`⚠️ Expected Q${firstMissingNumber} but landed on Q${qn}.`);
              }
            } catch (fetchError) {
              console.error("❌ Error fetching jump question:", fetchError);
              toast.error("Failed to jump to missing question. Please try again.");
              throw fetchError;
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
        businessContext={businessContext}
      /> */}

      {/* GKY-to-Business-Plan modal removed — transition happens inline in chat */}

      {showInstructions && (
        <BusinessPlanningInstructions onClose={() => setShowInstructions(false)} />
      )}
      </div>
    </CoachMarkProvider>
  );
}