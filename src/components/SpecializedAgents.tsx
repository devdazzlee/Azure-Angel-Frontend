import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Loader2, 
  Users, 
  Lightbulb, 
  AlertCircle, 
  CheckCircle,
  Shield,
  DollarSign,
  Settings,
  Megaphone,
  Target,
  Rocket,
} from 'lucide-react';
import httpClient from '../api/httpClient';
import { type Agent, type AgentsResponse, type AgentGuidanceResponse } from '../types/apiTypes';

// Agent interface is imported from types/apiTypes.ts

interface SpecializedAgentsProps {
  businessContext: {
    industry?: string;
    location?: string;
    business_type?: string;
    business_name?: string;
  };
  onAgentResponse?: (agent: Agent, response: string) => void;
  className?: string;
  cachedData?: AgentsResponse | null;
  isLoading?: boolean;
  allowSelfFetch?: boolean;
}

const SpecializedAgents: React.FC<SpecializedAgentsProps> = ({
  businessContext,
  onAgentResponse,
  className = "",
  cachedData,
  isLoading = false,
  allowSelfFetch = true
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<string>('');

  useEffect(() => {
    if (cachedData) {
      // Use cached data
      if (cachedData.success && cachedData.result && cachedData.result.agents) {
        setAgents(cachedData.result.agents);
        setAgentsLoading(false);
      } else {
        setError(cachedData.message || 'Failed to fetch agents');
        setAgents([]);
        setAgentsLoading(false);
      }
    } else if (!isLoading && allowSelfFetch) {
      // Only fetch if not loading/no cache and self-fetch allowed
      fetchAvailableAgents();
    }
  }, [cachedData, isLoading, allowSelfFetch]);

  const fetchAvailableAgents = async () => {
    try {
      setAgentsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('sb_access_token');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const response = await httpClient.get('/specialized-agents/agents', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = response.data as AgentsResponse;
      if (data.success && data.result && data.result.agents) {
        setAgents(data.result.agents);
      } else {
        setError(data.message || 'Failed to fetch agents');
        setAgents([]); // Ensure agents is always an array
      }
    } catch (err: unknown) {
      console.error('Error fetching agents:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to fetch agents');
      setAgents([]); // Ensure agents is always an array
    } finally {
      setAgentsLoading(false);
    }
  };

  const getAgentGuidance = async () => {
    if (!selectedAgent || !question.trim()) {
      setError('Please select an agent and enter a question');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('sb_access_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await httpClient.post('/specialized-agents/agent-guidance', {
        question: question.trim(),
        agent_type: selectedAgent,
        business_context: businessContext
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = response.data as AgentGuidanceResponse;
      if (data.success) {
        const guidance = data.result.guidance || 'No guidance available';
        setResponse(guidance);
        
        const agent = agents.find(a => a.agent_type === selectedAgent);
        if (agent) {
          onAgentResponse?.(agent, guidance);
        }
        
        toast.success('Agent guidance received successfully!');
      } else {
        setError(data.message || 'Failed to get agent guidance');
      }
    } catch (err: unknown) {
      console.error('Error getting agent guidance:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to get agent guidance');
    } finally {
      setLoading(false);
    }
  };

  const getAgentIcon = (agentType: string, iconColor: string = 'text-white') => {
    switch (agentType) {
      case 'legal_compliance':
        return <Shield className={`h-5 w-5 ${iconColor}`} />;
      case 'financial_planning':
        return <DollarSign className={`h-5 w-5 ${iconColor}`} />;
      case 'product_operations':
        return <Settings className={`h-5 w-5 ${iconColor}`} />;
      case 'marketing_customer':
        return <Megaphone className={`h-5 w-5 ${iconColor}`} />;
      case 'business_strategy':
        return <Target className={`h-5 w-5 ${iconColor}`} />;
      case 'roadmap_execution':
        return <Rocket className={`h-5 w-5 ${iconColor}`} />;
      default:
        return <Users className={`h-5 w-5 ${iconColor}`} />;
    }
  };

  const getAgentColor = (agentType: string) => {
    switch (agentType) {
      case 'legal_compliance':
        return 'bg-blue-100 text-blue-800';
      case 'financial_planning':
        return 'bg-green-100 text-green-800';
      case 'product_operations':
        return 'bg-purple-100 text-purple-800';
      case 'marketing_customer':
        return 'bg-orange-100 text-orange-800';
      case 'business_strategy':
        return 'bg-red-100 text-red-800';
      case 'roadmap_execution':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden ${className}`}>
      {/* Beautiful Header */}
      <div className="bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-600 text-white p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 to-blue-400/20"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">Specialized Agents</h2>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm border border-white/30">
            Expert Guidance
          </span>
        </div>
          </div>
          <p className="text-sm text-white/90 mt-2">
          Get expert guidance from specialized agents trained on credible sources.
        </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
                {/* Beautiful Loading State */}
                {(agentsLoading || isLoading) && (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <div className="relative inline-block mb-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                        <div className="relative bg-gradient-to-br from-teal-500 to-blue-600 p-5 rounded-full shadow-xl">
                          <Loader2 className="h-10 w-10 animate-spin text-white" />
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-700">Loading specialized agents...</p>
                      <p className="text-xs text-gray-500 mt-1">Fetching expert guidance resources</p>
                    </div>
                  </div>
                )}

        {/* Beautiful Error State */}
        {error && !agentsLoading && !isLoading && (
          <div className="bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 border-2 border-red-200/50 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-red-800 font-bold">Error</span>
            </div>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={fetchAvailableAgents}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
            >
              Try again
            </button>
          </div>
        )}

        {/* Beautiful Agent Selection */}
        {!agentsLoading && !isLoading && !error && (
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Select Specialized Agent</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents && agents.length > 0 ? agents.map((agent, index) => {
                const getAgentGradient = (type: string) => {
                  const gradients: Record<string, string> = {
                    'legal_compliance': 'from-blue-500 via-indigo-500 to-purple-600',
                    'financial_planning': 'from-emerald-500 via-teal-500 to-cyan-600',
                    'product_operations': 'from-purple-500 via-pink-500 to-rose-600',
                    'marketing_customer': 'from-orange-500 via-amber-500 to-yellow-500',
                    'business_strategy': 'from-red-500 via-rose-500 to-pink-600',
                    'roadmap_execution': 'from-indigo-500 via-blue-500 to-cyan-600',
                  };
                  return gradients[type] || 'from-teal-500 via-blue-500 to-indigo-600';
                };

                return (
                  <button
                    key={agent.agent_type}
                    onClick={() => setSelectedAgent(agent.agent_type)}
                    className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-300 ease-out group overflow-hidden ${
                      selectedAgent === agent.agent_type
                        ? `border-teal-500 bg-gradient-to-br ${getAgentGradient(agent.agent_type)} text-white shadow-2xl scale-[1.02]`
                        : 'border-gray-200 bg-white hover:border-teal-400 hover:shadow-xl hover:scale-[1.01]'
                    } animate-fadeIn`}
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    {/* Subtle Background Gradient on Hover (only when not selected) */}
                    {selectedAgent !== agent.agent_type && (
                      <div className={`absolute inset-0 bg-gradient-to-br ${getAgentGradient(agent.agent_type)} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 rounded-2xl`}></div>
                    )}
                    
                    <div className="relative z-10">
                      <div className="flex items-start gap-4 mb-3">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${getAgentGradient(agent.agent_type)} shadow-lg transition-transform duration-300 group-hover:scale-105 flex-shrink-0 ${
                          selectedAgent === agent.agent_type ? 'bg-white/20 backdrop-blur-sm' : ''
                        }`}>
                          {getAgentIcon(agent.agent_type, 'text-white')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-bold text-base mb-1.5 transition-colors duration-300 ${
                            selectedAgent === agent.agent_type ? 'text-white' : 'text-gray-900 group-hover:text-teal-600'
                          }`}>
                            {agent.name}
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm ${
                            selectedAgent === agent.agent_type 
                              ? 'bg-white/20 backdrop-blur-sm text-white' 
                              : getAgentColor(agent.agent_type)
                          }`}>
                            {agent.agent_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      </div>
                      <p className={`text-sm leading-relaxed mb-3 line-clamp-2 transition-colors duration-300 ${
                        selectedAgent === agent.agent_type ? 'text-white/90' : 'text-gray-700'
                      }`}>
                        {agent.expertise}
                      </p>
                      <div className={`mt-3 pt-3 border-t transition-colors duration-300 ${
                        selectedAgent === agent.agent_type ? 'border-white/20' : 'border-gray-100'
                      }`}>
                        <div className={`text-xs font-semibold mb-2 transition-colors duration-300 ${
                          selectedAgent === agent.agent_type ? 'text-white/80' : 'text-gray-600'
                        }`}>
                          Research Sources:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {agent.research_sources.slice(0, 2).map((source: string, idx: number) => (
                            <span key={idx} className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors duration-300 ${
                              selectedAgent === agent.agent_type
                                ? 'bg-white/20 backdrop-blur-sm text-white'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {source}
                            </span>
                          ))}
                          {agent.research_sources.length > 2 && (
                            <span className={`text-xs font-medium transition-colors duration-300 ${
                              selectedAgent === agent.agent_type ? 'text-white/70' : 'text-gray-500'
                            }`}>
                              +{agent.research_sources.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              }) : (
                <div className="col-span-full text-center py-12">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-8">
                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 font-medium">No specialized agents available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Beautiful Question Input */}
        {!agentsLoading && !isLoading && !error && agents && agents.length > 0 && (
          <div className="bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50 border-2 border-teal-200/50 rounded-2xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-400/10 to-blue-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl shadow-md">
                  <Lightbulb className="h-5 w-5 text-white" />
                </div>
                <label className="block text-sm font-bold text-gray-900">
              Ask {selectedAgent ? agents.find(a => a.agent_type === selectedAgent)?.name : 'an agent'}
            </label>
              </div>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question or request for guidance..."
              rows={4}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white/80 backdrop-blur-sm shadow-sm transition-all mb-4"
            />

              {/* Beautiful Get Guidance Button */}
            <div className="flex justify-end">
              <button
                onClick={getAgentGuidance}
                disabled={loading || !selectedAgent || !question.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 shadow-xl hover:shadow-2xl hover:scale-[1.02] disabled:shadow-none disabled:cursor-not-allowed disabled:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                    Getting Guidance...
                  </>
                ) : (
                  <>
                    <Lightbulb className="h-5 w-5 text-white" />
                    Get Expert Guidance
                  </>
                )}
              </button>
              </div>
            </div>
          </div>
        )}

        {/* Beautiful Agent Response */}
        {response && (
          <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200/50 rounded-2xl p-6 shadow-xl animate-fadeIn relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-green-200">
                <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">
                {agents.find(a => a.agent_type === selectedAgent)?.name} Response
              </h3>
            </div>
              <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl border border-gray-200/50 shadow-sm prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="text-xl font-bold text-gray-900 mb-4 mt-6 first:mt-0 border-b border-gray-200 pb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-bold text-gray-900 mb-3 mt-5">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-semibold text-gray-800 mb-2 mt-4">{children}</h3>,
                    p: ({ children }) => <p className="text-sm text-gray-700 leading-relaxed mb-3">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 mb-3">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal ml-5 space-y-1 text-sm text-gray-700 mb-3">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                    code: ({ children }) => <code className="bg-gray-100 text-gray-900 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-green-400 pl-4 italic text-gray-700 my-4">{children}</blockquote>,
                  }}
                >
                  {response}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Business Context - Removed to avoid duplication in FloatingComprehensiveSupport */}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
          will-change: transform, opacity;
        }
        .group:hover {
          will-change: transform;
        }
      `}</style>
    </div>
  );
};

export default SpecializedAgents;