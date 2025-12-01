import React from 'react';
import ReactMarkdown from 'react-markdown';

interface QuestionFormatterProps {
  text: string;
  phase?: 'KYC' | 'BUSINESS_PLAN' | 'ROADMAP' | 'IMPLEMENTATION';
}

const QuestionFormatter: React.FC<QuestionFormatterProps> = ({ text, phase }) => {
  if (!text || typeof text !== 'string') {
    return <div>{String(text || '')}</div>;
  }

  let processedText = text;

  // Step 1: Remove machine tags
  processedText = processedText.replace(/\[\[Q:[A-Z_]+\.\d{2}]]\s*/g, "");

  // Step 2: Remove "Question X" text
  processedText = processedText.replace(/Question\s+\d+(?:\s+of\s+\d+)?/gi, '').trim();

  // Step 3: Fix broken questions
  processedText = processedText.replace(/([A-Za-z0-9,;:\)])\s*\n+\s*\?/g, '$1?');

  // Step 4: ROOT CAUSE FIX - Handle heading+question patterns
  // Process line by line to handle both same-line and multi-line cases
  
  const lines = processedText.split('\n');
  const processedLines: string[] = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Check if line contains heading+question on same line
    const sameLineMatch = line.match(/(🧠|💡|📌|📋|🚀|🧩|🌍)?\s*(Thought Starter|Quick Tip|Educational Insight|Goal|Thought|Tip):\s+([A-Z][^?\n]{15,}?\?)/i);
    
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
    const headingOnlyMatch = line.match(/^(🧠|💡|📌|📋|🚀|🧩|🌍)?\s*(Thought Starter|Quick Tip|Educational Insight|Goal|Thought|Tip):\s*$/i);
    
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
  
  processedText = processedLines.join('\n');

  // Step 5: Normalize whitespace
  processedText = processedText.replace(/\n{3,}/g, '\n\n');
  processedText = processedText.replace(/\r\n/g, '\n');

  // Step 6: Bold all remaining questions (not already in heading+question patterns)
  processedText = processedText.replace(/\*\*([^*]+\?)\*\*/g, '$1');
  processedText = processedText.replace(/([A-Z][A-Za-z0-9\s,'"()-]{10,}?\?)/g, (match, question) => {
    if (question.includes('**')) return match;
    // Skip if already part of heading+question pattern
    const beforeText = processedText.substring(0, processedText.indexOf(match));
    const lineWithMatch = (beforeText + match).split('\n').pop() || '';
    if (/(🧠|💡|📌|📋|🚀|🧩|🌍)?\s*(Thought Starter|Quick Tip|Educational Insight|Goal|Thought|Tip):/.test(lineWithMatch)) {
      return match; // Already processed
    }
    return `**${question}**`;
  });

  // Step 7: Clean up formatting
  processedText = processedText.replace(/(?<!\*)\*(?!\*)/g, '');
  processedText = processedText.replace(/#+/g, '');
  processedText = processedText.replace(/^[-–—•]+\s*/gm, '');

  // Step 8: Add spacing for regular questions
  processedText = processedText.replace(/([^:\-–—\n🧠💡📌📋🚀🧩🌍])\s*(\*\*[^*]+\?\*\*)/g, '$1\n\n$2');
  processedText = processedText.replace(/(\*\*[^*]+\?\*\*)([^\n])/g, '$1\n\n$2');
  
  // Step 9: Ensure proper spacing around heading+question patterns
  processedText = processedText.replace(
    /([^\n])\s*((🧠|💡|📌|📋|🚀|🧩|🌍)\s*(Thought Starter|Quick Tip|Educational Insight|Goal|Thought|Tip):\s*\*\*[^*]+\?\*\*)/g,
    '$1\n\n$2'
  );
  
  processedText = processedText.replace(
    /((🧠|💡|📌|📋|🚀|🧩|🌍)\s*(Thought Starter|Quick Tip|Educational Insight|Goal|Thought|Tip):)\s*\n+\s*(\*\*[^*]+\?\*\*)/g,
    '$1 $3'
  );
  
  processedText = processedText.replace(
    /((🧠|💡|📌|📋|🚀|🧩|🌍)\s*(Thought Starter|Quick Tip|Educational Insight|Goal|Thought|Tip):\s*\*\*[^*]+\?\*\*)\s*\n\n/g,
    '$1\n'
  );

  processedText = processedText.replace(/\n{3,}/g, '\n\n');

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
            if (text.match(/(🧠|💡|📌|📋|🚀|🧩|🌍).*(Thought Starter|Quick Tip|Educational Insight|Goal|Thought|Tip):.*\*\*.*\?\*\*/)) {
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
        {processedText}
      </ReactMarkdown>
    </div>
  );
};

export default QuestionFormatter;
