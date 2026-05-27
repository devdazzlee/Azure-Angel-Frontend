import React, { Children, isValidElement, type ReactElement, type ReactNode } from 'react';

function flattenText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join('');
  if (isValidElement(node)) return flattenText((node.props as { children?: ReactNode }).children);
  return '';
}

function getSectionRows(section: ReactElement): ReactElement[] {
  return Children.toArray((section.props as { children?: ReactNode }).children).filter(
    isValidElement
  ) as ReactElement[];
}

function getRowCells(row: ReactElement): ReactElement[] {
  return Children.toArray((row.props as { children?: ReactNode }).children).filter(
    isValidElement
  ) as ReactElement[];
}

function parseTable(children: ReactNode): { headers: string[]; rows: ReactNode[][] } {
  const headers: string[] = [];
  const rows: ReactNode[][] = [];

  Children.forEach(children, (section) => {
    if (!isValidElement(section)) return;
    const rowEls = getSectionRows(section);
    rowEls.forEach((row) => {
      const cells = getRowCells(row);
      const cellContents = cells.map((cell) => (cell.props as { children?: ReactNode }).children);
      if (section.type === MdThead) {
        cellContents.forEach((c) => headers.push(flattenText(c)));
      } else if (section.type === MdTbody) {
        rows.push(cellContents);
      }
    });
  });

  return { headers, rows };
}

function MdThead({ children }: { children?: ReactNode }) {
  return (
    <thead className="bg-gradient-to-r from-teal-600 to-blue-600 text-white">
      {children}
    </thead>
  );
}

function MdTbody({ children }: { children?: ReactNode }) {
  return <tbody className="divide-y divide-gray-200 tbody-hover-rows">{children}</tbody>;
}

function MdTr({ children }: { children?: ReactNode }) {
  return <tr>{children}</tr>;
}

function MdTh({ children }: { children?: ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider sm:px-6 sm:py-4 sm:text-sm">
      {children}
    </th>
  );
}

function MdTd({ children }: { children?: ReactNode }) {
  return (
    <td className="px-4 py-3 text-sm leading-relaxed text-gray-700 sm:px-6 sm:py-4">
      {children}
    </td>
  );
}

function MdTable({ children }: { children?: ReactNode }) {
  const { headers, rows } = parseTable(children);
  const useMobileCards = headers.length > 0 && rows.length > 0;

  return (
    <div className="my-4 sm:my-6">
      {useMobileCards && (
        <div className="space-y-3 md:hidden print:hidden" role="list">
          {rows.map((row, rowIndex) => (
            <article
              key={rowIndex}
              role="listitem"
              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
            >
              {row.map((cell, cellIndex) => {
                const label = headers[cellIndex] ?? `Column ${cellIndex + 1}`;
                return (
                  <div
                    key={cellIndex}
                    className={`px-4 py-3 ${cellIndex < row.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <div className="mb-1 text-xs font-bold uppercase tracking-wide text-teal-700">
                      {label}
                    </div>
                    <div className="text-sm leading-relaxed text-gray-700">{cell}</div>
                  </div>
                );
              })}
            </article>
          ))}
        </div>
      )}

      <div className={useMobileCards ? 'hidden md:block print:block' : 'block'}>
        <div
          className={
            useMobileCards
              ? 'overflow-hidden rounded-lg shadow-md'
              : 'overflow-hidden rounded-lg shadow-md'
          }
        >
          <table className="w-full min-w-0 border-collapse bg-white">{children}</table>
        </div>
      </div>
    </div>
  );
}

/** GFM table components: stacked cards on mobile, full table from md up and in print. */
export const responsiveMarkdownTableComponents = {
  table: MdTable,
  thead: MdThead,
  tbody: MdTbody,
  tr: MdTr,
  th: MdTh,
  td: MdTd,
};
