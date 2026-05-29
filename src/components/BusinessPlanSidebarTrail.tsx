import React, { useMemo } from 'react';
import { Check, Circle } from 'lucide-react';
import { BUSINESS_PLAN_SECTIONS } from './BusinessPlanProgressWidget';

interface BusinessPlanSidebarTrailProps {
  currentQuestionNumber: number;
  className?: string;
}

/**
 * Scrollable list of all 9 BP sections (below Progress Overview + journey stepper).
 * Parent sidebar scrolls so this panel is never clipped at the viewport bottom.
 */
const BusinessPlanSidebarTrail: React.FC<BusinessPlanSidebarTrailProps> = ({
  currentQuestionNumber,
  className = '',
}) => {
  const q = Math.min(Math.max(currentQuestionNumber, 1), 45);

  const rows = useMemo(() => {
    return BUSINESS_PLAN_SECTIONS.map((section, idx) => {
      const isCurrent = q >= section.startQuestion && q <= section.endQuestion;
      const isComplete = q > section.endQuestion;
      return { section, idx, isCurrent, isComplete };
    });
  }, [q]);

  const completedCount = rows.filter((r) => r.isComplete).length;

  return (
    <div
      className={`rounded-xl border border-gray-100/90 bg-white/90 shadow-sm backdrop-blur-sm ${className}`}
      aria-label="All business plan sections"
    >
      <div className="border-b border-gray-100 px-4 py-3 bg-gradient-to-r from-slate-50/90 to-teal-50/50">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          All sections
        </h4>
        <p className="mt-0.5 text-[11px] text-gray-500 leading-snug">
          {completedCount} of {BUSINESS_PLAN_SECTIONS.length} sections complete
        </p>
      </div>

      <ol className="px-3 py-3 space-y-1.5">
        {rows.map(({ section, idx, isCurrent, isComplete }) => (
          <li
            key={section.id}
            className={[
              'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
              isCurrent && 'bg-violet-50/90 ring-1 ring-violet-200/70',
              isComplete && !isCurrent && 'bg-emerald-50/40',
              !isCurrent && !isComplete && 'opacity-75',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span
              className={[
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                isComplete && 'bg-emerald-500 text-white',
                isCurrent && !isComplete && 'bg-violet-600 text-white',
                !isComplete && !isCurrent && 'bg-gray-100 text-gray-400',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-hidden
            >
              {isComplete ? (
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              ) : isCurrent ? (
                <span className="text-[10px] font-bold">{idx + 1}</span>
              ) : (
                <Circle className="h-3 w-3" strokeWidth={2} />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={[
                  'block text-[11px] font-semibold leading-tight truncate',
                  isCurrent ? 'text-violet-900' : isComplete ? 'text-emerald-900' : 'text-gray-600',
                ].join(' ')}
              >
                {section.shortTitle}
              </span>
              <span className="block text-[10px] text-gray-400 tabular-nums">
                Q{section.startQuestion}–{section.endQuestion}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <div className="border-t border-teal-100/80 bg-gradient-to-t from-teal-50/80 to-transparent px-4 py-3">
        <p className="text-[10px] leading-relaxed text-teal-800/90 text-center">
          Your launch roadmap unlocks when all 45 questions are complete.
        </p>
      </div>
    </div>
  );
};

export default BusinessPlanSidebarTrail;
