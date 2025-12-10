# Testing Guide

This project uses **Playwright** for end-to-end testing. All tests should be run after implementing features to ensure everything works correctly.

## Setup

Playwright is already installed. If you need to reinstall browsers:

```bash
npx playwright install
```

## Running Tests

### Run all tests
```bash
npm run test
# or
yarn test
```

### Run tests with UI (recommended for debugging)
```bash
npm run test:ui
# or
yarn test:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
# or
yarn test:headed
```

### Debug tests
```bash
npm run test:debug
# or
yarn test:debug
```

## Test Structure

Tests are located in the `tests/` directory:
- `question-formatter.spec.ts` - Tests for QuestionFormatter component

## Test Page

A test page is available at `/test-question-formatter` to manually verify the QuestionFormatter component works correctly.

## Writing New Tests

When adding new features, always create corresponding Playwright tests:

1. Create test file in `tests/` directory
2. Use descriptive test names
3. Test both positive and negative cases
4. Test edge cases
5. Run tests before committing

## Example Test

```typescript
import { test, expect } from '@playwright/test';

test('should do something', async ({ page }) => {
  await page.goto('/your-page');
  await expect(page.getByText('Expected text')).toBeVisible();
});
```

## Best Practices

1. **Always test after implementation** - Never skip testing
2. **Test user interactions** - Click buttons, fill forms, navigate
3. **Test visual elements** - Check if elements are visible, styled correctly
4. **Test edge cases** - Empty states, error states, boundary conditions
5. **Keep tests independent** - Each test should work standalone
6. **Use descriptive names** - Test names should explain what they test

## CI/CD

Tests should run automatically in CI/CD pipelines. Make sure all tests pass before merging.












