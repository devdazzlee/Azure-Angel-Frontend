import React from 'react';
import { cn } from '@/lib/utils';

interface BudgetTableScrollProps {
  children: React.ReactNode;
  className?: string;
}

/** Desktop-only table container (mobile uses card layout). */
export function BudgetTableScroll({ children, className }: BudgetTableScrollProps) {
  return (
    <div className={cn('hidden md:block relative min-w-0', className)}>
      <div
        className="w-full overflow-x-auto overscroll-x-contain rounded-xl border border-gray-200/60 [-webkit-overflow-scrolling:touch]"
        role="region"
        aria-label="Budget table"
      >
        {children}
      </div>
    </div>
  );
}

export default BudgetTableScroll;
