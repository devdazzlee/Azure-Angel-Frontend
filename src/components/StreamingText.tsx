import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface StreamingTextProps {
  text: string;
  /** Chars to add per tick (higher = faster) */
  chunkSize?: number;
  /** Ms between ticks */
  tickMs?: number;
  /** Skip streaming if text is shorter than this */
  minLengthForStreaming?: number;
  children?: (revealed: string) => React.ReactNode;
  /** Use ReactMarkdown for rendered content */
  asMarkdown?: boolean;
  className?: string;
}

/**
 * Gradually reveals text to simulate streaming. Use for Angel messages
 * so content doesn't "pop in" all at once.
 */
export default function StreamingText({
  text,
  chunkSize = 8,
  tickMs = 25,
  minLengthForStreaming = 60,
  children,
  asMarkdown = true,
  className = '',
}: StreamingTextProps) {
  const [revealedLength, setRevealedLength] = useState(0);
  const fullLength = text?.length ?? 0;

  useEffect(() => {
    if (!text) return;
    setRevealedLength(0);
    if (fullLength < minLengthForStreaming) {
      setRevealedLength(fullLength);
      return;
    }
    const timer = setInterval(() => {
      setRevealedLength((prev) => {
        const next = Math.min(prev + chunkSize, fullLength);
        if (next >= fullLength) clearInterval(timer);
        return next;
      });
    }, tickMs);
    return () => clearInterval(timer);
  }, [text, fullLength, chunkSize, tickMs, minLengthForStreaming]);

  const revealed = text?.slice(0, revealedLength) ?? '';

  if (typeof children === 'function') return <>{children(revealed)}</>;

  if (asMarkdown && revealed) {
    return (
      <div className={className}>
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="whitespace-pre-wrap mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
            ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
            li: ({ children }) => <li className="text-gray-700">{children}</li>,
          }}
        >
          {revealed}
        </ReactMarkdown>
      </div>
    );
  }

  return <div className={`whitespace-pre-wrap ${className}`}>{revealed}</div>;
}
