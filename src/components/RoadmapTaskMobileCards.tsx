import React from 'react';
import { Check } from 'lucide-react';
import type { RoadmapTaskRow } from '../utils/roadmapParse';
import { isRoadmapStepCompleted } from '../utils/roadmapMatching';

const fieldLabel =
  'text-[11px] font-semibold uppercase tracking-wide text-gray-500';

interface RoadmapTaskMobileCardsProps {
  tasks: RoadmapTaskRow[];
  completedRoadmapStepKeys: string[];
}

const RoadmapTaskMobileCards: React.FC<RoadmapTaskMobileCardsProps> = ({
  tasks,
  completedRoadmapStepKeys,
}) => {
  if (tasks.length === 0) {
    return (
      <p className="lg:hidden rounded-b-2xl border-t border-gray-100 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        No tasks in this stage.
      </p>
    );
  }

  return (
    <div className="lg:hidden space-y-3 border-t border-gray-100 bg-gray-50/50 p-3 sm:p-4">
      {tasks.map((task, taskIdx) => {
        const completed = isRoadmapStepCompleted(task.task, completedRoadmapStepKeys);
        return (
          <article
            key={`${task.task}-${taskIdx}`}
            className="overflow-hidden rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
              <h4
                className={`min-w-0 flex-1 text-sm font-semibold leading-snug ${
                  completed ? 'text-gray-500 line-through' : 'text-gray-900'
                }`}
              >
                {task.task}
              </h4>
              <div className="shrink-0">
                {completed ? (
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700"
                    title="Completed in Implementation"
                    aria-label="Completed"
                  >
                    <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                  </span>
                ) : (
                  <span className="inline-flex rounded-md bg-gray-100 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                    Pending
                  </span>
                )}
              </div>
            </div>

            {task.description ? (
              <div className="mt-3">
                <p className={fieldLabel}>Description</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-700">{task.description}</p>
              </div>
            ) : null}

            {task.angelRole ? (
              <div className="mt-3 rounded-lg bg-indigo-50/80 px-3 py-2.5">
                <p className={fieldLabel}>Angel&apos;s role</p>
                <p className="mt-1 text-sm leading-relaxed text-indigo-800">{task.angelRole}</p>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
};

export default RoadmapTaskMobileCards;
