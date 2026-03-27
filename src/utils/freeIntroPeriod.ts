/**
 * Free Intro Period Configuration
 * 
 * Defines the period during which users bypass the payment modal and get free access
 * to premium features (like Roadmap generation).
 */

// Free period ends on August 30, 2026.
const FREE_INTRO_PERIOD_END = new Date('2026-08-30T23:59:59Z');

/**
 * Checks if the current date is within the free intro period.
 * @returns {boolean} true if currently in the free intro period
 */
export const checkIsFreeIntroPeriod = (): boolean => {
  return new Date() <= FREE_INTRO_PERIOD_END;
};
