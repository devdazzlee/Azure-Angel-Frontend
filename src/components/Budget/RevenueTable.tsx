import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { RevenueStream } from '../../types/apiTypes';
import { FaTrash, FaPlus, FaDollarSign } from 'react-icons/fa';
import { BiRename } from "react-icons/bi";
import { Checkbox } from '@/components/ui/checkbox';
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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Revenue Streams</h3>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                    onCheckedChange={(v) => onToggleAllSelection(items.map(i => i.id), Boolean(v))}
                    aria-label="Select all revenue streams"
                  />
                </div>
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stream Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (USD)</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume (Units/Month)</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Projection</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-3 text-center text-sm text-gray-500">
                  No revenue streams added yet.
                </td>
              </tr>
            ) : (
              items.map((stream) => (
                <tr key={stream.id} className={stream.isSelected ? '' : 'opacity-60 bg-gray-50'}>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedItemIds.has(stream.id)}
                      onChange={(e) => onToggleItemSelection(stream.id, e.target.checked)}
                      className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                    />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {editingStreamId === stream.id ? (
                      <input
                        type="text"
                        value={editingStreamName}
                        onChange={(e) => setEditingStreamName(e.target.value)}
                        onBlur={() => handleSaveNameEdit(stream.id)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveNameEdit(stream.id);
                          }
                        }}
                        className="p-1 border border-gray-300 rounded-md w-full"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center group">
                        <span>{stream.name}</span>
                        {stream.isCustom && (
                          <button
                            onClick={() => handleEditNameClick(stream)}
                            className="ml-2 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            title="Edit Stream Name"
                          >
                            <BiRename size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    <CurrencyInput
                      value={stream.estimatedPrice}
                      onChange={(value) => handlePriceChange(stream.id, String(value))}
                      min={0}
                      step={0.01}
                      disabled={!stream.isSelected}
                      className="w-full"
                    />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    <input
                      type="number"
                      value={stream.estimatedVolume}
                      onChange={(e) => handleVolumeChange(stream.id, e.target.value)}
                      className="p-2 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="1"
                      disabled={!stream.isSelected}
                    />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {formatMoney(stream.revenueProjection, currency)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                    {stream.isCustom && (
                      <button
                        onClick={() => handleRemoveStream(stream.id)}
                        className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        title="Remove Custom Stream"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <th colSpan={4} className="px-4 py-2 text-right text-base font-bold text-gray-800 uppercase">
                Total Projected Monthly Revenue:
              </th>
              <td className="px-4 py-2 whitespace-nowrap text-base font-bold text-gray-900">
                {formatMoney(totalMonthlyRevenue, currency)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="mt-3 flex justify-end">
        <Button onClick={() => onAddLineItem('revenue')} className="flex items-center gap-2">
          <FaPlus className="w-4 h-4" />
          Add Line Item
        </Button>
      </div>
    </div>
  );
};

export default RevenueTable;
