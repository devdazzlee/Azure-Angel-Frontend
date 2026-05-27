import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  isAutoResearchContent,
  isSectionSummaryContent,
  normalizeAngelMarkdown,
  normalizeSectionSummaryMarkdown,
} from '../utils/angelMessageKind';

/** Shared ReactMarkdown mapping — avoids empty <p> margins and list spacing blowups */
const angelMarkdownComponents = {
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mt-3 mb-1.5 first:mt-0 text-sm font-bold text-gray-900">{children}</h3>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-gray-900">{children}</strong>
  ),
  p: ({ children }: { children?: React.ReactNode }) => {
    const flat = React.Children.toArray(children).join('').trim();
    if (!flat) return null;
    return <p className="mb-2 last:mb-0 leading-relaxed text-gray-800">{children}</p>;
  },
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 text-gray-700">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 text-gray-700">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed [&>p]:mb-0 [&>p]:inline">{children}</li>
  ),
};

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
    // Split merged hint labels into separate logical lines.
    .replace(/\s+(🧠\s*Thought Starter\s*:)/gi, '\n$1')
    .replace(/\s+(💡\s*(?:Quick Tip|Pro Tip|Tip)\s*:)/gi, '\n$1')
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

    // RESILIENCE FIX: Handle bolding across paragraphs/newlines (broken markdown from AI)
    // Ensures that **Text\n\nMore** becomes **Text**\n\n**More** so it renders correctly.
    next = next.replace(/\*\*([^*]+?)\*\*/gs, (match, inner) => {
      if (inner.includes('\n\n')) {
        return inner
          .split('\n\n')
          .filter(part => part.trim())
          .map(part => `**${part.trim()}**`)
          .join('\n\n');
      }
      return match;
    });

    // Enforce newline before guidance labels in model output.
    next = normalizeAngelMarkdown(next);

    return next;
  }, [text]);

  // Detect draft/command/auto-research responses that should NOT be parsed/reordered
  const hasAutoResearch = useMemo(
    () => isAutoResearchContent(processedText),
    [processedText],
  );

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
    return isCommandPrefix || hasAutoResearch;
  }, [processedText, hasAutoResearch]);

  const normalizedMarkdown = useMemo(
    () => normalizeAngelMarkdown(processedText),
    [processedText],
  );

  const isSectionSummary = useMemo(
    () => isSectionSummaryContent(processedText),
    [processedText],
  );

  const sectionSummaryMarkdown = useMemo(
    () => (isSectionSummary ? normalizeSectionSummaryMarkdown(processedText) : ''),
    [isSectionSummary, processedText],
  );

  const businessPlanParts = useMemo(() => {
    if (phase !== 'BUSINESS_PLAN') return null;
    if (isDraftOrCommandResponse) return null;
    if (isSectionSummary) return null;
    return parseBusinessPlanQuestionParts(processedText);
  }, [phase, processedText, isDraftOrCommandResponse, isSectionSummary]);

  // Section summary — ReactMarkdown with normalized spacing
  if (isSectionSummary) {
    return (
      <div className="question-formatter section-summary whitespace-normal text-sm leading-relaxed">
        <ReactMarkdown components={angelMarkdownComponents}>
          {sectionSummaryMarkdown}
        </ReactMarkdown>
      </div>
    );
  }

  // Auto-research (Q11 competitors, Q12 trends, etc.) — full body via ReactMarkdown
  if (hasAutoResearch) {
    return (
      <div className="question-formatter auto-research whitespace-normal text-sm leading-relaxed">
        <ReactMarkdown components={angelMarkdownComponents}>
          {normalizedMarkdown}
        </ReactMarkdown>
      </div>
    );
  }

  if (businessPlanParts) {
    return (
      <div className="question-formatter">
        {businessPlanParts.mainQuestion ? (
          <div className="font-bold text-gray-900 text-base leading-relaxed">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="m-0 inline">{children}</p>,
                strong: ({ children }) => <strong className="font-bold text-gray-900" style={{ fontWeight: 700 }}>{children}</strong>
              }}
            >
              {businessPlanParts.mainQuestion}
            </ReactMarkdown>
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

  const lines = mutableText.split('\n');
  const processedLines: string[] = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    const sameLineMatch = line.match(/(🧠|💡|📌|📋|🚀|🧩|🌍)?\s*(Thought Starter|Quick Tip|Educational Insight|Goal|Thought|Tip):\s+([A-Z][^?\n]{15,}?\?)/iu);
    
    if (sameLineMatch) {
      const emoji = sameLineMatch[1] || '';
      const heading = sameLineMatch[2];
      const question = sameLineMatch[3].trim();
      if (question && question.endsWith('?') && question.length >= 15) {
        processedLines.push(`${emoji} ${heading}: **${question}**`);
        i++;
        continue;
      }
    }
    
    const headingOnlyMatch = line.match(/^(🧠|💡|📌|📋|🚀|🧩|🌍)?\s*(Thought Starter|Quick Tip|Educational Insight|Goal|Thought|Tip):\s*$/iu);
    if (headingOnlyMatch) {
      let questionFound = false;
      let questionText = '';
      let linesToSkip = 0;
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine && nextLine.endsWith('?') && nextLine.length >= 15) {
          questionText = nextLine;
          linesToSkip = j - i;
          questionFound = true;
          break;
        }
      }
      if (questionFound) {
        const emoji = headingOnlyMatch[1] || '';
        const heading = headingOnlyMatch[2];
        processedLines.push(`${emoji} ${heading}: **${questionText}**`);
        i += linesToSkip + 1;
        continue;
      }
    }
    processedLines.push(line);
    i++;
  }
  
  mutableText = processedLines.join('\n');
  mutableText = mutableText.replace(/\n{3,}/g, '\n\n');
  mutableText = mutableText.replace(/\r\n/g, '\n');

  // Step 6: FIXED - Don't strip existing double asterisks
  // mutableText = mutableText.replace(/\*\*([^*]+\?)\*\*/g, '$1'); 
  mutableText = mutableText.replace(/([A-Z][A-Za-z0-9\s,'"()-]{10,}?\?)/g, (match, question) => {
    if (question.includes('**') || match.includes('**')) return match;
    const beforeText = mutableText.substring(0, mutableText.indexOf(match));
    const lineWithMatch = (beforeText + match).split('\n').pop() || '';
    if (/(🧠|💡|📌|📋|🚀|🧩|🌍)?\s*(Thought Starter|Quick Tip|Educational Insight|Goal|Thought|Tip):/u.test(lineWithMatch)) {
      return match;
    }
    return `**${question}**`;
  });

  mutableText = mutableText.replace(/(?<!\*)\*(?!\*)/g, '');
  mutableText = mutableText.replace(/#+/g, '');
  mutableText = mutableText.replace(/^[-–—•]+\s*/gm, '');
  mutableText = mutableText.replace(/([^:\-–—\n🧠💡📌📋🚀🧩🌍])\s*(\*\*[^*]+\?\*\*)/gu, '$1\n\n$2');
  mutableText = mutableText.replace(/(\*\*[^*]+\?\*\*)([^\n])/g, '$1\n\n$2');
  mutableText = mutableText.replace(/\n{3,}/g, '\n\n');

  return (
    <div className="question-formatter whitespace-normal text-sm leading-relaxed">
      <ReactMarkdown
        components={{
          ...angelMarkdownComponents,
          strong: ({ children }) => {
            const text = String(children);
            if (text.includes('?')) {
              return (
                <strong className="font-bold text-gray-900" style={{ fontWeight: 700 }}>
                  {children}
                </strong>
              );
            }
            return angelMarkdownComponents.strong({ children });
          },
        }}
      >
        {normalizeAngelMarkdown(mutableText)}
      </ReactMarkdown>
    </div>
  );
};

export default QuestionFormatter;
