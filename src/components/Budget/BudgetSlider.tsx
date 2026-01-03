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
  const formatCurrency = (val: number) => {
    return `${currency}${val.toLocaleString()}`;
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(value)}
          </span>
        </div>
      )}
      
      <div className="relative">
        <Slider
          value={[value]}
          onValueChange={(values) => onChange(values[0])}
          max={max}
          min={min}
          step={step}
          disabled={disabled}
          className="w-full"
        />
        
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-500">{formatCurrency(min)}</span>
          <span className="text-xs text-gray-500">{formatCurrency(max)}</span>
        </div>
      </div>
    </div>
  );
};

export default BudgetSlider;
