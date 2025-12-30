/**
 * Professional Document Generation Utility
 * 
 * This utility provides high-quality PDF and DOCX generation from markdown content.
 * It properly parses markdown, preserves formatting, tables, and styling.
 * 
 * ROOT CAUSE SOLUTION - Not a patch!
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

interface ParsedContent {
  type: 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'list' | 'table' | 'blockquote';
  content: string;
  level?: number;
  items?: string[];
  tableData?: {
    headers: string[];
    rows: string[][];
  };
}

/**
 * Parse markdown content into structured data
 */
export function parseMarkdownContent(markdown: string): ParsedContent[] {
  const lines = markdown.split('\n');
  const parsed: ParsedContent[] = [];
  let currentParagraph = '';
  let currentList: string[] = [];
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];
  let inBlockquote = false;
  let blockquoteContent = '';

  const flushParagraph = () => {
    if (currentParagraph.trim()) {
      parsed.push({
        type: 'paragraph',
        content: currentParagraph.trim()
      });
      currentParagraph = '';
    }
  };

  const flushList = () => {
    if (currentList.length > 0) {
      parsed.push({
        type: 'list',
        content: '',
        items: [...currentList]
      });
      currentList = [];
    }
  };

  const flushTable = () => {
    if (tableHeaders.length > 0 && tableRows.length > 0) {
      parsed.push({
        type: 'table',
        content: '',
        tableData: {
          headers: [...tableHeaders],
          rows: [...tableRows]
        }
      });
      tableHeaders = [];
      tableRows = [];
      inTable = false;
    }
  };

  const flushBlockquote = () => {
    if (blockquoteContent.trim()) {
      parsed.push({
        type: 'blockquote',
        content: blockquoteContent.trim()
      });
      blockquoteContent = '';
      inBlockquote = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      flushParagraph();
      flushList();
      flushBlockquote();
      continue;
    }

    // Heading 1
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      flushParagraph();
      flushList();
      flushTable();
      flushBlockquote();
      parsed.push({
        type: 'heading1',
        content: trimmed.substring(2).replace(/\*\*/g, '').trim(),
        level: 1
      });
      continue;
    }

    // Heading 2
    if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
      flushParagraph();
      flushList();
      flushTable();
      flushBlockquote();
      parsed.push({
        type: 'heading2',
        content: trimmed.substring(3).replace(/\*\*/g, '').trim(),
        level: 2
      });
      continue;
    }

    // Heading 3
    if (trimmed.startsWith('### ')) {
      flushParagraph();
      flushList();
      flushTable();
      flushBlockquote();
      parsed.push({
        type: 'heading3',
        content: trimmed.substring(4).replace(/\*\*/g, '').trim(),
        level: 3
      });
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      flushParagraph();
      flushList();
      flushTable();
      inBlockquote = true;
      blockquoteContent += trimmed.substring(1).trim() + ' ';
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
    }

    // Table detection
    if (trimmed.includes('|')) {
      flushParagraph();
      flushList();
      flushBlockquote();
      
      const cells = trimmed.split('|').map(c => c.trim()).filter(c => c);
      
      // Skip separator rows (---|---|---)
      if (cells.every(c => /^[-:]+$/.test(c))) {
        inTable = true;
        continue;
      }
      
      if (!inTable && tableHeaders.length === 0) {
        // First row is headers
        tableHeaders = cells;
        inTable = true;
      } else if (inTable) {
        // Data rows
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    // List items
    if (trimmed.match(/^[-•*]\s+/) || trimmed.match(/^\d+\.\s+/)) {
      flushParagraph();
      flushBlockquote();
      const content = trimmed.replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '').trim();
      currentList.push(content);
      continue;
    } else if (currentList.length > 0) {
      flushList();
    }

    // Regular paragraph
    currentParagraph += (currentParagraph ? ' ' : '') + trimmed;
  }

  // Flush remaining content
  flushParagraph();
  flushList();
  flushTable();
  flushBlockquote();

  return parsed;
}

/**
 * Clean text from markdown formatting
 */
function cleanText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
    .replace(/\*(.+?)\*/g, '$1')     // Italic
    .replace(/`(.+?)`/g, '$1')       // Code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
    .trim();
}

