import React, { useMemo, useCallback } from 'react';
import { Trash2, Plus, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { BudgetItem } from '@/types/apiTypes';
import { formatMoney } from '@/lib/formatters'; // Import from new formatters
import CurrencyInput from '../ui/CurrencyInput'; // Import CurrencyInput

export function createDefaultStartupCosts(businessType?: string): BudgetItem[] {
  const normalized = (businessType || '').trim().toLowerCase();

  const typeKey = (() => {
    if (!normalized) return 'default';
    if (normalized.includes('influencer') || normalized.includes('creator') || normalized.includes('social media')) return 'influencer';
    if (normalized.includes('food truck')) return 'food_truck';
    if (normalized.includes('consult')) return 'consulting';
    if (normalized.includes('e-commerce') || normalized.includes('ecommerce') || normalized.includes('online store')) return 'e_commerce';
    if (normalized.includes('delivery') || normalized.includes('courier') || normalized.includes('logistics')) return 'delivery';
    return 'default';
  })();

  type StartupCostTemplate = { key: string; name: string; notes: string; };

  const base: Record<string, StartupCostTemplate> = {
    registration: {
      key: 'registration',
      name: 'Business registration & licenses',
      notes: 'Formation fees, permits, licenses, and filings',
    },
    legal: {
      key: 'legal',
      name: 'Legal & accounting setup',
      notes: 'Initial attorney/CPA setup and bookkeeping configuration',
    },
    equipment: {
      key: 'equipment',
      name: 'Equipment & tools',
      notes: 'Tools/equipment required to deliver your product or service',
    },
    inventory: {
      key: 'inventory',
      name: 'Initial inventory / materials',
      notes: 'Initial stock, raw materials, packaging, supplies',
    },
    vehicle: {
      key: 'vehicle',
      name: 'Vehicle purchase / lease',
      notes: 'Only if needed for operations (purchase, lease, or down payment)',
    },
    branding: {
      key: 'branding',
      name: 'Branding & design',
      notes: 'Logo, visual identity, photography, initial brand assets',
    },
    website: {
      key: 'website',
      name: 'Website & initial software setup',
      notes: 'Domain, hosting, web build, key software subscriptions',
    },
    insurance: {
      key: 'insurance',
      name: 'Insurance (initial premiums)',
      notes: 'General liability, professional, auto, etc.',
    },
    workspace: {
      key: 'workspace',
      name: 'Office / workspace setup',
      notes: 'Deposits, furniture, basic setup for office/workspace',
    },
  };

  const relevantKeysByType: Record<string, string[]> = {
    influencer: ['equipment', 'branding', 'website', 'registration', 'legal', 'insurance'],
    food_truck: ['vehicle', 'equipment', 'inventory', 'registration', 'legal', 'insurance', 'branding', 'website'],
    consulting: ['equipment', 'branding', 'website', 'workspace', 'registration', 'legal', 'insurance'],
    e_commerce: ['inventory', 'website', 'branding', 'equipment', 'registration', 'legal', 'insurance'],
    delivery: ['vehicle', 'equipment', 'registration', 'legal', 'insurance', 'branding', 'website'],
    default: ['registration', 'legal', 'equipment', 'inventory', 'vehicle', 'branding', 'website', 'insurance', 'workspace'],
  };

  const relevantKeys = relevantKeysByType[typeKey] || relevantKeysByType.default;

  return relevantKeys.map((key, index) => {
    const template = base[key];
    return {
      id: `startup_${key}_${index}`,
      name: template?.name ?? key,
      category: 'expense',
      estimated_amount: 0,
      actual_amount: undefined,
      description: template?.notes ?? '',
      is_custom: false,
      isSelected: false, // Default to not selected
    } satisfies BudgetItem;
  });
}

type StartupCostsTableProps = {
  items: BudgetItem[];
  onChange: (items: BudgetItem[]) => void;
  onRemoveItem?: (id: string, name: string) => void;
  currency?: string;
  selectedItemIds: Set<string>; // New prop for selected item IDs
  onToggleItemSelection: (itemId: string, isSelected: boolean) => void; // New prop for toggling individual item selection
  onToggleAllSelection: (isSelected: boolean) => void; // New prop for toggling all items selection
  onAddLineItem: (category: 'startup_cost') => void; // New prop for adding line item
};

const StartupCostsTable: React.FC<StartupCostsTableProps> = ({
  items,
  onChange,
  onRemoveItem,
  currency = '$',
  selectedItemIds,
  onToggleItemSelection,
  onToggleAllSelection,
  onAddLineItem, // Destructure new prop
}) => {
  const totals = useMemo(() => {
    const budgetTotal = items.reduce((sum, item) => sum + (Number(item.estimated_amount) || 0), 0);
    const actualTotal = items.reduce((sum, item) => sum + (Number(item.actual_amount) || 0), 0);
    const hasAnyActual = items.some((i) => i.actual_amount !== undefined && i.actual_amount !== null);
    const varianceTotal = hasAnyActual ? budgetTotal - actualTotal : NaN;
    return { budgetTotal, actualTotal, varianceTotal, hasAnyActual };
  }, [items]);

  const isAllSelected = items.length > 0 && items.every((item) => selectedItemIds.has(item.id));
  const isSomeSelected = items.some((item) => selectedItemIds.has(item.id)) && !isAllSelected;

  const handleUpdateItem = (id: string, updates: Partial<BudgetItem>) => {
    const next = items.map((item) => (item.id === id ? { ...item, ...updates } : item));
    onChange(next);
  };

  const handleRemoveItem = useCallback(
    (item: BudgetItem) => {
      if (onRemoveItem) {
        onRemoveItem(item.id, item.name);
        return;
      }
      onChange(items.filter((i) => i.id !== item.id));
    },
    [items, onChange, onRemoveItem]
  );

  const getVarianceDisplay = (item: BudgetItem): { valueText: string; className: string } => {
    const budget = Number(item.estimated_amount) || 0;
    const actualNum = Number(item.actual_amount) || 0;
    const variance = budget - actualNum;

    if (variance > 0) return { valueText: formatMoney(variance, currency), className: 'text-green-600 font-semibold' };
    if (variance < 0) return { valueText: formatMoney(variance, currency), className: 'text-red-600 font-semibold' };
    return { valueText: formatMoney(0, currency), className: 'text-gray-500' };
  };

  const getSmartStep = useCallback((currentValue: number): number => {
    if (currentValue < 1000) return 100;
    if (currentValue < 10000) return 1000;
    return 5000; // Larger step for larger startup costs
  }, []);

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto rounded-xl border border-gray-200/60">
        <table className="w-full min-w-[980px]">
          <thead>
            <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-gradient-to-r from-gray-50 to-gray-100/60 border-b border-gray-200/60">
              <th className="px-3 py-3.5 w-10">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                        onCheckedChange={(v) => onToggleAllSelection(Boolean(v))}
                        aria-label="Select all startup cost line items"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">Select items to discuss with Angel AI</TooltipContent>
                </Tooltip>
              </th>
              <th className="px-3 py-3.5">Line Item</th>
              <th className="px-3 py-3.5 w-40">
                <Tooltip>
                  <TooltipTrigger asChild><span className="flex items-center gap-1 cursor-help">Budget ({currency}) <HelpCircle className="w-3 h-3 text-gray-400" /></span></TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">Your estimated/planned amount for this expense</TooltipContent>
                </Tooltip>
              </th>
              <th className="px-3 py-3.5 w-40">
                <Tooltip>
                  <TooltipTrigger asChild><span className="flex items-center gap-1 cursor-help">Actual ({currency}) <HelpCircle className="w-3 h-3 text-gray-400" /></span></TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">What you actually spent — fill in as you go</TooltipContent>
                </Tooltip>
              </th>
              <th className="px-3 py-3.5 w-40">
                <Tooltip>
                  <TooltipTrigger asChild><span className="flex items-center gap-1 cursor-help">Variance ({currency}) <HelpCircle className="w-3 h-3 text-gray-400" /></span></TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[240px]">Budget − Actual. Green = under budget, Red = over budget</TooltipContent>
                </Tooltip>
              </th>
              <th className="px-3 py-3.5">Notes</th>
              <th className="px-3 py-3.5 w-12" />
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {items.map((item, idx) => {
              const varianceDisplay = getVarianceDisplay(item);
              return (
                <tr key={item.id} className={`group transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-teal-50/40`}>
                  <td className="px-3 py-2.5 align-top">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-center pt-2">
                          <Checkbox checked={selectedItemIds.has(item.id)} onCheckedChange={(v) => onToggleItemSelection(item.id, Boolean(v))} aria-label={`Select ${item.name}`} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[180px]">Select to discuss with Angel</TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <Input value={item.name} onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })} className="h-9 border-gray-200/80 focus:border-teal-400 focus:ring-teal-400/20" />
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <CurrencyInput value={item.estimated_amount ?? 0} onChange={(value) => handleUpdateItem(item.id, { estimated_amount: value })} min={0} step={100} getSmartStep={getSmartStep} adjustmentControl="buttons" className="w-full" />
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <CurrencyInput value={item.actual_amount ?? 0} onChange={(value) => handleUpdateItem(item.id, { actual_amount: value })} min={0} step={100} getSmartStep={getSmartStep} className="w-full" />
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <div className={`pt-2 text-sm ${varianceDisplay.className}`}>{varianceDisplay.valueText}</div>
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <Input value={item.description || ''} onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })} className="h-9 border-gray-200/80 focus:border-teal-400 focus:ring-teal-400/20" placeholder="Optional notes" />
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item)} aria-label={`Remove ${item.name}`} className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}

            <tr className="bg-gradient-to-r from-teal-50/60 to-cyan-50/60 font-semibold border-t-2 border-teal-200/40">
              <td className="px-3 py-3.5" />
              <td className="px-3 py-3.5 text-gray-900 text-sm">Total Startup Costs</td>
              <td className="px-3 py-3.5 text-gray-900 text-sm">{formatMoney(totals.budgetTotal, currency)}</td>
              <td className="px-3 py-3.5 text-gray-900 text-sm">{formatMoney(totals.actualTotal, currency)}</td>
              <td className="px-3 py-3.5 text-sm">
                {(() => {
                  const variance = totals.budgetTotal - totals.actualTotal;
                  return (
                    <span className={variance > 0 ? 'text-emerald-600 font-semibold' : variance < 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                      {formatMoney(variance, currency)}
                    </span>
                  );
                })()}
              </td>
              <td className="px-3 py-3.5" />
              <td className="px-3 py-3.5" />
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={() => onAddLineItem('startup_cost')} size="sm" className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-sm flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Line Item
        </Button>
      </div>
    </div>
  );
};

export default StartupCostsTable;