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

  const getPhaseColor = (phase: string) => {
    const phaseColors = {
      'GKY': 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300',
      'BUSINESS_PLAN': 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300',
      'ROADMAP': 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300',
      'IMPLEMENTATION': 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-300',
      'COMPLETE': 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300'
    };
    const normalized = (phase || '').toUpperCase();
    return phaseColors[normalized as keyof typeof phaseColors] || 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300';
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
              className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 hover:from-teal-600 hover:via-blue-600 hover:to-purple-600 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex-1">
                      {/* Venture icon */}
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">
                        {sesh.title || 'Untitled Venture'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {sesh.created_at ? formatDate(sesh.created_at) : 'Recent'}
                      </div>
                    </div>
                    <div className="flex items-center text-gray-300 group-hover:text-teal-500 transition-all duration-300 group-hover:translate-x-1">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Phase badge */}
                  <div className="mb-5">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm ${getPhaseColor(sesh.current_phase)}`}>
                      <span className="w-2 h-2 bg-current rounded-full mr-2 animate-pulse"></span>
                      {sesh.current_phase || 'In Progress'}
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
          <div className="text-center mt-16">
            <button
              onClick={() => navigate('/ventures/new-session')}
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 hover:from-teal-600 hover:via-blue-600 hover:to-purple-600 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      </div>
    </>
  );
};

export default RecentVenturePage;
