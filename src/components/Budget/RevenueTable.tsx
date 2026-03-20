import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { RevenueStream } from '../../types/apiTypes';
import { FaTrash, FaPlus, FaDollarSign } from 'react-icons/fa';
import { BiRename } from "react-icons/bi";
import { HelpCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/formatters'; // Import from new formatters
import CurrencyInput from '../ui/CurrencyInput'; // Import CurrencyInput


interface RevenueTableProps {
  items: RevenueStream[]; // Changed from initialRevenueStreams
  onRevenueStreamsChange: (revenueStreams: RevenueStream[]) => void;
  onTotalMonthlyRevenueChange: (totalRevenue: number) => void;
  currency?: string;
  selectedItemIds: Set<string>; // New prop for selected item IDs
  onToggleItemSelection: (itemId: string, isSelected: boolean) => void; // New prop for toggling individual item selection
  onToggleAllSelection: (itemIds: string[], isSelected: boolean) => void; // New prop for toggling all items selection
  onAddLineItem: (category: 'revenue') => void; // New prop for adding line item
}

const RevenueTable: React.FC<RevenueTableProps> = ({
  items, // Changed from initialRevenueStreams
  onRevenueStreamsChange,
  onTotalMonthlyRevenueChange,
  currency = '$',
  selectedItemIds,
  onToggleItemSelection,
  onToggleAllSelection,
  onAddLineItem, // Destructure new prop
}) => {
  const [editingStreamId, setEditingStreamId] = useState<string | null>(null);
  const [editingStreamName, setEditingStreamName] = useState<string>('');

  const calculateTotalMonthlyRevenue = useCallback((streams: RevenueStream[]) => {
    return streams.filter(stream => stream.isSelected).reduce((total, stream) => total + stream.revenueProjection, 0);
  }, []);

  const updateRevenueStream = useCallback((id: string, updates: Partial<RevenueStream>) => {
    const updatedStreams = items.map((stream) =>
      stream.id === id ? { ...stream, ...updates } : stream
    );
    onRevenueStreamsChange(updatedStreams);
  }, [items, onRevenueStreamsChange]);

  const handlePriceChange = useCallback((id: string, value: string) => {
    const estimatedPrice = parseFloat(value);
    if (!isNaN(estimatedPrice) && estimatedPrice >= 0) {
      const updatedStreams = items.map((stream) => {
        if (stream.id === id) {
          const revenueProjection = estimatedPrice * stream.estimatedVolume;
          return { ...stream, estimatedPrice, revenueProjection };
        }
        return stream;
      });
      onRevenueStreamsChange(updatedStreams);
    }
  }, [items, onRevenueStreamsChange]);

  const handleVolumeChange = useCallback((id: string, value: string) => {
    const estimatedVolume = parseInt(value, 10);
    if (!isNaN(estimatedVolume) && estimatedVolume >= 0) {
      const updatedStreams = items.map((stream) => {
        if (stream.id === id) {
          const revenueProjection = stream.estimatedPrice * estimatedVolume;
          return { ...stream, estimatedVolume, revenueProjection };
        }
        return stream;
      });
      onRevenueStreamsChange(updatedStreams);
    }
  }, [items, onRevenueStreamsChange]);

  const handleNameChange = useCallback((id: string, value: string) => {
    updateRevenueStream(id, { name: value });
  }, [updateRevenueStream]);

  const handleRemoveStream = useCallback((id: string) => {
    const updatedStreams = items.filter((stream) => stream.id !== id);
    onRevenueStreamsChange(updatedStreams);
    onToggleItemSelection(id, false); // Deselect if removed
  }, [items, onRevenueStreamsChange, onToggleItemSelection]);

  const handleEditNameClick = useCallback((stream: RevenueStream) => {
    setEditingStreamId(stream.id);
    setEditingStreamName(stream.name);
  }, []);

  const handleSaveNameEdit = useCallback((id: string) => {
    if (editingStreamName.trim()) {
      handleNameChange(id, editingStreamName.trim());
    }
    setEditingStreamId(null);
    setEditingStreamName('');
  }, [editingStreamName, handleNameChange]);

  const totalMonthlyRevenue = useMemo(() => {
    return calculateTotalMonthlyRevenue(items);
  }, [items, calculateTotalMonthlyRevenue]);

  useEffect(() => {
    onTotalMonthlyRevenueChange(totalMonthlyRevenue);
  }, [totalMonthlyRevenue, onTotalMonthlyRevenueChange]);

  const isAllSelected = items.length > 0 && items.every((item) => selectedItemIds.has(item.id));
  const isSomeSelected = items.some((item) => selectedItemIds.has(item.id)) && !isAllSelected;

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto rounded-xl border border-gray-200/60">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-gradient-to-r from-gray-50 to-gray-100/60 border-b border-gray-200/60">
              <th className="px-3 py-3.5 w-10">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-center">
                      <Checkbox checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false} onCheckedChange={(v) => onToggleAllSelection(items.map(i => i.id), Boolean(v))} aria-label="Select all revenue streams" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">Select streams to discuss with Angel AI</TooltipContent>
                </Tooltip>
              </th>
              <th className="px-3 py-3.5">Stream Name</th>
              <th className="px-3 py-3.5 w-36">
                <Tooltip>
                  <TooltipTrigger asChild><span className="flex items-center gap-1 cursor-help">Est. Price <HelpCircle className="w-3 h-3 text-gray-400" /></span></TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">Price per unit/sale for this revenue stream</TooltipContent>
                </Tooltip>
              </th>
              <th className="px-3 py-3.5 w-36">
                <Tooltip>
                  <TooltipTrigger asChild><span className="flex items-center gap-1 cursor-help">Est. Volume <HelpCircle className="w-3 h-3 text-gray-400" /></span></TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">Expected number of units/sales per month</TooltipContent>
                </Tooltip>
              </th>
              <th className="px-3 py-3.5 w-40">
                <Tooltip>
                  <TooltipTrigger asChild><span className="flex items-center gap-1 cursor-help">Revenue Projection <HelpCircle className="w-3 h-3 text-gray-400" /></span></TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">Auto-calculated: Est. Price × Est. Volume</TooltipContent>
                </Tooltip>
              </th>
              <th className="px-3 py-3.5 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-400">No revenue streams added yet.</td></tr>
            ) : (
              items.map((stream, idx) => (
                <tr key={stream.id} className={`group transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} ${stream.isSelected ? 'hover:bg-teal-50/40' : 'opacity-50'}`}>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-center">
                          <Checkbox checked={selectedItemIds.has(stream.id)} onCheckedChange={(v) => onToggleItemSelection(stream.id, Boolean(v))} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[180px]">Select to discuss with Angel</TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="px-3 py-2.5 text-sm text-gray-900 max-w-[200px]">
                    {editingStreamId === stream.id ? (
                      <input type="text" value={editingStreamName} onChange={(e) => setEditingStreamName(e.target.value)} onBlur={() => handleSaveNameEdit(stream.id)} onKeyPress={(e) => { if (e.key === 'Enter') handleSaveNameEdit(stream.id); }} className="p-1.5 border border-teal-300 rounded-lg w-full text-sm focus:ring-teal-400 focus:border-teal-400" autoFocus />
                    ) : (
                      <div className="flex items-center group/name">
                        <span className="font-medium">{stream.name}</span>
                        <button onClick={() => handleEditNameClick(stream)} className="ml-2 text-gray-400 hover:text-teal-600 opacity-0 group-hover/name:opacity-100 transition-opacity" title="Edit Stream Name"><BiRename size={14} /></button>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-sm">
                    <CurrencyInput value={stream.estimatedPrice} onChange={(value) => handlePriceChange(stream.id, String(value))} min={0} step={0.01} disabled={!stream.isSelected} className="w-full" />
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-sm">
                    <input type="number" value={stream.estimatedVolume} onChange={(e) => handleVolumeChange(stream.id, e.target.value)} className="p-2 border border-gray-200/80 rounded-lg w-full text-sm focus:ring-teal-400 focus:border-teal-400" min="0" step="1" disabled={!stream.isSelected} />
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-sm font-semibold text-emerald-600">
                    {formatMoney(stream.revenueProjection, currency)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-right">
                    <button onClick={() => handleRemoveStream(stream.id)} className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove"><FaTrash size={13} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-gradient-to-r from-teal-50/60 to-cyan-50/60 font-semibold border-t-2 border-teal-200/40">
              <td colSpan={4} className="px-3 py-3.5 text-right text-sm font-bold text-gray-900 uppercase">
                Projected Monthly Revenue
              </td>
              <td className="px-3 py-3.5 whitespace-nowrap text-sm font-extrabold text-emerald-600">
                {formatMoney(totalMonthlyRevenue, currency)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={() => onAddLineItem('revenue')} size="sm" className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-sm flex items-center gap-1.5"><FaPlus className="w-3 h-3" /> Add Revenue Stream</Button>
      </div>
    </div>
  );
};

export default RevenueTable;