/**
 * Extract bold text segments
 */
function extractTextSegments(text: string): Array<{ text: string; bold: boolean }> {
  const segments: Array<{ text: string; bold: boolean }> = [];
  const boldRegex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before bold
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index);
      if (beforeText) {
        segments.push({ text: beforeText, bold: false });
      }
    }
    // Add bold text
    segments.push({ text: match[1], bold: true });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      segments.push({ text: remainingText, bold: false });
    }
  }

  // If no bold text found, return entire text
  if (segments.length === 0) {
    segments.push({ text, bold: false });
  }

  return segments;
}

/**
 * Generate PDF document
 */
export async function generatePDF(
  markdown: string,
  filename: string,
  documentTitle: string
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (2 * margin);
  let yPosition = margin;

  const parsed = parseMarkdownContent(markdown);

  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 184, 166); // Teal
  doc.text(documentTitle, margin, yPosition);
  yPosition += 15;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128); // Gray
  doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, margin, yPosition);
  yPosition += 15;

  // Process content
  for (const item of parsed) {
    // Check if we need a new page
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = margin;
    }

    switch (item.type) {
      case 'heading1':
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55); // Dark gray
        const h1Lines = doc.splitTextToSize(cleanText(item.content), contentWidth);
        doc.text(h1Lines, margin, yPosition);
        yPosition += (h1Lines.length * 8) + 8;
        
        // Underline
        doc.setDrawColor(20, 184, 166);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition - 5, margin + 60, yPosition - 5);
        yPosition += 5;
        break;

      case 'heading2':
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 118, 110); // Teal
        const h2Lines = doc.splitTextToSize(cleanText(item.content), contentWidth);
        doc.text(h2Lines, margin, yPosition);
        yPosition += (h2Lines.length * 7) + 6;
        break;

      case 'heading3':
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(75, 85, 99); // Gray
        const h3Lines = doc.splitTextToSize(cleanText(item.content), contentWidth);
        doc.text(h3Lines, margin, yPosition);
        yPosition += (h3Lines.length * 6) + 5;
        break;

      case 'paragraph':
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81); // Dark gray
        const pLines = doc.splitTextToSize(cleanText(item.content), contentWidth);
        doc.text(pLines, margin, yPosition);
        yPosition += (pLines.length * 5) + 5;
        break;

      case 'list':
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        item.items?.forEach(listItem => {
          const bullet = '• ';
          const itemLines = doc.splitTextToSize(cleanText(listItem), contentWidth - 5);
          doc.text(bullet, margin, yPosition);
          doc.text(itemLines, margin + 5, yPosition);
          yPosition += (itemLines.length * 5) + 2;
        });
        yPosition += 3;
        break;

      case 'table':
        if (item.tableData) {
          // Check if table fits on current page
          const estimatedTableHeight = (item.tableData.rows.length + 2) * 10;
          if (yPosition + estimatedTableHeight > pageHeight - 30) {
            doc.addPage();
            yPosition = margin;
          }

          autoTable(doc, {
            startY: yPosition,
            head: [item.tableData.headers],
            body: item.tableData.rows,
            theme: 'grid',
            headStyles: {
              fillColor: [20, 184, 166], // Teal
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 10,
              halign: 'left'
            },
            bodyStyles: {
              fontSize: 9,
              textColor: [55, 65, 81],
              cellPadding: 4
            },
            alternateRowStyles: {
              fillColor: [240, 253, 250] // Light teal
            },
            margin: { left: margin, right: margin },
            tableWidth: contentWidth
          });

          // @ts-ignore - autoTable adds finalY property
          yPosition = doc.lastAutoTable.finalY + 10;
        }
        break;

      case 'blockquote':
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(75, 85, 99);
        doc.setFillColor(240, 253, 250);
        const quoteLines = doc.splitTextToSize(cleanText(item.content), contentWidth - 10);
        const quoteHeight = quoteLines.length * 5 + 6;
        doc.rect(margin, yPosition - 3, contentWidth, quoteHeight, 'F');
        doc.setDrawColor(20, 184, 166);
        doc.setLineWidth(1);
        doc.line(margin, yPosition - 3, margin, yPosition + quoteHeight - 3);
        doc.text(quoteLines, margin + 5, yPosition);
        yPosition += quoteHeight + 5;
        break;
    }
  }

  // Footer on last page
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(156, 163, 175);
  doc.text(
    'Generated by Angel Business Assistant',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Save
  doc.save(filename);
}

