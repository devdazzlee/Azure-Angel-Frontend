import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Loader2,
  PlayCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type {
  ImplementationCatalogPhase,
  ImplementationCatalogTask,
  ImplementationTaskStatus,
} from '@/types/implementationNavigation';

function StatusBadge({ task }: { task: ImplementationCatalogTask }) {
  const { status, substeps_completed, substeps_total } = task;

  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200/80">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Done
      </span>
    );
  }

  if (status === 'in_progress' && substeps_total > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200/80">
        {substeps_completed}/{substeps_total} steps
      </span>
    );
  }

  if (status === 'current') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800 ring-1 ring-teal-200/80">
        <PlayCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Up next
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 ring-1 ring-gray-200/80">
      <Circle className="h-3 w-3 shrink-0" aria-hidden />
      Not started
    </span>
  );
}

export interface ImplementationRoadmapNavigatorProps {
  phases: ImplementationCatalogPhase[];
  expandedTaskId: string | null;
  nextTaskId?: string | null;
  loadingTaskId?: string | null;
  onSelectTask: (taskId: string) => void;
  /** Rendered only under the expanded task row */
  expandedPanel?: React.ReactNode;
}

const ImplementationRoadmapNavigator: React.FC<ImplementationRoadmapNavigatorProps> = ({
  phases,
  expandedTaskId,
  nextTaskId,
  loadingTaskId,
  onSelectTask,
  expandedPanel,
}) => {
  const defaultOpenPhases = useMemo(() => {
    const open = new Set<string>();
    for (const phase of phases) {
      const hasActive = phase.tasks.some(
        (t) =>
          t.id === expandedTaskId ||
          t.id === nextTaskId ||
          t.status === 'current' ||
          t.status === 'in_progress',
      );
      if (hasActive) open.add(phase.id);
    }
    if (open.size === 0 && phases[0]) open.add(phases[0].id);
    return open;
  }, [phases, expandedTaskId, nextTaskId]);

  const [openPhases, setOpenPhases] = useState<Set<string>>(defaultOpenPhases);

  useEffect(() => {
    setOpenPhases((prev) => {
      const next = new Set(prev);
      defaultOpenPhases.forEach((id) => next.add(id));
      return next;
    });
  }, [defaultOpenPhases]);

  const togglePhase = (phaseId: string) => {
    setOpenPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  };

  const rowAccent = (status: ImplementationTaskStatus, isExpanded: boolean) => {
    if (isExpanded) return 'border-teal-400 bg-teal-50/80 ring-1 ring-teal-200/60';
    if (status === 'completed') return 'border-emerald-200/80 bg-emerald-50/40 hover:bg-emerald-50/70';
    if (status === 'current') return 'border-teal-200/80 bg-white hover:bg-teal-50/40';
    if (status === 'in_progress') return 'border-amber-200/80 bg-amber-50/30 hover:bg-amber-50/50';
    return 'border-gray-200/80 bg-white hover:bg-gray-50/80';
  };

  return (
    <div className="space-y-4 min-w-0">
      <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-bold text-gray-900 sm:text-lg">Implementation roadmap</h2>
        <p className="mt-1 text-sm text-gray-600">
          Select any stage or task to work through substeps. Only one task panel is open at a time so
          Angel stays focused on your current topic.
        </p>
      </div>

      <div className="space-y-3">
        {phases.map((phase) => {
          const phaseDone = phase.tasks.filter((t) => t.status === 'completed').length;
          const isOpen = openPhases.has(phase.id);

          return (
            <Collapsible
              key={phase.id}
              open={isOpen}
              onOpenChange={() => togglePhase(phase.id)}
              className="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm"
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50/80 sm:px-5"
                >
                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 shrink-0 text-teal-600" aria-hidden />
                  ) : (
                    <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{phase.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {phaseDone} of {phase.tasks.length} tasks complete
                    </p>
                  </div>
                  <div className="h-2 w-16 sm:w-24 overflow-hidden rounded-full bg-gray-100 shrink-0">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all"
                      style={{
                        width:
                          phase.tasks.length > 0
                            ? `${Math.round((phaseDone / phase.tasks.length) * 100)}%`
                            : '0%',
                      }}
                    />
                  </div>
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <ul className="border-t border-gray-100 px-2 pb-2 pt-1 sm:px-3">
                  {phase.tasks.map((task) => {
                    const isExpanded = expandedTaskId === task.id;
                    const isLoading = loadingTaskId === task.id;

                    return (
                      <li key={task.id} className="list-none">
                        <button
                          type="button"
                          onClick={() => onSelectTask(task.id)}
                          aria-expanded={isExpanded}
                          className={cn(
                            'mt-1 flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-all sm:px-4',
                            rowAccent(task.status, isExpanded),
                          )}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-gray-900 leading-snug">
                              {task.title}
                            </span>
                            {task.estimated_time ? (
                              <span className="mt-0.5 block text-xs text-gray-500">
                                Est. {task.estimated_time}
                              </span>
                            ) : null}
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            {isLoading ? (
                              <Loader2
                                className="h-4 w-4 animate-spin text-teal-600"
                                aria-label="Loading task"
                              />
                            ) : null}
                            <StatusBadge task={task} />
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 text-gray-400 transition-transform',
                                isExpanded && 'rotate-180 text-teal-600',
                              )}
                              aria-hidden
                            />
                          </span>
                        </button>

                        <AnimatePresence initial={false}>
                          {isExpanded && expandedPanel ? (
                            <motion.div
                              key={`panel-${task.id}`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: 'easeOut' }}
                              className="overflow-hidden"
                            >
                              <div className="mx-1 mb-2 mt-2 rounded-xl border border-teal-200/60 bg-gradient-to-b from-teal-50/30 to-white p-3 sm:mx-2 sm:p-4">
                                {expandedPanel}
                              </div>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </li>
                    );
                  })}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
};

export default ImplementationRoadmapNavigator;
