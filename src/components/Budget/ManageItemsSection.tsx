import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import StartupCostsTable from './StartupCostsTable';
import OperatingExpensesTable from './OperatingExpensesTable';
import RevenueTable from './RevenueTable';
import { TableSelectionControls } from './TableSelectionControls';
import type { BudgetItem } from '@/types/apiTypes';

interface ManageItemsSectionProps {
  startupCostItems: BudgetItem[];
  operatingExpenseItems: BudgetItem[];
  selectedItemIds: Set<string>;
  onToggleSectionSelection: (itemIds: string[], isSelected: boolean) => void;
  onToggleItemSelection: (itemId: string, isSelected: boolean) => void;
  onUpdateItem: (item: BudgetItem) => void;
  onDeleteItem: (id: string) => void;
  currency: string;
  viewMode: 'estimated' | 'actual';
  dynamicRevenueStreams: any[];
  setDynamicRevenueStreams: React.Dispatch<React.SetStateAction<any[]>>;
  saveRevenueStreamsDebounced: (streams: any[]) => void;
  setTotalMonthlyRevenue: React.Dispatch<React.SetStateAction<number>>;
  loadingRevenueStreams: boolean;
  onAddLineItem: (category: 'startup_cost' | 'operating_expense' | 'revenue') => void;
}

const ManageItemsSection: React.FC<ManageItemsSectionProps> = ({
  startupCostItems,
  operatingExpenseItems,
  selectedItemIds,
  onToggleSectionSelection,
  onToggleItemSelection,
  onUpdateItem,
  onDeleteItem,
  currency,
  viewMode,
  dynamicRevenueStreams,
  setDynamicRevenueStreams,
  saveRevenueStreamsDebounced,
  setTotalMonthlyRevenue,
  loadingRevenueStreams,
  onAddLineItem
}) => {
  return (
    <div className="space-y-8">
      {/* Startup Costs */}
      <Card className="shadow-xl border border-gray-200/60 rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-teal-50/80 to-white border-b border-teal-200/40">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-teal-600" />
            </div>
            Startup Costs (One-Time, Pre-Launch)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <TableSelectionControls
            items={startupCostItems}
            selectedItemIds={selectedItemIds}
            onToggleAll={(isSelected) => 
              onToggleSectionSelection(startupCostItems.map(i => i.id), isSelected)
            }
            sectionName="Startup Costs"
          />
          <StartupCostsTable
            items={startupCostItems}
            onChange={(items) => items.forEach(item => onUpdateItem(item))}
            onRemoveItem={(id, name) => onDeleteItem(id)}
            currency={currency}
            selectedItemIds={selectedItemIds}
            onToggleItemSelection={onToggleItemSelection}
            onToggleAllSelection={(isSelected) => 
              onToggleSectionSelection(startupCostItems.map(i => i.id), isSelected)
            }
            onAddLineItem={() => onAddLineItem('startup_cost')}
          />
        </CardContent>
      </Card>

      {/* Monthly Revenue Projection */}
      <Card className="shadow-xl border border-gray-200/60 rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-50/80 to-white border-b border-emerald-200/40">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            Monthly Revenue Projection
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loadingRevenueStreams ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 text-teal-600" />
            </div>
          ) : (
            <RevenueTable
              items={dynamicRevenueStreams}
              onRevenueStreamsChange={(updatedStreams) => {
                setDynamicRevenueStreams((prev) => {
                  const next = [...prev, ...updatedStreams];
                  saveRevenueStreamsDebounced(next);
                  setTotalMonthlyRevenue(
                    next.filter((s) => s.isSelected).reduce((sum, s) => sum + s.revenueProjection, 0)
                  );
                  return next;
                });
              }}
              onTotalMonthlyRevenueChange={(totalRevenue) => {
                setTotalMonthlyRevenue(totalRevenue);
              }}
              currency={currency}
              selectedItemIds={selectedItemIds}
              onToggleItemSelection={onToggleItemSelection}
              onToggleAllSelection={(itemIds, isSelected) => {
                itemIds.forEach(id => onToggleItemSelection(id, isSelected));
              }}
              onAddLineItem={() => onAddLineItem('revenue')}
            />
          )}
        </CardContent>
      </Card>

      {/* Monthly Operating Expenses */}
      <Card className="shadow-xl border border-gray-200/60 rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-50/80 to-white border-b border-amber-200/40">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-orange-600" />
            </div>
            Monthly Operating Expenses (Post-Launch)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <TableSelectionControls
            items={operatingExpenseItems}
            selectedItemIds={selectedItemIds}
            onToggleAll={(isSelected) =>
              onToggleSectionSelection(operatingExpenseItems.map(i => i.id), isSelected)
            }
            sectionName="Operating Expenses"
          />
          <OperatingExpensesTable
            items={operatingExpenseItems}
            onChange={(items) => items.forEach(item => onUpdateItem(item))}
            onRemoveItem={(id, name) => onDeleteItem(id)}
            currency={currency}
            selectedItemIds={selectedItemIds}
            onToggleItemSelection={onToggleItemSelection}
            onToggleAllSelection={(isSelected) => 
              onToggleSectionSelection(operatingExpenseItems.map(i => i.id), isSelected)
            }
            onAddLineItem={() => onAddLineItem('operating_expense')}
          />
        </CardContent>
      </Card>

    </div>
  );
};

export default ManageItemsSection;
