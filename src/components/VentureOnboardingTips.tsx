import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { markVentureOnboardingTipsComplete } from "@/constants/ventureOnboarding";

const STEPS: { title: string; body: string }[] = [
  {
    title: "Talk to Angel here",
    body: "Use the message box at the bottom of the screen to type your answers and anything you want to ask Angel. Press **Enter** to send, or **Shift+Enter** for a new line while you are in Getting to Know You.",
  },
  {
    title: "Tools appear when you need them",
    body: "During **Getting to Know You** you'll just chat with Angel — no extra tools yet. Once **Business planning** begins, a row of quick actions will appear (left sidebar on desktop, beneath the chat on mobile). Angel will walk you through each one the moment it shows up, so you don't have to memorize anything now.",
  },
  {
    title: "Progress and questions",
    body: "On large screens, the **right-hand column** is reserved for your journey. The **overall progress** bar (your place across Getting to Know You and business planning) appears there once you are in **Business planning**; during Getting to Know You that area stays minimal on purpose. On mobile, open the **Questions** menu when you need the same view.",
  },
  {
    title: "What happens next",
    body: "After this short questionnaire, Angel walks you through your **business plan**, then a **launch roadmap**, and finally **implementation** tasks—always one focused step at a time.",
  },
];

/** `**phrase**` in step copy → underlined emphasis (readable on plain black body text). */
function formatInlineEmphasis(text: string) {
  const parts = text.split("**");
  return parts.map((chunk, i) =>
    i % 2 === 1 ? (
      <span key={i} className="underline decoration-2 underline-offset-2">
        {chunk}
      </span>
    ) : (
      <span key={i}>{chunk}</span>
    )
  );
}

type VentureOnboardingTipsProps = {
  open: boolean;
  sessionId?: string;
  onOpenChange: (open: boolean) => void;
};

export default function VentureOnboardingTips({ open, sessionId, onOpenChange }: VentureOnboardingTipsProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const finish = () => {
    markVentureOnboardingTipsComplete(sessionId);
    onOpenChange(false);
  };

  const handleDialogOpenChange = (next: boolean) => {
    if (!next) {
      markVentureOnboardingTipsComplete(sessionId);
    }
    onOpenChange(next);
  };

  const isLast = step === STEPS.length - 1;
  const { title, body } = STEPS[step];

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="pt-1 text-left text-sm leading-relaxed text-gray-900">
            {formatInlineEmphasis(body)}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-1.5 py-1" aria-hidden>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"}`}
            />
          ))}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          ) : (
            <span className="sm:mr-auto" />
          )}
          {isLast ? (
            <Button type="button" onClick={finish}>
              Got it
            </Button>
          ) : (
            <Button type="button" onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
