import React, { useState } from 'react';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Loader2, 
  Search, 
  BookOpen, 
  Globe, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Lightbulb,
  FileText,
  Target,
  Shield,
  Building2,
  MapPin,
} from 'lucide-react';
import httpClient from '../api/httpClient';
import BusinessContextDisplay from './BusinessContextDisplay';

interface ResearchResult {
  query: string;
  enhanced_query: string;
  business_context: any;
  research_depth: string;
  research_results: {
    by_category: Record<string, any[]>;
    successful_sources: string[];
    failed_sources: any[];
    total_sources: number;
    successful_research: number;
  };
  analysis: string;
  timestamp: string;
  sources_consulted: number;
}

interface RAGResearchProps {
  businessContext: {
    industry?: string;
    location?: string;
    business_type?: string;
    business_name?: string;
  };
  onResearchComplete?: (result: ResearchResult) => void;
  className?: string;
}

const RAGResearch: React.FC<RAGResearchProps> = ({
  businessContext,
  onResearchComplete,
  className = ""
}) => {
  const [query, setQuery] = useState<string>('');
  const researchDepth = 'standard';
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResult | null>(null);

  const conductResearch = async () => {
    if (!query.trim()) {
      setError('Please enter a research query');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      const token = localStorage.getItem('sb_access_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await httpClient.post('/specialized-agents/rag-research', {
        query: query.trim(),
        business_context: businessContext,
        research_depth: researchDepth
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if ((response.data as any).success) {
        setResult((response.data as any).result);
        onResearchComplete?.((response.data as any).result);
        toast.success('Research completed successfully!');
      } else {
        setError((response.data as any).message || 'Failed to conduct research');
      }
    } catch (err: any) {
      console.error('Error conducting research:', err);
      setError(err.response?.data?.message || 'Failed to conduct research');
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (source: string) => {
    if (source.includes('government') || source.includes('gov')) {
      return <Shield className="h-4 w-4 text-blue-500" />;
    } else if (source.includes('academic') || source.includes('scholar')) {
      return <BookOpen className="h-4 w-4 text-green-500" />;
    } else if (source.includes('news') || source.includes('journal')) {
      return <FileText className="h-4 w-4 text-orange-500" />;
    } else {
      return <Globe className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Research</h2>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Comprehensive
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Conduct comprehensive research using Retrieval Augmentation Generation (RAG) technology.
        </p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Research Query */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Research Query</label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your research question or topic..."
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Conduct Research Button */}
        <div className="flex justify-end">
          <button
            onClick={conductResearch}
            disabled={loading || !query.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Researching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Conduct Research
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        {loading && (
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Research Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
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

        {/* Research Results */}
        {result && (
          <div className="space-y-4">
            {/* Research Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <h3 className="font-medium text-gray-900">Research Summary</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{result.sources_consulted}</div>
                  <div className="text-gray-600">Sources Consulted</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{result.research_results.successful_research}</div>
                  <div className="text-gray-600">Successful Queries</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{result.research_depth}</div>
                  <div className="text-gray-600">Research Depth</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{new Date(result.timestamp).toLocaleDateString()}</div>
                  <div className="text-gray-600">Research Date</div>
                </div>
              </div>
            </div>

            {/* Analysis */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium text-gray-900">Research Analysis</h3>
              </div>
              <div className="bg-white p-3 rounded border prose prose-sm max-w-none">
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
                  {result.analysis}
                </ReactMarkdown>
              </div>
            </div>

            {/* Sources */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h3 className="font-medium text-gray-900">Sources Consulted</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {result.research_results.successful_sources.map((source, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                    {getSourceIcon(source)}
                    <span className="text-sm text-gray-700">{source}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Query */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-purple-500" />
                <h3 className="font-medium text-gray-900">Enhanced Query</h3>
              </div>
              <div className="bg-white p-3 rounded border">
                <p className="text-sm text-gray-700">{result.enhanced_query}</p>
              </div>
            </div>
          </div>
        )}

        {/* Business Context - Removed to avoid duplication in FloatingComprehensiveSupport */}
      </div>
    </div>
  );
};

export default RAGResearch;