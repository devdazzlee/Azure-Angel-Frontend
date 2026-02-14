// Enhanced CurrencyInput with scroll functionality
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import React, { useState, useRef, useEffect, useCallback } from 'react';

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
  value: rawValue,
  onChange,
  min = 0,
  max = 10000000,
  step = 100,
  getSmartStep,
  className = '',
  showSlider = true
}) => {
  // Ensure value is always a valid number, never null/undefined/NaN
  const value = Number(rawValue) || 0;
  
  const [isEditing, setIsEditing] = useState(false);
  const [displayValue, setDisplayValue] = useState(String(value));
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (!isEditing) {
      setDisplayValue(String(value));
    }
  }, [value, isEditing]);
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const currentStep = getSmartStep ? getSmartStep(value) : step;
    const delta = e.deltaY > 0 ? -currentStep : currentStep;
    const newValue = Math.max(min, Math.min(max, value + delta));
    onChange(newValue);
  }, [value, onChange, min, max, step, getSmartStep]);
  
  // Use a fixed tiny step for the slider so dragging is perfectly smooth
  const sliderStep = Math.max(1, Math.round(max / 10000));
  
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.target.value) || 0;
    // Snap to nearest "round" value for cleaner numbers
    const snap = getSmartStep ? getSmartStep(raw) : step;
    const snapped = Math.round(raw / snap) * snap;
    onChange(Math.max(min, Math.min(max, snapped)));
  }, [onChange, min, max, step, getSmartStep]);
  
  const formatDisplay = (val: number | null | undefined) => {
    const safeVal = Number(val) || 0;
    return `$${safeVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Slider fill percentage for custom styling
  const fillPercent = max > min ? ((value - min) / (max - min)) * 100 : 0;
  
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
          className="w-full px-4 py-3 text-lg font-semibold border-2 border-gray-300 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
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
          <div className="relative group">
            <input
              ref={sliderRef}
              type="range"
              min={min}
              max={max}
              step={sliderStep}
              value={value}
              onChange={handleSliderChange}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => setIsDragging(false)}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-transparent relative z-10
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-teal-500
                [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-white
                [&::-webkit-slider-thumb]:shadow-md
                [&::-webkit-slider-thumb]:cursor-grab
                [&::-webkit-slider-thumb]:active:cursor-grabbing
                [&::-webkit-slider-thumb]:hover:bg-teal-600
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-webkit-slider-thumb]:active:scale-125
                [&::-webkit-slider-thumb]:transition-all
                [&::-webkit-slider-thumb]:duration-150
                [&::-webkit-slider-thumb]:-mt-[6px]
                [&::-moz-range-thumb]:appearance-none
                [&::-moz-range-thumb]:w-5
                [&::-moz-range-thumb]:h-5
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-teal-500
                [&::-moz-range-thumb]:border-2
                [&::-moz-range-thumb]:border-white
                [&::-moz-range-thumb]:shadow-md
                [&::-moz-range-thumb]:cursor-grab
                [&::-moz-range-thumb]:active:cursor-grabbing
                [&::-webkit-slider-runnable-track]:rounded-full
                [&::-webkit-slider-runnable-track]:h-2
                [&::-moz-range-track]:rounded-full
                [&::-moz-range-track]:h-2"
              style={{
                background: `linear-gradient(to right, #14b8a6 0%, #0d9488 ${fillPercent}%, #e5e7eb ${fillPercent}%, #e5e7eb 100%)`
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1.5">
            <span>{formatDisplay(min)}</span>
            <span>{formatDisplay(max)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyInput;