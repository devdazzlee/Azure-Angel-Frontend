import { useEffect, useState } from 'react';
import { fetchNextQuestion } from '../../services/authService';
import { toast } from 'react-toastify';
import QuestionDropdown from '../../components/QuestionDropdown';

interface ConversationPair {
  question: string;
  answer: string;
  questionNumber?: number;
}

export default function GkyForm() {
  const [history, setHistory] = useState<ConversationPair[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number | null>(null);
  const [currentInput, setCurrentInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const MAX_STEPS = 9;

  // 🧹 Helper to clean incoming AI responses
  const cleanQuestionText = (text: string): string => {
    return text
      .split('\n\n')
      .filter(p => !p.toLowerCase().startsWith("hello! i'm angel")) // remove Angel intro
      .join('\n\n')
      .replace(/Question \d+ of \d+:\s*.*?–\s*/i, '') // remove "Question X of Y: ..."
      .trim();
  };

  // 🔢 Helper to extract question number from AI response
  const extractQuestionNumber = (text: string): number | null => {
    // Look for patterns like [[Q:GKY.01]] or Question 1 of 20
    const tagMatch = text.match(/\[\[Q:GKY\.(\d+)\]\]/);
    if (tagMatch) {
      return parseInt(tagMatch[1], 10);
    }
    
    const questionMatch = text.match(/Question (\d+) of \d+/i);
    if (questionMatch) {
      return parseInt(questionMatch[1], 10);
    }
    
    return null;
  };

  // 🔢 Helper to determine question number based on conversation history
  const getQuestionNumberFromHistory = (): number => {
    // If we have history, the next question number is history.length + 1
    // If no history, it's question 1
    return history.length + 1;
  };

  // 🎯 Helper to detect if current question is a choice-based question
  const isChoiceQuestion = (questionText: string, questionNumber: number | null): boolean => {
    // GKY choice questions: GKY.02 (yes/no), GKY.04 (business type), GKY.06 (concerns)
    // Note: GKY.05 is a skill rating question (handled separately)
    const choiceQuestionNumbers = [2, 4, 6];
    if (questionNumber && choiceQuestionNumbers.includes(questionNumber)) {
      return true;
    }
    
    // Also check question text for bullet points or choice indicators
    const lowerText = questionText.toLowerCase();
    const hasBulletPoints = questionText.includes('•') || questionText.includes('-');
    const hasYesNo = (lowerText.includes('yes') && lowerText.includes('no')) || 
                     (lowerText.includes('have you started a business before')) ||
                     (lowerText.includes('are you planning to seek outside funding'));
    const hasSelectAll = lowerText.includes('select all that apply') || 
                         lowerText.includes('how do you plan to generate revenue') ||
                         lowerText.includes('how do you prefer to learn');
    
    return hasBulletPoints || hasYesNo || hasSelectAll;
  };

  // 📋 Helper to extract options from question text
  const extractOptions = (questionText: string): string[] => {
    const options: string[] = [];
    
    // Extract bullet points (• or -)
    const bulletPattern = /[•\-]\s*([^\n]+)/g;
    let match;
    while ((match = bulletPattern.exec(questionText)) !== null) {
      const option = match[1].trim();
      if (option && option.length > 0) {
        options.push(option);
      }
    }
    
    // If no bullet points found, check for Yes/No pattern
    if (options.length === 0) {
      const lowerText = questionText.toLowerCase();
      if (lowerText.includes('have you started a business before') || 
          lowerText.includes('are you planning to seek outside funding')) {
        // Extract Yes/No/Unsure from text
        if (lowerText.includes('yes')) options.push('Yes');
        if (lowerText.includes('no')) options.push('No');
        if (lowerText.includes('unsure')) options.push('Unsure');
      }
    }
    
    return options;
  };

  useEffect(() => {
    async function getFirstQuestion() {
      setLoading(true);
      try {
        const { result: { angelReply } } = await fetchNextQuestion('', {
          phase: 'gky',
          stepIndex: 0,
        });

        console.log("RESULT USEEFFECT", angelReply);
        

        const firstQ = cleanQuestionText(angelReply);
        const questionNumber = extractQuestionNumber(angelReply) || 1; // First question is always 1

        // Set no history yet — intro message removed
        setHistory([]);
        setCurrentQuestion(firstQ);
        setCurrentQuestionNumber(questionNumber);
      } catch (error) {
        // All error handling is now centralized in httpClient
      } finally {
        setLoading(false);
      }
    }

    getFirstQuestion();
  }, []);

  const handleNext = async (inputOverride?: string, skipStep = false) => {
    const input = (inputOverride ?? currentInput).trim();
    if (!input) {
      toast.warning('Please provide an answer before proceeding.');
      return;
    }

    setLoading(true);
    setCurrentInput(''); // clear input immediately

    setHistory(prev => [
      ...prev,
      { question: currentQuestion, answer: input, questionNumber: currentQuestionNumber }
    ]);

    try {
      const { result: { angelReply, progress } } = await fetchNextQuestion(input, {
        phase: 'gky',
        stepIndex,
        skipStep
      });

      const nextQuestion = cleanQuestionText(angelReply);
      const nextQuestionNumber = extractQuestionNumber(angelReply) || (history.length + 2); // +2 because we just added current question to history

      // Trust backend for progress
      if (!skipStep && typeof progress === 'number') {
        setStepIndex(progress);
      }

      setCurrentQuestion(nextQuestion);
      setCurrentQuestionNumber(nextQuestionNumber);
    } catch (error) {
      // Roll back if error
      setHistory(prev => prev.slice(0, -1));
      setCurrentInput(input); // restore input on error
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = ((stepIndex + 1) / MAX_STEPS) * 100;

  if (stepIndex >= MAX_STEPS) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Business Plan Complete!</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Congratulations! You've successfully completed your comprehensive business plan. Angel will now generate your detailed roadmap to guide you through implementation.
            </p>
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800 font-medium">🎯 What's Next?</p>
              <p className="text-blue-700 text-sm mt-1">Phase 2: Your personalized roadmap with actionable tasks, supplier recommendations, and step-by-step guidance.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-[10%]">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Business Plan Creation</h1>
          <p className="text-gray-600 text-lg">Angel will guide you through 9 essential questions to build your comprehensive business plan</p>
        </div>

        <div className="mb-12">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-gray-700">{stepIndex + 1} of {MAX_STEPS}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3 space-y-8">
            {history.map((pair, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Question {pair.questionNumber || (idx + 1)}
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium leading-relaxed whitespace-pre-wrap">
                        {pair.question.replace(/Question \d+ of \d+:\s*.*?–\s*/i, '').trim()}
                      </p>
                    </div>
                  </div>
                </div>
                {pair.answer && (
                  <div className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700 leading-relaxed bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                          {pair.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Current Question */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-200">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    {!loading && (
                      <div className="mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Question {currentQuestionNumber || (history.length + 1)}
                        </span>
                      </div>
                    )}
                    <p className="text-gray-900 font-medium leading-relaxed whitespace-pre-wrap">
                      {loading ? 'Angel is thinking…' : currentQuestion || 'Loading question...'}
                    </p>

                  </div>
                </div>
              </div>
              <div className="p-6">
                {(() => {
                  const isChoice = isChoiceQuestion(currentQuestion, currentQuestionNumber);
                  const options = isChoice ? extractOptions(currentQuestion) : [];
                  
                  // Show QuestionDropdown for choice questions
                  if (isChoice && options.length > 0) {
                    return (
                      <div className="space-y-4">
                        <QuestionDropdown
                          options={options}
                          onSubmit={(value) => {
                            // User must click "Submit" button - this is called only after submit
                            handleNext(value);
                          }}
                          onCancel={() => {
                            // Clear selection — user can re-pick
                          }}
                          placeholder="Select an option..."
                          disabled={loading}
                        />
                        {loading && (
                          <div className="flex items-center justify-center py-4">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-2 text-gray-600">Processing...</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  // Show textarea for text-based questions
                  return (
                    <div className="space-y-4">
                      <textarea
                        className="w-full border-2 border-gray-200 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                        rows={4}
                        placeholder="Share your thoughts here..."
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.currentTarget.value)}
                        onKeyDown={(e) => {
                          if (e.shiftKey && e.key === 'Enter') {
                            e.preventDefault();
                            handleNext();
                          }
                        }}
                        disabled={loading}
                      />
                      {/* Quick Commands */}
                      <div className="flex flex-wrap gap-2">
                        {['Support', 'Draft', 'Scrapping'].map((cmd) => (
                          <button
                            key={cmd}
                            className="px-3 py-1 bg-gray-100 text-sm text-gray-700 rounded-full hover:bg-blue-100 transition"
                            onClick={async () => {
                              if (loading) return;
                              const command = cmd;
                              setCurrentInput(command);
                              await handleNext(command, true); // Pass skipStep = true
                            }}
                          >
                            {cmd}
                          </button>
                        ))}
                      </div>

                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">
                          {currentInput.length} characters
                        </p>
                        <button
                          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 flex items-center space-x-2"
                          onClick={() => handleNext(currentInput)}
                          disabled={!currentInput.trim() || loading}
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <span>Reply</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Journey</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Discovery Phase</p>
                    <p className="text-sm text-gray-600">Understanding your vision</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 opacity-50">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Analysis</p>
                    <p className="text-sm text-gray-600">AI processing your data</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 opacity-50">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Roadmap</p>
                    <p className="text-sm text-gray-600">Your personalized plan</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">💡 Angel's Tip</h4>
                <p className="text-sm text-blue-800">
                  Use commands like "Support" for guidance, "Draft" for AI help, or "Scrapping: [bullet points]" to refine your ideas. Angel adapts to your business context and location!
                </p>
              </div>

              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">🎯 9 Business Plan Sections</h4>
                <div className="text-sm text-green-800 space-y-1">
                  <p>• Business Overview</p>
                  <p>• Product/Service Details</p>
                  <p>• Market Research</p>
                  <p>• Location & Operations</p>
                  <p>• Revenue Model & Financials</p>
                  <p>• Marketing & Sales Strategy</p>
                  <p>• Legal & Administrative</p>
                  <p>• Growth & Scaling</p>
                  <p>• Challenges & Contingency</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
