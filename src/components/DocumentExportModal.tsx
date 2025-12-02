import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { generatePDF, generateDOCX } from '../utils/documentGenerator';

interface DocumentExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  documentContent: string; // Markdown content
  documentType: 'business-plan' | 'roadmap';
}

const DocumentExportModal: React.FC<DocumentExportModalProps> = ({
  isOpen,
  onClose,
  documentTitle,
  documentContent,
  documentType
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'docx' | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!selectedFormat) {
      toast.error('Please select a format');
      return;
    }

    setIsExporting(true);

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${documentType}-${timestamp}.${selectedFormat === 'pdf' ? 'pdf' : 'docx'}`;
      
      // Clean the content - remove HTML tags if present, keep markdown
      let cleanContent = documentContent;
      
      // If content is HTML (from contentRef.current?.innerHTML), convert to markdown-like format
      if (documentContent.includes('<')) {
        // Create a temporary div to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = documentContent;
        
        // Extract text content while preserving structure
        cleanContent = extractMarkdownFromHTML(tempDiv);
      }

      if (selectedFormat === 'pdf') {
        await generatePDF(cleanContent, filename, documentTitle);
        toast.success('PDF downloaded successfully!');
      } else if (selectedFormat === 'docx') {
        await generateDOCX(cleanContent, filename, documentTitle);
        toast.success('DOCX downloaded successfully!');
      }
      
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Failed to export ${selectedFormat?.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Extract markdown-like content from HTML
   */
  const extractMarkdownFromHTML = (element: HTMLElement): string => {
    let markdown = '';
    
    const processNode = (node: Node): string => {
      let result = '';
      
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();
        
        // Skip script, style, svg elements
        if (['script', 'style', 'svg', 'button'].includes(tagName)) {
          return '';
        }
        
        switch (tagName) {
          case 'h1':
            result = '\n\n# ' + el.textContent?.trim() + '\n\n';
            break;
          case 'h2':
            result = '\n\n## ' + el.textContent?.trim() + '\n\n';
            break;
          case 'h3':
            result = '\n\n### ' + el.textContent?.trim() + '\n\n';
            break;
          case 'p':
            result = '\n\n' + Array.from(el.childNodes).map(processNode).join('') + '\n\n';
            break;
          case 'strong':
          case 'b':
            result = '**' + el.textContent?.trim() + '**';
            break;
          case 'em':
          case 'i':
            result = '*' + el.textContent?.trim() + '*';
            break;
          case 'ul':
          case 'ol':
            result = '\n' + Array.from(el.children).map(li => {
              const text = li.textContent?.trim() || '';
              return '- ' + text;
            }).join('\n') + '\n';
            break;
          case 'li':
            // Handled by ul/ol
            break;
          case 'table':
            result = '\n\n' + extractTableMarkdown(el as HTMLTableElement) + '\n\n';
            break;
          case 'blockquote':
            result = '\n\n> ' + el.textContent?.trim() + '\n\n';
            break;
          case 'br':
            result = '\n';
            break;
          case 'div':
          case 'span':
            // Process children
            result = Array.from(el.childNodes).map(processNode).join('');
            break;
          default:
            // Process children for unknown tags
            result = Array.from(el.childNodes).map(processNode).join('');
        }
      }
      
      return result;
    };
    
    markdown = processNode(element);
    
    // Clean up excessive newlines
    markdown = markdown.replace(/\n{3,}/g, '\n\n');
    
    return markdown.trim();
  };

  /**
   * Extract table as markdown
   */
  const extractTableMarkdown = (table: HTMLTableElement): string => {
    const rows: string[][] = [];
    
    // Get all rows (thead and tbody)
    const allRows = Array.from(table.querySelectorAll('tr'));
    
    allRows.forEach((tr, index) => {
      const cells = Array.from(tr.querySelectorAll('th, td'));
      const rowData = cells.map(cell => cell.textContent?.trim() || '');
      if (rowData.length > 0) {
        rows.push(rowData);
      }
    });
    
    if (rows.length === 0) return '';
    
    // Build markdown table
    let markdown = '';
    
    // Header row
    markdown += '| ' + rows[0].join(' | ') + ' |\n';
    
    // Separator row
    markdown += '| ' + rows[0].map(() => '---').join(' | ') + ' |\n';
    
    // Data rows
    for (let i = 1; i < rows.length; i++) {
      markdown += '| ' + rows[i].join(' | ') + ' |\n';
    }
    
    return markdown;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-blue-500 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">📥 Export Document</h2>
              <p className="text-sm opacity-90">Choose your preferred format</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
              disabled={isExporting}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700 mb-4">
            Select the format you'd like to download your {documentType === 'business-plan' ? 'Business Plan' : 'Roadmap'} in:
          </p>

          {/* Format Options */}
          <div className="space-y-3">
            {/* PDF Option */}
            <button
              onClick={() => setSelectedFormat('pdf')}
              disabled={isExporting}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedFormat === 'pdf'
                  ? 'border-teal-500 bg-teal-50 shadow-md'
                  : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  selectedFormat === 'pdf' ? 'bg-teal-500' : 'bg-gray-200'
                }`}>
                  <svg className={`w-6 h-6 ${selectedFormat === 'pdf' ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-gray-900 mb-1">PDF Format</h3>
                  <p className="text-sm text-gray-600">
                    Professional format with perfect tables and styling
                  </p>
                </div>
                {selectedFormat === 'pdf' && (
                  <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>

            {/* DOCX Option */}
            <button
              onClick={() => setSelectedFormat('docx')}
              disabled={isExporting}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedFormat === 'docx'
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  selectedFormat === 'docx' ? 'bg-blue-500' : 'bg-gray-200'
                }`}>
                  <svg className={`w-6 h-6 ${selectedFormat === 'docx' ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-gray-900 mb-1">DOCX Format (Word)</h3>
                  <p className="text-sm text-gray-600">
                    Fully editable in Microsoft Word or Google Docs
                  </p>
                </div>
                {selectedFormat === 'docx' && (
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={!selectedFormat || isExporting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Export {selectedFormat?.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-blue-800">
                <strong>Professional Quality:</strong> Your document will be generated with perfect formatting, tables, headings, and styling that matches what you see on screen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentExportModal;
