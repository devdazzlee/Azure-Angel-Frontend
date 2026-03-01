import React, { useState, useRef, useEffect } from 'react';
import SkillRatingForm from './SkillRatingForm';
import QuestionDropdown from './QuestionDropdown';
import FounderportFavicon from '../assets/images/home/Founderport_Favicon_Mariner.svg';

interface SmartInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  currentQuestion?: string;
  currentPhase?: string;
}

// Stable lookup of known choice questions.  Keyed by a substring that must
// appear in the *question line itself* (not the coaching preamble).  Matching
// is case-insensitive.
const KNOWN_CHOICE_QUESTIONS: Record<string, string[]> = {
  'have you started a business before': ['Yes', 'No'],
  'what is your preferred communication style': ['Conversational', 'Structured'],
  "what's your current work situation": ['Full-time employed', 'Part-time', 'Student', 'Unemployed', 'Self-employed/freelancer', 'Other'],
  'do you already have a business idea in mind': ['Yes', 'No'],
  'have you shared your business idea with anyone yet': ['Yes', 'No'],
  'what kind of business are you trying to build': ['Side hustle', 'Small business', 'Scalable startup', 'Nonprofit/social venture', 'Other'],
  'do you have any initial funding available': ['None', 'Personal savings', 'Friends/family', 'External funding (loan, investor)', 'Other'],
  'are you planning to seek outside funding in the future': ['Yes', 'No', 'Unsure'],
  'would you like angel to:': ['Be more hands-on (do more tasks for you)', 'Be more of a mentor (guide but let you take the lead)', 'Alternate based on the task'],
  'would you like angel to provide detailed financial planning': ['Yes', 'No'],
  'do you want to connect with service providers': ['Yes', 'No', 'Later'],
  'how do you plan to generate revenue': ['Product sales', 'Service fees', 'Subscription/membership', 'Advertising revenue', 'Commission/fees', 'Licensing', 'Consulting', 'Other'],
  'will your business be primarily': ['Online only', 'Physical location only', 'Both online and physical', 'Unsure'],
  'would you like me to be proactive in suggesting next steps': ['Yes, please be proactive', 'Only when I ask', 'Let me decide each time'],
  "what's your biggest concern about starting a business": ['Finding customers', 'Managing finances', 'Competition', 'Legal requirements', 'Time management', 'Not sure'],
  'what is your greatest concern about starting a business': ['Finding customers', 'Managing finances', 'Competition', 'Legal requirements', 'Time management', 'Not sure'],
  'how do you prefer to learn new business skills': ['Reading articles/books', 'Watching videos/tutorials', 'Hands-on practice', 'Working with mentors', 'Taking courses', 'Other'],
  'what motivates you most about entrepreneurship': ['Financial independence', 'Creative freedom', 'Making an impact', 'Solving problems', 'Building something lasting', 'Other'],
  'how would you describe your risk tolerance': ['Very conservative (prefer safe, proven approaches)', 'Moderate (willing to take calculated risks)', 'High (comfortable with uncertainty and big bets)', 'It depends on the situation'],
  "what's your timeline for launching your business": ['Within 3 months', '3-6 months', '6-12 months', '1-2 years', 'No specific timeline'],
};

/**
 * Extract the "question line" from Angel's response text.
 * We only want to pattern-match against the actual question, not the
 * educational coaching that precedes it.  The question line is typically
 * the last sentence ending with "?" or the last non-empty paragraph.
 */
function isolateQuestionLine(text: string): string {
  const paragraphs = text.split(/\n{2,}/);
  for (let i = paragraphs.length - 1; i >= 0; i--) {
    const p = paragraphs[i].trim();
    if (p.length > 0) {
      const sentences = p.split(/(?<=[.?!])\s+/);
      const questionSentence = sentences.find(s => s.trim().endsWith('?'));
      if (questionSentence) return questionSentence.trim();
      return p;
    }
  }
  return text;
}

