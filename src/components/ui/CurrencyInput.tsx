// Azure-Angel-Frontend/src/components/ui/CurrencyInput.tsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Slider } from './slider'; // Assuming shadcn/ui Slider component
import { Input } from './input'; // Assuming shadcn/ui Input component
import { FaDollarSign } from 'react-icons/fa';
import {
  formatCurrency,
  parseCurrency,
  formatInputCurrency
} from '../../lib/currency-utils'; // Adjust path as needed

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
  // Callback to suggest a new step value based on the current value for "smart defaults"
  // If provided, the component will use this to determine the step for scroll/slider
  getSmartStep?: (currentValue: number) => number;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  min = 0,
  max = 1000000000, // A very large default max
  step: propStep = 1, // Default step from props
  disabled,
  className,
  currencySymbol = '$',
  label,
  id,
  getSmartStep,
}) => {
  // Internal state for the input field's string value
  const [inputValue, setInputValue] = useState<string>(formatCurrency(value, currencySymbol));
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine the effective step for slider/scroll based on prop or smart defaults
  const effectiveStep = useMemo(() => {
    if (getSmartStep) {
      return getSmartStep(value);
    }
    
    // If no smart step provided, use intelligent default based on value range
    if (propStep === 1) { // Default step, apply smart logic
      if (value < 100) return 10;
      if (value < 1000) return 100;
      if (value < 10000) return 1000;
      return 10000;
    }
    
    return propStep;
  }, [value, propStep, getSmartStep]);


  // Update internal input value when the external `value` prop changes
  useEffect(() => {
    // Only update if the input is not focused to avoid disrupting user typing
    if (inputRef.current && document.activeElement !== inputRef.current) {
      setInputValue(formatCurrency(value, currencySymbol));
    }
  }, [value, currencySymbol]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setInputValue(formatInputCurrency(rawValue, currencySymbol)); // Format for display
    const parsedValue = parseCurrency(rawValue);
    // Only call onChange if the parsed value is a valid number and different from current prop value
    if (!isNaN(parsedValue) && parsedValue !== value) {
      onChange(parsedValue);
    }
  }, [onChange, currencySymbol, value]);

  const handleInputBlur = useCallback(() => {
    // Re-format the input value to the standard currency format on blur
    setInputValue(formatCurrency(value, currencySymbol));
  }, [value, currencySymbol]);

  const handleSliderChange = useCallback((sliderValues: number[]) => {
    const newValue = sliderValues[0];
    if (newValue !== value) {
      onChange(newValue);
    }
  }, [onChange, value]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (disabled) return;

    e.preventDefault(); // Prevent page scrolling

    const direction = e.deltaY < 0 ? 1 : -1; // -1 for scroll down, 1 for scroll up
    const newValue = value + direction * effectiveStep;
    const clampedValue = Math.max(min, Math.min(max, newValue));

    if (clampedValue !== value) {
      onChange(clampedValue);
    }
  }, [value, onChange, min, max, effectiveStep, disabled]);

  return (
    <div className={className}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="relative flex items-center mb-4" onWheel={handleWheel}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaDollarSign className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          ref={inputRef}
          id={id}
          type="text" // Use text type for custom formatting
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          min={min}
          max={max}
          step={propStep} // Pass original step to input for validation if needed, though not directly used for number type
          disabled={disabled}
          className="pl-9 pr-2 w-full"
          inputMode="decimal" // Hint for mobile keyboards
        />
      </div>
      <Slider
        min={min}
        max={max}
        step={effectiveStep}
        value={[value]}
        onValueChange={handleSliderChange}
        disabled={disabled}
        className="w-full"
      />
    </div>
  );
};

export default CurrencyInput;
