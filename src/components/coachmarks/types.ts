export type CoachPlacement = "top" | "bottom" | "left" | "right";

export interface CoachStep {
  id: string;
  targetSelector: string;
  title: string;
  body: string;
  placement?: CoachPlacement;
}

export interface CoachMarkContextValue {
  startTour: (tourId: string, steps: CoachStep[]) => void;
  endTour: () => void;
  isActive: boolean;
}
