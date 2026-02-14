import React from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface BudgetSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  currency?: string;
  className?: string;
  disabled?: boolean;
}

const BudgetSlider: React.FC<BudgetSliderProps> = ({
  value,
  onChange,
  min,
  max,
  step = 100,
  label,
  currency = '$',
  className,
  disabled = false
}) => {
  const formatCurrency = (val: number | null | undefined) => {
    const safeVal = Number(val) || 0;
    return `${currency}${safeVal.toLocaleString()}`;
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          <span className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
            {formatCurrency(value)}
          </span>
        </div>
      )}
      
      <div className="relative py-2">
        <Slider
          value={[value]}
          onValueChange={(values) => onChange(values[0])}
          max={max}
          min={min}
          step={step}
          disabled={disabled}
          className="w-full [&_[data-slot=slider-track]]:bg-gray-200 [&_[data-slot=slider-track]]:h-3 [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-teal-500 [&_[data-slot=slider-range]]:to-cyan-600 [&_[data-slot=slider-thumb]]:bg-teal-600 [&_[data-slot=slider-thumb]]:border-teal-700 [&_[data-slot=slider-thumb]]:w-6 [&_[data-slot=slider-thumb]]:h-6 [&_[data-slot=slider-thumb]]:shadow-lg [&_[data-slot=slider-thumb]]:ring-2 [&_[data-slot=slider-thumb]]:ring-teal-300 [&_[data-slot=slider-thumb]]:cursor-pointer"
        />
        
        <div className="flex justify-between mt-3">
          <span className="text-xs text-gray-500 font-medium">{formatCurrency(min)}</span>
          <span className="text-xs text-gray-500 font-medium">{formatCurrency(max)}</span>
        </div>
      </div>
    </div>
  );
};

export default BudgetSlider;
