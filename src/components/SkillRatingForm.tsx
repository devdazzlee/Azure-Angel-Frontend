import React, { useState } from 'react';
import SkillRating from './SkillRating';

interface SkillRatingFormProps {
  onSubmit: (ratings: number[]) => void;
  onCancel: () => void;
  compact?: boolean;
  fillHeight?: boolean;
}

const skills = [
  { name: 'Business Planning', emoji: '📋' },
  { name: 'Financial Modeling', emoji: '💰' },
  { name: 'Legal Formation', emoji: '⚖️' },
  { name: 'Marketing', emoji: '📢' },
  { name: 'Operations/Logistics', emoji: '🚚' },
  { name: 'Technology/Infrastructure', emoji: '💻' },
  { name: 'Fundraising/Investor Outreach', emoji: '💼' },
];

const SkillRatingForm: React.FC<SkillRatingFormProps> = ({
  onSubmit,
  onCancel,
  compact = false,
  fillHeight = false,
}) => {
  const [ratings, setRatings] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [isComplete, setIsComplete] = useState(false);

  const handleRatingChange = (index: number, value: number) => {
    const newRatings = [...ratings];
    newRatings[index] = value;
    setRatings(newRatings);
    setIsComplete(newRatings.every((rating) => rating > 0));
  };

  const handleSubmit = () => {
    if (isComplete) onSubmit(ratings);
  };

  const handleQuickFill = (rating: number) => {
    const allRatings = [rating, rating, rating, rating, rating, rating, rating];
    setRatings(allRatings);
    setIsComplete(true);
  };

  const completedCount = ratings.filter((rating) => rating > 0).length;

  if (compact) {
    return (
      <div
        className={`rounded-xl border border-slate-200 bg-white shadow-sm ${
          fillHeight ? 'flex h-full min-h-0 flex-1 flex-col' : ''
        }`}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-3 py-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Rate your business skills</h3>
            <p className="text-xs text-slate-500">1 = not comfortable · 5 = very comfortable</p>
          </div>
          <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
            {completedCount}/7
          </span>
        </div>

        <div className="shrink-0 px-3 pt-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all"
              style={{ width: `${(completedCount / 7) * 100}%` }}
            />
          </div>
        </div>

        <div
          className={`px-3 py-2 ${
            fillHeight ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain' : ''
          }`}
        >
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {skills.map((skill, index) => (
              <SkillRating
                key={skill.name}
                skill={skill.name}
                emoji={skill.emoji}
                value={ratings[index]}
                onChange={(value) => handleRatingChange(index, value)}
                compact
              />
            ))}
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-white px-3 py-2.5">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Quick fill:</span>
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleQuickFill(rating)}
                className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-teal-100 hover:text-teal-700"
              >
                All {rating}s
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isComplete}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                isComplete
                  ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              {isComplete ? 'Submit ratings' : 'Rate all skills'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/50 bg-gradient-to-br from-slate-50 to-teal-50 p-6 shadow-lg">
      <div className="mb-6 text-center">
        <h3 className="mb-2 text-xl font-bold text-gray-900">Rate Your Business Skills</h3>
        <p className="text-sm text-gray-600">
          How comfortable are you with these business skills? Rate each from 1 to 5.
        </p>
        <div className="mt-3">
          <div className="flex items-center justify-center gap-2">
            <div className="h-2 w-32 rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all duration-300"
                style={{ width: `${(completedCount / 7) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600">{completedCount}/7 completed</span>
          </div>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        {skills.map((skill, index) => (
          <SkillRating
            key={index}
            skill={skill.name}
            emoji={skill.emoji}
            value={ratings[index]}
            onChange={(value) => handleRatingChange(index, value)}
          />
        ))}
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={onCancel}
          className="rounded-lg bg-gray-200 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isComplete}
          className={`
            rounded-lg px-6 py-2 font-medium transition-all duration-200
            ${
              isComplete
                ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-md hover:from-teal-600 hover:to-blue-600 hover:shadow-lg hover:scale-105'
                : 'cursor-not-allowed bg-gray-300 text-gray-500'
            }
          `}
        >
          {isComplete ? 'Submit Ratings' : 'Complete All Ratings'}
        </button>
      </div>

      <div className="mt-4 border-t border-gray-200 pt-4">
        <p className="mb-2 text-center text-xs text-gray-500">Quick fill options:</p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => handleQuickFill(rating)}
              className="rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-teal-100 hover:text-teal-700"
            >
              All {rating}s
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkillRatingForm;
