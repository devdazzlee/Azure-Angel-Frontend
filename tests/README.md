# Running Playwright Tests

## If you see "No tests" in Playwright UI:

1. **Make sure dev server is running:**
   ```bash
   npm run dev
   ```

2. **Close and reopen Playwright UI:**
   ```bash
   # Stop current UI (Ctrl+C)
   # Then restart:
   npm run test:ui
   ```

3. **Or run tests directly:**
   ```bash
   npm run test
   ```

## Test Discovery

The tests should be automatically discovered. If not:

1. Check that `playwright.config.ts` has `testDir: './tests'`
2. Check that test files end with `.spec.ts` or `.test.ts`
3. Make sure TypeScript is compiling correctly

## Current Tests

- `question-formatter.spec.ts` - 8 tests for QuestionFormatter component

## Troubleshooting

If tests still don't show:
1. Check browser console for errors
2. Verify the test page route `/test-question-formatter` is accessible
3. Run `npx playwright test --list` to verify test discovery

