import type { CoachStep } from "./types";

/**
 * Tour shown the first time the user enters the Business Planning phase of
 * the questionnaire. Each step targets one of the quick-action buttons via
 * its `data-coachmark` attribute and is explained only once the button is
 * actually on screen — no upfront definitions, no jargon out of context.
 */
export const BUSINESS_PLAN_TOUR_ID = "business_plan_quick_actions";

export const businessPlanQuickActionSteps: CoachStep[] = [
  {
    id: "support",
    targetSelector: '[data-coachmark="support"]',
    title: "Support",
    body: "Ask Angel for deeper guidance on the question you're looking at right now — examples, context, or a longer explanation when you're not sure how to answer.",
  },
  {
    id: "draft",
    targetSelector: '[data-coachmark="draft"]',
    title: "Draft",
    body: "Have Angel write a first-pass answer for you based on everything you've shared so far. Accept it, edit it, or use it as a jumping-off point.",
  },
  {
    id: "scrapping",
    targetSelector: '[data-coachmark="scrapping"]',
    title: "Scrapping",
    body: "Type rough notes in the message box, then click Scrapping. Angel will polish your wording, tighten the structure, and hand it back ready to send.",
  },
];
