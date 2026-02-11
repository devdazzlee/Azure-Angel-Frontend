import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader, Download } from 'lucide-react';
import SaveStatusIndicator, { type SaveStatus } from '../ui/SaveStatusIndicator';

interface BudgetDashboardHeaderProps {
  viewMode: 'estimated' | 'actual';
  setViewMode: (mode: 'estimated' | 'actual') => void;
  saveStatus: SaveStatus;
  handleSaveBudget: () => void;
  handleExportPdf: () => void;
  handleExportExcel: () => void;
  budget: any;
  AutoSaveIndicator: React.ComponentType;
}

const BudgetDashboardHeader: React.FC<BudgetDashboardHeaderProps> = ({
  viewMode,
  setViewMode,
  saveStatus,
  handleSaveBudget,
  handleExportPdf,
  handleExportExcel,
  budget,
  AutoSaveIndicator
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl border-b-2 border-gray-200 shadow-lg mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Budget Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              {viewMode === 'actual' ? 'Actual' : 'Estimated'} budget for Year 1
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
              <Button
                variant={viewMode === 'estimated' ? 'default' : 'ghost'}
                onClick={() => setViewMode('estimated')}
                className={viewMode === 'estimated' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'text-gray-700'}
              >
                Estimated
              </Button>
              <Button
                variant={viewMode === 'actual' ? 'default' : 'ghost'}
                onClick={() => setViewMode('actual')}
                disabled={!budget.items.some(item => item.actual_amount !== undefined)}
                className={viewMode === 'actual' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'text-gray-700'}
              >
                Actual
              </Button>
            </div>

            <Button
              onClick={handleSaveBudget}
              disabled={saveStatus === 'saving'}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader className="animate-spin w-4 h-4 mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Budget
                </>
              )}
            </Button>

            <SaveStatusIndicator status={saveStatus} onRetry={handleSaveBudget} />

            <AutoSaveIndicator />

            <Button
              onClick={handleExportPdf}
              variant="outline"
              className="border-2 border-gray-300 hover:border-gray-400"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>

            <Button
              onClick={handleExportExcel}
              variant="outline"
              className="border-2 border-gray-300 hover:border-gray-400"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Selected Items Banner */}
        {/* This will be handled separately as it needs access to selectedItemIds */}
      </div>
    </div>
  );
};

export default BudgetDashboardHeader;
