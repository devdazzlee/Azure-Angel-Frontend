import { parseBusinessPlanQuestionParts } from '../QuestionFormatter';

function assertOk(value: unknown, message?: string) {
  if (!value) throw new Error(message || 'Assertion failed');
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${String(expected)} but got ${String(actual)}`);
  }
}

function assertDeepEqual(actual: unknown, expected: unknown, message?: string) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) {
    throw new Error(message || `Expected ${b} but got ${a}`);
  }
}

const result1 = parseBusinessPlanQuestionParts(`What problem does your business solve?

Include who has this problem and why it matters.

How big is the pain point?`);

assertEqual(result1.mainQuestion, 'What problem does your business solve?');
assertDeepEqual(result1.helperLines, [
  'Include who has this problem and why it matters.',
  'How big is the pain point?',
]);

const result2 = parseBusinessPlanQuestionParts(`What makes your business unique?

Pro Tip: Be specific and avoid generic claims.
Example: "We reduce onboarding time by 50%".
Consider: What do competitors not offer?`);

assertEqual(result2.mainQuestion, 'What makes your business unique?');
assertEqual(result2.thoughtStarters.length, 3);
assertOk(result2.thoughtStarters[0].toLowerCase().startsWith('pro tip:'));
assertOk(result2.thoughtStarters[1].toLowerCase().startsWith('example:'));
assertOk(result2.thoughtStarters[2].toLowerCase().startsWith('consider:'));

export {};
