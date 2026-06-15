import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Loader2, 
  Building2, 
  Search, 
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
  Lightbulb,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import httpClient from '../api/httpClient';
import ServiceProviderDetailModal from './ServiceProviderDetailModal';
import type { ServiceProviderRow } from '../utils/serviceProvider';
import {
  buildImplementationTaskContext,
  resolveActiveSubstepNumber,
} from '../utils/implementationTaskContext';
import {
  loadImplementationChat,
  saveImplementationChat,
  loadImplementationResearch,
  saveImplementationResearch,
  type PersistedAngelMessage,
} from '../utils/implementationSupportStorage';
import {
  implementationCachePolicy,
  useGetServiceProvidersQuery,
} from '../store/implementationApi';
import { generateDOCX } from '@/utils/documentGenerator';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  // The chat mode that produced this assistant reply. Tracked so the UI
  // can offer a download button only on drafts (the *Draft* mode).
  mode?: 'help' | 'draft' | 'brainstorm';
}

interface ImplementationTaskContext {
  id?: string;
  phase_name?: string;
  title?: string;
  description?: string;
  purpose?: string;
  current_substep?: number;
  substeps?: Array<{
    step_number?: number;
    title?: string;
    description?: string;
    completed?: boolean;
  }>;
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
  currentTask?: ImplementationTaskContext;
}

