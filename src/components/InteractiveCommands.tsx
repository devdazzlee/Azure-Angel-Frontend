import React, { useState } from 'react';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Loader2, 
  HelpCircle, 
  Phone, 
  Edit3, 
  FileText, 
  Rocket,
  AlertCircle,
  CheckCircle,

} from 'lucide-react';
import httpClient from '../api/httpClient';

interface CommandResponse {
  command: string;
  type: string;
  guidance?: any;
  providers?: any;
  refined_insights?: string;
  draft_content?: any;
  kickstart_plan?: any;
  provider_table?: any;
  message?: string;
}

interface InteractiveCommandsProps {
  businessContext: {
    industry?: string;
    location?: string;
    business_type?: string;
    business_name?: string;
  };
  onCommandComplete?: (response: CommandResponse) => void;
  className?: string;
}

const InteractiveCommands: React.FC<InteractiveCommandsProps> = ({
  businessContext,
  onCommandComplete,
  className = ""
}) => {
  const [selectedCommand, setSelectedCommand] = useState<string>('');
  const [context, setContext] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<CommandResponse | null>(null);

  const commands = [
    {
      id: 'help',
      name: 'Help',
      description: 'Get detailed assistance and guidance',
      icon: <HelpCircle className="h-5 w-5" />,
      gradient: 'from-blue-500 via-indigo-500 to-purple-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'contact',
      name: 'Who do I contact?',
      description: 'Find service providers and contacts',
      icon: <Phone className="h-5 w-5" />,
      gradient: 'from-green-500 via-emerald-500 to-teal-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'scrapping',
      name: 'Brainstorm',
      description: 'Research and analyze information',
      icon: <Edit3 className="h-5 w-5" />,
      gradient: 'from-purple-500 via-violet-500 to-indigo-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'draft',
      name: 'Draft',
      description: 'Create documents and templates',
      icon: <FileText className="h-5 w-5" />,
      gradient: 'from-orange-500 via-amber-500 to-yellow-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      id: 'kickstart',
      name: 'Kickstart',
      description: 'Get detailed action plan',
      icon: <Rocket className="h-5 w-5" />,
      gradient: 'from-red-500 via-rose-500 to-pink-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ];

  const executeCommand = async () => {
    if (!selectedCommand || !context.trim()) {
      setError('Please select a command and provide context');
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

      const response = await httpClient.post('/specialized-agents/interactive-command', {
        command: selectedCommand,
        context: context.trim(),
        business_context: businessContext
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if ((response.data as any).success) {
        const commandResponse: CommandResponse = {
          command: selectedCommand,
          type: (response.data as any).result.type,
          ...(response.data as any).result
        };
        
        setResponse(commandResponse);
        onCommandComplete?.(commandResponse);
        toast.success(`Command "${selectedCommand}" executed successfully!`);
      } else {
        setError((response.data as any).message || 'Failed to execute command');
      }
    } catch (err: any) {
      console.error('Error executing command:', err);
      setError(err.response?.data?.message || 'Failed to execute command');
    } finally {
      setLoading(false);
    }
  };

  const getResponseIcon = (type: string) => {
    switch (type) {
      case 'help':
        return <HelpCircle className="h-5 w-5 text-blue-500" />;
      case 'contact':
        return <Phone className="h-5 w-5 text-green-500" />;
      case 'scrapping':
        return <Edit3 className="h-5 w-5 text-purple-500" />;
      case 'draft':
        return <FileText className="h-5 w-5 text-orange-500" />;
      case 'kickstart':
        return <Rocket className="h-5 w-5 text-red-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-gray-500" />;
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
              <Rocket className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">Interactive Commands</h2>
            </div>
        </div>
          <p className="text-sm text-white/90 mt-2">
          Use these commands to get specific assistance with your business development tasks.
        </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Beautiful Command Selection */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Select Command</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {commands.map((cmd, index) => (
              <button
                key={cmd.id}
                onClick={() => setSelectedCommand(cmd.id)}
                disabled={loading}
                className={`relative p-5 rounded-2xl border-2 transition-all duration-500 group overflow-hidden ${
                  selectedCommand === cmd.id
                    ? `border-teal-500 shadow-2xl scale-105 bg-gradient-to-br ${cmd.gradient} text-white`
                    : `border-gray-200 bg-white hover:border-teal-400 hover:shadow-xl hover:scale-102 ${cmd.bgColor}`
                } disabled:opacity-50 animate-fadeIn`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                {/* Background Gradient on Hover */}
                {selectedCommand !== cmd.id && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${cmd.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl`}></div>
                )}
                
                <div className="relative z-10">
                  <div className={`mb-3 p-3 rounded-xl inline-flex ${
                    selectedCommand === cmd.id
                      ? 'bg-white/20 backdrop-blur-sm'
                      : `bg-gradient-to-br ${cmd.gradient} text-white shadow-lg`
                  } group-hover:scale-110 transition-transform duration-300`}>
                    {cmd.icon}
                  </div>
                  <h4 className={`font-bold text-base mb-1.5 ${
                    selectedCommand === cmd.id ? 'text-white' : 'text-gray-900'
                  }`}>
                    {cmd.name}
                  </h4>
                  <p className={`text-sm leading-tight ${
                    selectedCommand === cmd.id ? 'text-white/90' : 'text-gray-600'
                  }`}>
                    {cmd.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Beautiful Context Input */}
        {selectedCommand && (
          <div className="bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50 border-2 border-teal-200/50 rounded-2xl p-6 shadow-lg relative overflow-hidden animate-fadeIn">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-teal-400/10 to-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl shadow-md">
                  {commands.find(c => c.id === selectedCommand)?.icon}
                </div>
                <label className="block text-sm font-bold text-gray-900">
                  Provide Context for "{commands.find(c => c.id === selectedCommand)?.name}"
          </label>
              </div>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Describe what you need help with or what you want to accomplish..."
            rows={4}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white/80 backdrop-blur-sm shadow-sm transition-all mb-4"
                disabled={loading}
          />

              {/* Beautiful Execute Button */}
        <div className="flex justify-end">
          <button
            onClick={executeCommand}
            disabled={loading || !selectedCommand || !context.trim()}
                  className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 shadow-xl hover:shadow-2xl hover:scale-[1.02] disabled:shadow-none disabled:cursor-not-allowed disabled:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-white" />
                Executing Command...
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5 text-white" />
                Execute Command
              </>
            )}
          </button>
        </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Beautiful Response Display */}
        {response && (
          <div className="bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50 border-2 border-teal-200/50 rounded-2xl p-6 shadow-lg animate-fadeIn relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-teal-400/10 to-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-teal-200/50">
                <div className="p-2.5 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl shadow-md">
                  {getResponseIcon(response.type)}
                </div>
                <h3 className="font-bold text-lg text-gray-900">
                  {response.command.charAt(0).toUpperCase() + response.command.slice(1)} Response
                </h3>
              </div>
            
            <div className="space-y-4">
              {response.guidance && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Guidance</h4>
                  <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border border-gray-200/50 shadow-sm prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 className="text-lg font-bold text-gray-900 mb-3 mt-4 first:mt-0">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-semibold text-gray-900 mb-2 mt-3">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-800 mb-2 mt-3">{children}</h3>,
                        p: ({ children }) => <p className="text-sm text-gray-700 leading-relaxed mb-2">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal ml-5 space-y-1 text-sm text-gray-700 mb-2">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                        code: ({ children }) => <code className="bg-gray-100 text-gray-900 px-1.5 py-0.5 rounded text-xs">{children}</code>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-700 my-2">{children}</blockquote>,
                      }}
                    >
                      {response.guidance}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
              
              {response.providers && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Service Providers</h4>
                  <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border border-gray-200/50 shadow-sm">
                    <p className="text-sm text-gray-700 font-mono">{JSON.stringify(response.providers, null, 2)}</p>
                  </div>
                </div>
              )}
              
              {response.draft_content && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Draft Content</h4>
                  <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border border-gray-200/50 shadow-sm prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 className="text-lg font-bold text-gray-900 mb-3 mt-4 first:mt-0">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-semibold text-gray-900 mb-2 mt-3">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-800 mb-2 mt-3">{children}</h3>,
                        p: ({ children }) => <p className="text-sm text-gray-700 leading-relaxed mb-2">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal ml-5 space-y-1 text-sm text-gray-700 mb-2">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                        code: ({ children }) => <code className="bg-gray-100 text-gray-900 px-1.5 py-0.5 rounded text-xs">{children}</code>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-green-400 pl-4 italic text-gray-700 my-2">{children}</blockquote>,
                      }}
                    >
                      {response.draft_content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
              
              {response.kickstart_plan && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Kickstart Plan</h4>
                  <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border border-gray-200/50 shadow-sm prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 className="text-lg font-bold text-gray-900 mb-3 mt-4 first:mt-0">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-semibold text-gray-900 mb-2 mt-3">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-800 mb-2 mt-3">{children}</h3>,
                        p: ({ children }) => <p className="text-sm text-gray-700 leading-relaxed mb-2">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal ml-5 space-y-1 text-sm text-gray-700 mb-2">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                        code: ({ children }) => <code className="bg-gray-100 text-gray-900 px-1.5 py-0.5 rounded text-xs">{children}</code>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-purple-400 pl-4 italic text-gray-700 my-2">{children}</blockquote>,
                      }}
                    >
                      {response.kickstart_plan}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
              
              {response.message && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Message</h4>
                  <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border border-gray-200/50 shadow-sm">
                    <p className="text-sm text-gray-700 leading-relaxed">{response.message}</p>
                  </div>
                </div>
              )}
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
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default InteractiveCommands;