/**
 * Generate DOCX document
 */
export async function generateDOCX(
  markdown: string,
  filename: string,
  documentTitle: string
): Promise<void> {
  const parsed = parseMarkdownContent(markdown);
  const children: any[] = [];

  // Title
  children.push(
    new Paragraph({
      text: documentTitle,
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
      style: 'Title'
    })
  );

  // Date
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated on ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}`,
          color: '6B7280',
          size: 20
        })
      ],
      spacing: { after: 400 }
    })
  );

  // Process content
  for (const item of parsed) {
    switch (item.type) {
      case 'heading1':
        children.push(
          new Paragraph({
            text: cleanText(item.content),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            border: {
              bottom: {
                color: '14B8A6',
                space: 1,
                style: BorderStyle.SINGLE,
                size: 12
              }
            }
          })
        );
        break;

      case 'heading2':
        children.push(
          new Paragraph({
            text: cleanText(item.content),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 }
          })
        );
        break;

      case 'heading3':
        children.push(
          new Paragraph({
            text: cleanText(item.content),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 }
          })
        );
        break;

      case 'paragraph':
        const segments = extractTextSegments(item.content);
        children.push(
          new Paragraph({
            children: segments.map(seg => 
              new TextRun({
                text: seg.text,
                bold: seg.bold,
                size: 22
              })
            ),
            spacing: { after: 150 }
          })
        );
        break;

      case 'list':
        item.items?.forEach((listItem, index) => {
          const listSegments = extractTextSegments(listItem);
          children.push(
            new Paragraph({
              children: listSegments.map(seg =>
                new TextRun({
                  text: seg.text,
                  bold: seg.bold,
                  size: 22
                })
              ),
              bullet: { level: 0 },
              spacing: { after: 100 }
            })
          );
        });
        break;

      case 'table':
        if (item.tableData) {
          const tableRows = [
            // Header row
            new TableRow({
              children: item.tableData.headers.map(header =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: cleanText(header),
                          bold: true,
                          color: 'FFFFFF',
                          size: 22
                        })
                      ]
                    })
                  ],
                  shading: {
                    fill: '14B8A6' // Teal
                  }
                })
              ),
              tableHeader: true
            }),
            // Data rows
            ...item.tableData.rows.map((row, rowIndex) =>
              new TableRow({
                children: row.map(cell =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: cleanText(cell),
                            size: 20
                          })
                        ]
                      })
                    ],
                    shading: rowIndex % 2 === 0 ? { fill: 'F0FDFA' } : undefined
                  })
                )
              })
            )
          ];

          children.push(
            new Table({
              rows: tableRows,
              width: {
                size: 100,
                type: WidthType.PERCENTAGE
              },
              margins: {
                top: 100,
                bottom: 100,
                left: 100,
                right: 100
              }
            })
          );

          children.push(
            new Paragraph({
              text: '',
              spacing: { after: 200 }
            })
          );
        }
        break;

      case 'blockquote':
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanText(item.content),
                italics: true,
                size: 22,
                color: '4B5563'
              })
            ],
            spacing: { after: 200 },
            indent: { left: 720 },
            border: {
              left: {
                color: '14B8A6',
                space: 1,
                style: BorderStyle.SINGLE,
                size: 24
              }
            },
            shading: {
              fill: 'F0FDFA'
            }
          })
        );
        break;
    }
  }

  // Create document
  const doc = new Document({
    sections: [{
      properties: {},
      children: children
    }],
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22
          },
          paragraph: {
            spacing: {
              line: 276,
              before: 0,
              after: 0
            }
          }
        }
      },
      paragraphStyles: [
        {
          id: 'Title',
          name: 'Title',
          run: {
            size: 48,
            bold: true,
            color: '14B8A6'
          },
          paragraph: {
            spacing: {
              after: 400
            }
          }
        }
      ]
    }
  });

  // Generate and save
  const { Packer } = await import('docx');
  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}












