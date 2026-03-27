import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';

interface QuestionFormatterProps {
  text: string;
  phase?: 'GKY' | 'BUSINESS_PLAN' | 'PLAN_TO_ROADMAP_TRANSITION' | 'PLAN_TO_SUMMARY_TRANSITION' | 'PLAN_TO_BUDGET_TRANSITION' | 'ROADMAP' | 'ROADMAP_GENERATED' | 'ROADMAP_TO_IMPLEMENTATION_TRANSITION' | 'IMPLEMENTATION';
}

/**
 * Parses a business plan question into its component parts for specialized UI rendering.
 */
export function parseBusinessPlanQuestionParts(inputText: string): {
  mainQuestion: string;
  helperLines: string[];
  thoughtStarters: string[];
} {
  const rawLines = (inputText || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const thoughtStarterRegex = /^(🧠|💡|📌|📋|🚀|🧩|🌍)?\s*(Thought Starter|Quick Tip|Educational Insight|Goal|Thought|Tip|Pro Tip|Pro-tip|Example|Consider|Reminder|Note|Watch out)\s*:/iu;

  const thoughtStarters: string[] = [];
  const nonThoughtLines: string[] = [];

  rawLines.forEach((line) => {
    if (thoughtStarterRegex.test(line)) {
      thoughtStarters.push(line);
      return;
    }
    nonThoughtLines.push(line);
  });

  // Find the primary question line
  const mainQuestionIndex = nonThoughtLines.findIndex((line) => {
    if (!line) return false;
    if (line.endsWith(':')) return false;
    if (line.endsWith('?')) return true;
    return /^(What|How|Why|When|Where|Who|Which|Do|Does|Did|Is|Are|Can|Could|Would|Should|Describe|Explain|Tell|List)\b/i.test(line);
  });

  const fallbackIndex = nonThoughtLines.findIndex((line) => line && !line.endsWith(':'));
  const resolvedIndex = mainQuestionIndex >= 0 ? mainQuestionIndex : (fallbackIndex >= 0 ? fallbackIndex : 0);
  
  const mainQuestion = resolvedIndex >= 0 ? nonThoughtLines[resolvedIndex] : '';
  const helperLines = nonThoughtLines
    .filter((_, idx) => idx !== resolvedIndex);

  return { mainQuestion, helperLines, thoughtStarters };
}

const QuestionFormatter: React.FC<QuestionFormatterProps> = ({ text, phase }) => {
  if (!text || typeof text !== 'string') {
    return <div>{String(text || '')}</div>;
  }

  const processedText = useMemo(() => {
    let next = text;
    // Remove metadata tags and internal numbering
    next = next.replace(/\[\[Q:[A-Z_]+\.\d{2}]]\s*/g, "");
    next = next.replace(/Question\s+\d+(?:\s+of\s+\d+)?/gi, '').trim();
    // Fix broken question formatting where ? is on a new line
    next = next.replace(/([A-Za-z0-9,;:)])\s*\n+\s*\?/g, '$1?');
    return next;
  }, [text]);

  const isDraftOrCommandResponse = useMemo(() => {
    const commandPrefixes = [
      /^Here's a (research-backed )?draft/i,
      /^Here's a draft based on/i,
      /^Let's work through this together/i,
      /^Here's a refined version/i,
      /^I'll create additional content/i,
      /^Verification:/i,
      /^Here's what I've captured so far/i,
    ];
    const isCommandPrefix = commandPrefixes.some(regex => regex.test(processedText.trim()));
    const hasAutoResearch = /🔍\s*\*\*.*(?:Research|Suggested|Estimated).*\*\*/i.test(processedText);
    return isCommandPrefix || hasAutoResearch;
  }, [processedText]);

  const isSectionSummary = useMemo(() => {
    const trimmed = processedText.trim();
    return (
      /Section Complete/i.test(trimmed) ||
      /Summary of Your Information/i.test(trimmed) ||
      (/Ready to Continue\??/i.test(trimmed) && /Educational Insights|Critical Considerations/i.test(trimmed))
    );
  }, [processedText]);

  const businessPlanParts = useMemo(() => {
    if (phase !== 'BUSINESS_PLAN' || isDraftOrCommandResponse || isSectionSummary) return null;
    return parseBusinessPlanQuestionParts(processedText);
  }, [phase, processedText, isDraftOrCommandResponse, isSectionSummary]);

  // Shared ReactMarkdown components for consistent styling
  const markdownComponents = {
    strong: ({ children }: any) => (
      <strong className="font-bold text-gray-900" style={{ fontWeight: 700 }}>
        {children}
      </strong>
    ),
    p: ({ children }: any) => (
      <p className="mb-2 last:mb-0 leading-relaxed text-gray-800">{children}</p>
    ),
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside mb-3 text-gray-700 space-y-1">{children}</ul>
    ),
    li: ({ children }: any) => (
      <li className="text-gray-700 leading-relaxed mb-1">{children}</li>
    ),
  };

  // Render Section Summary
  if (isSectionSummary) {
    const cleanedSummary = processedText
      .replace(/\[\[ACCEPT_MODIFY_BUTTONS\]\]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return (
      <div className="question-formatter section-summary">
        <ReactMarkdown components={markdownComponents}>
          {cleanedSummary}
        </ReactMarkdown>
      </div>
    );
  }

  // Render Specialized Business Plan Question
  if (businessPlanParts) {
    return (
      <div className="question-formatter business-plan-question space-y-3">
        {businessPlanParts.mainQuestion && (
          <div className="text-gray-900 text-lg leading-relaxed mb-1">
            <ReactMarkdown
              components={{
                ...markdownComponents,
                p: ({ children }) => <p className="mb-0 inline">{children}</p>,
                strong: ({ children }) => <strong className="font-extrabold text-black" style={{ fontWeight: 800 }}>{children}</strong>
              }}
            >
              {businessPlanParts.mainQuestion}
            </ReactMarkdown>
          </div>
        )}

        {businessPlanParts.helperLines.length > 0 && (
          <div className="text-sm leading-relaxed text-gray-500 italic">
            <ReactMarkdown components={markdownComponents}>
              {businessPlanParts.helperLines.join('\n\n')}
            </ReactMarkdown>
          </div>
        )}

        {businessPlanParts.thoughtStarters.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl shadow-sm">
            <div className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
              <span className="text-lg">🧠</span>
              <span>Thought Starter</span>
            </div>
            <div className="text-sm text-gray-700 space-y-2">
              {businessPlanParts.thoughtStarters.map((starter, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <ReactMarkdown components={markdownComponents}>
                    {starter.replace(/^(🧠|💡|📌|📋|🚀|🧩|🌍)?\s*(Thought Starter|Quick Tip|Educational Insight|Goal|Thought|Tip|Pro Tip|Pro-tip|Example|Consider|Reminder|Note|Watch out)\s*:\s*/iu, '')}
                  </ReactMarkdown>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback: Default Markdown Rendering
  return (
    <div className="question-formatter default-render">
      <ReactMarkdown components={markdownComponents}>
        {processedText}
      </ReactMarkdown>
    </div>
  );
};

export default QuestionFormatter;
