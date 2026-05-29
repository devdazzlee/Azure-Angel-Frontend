import React from 'react';
import { cn } from '@/lib/utils';
import { useBudgetEmbed } from './budgetEmbedContext';

interface BudgetTableScrollProps {
  children: React.ReactNode;
  className?: string;
}

/** Desktop-only table container (mobile uses card layout). */
export function BudgetTableScroll({ children, className }: BudgetTableScrollProps) {
  const embedded = useBudgetEmbed();

  return (
    <div className={cn('hidden md:block relative min-w-0', className)}>
      <div
        className={cn(
          'w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]',
          embedded
            ? 'rounded-lg'
            : 'rounded-xl border border-gray-200/60'
        )}
        role="region"
        aria-label="Budget table"
      >
        {children}
      </div>
    </div>
  );
}

export default BudgetTableScroll;
