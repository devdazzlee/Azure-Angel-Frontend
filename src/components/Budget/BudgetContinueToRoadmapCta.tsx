import React from 'react';
import { ArrowRight, Loader2, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PURPLE_CTA =
  'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/30';

interface BudgetContinueToRoadmapCtaProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
  variant: 'header' | 'fab';
  className?: string;
  /** e.g. bottom-24 when a sticky footer is present */
  fabClassName?: string;
  /** On mobile header/footer: "short" | "full" label */
  mobileLabel?: 'short' | 'full';
}

/**
 * Primary budget → roadmap CTA. Loading state lives on the control (not toast).
 */
const BudgetContinueToRoadmapCta: React.FC<BudgetContinueToRoadmapCtaProps> = ({
  onClick,
  isLoading,
  disabled = false,
  variant,
  className,
  fabClassName = 'bottom-6',
  mobileLabel = 'short',
}) => {
  const labelFull = isLoading ? 'Building your roadmap…' : 'Continue to Roadmap';
  const labelShort = isLoading ? 'Building…' : 'To Roadmap';
  const labelMobile = mobileLabel === 'full' ? labelFull : labelShort;

  if (variant === 'fab') {
    return (
      <div
        className={cn(
          'fixed right-6 z-[60] flex flex-col items-end gap-2 pointer-events-none',
          fabClassName,
          className,
        )}
        aria-live="polite"
      >
        {isLoading && (
          <p className="pointer-events-none rounded-lg bg-violet-900/90 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
            This usually takes a few seconds — hang tight
          </p>
        )}
        <Button
          type="button"
          onClick={onClick}
          disabled={disabled || isLoading}
          className={cn(
            PURPLE_CTA,
            'group pointer-events-auto h-auto min-h-[3rem] rounded-full px-6 py-3 text-sm font-semibold',
            'ring-2 ring-violet-300/50 ring-offset-2 ring-offset-slate-50',
            'transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
            isLoading && 'cursor-wait opacity-95',
          )}
        >
          <span className="flex items-center gap-2.5">
            {isLoading ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
            ) : (
              <Map className="h-5 w-5 shrink-0" aria-hidden />
            )}
            <span className="md:hidden">{labelShort}</span>
            <span className="hidden md:inline">{labelFull}</span>
            {!isLoading && (
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            )}
          </span>
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        PURPLE_CTA,
        'w-full min-w-0 rounded-full px-4 py-2.5 text-sm font-semibold md:min-w-[11rem] md:w-auto md:rounded-full',
        'transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
        isLoading && 'cursor-wait',
        className,
      )}
    >
      <span className="flex items-center justify-center gap-2 min-w-0">
        {isLoading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        ) : (
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        )}
        <span className="truncate md:whitespace-normal">
          <span className="md:hidden">{labelMobile}</span>
          <span className="hidden md:inline">{labelFull}</span>
        </span>
      </span>
    </Button>
  );
};

export default BudgetContinueToRoadmapCta;
