/**
 * Pricing Configuration for Angel AI Documents
 * 
 * Centralized pricing for all downloadable documents.
 * Update these values to change pricing across the entire application.
 */

export interface PricingConfig {
  amount: number;
  currency: string;
  itemName: string;
  description: string;
}

export const PRICING = {
  // Business Plan Documents
  BUSINESS_PLAN_FULL: {
    amount: 49.99,
    currency: 'USD',
    itemName: 'Business Plan Document',
    description: 'Complete business plan with all sections, financial projections, and market analysis'
  } as PricingConfig,

  BUSINESS_PLAN_SUMMARY: {
    amount: 29.99,
    currency: 'USD',
    itemName: 'Business Plan Summary Document',
    description: 'High-level business plan summary with key highlights and recommendations'
  } as PricingConfig,

  // Roadmap Documents
  LAUNCH_ROADMAP: {
    amount: 39.99,
    currency: 'USD',
    itemName: 'Launch Roadmap Document',
    description: 'Step-by-step launch roadmap with timelines, milestones, and service providers'
  } as PricingConfig,

  // Implementation Documents (Future)
  IMPLEMENTATION_PLAN: {
    amount: 59.99,
    currency: 'USD',
    itemName: 'Implementation Plan Document',
    description: 'Detailed implementation plan with tasks, resources, and tracking'
  } as PricingConfig,

  // Bundle Pricing (Future)
  COMPLETE_BUNDLE: {
    amount: 99.99,
    currency: 'USD',
    itemName: 'Complete Business Package',
    description: 'All documents: Business Plan, Roadmap, and Implementation Plan'
  } as PricingConfig
};

/**
 * Get pricing for a specific document type
 */
export const getPricing = (documentType: keyof typeof PRICING): PricingConfig => {
  return PRICING[documentType];
};

/**
 * Format price for display
 */
export const formatPrice = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Check if user has already paid for a document
 * This can be enhanced to check against a backend API
 */
export const checkPaymentStatus = (sessionId: string, documentType: string): boolean => {
  // For now, check localStorage
  // In production, this should call a backend API
  const storageKey = `angel_payment_${sessionId}_${documentType}`;
  return localStorage.getItem(storageKey) === 'paid';
};

/**
 * Mark document as paid
 */
export const markAsPaid = (sessionId: string, documentType: string): void => {
  const storageKey = `angel_payment_${sessionId}_${documentType}`;
  localStorage.setItem(storageKey, 'paid');
  localStorage.setItem(`${storageKey}_timestamp`, new Date().toISOString());
};

/**
 * Clear payment status (for testing)
 */
export const clearPaymentStatus = (sessionId: string, documentType: string): void => {
  const storageKey = `angel_payment_${sessionId}_${documentType}`;
  localStorage.removeItem(storageKey);
  localStorage.removeItem(`${storageKey}_timestamp`);
};











