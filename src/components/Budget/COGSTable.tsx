import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Trash2, Plus, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { BudgetItem } from '@/types/apiTypes';
import { formatMoney } from '@/lib/formatters'; // Import from new formatters
import CurrencyInput from '../ui/CurrencyInput'; // Import CurrencyInput

export type COGSDefaults = {
  items: BudgetItem[];
  infoMessage?: string;
};

export function createDefaultCOGSItems(businessType?: string): COGSDefaults {
  const normalized = (businessType || '').trim().toLowerCase();

  const isDigitalSoftware =
    normalized.includes('software') ||
    normalized.includes('saas') ||
    normalized.includes('app') ||
    normalized.includes('digital') ||
    normalized.includes('influencer') ||
    normalized.includes('creator') ||
    normalized.includes('online');

  const isService =
    normalized.includes('service') ||
    normalized.includes('consult') ||
    normalized.includes('agency') ||
    normalized.includes('freelance') ||
    normalized.includes('coaching');

  const isProduct =
    normalized.includes('product') ||
    normalized.includes('retail') ||
    normalized.includes('store') ||
    normalized.includes('shop') ||
    normalized.includes('restaurant') ||
    normalized.includes('food') ||
    normalized.includes('manufactur') ||
    normalized.includes('e-commerce') ||
    normalized.includes('ecommerce');

  type Template = { key: string; name: string; notes: string };

  const templates: Record<string, Template> = {
    materials: {
      key: 'materials',
      name: 'Materials / supplies',
      notes: 'Direct materials or supplies needed to deliver your product/service',
    },
    manufacturing: {
      key: 'manufacturing',
      name: 'Manufacturing / production',
      notes: 'Production labor or manufacturing costs',
    },
    packaging: {
      key: 'packaging',
      name: 'Packaging & shipping',
      notes: 'Packaging materials and shipping costs',
    },
    processing: {
      key: 'processing',
      name: 'Payment processing fees',
      notes: 'Stripe/PayPal/card processing fees and platform transaction fees',
    },
  };

  const makeItems = (keys: string[]): BudgetItem[] => {
    return keys.map((key, index) => {
      const t = templates[key];
      return {
        id: `cogs_${key}_${index}`,
        name: t?.name ?? key,
        category: 'expense',
        estimated_amount: 0,
        actual_amount: undefined,
        description: t?.notes ?? '',
        is_custom: false,
        isSelected: false, // Default to not selected
      } satisfies BudgetItem;
    });
  };

  if (isService && !isProduct) {
    return {
      items: makeItems(['processing']),
      infoMessage: "Most service businesses have minimal Cost of Goods Sold (COGS). You can add items if you have direct costs.",
    };
  }

  if (isDigitalSoftware && !isProduct) {
    return {
      items: makeItems(['processing']),
      infoMessage: "Digital/software businesses typically have minimal COGS beyond payment processing fees.",
    };
  }

  if (isProduct) {
    return {
      items: makeItems(['materials', 'manufacturing', 'packaging', 'processing']),
      infoMessage: undefined,
    };
  }

  return {
    items: [],
    infoMessage: "Your business type typically doesn't have Cost of Goods Sold (COGS). Add items if needed.",
  };
}

type COGSTableProps = {
  items: BudgetItem[];
  onChange: (items: BudgetItem[]) => void;
  onRemoveItem?: (id: string, name: string) => void;
  currency?: string;
  infoMessage?: string;
  selectedItemIds: Set<string>;
  onToggleItemSelection: (itemId: string, isSelected: boolean) => void;
  onToggleAllSelection: (isSelected: boolean) => void;
  onAddLineItem: (category: 'cogs') => void; // New prop
};

