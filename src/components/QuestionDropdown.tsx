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

  // Yes/No → single select; everything else → multi-select
  const isMultiSelect = !isYesNoQuestion && options.length > 2;

  const handleOptionToggle = (value: string) => {
    if (disabled) return;

    if (isMultiSelect) {
      // Multi-select: toggle the clicked option
      setSelectedValues(prev =>
        prev.includes(value)
          ? prev.filter(v => v !== value)
          : [...prev, value]
      );
    } else {
      // Single-select: replace selection (but do NOT auto-submit)
      setSelectedValues(prev =>
        prev.includes(value) ? [] : [value]
      );
    }
  };

  const handleSubmit = () => {
    if (selectedValues.length === 0) return;
    // Join multi-select values with ", " so the backend receives a clean string
    const answer = selectedValues.join(', ');
    onSubmit(answer);
  };

  const handleCancel = () => {
    setSelectedValues([]);
    onCancel?.();
  };

  const getOptionIcon = (option: string) => {
    const optionLower = option.toLowerCase();
    if (optionLower.includes('yes')) return '✅';
    if (optionLower.includes('no')) return '❌';
    if (optionLower.includes('full-time')) return '💼';
    if (optionLower.includes('part-time')) return '⏰';
    if (optionLower.includes('student')) return '🎓';
    if (optionLower.includes('unemployed')) return '🔍';
    if (optionLower.includes('freelancer') || optionLower.includes('self-employed')) return '🚀';
    if (optionLower.includes('other')) return '📝';
    return '🔹';
  };

  const isSelected = (option: string) => selectedValues.includes(option);
  const hasSelection = selectedValues.length > 0;

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-teal-50 rounded-xl p-6 shadow-lg border border-white/50">
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {isYesNoQuestion ? 'Choose Your Answer' : 'Choose Your Answer'}
        </h3>
        <p className="text-gray-600 text-sm">
          {isYesNoQuestion
            ? 'Select Yes or No then click Submit'
            : isMultiSelect
              ? 'Select one or more options then click Submit'
              : 'Select the option that best describes your situation'
          }
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
                ? 'border-teal-500 bg-gradient-to-r from-teal-50 to-blue-50 shadow-md transform scale-[1.02]'
                : 'border-gray-200 bg-white hover:border-teal-300 hover:shadow-md hover:transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-offset-2'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${isYesNoQuestion ? 'text-center' : ''}
            `}
            aria-label={`Select option: ${option}`}
            aria-pressed={isSelected(option)}
          >
            <div className={`flex items-center gap-3 ${isYesNoQuestion ? 'flex-col' : ''}`}>
              {/* Checkbox / Radio indicator */}
              {!isYesNoQuestion && (
                <div className={`
                  w-5 h-5 flex-shrink-0 rounded${isMultiSelect ? '-md' : '-full'} border-2 flex items-center justify-center transition-all duration-200
                  ${isSelected(option)
                    ? 'border-teal-500 bg-teal-500'
                    : 'border-gray-300 bg-white group-hover:border-teal-400'
                  }
                `}>
                  {isSelected(option) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              )}

              {/* Icon */}
              <div className={`
                ${isYesNoQuestion ? 'w-16 h-16' : 'w-10 h-10'} rounded-full flex items-center justify-center text-lg transition-all duration-200
                ${isSelected(option)
                  ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 group-hover:bg-teal-100'
                }
              `}>
                {getOptionIcon(option)}
              </div>

              {/* Text */}
              <div className="flex-1">
                <span className={`
                  font-medium transition-colors duration-200 text-lg
                  ${isSelected(option) ? 'text-teal-700' : 'text-gray-700 group-hover:text-teal-700'}
                `}>
                  {option}
                </span>
              </div>

              {/* Selection Indicator (for Yes/No) */}
              {isYesNoQuestion && isSelected(option) && (
                <div className="w-6 h-6 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>

            {/* Hover Effect Overlay */}
            <div className={`
              absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/5 to-blue-500/5
              transition-opacity duration-200 pointer-events-none
              ${isSelected(option) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
            `} />
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
          className="
            px-8 py-2.5 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600
            text-white font-medium rounded-xl shadow-lg hover:shadow-xl
            transition-all duration-200 transform hover:scale-105
            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg
          "
        >
          <div className="flex items-center gap-2">
            <span>Submit</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center gap-2">
          <div className="flex gap-1">
            {options.map((option, index) => (
              <div
                key={index}
                className={`
                  w-2 h-2 rounded-full transition-all duration-200
                  ${isSelected(option)
                    ? 'bg-gradient-to-r from-teal-500 to-blue-500 scale-125'
                    : 'bg-gray-300'
                  }
                `}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-2">
            {hasSelection
              ? `${selectedValues.length} selected`
              : 'Choose an option'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuestionDropdown;
