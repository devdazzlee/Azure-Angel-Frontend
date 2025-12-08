// Simple manual test file - run this to verify QuestionFormatter works
// Usage: Import and render this component in your app to test

import React from 'react';
import QuestionFormatter from './QuestionFormatter';

const QuestionFormatterTest: React.FC = () => {
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
  ];

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-4">QuestionFormatter Test</h1>
      {testCases.map((testCase, index) => (
        <div key={index} className="border p-4 rounded">
          <h2 className="font-semibold mb-2">{testCase.name}</h2>
          <div className="bg-gray-50 p-4 rounded">
            <QuestionFormatter text={testCase.text} />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <strong>Raw text:</strong> {testCase.text.substring(0, 100)}...
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuestionFormatterTest;






