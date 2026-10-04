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
  onCancel,
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
    } else {
      setSelectedValues((prev) => (prev.includes(value) ? [] : [value]));
    }
  };

  const handleSubmit = () => {
    if (selectedValues.length === 0) return;
    onSubmit(selectedValues.join(', '));
  };

  const handleCancel = () => {
    setSelectedValues([]);
    onCancel?.();
  };

  const isSelected = (option: string) => selectedValues.includes(option);
  const hasSelection = selectedValues.length > 0;

  if (compact) {
    return (
      <div
        className={`rounded-xl border border-slate-200 bg-white shadow-sm ${
          fillHeight ? 'flex h-full min-h-0 flex-1 flex-col' : ''
        }`}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Choose your answer</p>
            <p className="text-xs text-slate-500">
              {isMultiSelect ? 'Select one or more, then submit' : 'Select an option, then submit'}
            </p>
          </div>
          {isMultiSelect && hasSelection ? (
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-medium text-teal-700">
              {selectedValues.length} selected
            </span>
          ) : null}
        </div>

        <div
          className={`px-4 py-3 ${
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
                className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition ${
                  isSelected(option)
                    ? 'border-teal-500 bg-teal-50 text-teal-800 ring-1 ring-teal-200'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                aria-pressed={isSelected(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={disabled}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || !hasSelection}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              hasSelection
                ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-sm hover:from-teal-600 hover:to-blue-600'
                : 'bg-slate-200 text-slate-400'
            }`}
          >
            {hasSelection ? 'Submit answer' : 'Select first'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 text-center">
        <h3 className="mb-2 text-lg font-bold text-gray-900">Choose Your Answer</h3>
        <p className="text-sm text-gray-500">
          {isMultiSelect
            ? 'Select one or more options, then click Submit'
            : 'Select an option, then click Submit'}
        </p>
      </div>

      <div className={`mb-6 grid gap-3 ${isYesNoQuestion ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {options.map((option, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleOptionToggle(option)}
            disabled={disabled}
            tabIndex={-1}
            className={`
              group relative rounded-xl border-2 p-4 text-left transition-all duration-200
              ${
                isSelected(option)
                  ? 'border-teal-500 bg-teal-50 shadow-md ring-2 ring-teal-200'
                  : 'border-gray-200 bg-white hover:border-gray-400'
              }
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              ${isYesNoQuestion ? 'text-center' : ''}
            `}
            aria-label={`Select option: ${option}`}
            aria-pressed={isSelected(option)}
          >
            <div className={`flex items-center gap-3 ${isYesNoQuestion ? 'flex-col' : ''}`}>
              {!isYesNoQuestion && (
                <div
                  className={`
                  flex h-5 w-5 flex-shrink-0 items-center justify-center rounded${isMultiSelect ? '-md' : '-full'} border-2 transition-colors duration-200
                  ${
                    isSelected(option)
                      ? 'border-teal-500 bg-teal-500'
                      : 'border-gray-300 bg-white'
                  }
                `}
                >
                  {isSelected(option) && (
                    <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <span
                  className={`
                  text-lg font-medium transition-colors duration-200
                  ${isSelected(option) ? 'text-teal-700' : 'text-gray-700'}
                `}
                >
                  {option}
                </span>
              </div>

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

      {isMultiSelect && hasSelection && (
        <div className="mb-4 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {selectedValues.length} option{selectedValues.length > 1 ? 's' : ''} selected
          </span>
        </div>
      )}

      <div className="mt-2 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={disabled}
          className="rounded-xl border-2 border-gray-300 bg-white px-6 py-2.5 font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Cancel</span>
          </div>
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !hasSelection}
          className={`
            rounded-xl px-6 py-2.5 font-medium shadow-lg transition-all duration-200
            disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none
            ${
              hasSelection
                ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white hover:from-teal-600 hover:to-blue-600 hover:shadow-xl hover:scale-105'
                : 'bg-gray-200 text-gray-400'
            }
          `}
        >
          <div className="flex items-center justify-center gap-1.5">
            {hasSelection && <span className="w-4 flex-shrink-0" aria-hidden="true" />}
            <span>{hasSelection ? 'Submit Answer' : 'Select an option first'}</span>
            {hasSelection && (
              <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

export default QuestionDropdown;
