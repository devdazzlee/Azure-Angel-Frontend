import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import StartupCostsTable from './StartupCostsTable';
import OperatingExpensesTable from './OperatingExpensesTable';
import RevenueTable from './RevenueTable';
import { TableSelectionControls } from './TableSelectionControls';
import type { BudgetItem } from '@/types/apiTypes';

interface BudgetTablesSectionProps {
  startupCostItems: BudgetItem[];
  operatingExpenseItems: BudgetItem[];
  selectedItemIds: Set<string>;
  onToggleSectionSelection: (itemIds: string[], isSelected: boolean) => void;
  onToggleItemSelection: (itemId: string, isSelected: boolean) => void;
  onAddItem: (item: Omit<BudgetItem, 'id' | 'created_at' | 'updated_at'>) => void;
  onRemoveItem: (itemId: string, itemName: string, isCustom: boolean) => void;
  currency: string;
  viewMode: 'estimated' | 'actual';
  dynamicRevenueStreams: any[];
  setDynamicRevenueStreams: React.Dispatch<React.SetStateAction<any[]>>;
  saveRevenueStreamsDebounced: (streams: any[]) => void;
  setTotalMonthlyRevenue: React.Dispatch<React.SetStateAction<number>>;
  addLineItemCategory: 'startup_cost' | 'operating_expense' | 'revenue' | null;
  classifyExpenseGroup: (item: BudgetItem) => string;
  loadingRevenueStreams: boolean;
}

const BudgetTablesSection: React.FC<BudgetTablesSectionProps> = ({
  startupCostItems,
  operatingExpenseItems,
  selectedItemIds,
  onToggleSectionSelection,
  onToggleItemSelection,
  onAddItem,
  onRemoveItem,
  currency,
  viewMode,
  dynamicRevenueStreams,
  setDynamicRevenueStreams,
  saveRevenueStreamsDebounced,
  setTotalMonthlyRevenue,
  addLineItemCategory,
  classifyExpenseGroup,
  loadingRevenueStreams
}) => {
  return (
    <div className="space-y-8">
      {/* Startup Costs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
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
              onChange={(nextStartupItems) => {
                const nextItems: BudgetItem[] = [
                  ...nextStartupItems,
                  ...operatingExpenseItems,
                ];
                onAddItem(nextItems[0]); // This will need to be handled differently
              }}
              onRemoveItem={(id, name) => onRemoveItem(id, name, false)}
              currency={currency}
              selectedItemIds={selectedItemIds}
              onToggleItemSelection={onToggleItemSelection}
              onToggleAllSelection={(isSelected) => 
                onToggleSectionSelection(startupCostItems.map(i => i.id), isSelected)
              }
              onAddLineItem={() => {
                // This will be handled by parent
              }}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Monthly Revenue Projection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="shadow-xl border border-gray-200/60 rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50/80 to-white border-b border-emerald-200/40">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
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
                  setDynamicRevenueStreams(updatedStreams);
                  saveRevenueStreamsDebounced(updatedStreams);
                  setTotalMonthlyRevenue(
                    updatedStreams.filter((s) => s.isSelected).reduce((sum, s) => sum + s.revenueProjection, 0)
                  );
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
                onAddLineItem={() => {
                  // This will be handled by parent
                }}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Monthly Operating Expenses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="shadow-xl border border-gray-200/60 rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-50/80 to-white border-b border-amber-200/40">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-orange-600" />
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
              onChange={(nextOperatingItems) => {
                const nextItems: BudgetItem[] = [
                  ...startupCostItems,
                  ...nextOperatingItems,
                ];
                onAddItem(nextItems[0]); // This will need to be handled differently
              }}
              onRemoveItem={(id, name) => onRemoveItem(id, name, false)}
              currency={currency}
              selectedItemIds={selectedItemIds}
              onToggleItemSelection={onToggleItemSelection}
              onToggleAllSelection={(isSelected) => 
                onToggleSectionSelection(operatingExpenseItems.map(i => i.id), isSelected)
              }
              onAddLineItem={() => {
                // This will be handled by parent
              }}
            />
          </CardContent>
        </Card>
      </motion.div>

    </div>
  );
};

export default BudgetTablesSection;
