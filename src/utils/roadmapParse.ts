/**
 * Parse Founderport launch roadmap markdown (Angel output: Stage headings + pipe tables).
 * Uses pipe splitting that preserves empty cells so column indices stay aligned.
 */

export interface RoadmapTaskRow {
  task: string;
  description: string;
  dependencies: string;
  angelRole: string;
  status: string;
}

export interface RoadmapStageParsed {
  title: string;
  goal: string;
  tasks: RoadmapTaskRow[];
}

/** Remove inline markdown (bold, italic, code, heading markers) for plain-text display. */
export function stripInlineMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s*/, '')
    .replace(/^\*+|\*+$/g, '')
    .trim();
}

/** True when a line is a stage heading (### **Stage N — …** or **Stage N — …**). */
export function isRoadmapStageHeaderLine(line: string): boolean {
  const t = line.trim();
  return (
    /^#{1,3}\s*\*?\*?Stage\s+\d+/i.test(t) ||
    /^\*\*Stage\s+\d+[\s—–-]/i.test(t)
  );
}

/** Split a markdown table row into cells (content between | ... |). */
export function splitPipeRow(line: string): string[] {
  const t = line.trim();
  if (!t || !t.includes('|')) return [];
  let inner = t.startsWith('|') ? t.slice(1) : t;
  if (inner.endsWith('|')) inner = inner.slice(0, -1);
  return inner.split('|').map((c) => c.trim().replace(/\*\*/g, ''));
}

function isSeparatorRow(line: string): boolean {
  return /^\|[\s\-:|]+\|?$/.test(line.trim());
}

function parseTaskRowsFromTable(tableLines: string[]): RoadmapTaskRow[] {
  if (tableLines.length < 2) return [];
  const headerCells = splitPipeRow(tableLines[0]);
  const lower = headerCells.map((h) => h.toLowerCase());
  const findIdx = (pred: (h: string) => boolean) => lower.findIndex(pred);
  const taskIndex = findIdx((h) => h.includes('task'));
  const descIndex = findIdx((h) => h.includes('description'));
  const depIndex = findIdx((h) => h.includes('dependencies'));
  const roleIndex = findIdx((h) => h.includes('angel'));
  const statusIndex = findIdx((h) => h.includes('status'));
  if (taskIndex < 0) return [];

  const tasks: RoadmapTaskRow[] = [];
  for (let j = 1; j < tableLines.length; j++) {
    const row = tableLines[j];
    if (isSeparatorRow(row)) continue;
    const cells = splitPipeRow(row);
    if (cells.length <= taskIndex || !cells[taskIndex]) continue;
    tasks.push({
      task: cells[taskIndex] ?? '',
      description: descIndex >= 0 ? cells[descIndex] ?? '' : '',
      dependencies: depIndex >= 0 ? cells[depIndex] ?? '' : '',
      angelRole: roleIndex >= 0 ? cells[roleIndex] ?? '' : '',
      status:
        statusIndex >= 0 ? (cells[statusIndex] ?? '').trim() || '⏳' : '⏳',
    });
  }
  return tasks;
}

const STAGE_HEADER_RE = /^#*\s*\*?\*?Stage\s+(\d+)[\s—–-]+(.+?)\*?\*?$/i;
const STAGE_HEADER_ALT_RE = /^###?\s*Stage\s+(\d+)[\s—–-]*(.+?)$/i;

/**
 * Extract stages, goals, and task table rows from full roadmap markdown.
 */
export function parseRoadmapMarkdown(content: string): RoadmapStageParsed[] {
  const stages: RoadmapStageParsed[] = [];
  if (!content?.trim()) return stages;

  const lines = content.split(/\r?\n/);
  let current: RoadmapStageParsed | null = null;
  let inTable = false;
  let tableLines: string[] = [];
  let foundHeader = false;

  const flushTable = () => {
    if (inTable && current && tableLines.length >= 2) {
      current.tasks.push(...parseTaskRowsFromTable(tableLines));
    }
    inTable = false;
    tableLines = [];
    foundHeader = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const stageMatch =
      line.match(STAGE_HEADER_RE) || line.match(STAGE_HEADER_ALT_RE);

    if (stageMatch) {
      flushTable();
      if (current && (current.tasks.length > 0 || current.goal)) {
        stages.push(current);
      }
      const stageTitle = stageMatch[2].trim().replace(/\*\*/g, '');
      current = {
        title: `Stage ${stageMatch[1]} — ${stageTitle}`,
        goal: '',
        tasks: [],
      };
      continue;
    }

    if (current) {
      if (
        line.startsWith('**Goal**:') ||
        line.startsWith('**Goal:**') ||
        line.startsWith('Goal:')
      ) {
        flushTable();
        current.goal = line
          .replace(/^\*\*Goal\*\*:\s*/, '')
          .replace(/^\*\*Goal\*\*\s*/, '')
          .replace(/^Goal:\s*/, '')
          .replace(/\*\*/g, '')
          .trim();
        continue;
      }
    }

    if (
      line.startsWith('|') &&
      line.includes('Task') &&
      line.includes('Description')
    ) {
      flushTable();
      inTable = true;
      foundHeader = true;
      tableLines = [line];
      continue;
    }

    if (inTable && line.startsWith('|')) {
      if (isSeparatorRow(line)) {
        if (foundHeader) foundHeader = false;
        continue;
      }
      tableLines.push(line);
    } else if (inTable && !line.startsWith('|')) {
      flushTable();
    }
  }

  flushTable();
  if (current && (current.tasks.length > 0 || current.goal)) {
    stages.push(current);
  }
  return stages;
}