const FloatingComprehensiveSupport: React.FC<FloatingComprehensiveSupportProps> = ({
  taskContext,
  businessContext,
  angelCanHelp = [],
  sessionId,
  currentTask,
}) => {
  const [activeTab, setActiveTab] = useState<'providers' | 'research' | 'chat'>('chat');
  const [isMinimized, setIsMinimized] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  
  // Providers UI state (list data comes from RTK Query cache)
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  
  // Research state
  const [researchTopics, setResearchTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [researchResult, setResearchResult] = useState<any>(null);
  const [researchLoading, setResearchLoading] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const researchDepth: 'standard' = 'standard';
  const [researchProgress, setResearchProgress] = useState(0);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMode, setChatMode] = useState<'help' | 'draft' | 'brainstorm'>('help');
  // True for the period between loading a saved conversation for the
  // current task and the user either resuming it or starting fresh. While
  // true the chat tab shows a banner letting them choose; we don't make
  // them pick before they can chat — they can also just start typing and
  // the banner dismisses itself.
  const [hasRestoredHistory, setHasRestoredHistory] = useState(false);

  const chatBoxRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatHydratedRef = useRef(false);

  // Angel chat persists for the whole implementation venture (session), not
  // just the current task or panel interaction. Task context is injected on
  // each API call so answers stay step-aware while history carries forward.
  useEffect(() => {
    if (!sessionId) return;
    const restored = loadImplementationChat(sessionId).map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
    setMessages(restored);
    setHasRestoredHistory(restored.length > 0);
    chatHydratedRef.current = true;
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !chatHydratedRef.current) return;
    const serializable: PersistedAngelMessage[] = messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      mode: m.mode,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp),
    }));
    saveImplementationChat(sessionId, serializable);
  }, [messages, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const saved = loadImplementationResearch(sessionId);
    if (!saved) return;
    setCustomQuery(saved.customQuery || '');
    setResearchResult(saved.researchResult ?? null);
    setSelectedTopic(saved.selectedTopic);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    saveImplementationResearch(sessionId, {
      customQuery,
      researchResult,
      selectedTopic,
    });
  }, [sessionId, customQuery, researchResult, selectedTopic]);

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

  const providerQueryArgs = {
    sessionId,
    taskId: currentTask?.id ?? '',
    taskContext: buildImplementationTaskContext(currentTask, taskContext || 'business support'),
    category: currentTask?.phase_name || 'general',
    activeSubstep: resolveActiveSubstepNumber(currentTask),
  };

  const {
    data: providersResponse,
    isLoading: providersInitialLoading,
    isFetching: providersFetching,
    isError: providersError,
  } = useGetServiceProvidersQuery(providerQueryArgs, {
    skip: activeTab !== 'providers' || !sessionId || !currentTask?.id,
    ...implementationCachePolicy.serviceProviders,
  });

  const providers: ServiceProviderRow[] = providersResponse?.result?.providers ?? [];
  const providersLoading = providersInitialLoading || providersFetching;

  useEffect(() => {
    if (providersError) {
      toast.error('Failed to load service providers');
    }
  }, [providersError]);

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

  // Build a richer task-context blob so the chat backend has enough
  // ground truth to answer step-specific questions (e.g. "checklist for
  // EIN" instead of producing a marketing-plan checklist). The previous
  // implementation passed only the parent task *title*, which is why
  // Angel was hallucinating off-topic responses.
  const buildTaskContext = (): string =>
    buildImplementationTaskContext(currentTask, taskContext);

  const handleSendMessage = async (overrideContent?: string, modeOverride?: 'help' | 'draft' | 'brainstorm') => {
    const content = (overrideContent ?? chatInput).trim();
    if (!content) return;
    const mode = modeOverride ?? chatMode;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    // The conversation_history payload below needs to include the *current*
    // user message *and* any prior turns, so capture the snapshot before
    // appending instead of re-reading state (which is async and would
    // miss this turn for the very first prompt).
    const priorMessages = messages;
    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);
    // Once the user starts typing into a restored conversation, the
    // "Continue / Start fresh" banner is no longer relevant — they've
    // already chosen to continue.
    setHasRestoredHistory(false);

    try {
      const token = localStorage.getItem('sb_access_token');
      const response = await httpClient.post('/implementation/chat-with-angel', {
        session_id: sessionId,
        message: content,
        mode,
        business_context: businessContext,
        task_context: buildTaskContext(),
        conversation_history: priorMessages.slice(-10) // Last 10 messages for context
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if ((response.data as any)?.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: (response.data as any).result?.response || 'No response received',
          timestamp: new Date(),
          mode,
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
        timestamp: new Date(),
        mode,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  // Save a Draft-mode assistant reply as Word (.docx) via shared document export.
  const handleDownloadDraft = async (message: Message) => {
    const titleSlug = (currentTask?.title || 'angel-draft')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'angel-draft';
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const filename = `${titleSlug}-draft-${stamp}.docx`;
    const documentTitle = currentTask?.title?.trim() || 'Angel Draft';

    try {
      await generateDOCX(message.content, filename, documentTitle);
      toast.success('Word document downloaded');
    } catch (err) {
      console.error('Download failed', err);
      toast.error('Could not download the draft as Word');
    }
  };

  // A pre-populated suggestion should *send* on click — don't just drop
  // the text into the input box and force the user to press enter (which
  // produced duplicate entries). Pass the suggestion through to
  // `handleSendMessage` directly so it bypasses the stale-state read on
  // `chatInput`.
  const handleAngelHelpClick = (suggestion: string, modeOverride?: 'help' | 'draft' | 'brainstorm') => {
    if (modeOverride) setChatMode(modeOverride);
    handleSendMessage(suggestion, modeOverride);
  };

  const handleProviderClick = (provider: any) => {
    // Always show modal for detailed view
    setSelectedProvider(provider);
    setShowProviderModal(true);
  };

  const tabs = [
    { id: 'providers', label: 'Providers', icon: <Building2 className="h-3.5 w-3.5" /> },
    { id: 'research', label: 'Research', icon: <Search className="h-3.5 w-3.5" /> },
    { id: 'chat', label: 'Chat With Angel', icon: <MessageSquare className="h-3.5 w-3.5" /> }
  ];

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          aria-label="Open Angel support"
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-blue-600 px-3.5 py-2.5 text-white shadow-lg transition-all hover:from-teal-600 hover:to-blue-700 hover:shadow-xl"
        >
          <Bot className="h-5 w-5 shrink-0" aria-hidden />
          <span className="text-sm font-semibold">Angel</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed right-0 sm:right-4 top-0 sm:top-20 bottom-0 sm:bottom-4 w-full sm:w-[420px] lg:w-[480px] bg-white rounded-none sm:rounded-xl shadow-2xl border-0 sm:border border-gray-200 flex flex-col overflow-hidden z-40 animate-slideIn">
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

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* SERVICE PROVIDERS TAB */}
        {activeTab === 'providers' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-600 mb-3">
              Local and nationwide providers for this step
            </p>
            
            {providersLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                <p className="text-sm text-gray-600">Loading providers for this step…</p>
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

            {/* Mode-specific quick prompts. Each one ties Angel into the
                current Implementation step (the chat call sends rich
                step context — see buildTaskContext()) and switches the
                chat mode to match the requested action, so the system
                prompt server-side actually differs per choice. */}
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Angel Can Help You With:</h4>
              <div className="space-y-1.5">
                <button
                  onClick={() => handleAngelHelpClick('Help me better understand this step', 'help')}
                  className="w-full text-left p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs transition-colors border border-blue-200"
                  disabled={chatLoading}
                >
                  💬 Help me better understand this step
                </button>
                <button
                  onClick={() => handleAngelHelpClick('Draft the required document for this step', 'draft')}
                  className="w-full text-left p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs transition-colors border border-green-200"
                  disabled={chatLoading}
                >
                  ✍️ Draft the required document for this step
                </button>
                <button
                  onClick={() => handleAngelHelpClick('Brainstorm ideas for me to consider', 'brainstorm')}
                  className="w-full text-left p-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs transition-colors border border-orange-200"
                  disabled={chatLoading}
                >
                  💭 Brainstorm ideas for me to consider
                </button>
              </div>
            </div>

            {/* Saved-conversation banner — surfaced when we restore
                history for the active task on first arrival / when the
                user returns to a previously completed step. The user can
                pick up where they left off, or wipe and start fresh.
                Either way the banner clears. */}
            {hasRestoredHistory && messages.length > 0 && (
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2">
                <span className="text-xs text-teal-900">
                  Your Angel conversation is saved for this venture across tasks and refreshes
                  ({messages.length} message{messages.length === 1 ? '' : 's'}).
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHasRestoredHistory(false)}
                    className="text-xs font-medium text-teal-700 hover:text-teal-900 underline underline-offset-2"
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMessages([]);
                      setHasRestoredHistory(false);
                      saveImplementationChat(sessionId, []);
                    }}
                    className="text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded px-2.5 py-1 transition-colors"
                  >
                    Start fresh
                  </button>
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
                            // URLs in chat responses must look obviously
                            // clickable. Force a blue, underlined style and
                            // open in a new tab so the user doesn't lose
                            // their place. Inverted on user (teal-bg) bubbles
                            // for legibility.
                            a: ({ children, href }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={
                                  message.role === 'user'
                                    ? 'underline decoration-2 underline-offset-2 text-white hover:text-blue-100 break-words'
                                    : 'underline decoration-2 underline-offset-2 text-blue-600 hover:text-blue-800 break-words'
                                }
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      {/* When Angel produced this reply in *Draft* mode,
                          surface a Download button so the user can save
                          the document straight to their machine. We
                          require some real content (≥ 80 chars) to avoid
                          showing the button on terse refusals or
                          clarifying questions. */}
                      {message.role === 'assistant' &&
                        message.mode === 'draft' &&
                        message.content.trim().length >= 80 && (
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleDownloadDraft(message)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700 hover:bg-green-100 transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Download as Word
                            </button>
                          </div>
                        )}
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
                onClick={() => handleSendMessage()}
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

    </div>
  );
};

export default FloatingComprehensiveSupport;

