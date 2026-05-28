import React, { useMemo } from 'react';
import {
  Building2,
  Package,
  Users,
  MapPin,
  DollarSign,
  Megaphone,
  Scale,
  TrendingUp,
  Shield,
  Check,
  ChevronDown,
} from 'lucide-react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';

interface BusinessPlanSection {
  id: string;
  title: string;
  shortTitle: string;
  /** Shown in the horizontal stepper below `sm` when `shortTitle` is too long */
  compactTitle?: string;
  icon: React.ReactNode;
  startQuestion: number;
  endQuestion: number;
  color: string;
  bgColor: string;
}

/** Matches backend TOTALS_BY_PHASE["BUSINESS_PLAN"] = 45 */
const BP_TOTAL_QUESTIONS = 45;

interface BusinessPlanProgressWidgetProps {
  currentQuestionNumber: number;
  className?: string;
}

export const BUSINESS_PLAN_SECTIONS: BusinessPlanSection[] = [
  {
    id: 'product-service',
    title: 'Product/Service Details',
    shortTitle: 'Product / Service',
    /** Narrow screens: one short line in the stepper */
    compactTitle: 'Product',
    icon: <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
    startQuestion: 1,
    endQuestion: 4,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'business-overview',
    title: 'Business Overview',
    shortTitle: 'Overview',
    icon: <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
    startQuestion: 5,
    endQuestion: 7,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    id: 'market-research',
    title: 'Market Research',
    shortTitle: 'Market',
    icon: <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
    startQuestion: 8,
    endQuestion: 13,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    id: 'location-operations',
    title: 'Location & Operations',
    shortTitle: 'Location',
    icon: <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
    startQuestion: 14,
    endQuestion: 17,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    id: 'marketing-sales',
    title: 'Marketing & Sales',
    shortTitle: 'Marketing',
    icon: <Megaphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
    startQuestion: 18,
    endQuestion: 23,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  {
    id: 'legal-compliance',
    title: 'Legal & Compliance',
    shortTitle: 'Legal',
    icon: <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
    startQuestion: 24,
    endQuestion: 28,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    id: 'financial-planning',
    title: 'Revenue & Financials',
    shortTitle: 'Financials',
    icon: <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
    startQuestion: 29,
    endQuestion: 34,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    id: 'growth-scaling',
    title: 'Growth & Scaling',
    shortTitle: 'Growth',
    icon: <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
    startQuestion: 35,
    endQuestion: 41,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    id: 'challenges-contingency',
    title: 'Challenges & Contingency',
    shortTitle: 'Contingency',
    icon: <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
    startQuestion: 42,
    endQuestion: 45,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
];

const BusinessPlanProgressWidget: React.FC<BusinessPlanProgressWidgetProps> = ({
  currentQuestionNumber,
  className = '',
}) => {
  const q = Math.min(Math.max(currentQuestionNumber, 1), BP_TOTAL_QUESTIONS);
  const reduceMotion = useReducedMotion();

  const { currentSection, currentIdx } = useMemo(() => {
    const idx =
      BUSINESS_PLAN_SECTIONS.findIndex((s) => q >= s.startQuestion && q <= s.endQuestion) ??
      -1;
    const safeIdx =
      idx >= 0
        ? idx
        : Math.max(
            0,
            BUSINESS_PLAN_SECTIONS.findIndex((s) => q < s.startQuestion),
          );
    const finalIdx = safeIdx === -1 ? BUSINESS_PLAN_SECTIONS.length - 1 : safeIdx;
    return { currentSection: BUSINESS_PLAN_SECTIONS[finalIdx], currentIdx: finalIdx };
  }, [q]);

  /**
   * Three-section window centred on the current section.
   * Renders prev / current / next so the user always sees where they came
   * from, where they are, and where they're headed — without horizontal
   * scrolling. Edge cases:
   *   - If on the first section, the "prev" slot renders an empty
   *     start-marker stub so the layout stays balanced.
   *   - If on the last section, the "next" slot renders a "Finish" stub.
   * The previous version showed all 9 sections in a swipable strip that
   * snapped back to the first item on each completion event — confusing
   * users when their progress advanced.
   */
  const windowedSections = useMemo(() => {
    return [
      currentIdx > 0 ? BUSINESS_PLAN_SECTIONS[currentIdx - 1] : null,
      BUSINESS_PLAN_SECTIONS[currentIdx],
      currentIdx < BUSINESS_PLAN_SECTIONS.length - 1 ? BUSINESS_PLAN_SECTIONS[currentIdx + 1] : null,
    ];
  }, [currentIdx]);

  const questionsInCurrentSection =
    currentSection.endQuestion - currentSection.startQuestion + 1;
  const currentQuestionInSection = Math.max(
    1,
    q - currentSection.startQuestion + 1
  );

  const spring = reduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 380, damping: 28 };

  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100/90 overflow-hidden ${className}`}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="p-3 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="min-w-0 pr-1">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 tracking-tight leading-tight">
              Business plan journey
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 leading-snug">
              {currentQuestionInSection}/{questionsInCurrentSection} ·{' '}
              <span className="font-medium text-gray-700">{currentSection.shortTitle}</span>
            </p>
          </div>
          <motion.div
            className="shrink-0"
            key={q}
            initial={reduceMotion ? false : { scale: 0.92, opacity: 0.6 }}
            animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
            transition={spring}
          >
            <span className="text-[10px] sm:text-xs font-semibold tabular-nums text-violet-700 bg-violet-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg border border-violet-100">
              Q{q}/{BP_TOTAL_QUESTIONS}
            </span>
          </motion.div>
        </div>

        {/* Current section highlight — compact on phones */}
        <motion.div
          layout
          className={`rounded-lg sm:rounded-xl border border-gray-200/80 ${currentSection.bgColor} p-2.5 sm:p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]`}
          transition={spring}
        >
          <div className="flex items-start gap-2 sm:gap-3">
            <motion.div
              layout
              className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl shrink-0 ${currentSection.color.replace('text-', 'bg-').replace('-600', '-100')} shadow-sm`}
              whileHover={reduceMotion ? undefined : { scale: 1.04 }}
              transition={spring}
            >
              <div className={currentSection.color}>{currentSection.icon}</div>
            </motion.div>
            <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
              <motion.p
                layout
                className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug"
                key={currentSection.id}
                initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                transition={spring}
              >
                {currentSection.title}
              </motion.p>
              <p className="text-[10px] sm:text-xs text-gray-600 leading-snug sm:leading-relaxed hidden sm:block">
                You’re in this section now. Answer below; Angel moves you forward when it’s complete.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Section windowed view — prev / current / next.
            Always three columns. The middle column is the current section,
            visually emphasised with the arrow indicator above and a violet
            ring/badge. The previous column shows a completed (check-marked)
            section; the next column shows the upcoming one in a dashed/muted
            style. No scrolling required; the user can always see where they
            came from, where they are, and where they're going. */}
        <div className="space-y-1.5 sm:space-y-2 pt-0.5">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Sections
            </h4>
            <span className="text-[9px] sm:text-[10px] text-gray-400 shrink-0 tabular-nums">
              Step {currentIdx + 1} of {BUSINESS_PLAN_SECTIONS.length}
            </span>
          </div>

          {/* Arrow indicator that points DOWN to the current card. Renders
              in the centre column only, so the user's eye is drawn to the
              middle card automatically. */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 -mb-1">
            <div aria-hidden />
            <motion.div
              key={`arrow-${currentSection.id}`}
              className="flex flex-col items-center justify-end text-violet-600"
              initial={reduceMotion ? false : { opacity: 0, y: -4 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={spring}
              aria-hidden
            >
              <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.15em] text-violet-600 leading-none mb-0.5">
                You are here
              </span>
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
            </motion.div>
            <div aria-hidden />
          </div>

          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={`window-${currentSection.id}`}
              className="grid grid-cols-3 gap-2 items-stretch min-w-0"
              initial={reduceMotion ? false : { opacity: 0, x: 12 }}
              animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
              transition={spring}
            >
              {windowedSections.map((section, position) => {
                // position 0 = previous, 1 = current, 2 = next
                const isCurrent = position === 1;
                const isComplete = position === 0;

                if (!section) {
                  const isStart = position === 0;
                  return (
                    <div
                      key={`stub-${position}`}
                      className="min-w-0 rounded-xl border border-dashed border-gray-200 bg-gray-50/40 flex items-center justify-center px-1 py-3 min-h-[5.25rem]"
                      aria-hidden
                    >
                      <span className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">
                        {isStart ? 'Start' : 'Finish'}
                      </span>
                    </div>
                  );
                }

                const stepperLabel = section.compactTitle ?? section.shortTitle;

                return (
                  <motion.div
                    key={section.id}
                    title={section.title}
                    className={[
                      'min-w-0 w-full rounded-xl flex flex-col items-center justify-center gap-0.5 text-center px-1 py-2 border transition-shadow min-h-[5.25rem]',
                      isComplete &&
                        'border-emerald-200/90 bg-gradient-to-b from-emerald-50/90 to-emerald-50/40 text-emerald-900',
                      isCurrent &&
                        'border-violet-500 bg-gradient-to-b from-violet-50 to-white text-gray-900 shadow-md shadow-violet-500/10 ring-2 ring-violet-200/80',
                      !isComplete &&
                        !isCurrent &&
                        'border-gray-200/80 bg-gray-50/50 text-gray-500 border-dashed',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    initial={false}
                    animate={
                      reduceMotion
                        ? undefined
                        : isCurrent
                          ? { y: -2 }
                          : { y: 0 }
                    }
                    transition={spring}
                  >
                    {isComplete && (
                      <Check
                        className="h-4 w-4 text-emerald-600 shrink-0"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                    )}
                    {isCurrent && (
                      <span className="shrink-0 rounded-full bg-violet-600 px-1.5 py-px text-[8px] font-bold uppercase tracking-wide text-white">
                        Current
                      </span>
                    )}
                    {!isComplete && !isCurrent && (
                      <span className="shrink-0 text-[8px] font-bold uppercase tracking-wider text-gray-400">
                        Next
                      </span>
                    )}
                    <span className="w-full text-[10px] font-semibold leading-snug break-words hyphens-auto px-0.5">
                      {stepperLabel}
                    </span>
                    <span className="shrink-0 text-[9px] tabular-nums text-gray-500">
                      Q{section.startQuestion}–{section.endQuestion}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default BusinessPlanProgressWidget;
