// Azure-Angel-Frontend/src/components/ui/CurrencyInput.tsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Slider } from './slider';
import { Input } from './input';
import { FaDollarSign } from 'react-icons/fa';
import {
  formatCurrency,
  parseCurrency,
  formatInputCurrency
} from '../../lib/currency-utils';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  currencySymbol?: string;
  label?: string;
  id?: string;
  /** Show the slider below the input. Default: false (compact mode for tables) */
  showSlider?: boolean;
  /** Alternate control below input. Use "buttons" for a clean -/+ adjuster without slider thumb. */
  adjustmentControl?: 'none' | 'slider' | 'buttons';
  getSmartStep?: (currentValue: number) => number;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value: rawValue,
  onChange,
  min = 0,
  max = 1000000000,
  step: propStep = 1,
  disabled,
  className,
  currencySymbol = '$',
  label,
  id,
  showSlider = false, // DEFAULT: no slider (compact for tables)
  adjustmentControl = 'none',
  getSmartStep,
}) => {
  const value = Number(rawValue) || 0;
  const [inputValue, setInputValue] = useState<string>(formatCurrency(value, currencySymbol));
  const inputRef = useRef<HTMLInputElement>(null);

  const effectiveStep = useMemo(() => {
    if (getSmartStep) return getSmartStep(value);
    if (propStep === 1) {
      if (value < 100) return 10;
      if (value < 1000) return 100;
      if (value < 10000) return 1000;
      return 10000;
    }
    return propStep;
  }, [value, propStep, getSmartStep]);

  const sliderStep = useMemo(() => Math.max(1, Math.round(max / 5000)), [max]);
  const useSliderControl = adjustmentControl === 'slider' || (adjustmentControl === 'none' && showSlider);
  const useButtonControl = adjustmentControl === 'buttons';

  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) {
      setInputValue(formatCurrency(value, currencySymbol));
    }
  }, [value, currencySymbol]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setInputValue(formatInputCurrency(rawValue, currencySymbol));
    const parsedValue = parseCurrency(rawValue);
    if (!isNaN(parsedValue) && parsedValue !== value) {
      onChange(parsedValue);
    }
  }, [onChange, currencySymbol, value]);

  const handleInputBlur = useCallback(() => {
    setInputValue(formatCurrency(value, currencySymbol));
  }, [value, currencySymbol]);

  const handleSliderChange = useCallback((sliderValues: number[]) => {
    const newValue = sliderValues[0];
    if (newValue !== value) onChange(newValue);
  }, [onChange, value]);

  const nudgeValue = useCallback((direction: -1 | 1) => {
    if (disabled) return;
    const next = value + direction * effectiveStep;
    const clamped = Math.max(min, Math.min(max, next));
    if (clamped !== value) onChange(clamped);
  }, [disabled, value, effectiveStep, min, max, onChange]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    const direction = e.deltaY < 0 ? 1 : -1;
    const newValue = value + direction * effectiveStep;
    const clampedValue = Math.max(min, Math.min(max, newValue));
    if (clampedValue !== value) onChange(clampedValue);
  }, [value, onChange, min, max, effectiveStep, disabled]);

  return (
    <div className={className}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="relative flex items-center" onWheel={handleWheel}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaDollarSign className="h-4 w-4 text-gray-400" />
        </div>
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          min={min}
          max={max}
          step={propStep}
          disabled={disabled}
          className="pl-8 pr-2 w-full h-9 text-sm"
          inputMode="decimal"
        />
      </div>
      {useSliderControl && (
        <div className="mt-2">
          <Slider
            min={min}
            max={max}
            step={sliderStep}
            value={[value]}
            onValueChange={handleSliderChange}
            disabled={disabled}
            className="w-full"
          />
        </div>
      )}
      {useButtonControl && (
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => nudgeValue(-1)}
              disabled={disabled || value <= min}
              className="h-7 w-7 shrink-0 rounded-md border border-teal-200 bg-teal-50 text-teal-700 text-sm font-semibold hover:bg-teal-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Decrease amount"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => nudgeValue(1)}
              disabled={disabled || value >= max}
              className="h-7 w-7 shrink-0 rounded-md border border-teal-200 bg-teal-50 text-teal-700 text-sm font-semibold hover:bg-teal-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Increase amount"
            >
              +
            </button>
          </div>
          <div className="w-full rounded-md bg-gray-50 border border-gray-200 text-[10px] text-gray-600 text-center leading-tight px-1.5 py-1">
            Adjust by {currencySymbol}{effectiveStep.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyInput;
