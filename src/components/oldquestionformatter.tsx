import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';

interface QuestionFormatterProps {
  text: string;
  phase?: 'GKY' | 'BUSINESS_PLAN' | 'PLAN_TO_ROADMAP_TRANSITION' | 'PLAN_TO_SUMMARY_TRANSITION' | 'PLAN_TO_BUDGET_TRANSITION' | 'ROADMAP' | 'ROADMAP_GENERATED' | 'ROADMAP_TO_IMPLEMENTATION_TRANSITION' | 'IMPLEMENTATION';
}

export function parseBusinessPlanQuestionParts(inputText: string): {
  mainQuestion: string;
  helperLines: string[];
  thoughtStarters: string[];
} {
  const stripOuterMarkdownBold = (line: string): string => {
    // The business-plan question renderer displays mainQuestion as plain text,
    // so normalize wrapped markdown bold to avoid showing literal ** markers.
    return line.replace(/^\*\*(.+?)\*\*$/u, '$1').trim();
  };

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

  const mainQuestionIndex = nonThoughtLines.findIndex((line) => {
    if (!line) return false;
    if (line.endsWith(':')) return false;
    if (line.endsWith('?')) return true;
    return /^(What|How|Why|When|Where|Who|Which|Do|Does|Did|Is|Are|Can|Could|Would|Should|Describe|Explain|Tell|List)\b/i.test(line);
  });

  const fallbackIndex = nonThoughtLines.findIndex((line) => line && !line.endsWith(':'));
  const resolvedIndex = mainQuestionIndex >= 0 ? mainQuestionIndex : (fallbackIndex >= 0 ? fallbackIndex : 0);
  const mainQuestion = resolvedIndex >= 0
    ? stripOuterMarkdownBold(nonThoughtLines[resolvedIndex] ?? '')
    : '';
  const helperLines = nonThoughtLines
    .filter((_, idx) => idx !== resolvedIndex)
    .filter((line) => !line.endsWith('?'));

  return { mainQuestion, helperLines, thoughtStarters };
}

