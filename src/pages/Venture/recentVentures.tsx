import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { IRecentChats } from '../../types/apiTypes';
import { fetchSessions } from '../../services/authService';
import VentureLoader from '../../components/VentureLoader';

// Add animation styles
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
`;

const RecentVenturePage = () => {
  const [sessions, setSessions] = useState<IRecentChats[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const hasFetched = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    
    async function loadSessions() {
      try {
        const data = await fetchSessions();
        setSessions(Array.isArray(data) ? data : [data]);
      } catch (err) {
        console.error('Failed to load ventures:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, []);

  const goToChat = (sessionId: string) => {
    navigate(`/ventures/${sessionId}`);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  const getPhaseLabel = (phase: string) => {
    const labels: Record<string, string> = {
      'GKY': 'Getting to Know You',
      'BUSINESS_PLAN': 'Business Plan',
      'PLAN_TO_SUMMARY_TRANSITION': 'Plan Summary',
      'PLAN_TO_BUDGET_TRANSITION': 'Budget Planning',
      'PLAN_TO_ROADMAP_TRANSITION': 'Roadmap Prep',
      'ROADMAP': 'Roadmap',
      'ROADMAP_TO_IMPLEMENTATION_TRANSITION': 'Starting Implementation',
      'IMPLEMENTATION': 'Implementation',
      'COMPLETE': 'Completed',
    };
    return labels[(phase || '').toUpperCase()] || phase?.replace(/_/g, ' ') || 'In Progress';
  };

  const getPhaseColor = (phase: string) => {
    const normalized = (phase || '').toUpperCase();

    if (normalized === 'GKY') return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
    if (normalized === 'BUSINESS_PLAN') return 'bg-purple-50 text-purple-700 ring-1 ring-purple-200';
    if (normalized.startsWith('PLAN_TO')) return 'bg-violet-50 text-violet-700 ring-1 ring-violet-200';
    if (normalized === 'ROADMAP') return 'bg-green-50 text-green-700 ring-1 ring-green-200';
    if (normalized.startsWith('ROADMAP_TO')) return 'bg-teal-50 text-teal-700 ring-1 ring-teal-200';
    if (normalized === 'IMPLEMENTATION') return 'bg-orange-50 text-orange-700 ring-1 ring-orange-200';
    if (normalized === 'COMPLETE') return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';

    return 'bg-gray-50 text-gray-700 ring-1 ring-gray-200';
  };

  const QUESTION_COUNTS: Record<string, number> = {
    GKY: 6,
    BUSINESS_PLAN: 45,
    ROADMAP: 1,
    IMPLEMENTATION: 10,
  };

  const getProgressPercentage = (answeredCount: number, phase: string) => {
    const total = QUESTION_COUNTS[(phase || '').toUpperCase()] ?? 19;
    if (total <= 0) return 0;
    return Math.min((answeredCount / total) * 100, 100);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 py-28 px-4">
        <div className="max-w-7xl mx-auto">
        <div className="mb-16 text-center relative">

          <div className="inline-flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 via-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
              <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Your Ventures
          </h1>
          <p className="text-gray-600 text-lg">Continue building your entrepreneurial vision</p>
        </div>

        {loading ? (
          <VentureLoader title='Loading your ventures' />
        ) : sessions.length === 0 ? (
          <div className="text-center py-24">
            <div className="relative inline-block mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-teal-100 via-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto shadow-xl transform hover:rotate-6 transition-transform duration-300">
                <svg className="w-20 h-20 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">No ventures yet</h2>
            <p className="text-gray-600 text-lg mb-10 max-w-md mx-auto">Start your first business venture and begin your entrepreneurial journey today</p>
            <button
              onClick={() => navigate('/ventures/new-session')}
              className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 hover:from-teal-600 hover:via-blue-600 hover:to-purple-600 text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Start New Venture
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sessions.map((sesh, index) => (
              <div
                key={sesh.id}
                className="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border border-gray-100 hover:border-teal-200 transform hover:-translate-y-2"
                onClick={() => goToChat(sesh.id)}
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                }}
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 via-blue-50/50 to-purple-50/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Card content */}
                <div className="relative p-7">
                  {/* Header section */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-medium">
                        {sesh.created_at ? formatDate(sesh.created_at) : 'Recent'}
                      </span>
                      <svg className="w-5 h-5 text-gray-300 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-teal-600 transition-colors line-clamp-2">
                    {sesh.title || 'Untitled Venture'}
                  </h3>

                  {/* Phase badge */}
                  <div className="mb-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${getPhaseColor(sesh.current_phase)}`}>
                      <span className="w-1.5 h-1.5 bg-current rounded-full mr-2"></span>
                      {getPhaseLabel(sesh.current_phase)}
                    </span>
                  </div>

                  {/* Progress section */}
                  <div className="mb-5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold text-gray-700">Progress</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-teal-600">{Math.round(getProgressPercentage(sesh.answered_count || 0, sesh.current_phase))}%</span>
                        <span className="text-xs text-gray-500">({sesh.answered_count || 0} steps)</span>
                      </div>
                    </div>
                    <div className="relative w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 rounded-full transition-all duration-700 shadow-sm"
                        style={{ width: `${getProgressPercentage(sesh.answered_count || 0, sesh.current_phase)}%` }}
                      >
                        <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer section */}
                <div className="relative px-7 py-5 bg-gradient-to-r from-teal-50/80 to-blue-50/80 border-t border-gray-100 rounded-b-3xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Ready to continue</span>
                    </div>
                    <button className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white px-5 py-2 rounded-xl font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg group-hover:scale-105">
                      Continue
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {sessions.length > 0 && (
          <div ref={bottomRef} className="text-center mt-16">
            <button
              onClick={() => navigate('/ventures/new-session')}
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 hover:from-teal-600 hover:via-blue-600 hover:to-purple-600 text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Start New Venture
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        )}
        </div>

        {/* Scroll to bottom button */}
        {!loading && sessions.length > 3 && (
          <div className="fixed bottom-8 right-8 z-50 group">
            <button
              onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="w-11 h-11 flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:text-teal-600 hover:border-teal-300 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
            <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
              Scroll to Start New Venture
            </span>
          </div>
        )}
      </div>
    </>
  );
};

export default RecentVenturePage;
