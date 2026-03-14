import React, { useState } from 'react';

interface QuestionDropdownProps {
  options: string[];
  onSubmit: (value: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

const QuestionDropdown: React.FC<QuestionDropdownProps> = ({
  options,
  onSubmit,
  onCancel,
  placeholder = "Select an option...",
  disabled = false
}) => {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const isYesNoQuestion = options.length === 2 &&
    options.some(opt => opt.toLowerCase().includes('yes')) &&
    options.some(opt => opt.toLowerCase().includes('no'));

  const isMultiSelect = !isYesNoQuestion && options.length > 2;

  const handleOptionToggle = (value: string) => {
    if (disabled) return;

    if (isMultiSelect) {
      setSelectedValues(prev =>
        prev.includes(value)
          ? prev.filter(v => v !== value)
          : [...prev, value]
      );
    } else {
      setSelectedValues(prev =>
        prev.includes(value) ? [] : [value]
      );
    }
  };

  const handleSubmit = () => {
    if (selectedValues.length === 0) return;
    const answer = selectedValues.join(', ');
    onSubmit(answer);
  };

  const handleCancel = () => {
    setSelectedValues([]);
    onCancel?.();
  };

  const isSelected = (option: string) => selectedValues.includes(option);
  const hasSelection = selectedValues.length > 0;

  return (
    <div className="w-full bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Choose Your Answer
        </h3>
        <p className="text-gray-500 text-sm">
          {isMultiSelect
            ? 'Select one or more options, then click Submit'
            : 'Select an option, then click Submit'}
        </p>
      </div>

      {/* Options Grid */}
      <div className={`grid gap-3 mb-6 ${isYesNoQuestion ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {options.map((option, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleOptionToggle(option)}
            disabled={disabled}
            tabIndex={-1}
            className={`
              group relative p-4 rounded-xl border-2 transition-all duration-200 text-left
              ${isSelected(option)
                ? 'border-teal-500 bg-teal-50 shadow-md ring-2 ring-teal-200'
                : 'border-gray-200 bg-white hover:border-gray-400'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${isYesNoQuestion ? 'text-center' : ''}
            `}
            aria-label={`Select option: ${option}`}
            aria-pressed={isSelected(option)}
          >
            <div className={`flex items-center gap-3 ${isYesNoQuestion ? 'flex-col' : ''}`}>
              {/* Checkbox / Radio — no decorative emojis (accessibility + clarity for GKY e.g. business type) */}
              {!isYesNoQuestion && (
                <div className={`
                  w-5 h-5 flex-shrink-0 rounded${isMultiSelect ? '-md' : '-full'} border-2 flex items-center justify-center transition-colors duration-200
                  ${isSelected(option)
                    ? 'border-teal-500 bg-teal-500'
                    : 'border-gray-300 bg-white'
                  }
                `}>
                  {isSelected(option) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              )}

              {/* Text only */}
              <div className="flex-1 min-w-0">
                <span className={`
                  font-medium transition-colors duration-200 text-lg
                  ${isSelected(option) ? 'text-teal-700' : 'text-gray-700'}
                `}>
                  {option}
                </span>
              </div>

              {/* Selection Indicator (for Yes/No) */}
              {isYesNoQuestion && isSelected(option) && (
                <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Selected count badge (multi-select only) */}
      {isMultiSelect && hasSelection && (
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {selectedValues.length} option{selectedValues.length > 1 ? 's' : ''} selected
          </span>
        </div>
      )}

      {/* Submit & Cancel Buttons */}
      <div className="flex items-center justify-center gap-3 mt-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={disabled}
          className="
            px-6 py-2.5 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50
            text-gray-700 font-medium rounded-xl shadow-sm hover:shadow
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            px-8 py-2.5 font-medium rounded-xl shadow-lg
            transition-all duration-200
            disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
            ${hasSelection
              ? 'bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white hover:shadow-xl transform hover:scale-105'
              : 'bg-gray-200 text-gray-400'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <span>{hasSelection ? 'Submit Answer' : 'Select an option first'}</span>
            {hasSelection && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
