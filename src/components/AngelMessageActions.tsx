import { useState } from "react";
import { Check, Copy, Share2, ThumbsDown, ThumbsUp } from "lucide-react";
import AngelShareModal from "./AngelShareModal";

export interface AngelMessageActionsProps {
  /** Raw message text to copy / share */
  content: string;
  /** Stable id so thumbs feedback is isolated per message in this session */
  messageId: string;
}

type Feedback = "up" | "down" | null;

function toPlainText(content: string): string {
  return content
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
}

/**
 * Copy / thumbs / share row shown under Angel (model) responses.
 * Thumbs start unselected; selection is session-only (not restored from storage).
 */
export default function AngelMessageActions({
  content,
  messageId,
}: AngelMessageActionsProps) {
  const plain = toPlainText(content);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [shareOpen, setShareOpen] = useState(false);

  if (!plain) return null;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(plain);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = plain;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        /* ignore */
      }
    }
  };

  const handleFeedback = (value: "up" | "down", e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFeedback((prev) => (prev === value ? null : value));
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShareOpen(true);
  };

  const iconBtn =
    "inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500";

  return (
    <>
      <div
        className="mt-2.5 flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label="Message actions"
        data-message-id={messageId}
      >
        <button
          type="button"
          className={iconBtn}
          onClick={handleCopy}
          title={copied ? "Copied" : "Copy"}
          aria-label={copied ? "Copied" : "Copy response"}
        >
          {copied ? <Check className="h-4 w-4 text-teal-600" /> : <Copy className="h-4 w-4" />}
        </button>

        <button
          type="button"
          className={`${iconBtn} ${feedback === "up" ? "bg-teal-50 text-teal-700" : ""}`}
          onClick={(e) => handleFeedback("up", e)}
          title="Good response"
          aria-label="Thumbs up"
          aria-pressed={feedback === "up"}
        >
          <ThumbsUp
            className="h-4 w-4"
            strokeWidth={1.75}
            fill={feedback === "up" ? "currentColor" : "none"}
          />
        </button>
        <button
          type="button"
          className={`${iconBtn} ${feedback === "down" ? "bg-rose-50 text-rose-700" : ""}`}
          onClick={(e) => handleFeedback("down", e)}
          title="Bad response"
          aria-label="Thumbs down"
          aria-pressed={feedback === "down"}
        >
          <ThumbsDown
            className="h-4 w-4"
            strokeWidth={1.75}
            fill={feedback === "down" ? "currentColor" : "none"}
          />
        </button>

        <button
          type="button"
          className={iconBtn}
          onClick={handleShare}
          title="Share"
          aria-label="Share response"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      <AngelShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        content={plain}
        title="Angel AI Connect Idea"
      />
    </>
  );
}