const COGSTable: React.FC<COGSTableProps> = ({
  items,
  onChange,
  onRemoveItem,
  currency = '$',
  infoMessage,
  selectedItemIds, // New prop
  onToggleItemSelection, // New prop
  onToggleAllSelection, // New prop
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

  const getVarianceDisplay = (item: BudgetItem): { valueText: string; className: string } => {
    const budget = Number(item.estimated_amount) || 0;
    const actualNum = Number(item.actual_amount) || 0;
    const variance = budget - actualNum;

    if (variance > 0) return { valueText: formatMoney(variance, currency), className: 'text-green-600 font-semibold' };
    if (variance < 0) return { valueText: formatMoney(variance, currency), className: 'text-red-600 font-semibold' };
    return { valueText: formatMoney(0, currency), className: 'text-gray-500' };
  };

  const getSmartStep = useCallback((currentValue: number): number => {
    if (currentValue < 100) return 10;
    if (currentValue < 1000) return 100;
    return 1000;
  }, []);

  return (
    <div className="w-full">
      {infoMessage && (
        <div className="mb-3 rounded-lg border border-teal-200/60 bg-teal-50/60 px-3 py-2 text-sm text-gray-700">
          {infoMessage}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-gray-200/60 bg-white p-5">
          <p className="text-sm text-gray-600">{infoMessage || "Your business type typically doesn't have Cost of Goods Sold (COGS)."}</p>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => onAddLineItem('cogs')} size="sm" className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-sm flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Line Item</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto rounded-xl border border-gray-200/60">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-gradient-to-r from-gray-50 to-gray-100/60 border-b border-gray-200/60">
                  <th className="px-3 py-3.5 w-10">
                    <Tooltip>
                      <TooltipTrigger asChild><div className="flex items-center justify-center"><Checkbox checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false} onCheckedChange={(v) => onToggleAllSelection(Boolean(v))} aria-label="Select all COGS line items" /></div></TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px]">Select items to discuss with Angel AI</TooltipContent>
                    </Tooltip>
                  </th>
                  <th className="px-3 py-3.5">Line Item</th>
                  <th className="px-3 py-3.5 w-40">
                    <Tooltip>
                      <TooltipTrigger asChild><span className="flex items-center gap-1 cursor-help">Budget ({currency}) <HelpCircle className="w-3 h-3 text-gray-400" /></span></TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px]">Your estimated/planned cost per period</TooltipContent>
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
                          <TooltipTrigger asChild><div className="flex items-center justify-center pt-2"><Checkbox checked={selectedItemIds.has(item.id)} onCheckedChange={(v) => onToggleItemSelection(item.id, Boolean(v))} aria-label={`Select ${item.name}`} /></div></TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[180px]">Select to discuss with Angel</TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="px-3 py-2.5 align-top"><Input value={item.name} onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })} className="h-9 border-gray-200/80 focus:border-teal-400 focus:ring-teal-400/20" /></td>
                      <td className="px-3 py-2.5 align-top"><CurrencyInput value={item.estimated_amount ?? 0} onChange={(value) => handleUpdateItem(item.id, { estimated_amount: value })} min={0} step={10} getSmartStep={getSmartStep} className="w-full" /></td>
                      <td className="px-3 py-2.5 align-top"><CurrencyInput value={item.actual_amount ?? 0} onChange={(value) => handleUpdateItem(item.id, { actual_amount: value })} min={0} step={10} getSmartStep={getSmartStep} className="w-full" /></td>
                      <td className="px-3 py-2.5 align-top"><div className={`pt-2 text-sm ${varianceDisplay.className}`}>{varianceDisplay.valueText}</div></td>
                      <td className="px-3 py-2.5 align-top"><Input value={item.description || ''} onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })} className="h-9 border-gray-200/80 focus:border-teal-400 focus:ring-teal-400/20" placeholder="Optional notes" /></td>
                      <td className="px-3 py-2.5 align-top"><Button variant="ghost" size="icon" onClick={() => onRemoveItem && onRemoveItem(item.id, item.name)} aria-label={`Remove ${item.name}`} className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></Button></td>
                    </tr>
                  );
                })}
                <tr className="bg-gradient-to-r from-teal-50/60 to-cyan-50/60 font-semibold border-t-2 border-teal-200/40">
                  <td className="px-3 py-3.5" />
                  <td className="px-3 py-3.5 text-gray-900 text-sm">Total Direct Costs</td>
                  <td className="px-3 py-3.5 text-gray-900 text-sm">{formatMoney(totals.budgetTotal, currency)}</td>
                  <td className="px-3 py-3.5 text-gray-900 text-sm">{formatMoney(totals.actualTotal, currency)}</td>
                  <td className="px-3 py-3.5 text-sm">{(() => { const v = totals.budgetTotal - totals.actualTotal; return <span className={v > 0 ? 'text-emerald-600 font-semibold' : v < 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}>{formatMoney(v, currency)}</span>; })()}</td>
                  <td className="px-3 py-3.5" />
                  <td className="px-3 py-3.5" />
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={() => onAddLineItem('cogs')} size="sm" className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-sm flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Line Item</Button>
          </div>
        </>
      )}
    </div>
  );
};

export default COGSTable;