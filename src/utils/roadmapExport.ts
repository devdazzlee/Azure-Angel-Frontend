/**
 * Export parsed roadmap to Excel (primary, tabular) and Word (formatted tables).
 */

import * as XLSX from 'xlsx';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import type { RoadmapStageParsed } from './roadmapParse';

const EXCEL_FILENAME = 'founderport-launch-roadmap.xlsx';
const WORD_FILENAME = 'founderport-launch-roadmap.docx';

function countTasks(stages: RoadmapStageParsed[]): number {
  return stages.reduce((n, s) => n + s.tasks.length, 0);
}

/**
 * Workbook: "Roadmap tasks" (flat table), "Stage summary", and if no tasks were parsed
 * but markdown exists, "Roadmap (text)" with line-by-line source.
 */
export function downloadRoadmapExcel(
  stages: RoadmapStageParsed[],
  rawMarkdown: string
): void {
  const wb = XLSX.utils.book_new();

  const taskHeader = [
    'Stage',
    'Stage goal',
    'Task',
    'Description',
    'Dependencies',
    "Angel's Role",
    'Status',
  ];
  const taskRows: string[][] = [taskHeader];
  for (const s of stages) {
    for (const t of s.tasks) {
      taskRows.push([
        s.title,
        s.goal,
        t.task,
        t.description,
        t.dependencies,
        t.angelRole,
        t.status,
      ]);
    }
  }
  const wsTasks = XLSX.utils.aoa_to_sheet(taskRows);
  wsTasks['!cols'] = [
    { wch: 34 },
    { wch: 45 },
    { wch: 28 },
    { wch: 52 },
    { wch: 22 },
    { wch: 26 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTasks, 'Roadmap tasks');

  const stageRows: string[][] = [['Stage', 'Goal', 'Task count']];
  for (const s of stages) {
    stageRows.push([s.title, s.goal, String(s.tasks.length)]);
  }
  const wsStages = XLSX.utils.aoa_to_sheet(stageRows);
  wsStages['!cols'] = [{ wch: 42 }, { wch: 58 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsStages, 'Stage summary');

  if (countTasks(stages) === 0 && rawMarkdown.trim()) {
    const lines = rawMarkdown.split(/\r?\n/).map((line) => [line]);
    const wsRaw = XLSX.utils.aoa_to_sheet(lines);
    wsRaw['!cols'] = [{ wch: 120 }];
    XLSX.utils.book_append_sheet(wb, wsRaw, 'Roadmap (text)');
  }

  XLSX.writeFile(wb, EXCEL_FILENAME);
}

/** Word: one heading per stage, goal paragraph, then a five-column table per stage. */
export async function downloadRoadmapWord(
  stages: RoadmapStageParsed[],
  rawMarkdown: string
): Promise<void> {
  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: 'Founderport Launch Roadmap', bold: true })],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Tables match the Angel roadmap format (tasks per stage).',
          italics: true,
        }),
      ],
    }),
    new Paragraph({ children: [new TextRun('')] })
  );

  if (stages.length === 0 && rawMarkdown.trim()) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun('Roadmap source')],
      }),
      new Paragraph({
        children: [new TextRun(rawMarkdown.slice(0, 120_000))],
      })
    );
  }

  for (const s of stages) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun(s.title)],
      })
    );
    if (s.goal) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Goal: ', bold: true }),
            new TextRun(s.goal),
          ],
        })
      );
    }

    if (s.tasks.length === 0) {
      children.push(
        new Paragraph({
          children: [new TextRun('(No task table rows parsed for this stage.)')],
        })
      );
      continue;
    }

    const headerCells = ['Task', 'Description', 'Dependencies', "Angel's Role", 'Status'].map(
      (h) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: h, bold: true })],
            }),
          ],
        })
    );
    const headerRow = new TableRow({ children: headerCells });

    const dataRows = s.tasks.map(
      (t) =>
        new TableRow({
          children: [
            t.task,
            t.description,
            t.dependencies,
            t.angelRole,
            t.status,
          ].map(
            (text) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun(text || '')],
                  }),
                ],
              })
          ),
        })
    );

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...dataRows],
      })
    );
    children.push(new Paragraph({ children: [new TextRun('')] }));
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, WORD_FILENAME);
}
