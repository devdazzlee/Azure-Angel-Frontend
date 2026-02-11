# Business Plan Progress Widget

A beautiful, animated progress tracking widget specifically designed for the Business Plan phase of the Angel AI assistant.

## Features

### 🎯 Section Tracking
- **9 Business Plan Sections**: Each section corresponds to a specific area of business planning
- **Dynamic Section Detection**: Automatically identifies the current section based on question number
- **Section Progress**: Shows progress within the current section (e.g., "2 of 4 questions")

### 📊 Progress Visualization
- **Linear Progress Bar**: Shows section completion percentage
- **Circular Progress Indicator**: Displays overall business plan completion
- **Section Navigation Dots**: Visual indicators for all sections with status (completed, current, upcoming)

### 🎨 Beautiful UI
- **Color-coded Sections**: Each section has its own color theme and icon
- **Smooth Animations**: Fade and scale transitions when switching sections
- **Responsive Design**: Works perfectly on desktop and mobile
- **Minimal & Clean**: Matches the existing sidebar theme

### 📱 Smart Integration
- **Phase-specific**: Only appears during the BUSINESS_PLAN phase
- **Real-time Updates**: Automatically updates as users answer questions
- **Fallback Handling**: Gracefully handles edge cases and unexpected question numbers

## Section Mapping

Based on the business plan structure from `constant.py`:

1. **Product/Service Details** (Questions 1-4)
   - Business idea, product/service, uniqueness, stage

2. **Business Overview** (Questions 5-7)
   - Business name, industry, short-term goals

3. **Market Research** (Questions 8-13)
   - Target customer, availability, problem solved, competitors, trends, differentiation

4. **Location & Operations** (Questions 14-17)
   - Location, facilities, delivery method, operational needs

5. **Marketing & Sales Strategy** (Questions 18-23)
   - Mission, marketing plan, sales method, USP, promotions, marketing needs

6. **Legal & Regulatory Compliance** (Questions 24-28)
   - Business structure, name registration, permits/licenses, insurance, compliance

7. **Revenue Model & Financials** (Questions 29-34)
   - Revenue model, pricing, financial tracking, funding, goals, costs

8. **Growth & Scaling** (Questions 35-41)
   - Scaling plans, long-term goals (operational, financial, marketing, administrative), expansion

9. **Challenges & Contingency Planning** (Questions 42-45)
   - Contingency plans, market adaptation, additional funding, 5-year vision

## Usage

```tsx
import BusinessPlanProgressWidget from './BusinessPlanProgressWidget';

<BusinessPlanProgressWidget
  currentQuestionNumber={currentQuestionNumber}
  totalQuestions={totalQuestions}
  className="shadow-lg"
/>
```

## Props

- `currentQuestionNumber: number` - The current question number (1-based)
- `totalQuestions: number` - Total number of business plan questions
- `className?: string` - Additional CSS classes for styling

## Integration

The widget is automatically integrated into the right sidebar via the `QuestionNavigator` component and only displays during the `BUSINESS_PLAN` phase.

## Animations

- **Section Transitions**: 300ms scale and opacity animations
- **Progress Updates**: Smooth 500ms progress bar animations
- **Hover Effects**: Subtle scale effects on interactive elements

## Accessibility

- **Semantic HTML**: Proper heading structure and ARIA labels
- **Color Contrast**: High contrast colors for readability
- **Screen Reader Support**: Descriptive text for progress indicators



