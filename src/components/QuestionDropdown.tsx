import React, { useState } from 'react';

interface QuestionDropdownProps {
  options: string[];
  onSubmit: (value: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  disabled?: boolean;
  /** Denser chips for constrained layouts (e.g. guest chat). */
  compact?: boolean;
  fillHeight?: boolean;
}

const QuestionDropdown: React.FC<QuestionDropdownProps> = ({
  options,
  onSubmit,
  onCancel: _onCancel,
  disabled = false,
  compact = false,
  fillHeight = false,
}) => {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const isYesNoQuestion =
    options.length === 2 &&
    options.some((opt) => opt.toLowerCase().includes('yes')) &&
    options.some((opt) => opt.toLowerCase().includes('no'));

  const isMultiSelect = !isYesNoQuestion && options.length > 2;

  const handleOptionToggle = (value: string) => {
    if (disabled) return;

    if (isMultiSelect) {
      setSelectedValues((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
      );
      return;
    }

    setSelectedValues((prev) => (prev.includes(value) ? [] : [value]));
  };

  const handleSubmit = () => {
    if (selectedValues.length === 0) return;
    onSubmit(isMultiSelect ? selectedValues.join(', ') : selectedValues[0]);
  };

  const isSelected = (option: string) => selectedValues.includes(option);
  const hasSelection = selectedValues.length > 0;

  const confirmButtonClass = hasSelection
    ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-md hover:from-teal-600 hover:to-blue-600'
    : 'cursor-not-allowed bg-gray-200 text-gray-500';

  const optionBtnClass = (selected: boolean) =>
    [
      'rounded-xl border-2 text-left transition-all duration-200 text-base leading-snug',
      selected
        ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200'
        : 'border-gray-200 bg-white hover:border-gray-400',
      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
    ].join(' ');

  if (compact) {
    return (
      <div
        className={`rounded-xl border border-slate-200 bg-white shadow-sm ${
          fillHeight ? 'flex h-full min-h-0 flex-1 flex-col' : ''
        }`}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5 sm:px-4 sm:py-3">
          <div>
            <p className="text-base font-semibold text-slate-900">Choose your answer</p>
            <p className="text-sm text-slate-500">
              {isMultiSelect
                ? 'Select one or more, then confirm'
                : 'Select an option, then confirm'}
            </p>
          </div>
          {isMultiSelect && hasSelection ? (
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
              {selectedValues.length} selected
            </span>
          ) : null}
        </div>

        <div
          className={`px-3 py-2.5 sm:px-4 sm:py-3 ${
            fillHeight ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain' : ''
          }`}
        >
          <div className={`grid gap-2 ${isYesNoQuestion ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleOptionToggle(option)}
                disabled={disabled}
                className={`${optionBtnClass(isSelected(option))} px-3 py-3 font-medium sm:py-2.5 ${
                  isYesNoQuestion ? 'text-center' : ''
                }`}
                aria-pressed={isSelected(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 justify-center border-t border-slate-100 px-3 py-3 sm:px-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || !hasSelection}
            className={`w-full rounded-lg px-4 py-3 text-base font-semibold transition sm:max-w-xs ${confirmButtonClass}`}
          >
            Confirm selection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4 md:p-5">
      <div className="mb-3 text-center sm:mb-4">
        <h3 className="text-base font-bold text-gray-900 sm:text-lg">Choose your answer</h3>
        <p className="mt-1 text-sm text-gray-500">
          {isMultiSelect
            ? 'Select one or more options, then confirm'
            : 'Select an option, then confirm'}
        </p>
      </div>

      <div className={`grid gap-2 sm:gap-3 ${isYesNoQuestion ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {options.map((option, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleOptionToggle(option)}
            disabled={disabled}
            className={`${optionBtnClass(isSelected(option))} p-3 sm:p-4 ${
              isYesNoQuestion ? 'text-center' : ''
            }`}
            aria-label={`Select option: ${option}`}
            aria-pressed={isSelected(option)}
          >
            <div className={`flex items-center gap-3 ${isYesNoQuestion ? 'flex-col justify-center' : ''}`}>
              {isMultiSelect && (
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                    isSelected(option) ? 'border-teal-500 bg-teal-500' : 'border-gray-300 bg-white'
                  }`}
                >
                  {isSelected(option) && (
                    <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              )}

              <span
                className={`min-w-0 flex-1 font-medium ${
                  isSelected(option) ? 'text-teal-700' : 'text-gray-800'
                }`}
              >
                {option}
              </span>

              {isYesNoQuestion && isSelected(option) && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {isMultiSelect && hasSelection ? (
        <div className="mt-3 flex justify-center sm:mt-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-700">
            {selectedValues.length} option{selectedValues.length > 1 ? 's' : ''} selected
          </span>
        </div>
      ) : null}

      <div className="mt-4 flex justify-center sm:mt-5">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !hasSelection}
          className={`w-full rounded-xl px-6 py-3 text-base font-semibold transition sm:max-w-sm sm:py-2.5 ${confirmButtonClass}`}
        >
          Confirm selection
        </button>
      </div>
    </div>
  );
};

export default QuestionDropdown;
