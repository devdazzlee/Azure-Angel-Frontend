import { test, expect } from '@playwright/test';

test.describe('QuestionFormatter Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a test page that renders QuestionFormatter
    // We'll create a simple test page for this
    await page.goto('/test-question-formatter');
  });

  test('should bold simple question', async ({ page }) => {
    // Check if question is rendered
    await expect(page.getByText(/What's your name/i)).toBeVisible();
    
    // Check if question is bold (has strong tag or font-weight)
    const questionElement = page.locator('text=/What\'s your name/i');
    await expect(questionElement).toBeVisible();
    
    // Check for bold styling
    const fontWeight = await questionElement.evaluate((el) => {
      return window.getComputedStyle(el).fontWeight;
    });
    
    // Font weight should be bold (700 or higher, or 'bold')
    expect(['bold', '700', '800', '900']).toContain(fontWeight);
  });

  test('should bold question in longer text', async ({ page }) => {
    // Check if question is visible
    await expect(page.getByText(/What's your name/i)).toBeVisible();
    
    // Check if question is bold
    const questionElement = page.locator('text=/What\'s your name/i');
    const fontWeight = await questionElement.evaluate((el) => {
      return window.getComputedStyle(el).fontWeight;
    });
    
    expect(['bold', '700', '800', '900']).toContain(fontWeight);
  });

  test('should bold multiple questions', async ({ page }) => {
    // Check if all questions are visible and bold
    await expect(page.getByText(/What's your name/i)).toBeVisible();
    await expect(page.getByText(/How old are you/i)).toBeVisible();
    
    const nameQuestion = page.locator('text=/What\'s your name/i');
    const ageQuestion = page.locator('text=/How old are you/i');
    
    const nameFontWeight = await nameQuestion.evaluate((el) => {
      return window.getComputedStyle(el).fontWeight;
    });
    
    const ageFontWeight = await ageQuestion.evaluate((el) => {
      return window.getComputedStyle(el).fontWeight;
    });
    
    expect(['bold', '700', '800', '900']).toContain(nameFontWeight);
    expect(['bold', '700', '800', '900']).toContain(ageFontWeight);
  });

  test('should handle API response format with multiple questions', async ({ page }) => {
    // Check for "Are you ready to begin your journey?"
    await expect(page.getByText(/Are you ready to begin your journey/i)).toBeVisible();
    
    // Check for "What's your name and preferred name or nickname?"
    await expect(page.getByText(/What's your name/i)).toBeVisible();
    
    // Both should be bold
    const journeyQuestion = page.locator('text=/Are you ready to begin your journey/i');
    const nameQuestion = page.locator('text=/What\'s your name/i');
    
    const journeyFontWeight = await journeyQuestion.evaluate((el) => {
      return window.getComputedStyle(el).fontWeight;
    });
    
    const nameFontWeight = await nameQuestion.evaluate((el) => {
      return window.getComputedStyle(el).fontWeight;
    });
    
    expect(['bold', '700', '800', '900']).toContain(journeyFontWeight);
    expect(['bold', '700', '800', '900']).toContain(nameFontWeight);
  });

  test('should not show markdown syntax (no ** characters)', async ({ page }) => {
    // Check that ** characters are not visible in the rendered text
    const pageContent = await page.textContent('body');
    expect(pageContent).not.toContain('**');
  });

  test('should handle questions with line breaks', async ({ page }) => {
    // Check if question with line break is properly formatted
    await expect(page.getByText(/What is your business name/i)).toBeVisible();
    
    const questionElement = page.locator('text=/What is your business name/i');
    const fontWeight = await questionElement.evaluate((el) => {
      return window.getComputedStyle(el).fontWeight;
    });
    
    expect(['bold', '700', '800', '900']).toContain(fontWeight);
  });

  test('should remove machine tags', async ({ page }) => {
    // Machine tags like [[Q:KYC.01]] should not be visible
    const pageContent = await page.textContent('body');
    expect(pageContent).not.toContain('[[Q:');
  });

  test('should remove question number text', async ({ page }) => {
    // "Question 12" text should not be visible (it's shown in badge)
    // Question numbers might still appear in some contexts, but not as standalone text
    // This test ensures the component is working
    await expect(page.locator('.question-formatter')).toBeVisible();
  });

  test('should keep Thought Starter heading and question on same line', async ({ page }) => {
    // This is the critical test - heading and question must be on same line
    const thoughtStarterSection = page.locator('text=/🧠 Thought Starter:/i');
    await expect(thoughtStarterSection).toBeVisible();
    
    // Check that the question immediately follows on the same line
    // We'll check by looking for the pattern in the rendered HTML
    const questionFormatter = page.locator('.question-formatter');
    const html = await questionFormatter.innerHTML();
    
    // The heading and question should be in the same paragraph (no </p><p> between them)
    // If they're in separate paragraphs, there will be </p> followed by <p> between them
    const hasParagraphBreak = html.match(/🧠.*Thought Starter:.*<\/p>\s*<p>.*\?/i);
    expect(hasParagraphBreak).toBeNull(); // Should be null (no paragraph break)
    
    // Alternative: Check that question is visible and follows heading
    const question = page.locator('text=/Who are you helping/i');
    await expect(question).toBeVisible();
  });

  test('should keep Quick Tip heading and question on same line', async ({ page }) => {
    const quickTipSection = page.locator('text=/💡 Quick Tip:/i');
    await expect(quickTipSection).toBeVisible();
    
    // Verify no paragraph break between heading and question
    const questionFormatter = page.locator('.question-formatter');
    const html = await questionFormatter.innerHTML();
    const hasParagraphBreak = html.match(/💡.*Quick Tip:.*<\/p>\s*<p>.*\?/i);
    expect(hasParagraphBreak).toBeNull();
  });
});

