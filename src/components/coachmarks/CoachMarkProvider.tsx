import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence } from "framer-motion";
import { isCoachTourSeen, markCoachTourSeen } from "@/constants/ventureOnboarding";
import CoachMark from "./CoachMark";
import SpotlightOverlay from "./SpotlightOverlay";
import type { CoachMarkContextValue, CoachStep, CoachTourEndHandler } from "./types";

const CoachMarkContext = createContext<CoachMarkContextValue | null>(null);

/**
 * Find every element matching the selector and return the one currently
 * laid out (i.e. inside a visible breakpoint container, not display:none).
 * We render the same Support/Draft/Scrapping buttons twice — once in the
 * desktop sidebar, once in the mobile quick-actions row — and only one
 * copy is rendered at any given width. `offsetParent === null` is the
 * cheapest reliable visibility check across both cases.
 */
function findVisibleTarget(selector: string): HTMLElement | null {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
  return nodes.find((node) => node.offsetParent !== null) ?? null;
}

interface CoachMarkProviderProps {
  sessionId?: string;
  onTourEnd?: CoachTourEndHandler;
  children: ReactNode;
}

export function CoachMarkProvider({ sessionId, onTourEnd, children }: CoachMarkProviderProps) {
  const [activeTour, setActiveTour] = useState<{ id: string; steps: CoachStep[] } | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const waitingForTargetRef = useRef(false);

  const endTour = useCallback(() => {
    const endedTourId = activeTour?.id;
    if (activeTour) {
      markCoachTourSeen(activeTour.id, sessionId);
    }
    setActiveTour(null);
    setStepIndex(0);
    setRect(null);
    waitingForTargetRef.current = false;
    if (endedTourId) {
      onTourEnd?.(endedTourId);
    }
  }, [activeTour, sessionId, onTourEnd]);

  const startTour = useCallback(
    (tourId: string, steps: CoachStep[]) => {
      if (steps.length === 0) return;
      if (isCoachTourSeen(tourId, sessionId)) return;
      if (activeTour) return;
      setActiveTour({ id: tourId, steps });
      setStepIndex(0);
    },
    [activeTour, sessionId],
  );

  const currentStep = activeTour?.steps[stepIndex] ?? null;

  /**
   * Resolve the current step's target rect. We try immediately, then poll
   * via MutationObserver until the element mounts (handles the case where
   * the questionnaire renders the sidebar a tick after the phase change).
   */
  useEffect(() => {
    if (!currentStep) {
      setRect(null);
      return;
    }

    let cancelled = false;
    waitingForTargetRef.current = true;

    const tryResolve = () => {
      const el = findVisibleTarget(currentStep.targetSelector);
      if (!el) return false;
      if (cancelled) return true;
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      requestAnimationFrame(() => {
        if (cancelled) return;
        setRect(el.getBoundingClientRect());
        waitingForTargetRef.current = false;
      });
      return true;
    };

    if (tryResolve()) return;

    const observer = new MutationObserver(() => {
      if (tryResolve()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const giveUp = window.setTimeout(() => {
      observer.disconnect();
      if (!cancelled && waitingForTargetRef.current) {
        endTour();
      }
    }, 8000);

    return () => {
      cancelled = true;
      observer.disconnect();
      window.clearTimeout(giveUp);
    };
  }, [currentStep, endTour]);

  /** Keep the spotlight glued to the target during scroll / resize. */
  useEffect(() => {
    if (!currentStep) return;
    const update = () => {
      const el = findVisibleTarget(currentStep.targetSelector);
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener("scroll", update, { passive: true, capture: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, { capture: true });
      window.removeEventListener("resize", update);
    };
  }, [currentStep]);

  /** ESC anywhere ends the tour. */
  useEffect(() => {
    if (!activeTour) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") endTour();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeTour, endTour]);

  const advance = useCallback(() => {
    if (!activeTour) return;
    if (stepIndex + 1 >= activeTour.steps.length) {
      endTour();
    } else {
      setStepIndex((i) => i + 1);
    }
  }, [activeTour, stepIndex, endTour]);

  const value = useMemo<CoachMarkContextValue>(
    () => ({ startTour, endTour, isActive: activeTour !== null }),
    [startTour, endTour, activeTour],
  );

  return (
    <CoachMarkContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {currentStep && rect && (
          <>
            <SpotlightOverlay key={`overlay-${stepIndex}`} rect={rect} />
            <CoachMark
              key={`mark-${stepIndex}`}
              rect={rect}
              title={currentStep.title}
              body={currentStep.body}
              stepIndex={stepIndex}
              totalSteps={activeTour!.steps.length}
              placement={currentStep.placement}
              onNext={advance}
              onSkip={endTour}
            />
          </>
        )}
      </AnimatePresence>
    </CoachMarkContext.Provider>
  );
}

export function useCoachMarks(): CoachMarkContextValue {
  const ctx = useContext(CoachMarkContext);
  if (!ctx) {
    throw new Error("useCoachMarks must be used inside a CoachMarkProvider");
  }
  return ctx;
}
