import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSessions } from '../../services/authService';
import httpClient from '../../api/httpClient';

// Animation styles
const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }
`;

const ideaPool = [
  'Remote Mental Wellness Platform',
  'AI-Powered Resume Coach',
  'Freelancer Tax Helper',
  'Virtual Interior Designer',
  'Pet Nutrition Tracker',
  'AI Co-founder Generator',
  'Startup Naming Assistant',
  'Local Farmer Market Finder',
  'Green Habit Tracker',
  'AI-Powered Business Plan Writer',
  'Voice Note to Blog Converter',
  'Remote Team Culture Platform',
  'Online Skill Bartering App',
  'Personal Productivity AI',
  'Health Insurance Explainer',
  'Niche Job Board for Creators',
  'Startup Pitch Validator',
  'Parenting Support AI',
  'Language Buddy Matcher',
  'Remote Dev Hiring Board'
];

const NewVenture = () => {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingIdeas, setRemainingIdeas] = useState([...ideaPool]);
  const [loadingIdea, setLoadingIdea] = useState(false);
  const [aiGeneratedIdea, setAiGeneratedIdea] = useState<string | null>(null);
  const navigate = useNavigate();

  // TODO: Fetch AI-generated business ideas from backend
  // useEffect(() => {
  //   fetchAIBusinessIdeas();
  // }, []);

  // const fetchAIBusinessIdeas = async () => {
  //   try {
  //     const response = await httpClient.get('/api/business-ideas');
  //     setRemainingIdeas(response.data.ideas);
  //   } catch (error) {
  //     console.error('Failed to fetch AI ideas:', error);
  //   }
  // };

  const handleCreateVenture = async () => {
    if (!title.trim()) return;

    setStatus('loading');
    setErrorMessage(null);

    try {
      const venture = await createSessions(title);
      setStatus('success');

      setTimeout(() => {
        navigate(`/ventures/${venture.id}`);
      }, 1000);
    } catch (err) {
      setErrorMessage((err as Error).message || 'Could not create venture.');
      setStatus('error');
    }
  };

  const handleTryIdea = async () => {
    if (remainingIdeas.length === 0) return;

    setLoadingIdea(true);
    
    // Simulate AI generation delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));

    const randomIndex = Math.floor(Math.random() * remainingIdeas.length);
    const newIdea = remainingIdeas[randomIndex];

    setTitle(newIdea);
    setAiGeneratedIdea(newIdea);
    setRemainingIdeas(remainingIdeas.filter((_, idx) => idx !== randomIndex));
    setLoadingIdea(false);

    // TODO: Replace with actual API call to backend
    // try {
    //   const response = await httpClient.post('/api/generate-business-idea');
    //   setTitle(response.data.idea);
    //   setAiGeneratedIdea(response.data.idea);
    // } catch (error) {
    //   console.error('Failed to generate idea:', error);
    // } finally {
    //   setLoadingIdea(false);
    // }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-teal-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div 
          className="relative w-full max-w-2xl bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-10 md:p-12"
          style={{ animation: 'fadeInUp 0.8s ease-out' }}
        >
          {/* Header with icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 via-blue-500 to-purple-500 rounded-2xl shadow-lg mb-6 transform hover:scale-110 transition-transform duration-300">
              <svg className="w-11 h-11 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Start a New Venture
            </h1>
            <p className="text-gray-600 text-lg">Give your new business a name to begin your entrepreneurial journey</p>
          </div>

          {/* Input section */}
          <div className="space-y-6">
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Business Name
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. AI-Powered Tutor for Students"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && title.trim() && handleCreateVenture()}
                disabled={status === 'loading'}
                className="w-full px-6 py-4 rounded-2xl border-2 border-gray-200 focus:border-teal-400 focus:ring-4 focus:ring-teal-100 focus:outline-none transition-all duration-300 text-lg bg-white/80 backdrop-blur-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {aiGeneratedIdea && (
                <div 
                  className="absolute right-4 top-14 bg-gradient-to-r from-teal-500 to-blue-500 text-white text-xs px-3 py-1 rounded-full shadow-md"
                  style={{ animation: 'slideInRight 0.5s ease-out' }}
                >
                  AI Suggested ✨
                </div>
              )}
            </div>

            {/* AI Idea Generator Button */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-100/50 via-blue-100/50 to-purple-100/50 rounded-2xl blur-sm"></div>
              <button
                onClick={handleTryIdea}
                disabled={loadingIdea || remainingIdeas.length === 0}
                className="relative w-full py-4 px-6 bg-gradient-to-r from-teal-50 to-blue-50 hover:from-teal-100 hover:to-blue-100 border-2 border-dashed border-teal-300 hover:border-teal-400 rounded-2xl transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center gap-3">
                  {loadingIdea ? (
                    <>
                      <svg className="w-5 h-5 text-teal-600 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="font-semibold text-teal-700">Generating AI Idea...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 text-teal-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span className="font-semibold text-teal-700">Need Inspiration? Get AI Business Idea</span>
                      <svg className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </div>
              </button>
            </div>

            {/* Status messages */}
            {status === 'success' && (
              <div 
                className="flex items-center gap-3 text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-4 rounded-xl shadow-sm"
                style={{ animation: 'slideInRight 0.5s ease-out' }}
              >
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold">Venture created successfully!</p>
                  <p className="text-sm text-green-600">Redirecting to your new venture...</p>
                </div>
              </div>
            )}

            {status === 'error' && errorMessage && (
              <div 
                className="flex items-center gap-3 text-red-700 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm"
                style={{ animation: 'slideInRight 0.5s ease-out' }}
              >
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold">Error creating venture</p>
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Main action button */}
            <button
              onClick={handleCreateVenture}
              disabled={status === 'loading' || !title.trim()}
              className={`group relative w-full py-5 rounded-2xl font-bold text-lg transition-all duration-300 overflow-hidden ${
                status === 'loading' || !title.trim()
                  ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                  : 'bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 hover:from-teal-600 hover:via-blue-600 hover:to-purple-600 text-white shadow-xl hover:shadow-2xl transform hover:scale-[1.02]'
              }`}
            >
              {status === 'loading' ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Your Venture...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  Start New Venture
                  <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>

            {/* Back to ventures link */}
            <div className="text-center pt-4">
              <button
                onClick={() => navigate('/ventures')}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors group"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Your Ventures
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewVenture;
