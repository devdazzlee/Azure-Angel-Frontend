import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Save, Loader, Download, ArrowRight, CheckCircle2, XCircle, HelpCircle, MessageSquareText } from 'lucide-react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface BudgetDashboardHeaderProps {
  viewMode: 'estimated' | 'actual';
  setViewMode: (mode: 'estimated' | 'actual') => void;
  saveStatus: SaveStatus;
  handleSaveBudget: () => void;
  handleExportPdf: () => void;
  handleExportExcel: () => void;
  budget: any;
  onContinueToRoadmap?: () => void;
  onChatWithAngel?: () => void;
}

const BudgetDashboardHeader: React.FC<BudgetDashboardHeaderProps> = ({
  viewMode,
  setViewMode,
  saveStatus,
  handleSaveBudget,
  handleExportPdf,
  handleExportExcel,
  budget,
  onContinueToRoadmap,
  onChatWithAngel
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent tracking-tight">
              Budget Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {viewMode === 'actual' ? 'Actual' : 'Estimated'} budget for Year 1
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* View mode toggle with tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl border border-gray-200/60">
                  <Button
                    variant={viewMode === 'estimated' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('estimated')}
                    className={viewMode === 'estimated' ? 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}
                  >
                    Estimated
                  </Button>
                  <Button
                    variant={viewMode === 'actual' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('actual')}
                    disabled={!budget?.items?.some((item: any) => item.actual_amount !== undefined)}
                    className={viewMode === 'actual' ? 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}
                  >
                    Actual
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[280px]">
                <strong>Estimated:</strong> Your planned budget numbers. <strong>Actual:</strong> Fill in real spending to track variance.
              </TooltipContent>
            </Tooltip>

            {/* Save button with tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSaveBudget}
                  size="sm"
                  disabled={saveStatus === 'saving'}
                  className={
                    saveStatus === 'saved'
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
                      : saveStatus === 'error'
                      ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md'
                      : 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md'
                  }
                >
                  {saveStatus === 'saving' ? (
                    <><Loader className="animate-spin w-3.5 h-3.5 mr-1.5" />Saving…</>
                  ) : saveStatus === 'saved' ? (
                    <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />Saved!</>
                  ) : saveStatus === 'error' ? (
                    <><XCircle className="w-3.5 h-3.5 mr-1.5" />Retry Save</>
                  ) : (
                    <><Save className="w-3.5 h-3.5 mr-1.5" />Save</>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Save all budget changes to the database</TooltipContent>
            </Tooltip>

            {/* Export PDF with tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleExportPdf}
                  variant="outline"
                  size="sm"
                  className="border border-gray-200/80 text-gray-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />PDF
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Download budget as PDF</TooltipContent>
            </Tooltip>

            {/* Export Excel with tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleExportExcel}
                  variant="outline"
                  size="sm"
                  className="border border-gray-200/80 text-gray-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />Excel
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Download budget as Excel spreadsheet</TooltipContent>
            </Tooltip>

            {/* Chat with Angel */}
            {onChatWithAngel && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onChatWithAngel}
                    size="sm"
                    className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md"
                  >
                    <MessageSquareText className="w-3.5 h-3.5 mr-1.5" />
                    Chat with Angel
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Discuss your budget with Angel AI</TooltipContent>
              </Tooltip>
            )}

            {/* Continue to Roadmap — prominent CTA in header */}
            {onContinueToRoadmap && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onContinueToRoadmap}
                    className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 ml-2 px-5 py-2.5 text-sm rounded-full group transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
                  >
                    <span className="flex items-center gap-2">
                      Continue to Roadmap
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Done with budget? Continue to your implementation roadmap</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetDashboardHeader;
