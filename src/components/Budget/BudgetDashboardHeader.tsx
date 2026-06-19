import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Download, MessageSquareText } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface BudgetDashboardHeaderProps {
  onChatWithAngel?: () => void;
  /** Opens export format modal (PDF, Excel, DOCX) */
  onOpenExport?: () => void;
  /** Hide duplicate title when parent page already shows "Budget Setup" */
  compact?: boolean;
  disabled?: boolean;
}

const BudgetDashboardHeader: React.FC<BudgetDashboardHeaderProps> = ({
  onChatWithAngel,
  onOpenExport,
  compact = false,
  disabled = false,
}) => {
  return (
    <div
      className={cn(
        'bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm min-w-0',
        compact ? 'mb-4' : 'mb-6 sm:mb-8',
      )}
    >
      <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8', compact ? 'py-3' : 'py-4')}>
        <div
          className={cn(
            'flex gap-3 min-w-0',
            compact
              ? 'flex-col md:flex-row md:items-center md:justify-end'
              : 'flex-col md:flex-row md:justify-between md:items-center',
          )}
        >
          {!compact && (
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent tracking-tight">
                Budget Dashboard
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">Year 1 budget planning and tracking</p>
            </div>
          )}

          <div
            className={cn(
              'flex flex-wrap items-center gap-2 sm:gap-2.5 min-w-0',
              compact ? 'w-full md:w-auto md:justify-end' : 'w-full md:w-auto',
            )}
          >
            {onOpenExport && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={onOpenExport}
                    className="w-full md:w-auto border-gray-200/80 text-gray-700 hover:bg-gray-50"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    <span className="truncate">Export</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Download your budget as PDF, Excel, or Word</TooltipContent>
              </Tooltip>
            )}

            {onChatWithAngel && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onChatWithAngel}
                    size="sm"
                    disabled={disabled}
                    className="w-full md:w-auto bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md"
                  >
                    <MessageSquareText className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    <span className="truncate">Chat with Angel</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Discuss your budget with Angel AI</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetDashboardHeader;
