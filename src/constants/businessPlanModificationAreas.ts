export interface BusinessPlanModificationArea {
  id: string;
  title: string;
  description: string;
  questions: string[];
}

export const BUSINESS_PLAN_MODIFICATION_AREAS: BusinessPlanModificationArea[] = [
  {
    id: 'business-overview',
    title: 'Business Overview',
    description: 'Core business concept, mission, vision, and value proposition',
    questions: [
      'Is your business concept clearly defined?',
      'Are your mission and vision statements compelling?',
      'Is your value proposition unique and marketable?',
    ],
  },
  {
    id: 'market-research',
    title: 'Market Research & Analysis',
    description: 'Target market, customer segments, and competitive landscape',
    questions: [
      'Have you thoroughly researched your target market?',
      'Are your customer personas detailed and accurate?',
      'Is your competitive analysis comprehensive?',
    ],
  },
  {
    id: 'financial-projections',
    title: 'Financial Projections',
    description: 'Revenue models, cost structure, and financial forecasts',
    questions: [
      'Are your revenue projections realistic?',
      'Have you accounted for all startup costs?',
      'Do you have a clear path to profitability?',
    ],
  },
  {
    id: 'operations',
    title: 'Operations & Logistics',
    description: 'Day-to-day operations, supply chain, and resource requirements',
    questions: [
      'Are your operational processes clearly defined?',
      'Have you identified key suppliers and partners?',
      'Is your resource planning complete?',
    ],
  },
  {
    id: 'marketing-strategy',
    title: 'Marketing & Sales Strategy',
    description: 'Customer acquisition, branding, and sales processes',
    questions: [
      'Is your marketing strategy comprehensive?',
      'Have you defined your sales process?',
      'Are your branding elements consistent?',
    ],
  },
  {
    id: 'legal-compliance',
    title: 'Legal & Compliance',
    description: 'Business structure, licenses, permits, and regulatory requirements',
    questions: [
      'Is your business structure optimal?',
      'Have you identified all required licenses?',
      'Are you compliant with regulations?',
    ],
  },
];
