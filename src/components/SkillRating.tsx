import React, { useState } from 'react';

interface SkillRatingProps {
  skill: string;
  emoji: string;
  value: number;
  onChange: (value: number) => void;
  compact?: boolean;
}

const SkillRating: React.FC<SkillRatingProps> = ({
  skill,
  emoji,
  value,
  onChange,
  compact = false,
}) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const handleRatingClick = (rating: number) => {
    onChange(rating);
  };

  const handleMouseEnter = (rating: number) => {
    setHoveredRating(rating);
  };

  const handleMouseLeave = () => {
    setHoveredRating(null);
  };

  if (compact) {
    return (
      <div className="rounded-lg border border-slate-100 bg-white px-2.5 py-1.5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="text-sm leading-none">{emoji}</span>
            <span className="truncate text-xs font-medium text-slate-800 sm:text-sm">{skill}</span>
          </div>
          <span className="shrink-0 text-[11px] text-slate-500">{value > 0 ? `${value}/5` : '—'}</span>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((rating) => {
            const isActive = rating <= (hoveredRating || value);
            return (
              <button
                key={rating}
                type="button"
                onClick={() => handleRatingClick(rating)}
                onMouseEnter={() => handleMouseEnter(rating)}
                onMouseLeave={handleMouseLeave}
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-medium transition sm:h-8 sm:w-8 ${
                  isActive
                    ? 'border-teal-500 bg-gradient-to-r from-teal-500 to-blue-500 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-teal-300'
                }`}
              >
                {rating}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 w-full min-w-0 max-w-full box-border rounded-lg border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-2 flex flex-col gap-1 sm:mb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-xl leading-none sm:text-2xl">{emoji}</span>
          <span className="break-words text-base font-semibold leading-snug text-gray-800 sm:text-[15px]">
            {skill}
          </span>
        </div>
        {value > 0 ? (
          <div className="shrink-0 text-sm font-medium text-teal-700">{value}/5</div>
        ) : null}
      </div>

      <div className="flex w-full max-w-full items-center justify-between gap-1 sm:justify-start sm:gap-2">
        {[1, 2, 3, 4, 5].map((rating) => {
          const isActive = rating <= (hoveredRating || value);
          const isSelected = rating === value;

          return (
            <button
              key={rating}
              type="button"
              onClick={() => handleRatingClick(rating)}
              onMouseEnter={() => handleMouseEnter(rating)}
              onMouseLeave={handleMouseLeave}
              className={`
                flex aspect-square h-9 min-w-0 flex-1 max-w-[3rem] items-center justify-center rounded-full border-2 text-base font-medium transition-colors duration-200
                sm:h-10 sm:w-10 sm:flex-none sm:text-sm
                ${
                  isActive
                    ? 'border-teal-500 bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-md'
                    : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-teal-300 hover:bg-teal-50'
                }
                ${isSelected ? 'ring-2 ring-teal-300 sm:ring-offset-2' : ''}
              `}
            >
              {rating}
            </button>
          );
        })}
      </div>

      <div className="mt-2 text-xs text-gray-500">
        {value === 1 && 'Not comfortable at all'}
        {value === 2 && 'Slightly uncomfortable'}
        {value === 3 && 'Somewhat comfortable'}
        {value === 4 && 'Quite comfortable'}
        {value === 5 && 'Very comfortable'}
      </div>
    </div>
  );
};

export default SkillRating;
