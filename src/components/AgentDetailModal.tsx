import React, { useState } from 'react';
import { X, MessageSquare, BookOpen, Globe, Shield, CheckCircle, Loader2, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import httpClient from '../api/httpClient';
import { toast } from 'react-toastify';

interface Agent {
  id?: string;
  agent_type: string;
  name: string;
  description?: string;
  expertise?: string;
  capabilities?: string[];
  research_sources?: string[];
}

interface AgentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
  businessContext: {
    industry?: string;
    location?: string;
    business_type?: string;
    business_name?: string;
  };
}

const AgentDetailModal: React.FC<AgentDetailModalProps> = ({
  isOpen,
  onClose,
  agent,
  businessContext
}) => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat'>('overview');

  if (!isOpen || !agent) return null;

  const getAgentIcon = (agentType: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'legal_compliance': <Shield className="h-6 w-6 text-blue-500" />,
      'financial_planning': <BookOpen className="h-6 w-6 text-green-500" />,
      'marketing_strategy': <Globe className="h-6 w-6 text-orange-500" />,
      'operations_management': <CheckCircle className="h-6 w-6 text-purple-500" />,
      'technology_integration': <BookOpen className="h-6 w-6 text-indigo-500" />,
      'risk_management': <Shield className="h-6 w-6 text-red-500" />,
    };
    return iconMap[agentType] || <BookOpen className="h-6 w-6 text-gray-500" />;
  };

  const getAgentColor = (agentType: string) => {
    const colorMap: Record<string, string> = {
      'legal_compliance': 'from-blue-500 to-blue-600',
      'financial_planning': 'from-green-500 to-green-600',
      'marketing_strategy': 'from-orange-500 to-orange-600',
      'operations_management': 'from-purple-500 to-purple-600',
      'technology_integration': 'from-indigo-500 to-indigo-600',
      'risk_management': 'from-red-500 to-red-600',
    };
    return colorMap[agentType] || 'from-gray-500 to-gray-600';
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    setLoading(true);
    setResponse('');

    try {
      const token = localStorage.getItem('sb_access_token');
      const res = await httpClient.post('/specialized-agents/agent-guidance', {
        question: question.trim(),
        agent_type: agent.agent_type,
        business_context: businessContext
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if ((res.data as any).success) {
        setResponse((res.data as any).result.guidance || 'No response available');
        toast.success('Response received!');
      } else {
        throw new Error((res.data as any).message || 'Failed to get response');
      }
    } catch (error: any) {
      console.error('Error getting agent guidance:', error);
      toast.error(error.response?.data?.message || 'Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-slideUp">
        {/* Header */}
        <div className={`bg-gradient-to-r ${getAgentColor(agent.agent_type)} text-white p-6 rounded-t-2xl relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                {getAgentIcon(agent.agent_type)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{agent.name}</h2>
                <p className="text-white/90 text-sm">{agent.expertise || agent.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-teal-600 border-b-2 border-teal-600 bg-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-teal-600 border-b-2 border-teal-600 bg-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat with Agent
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' ? (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">About This Agent</h3>
                <p className="text-gray-700 leading-relaxed">{agent.description || agent.expertise || 'No description available.'}</p>
              </div>

              {/* Capabilities */}
              {agent.capabilities && agent.capabilities.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Capabilities</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {agent.capabilities.map((cap, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-teal-600" />
                        <span className="text-sm text-gray-700 capitalize">{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Research Sources */}
              {agent.research_sources && agent.research_sources.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Research Sources</h3>
                  <div className="space-y-2">
                    {agent.research_sources.map((source, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                        <Globe className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-gray-700">{source}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Chat Interface */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Ask {agent.name} a question
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={`What would you like to know from ${agent.name}?`}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  rows={4}
                  disabled={loading}
                />
                <button
                  onClick={handleAskQuestion}
                  disabled={loading || !question.trim()}
                  className={`w-full bg-gradient-to-r ${getAgentColor(agent.agent_type)} hover:opacity-90 text-white py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Asking...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Ask Question</span>
                    </>
                  )}
                </button>
              </div>

              {/* Response */}
              {response && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Response</h4>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {response}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AgentDetailModal;









