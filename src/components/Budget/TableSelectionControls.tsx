import type { BudgetItem } from "@/types/apiTypes";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { MessageSquare } from "lucide-react";

// Add this component above each budget table
export const TableSelectionControls = ({ 
  items, 
  selectedItemIds, 
  onToggleAll,
  sectionName 
}: {
  items: BudgetItem[];
  selectedItemIds: Set<string>;
  onToggleAll: (isSelected: boolean) => void;
  sectionName: string;
}) => {
  const allSelected = items.length > 0 && items.every(item => selectedItemIds.has(item.id));
  const someSelected = items.some(item => selectedItemIds.has(item.id)) && !allSelected;
  
  return (
    <div className="flex items-center gap-4 mb-4 p-3 bg-teal-50/40 rounded-xl border border-teal-200/40">
      <Tooltip>
        <TooltipTrigger asChild>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <Checkbox
              checked={allSelected ? true : someSelected ? 'indeterminate' : false}
              onCheckedChange={(v) => onToggleAll(Boolean(v))}
              aria-label={`${allSelected ? 'Deselect' : 'Select'} all ${sectionName} items`}
            />
            <span className="text-sm font-medium text-gray-700">
              {allSelected ? 'Deselect All' : 'Select All'} ({items.length} items)
            </span>
          </label>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px]">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span>Select items to discuss with Angel — get AI-powered guidance on your budget</span>
          </div>
        </TooltipContent>
      </Tooltip>
      
      {selectedItemIds.size > 0 && (
        <span className="text-xs text-teal-700 font-semibold bg-teal-100/70 px-2.5 py-1 rounded-full flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          {selectedItemIds.size} selected for Angel
        </span>
      )}
    </div>
  );
};
