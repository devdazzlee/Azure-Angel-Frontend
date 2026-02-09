// Enhanced CurrencyInput with scroll functionality
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  getSmartStep?: (currentValue: number) => number;
  className?: string;
  showSlider?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  min = 0,
  max = 10000000,
  step = 100,
  getSmartStep,
  className = '',
  showSlider = true
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [displayValue, setDisplayValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (!isEditing) {
      setDisplayValue(value.toString());
    }
  }, [value, isEditing]);
  
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const currentStep = getSmartStep ? getSmartStep(value) : step;
    const delta = e.deltaY > 0 ? -currentStep : currentStep;
    const newValue = Math.max(min, Math.min(max, value + delta));
    onChange(newValue);
  };
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };
  
  const formatDisplay = (val: number) => {
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isEditing ? displayValue : formatDisplay(value)}
          onChange={(e) => setDisplayValue(e.target.value.replace(/[^0-9.]/g, ''))}
          onFocus={() => {
            setIsEditing(true);
            setDisplayValue(value.toString());
          }}
          onBlur={() => {
            setIsEditing(false);
            const numValue = parseFloat(displayValue) || 0;
            onChange(Math.max(min, Math.min(max, numValue)));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              inputRef.current?.blur();
            }
          }}
          onWheel={handleWheel}
          className="w-full px-4 py-3 text-lg font-semibold border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => {
              const currentStep = getSmartStep ? getSmartStep(value) : step;
              onChange(Math.min(max, value + currentStep));
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ArrowUpRight className="w-3 h-3 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={() => {
              const currentStep = getSmartStep ? getSmartStep(value) : step;
              onChange(Math.max(min, value - currentStep));
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ArrowDownRight className="w-3 h-3 text-gray-600" />
          </button>
        </div>
      </div>
      
      {showSlider && (
        <div className="px-2">
          <input
            type="range"
            min={min}
            max={max}
            step={getSmartStep ? getSmartStep(value) : step}
            value={value}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatDisplay(min)}</span>
            <span>{formatDisplay(max)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyInput;