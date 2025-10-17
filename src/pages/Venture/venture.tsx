"use client";

// ChatPage.tsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchBusinessPlan,
  fetchQuestion,
  fetchRoadmapPlan,
  uploadBusinessPlan,
} from "../../services/authService";
import { toast } from "react-toastify";
import ProgressCircle from "../../components/ProgressCircle";
import BusinessPlanModal from "../../components/BusinessPlanModal";
import VentureLoader from "../../components/VentureLoader";
import RoadmapModal from "../../components/RoadmapModal";
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
import Implementation from "../Implementation";
import RoadmapEditModal from "../../components/RoadmapEditModal";
import BusinessQuestionFormatter from "../../components/BusinessQuestionFormatter";

interface ConversationPair {
  question: string;
  answer: string;
  questionNumber?: number;
}

interface ProgressState {
  phase: "KYC" | "BUSINESS_PLAN" | "PLAN_TO_ROADMAP_TRANSITION" | "ROADMAP" | "ROADMAP_GENERATED" | "ROADMAP_TO_IMPLEMENTATION_TRANSITION" | "IMPLEMENTATION";
  answered: number;
  phase_answered?: number;  // Phase-specific step count
  total: number;
  percent: number;
  combined?: boolean;  // Flag for combined progress
  overall_progress?: {  // Combined progress for KYC + Business Plan (65 total)
    answered: number;
    total: number;
    percent: number;
  };
  phase_breakdown?: {
    kyc_completed: number;
    kyc_total: number;
    bp_completed: number;
    bp_total: number;
  };
}

// Updated to include PLAN_TO_ROADMAP_TRANSITION phase

const QUESTION_COUNTS = {
  KYC: 19,  // Now 19 questions (removed privacy question)
  BUSINESS_PLAN: 46,  // Restored to full 46 questions
  ROADMAP: 1,
  IMPLEMENTATION: 10,
};


