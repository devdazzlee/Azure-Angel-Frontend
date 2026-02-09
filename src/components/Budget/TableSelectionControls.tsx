import type { BudgetItem } from "@/types/apiTypes";

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
  const allSelected = items.every(item => selectedItemIds.has(item.id));
  const someSelected = items.some(item => selectedItemIds.has(item.id)) && !allSelected;
  
  return (
    <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={allSelected}
          ref={(input) => {
            if (input) input.indeterminate = someSelected;
          }}
          onChange={(e) => onToggleAll(e.target.checked)}
          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <span className="text-sm font-medium text-gray-700">
          {allSelected ? 'Deselect All' : 'Select All'} ({items.length} items)
        </span>
      </label>
      
      {selectedItemIds.size > 0 && (
        <span className="text-sm text-gray-600">
          {selectedItemIds.size} selected in {sectionName}
        </span>
      )}
    </div>
  );
};

