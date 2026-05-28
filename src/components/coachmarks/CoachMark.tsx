import { motion } from "framer-motion";
import type { CoachPlacement } from "./types";

interface CoachMarkProps {
  rect: DOMRect;
  title: string;
  body: string;
  stepIndex: number;
  totalSteps: number;
  placement?: CoachPlacement;
  onNext: () => void;
  onSkip: () => void;
}

const POPOVER_WIDTH = 320;
const POPOVER_GAP = 16;
const VIEWPORT_MARGIN = 12;

/**
 * Pick a placement that keeps the popover inside the viewport. Caller can
 * suggest one via `placement`; we fall back to the side with the most room
 * when the preferred side would clip.
 */
function resolvePlacement(rect: DOMRect, preferred?: CoachPlacement): CoachPlacement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const room = {
    right: vw - rect.right,
    left: rect.left,
    bottom: vh - rect.bottom,
    top: rect.top,
  };

  if (preferred && room[preferred] >= POPOVER_WIDTH + POPOVER_GAP) {
    return preferred;
  }

  const ordered: CoachPlacement[] = (["right", "bottom", "left", "top"] as const)
    .slice()
    .sort((a, b) => room[b] - room[a]);
  return ordered[0];
}

function computePosition(
  rect: DOMRect,
  placement: CoachPlacement,
): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = 0;
  let left = 0;

  switch (placement) {
    case "right":
      left = rect.right + POPOVER_GAP;
      top = rect.top + rect.height / 2;
      break;
    case "left":
      left = rect.left - POPOVER_GAP - POPOVER_WIDTH;
      top = rect.top + rect.height / 2;
      break;
    case "bottom":
      left = rect.left + rect.width / 2 - POPOVER_WIDTH / 2;
      top = rect.bottom + POPOVER_GAP;
      break;
    case "top":
      left = rect.left + rect.width / 2 - POPOVER_WIDTH / 2;
      top = rect.top - POPOVER_GAP;
      break;
  }

  left = Math.min(Math.max(left, VIEWPORT_MARGIN), vw - POPOVER_WIDTH - VIEWPORT_MARGIN);
  top = Math.min(Math.max(top, VIEWPORT_MARGIN), vh - VIEWPORT_MARGIN - 220);
  return { top, left };
}

export default function CoachMark({
  rect,
  title,
  body,
  stepIndex,
  totalSteps,
  placement,
  onNext,
  onSkip,
}: CoachMarkProps) {
  const resolved = resolvePlacement(rect, placement);
  const { top, left } = computePosition(rect, resolved);
  const isLast = stepIndex === totalSteps - 1;
  const translateY = resolved === "left" || resolved === "right" ? "-50%" : "0";

  return (
    <motion.div
      role="dialog"
      aria-labelledby="coach-mark-title"
      aria-describedby="coach-mark-body"
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 8 }}
      transition={{ duration: 0.25, delay: 0.15 }}
      style={{ top, left, width: POPOVER_WIDTH, transform: `translateY(${translateY})` }}
      data-angel-coach-tour
      className="fixed z-[70] rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-900/10"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 id="coach-mark-title" className="text-base font-semibold text-slate-900">
          {title}
        </h3>
        <span className="text-xs font-medium text-slate-400">
          {stepIndex + 1} of {totalSteps}
        </span>
      </div>
      <p id="coach-mark-body" className="mt-2 text-sm leading-relaxed text-slate-600">
        {body}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onSkip}
          className="text-xs font-medium text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline"
        >
          Skip tour
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          autoFocus
        >
          {isLast ? "Got it" : "Next"}
        </button>
      </div>
    </motion.div>
  );
}
