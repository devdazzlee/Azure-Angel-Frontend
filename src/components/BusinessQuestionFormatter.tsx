import React from 'react';

interface BusinessQuestionFormatterProps {
  text: string;
}

const BusinessQuestionFormatter: React.FC<BusinessQuestionFormatterProps> = ({ text }) => {
  
  // Remove "Question X" text from the message (since it's displayed in the badge above)
  const removeQuestionNumber = (inputText: string): string => {
    // Look for "Question X" pattern (with or without "of Y")
    const questionMatch = inputText.match(/Question\s+(\d+)(?:\s+of\s+\d+)?/i);
    
    if (questionMatch) {
      const [fullMatch] = questionMatch;
      // Remove the question number text from the main text
      const cleanedText = inputText.replace(fullMatch, '').trim();
      return cleanedText;
    }
    
    return inputText;
  };

  // IMPROVED: Remove embedded options from question text (they're shown in dropdown)
  const removeEmbeddedOptions = (inputText: string): string => {
    let cleaned = inputText;

    // Pattern 1: Remove bullet point lists after questions
    // Example: "Will your business be primarily:\n\n• Online\n• Brick-and-mortar\n• A mix of both"
    cleaned = cleaned.replace(/\?\s*\n+(?:•|○|-|\*)\s*[^\n]+(?:\n(?:•|○|-|\*)\s*[^\n]+)*$/gm, '?');
    
    // Pattern 2: Remove "Yes / No" or "Yes/No" at end of questions
    cleaned = cleaned.replace(/\?\s*\n+Yes\s*\/?\s*No\s*$/gmi, '?');
    
    // Pattern 3: Remove standalone option lists (no question mark before)
    // Example: "\n\n• Online\n• Physical\n• Both"
    cleaned = cleaned.replace(/\n+(?:•|○|-|\*)\s+[^\n]+(?:\n(?:•|○|-|\*)\s+[^\n]+)+\s*$/gm, '');
    
    // Pattern 4: Remove numbered lists at end
    // Example: "\n\n1. Option one\n2. Option two"
    cleaned = cleaned.replace(/\n+\d+\.\s+[^\n]+(?:\n\d+\.\s+[^\n]+)*\s*$/gm, '');

    // Pattern 5: Handle inline options in special format
    // Example: "Online\nBrick-and-mortar\nA mix of both"
    const lines = cleaned.split('\n');
    const lastFewLines = lines.slice(-5); // Check last 5 lines
    const hasOptionsList = lastFewLines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 2 && trimmed.length < 50 && 
             !trimmed.endsWith('?') && !trimmed.endsWith('.') &&
             !trimmed.includes('Choose');
    });

    // If we find 2+ short lines at the end that look like options, remove them
    if (hasOptionsList.length >= 2 && lines[lines.length - hasOptionsList.length - 1]?.includes('?')) {
      cleaned = lines.slice(0, -hasOptionsList.length).join('\n');
    }

    return cleaned.trim();
  };
  
  // Smart approach - only add spacing when needed
  const formatBusinessQuestions = (inputText: string): string => {
    if (!inputText || typeof inputText !== 'string') {
      return '';
    }

    let processedText = inputText;

    // Step 1: Fix broken questions first (question mark on new line)
    const brokenQuestionFixes = [
      { pattern: /What is your business name\s*\n\s*\?/gi, replacement: 'What is your business name?' },
      { pattern: /What is your business tagline or mission statement\s*\n\s*\?/gi, replacement: 'What is your business tagline or mission statement?' },
      { pattern: /What problem does your business solve\s*\n\s*\?/gi, replacement: 'What problem does your business solve?' },
      { pattern: /What makes your business unique\s*\n\s*\?/gi, replacement: 'What makes your business unique?' },
      { pattern: /What are the key features and benefits\s*\n\s*of your product\/service\s*\?\s*\n\s*/gi, replacement: 'What are the key features and benefits of your product/service?' },
      { pattern: /How does it work\s*\n\s*\?/gi, replacement: 'How does it work?' },
      { pattern: /What is your product development timeline\s*\n\s*\?/gi, replacement: 'What is your product development timeline?' },
      { pattern: /Do you have a working prototype or MVP\s*\n\s*\?/gi, replacement: 'Do you have a working prototype or MVP?' },
      { pattern: /Who is your target market\s*\n\s*\?/gi, replacement: 'Who is your target market?' },
      { pattern: /What is the size of your target market\s*\n\s*\?/gi, replacement: 'What is the size of your target market?' },
      { pattern: /How many potential customers exist\s*\n\s*\?/gi, replacement: 'How many potential customers exist?' }
    ];

    brokenQuestionFixes.forEach(({ pattern, replacement }) => {
      processedText = processedText.replace(pattern, replacement);
    });

    // Step 2: Apply bold formatting with smart spacing
    const questionPatterns = [
      // Multi-part questions (longest first)
      /What is your business name\? If you haven't decided yet, what are your top 3-5 name options\?/gi,
      /What is your business tagline or mission statement\? How would you describe your business in one compelling sentence\?/gi,
      /What problem does your business solve\? Who has this problem, and how significant is it for them\?/gi,
      /What makes your business unique\? What's your competitive advantage or unique value proposition\?/gi,
      /Describe your core product or service in detail\. What exactly will you be offering to customers\?/gi,
      /What are the key features and benefits of your product\/service\? How does it work\?/gi,
      /What is your product development timeline\? Do you have a working prototype or MVP\?/gi,
      /What is the size of your target market\? How many potential customers exist\?/gi,
      
      // Single questions
      /What is your business tagline or mission statement\?/gi,
      /What problem does your business solve\?/gi,
      /What makes your business unique\?/gi,
      /Describe your core product or service in detail\. What exactly will you be offering to customers\?/gi,
      /What are the key features and benefits of your product\/service\?/gi,
      /How does it work\?/gi,
      /What is your product development timeline\?/gi,
      /Do you have a working prototype or MVP\?/gi,
      /Who is your target market\?/gi,
      /What is the size of your target market\?/gi,
      /How many potential customers exist\?/gi,
      /Who are your main competitors\?/gi,
      /How is your target market currently solving this problem\?/gi,
      /Where will your business be located\?/gi,
      /What are your space and facility requirements\?/gi,
      /What are your short-term operational needs/gi,
      /What suppliers or vendors will you need\?/gi,
      /What are your staffing needs\?/gi,
      /How will you price your product\/service\?/gi,
      /What are your projected sales for the first year\?/gi,
      /What are your estimated startup costs\?/gi,
      /What are your estimated monthly operating expenses\?/gi,
      /When do you expect to break even\?/gi,
      /How much funding do you need to get started\?/gi,
      /What are your financial projections for years 1-3\?/gi,
      /How will you track and manage your finances\?/gi,
      /How will you reach your target customers\?/gi,
      /What is your sales process\?/gi,
      /What is your customer acquisition cost\?/gi,
      /What is your customer lifetime value\?/gi,
      /How will you build brand awareness and credibility/gi,
      /What partnerships or collaborations could help you/gi,
      /What business structure will you use/gi,
      /What licenses and permits do you need\?/gi,
      /What insurance coverage do you need\?/gi,
      /How will you protect your intellectual property\?/gi,
      /What contracts and agreements will you need\?/gi,
      /How will you handle taxes and compliance\?/gi,
      /What data privacy and security measures will you implement\?/gi,
      /What are the key milestones you hope to achieve/gi,
      /What additional products or services could you offer/gi,
      /How will you expand to new markets or customer segments\?/gi,
      /What partnerships or strategic alliances could accelerate your growth\?/gi,
      /What are the biggest risks and challenges your business might face\?/gi,
      /What contingency plans do you have for major risks or setbacks\?/gi,
      /What is your biggest concern or fear about launching this business/gi,
      /What additional considerations or final thoughts do you have about your business plan\?/gi,
      /Do you have any intellectual property \(patents, trademarks, copyrights\) or proprietary technology\?/gi,
      /What is your business name\?/gi
    ];

    // Apply bold formatting with smart spacing
    questionPatterns.forEach(pattern => {
      processedText = processedText.replace(pattern, (match, offset) => {
        const before = processedText.substring(0, offset);
        const after = processedText.substring(offset + match.length);
        
        // Check if there's already spacing before the question
        const hasSpacingBefore = before.match(/\n\s*$/) || before.trim() === '';
        // Check if there's already spacing after the question
        const hasSpacingAfter = after.match(/^\s*\n/) || after.trim() === '';
        
        let result = '';
        
        // Only add spacing if there isn't already proper spacing
        if (!hasSpacingBefore && before.trim() !== '') {
          result += '\n';
        }
        
        result += `<strong>${match}</strong>`;
        
        // Only add spacing if there isn't already proper spacing
        if (!hasSpacingAfter && after.trim() !== '') {
          result += '\n';
        }
        
        return result;
      });
    });

    // Step 3: Clean up excessive spacing
    // Remove 3+ consecutive line breaks
    processedText = processedText.replace(/\n{3,}/g, '\n\n');
    
    // Remove leading and trailing whitespace
    processedText = processedText.trim();

    return processedText;
  };

  // Convert text to HTML with proper line breaks
  const formatText = (inputText: string): string => {
    // First remove "Question X" text (it's displayed in the badge by parent component)
    let cleanedText = removeQuestionNumber(inputText);
    
    // NOTE: We don't remove options here because SmartInput needs to see them for detection
    // Backend should already be stripping options for dropdown questions
    
    // Apply business question formatting to cleaned text
    let formattedText = formatBusinessQuestions(cleanedText);
    
    // Convert remaining line breaks to HTML breaks
    formattedText = formattedText.replace(/\n/g, '<br/>');
    
    return formattedText;
  };

  return (
    <div 
      dangerouslySetInnerHTML={{ 
        __html: formatText(text) 
      }} 
    />
  );
};

export default BusinessQuestionFormatter;
