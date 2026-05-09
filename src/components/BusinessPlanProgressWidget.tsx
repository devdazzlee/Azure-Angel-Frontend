import React, { useEffect, useMemo, useRef } from 'react';
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
  ArrowRight,
  Check,
  Info,
} from 'lucide-react';
import { motion, useReducedMotion, LayoutGroup } from 'framer-motion';

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

const SECTIONS: BusinessPlanSection[] = [
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

function sectionStatus(
  section: BusinessPlanSection,
  currentQuestionNumber: number
): 'complete' | 'current' | 'upcoming' {
  if (currentQuestionNumber > section.endQuestion) return 'complete';
  if (
    currentQuestionNumber >= section.startQuestion &&
    currentQuestionNumber <= section.endQuestion
  ) {
    return 'current';
  }
  return 'upcoming';
}

const BusinessPlanProgressWidget: React.FC<BusinessPlanProgressWidgetProps> = ({
  currentQuestionNumber,
  className = '',
}) => {
  const q = Math.min(Math.max(currentQuestionNumber, 1), BP_TOTAL_QUESTIONS);
  const reduceMotion = useReducedMotion();
  const currentSectionRef = useRef<HTMLDivElement | null>(null);

  const currentSection = useMemo(() => {
    return (
      SECTIONS.find((s) => q >= s.startQuestion && q <= s.endQuestion) ??
      SECTIONS.find((s) => q < s.startQuestion) ??
      SECTIONS[SECTIONS.length - 1]
    );
  }, [q]);

  const questionsInCurrentSection =
    currentSection.endQuestion - currentSection.startQuestion + 1;
  const currentQuestionInSection = Math.max(
    1,
    q - currentSection.startQuestion + 1
  );

  useEffect(() => {
    if (!currentSectionRef.current) return;
    currentSectionRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [currentSection.id]);

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

        {/* Section strip */}
        <div className="space-y-1.5 sm:space-y-2 pt-0.5">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Sections
            </h4>
            <span
              className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] text-gray-400 shrink-0"
              title="Swipe to see all sections. Completed = checkmark."
            >
              <Info className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-70" aria-hidden />
              <span className="leading-none">Swipe →</span>
            </span>
          </div>

          <div
            className="relative -mx-0.5 sm:-mx-1 px-0.5 sm:px-1 pb-0.5 overflow-x-auto scroll-smooth snap-x snap-mandatory
              [scrollbar-width:thin] [scrollbar-color:rgba(139,92,246,0.35)_transparent]
              hover:[scrollbar-color:rgba(139,92,246,0.55)_transparent]"
          >
            <LayoutGroup>
            <div className="flex flex-nowrap items-stretch gap-0 min-w-min py-1 sm:py-2 pl-0.5 pr-2 sm:pl-1 sm:pr-3">
              {SECTIONS.map((section, index) => {
                const status = sectionStatus(section, q);
                const isComplete = status === 'complete';
                const isCurrent = status === 'current';

                return (
                  <React.Fragment key={section.id}>
                    {index > 0 && (
                      <div
                        className="flex items-center justify-center w-3 sm:w-3.5 flex-shrink-0 text-violet-600"
                        aria-hidden
                      >
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-95" strokeWidth={2.25} />
                      </div>
                    )}
                    <motion.div
                      ref={isCurrent ? currentSectionRef : null}
                      layout
                      title={section.title}
                      className={[
                        'snap-center shrink-0 w-[88px] min-[400px]:w-[96px] sm:w-[118px] md:w-[128px] rounded-lg sm:rounded-xl flex flex-col items-center justify-center text-center px-1.5 py-2 sm:px-2.5 sm:py-3 border transition-shadow min-h-[4.25rem] sm:min-h-0',
                        isComplete &&
                          'border-emerald-200/90 bg-gradient-to-b from-emerald-50/90 to-emerald-50/40 text-emerald-900',
                        isCurrent &&
                          'border-violet-500 bg-gradient-to-b from-violet-50 to-white text-gray-900 shadow-sm sm:shadow-md shadow-violet-500/10 ring-1 sm:ring-2 ring-violet-200/80 z-10',
                        !isComplete &&
                          !isCurrent &&
                          'border-gray-200/80 bg-gray-50/50 text-gray-400 border-dashed',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      initial={false}
                      animate={
                        reduceMotion
                          ? undefined
                          : isCurrent
                            ? { scale: 1.01, y: -1 }
                            : { scale: 1, y: 0 }
                      }
                      whileHover={reduceMotion || isCurrent ? undefined : { scale: 1.02, y: -0.5 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                      transition={spring}
                    >
                      {isComplete && (
                        <motion.span
                          className="mb-1 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-emerald-500 text-white"
                          initial={reduceMotion ? false : { scale: 0 }}
                          animate={reduceMotion ? undefined : { scale: 1 }}
                          transition={{ ...spring, delay: 0.02 }}
                        >
                          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={2.5} />
                        </motion.span>
                      )}
                      {isCurrent && (
                        <motion.span
                          layoutId="bp-current-pill"
                          className="mb-1 inline-flex rounded-full bg-violet-600 px-1.5 py-px sm:px-2 sm:py-0.5 text-[7px] sm:text-[9px] font-bold uppercase tracking-wide text-white shadow-sm"
                        >
                          <span className="sm:hidden">Now</span>
                          <span className="hidden sm:inline">Current</span>
                        </motion.span>
                      )}
                      <span className="text-[9px] sm:text-[11px] md:text-xs font-semibold leading-[1.2] text-balance px-0.5 line-clamp-2">
                        {section.compactTitle ? (
                          <>
                            <span className="sm:hidden">{section.compactTitle}</span>
                            <span className="hidden sm:inline">{section.shortTitle}</span>
                          </>
                        ) : (
                          section.shortTitle
                        )}
                      </span>
                      <span className="mt-0.5 sm:mt-1 text-[8px] sm:text-[9px] tabular-nums text-gray-500 opacity-90">
                        Q{section.startQuestion}-{section.endQuestion}
                      </span>
                    </motion.div>
                  </React.Fragment>
                );
              })}
            </div>
            </LayoutGroup>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BusinessPlanProgressWidget;