export default function ChatPage() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const hasFetched = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Function to extract business information from conversation history
  const extractBusinessInfo = () => {
    const businessInfo = {
      business_name: "Your Business",
      industry: "General Business", 
      location: "United States",
      business_type: "Startup"
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
      
      // Extract location from KYC.10 or Business Plan location questions
      if ((question.includes('where are you located') || question.includes('what city') || 
           question.includes('where will your business be located')) &&
          answerLower !== 'yes' && answerLower !== 'no' && answer.length > 2 && answer.length < 100) {
        // Extract city name (first part before comma)
        const cityName = answer.split(',')[0].trim();
        businessInfo.location = cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase();
        console.log(`📊 Extracted location: ${businessInfo.location}`);
      }
      
      // Extract business structure from KYC (LLC, Corporation, etc.)
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
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number | null>(null);
  const [currentInput, setCurrentInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({
    phase: "KYC",
    answered: 0,
    total: 19,
    percent: 0,
  });
  
  // Track question numbers per phase to prevent skips
  const [phaseQuestionTracker, setPhaseQuestionTracker] = useState<{
    currentPhase: string;
    questionCount: number;
    lastQuestionNumber: number | null;
  }>({
    currentPhase: "KYC",
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
    transitionPhase: string;
  } | null>(null);
  const [kycToBusinessTransition, setKycToBusinessTransition] = useState<{
    kycSummary: string;
    isActive: boolean;
  } | null>(null);
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

  // AI-powered detection of whether Accept/Modify buttons should be shown
  const isVerificationMessage = (message: string): boolean => {
    if (!message || message.length < 100) return false;
    
    const lowerMessage = message.toLowerCase();
    
    // Quick check for explicit verification keywords (fast path)
    const explicitVerificationKeywords = [
      "does this look accurate",
      "does this look correct",
      "is this accurate",
      "is this correct",
      "please let me know where you'd like to modify",
      "here's what i've captured so far"
    ];
    
    const hasExplicitVerification = explicitVerificationKeywords.some(keyword => lowerMessage.includes(keyword));
    if (hasExplicitVerification) return true;
    
    // AI-powered detection for substantial, actionable content
    // Check if this is a substantive response that could be an answer (not just a question)
    
    // 1. Check if it's just asking a new question (should NOT show buttons)
    const hasQuestionTag = message.match(/\[\[Q:[A-Z_]+\.\d{2}\]\]/);
    const isJustAskingQuestion = hasQuestionTag && message.length < 1000;
    if (isJustAskingQuestion) return false;
    
    // 2. Check if it's a substantial, structured response (likely an answer/draft)
    const isSubstantialResponse = (
      message.length > 500 && // Substantial length
      (
        // Has multiple sections/structure
        (lowerMessage.match(/\*\*/g) || []).length >= 4 ||
        // Has numbered/bulleted lists
        (lowerMessage.match(/\n\d+\./g) || []).length >= 3 ||
        (lowerMessage.match(/\n-/g) || []).length >= 5 ||
        (lowerMessage.match(/\n•/g) || []).length >= 5
      ) &&
      // Contains actionable/informative content keywords
      (
        lowerMessage.includes("consider") ||
        lowerMessage.includes("focus on") ||
        lowerMessage.includes("strategy") ||
        lowerMessage.includes("recommendation") ||
        lowerMessage.includes("insight") ||
        lowerMessage.includes("action step") ||
        lowerMessage.includes("implementation") ||
        lowerMessage.includes("key points") ||
        lowerMessage.includes("features") ||
        lowerMessage.includes("benefits")
      )
    );
    
    if (isSubstantialResponse) return true;
    
    // 3. Check if it's a response to a user's modification request
    // (when user says "give me unique", "explain better", "make it simpler", etc.)
    const hasCustomRequestIndicators = (
      (lowerMessage.includes("here's") || lowerMessage.includes("here is")) &&
      (
        lowerMessage.includes("unique") ||
        lowerMessage.includes("simplified") ||
        lowerMessage.includes("detailed") ||
        lowerMessage.includes("enhanced") ||
        lowerMessage.includes("refined") ||
        lowerMessage.includes("improved")
      ) &&
      message.length > 400
    );
    
    if (hasCustomRequestIndicators) return true;
    
    return false;
  };

  // Function to extract the actionable content from AI responses (removes question tags and tips)
  const extractGuidanceContent = (message: string): string | null => {
    if (!message || message.length < 100) return null;
    
    let cleanedContent = message;
    
    // Remove question tags like [[Q:BUSINESS_PLAN.06]]
    cleanedContent = cleanedContent.replace(/\[\[Q:[A-Z_]+\.\d{2}\]\]/g, '').trim();
    
    // Remove trailing tips and verification prompts
    cleanedContent = cleanedContent.replace(/💡 \*\*Quick Tip\*\*:.*$/s, '').trim();
    cleanedContent = cleanedContent.replace(/💡 \*\*Pro Tip\*\*:.*$/s, '').trim();
    cleanedContent = cleanedContent.replace(/\n\nVerification:.*$/s, '').trim();
    cleanedContent = cleanedContent.replace(/🎯 \*\*Areas Where You May Need Additional Support:\*\*.*$/s, '').trim();
    
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
          { question: currentQuestion, answer: guidanceContent, questionNumber: currentQuestionNumber },
        ]);
      }
      
      // IMPORTANT: Send only "Accept" to the backend, not the full content
      // The backend will understand "Accept" as a command to move to the next question
      const {
        result: { reply, progress, web_search_status, immediate_response, show_accept_modify, question_number },
      } = await fetchQuestion("Accept", sessionId!);
      const formatted = formatAngelMessage(reply);
      const questionNumber = calculateQuestionNumber(question_number, progress.phase, reply);
      setCurrentQuestion(formatted);
      setCurrentQuestionNumber(questionNumber);
      updateQuestionTracker(progress.phase, questionNumber);
      setProgress(progress);
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
    } catch (error) {
      console.error("Failed to fetch question:", error);
      toast.error("Something went wrong.");
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
      const formatted = formatAngelMessage(reply);
      const questionNumber = calculateQuestionNumber(question_number, progress.phase, reply);
      setCurrentQuestion(formatted);
      setCurrentQuestionNumber(questionNumber);
      updateQuestionTracker(progress.phase, questionNumber);
      setProgress(progress);
      setWebSearchStatus(web_search_status || { is_searching: false, query: undefined, completed: false });
      setShowVerificationButtons(show_accept_modify || false);
    } catch (error) {
      console.error("Failed to handle Yes:", error);
      toast.error("Something went wrong.");
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
      const formatted = formatAngelMessage(reply);
      const questionNumber = calculateQuestionNumber(question_number, progress.phase, reply);
      setCurrentQuestion(formatted);
      setCurrentQuestionNumber(questionNumber);
      updateQuestionTracker(progress.phase, questionNumber);
      setProgress(progress);
      setWebSearchStatus(web_search_status || { is_searching: false, query: undefined, completed: false });
      setShowVerificationButtons(show_accept_modify || false);
    } catch (error) {
      console.error("Failed to handle No:", error);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Draft More button click
  const handleDraftMore = async () => {
    setLoading(true);
    
    try {
      const {
        result: { reply, progress, web_search_status, immediate_response, show_accept_modify, question_number },
      } = await fetchQuestion("Draft More", sessionId!);
      const formatted = formatAngelMessage(reply);
      const questionNumber = calculateQuestionNumber(question_number, progress.phase, reply);
      setCurrentQuestion(formatted);
      setCurrentQuestionNumber(questionNumber);
      updateQuestionTracker(progress.phase, questionNumber);
      setProgress(progress);
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
    } catch (error) {
      console.error("Failed to fetch question:", error);
      toast.error("Something went wrong.");
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
        setProgress(data.result.progress);
        
        // Set the roadmap to implementation transition
        setRoadmapToImplementationTransition({
          roadmapContent: data.result.reply,
          isActive: true
        });
      } else {
        toast.error(data.message || "Failed to prepare implementation transition");
      }
    } catch (error) {
      console.error("Error preparing implementation transition:", error);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Handle KYC to Business Plan transition
  const handleStartBusinessPlanning = async () => {
    try {
      setLoading(true);
      toast.info("Starting business planning phase...");
      
      // Clear transition and proceed to business planning
      setKycToBusinessTransition(null);
      
      // Fetch the first business plan question
      const {
        result: { reply, progress, web_search_status, immediate_response, question_number },
      } = await fetchQuestion("", sessionId!);
      
      const formatted = formatAngelMessage(reply);
      const questionNumber = calculateQuestionNumber(question_number, progress.phase, reply);
      setCurrentQuestion(formatted);
      setCurrentQuestionNumber(questionNumber);
      updateQuestionTracker(progress.phase, questionNumber);
      setProgress(progress);
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
        
        // Clear all roadmap and transition states
        setRoadmapToImplementationTransition(null);
        setRoadmapData(null);
        setTransitionData(null);
        
        // Update progress to IMPLEMENTATION phase
        setProgress(data.result.progress);
        
        // Set the first implementation question
        const replyText = data.result.reply || '';
        const formatted = formatAngelMessage(replyText);
        setCurrentQuestion(formatted);
        
        // Add the implementation start message to conversation
        setHistory((prev) => [
          ...prev,
          {
            question: "Implementation Phase Started",
            answer: formatted,
          },
        ]);
      } else {
        toast.error(data.message || "Failed to start implementation");
      }
    } catch (error) {
      console.error("Error starting implementation:", error);
      toast.error("Something went wrong.");
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
  const extractQuestionNumber = (text: string): number | null => {
    // Check if this is an introduction message (not a question)
    const isIntroduction = text.toLowerCase().includes('welcome to founderport') || 
                          text.toLowerCase().includes('congratulations on taking your first step') ||
                          text.toLowerCase().includes('angel\'s mission is simple') ||
                          text.toLowerCase().includes('phase 1 - know your customer') ||
                          text.toLowerCase().includes('phase 2 - business planning') ||
                          text.toLowerCase().includes('phase 3 - roadmap') ||
                          text.toLowerCase().includes('phase 4: implementation') ||
                          text.toLowerCase().includes('your journey starts now') ||
                          text.toLowerCase().includes('every great business begins') ||
                          text.toLowerCase().includes('are you ready to begin your journey') ||
                          text.toLowerCase().includes('let\'s start with the getting to know you questionnaire') ||
                          // Check if it's the introduction with the first question embedded
                          (text.toLowerCase().includes('welcome to founderport') && text.toLowerCase().includes('what\'s your name and preferred name'));
    
    if (isIntroduction) {
      return null; // Don't show question number for introductions
    }
    
    // Look for patterns like [[Q:KYC.01]] or Question 1 of 20
    const tagMatch = text.match(/\[\[Q:[A-Z_]+\.(\d+)\]\]/);
    if (tagMatch) {
      return parseInt(tagMatch[1], 10);
    }
    
    const questionMatch = text.match(/Question (\d+) of \d+/i);
    if (questionMatch) {
      return parseInt(questionMatch[1], 10);
    }
    
    // If no tag found but this is a KYC question, try to determine the number from context
    if (progress.phase === "KYC" && text.includes("?")) {
      // Check for specific KYC questions and assign numbers
      if (text.toLowerCase().includes("what is your preferred communication style")) {
        return 2; // This is KYC.02
      }
      if (text.toLowerCase().includes("have you started a business before")) {
        return 3; // This is KYC.03
      }
      if (text.toLowerCase().includes("what's your current work situation")) {
        return 4; // This is KYC.04
      }
      if (text.toLowerCase().includes("do you already have a business idea")) {
        return 5; // This is KYC.05
      }
      if (text.toLowerCase().includes("have you shared any of your previous ideas or concepts with others")) {
        return 6; // This is KYC.06
      }
      if (text.toLowerCase().includes("how comfortable are you with these business skills")) {
        return 7; // This is KYC.07
      }
      if (text.toLowerCase().includes("what kind of business are you trying to build")) {
        return 8; // This is KYC.08
      }
      if (text.toLowerCase().includes("what motivates you to start this business")) {
        return 9; // This is KYC.09
      }
      if (text.toLowerCase().includes("where will your business operate")) {
        return 10; // This is KYC.10
      }
      if (text.toLowerCase().includes("what industry does your business fall into")) {
        return 11; // This is KYC.11
      }
      if (text.toLowerCase().includes("do you have any initial funding available")) {
        return 12; // This is KYC.12
      }
      if (text.toLowerCase().includes("are you planning to seek outside funding in the future")) {
        return 13; // This is KYC.13
      }
      if (text.toLowerCase().includes("how do you plan to generate revenue")) {
        return 14; // This is KYC.14
      }
      if (text.toLowerCase().includes("will your business be primarily:")) {
        return 15; // This is KYC.15
      }
      // Add fallback for questions that might not have tags
      if (progress.phase === "KYC" && text.includes("?") && !text.toLowerCase().includes('welcome to founderport')) {
        // Try to determine question number from context or history
        const historyLength = history.length;
        if (historyLength >= 0 && historyLength < 19) {
          return historyLength + 2; // Start from question 2 (since question 1 is the introduction)
        }
      }
      // Add more specific question patterns as needed
    }
    
    // If no tag found but this is a BUSINESS_PLAN question, try to determine the number from context
    if (progress.phase === "BUSINESS_PLAN" && text.includes("?")) {
      // Check for specific Business Plan questions and assign numbers
      if (text.toLowerCase().includes("what is your business name")) {
        return 1; // This is BP.01
      }
      if (text.toLowerCase().includes("what is your business tagline or mission statement")) {
        return 2; // This is BP.02
      }
      if (text.toLowerCase().includes("what problem does your business solve")) {
        return 3; // This is BP.03
      }
      if (text.toLowerCase().includes("what makes your business unique")) {
        return 4; // This is BP.04
      }
      if (text.toLowerCase().includes("describe your core product or service")) {
        return 5; // This is BP.05
      }
      if (text.toLowerCase().includes("what are the key features and benefits")) {
        return 6; // This is BP.06
      }
      if (text.toLowerCase().includes("what is your product development timeline")) {
        return 7; // This is BP.07
      }
      if (text.toLowerCase().includes("who is your target market")) {
        return 8; // This is BP.08
      }
      if (text.toLowerCase().includes("what is the size of your target market")) {
        return 9; // This is BP.09
      }
      if (text.toLowerCase().includes("who are your main competitors")) {
        return 10; // This is BP.10
      }
      if (text.toLowerCase().includes("how is your target market currently solving this problem")) {
        return 11; // This is BP.11
      }
      if (text.toLowerCase().includes("where will your business be located")) {
        return 12; // This is BP.12
      }
      if (text.toLowerCase().includes("what are your space and facility requirements")) {
        return 13; // This is BP.13
      }
      if (text.toLowerCase().includes("what are your short-term operational needs")) {
        return 14; // This is BP.14
      }
      if (text.toLowerCase().includes("what suppliers or vendors will you need")) {
        return 15; // This is BP.15
      }
      if (text.toLowerCase().includes("what are your staffing needs")) {
        return 16; // This is BP.16
      }
      if (text.toLowerCase().includes("how will you price your product")) {
        return 17; // This is BP.17
      }
      if (text.toLowerCase().includes("what are your projected sales for the first year")) {
        return 18; // This is BP.18
      }
      if (text.toLowerCase().includes("what are your estimated startup costs")) {
        return 19; // This is BP.19
      }
      if (text.toLowerCase().includes("what are your estimated monthly operating expenses")) {
        return 20; // This is BP.20
      }
      if (text.toLowerCase().includes("when do you expect to break even")) {
        return 21; // This is BP.21
      }
      if (text.toLowerCase().includes("how much funding do you need to get started")) {
        return 22; // This is BP.22
      }
      if (text.toLowerCase().includes("what are your financial projections for years 1-3")) {
        return 23; // This is BP.23
      }
      if (text.toLowerCase().includes("how will you track and manage your finances")) {
        return 24; // This is BP.24
      }
      if (text.toLowerCase().includes("how will you reach your target customers")) {
        return 25; // This is BP.25
      }
      if (text.toLowerCase().includes("what is your sales process")) {
        return 26; // This is BP.26
      }
      if (text.toLowerCase().includes("what is your customer acquisition cost")) {
        return 27; // This is BP.27
      }
      if (text.toLowerCase().includes("what is your customer lifetime value")) {
        return 28; // This is BP.28
      }
      if (text.toLowerCase().includes("how will you build brand awareness")) {
        return 29; // This is BP.29
      }
      if (text.toLowerCase().includes("what partnerships or collaborations could help")) {
        return 30; // This is BP.30
      }
      if (text.toLowerCase().includes("what business structure will you use")) {
        return 31; // This is BP.31
      }
      if (text.toLowerCase().includes("what licenses and permits do you need")) {
        return 32; // This is BP.32
      }
      if (text.toLowerCase().includes("what insurance coverage do you need")) {
        return 33; // This is BP.33
      }
      if (text.toLowerCase().includes("how will you protect your intellectual property")) {
        return 34; // This is BP.34
      }
      if (text.toLowerCase().includes("what contracts and agreements will you need")) {
        return 35; // This is BP.35
      }
      if (text.toLowerCase().includes("how will you handle taxes and compliance")) {
        return 36; // This is BP.36
      }
      if (text.toLowerCase().includes("what data privacy and security measures")) {
        return 37; // This is BP.37
      }
      if (text.toLowerCase().includes("what are the key milestones you hope to achieve")) {
        return 38; // This is BP.38
      }
      if (text.toLowerCase().includes("what additional products or services could you offer")) {
        return 39; // This is BP.39
      }
      if (text.toLowerCase().includes("how will you expand to new markets")) {
        return 40; // This is BP.40
      }
      if (text.toLowerCase().includes("what partnerships or strategic alliances could accelerate")) {
        return 41; // This is BP.41
      }
      if (text.toLowerCase().includes("what are the biggest risks and challenges")) {
        return 42; // This is BP.42
      }
      if (text.toLowerCase().includes("what contingency plans do you have")) {
        return 43; // This is BP.43
      }
      if (text.toLowerCase().includes("what is your biggest concern or fear about launching")) {
        return 44; // This is BP.44
      }
      if (text.toLowerCase().includes("what additional considerations or final thoughts")) {
        return 45; // This is BP.45
      }
      // Add fallback for Business Plan questions that might not have tags
      if (progress.phase === "BUSINESS_PLAN" && text.includes("?") && !text.toLowerCase().includes('congratulations')) {
        // Try to determine question number from context or history
        const historyLength = history.length;
        if (historyLength >= 0 && historyLength < 45) {
          return historyLength + 1; // Business Plan starts from question 1
        }
      }
    }
    
    return null;
  };

  // 🎯 ROBUST QUESTION NUMBER CALCULATOR
  // This function provides a reliable fallback for question numbering
  const calculateQuestionNumber = (
    backendQuestionNumber: number | null | undefined,
    currentPhase: string,
    replyText: string
  ): number | null => {
    console.log("🔢 Calculating Question Number:", {
      backendNumber: backendQuestionNumber,
      phase: currentPhase,
      historyLength: history.length,
      trackerState: phaseQuestionTracker
    });

    // 1. PRIORITY: Use backend question_number if available and valid
    if (backendQuestionNumber !== null && backendQuestionNumber !== undefined && backendQuestionNumber > 0) {
      console.log("✅ Using backend question number:", backendQuestionNumber);
      return backendQuestionNumber;
    }

    // 2. Check if this is an introduction or completion message (no question number)
    const isIntroduction = replyText.toLowerCase().includes('welcome to founderport') || 
                          replyText.toLowerCase().includes('congratulations on taking your first step') ||
                          replyText.toLowerCase().includes('phase 1 - know your customer') ||
                          replyText.toLowerCase().includes('phase 2 - business planning') ||
                          replyText.toLowerCase().includes('phase 3 - roadmap') ||
                          replyText.toLowerCase().includes('phase 4: implementation') ||
                          replyText.toLowerCase().includes('are you ready to begin your journey');
    
    // Check if this is a phase completion/transition message
    const isCompletionTransition = (
      (replyText.toLowerCase().includes('congratulations') && 
       replyText.toLowerCase().includes('completed') &&
       replyText.toLowerCase().includes('entrepreneurial profile')) ||
      replyText.toLowerCase().includes("ready to dive into your business planning") ||
      (replyText.toLowerCase().includes('moving into') && replyText.toLowerCase().includes('business planning phase'))
    );
    
    if (isIntroduction || isCompletionTransition) {
      console.log("📢 Introduction/Completion message detected - no question number");
      return null;
    }

    // 3. FALLBACK: Calculate based on phase and history
    // Count questions from history that belong to the current phase
    const phaseQuestions = history.filter(pair => {
      // If we have a question number stored, check if it's reasonable for the phase
      if (pair.questionNumber) {
        return true; // Include all answered questions
      }
      return true;
    });

    // Calculate next question number based on phase
    let calculatedNumber: number;
    
    if (currentPhase === "KYC") {
      // For KYC, questions start from 1
      calculatedNumber = phaseQuestions.length + 1;
    } else if (currentPhase === "BUSINESS_PLAN") {
      // For Business Plan, questions also start from 1 (it's a new phase)
      // More reliable: use phase_answered from progress if available
      if (progress.phase_answered !== undefined) {
        calculatedNumber = progress.phase_answered + 1;
      } else {
        // Fallback: calculate based on total history
        // If we have more than 19 questions total, subtract KYC questions
        if (history.length >= 19) {
          calculatedNumber = history.length - 19 + 1;
        } else {
          calculatedNumber = history.length + 1;
        }
      }
    } else {
      // For other phases, use history length + 1
      calculatedNumber = phaseQuestions.length + 1;
    }

    // 4. VALIDATION: Ensure we don't skip numbers
    if (phaseQuestionTracker.currentPhase === currentPhase && 
        phaseQuestionTracker.lastQuestionNumber !== null) {
      // Ensure we're either on the same question or incrementing by 1
      const expectedNext = phaseQuestionTracker.lastQuestionNumber + 1;
      if (calculatedNumber > expectedNext) {
        console.warn("⚠️ Question number skip detected! Using expected:", expectedNext);
        calculatedNumber = expectedNext;
      }
    }

    // 5. Try pattern matching as last resort (for specific questions)
    const patternNumber = extractQuestionNumber(replyText);
    if (patternNumber !== null) {
      console.log("🔍 Pattern match found:", patternNumber);
      // Use pattern number if it's reasonable (not a huge jump)
      if (Math.abs(patternNumber - calculatedNumber) <= 2) {
        calculatedNumber = patternNumber;
      }
    }

    console.log("✅ Calculated question number:", calculatedNumber);
    return calculatedNumber;
  };

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

    // Remove ALL asterisks (single, double, triple, etc.)
    formatted = formatted.replace(/\*+/g, "");

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
    formatted = formatted.replace(/\s{3,}/g, " ");
    
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

    return formatted.trim();
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

    // Remove ALL asterisks (single, double, triple, etc.)
    formatted = formatted.replace(/\*+/g, "");

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
    formatted = formatted.replace(/\s{3,}/g, " ");
    
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
      // KYC Questions
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
    finalCleanup = finalCleanup.replace(/\s{3,}/g, ' ');
    
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
    finalCleanup = finalCleanup.replace(/\s{3,}/g, ' ');
    
    return finalCleanup.trim();
  };

  // Check if current question is a skills rating question
  const isSkillsRatingQuestion = (text: string): boolean => {
    return text.toLowerCase().includes('how comfortable are you with these business skills');
  };

  // Check if current question has multiple choice options
  const hasMultipleChoiceOptions = (text: string): boolean => {
    const multipleChoiceQuestions = [
      'what is your preferred communication style',
      'what\'s your current work situation',
      'what kind of business are you trying to build',
      'do you have any initial funding available',
      'are you planning to seek outside funding in the future',
      'how do you plan to generate revenue',
      'will your business be primarily:'
    ];
    
    return multipleChoiceQuestions.some(question => 
      text.toLowerCase().includes(question)
    );
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
  const SkillsRatingComponent = () => {
    const [ratings, setRatings] = useState<{[key: string]: number}>({});
    
    const skills = [
      { key: 'business_planning', label: '📋 Business Planning', emoji: '📋' },
      { key: 'financial_modeling', label: '💰 Financial Modeling', emoji: '💰' },
      { key: 'legal_formation', label: '⚖️ Legal Formation', emoji: '⚖️' },
      { key: 'marketing', label: '📢 Marketing', emoji: '📢' },
      { key: 'operations', label: '🚚 Operations/Logistics', emoji: '🚚' },
      { key: 'technology', label: '💻 Technology/Infrastructure', emoji: '💻' },
      { key: 'fundraising', label: '💼 Fundraising/Investor Outreach', emoji: '💼' }
    ];

    const handleRatingChange = (skill: string, rating: number) => {
      setRatings(prev => ({ ...prev, [skill]: rating }));
    };

    const handleSubmit = () => {
      const ratingString = skills.map(skill => ratings[skill.key] || 0).join(', ');
      handleNext(ratingString);
    };

    return (
      <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Rate Your Comfort Level</h3>
          <p className="text-sm text-gray-600 mb-4">
            Rate each skill from 1 to 5 (where 1 = not comfortable, 5 = very comfortable)
          </p>
        </div>
        
        <div className="space-y-4">
          {skills.map((skill) => (
            <div key={skill.key} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-800">{skill.label}</span>
                <span className="text-sm text-gray-500">
                  {ratings[skill.key] ? `${ratings[skill.key]}/5` : 'Not rated'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRatingChange(skill.key, rating)}
                    className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                      ratings[skill.key] === rating
                        ? 'bg-blue-500 border-blue-500 text-white shadow-lg transform scale-110'
                        : 'bg-white border-gray-300 text-gray-400 hover:border-blue-300 hover:text-blue-500'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                {ratings[skill.key] === 1 && 'Not comfortable at all'}
                {ratings[skill.key] === 2 && 'Slightly uncomfortable'}
                {ratings[skill.key] === 3 && 'Somewhat comfortable'}
                {ratings[skill.key] === 4 && 'Quite comfortable'}
                {ratings[skill.key] === 5 && 'Very comfortable'}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={Object.keys(ratings).length < 7}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
          >
            Submit Ratings
          </button>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            💡 Quick tip: You can also type your ratings like "3, 2, 1, 4, 3, 2, 1"
          </p>
        </div>
      </div>
    );
  };

  // Multiple choice component
  const MultipleChoiceComponent = ({ options }: { options: string[] }) => {
    const [selectedOption, setSelectedOption] = useState<string>('');

    const handleOptionSelect = (option: string) => {
      setSelectedOption(option);
      handleNext(option);
    };

    return (
      <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Choose Your Answer</h3>
          <p className="text-sm text-gray-600">Select the option that best describes your situation:</p>
        </div>
        
        <div className="space-y-3">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionSelect(option)}
              className="w-full p-4 text-left bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">{option}</span>
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  {selectedOption === option && (
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            💡 Click on any option to select it
          </p>
        </div>
      </div>
    );
  };

  // Auto-focus input after response is sent
  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading]);

  // Enhanced scroll behavior with smooth animations
  useEffect(() => {
    if (chatContainerRef.current) {
      // Detect different types of messages for appropriate scroll behavior
      const questionLower = currentQuestion.toLowerCase();
      
      // Very specific check - ONLY the absolute first intro message (KYC phase start)
      const isVeryFirstIntro = (
        history.length === 0 && 
        progress.phase === 'KYC' &&
        progress.answered === 0 &&
        questionLower.includes('welcome to founderport') &&
        questionLower.includes("angel's mission is simple")
      );
      
      // Detect any phase transition or intro messages
      const isPhaseTransition = (
        questionLower.includes('phase 2 - business planning') ||
        questionLower.includes('phase 3 - roadmap') ||
        questionLower.includes('phase 4: implementation') ||
        questionLower.includes('moving into') ||
        questionLower.includes('ready to dive into your business planning') ||
        questionLower.includes('business planning phase')
      );
      
      // Business Plan phase started - always scroll to bottom
      const isBusinessPlanPhase = progress.phase === 'BUSINESS_PLAN';
      
      if (isVeryFirstIntro) {
        // Smooth scroll to TOP ONLY for the absolute first welcome message
        chatContainerRef.current.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
        console.log('📜 Smooth scrolled to TOP for very first introduction message');
      } else if (isPhaseTransition || isBusinessPlanPhase) {
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
    }
  }, [history, currentQuestion, progress.phase, progress.answered]);

  // Handle phase transitions with smooth scrolling
  useEffect(() => {
    if (progress.phase && chatContainerRef.current) {
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
    if (!sessionId || hasFetched.current) return;
    hasFetched.current = true;

    async function getInitialQuestion() {
      setLoading(true);
      try {
        const {
          result: { reply, progress, web_search_status, immediate_response, question_number },
        } = await fetchQuestion("", sessionId!);
        console.log("📥 Initial Question API Response:", {
          reply: reply.substring(0, 100) + "...",
          progress: progress,
          sessionId: sessionId,
          web_search_status: web_search_status,
          immediate_response: immediate_response,
          question_number: question_number
        });
        const formatted = formatAngelMessage(reply);
        // Use question_number from backend if available, otherwise calculate reliably
        const questionNumber = calculateQuestionNumber(question_number, progress.phase, reply);
        setCurrentQuestion(formatted);
        setCurrentQuestionNumber(questionNumber);
        updateQuestionTracker(progress.phase, questionNumber);
        setProgress(progress);
        setWebSearchStatus(web_search_status || { is_searching: false, query: undefined, completed: false });
        
        // Show immediate response if available
        if (immediate_response) {
          toast.info(immediate_response, { autoClose: 5000 });
        }
      } catch (error) {
        console.error("Failed to fetch initial question:", error);
        toast.error("Failed to fetch initial question");
      } finally {
        setLoading(false);
      }
    }

    getInitialQuestion();
  }, [sessionId]);

  const handleNext = async (inputOverride?: string) => {
    const input = (inputOverride ?? currentInput).trim();
    if (!input) {
      toast.warning("Please enter your response.");
      return;
    }

    setLoading(true);
    setCurrentInput("");
    setHistory((prev) => [
      ...prev,
      { question: currentQuestion, answer: input, questionNumber: currentQuestionNumber },
    ]);

    try {
      const {
        result: { reply, progress, web_search_status, immediate_response, transition_phase, business_plan_summary, show_accept_modify, question_number },
      } = await fetchQuestion(input, sessionId!);
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
        question_number: question_number
      });
      
      // Handle transition phases
      if (transition_phase === "PLAN_TO_ROADMAP") {
        setTransitionData({
          businessPlanSummary: business_plan_summary || "",
          transitionPhase: transition_phase
        });
        setProgress(progress);
        return;
      }

      // Handle KYC to Business Plan transition
      if (transition_phase === "KYC_TO_BUSINESS_PLAN" || 
          (progress.phase === "BUSINESS_PLAN" && progress.answered === 0)) {
        setKycToBusinessTransition({
          kycSummary: reply || "KYC completed successfully!",
          isActive: true
        });
        setProgress(progress);
        return;
      }
      
      // Handle roadmap generation
      if (transition_phase === "ROADMAP_GENERATED") {
        setRoadmapData({
          roadmapContent: reply,
          isGenerated: true
        });
        setProgress(progress);
        return;
      }
      
      const formatted = formatAngelMessage(reply);
      // Use question_number from backend if available, otherwise calculate reliably
      const nextQuestionNumber = calculateQuestionNumber(question_number, progress.phase, reply);
      setCurrentQuestion(formatted);
      setCurrentQuestionNumber(nextQuestionNumber);
      updateQuestionTracker(progress.phase, nextQuestionNumber);
      setProgress(progress);
      setWebSearchStatus(web_search_status || { is_searching: false, query: undefined, completed: false });
      
      // Use AI-powered detection from backend for showing buttons (if available)
      if (show_accept_modify !== undefined) {
        console.log("🤖 AI Detection says show buttons:", show_accept_modify);
        setShowVerificationButtons(show_accept_modify);
      }
      
      // Show immediate response if available
      if (immediate_response) {
        // toast.info(immediate_response, { 
        //   autoClose: 5000,
        //   position: "top-center",
        //   className: "bg-blue-50 border border-blue-200 text-blue-800"
        // });
      }
    } catch (error) {
      console.error("Failed to fetch question:", error);
      toast.error("Something went wrong.");
      setHistory((prev) => prev.slice(0, -1));
      setCurrentInput(input);
    } finally {
      setLoading(false);
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

  const handleUploadPlan = async (file: File) => {
    try {
      toast.info(`Uploading ${file.name}...`);
      
      const response = await uploadBusinessPlan(sessionId!, file);
      
      if (response.success) {
        toast.success(`${file.name} uploaded successfully!`);
        
        // Add the upload message to chat history
        if (response.chat_message) {
          setHistory(prev => [...prev, {
            question: "",
            answer: response.chat_message!
          }]);
        }
        
        // Refresh the current question to show the upload response
        await fetchQuestion(sessionId!, "");
        
      } else {
        toast.error(response.error || "Upload failed");
      }

    } catch (error) {
      toast.error("Failed to upload file. Please try again.");
      console.error("Upload error:", error);
    }
  };

  const handleApprovePlan = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/angel/sessions/${sessionId}/transition-decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sb_access_token')}`
        },
        body: JSON.stringify({ decision: 'approve' })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Plan approved! Generating roadmap...");
        setTransitionData(null);
        setProgress(data.result.progress);
        
        // Navigate to roadmap phase
        if (data.result.roadmap) {
          setRoadmapData({
            roadmapContent: data.result.roadmap,
            isGenerated: true
          });
          console.log("Roadmap generated:", data.result.roadmap);
        }
      } else {
        toast.error(data.message || "Failed to approve plan");
      }
    } catch (error) {
      console.error("Failed to approve plan:", error);
      toast.error("Something went wrong.");
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
        setProgress(data.result.progress);
        
        // Refresh to get the first business plan question
        await fetchQuestion("", sessionId!);
      } else {
        toast.error(data.message || "Failed to activate review mode");
      }
    } catch (error) {
      console.error("Failed to revisit plan:", error);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPlanSuccess = (businessInfo: any) => {
    toast.success("Business plan uploaded and processed successfully!");
    
    // If we have business info, we could potentially pre-fill some fields
    if (businessInfo && Object.keys(businessInfo).length > 0) {
      console.log("Extracted business info:", businessInfo);
      // The backend should have already applied this to the session
    }
  };

  // Use backend progress data directly to avoid calculation mismatches
  // Use phase-specific answered count for step display
  const currentStep = progress.phase_answered || progress.answered || 1;
  // Use phase-specific totals instead of combined totals for step display
  const total = QUESTION_COUNTS[progress.phase as keyof typeof QUESTION_COUNTS];
  // For progress circle, use overall progress (combined KYC+BP) when available
  const percent = progress.overall_progress?.percent || progress.percent || 1;

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
    return <VentureLoader title="Loading your venture" />;

  // Show KYC to Business Plan transition
  if (kycToBusinessTransition && kycToBusinessTransition.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-blue-600 p-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎉</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">KYC Phase Complete!</h1>
              <p className="text-teal-100 text-lg">Great job completing your entrepreneurial profile</p>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="prose prose-lg max-w-none mb-8">
                <div 
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: formatQuestionText(kycToBusinessTransition.kycSummary).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                  }}
                />
              </div>

              {/* Next Steps */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm mr-3">📋</span>
                  Ready for Business Planning?
                </h3>
                <p className="text-gray-600 mb-4">
                  Now we'll dive deep into every aspect of your business idea. I'll be asking detailed questions about your product, market, finances, and strategy.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-start">
                    <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs mr-2 mt-0.5">✓</span>
                    <span>Mission, vision, and unique selling proposition</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs mr-2 mt-0.5">✓</span>
                    <span>Target audience and competitors</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs mr-2 mt-0.5">✓</span>
                    <span>Revenue model and financial planning</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs mr-2 mt-0.5">✓</span>
                    <span>Marketing and operational strategies</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {/* Continue Button */}
                <button
                  onClick={handleStartBusinessPlanning}
                  disabled={loading}
                  className="group relative bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl">🚀</span>
                    <span>Continue to Business Planning</span>
                    {loading && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>

                {/* Modify Button */}
                <button
                  onClick={() => {
                    setKycToBusinessTransition(null);
                    // Allow user to review and modify their KYC responses
                    toast.info('Review your responses below. You can continue answering or modify any previous answers.');
                  }}
                  disabled={loading}
                  className="group relative bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-2 border-gray-300"
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl">✏️</span>
                    <span>Modify My Responses</span>
                  </div>
                  <div className="absolute inset-0 bg-gray-400/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>

              {/* Quote */}
              <div className="text-center mt-8">
                <p className="text-gray-500 italic text-sm">
                  "The way to get started is to quit talking and begin doing." - Walt Disney
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show transition component if in transition phase
  if (transitionData && transitionData.transitionPhase === "PLAN_TO_ROADMAP") {
    return (
      <PlanToRoadmapTransition
        businessPlanSummary={transitionData.businessPlanSummary}
        onApprove={handleApprovePlan}
        onRevisit={handleRevisitPlan}
        loading={loading}
      />
    );
  }

  // Show roadmap display if roadmap is generated
  if (roadmapData && roadmapData.isGenerated) {
    return (
      <RoadmapDisplay
        roadmapContent={roadmapData.roadmapContent}
        onStartImplementation={handleStartImplementation}
        onEditRoadmap={handleSaveEditedRoadmap}
        loading={loading}
      />
    );
  }

  // Show roadmap to implementation transition
  if (roadmapToImplementationTransition && roadmapToImplementationTransition.isActive) {
    // Create business context from session data
    const businessContext = extractBusinessInfo();

    return (
      <RoadmapToImplementationTransition
        isOpen={true}
        onBeginImplementation={handleActualStartImplementation}
        businessName={businessContext.business_name}
        industry={businessContext.industry}
        location={businessContext.location}
      />
    );
  }

  // Show implementation phase
  if (progress.phase === "IMPLEMENTATION") {
    // Create session data object for implementation
    const businessInfo = extractBusinessInfo();
    const sessionData = {
      sessionId: sessionId!,
      currentPhase: progress.phase,
      business_name: businessInfo.business_name,
      industry: businessInfo.industry,
      location: businessInfo.location,
      business_type: businessInfo.business_type
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
      // TODO: Implement API call to actually navigate to this question
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 text-sm flex flex-col lg:flex-row">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Section */}
        <div className="flex-shrink-0 px-3 py-4 lg:px-3 lg:py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => navigate("/ventures")}
                className="flex items-center gap-1 text-gray-600 hover:text-teal-600 transition-colors text-sm"
              >
                <svg
                  className="w-4 h-4"
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
                <span className="hidden sm:inline">Back to Ventures</span>
                <span className="sm:hidden">Back</span>
              </button>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-blue-500 rounded flex items-center justify-center text-white text-sm">
                  🧭
                </div>
                <div className="hidden sm:block">
                  <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                    <div className="relative">
                      <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-2 h-2 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-ping opacity-60"></div>
                    </div>
                    <span className="text-sm font-semibold text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text">
                      {progress.phase}
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
                      {progress.phase}
                    </span>
                    <span className="text-xs font-medium text-gray-700">
                      {currentStep}/{total}
                    </span>
                  </div>
                </div>
              </div>

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

            <ProgressCircle 
              progress={percent} 
              phase={progress.phase} 
              combined={progress.combined}
              phase_breakdown={progress.phase_breakdown}
            />

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

          <RoadmapModal
            open={roadmapState.showModal}
            onClose={() =>
              setRoadmapState((prev) => ({ ...prev, showModal: false }))
            }
            plan={roadmapState.plan}
            loading={roadmapState.loading}
            error={roadmapState.error}
            onEditRoadmap={handleEditRoadmap}
          />
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
                    <div className="w-6 h-6 bg-gradient-to-r from-teal-500 to-blue-500 rounded flex items-center justify-center text-white text-xs flex-shrink-0">
                      🧭
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 mb-1 text-sm">
                        Angel
                      </div>
                      {(progress.phase === "KYC" || progress.phase === "BUSINESS_PLAN") && pair.questionNumber && (
                        <div className="mb-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Question {pair.questionNumber}
                          </span>
                        </div>
                      )}
                      <div className="text-gray-800 whitespace-pre-wrap text-sm">
                        {progress.phase === "KYC" ? (
                          <div dangerouslySetInnerHTML={{ 
                            __html: formatQuestionText(pair.question).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                          }} />
                ) : (
                  <BusinessQuestionFormatter text={pair.question} />
                )}
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

            {/* Current Question */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="p-3 sm:p-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-blue-50">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-teal-500 to-blue-500 rounded flex items-center justify-center text-white text-xs flex-shrink-0">
                    🧭
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 mb-1 text-sm">
                      Angel
                    </div>
                    {!loading && (progress.phase === "KYC" || progress.phase === "BUSINESS_PLAN") && currentQuestionNumber && (
                      <div className="mb-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Question {currentQuestionNumber}
                        </span>
                      </div>
                    )}
                    <div className="text-gray-800 whitespace-pre-wrap text-sm angel-intro-text">
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-teal-500"></div>
                          <span className="text-teal-600 text-xs">
                            Angel is thinking...
                          </span>
                        </div>
                      ) : (
                        progress.phase === "KYC" ? (
                          <div dangerouslySetInnerHTML={{ 
                            __html: (() => {
                              let html = formatQuestionText(currentQuestion || "Loading...");
                              
                              // Apply aggressive cleanup for Angel introduction text
                              if (html.toLowerCase().includes('welcome to founderport')) {
                                // Clean up excessive spacing
                                html = html.replace(/\n{3,}/g, '\n\n');
                                html = html.replace(/\n\s*\n\s*\n/g, '\n\n');
                                
                                // Fix spacing around journey question
                                html = html.replace(/\n\s*\n\s*Are you ready to begin your journey\?\s*\n\s*\n/g, '\n\nAre you ready to begin your journey?\n\n');
                                html = html.replace(/\n{2,}\s*Are you ready to begin your journey\?\s*\n{2,}/g, '\n\nAre you ready to begin your journey?\n\n');
                                
                                // Fix spacing around questionnaire intro
                                html = html.replace(/\n\s*\n\s*Let's start with the Getting to Know You questionnaire/g, '\n\nLet\'s start with the Getting to Know You questionnaire');
                                
                                // Fix spacing in critiquing feedback messages
                                html = html.replace(/I need more detail from you\. That answer seems quite brief\.\s*\n\s*\n\s*\n\s*\n\s*Could you elaborate more\?/g, 'I need more detail from you. That answer seems quite brief.\n\nCould you elaborate more?');
                                html = html.replace(/What specific aspects are you considering\s*\n\s*\n\s*\n\s*\n\s*\?/g, 'What specific aspects are you considering?');
                                html = html.replace(/What challenges do you anticipate\s*\n\s*\n\s*\n\s*\n\s*\?/g, 'What challenges do you anticipate?');
                              }
                              
                              // Convert to HTML with comprehensive spacing cleanup
                              return html
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\n\n\n+/g, '\n\n') // Reduce 3+ newlines to 2
                                .replace(/\n/g, '<br>')
                                // Comprehensive cleanup of excessive br tags
                                .replace(/<br><br><br><br><br><br>/g, '<br><br>') // Reduce 6 br tags to 2
                                .replace(/<br><br><br><br><br>/g, '<br><br>') // Reduce 5 br tags to 2
                                .replace(/<br><br><br><br>/g, '<br><br>') // Reduce 4 br tags to 2
                                .replace(/<br><br><br>/g, '<br><br>') // Reduce 3 br tags to 2
                                // Specific cleanup for questions
                                .replace(/<br><br><strong>Are you ready to begin your journey\?<\/strong><br><br>/g, '<br><strong>Are you ready to begin your journey?</strong><br>')
                                .replace(/<br><br><strong>What's your name and preferred name or nickname\?<\/strong><br><br>/g, '<br><strong>What\'s your name and preferred name or nickname?</strong>')
                                .replace(/<br><br><br><br><strong>Are you ready to begin your journey\?<\/strong><br><br><br><br>/g, '<br><strong>Are you ready to begin your journey?</strong><br>')
                                // Cleanup for critiquing feedback messages
                                .replace(/I need more detail from you\. That answer seems quite brief\.<br><br><br><br><br>Could you elaborate more\?/g, 'I need more detail from you. That answer seems quite brief.<br><br>Could you elaborate more?')
                                .replace(/What specific aspects are you considering<br><br><br><br><br>\?/g, 'What specific aspects are you considering?')
                                .replace(/What challenges do you anticipate<br><br><br><br><br>\?/g, 'What challenges do you anticipate?')
                                // Final cleanup - reduce any remaining excessive spacing
                                .replace(/<br><br><br>/g, '<br><br>');
                            })()
                          }} />
                ) : (
                  <BusinessQuestionFormatter text={currentQuestion || "Loading..."} />
                )
                      )}
                    </div>
                    
                  </div>
                </div>
              </div>
            </div>
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

            {/* Quick Actions Row - NEVER show during KYC phase */}
            {progress.phase !== "KYC" && (
              <div className="mt-4">
                <div className="text-center mb-3">
                  <p className="text-gray-500 text-sm font-medium">🚀 Quick Actions</p>
                  <p className="text-gray-400 text-xs">Choose a tool to help with your response</p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Support Button */}
                  <button
                    onClick={() => handleNext("Support")}
                    disabled={loading}
                    className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 hover:border-blue-300 rounded-xl p-4 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-lg group-hover:scale-110 transition-transform duration-300">
                        💬
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-blue-800 group-hover:text-blue-900">Support</div>
                        <div className="text-xs text-blue-600 group-hover:text-blue-700">Get guided help</div>
                      </div>
                </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>

                  {/* Upload Plan Button - Only show in Business Planning phase, NEVER in KYC */}
                  {progress.phase === "BUSINESS_PLAN" && (
                    <button
                      onClick={() => setUploadPlanModal({ isOpen: true })}
                      disabled={loading}
                      className="group relative bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-200 hover:border-purple-300 rounded-xl p-4 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-lg group-hover:scale-110 transition-transform duration-300">
                          📄
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-purple-800 group-hover:text-purple-900">Upload Plan</div>
                          <div className="text-xs text-purple-600 group-hover:text-purple-700">Use existing plan</div>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  )}

                  {/* Draft Button */}
                <button
                    onClick={() => handleNext("Draft")}
                    disabled={loading}
                    className="group relative bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 border border-emerald-200 hover:border-emerald-300 rounded-xl p-4 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white text-lg group-hover:scale-110 transition-transform duration-300">
                        ✍️
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-emerald-800 group-hover:text-emerald-900">Draft</div>
                        <div className="text-xs text-emerald-600 group-hover:text-emerald-700">Generate content</div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>

                  {/* Scrapping Button */}
                  <button
                    onClick={() => handleNext(currentInput.trim() ? `Scrapping: ${currentInput}` : "Scrapping")}
                    disabled={loading}
                    className="group relative bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border border-orange-200 hover:border-orange-300 rounded-xl p-4 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white text-lg group-hover:scale-110 transition-transform duration-300">
                        🔧
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-orange-800 group-hover:text-orange-900">Scrapping</div>
                        <div className="text-xs text-orange-600 group-hover:text-orange-700">Polish existing text</div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>

                  {/* Kickstart Button */}
                  <button
                    onClick={() => handleNext("Kickstart")}
                    disabled={loading}
                    className="group relative bg-gradient-to-br from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 border border-purple-200 hover:border-purple-300 rounded-xl p-4 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center text-white text-lg group-hover:scale-110 transition-transform duration-300">
                        🚀
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-purple-800 group-hover:text-purple-900">Kickstart</div>
                        <div className="text-xs text-purple-600 group-hover:text-purple-700">Get templates</div>
                      </div>
              </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>

                  {/* Who do I contact? Button */}
                      <button
                    onClick={() => handleNext("Who do I contact?")}
                        disabled={loading}
                    className="group relative bg-gradient-to-br from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 border border-teal-200 hover:border-teal-300 rounded-xl p-4 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white text-lg group-hover:scale-110 transition-transform duration-300">
                        👥
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-teal-800 group-hover:text-teal-900">Contact</div>
                        <div className="text-xs text-teal-600 group-hover:text-teal-700">Find experts</div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </button>
                  </div>

                <div className="mt-3 text-center">
                  <p className="text-gray-400 text-xs">
                    💡 Or type your detailed response below
                  </p>
                </div>
                </div>
              )}

              {progress.phase === "KYC" && (
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
          currentProgress={progress}
          onEditPlan={handleEditPlan}
          onUploadPlan={handleUploadPlan}
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
                <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-blue-500 rounded flex items-center justify-center text-white text-sm">
                  🧭
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
                  <div className="text-lg font-bold text-gray-900">{progress.phase}</div>
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
        onClose={() => setUploadPlanModal({ isOpen: false })}
        onUploadSuccess={handleUploadPlanSuccess}
        sessionId={sessionId}
      />
    </div>
  );
}
