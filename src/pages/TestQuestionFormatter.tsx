import React from 'react';
import QuestionFormatter from '../components/QuestionFormatter';

const TestQuestionFormatter: React.FC = () => {
  const testCases = [
    {
      name: "Simple question",
      text: "What's your name and preferred name or nickname?",
    },
    {
      name: "Question in paragraph",
      text: "Welcome to Founderport. What's your name and preferred name or nickname? Let's get started.",
    },
    {
      name: "API response format",
      text: `Welcome to Founderport — Guided by Angel

Congratulations on taking your first step toward entrepreneurship.

Are you ready to begin your journey?

Let's start with the Getting to Know You questionnaire—so Angel can design a path that fits you perfectly. What's your name and preferred name or nickname?`,
    },
    {
      name: "Multiple questions",
      text: "What's your name? How old are you? Where are you from?",
    },
    {
      name: "Question with line break",
      text: "What is your business name\n?",
    },
    {
      name: "Question with machine tag",
      text: "[[Q:GKY.01]] What's your name and preferred name or nickname?",
    },
    {
      name: "Question with number",
      text: "Question 12 What's your name and preferred name or nickname?",
    },
    {
      name: "Thought Starter with question (ROOT CAUSE TEST)",
      text: `🧠 Thought Starter:

What one sentence captures what your business stands for?`,
    },
    {
      name: "Quick Tip with question (ROOT CAUSE TEST)",
      text: `💡 Quick Tip:

Based on some info you've previously entered, you can also select "Draft" and I'll use that information to create a draft answer for you to review and save you some time.`,
    },
    {
      name: "Thought Starter with multiple newlines (ROOT CAUSE TEST)",
      text: `🧠 Thought Starter:




Who are you helping, and how are you helping them?`,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold mb-8">QuestionFormatter Test Page</h1>
        {testCases.map((testCase, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">{testCase.name}</h2>
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <QuestionFormatter text={testCase.text} />
            </div>
            <div className="mt-4 text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded">
              <strong>Raw text:</strong> {testCase.text.substring(0, 150)}
              {testCase.text.length > 150 ? '...' : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestQuestionFormatter;

