import React from 'react';
import { render, screen } from '@testing-library/react';
import QuestionFormatter from '../QuestionFormatter';

describe('QuestionFormatter', () => {
  test('bolds simple question', () => {
    const text = "What's your name and preferred name or nickname?";
    render(<QuestionFormatter text={text} />);
    
    const questionElement = screen.getByText(/What's your name/i);
    expect(questionElement).toBeInTheDocument();
    expect(questionElement.tagName).toBe('STRONG');
  });

  test('bolds question in longer text', () => {
    const text = "Welcome to Founderport. What's your name and preferred name or nickname? Let's get started.";
    render(<QuestionFormatter text={text} />);
    
    const questionElement = screen.getByText(/What's your name/i);
    expect(questionElement).toBeInTheDocument();
    expect(questionElement.tagName).toBe('STRONG');
  });

  test('bolds question at end of text', () => {
    const text = "Let's start with the Getting to Know You questionnaire. What's your name and preferred name or nickname?";
    render(<QuestionFormatter text={text} />);
    
    const questionElement = screen.getByText(/What's your name/i);
    expect(questionElement).toBeInTheDocument();
    expect(questionElement.tagName).toBe('STRONG');
  });

  test('bolds question with line breaks', () => {
    const text = "What is your business name\n?";
    render(<QuestionFormatter text={text} />);
    
    const questionElement = screen.getByText(/What is your business name\?/i);
    expect(questionElement).toBeInTheDocument();
    expect(questionElement.tagName).toBe('STRONG');
  });

  test('bolds multiple questions', () => {
    const text = "What's your name? How old are you?";
    render(<QuestionFormatter text={text} />);
    
    const nameQuestion = screen.getByText(/What's your name\?/i);
    const ageQuestion = screen.getByText(/How old are you\?/i);
    
    expect(nameQuestion.tagName).toBe('STRONG');
    expect(ageQuestion.tagName).toBe('STRONG');
  });

  test('removes machine tags', () => {
    const text = "[[Q:KYC.01]] What's your name?";
    render(<QuestionFormatter text={text} />);
    
    expect(screen.queryByText(/\[\[Q:KYC.01\]\]/)).not.toBeInTheDocument();
    expect(screen.getByText(/What's your name/i)).toBeInTheDocument();
  });

  test('removes question number text', () => {
    const text = "Question 12 What's your name?";
    render(<QuestionFormatter text={text} />);
    
    expect(screen.queryByText(/Question 12/)).not.toBeInTheDocument();
    expect(screen.getByText(/What's your name/i)).toBeInTheDocument();
  });

  test('handles API response format', () => {
    const apiText = `Welcome to Founderport — Guided by Angel

Congratulations on taking your first step toward entrepreneurship.

Are you ready to begin your journey?

Let's start with the Getting to Know You questionnaire—so Angel can design a path that fits you perfectly. What's your name and preferred name or nickname?`;

    render(<QuestionFormatter text={apiText} />);
    
    const journeyQuestion = screen.getByText(/Are you ready to begin your journey\?/i);
    const nameQuestion = screen.getByText(/What's your name/i);
    
    expect(journeyQuestion.tagName).toBe('STRONG');
    expect(nameQuestion.tagName).toBe('STRONG');
  });

  test('handles empty text', () => {
    render(<QuestionFormatter text="" />);
    expect(screen.getByText('')).toBeInTheDocument();
  });

  test('handles null text', () => {
    render(<QuestionFormatter text={null as any} />);
    expect(screen.getByText('')).toBeInTheDocument();
  });
});