const QuestionFormatter: React.FC<QuestionFormatterProps> = ({ text, phase }) => {
  if (!text || typeof text !== 'string') {
    return <div>{String(text || '')}</div>;
  }

  const processedText = useMemo(() => {
    let next = text;
    next = next.replace(/\[\[Q:[A-Z_]+\.\d{2}]]\s*/g, "");
    next = next.replace(/Question\s+\d+(?:\s+of\s+\d+)?/gi, '').trim();
    next = next.replace(/([A-Za-z0-9,;:)])\s*\n+\s*\?/g, '$1?');
    return next;
  }, [text]);

  // Detect draft/command/auto-research responses that should NOT be parsed/reordered
  // These are responses to Draft/Support/Scrapping commands or auto-research questions
  // that have their own structure and should be rendered as-is to preserve order
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
    
    // Also detect auto-research responses (contain 🔍 research result sections)
    const hasAutoResearch = /🔍\s*\*\*.*(?:Research|Suggested|Estimated).*\*\*/i.test(processedText);
    
    return isCommandPrefix || hasAutoResearch;
  }, [processedText]);

  // Detect section summary responses (e.g. "🎯 **Product/Service Details Section Complete**")
  // These must be rendered via ReactMarkdown, NOT the business-plan question parser
  const isSectionSummary = useMemo(() => {
    const trimmed = processedText.trim();
    return (
      /Section Complete/i.test(trimmed) ||
      /Summary of Your Information/i.test(trimmed) ||
      /Ready to Continue\??/i.test(trimmed) && /Educational Insights|Critical Considerations/i.test(trimmed)
    );
  }, [processedText]);

  const businessPlanParts = useMemo(() => {
    if (phase !== 'BUSINESS_PLAN') return null;
    // Skip parsing for draft/command responses - they have their own structure
    // and should be rendered as-is to preserve the original order
    if (isDraftOrCommandResponse) return null;
    // Skip parsing for section summaries - they need full ReactMarkdown rendering
    if (isSectionSummary) return null;

    return parseBusinessPlanQuestionParts(processedText);
  }, [phase, processedText, isDraftOrCommandResponse, isSectionSummary]);

  // Section summary: render via ReactMarkdown with clean styling (no destructive stripping)
  if (isSectionSummary) {
    // Light cleanup: remove [[ACCEPT_MODIFY_BUTTONS]] tag if it leaked through
    const cleanedSummary = processedText
      .replace(/\[\[ACCEPT_MODIFY_BUTTONS\]\]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return (
      <div className="question-formatter section-summary">
        <ReactMarkdown
          components={{
            strong: ({ children }) => (
              <strong className="font-bold text-gray-900" style={{ fontWeight: 700 }}>
                {children}
              </strong>
            ),
            p: ({ children }) => (
              <p className="mb-2 leading-relaxed text-gray-800">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-2 text-gray-700 space-y-1">{children}</ul>
            ),
            li: ({ children }) => (
              <li className="text-gray-700 leading-relaxed">{children}</li>
            ),
          }}
        >
          {cleanedSummary}
        </ReactMarkdown>
      </div>
    );
  }

  if (businessPlanParts) {
    return (
      <div className="question-formatter">
        {businessPlanParts.mainQuestion ? (
          <div className="font-bold text-gray-900 text-base leading-relaxed">
            {businessPlanParts.mainQuestion}
          </div>
        ) : null}

        {businessPlanParts.helperLines.length ? (
          <div className="mt-2 text-sm leading-relaxed text-gray-700">
            <ReactMarkdown>
              {businessPlanParts.helperLines.join('\n\n')}
            </ReactMarkdown>
          </div>
        ) : null}

        {businessPlanParts.thoughtStarters.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <span>🧠</span>
              <span>Thought Starter</span>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              {businessPlanParts.thoughtStarters.map((starter, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{starter.replace(/^(🧠|💡|📌|📋|🚀|🧩|🌍)?\s*(Thought Starter|Quick Tip|Educational Insight|Goal|Thought|Tip|Pro Tip|Pro-tip|Example|Consider|Reminder|Note|Watch out)\s*:\s*/iu, '')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  let mutableText = processedText;

  // Step 4: ROOT CAUSE FIX - Handle heading+question patterns
  // Process line by line to handle both same-line and multi-line cases
  
  const lines = mutableText.split('\n');
  const processedLines: string[] = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Check if line contains heading+question on same line
    const sameLineMatch = line.match(/(🧠|💡|📌|📋|🚀|🧩|🌍)?\s*(Thought Starter|Quick Tip|Educational Insight|Goal|Thought|Tip):\s+([A-Z][^?\n]{15,}?\?)/iu);
    
    if (sameLineMatch) {
      const emoji = sameLineMatch[1] || '';
      const heading = sameLineMatch[2];
      const question = sameLineMatch[3].trim();
      
      // Validate question
      if (question && 
          question.endsWith('?') && 
          question.length >= 15 &&
          question.toLowerCase() !== heading.toLowerCase() &&
          !question.toLowerCase().startsWith('thought starter') &&
          !question.toLowerCase().startsWith('quick tip')) {
        processedLines.push(`${emoji} ${heading}: **${question}**`);
        i++;
        continue;
      }
    }
    
    // Check if line is JUST a heading (ends with colon)
    const headingOnlyMatch = line.match(/^(🧠|💡|📌|📋|🚀|🧩|🌍)?\s*(Thought Starter|Quick Tip|Educational Insight|Goal|Thought|Tip):\s*$/iu);
    
    if (headingOnlyMatch) {
      // Look for question on next line(s)
      let questionFound = false;
      let questionText = '';
      let linesToSkip = 0;
      
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine && 
            /^[A-Z]/.test(nextLine) && 
            nextLine.endsWith('?') &&
            nextLine.length >= 15 &&
            !nextLine.toLowerCase().includes('thought starter') &&
            !nextLine.toLowerCase().includes('quick tip')) {
          questionText = nextLine;
          linesToSkip = j - i;
          questionFound = true;
          break;
        }
      }
      
      if (questionFound && questionText) {
        const emoji = headingOnlyMatch[1] || '';
        const heading = headingOnlyMatch[2];
        processedLines.push(`${emoji} ${heading}: **${questionText}**`);
        i += linesToSkip + 1;
        continue;
      }
    }
    
    // Regular line
    processedLines.push(line);
    i++;
  }
  
  mutableText = processedLines.join('\n');

  // Step 5: Normalize whitespace
  mutableText = mutableText.replace(/\n{3,}/g, '\n\n');
  mutableText = mutableText.replace(/\r\n/g, '\n');

  // Step 6: Bold all remaining questions (not already in heading+question patterns)
  mutableText = mutableText.replace(/\*\*([^*]+\?)\*\*/g, '$1');
  mutableText = mutableText.replace(/([A-Z][A-Za-z0-9\s,'"()-]{10,}?\?)/g, (match, question) => {
    if (question.includes('**')) return match;
    // Skip if already part of heading+question pattern
    const beforeText = mutableText.substring(0, mutableText.indexOf(match));
    const lineWithMatch = (beforeText + match).split('\n').pop() || '';
    if (/(🧠|💡|📌|📋|🚀|🧩|🌍)?\s*(Thought Starter|Quick Tip|Educational Insight|Goal|Thought|Tip):/u.test(lineWithMatch)) {
      return match; // Already processed
    }
    return `**${question}**`;
  });

  // Step 7: Clean up formatting
  mutableText = mutableText.replace(/(?<!\*)\*(?!\*)/g, '');
  mutableText = mutableText.replace(/#+/g, '');
  mutableText = mutableText.replace(/^[-–—•]+\s*/gm, '');

  // Step 8: Add spacing for regular questions
  mutableText = mutableText.replace(/([^:\-–—\n🧠💡📌📋🚀🧩🌍])\s*(\*\*[^*]+\?\*\*)/gu, '$1\n\n$2');
  mutableText = mutableText.replace(/(\*\*[^*]+\?\*\*)([^\n])/g, '$1\n\n$2');
  
  // Step 9: Ensure proper spacing around heading+question patterns
  mutableText = mutableText.replace(
    /([^\n])\s*((🧠|💡|📌|📋|🚀|🧩|🌍)\s*(Thought Starter|Quick Tip|Educational Insight|Goal|Thought|Tip):\s*\*\*[^*]+\?\*\*)/gu,
    '$1\n\n$2'
  );
  
  mutableText = mutableText.replace(
    /((🧠|💡|📌|📋|🚀|🧩|🌍)\s*(Thought Starter|Quick Tip|Educational Insight|Goal|Thought|Tip):)\s*\n+\s*(\*\*[^*]+\?\*\*)/gu,
    '$1 $3'
  );
  
  mutableText = mutableText.replace(
    /((🧠|💡|📌|📋|🚀|🧩|🌍)\s*(Thought Starter|Quick Tip|Educational Insight|Goal|Thought|Tip):\s*\*\*[^*]+\?\*\*)\s*\n\n/gu,
    '$1\n'
  );

  mutableText = mutableText.replace(/\n{3,}/g, '\n\n');

  return (
    <div className="question-formatter">
      <ReactMarkdown
        components={{
          strong: ({ children }) => {
            const text = String(children);
            if (text.includes('?')) {
              return <strong className="font-bold text-gray-900" style={{ fontWeight: 700 }}>{children}</strong>;
            }
            return <strong className="font-semibold text-gray-800" style={{ fontWeight: 600 }}>{children}</strong>;
          },
          p: ({ children }) => {
            const text = String(children);
            if (text.match(/(🧠|💡|📌|📋|🚀|🧩|🌍).*(Thought Starter|Quick Tip|Educational Insight|Goal|Thought|Tip):.*\*\*.*\?\*\*/u)) {
              return (
                <p className="mb-2 leading-relaxed text-gray-800" style={{ display: 'block', whiteSpace: 'normal' }}>
                  {children}
                </p>
              );
            }
            return <p className="mb-2 leading-relaxed text-gray-800">{children}</p>;
          },
        }}
      >
        {mutableText}
      </ReactMarkdown>
    </div>
  );
};

export default QuestionFormatter;