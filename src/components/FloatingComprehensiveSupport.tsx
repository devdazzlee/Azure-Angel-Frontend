import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Loader2, 
  Building2, 
  Search, 
  Users, 
  MessageSquare,
  Copy,
  Check,
  X,
  ExternalLink,
  Bot,
  Send,
  ChevronDown,
  ChevronUp,
  Minimize2,
  Maximize2,
  Scale,
  DollarSign,
  Megaphone,
  Settings,
  Shield,
  FileText,
  Target,
  Plus,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  Phone,
  Edit3,
  Rocket
} from 'lucide-react';
import httpClient from '../api/httpClient';
import ServiceProviderDetailModal from './ServiceProviderDetailModal';
import BusinessContextDisplay from './BusinessContextDisplay';
import AgentDetailModal from './AgentDetailModal';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface FloatingComprehensiveSupportProps {
  taskContext?: string;
  businessContext: {
    industry?: string;
    location?: string;
    business_type?: string;
    business_name?: string;
  };
  angelCanHelp: string[];
  sessionId: string;
  currentTask?: any;
}

const FloatingComprehensiveSupport: React.FC<FloatingComprehensiveSupportProps> = ({
  taskContext,
  businessContext,
  angelCanHelp = [],
  sessionId,
  currentTask
}) => {
  const [activeTab, setActiveTab] = useState<'providers' | 'research' | 'agents' | 'chat'>('providers');
  const [isMinimized, setIsMinimized] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  
  // Providers state
  const [providers, setProviders] = useState<any[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  
  // Research state
  const [researchTopics, setResearchTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [researchResult, setResearchResult] = useState<any>(null);
  const [researchLoading, setResearchLoading] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [researchDepth, setResearchDepth] = useState<'basic' | 'standard' | 'deep'>('standard');
  const [researchProgress, setResearchProgress] = useState(0);
  
  // Agents state
  const [agents, setAgents] = useState<any[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentType, setNewAgentType] = useState('');
  const [newAgentDescription, setNewAgentDescription] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMode, setChatMode] = useState<'help' | 'draft' | 'brainstorm'>('help');
  
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize research topics from angelCanHelp
  useEffect(() => {
    if (angelCanHelp && angelCanHelp.length > 0) {
      setResearchTopics(angelCanHelp);
    }
  }, [angelCanHelp]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch providers when tab is opened
  useEffect(() => {
    if (activeTab === 'providers' && providers.length === 0) {
      fetchProviders();
    }
  }, [activeTab]);

  // Fetch agents when tab is opened
  useEffect(() => {
    if (activeTab === 'agents' && agents.length === 0) {
      fetchAgents();
    }
  }, [activeTab]);

  const fetchProviders = async () => {
    setProvidersLoading(true);
    try {
      const token = localStorage.getItem('sb_access_token');
      const response = await httpClient.post('/implementation/service-providers', {
        session_id: sessionId,
        task_context: taskContext || currentTask?.title || 'business support',
        category: currentTask?.phase_name || 'general'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if ((response.data as any)?.success) {
        setProviders((response.data as any).result?.providers || []);
      }
    } catch (error: any) {
      console.error('Error fetching providers:', error);
      toast.error('Failed to load service providers');
    } finally {
      setProvidersLoading(false);
    }
  };

  const fetchAgents = async () => {
    setAgentsLoading(true);
    try {
      const token = localStorage.getItem('sb_access_token');
      const response = await httpClient.post('/specialized-agents/get-agents', {
        task_context: taskContext || currentTask?.title,
        business_context: businessContext
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if ((response.data as any)?.success) {
        setAgents((response.data as any).result?.agents || []);
      }
    } catch (error: any) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load specialized agents');
    } finally {
      setAgentsLoading(false);
    }
  };

  const conductResearch = async (query: string, depth: 'basic' | 'standard' | 'deep' = 'standard') => {
    if (!query.trim()) {
      toast.error('Please enter a research query');
      return;
    }

    setResearchLoading(true);
    setResearchProgress(0);
    setResearchResult(null);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setResearchProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 300);

    try {
      const token = localStorage.getItem('sb_access_token');
      const response = await httpClient.post('/specialized-agents/rag-research', {
        query: query.trim(),
        business_context: businessContext,
        research_depth: depth
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      clearInterval(progressInterval);
      setResearchProgress(100);
      
      if ((response.data as any)?.success) {
        setResearchResult((response.data as any).result);
        toast.success('Research completed successfully!');
      } else {
        throw new Error((response.data as any).message || 'Research failed');
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error('Error conducting research:', error);
      toast.error(error.response?.data?.message || 'Failed to conduct research');
    } finally {
      setResearchLoading(false);
      setTimeout(() => setResearchProgress(0), 500);
    }
  };

  const handleResearchTopic = async (topic: string) => {
    setSelectedTopic(topic);
    setCustomQuery(topic);
    await conductResearch(topic, researchDepth);
  };

  const handleCustomResearch = () => {
    if (customQuery.trim()) {
      conductResearch(customQuery, researchDepth);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const token = localStorage.getItem('sb_access_token');
      const response = await httpClient.post('/implementation/chat-with-angel', {
        session_id: sessionId,
        message: chatInput,
        mode: chatMode,
        business_context: businessContext,
        task_context: taskContext || currentTask?.title,
        conversation_history: messages.slice(-10) // Last 10 messages for context
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if ((response.data as any)?.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: (response.data as any).result?.response || 'No response received',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleAngelHelpClick = (suggestion: string) => {
    // Add as user message and get response
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: suggestion,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setChatInput(suggestion);
    handleSendMessage();
  };

  const handleProviderClick = (provider: any) => {
    // Always show modal for detailed view
    setSelectedProvider(provider);
    setShowProviderModal(true);
  };

  const getAgentIcon = (agentType: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'legal_compliance': <Scale className="h-5 w-5 text-blue-500" />,
      'financial_planning': <DollarSign className="h-5 w-5 text-green-500" />,
      'marketing_strategy': <Megaphone className="h-5 w-5 text-orange-500" />,
      'operations_management': <Settings className="h-5 w-5 text-purple-500" />,
      'technology_integration': <FileText className="h-5 w-5 text-indigo-500" />,
      'risk_management': <Shield className="h-5 w-5 text-red-500" />,
    };
    return iconMap[agentType] || <Users className="h-5 w-5 text-gray-500" />;
  };

  const tabs = [
    { id: 'providers', label: 'Providers', icon: <Building2 className="h-3.5 w-3.5" /> },
    { id: 'research', label: 'Research', icon: <Search className="h-3.5 w-3.5" /> },
    { id: 'agents', label: 'Agents', icon: <Users className="h-3.5 w-3.5" /> },
    { id: 'chat', label: 'Chat With Angel', icon: <MessageSquare className="h-3.5 w-3.5" /> }
  ];

  if (isMinimized) {
    return (
      <div className="fixed right-2 sm:right-4 bottom-4 z-40">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-teal-500 to-blue-600 text-white p-4 sm:p-5 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center gap-2 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Bot className="h-5 w-5 sm:h-6 sm:w-6 relative z-10 animate-bounce" />
          <span className="font-semibold text-sm sm:text-base relative z-10">Angel</span>
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed right-0 sm:right-4 top-0 sm:top-20 bottom-0 sm:bottom-4 w-full sm:w-[420px] bg-white rounded-none sm:rounded-xl shadow-2xl border-0 sm:border border-gray-200 flex flex-col overflow-hidden z-40 animate-slideIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-600 p-3 sm:p-4 text-white flex items-center justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-400/50 via-blue-400/50 to-indigo-500/50 animate-pulse"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Bot className="h-5 w-5 sm:h-6 sm:w-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base">Comprehensive Support</h2>
            <p className="text-xs text-white/80">Powered by Angel AI</p>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors relative z-10"
        >
          <Minimize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[80px] px-2 py-2.5 text-xs font-medium transition-all flex items-center justify-center gap-1 ${
              activeTab === tab.id
                ? 'text-teal-600 border-b-2 border-teal-600 bg-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            {tab.icon}
            <span className="hidden xs:inline">{tab.label}</span>
            <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Business Context - Show once for all tabs */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-200 bg-gray-50">
        <BusinessContextDisplay businessContext={businessContext} />
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* SERVICE PROVIDERS TAB */}
        {activeTab === 'providers' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-600 mb-3">
              Local and nationwide providers for this step
            </p>
            
            {providersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : providers.length > 0 ? (
              <div className="space-y-2">
                {providers.map((provider, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleProviderClick(provider)}
                      className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm text-gray-900">{provider.name}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              provider.local 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {provider.local ? 'Local' : 'Nationwide'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">{provider.description}</p>
                        </div>
                        {provider.website && (
                          <ExternalLink className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 text-sm py-8">
                No providers available for this step
              </div>
            )}
          </div>
        )}

        {/* RESEARCH TAB */}
        {activeTab === 'research' && (
          <div className="space-y-3 sm:space-y-4">
            {/* Custom Research Query */}
            <div className="bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50 border border-teal-200/50 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg">
                  <Search className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Custom Research Query</h3>
              </div>
              
              <textarea
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Enter your research question or topic..."
                className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full mb-3"
                rows={3}
                disabled={researchLoading}
              />

              {/* Research Depth Selection */}
              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-700 mb-2 block">Research Depth</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'basic', label: 'Basic', desc: 'Quick overview', color: 'from-green-500 to-emerald-500' },
                    { value: 'standard', label: 'Standard', desc: 'Comprehensive', color: 'from-blue-500 to-cyan-500' },
                    { value: 'deep', label: 'Deep', desc: 'Extensive', color: 'from-purple-500 to-indigo-500' }
                  ].map((depth) => (
                    <button
                      key={depth.value}
                      onClick={() => setResearchDepth(depth.value as any)}
                      disabled={researchLoading}
                      className={`p-2.5 rounded-lg border-2 transition-all ${
                        researchDepth === depth.value
                          ? `bg-gradient-to-br ${depth.color} text-white border-transparent shadow-md scale-105`
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      } disabled:opacity-50`}
                    >
                      <div className="text-xs font-semibold">{depth.label}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">{depth.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCustomResearch}
                disabled={researchLoading || !customQuery.trim()}
                className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:shadow-none disabled:cursor-not-allowed"
              >
                {researchLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Researching...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Conduct Research</span>
                  </>
                )}
              </button>
            </div>

            {/* Suggested Research Topics */}
            {researchTopics.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Suggested Research Topics
                </h3>
                <div className="space-y-2">
                  {researchTopics.map((topic, index) => (
                    <button
                      key={index}
                      onClick={() => handleResearchTopic(topic)}
                      disabled={researchLoading}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 text-sm border ${
                        selectedTopic === topic
                          ? 'bg-gradient-to-r from-teal-50 to-blue-50 border-teal-300 shadow-sm'
                          : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-center gap-2">
                        <Search className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />
                        <span className="text-gray-800">{topic}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Beautiful Loading State */}
            {researchLoading && (
              <div className="bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50 border border-teal-200/50 rounded-xl p-6 shadow-sm">
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-teal-500 to-blue-600 p-4 rounded-full shadow-lg">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Conducting Research...</h4>
                  <p className="text-sm text-gray-600 mb-4">Gathering insights from authoritative sources</p>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-blue-500 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${Math.min(100, researchProgress)}%` }}
                    >
                      <div className="h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{Math.round(researchProgress)}% complete</p>
                </div>
              </div>
            )}

            {/* Research Results - Beautiful Display */}
            {researchResult && !researchLoading && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-lg animate-fadeIn">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm">Research Results</h4>
                  </div>
                  <button
                    onClick={() => handleCopy(researchResult.analysis || JSON.stringify(researchResult), 'research')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-medium transition-colors border border-teal-200"
                  >
                    {copied === 'research' ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                
                {/* Suggestion Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-800 flex items-center gap-2">
                    <Lightbulb className="h-3.5 w-3.5" />
                    <span>💡 You can copy this info and use it to chat with Angel.</span>
                  </p>
                </div>
                
                {/* Beautiful Markdown Content */}
                <div className="prose prose-sm sm:prose-base max-w-none 
                  prose-headings:font-bold prose-headings:text-gray-900
                  prose-h1:text-xl prose-h1:mb-4 prose-h1:mt-6 prose-h1:first:mt-0
                  prose-h2:text-lg prose-h2:mb-3 prose-h2:mt-5
                  prose-h3:text-base prose-h3:mb-2 prose-h3:mt-4
                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-3
                  prose-strong:text-gray-900 prose-strong:font-semibold
                  prose-ul:list-disc prose-ul:ml-4 prose-ul:mb-3 prose-ul:text-gray-700
                  prose-ol:list-decimal prose-ol:ml-4 prose-ol:mb-3 prose-ol:text-gray-700
                  prose-li:mb-1 prose-li:leading-relaxed
                  prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline
                  prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                  prose-blockquote:border-l-4 prose-blockquote:border-teal-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
                  prose-table:w-full prose-table:border-collapse prose-table:mb-4
                  prose-th:bg-gray-100 prose-th:font-semibold prose-th:p-2 prose-th:text-left prose-th:border prose-th:border-gray-300
                  prose-td:p-2 prose-td:border prose-td:border-gray-300
                  prose-img:rounded-lg prose-img:shadow-md prose-img:my-4">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-xl font-bold text-gray-900 mb-4 mt-6 first:mt-0 border-b border-gray-200 pb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-bold text-gray-900 mb-3 mt-5">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base font-semibold text-gray-800 mb-2 mt-4">{children}</h3>,
                      p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-3">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc ml-5 mb-3 text-gray-700 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal ml-5 mb-3 text-gray-700 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                      em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                      code: ({ children }) => <code className="bg-gray-100 text-sm px-1.5 py-0.5 rounded text-gray-800 font-mono">{children}</code>,
                      blockquote: ({ children }) => <blockquote className="border-l-4 border-teal-500 pl-4 italic text-gray-600 my-4">{children}</blockquote>,
                      a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 underline">{children}</a>,
                    }}
                  >
                    {researchResult.analysis || researchResult.summary || JSON.stringify(researchResult, null, 2)}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AGENTS TAB */}
        {activeTab === 'agents' && (
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-600 rounded-xl p-4 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 to-blue-400/20"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base mb-1 flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                      <Users className="h-4 w-4" />
                    </div>
                    Specialized Agents
                  </h3>
                  <p className="text-xs text-white/90">Expert guidance tailored to your business</p>
                </div>
                {!showCreateAgent && (
                  <button
                    onClick={() => setShowCreateAgent(true)}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg text-xs font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-1.5 border border-white/30"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create Agent
                  </button>
                )}
              </div>
            </div>
            
            {/* Create Agent Form */}
            {showCreateAgent && (
              <div className="bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50 border border-teal-200/50 rounded-xl p-4 shadow-sm animate-fadeIn">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 text-sm">Create New Agent</h4>
                  <button
                    onClick={() => {
                      setShowCreateAgent(false);
                      setNewAgentName('');
                      setNewAgentType('');
                      setNewAgentDescription('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Agent Name</label>
                    <input
                      type="text"
                      value={newAgentName}
                      onChange={(e) => setNewAgentName(e.target.value)}
                      placeholder="e.g., Marketing Specialist"
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Agent Type</label>
                    <select
                      value={newAgentType}
                      onChange={(e) => setNewAgentType(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select type...</option>
                      <option value="legal_compliance">Legal & Compliance</option>
                      <option value="financial_planning">Financial Planning</option>
                      <option value="marketing_strategy">Marketing Strategy</option>
                      <option value="operations_management">Operations Management</option>
                      <option value="technology_integration">Technology Integration</option>
                      <option value="risk_management">Risk Management</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Description</label>
                    <textarea
                      value={newAgentDescription}
                      onChange={(e) => setNewAgentDescription(e.target.value)}
                      placeholder="Describe what this agent specializes in..."
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (newAgentName && newAgentType) {
                          const newAgent = {
                            id: `custom_${Date.now()}`,
                            agent_type: newAgentType,
                            name: newAgentName,
                            description: newAgentDescription || `Custom agent: ${newAgentName}`,
                            expertise: newAgentDescription || `Specialized in ${newAgentName}`,
                            capabilities: ['guidance', 'research', 'recommendations']
                          };
                          setAgents([...agents, newAgent]);
                          setShowCreateAgent(false);
                          setNewAgentName('');
                          setNewAgentType('');
                          setNewAgentDescription('');
                          toast.success('Agent created successfully!');
                        } else {
                          toast.error('Please fill in agent name and type');
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white rounded-lg text-xs font-medium transition-all shadow-sm hover:shadow-md"
                    >
                      Create Agent
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateAgent(false);
                        setNewAgentName('');
                        setNewAgentType('');
                        setNewAgentDescription('');
                      }}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loading State */}
            {agentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-teal-500 to-blue-600 p-4 rounded-full shadow-lg">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Loading agents...</p>
                </div>
              </div>
            ) : agents.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {agents.map((agent, index) => {
                  const getAgentGradient = (type: string) => {
                    const gradients: Record<string, string> = {
                      'legal_compliance': 'from-blue-500 via-indigo-500 to-purple-600',
                      'financial_planning': 'from-emerald-500 via-teal-500 to-cyan-600',
                      'marketing_strategy': 'from-orange-500 via-amber-500 to-yellow-500',
                      'operations_management': 'from-purple-500 via-pink-500 to-rose-600',
                      'technology_integration': 'from-indigo-500 via-blue-500 to-cyan-600',
                      'risk_management': 'from-red-500 via-rose-500 to-pink-600',
                    };
                    return gradients[type] || 'from-teal-500 via-blue-500 to-indigo-600';
                  };

                  const getAgentBg = (type: string) => {
                    const bgs: Record<string, string> = {
                      'legal_compliance': 'from-blue-50 via-indigo-50 to-purple-50',
                      'financial_planning': 'from-emerald-50 via-teal-50 to-cyan-50',
                      'marketing_strategy': 'from-orange-50 via-amber-50 to-yellow-50',
                      'operations_management': 'from-purple-50 via-pink-50 to-rose-50',
                      'technology_integration': 'from-indigo-50 via-blue-50 to-cyan-50',
                      'risk_management': 'from-red-50 via-rose-50 to-pink-50',
                    };
                    return bgs[type] || 'from-teal-50 via-blue-50 to-indigo-50';
                  };

                  return (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedAgent(agent);
                        setShowAgentModal(true);
                      }}
                      className="relative bg-gradient-to-br from-white to-gray-50 border border-gray-200/50 rounded-2xl p-5 hover:border-teal-400/50 hover:shadow-2xl transition-all duration-500 cursor-pointer group overflow-hidden animate-fadeIn backdrop-blur-sm"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      {/* Animated Background Gradient */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${getAgentBg(agent.agent_type || 'custom')} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                      
                      {/* Shimmer Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      
                      {/* Content */}
                      <div className="relative z-10">
                        <div className="flex items-start gap-4">
                          {/* Icon Container */}
                          <div className={`relative p-4 rounded-2xl bg-gradient-to-br ${getAgentGradient(agent.agent_type || 'custom')} shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 flex-shrink-0`}>
                            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm"></div>
                            <div className="relative text-white">
                              {getAgentIcon(agent.agent_type || agent.id)}
                            </div>
                          </div>
                          
                          {/* Info Section */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-gray-900 text-base group-hover:text-teal-600 transition-colors">
                                    {agent.name}
                                  </h4>
                                  {agent.id?.startsWith('custom_') && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-full text-[10px] font-semibold shadow-sm">
                                      Custom
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-2">
                                  {agent.expertise || agent.description}
                                </p>
                              </div>
                            </div>
                            
                            {/* Capabilities */}
                            {agent.capabilities && agent.capabilities.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {agent.capabilities.slice(0, 3).map((cap: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2.5 py-1 bg-white/80 backdrop-blur-sm text-gray-700 rounded-lg text-[10px] font-semibold shadow-sm border border-gray-200/50"
                                  >
                                    {cap}
                                  </span>
                                ))}
                                {agent.capabilities.length > 3 && (
                                  <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-medium">
                                    +{agent.capabilities.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAgent(agent);
                                  setShowAgentModal(true);
                                }}
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group/btn"
                              >
                                <MessageSquare className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                                View Details
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTab('chat');
                                  setChatInput(`I'd like to consult with ${agent.name} about ${agent.expertise || agent.description}. `);
                                  setTimeout(() => {
                                    const chatInput = document.querySelector('textarea[placeholder*="Angel"]') as HTMLTextAreaElement;
                                    if (chatInput) {
                                      chatInput.focus();
                                      chatInput.setSelectionRange(chatInput.value.length, chatInput.value.length);
                                    }
                                  }, 100);
                                }}
                                className="px-4 py-2.5 bg-white border-2 border-teal-500 hover:bg-teal-50 text-teal-600 rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-8 text-center">
                <div className="mb-4">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-1">No Specialized Agents Available</h4>
                  <p className="text-xs text-gray-600 mb-4">Create custom agents to get expert guidance for your specific needs</p>
                </div>
                <button
                  onClick={() => setShowCreateAgent(true)}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Agent
                </button>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Suggested agent types:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['Legal Advisor', 'Financial Planner', 'Marketing Expert', 'Operations Manager'].map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setNewAgentName(type);
                          setShowCreateAgent(true);
                        }}
                        className="text-xs px-2.5 py-1 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-gray-700 transition-colors"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CHAT WITH ANGEL TAB */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            {/* Mode Selection */}
            <div className="flex gap-1 sm:gap-2 mb-2 sm:mb-3">
              <button
                onClick={() => setChatMode('help')}
                className={`flex-1 px-2 sm:px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                  chatMode === 'help'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                }`}
              >
                💬 Help
              </button>
              <button
                onClick={() => setChatMode('draft')}
                className={`flex-1 px-2 sm:px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                  chatMode === 'draft'
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                }`}
              >
                ✍️ Draft
              </button>
              <button
                onClick={() => setChatMode('brainstorm')}
                className={`flex-1 px-2 sm:px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                  chatMode === 'brainstorm'
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
                }`}
              >
                💭 Brainstorm
              </button>
            </div>

            {/* Angel Can Help Suggestions (Clickable) */}
            {angelCanHelp.length > 0 && messages.length === 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-2">Angel Can Help You With:</h4>
                <div className="space-y-1.5">
                  {angelCanHelp.slice(0, 5).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleAngelHelpClick(suggestion)}
                      className="w-full text-left p-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs transition-colors border border-teal-200"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages - Elastic Height */}
            <div
              ref={chatBoxRef}
              className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-200 space-y-2 sm:space-y-3"
              style={{ maxHeight: '400px', minHeight: '150px' }}
            >
              {messages.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Start a conversation with Angel...
                </p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[90%] sm:max-w-[85%] rounded-lg p-2 sm:p-3 ${
                        message.role === 'user'
                          ? 'bg-teal-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="text-xs mb-1 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="text-xs ml-4 mb-1">{children}</ul>,
                            ol: ({ children }) => <ol className="text-xs ml-4 mb-1">{children}</ol>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="mt-2 sm:mt-3 flex gap-2">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  chatMode === 'help'
                    ? 'Ask Angel for help...'
                    : chatMode === 'draft'
                    ? 'What would you like to draft?'
                    : 'Share your rough ideas...'
                }
                className="flex-1 p-2 border border-gray-300 rounded-lg text-sm resize-none"
                rows={2}
                disabled={chatLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={chatLoading || !chatInput.trim()}
                className="px-2 sm:px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
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

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }

        .animate-shimmer {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* Provider Detail Modal */}
      {showProviderModal && selectedProvider && (
        <ServiceProviderDetailModal
          provider={selectedProvider}
          isOpen={showProviderModal}
          onClose={() => {
            setShowProviderModal(false);
            setSelectedProvider(null);
          }}
        />
      )}

      {/* Agent Detail Modal */}
      {showAgentModal && selectedAgent && (
        <AgentDetailModal
          agent={selectedAgent}
          isOpen={showAgentModal}
          onClose={() => {
            setShowAgentModal(false);
            setSelectedAgent(null);
          }}
          businessContext={businessContext}
        />
      )}
    </div>
  );
};

export default FloatingComprehensiveSupport;

