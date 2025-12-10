import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Loader2, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Lightbulb, 
  Rocket, 
  Phone, 
  FileText,
  Target,
  Building2,
  TrendingUp,
  Shield,
  DollarSign,
  Settings,
  Megaphone,
  ChevronRight,
  Circle,
  MapPin
} from 'lucide-react';
import { toast } from 'react-toastify';
import httpClient from '../api/httpClient';

interface ImplementationSubstep {
  step_number: number;
  title: string;
  description: string;
  angel_can_help: string;
  estimated_time: string;
  required: boolean;
  completed?: boolean;
}

interface ImplementationTask {
  id: string;
  title: string;
  description: string;
  purpose: string;
  options: string[];
  angel_actions: string[];
  estimated_time: string;
  priority: string;
  phase_name: string;
  substeps?: ImplementationSubstep[];
  current_substep?: number;
  business_context: {
    business_name: string;
    industry: string;
    location: string;
    business_type: string;
  };
}

interface TaskCardProps {
  task: ImplementationTask;
  onComplete: () => void;
  onGetServiceProviders: () => void;
  onGetHelp: () => void;
  onUploadDocument: (file: File) => void;
  sessionId?: string;  // Add sessionId prop
  helpContent?: string;
  helpLoading?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onComplete,
  onGetServiceProviders,
  onGetHelp,
  onUploadDocument,
  sessionId,
  helpContent,
  helpLoading
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mentorInsights, setMentorInsights] = useState<string>('');
  const [currentSubstepIndex, setCurrentSubstepIndex] = useState<number>(0);
  const [showSubstepModal, setShowSubstepModal] = useState(false);
  const [substepToComplete, setSubstepToComplete] = useState<ImplementationSubstep | null>(null);
  const [substepNote, setSubstepNote] = useState<string>('');

  useEffect(() => {
    loadTaskInsights();
    // Set current substep index based on task's current_substep or first incomplete substep
    // CRITICAL: This ensures reload shows the correct current step
    if (task.substeps && task.substeps.length > 0) {
      const incompleteIndex = task.substeps.findIndex(s => !s.completed);
      if (incompleteIndex >= 0) {
        setCurrentSubstepIndex(incompleteIndex);
      } else {
        // All substeps completed, show last one
        setCurrentSubstepIndex(task.substeps.length - 1);
      }
    }
    // Also use task.current_substep if provided
    if (task.current_substep && task.substeps) {
      const substepIndex = task.substeps.findIndex(s => s.step_number === task.current_substep);
      if (substepIndex >= 0) {
        setCurrentSubstepIndex(substepIndex);
      }
    }
  }, [task.id, task.substeps, task.current_substep]);

  const loadTaskInsights = async () => {
    try {
      const token = localStorage.getItem('sb_access_token');
      if (!token) return;

      // Load mentor insights for this task
      const response = await httpClient.post('/specialized-agents/agent-guidance', {
        question: `Provide expert guidance for implementation task: ${task.title}`,
        agent_type: 'comprehensive',
        business_context: task.business_context
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if ((response.data as any).success) {
        setMentorInsights((response.data as any).result.guidance || 'Expert guidance will be provided as you work through this task.');
      }
    } catch (err) {
      console.error('Error loading task insights:', err);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      onUploadDocument(file);
    }
  };

  const handleSubstepClick = (substep: ImplementationSubstep) => {
    // Open modal to confirm completion and optionally add notes
    setSubstepToComplete(substep);
    setSubstepNote('');
    setShowSubstepModal(true);
  };

  const handleCompleteSubstep = async () => {
    if (!substepToComplete) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('sb_access_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const completionData = {
        substep_number: substepToComplete.step_number,
        completion_notes: substepNote.trim() || `Completed step: ${substepToComplete.title}`,
        completed_at: new Date().toISOString()
      };

      // Use sessionId from props or extract from URL
      const currentSessionId = sessionId || (window.location.pathname.match(/\/venture\/([^\/]+)/) || [])[1] || '';
      if (!currentSessionId) {
        setError('Session ID not found');
        return;
      }
      
      const response = await httpClient.post(
        `/implementation/sessions/${currentSessionId}/tasks/${task.id}/complete`, 
        completionData, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if ((response.data as any).success) {
        toast.success(`Step ${substepToComplete.step_number} completed!`);
        setShowSubstepModal(false);
        setSubstepToComplete(null);
        setSubstepNote('');
        // CRITICAL: Reload task data from backend to get updated progress and next step
        // This ensures database state is reflected in UI
        onComplete();
      } else {
        setError((response.data as any).message || 'Failed to complete substep');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete substep');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    // Decision field is now optional - no validation needed

    // CRITICAL: Check if all substeps are completed before allowing task completion
    if (task.substeps && task.substeps.length > 0) {
      const incompleteSubsteps = task.substeps.filter(s => !s.completed);
      if (incompleteSubsteps.length > 0) {
        const incompleteNumbers = incompleteSubsteps.map(s => s.step_number).join(', ');
        setError(`Please complete all substeps first. Remaining steps: ${incompleteNumbers}`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('sb_access_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const currentSessionId = sessionId || (window.location.pathname.match(/\/venture\/([^\/]+)/) || [])[1] || '';
      if (!currentSessionId) {
        setError('Session ID not found');
        return;
      }

      const completionData = {
        decision: selectedOption,
        completion_notes: completionNotes,
        uploaded_file: uploadedFile?.name,
        completed_at: new Date().toISOString()
      };

      const response = await httpClient.post(
        `/implementation/sessions/${currentSessionId}/tasks/${task.id}/complete`, 
        completionData, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if ((response.data as any).success) {
        onComplete();
      } else {
        setError((response.data as any).message || 'Failed to complete task');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete task');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase.toLowerCase()) {
      case 'legal_formation':
        return <Shield className="h-5 w-5 text-blue-600" />;
      case 'financial_setup':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'operations_development':
        return <Settings className="h-5 w-5 text-purple-600" />;
      case 'marketing_sales':
        return <Megaphone className="h-5 w-5 text-orange-600" />;
      case 'launch_scaling':
        return <Rocket className="h-5 w-5 text-red-600" />;
      default:
        return <Target className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getPhaseIcon(task.phase_name)}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {getPriorityIcon(task.priority)}
                  {task.priority} Priority
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  <Clock className="h-3 w-3" />
                  {task.estimated_time}
                </span>
              </div>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
            {task.phase_name.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Task Description */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Task Description</h3>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="text-sm text-gray-700 leading-relaxed mb-2">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-5 space-y-1 text-sm text-gray-700">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => <code className="bg-gray-100 text-gray-900 px-1.5 py-0.5 rounded text-xs">{children}</code>,
              }}
            >
              {task.description}
            </ReactMarkdown>
          </div>
        </div>

        {/* Purpose */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Purpose</h3>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="text-sm text-gray-700 leading-relaxed mb-2">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-5 space-y-1 text-sm text-gray-700">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => <code className="bg-gray-100 text-gray-900 px-1.5 py-0.5 rounded text-xs">{children}</code>,
              }}
            >
              {task.purpose}
            </ReactMarkdown>
          </div>
        </div>

        {/* Substeps - CRITICAL: Show 3-5 synchronous substeps */}
        {task.substeps && task.substeps.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              Implementation Steps ({task.substeps.length} steps)
            </h3>
            <div className="space-y-3">
              {task.substeps.map((substep, index) => (
                <div
                  key={substep.step_number}
                  className={`rounded-xl p-3 sm:p-4 transition-all shadow-sm ${
                    substep.completed
                      ? 'bg-green-50 border border-green-200'
                      : index === currentSubstepIndex
                      ? 'bg-gradient-to-r from-blue-50 via-white to-blue-50 border border-blue-200 shadow-md'
                      : index < currentSubstepIndex
                      ? 'bg-gray-50 border border-gray-200'
                      : 'bg-white border border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      substep.completed
                        ? 'bg-green-500 text-white'
                        : index === currentSubstepIndex
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {substep.completed ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        substep.step_number
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`font-semibold leading-tight ${
                          substep.completed ? 'text-green-800' : index === currentSubstepIndex ? 'text-blue-800' : 'text-gray-700'
                        }`}>
                          {substep.title}
                        </h4>
                        {substep.completed ? (
                          <button
                            onClick={() => handleSubstepClick(substep)}
                            className="text-xs font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1 rounded transition-colors flex items-center gap-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Click to Edit
                          </button>
                        ) : index === currentSubstepIndex ? (
                          <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                            Current Step
                          </span>
                        ) : null}
                      </div>
                      <div className="prose prose-sm max-w-none mb-1">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="text-sm text-gray-700 leading-relaxed mb-1">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc ml-4 space-y-0.5 text-sm text-gray-700">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal ml-4 space-y-0.5 text-sm text-gray-700">{children}</ol>,
                            li: ({ children }) => <li className="text-xs leading-relaxed">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                            code: ({ children }) => <code className="bg-gray-100 text-gray-900 px-1 py-0.5 rounded text-xs">{children}</code>,
                          }}
                        >
                          {substep.description}
                        </ReactMarkdown>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                          <span className="text-[11px] font-semibold text-blue-800">Angel can help</span>
                          <div className="text-[11px] text-blue-700 leading-snug">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => <p className="m-0 text-[11px]">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc ml-4 space-y-0.5">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal ml-4 space-y-0.5">{children}</ol>,
                                li: ({ children }) => <li className="text-[11px] leading-snug">{children}</li>,
                                strong: ({ children }) => <strong className="font-semibold text-blue-900">{children}</strong>,
                                code: ({ children }) => <code className="bg-blue-100 text-blue-900 px-1 py-0.5 rounded text-[10px]">{children}</code>,
                              }}
                            >
                              {substep.angel_can_help}
                            </ReactMarkdown>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {substep.estimated_time}
                        </span>
                        {!substep.completed && index === currentSubstepIndex && (
                          <button
                            onClick={() => handleSubstepClick(substep)}
                            disabled={loading}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-semibold transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Mark Complete
                          </button>
                        )}
                        {substep.completed && (
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="text-xs text-indigo-800">
                <strong>Flow:</strong> Complete each step in order. You must finish Step {task.substeps[currentSubstepIndex]?.step_number || 1} before moving to the next step.
              </p>
            </div>
          </div>
        )}

        {/* Decision Options - Optional, only show when completing the full task */}
        {task.options.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Optional: What approach did you choose?
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Help us track your decisions (e.g., "LLC" for business structure, "Online Registration" for registration). This is optional.
            </p>
            <select 
              value={selectedOption} 
              onChange={(e) => setSelectedOption(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            >
              <option value="">-- Optional: Select your approach --</option>
              {task.options.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}


        {/* Research / Help (preloaded Get Help content) */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span role="img" aria-label="detailed guidance" className="text-lg">
              🗂️
            </span>
            Detailed Guidance
          </h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            {helpLoading ? (
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span>Loading detailed guidance...</span>
              </div>
            ) : helpContent ? (
              <div className="prose prose-sm max-w-none text-blue-900">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="text-lg font-bold text-blue-900 mb-3 mt-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-semibold text-blue-900 mb-2 mt-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold text-blue-800 mb-2 mt-3">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-sm font-medium text-blue-800 mb-1 mt-2">{children}</h4>,
                    p: ({ children }) => <p className="text-sm text-blue-800 leading-relaxed mb-2">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc ml-5 space-y-1 text-sm text-blue-800 mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal ml-5 space-y-1 text-sm text-blue-800 mb-2">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-blue-900">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    code: ({ children, ...props }: any) => {
                      const isInline = props.inline !== false;
                      return isInline ? (
                        <code className="bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                      ) : (
                        <pre className="bg-blue-100 text-blue-900 p-2 rounded text-xs font-mono overflow-x-auto mb-2"><code>{children}</code></pre>
                      );
                    },
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-400 bg-blue-100 p-2 italic rounded my-2 text-sm text-blue-800">
                        {children}
                      </blockquote>
                    ),
                    hr: () => <hr className="my-3 border-blue-300" />,
                  }}
                >
                  {helpContent}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-blue-800">
                Detailed guidance will appear here as soon as it finishes loading.
              </p>
            )}
          </div>
        </div>

        {/* Completion Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Completion Notes</label>
          <textarea
            placeholder="Describe what you accomplished, decisions made, or any important details..."
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Document Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload Documentation</label>
          <div className="mt-2">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploadedFile && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                <FileText className="h-4 w-4" />
                {uploadedFile.name}
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleComplete}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Completing Task...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Complete Task
              </>
            )}
          </button>

          
        </div>

        {/* Business Context */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              Business Context
            </span>
          </h3>
          {!task.business_context.business_name || task.business_context.business_name === 'Unsure' ? (
            // Beautiful Skeleton Loader
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-pulse">
              <div className="flex items-center gap-2 p-2.5 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg">
                <div className="h-6 w-6 bg-gradient-to-br from-teal-200 to-blue-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-20 mb-1.5"></div>
                  <div className="h-4 bg-gray-300 rounded w-32"></div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg">
                <div className="h-6 w-6 bg-gradient-to-br from-teal-200 to-blue-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-16 mb-1.5"></div>
                  <div className="h-4 bg-gray-300 rounded w-28"></div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg">
                <div className="h-6 w-6 bg-gradient-to-br from-teal-200 to-blue-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-20 mb-1.5"></div>
                  <div className="h-4 bg-gray-300 rounded w-36"></div>
                </div>
              </div>
            </div>
          ) : (
            // Beautiful Actual Content
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2.5 p-3 bg-gradient-to-r from-teal-50/80 to-blue-50/80 hover:from-teal-100 hover:to-blue-100 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md group">
                <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Business</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{task.business_context.business_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 hover:from-blue-100 hover:to-indigo-100 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md group">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Industry</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{task.business_context.industry}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 hover:from-indigo-100 hover:to-purple-100 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md group">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Location</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{task.business_context.location}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Substep Completion Modal */}
      {showSubstepModal && substepToComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Complete Step {substepToComplete.step_number}</h3>
                  <p className="text-blue-100 text-sm mt-1">{substepToComplete.title}</p>
                </div>
                <button
                  onClick={() => {
                    setShowSubstepModal(false);
                    setSubstepToComplete(null);
                    setSubstepNote('');
                  }}
                  className="text-white hover:text-blue-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>What you did:</strong> {substepToComplete.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add a note (optional)
                </label>
                <textarea
                  value={substepNote}
                  onChange={(e) => setSubstepNote(e.target.value)}
                  placeholder="What did you accomplish? Any details to remember?"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSubstepModal(false);
                  setSubstepToComplete(null);
                  setSubstepNote('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSubstep}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Complete Step
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;