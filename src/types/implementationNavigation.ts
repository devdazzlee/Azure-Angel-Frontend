export type ImplementationTaskStatus =
  | 'completed'
  | 'in_progress'
  | 'current'
  | 'not_started';

export interface ImplementationCatalogTask {
  id: string;
  title: string;
  status: ImplementationTaskStatus;
  substeps_completed: number;
  substeps_total: number;
  estimated_time?: string;
  priority?: string;
}

export interface ImplementationCatalogPhase {
  id: string;
  name: string;
  tasks: ImplementationCatalogTask[];
}