const SmartInput: React.FC<SmartInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Type your response...",
  disabled = false,
  loading = false,
  currentQuestion = "",
  currentPhase = "GKY"
}) => {
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState<string[]>([]);
  const [dropdownKey, setDropdownKey] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Increment key every time the question changes so QuestionDropdown
    // remounts with fresh (empty) selection state.
    setDropdownKey(k => k + 1);

    const questionLine = isolateQuestionLine(currentQuestion).toLowerCase();

    const isCompletionMessage =
      questionLine.includes('congratulations') &&
      (questionLine.includes('completed') || questionLine.includes('profile'));

    if (isCompletionMessage) {
      setShowRatingForm(false);
      setShowDropdown(false);
      return;
    }

    if (currentPhase === 'BUSINESS_PLAN') {
      setShowRatingForm(false);
      setShowDropdown(false);
      return;
    }

    if (questionLine.includes('how comfortable are you with these business skills')) {
      setShowRatingForm(true);
      setShowDropdown(false);
      return;
    }

    // Match against the known-choice lookup using the isolated question line.
    for (const [pattern, options] of Object.entries(KNOWN_CHOICE_QUESTIONS)) {
      if (questionLine.includes(pattern)) {
        setShowDropdown(true);
        setDropdownOptions(options);
        setShowRatingForm(false);
        return;
      }
    }

    // Fallback: extract structured bullet-point options only when the
    // question text itself contains bullet markers (•, ○).
    // We intentionally do NOT match plain hyphens or "yes"/"no" in
    // free-form coaching text — those cause false positives.
    if (currentQuestion.includes('•') || currentQuestion.includes('○')) {
      const options = extractBulletOptions(currentQuestion);
      if (options.length >= 2) {
        setShowDropdown(true);
        setDropdownOptions(options);
        setShowRatingForm(false);
        return;
      }
    }

    setShowRatingForm(false);
    setShowDropdown(false);
  }, [currentQuestion, currentPhase]);

  const extractBulletOptions = (question: string): string[] => {
    const options: string[] = [];
    for (const line of question.split('\n')) {
      const trimmed = line.trim();
      const match = trimmed.match(/^[•○]\s+(.+)/);
      if (match) {
        const opt = match[1].trim();
        if (opt && !opt.includes('?') && opt.length > 1 && opt.length < 100) {
          options.push(opt);
        }
      }
    }
    return options;
  };

  const handleRatingSubmit = (ratings: number[]) => {
    const ratingString = ratings.join(', ');
    onChange(ratingString);
    onSubmit(ratingString);
    setShowRatingForm(false);
  };

  const handleRatingCancel = () => {
    setShowRatingForm(false);
  };

  const handleDropdownSubmit = (selectedValue: string) => {
    onChange(selectedValue);
    onSubmit(selectedValue);
  };

  const handleDropdownCancel = () => {
    setShowDropdown(false);
    setDropdownOptions([]);
    onChange('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(value);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    onChange(target.value);
    
    // Auto-resize textarea
    target.style.height = "auto";
    target.style.height = Math.min(target.scrollHeight, 120) + "px";
  };

  if (showRatingForm) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-3">
        <SkillRatingForm
          onSubmit={handleRatingSubmit}
          onCancel={handleRatingCancel}
        />
      </div>
    );
  }

  if (showDropdown && dropdownOptions.length > 0) {
    return (
      <div className="w-full">
        <QuestionDropdown
          key={dropdownKey}
          options={dropdownOptions}
          onSubmit={handleDropdownSubmit}
          onCancel={handleDropdownCancel}
          placeholder="Select an option..."
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-300 rounded-full flex items-center justify-center text-xs flex-shrink-0 overflow-hidden">
          <img 
            src={FounderportFavicon} 
            alt="User" 
            className="w-[120%] h-[120%] object-contain"
          />
        </div>
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            className="w-full rounded-lg p-2 sm:p-2.5 resize-none text-sm bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all duration-200 placeholder-gray-500"
            rows={1}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            style={{ minHeight: "38px", maxHeight: "120px" }}
          />
        </div>
        <button
          type="button"
          className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white p-2 sm:p-2.5 rounded-lg font-medium text-sm disabled:opacity-50 shadow-md transition-all duration-200 flex-shrink-0"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSubmit(value);
          }}
          disabled={loading || !value.trim()}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default SmartInput;
