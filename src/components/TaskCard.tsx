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
  Circle
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
  onGetKickstart: () => void;
  onGetHelp: () => void;
  onUploadDocument: (file: File) => void;
  sessionId?: string;  // Add sessionId prop
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onComplete,
  onGetServiceProviders,
  onGetKickstart,
  onGetHelp,
  onUploadDocument,
  sessionId
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mentorInsights, setMentorInsights] = useState<string>('');
  const [ragResearch, setRagResearch] = useState<any>(null);
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

      // Load mentor insights and RAG research for this task
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

      // Load RAG research
      const ragResponse = await httpClient.post('/specialized-agents/rag-research', {
        query: `implementation task ${task.id} ${task.business_context.industry} ${task.business_context.location}`,
        business_context: task.business_context,
        research_depth: 'standard'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if ((ragResponse.data as any).success) {
        setRagResearch((ragResponse.data as any).result);
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
          <p className="text-gray-700">{task.description}</p>
        </div>

        {/* Purpose */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Purpose</h3>
          <p className="text-gray-700">{task.purpose}</p>
        </div>

        {/* Substeps - CRITICAL: Show 3-5 synchronous substeps */}
        {task.substeps && task.substeps.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              Implementation Steps ({task.substeps.length} steps)
            </h3>
            <div className="space-y-4">
              {task.substeps.map((substep, index) => (
                <div
                  key={substep.step_number}
                  className={`border-2 rounded-lg p-4 transition-all ${
                    substep.completed
                      ? 'bg-green-50 border-green-300'
                      : index === currentSubstepIndex
                      ? 'bg-blue-50 border-blue-400 shadow-md'
                      : index < currentSubstepIndex
                      ? 'bg-gray-50 border-gray-300'
                      : 'bg-white border-gray-200 opacity-60'
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
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-semibold ${
                          substep.completed ? 'text-green-800' : index === currentSubstepIndex ? 'text-blue-800' : 'text-gray-700'
                        }`}>
                          {substep.title}
                        </h4>
                        {index === currentSubstepIndex && !substep.completed && (
                          <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            Current Step
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{substep.description}</p>
                      <div className="bg-blue-50 rounded p-2 mb-2">
                        <p className="text-xs font-medium text-blue-800 mb-1">Angel can help:</p>
                        <p className="text-xs text-blue-700">{substep.angel_can_help}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {substep.estimated_time}
                        </span>
                        {!substep.completed && index === currentSubstepIndex && (
                          <button
                            onClick={() => handleSubstepClick(substep)}
                            disabled={loading}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
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

        {/* Angel Actions */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            Angel Can Help You With
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {task.angel_actions.map((action, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">{action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mentor Insights */}
        {mentorInsights && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              Mentor Insights
            </h3>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-800 whitespace-pre-wrap">{mentorInsights}</p>
            </div>
          </div>
        )}

        {/* RAG Research */}
        {ragResearch && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Research-Backed Guidance
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                RAG-Powered
              </span>
            </h3>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800 mb-3">
                Sources consulted: {ragResearch.sources_consulted} authoritative sources
              </p>
              <div className="prose prose-sm max-w-none text-green-900">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="text-lg font-bold text-green-900 mb-3 mt-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-semibold text-green-900 mb-2 mt-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold text-green-800 mb-2 mt-3">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-sm font-medium text-green-800 mb-1 mt-2">{children}</h4>,
                    p: ({ children }) => <p className="text-sm text-green-800 leading-relaxed mb-2">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc ml-5 space-y-1 text-sm text-green-800 mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal ml-5 space-y-1 text-sm text-green-800 mb-2">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-green-900">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    code: ({ children, ...props }: any) => {
                      const isInline = props.inline !== false;
                      return isInline ? (
                        <code className="bg-green-100 text-green-900 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                      ) : (
                        <pre className="bg-green-100 text-green-900 p-2 rounded text-xs font-mono overflow-x-auto mb-2"><code>{children}</code></pre>
                      );
                    },
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-green-400 bg-green-100 p-2 italic rounded my-2 text-sm text-green-800">
                        {children}
                      </blockquote>
                    ),
                    hr: () => <hr className="my-3 border-green-300" />,
                  }}
                >
                  {ragResearch.analysis}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

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

          <div className="flex gap-2">
            <button
              onClick={onGetHelp}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Lightbulb className="h-4 w-4" />
              Help
            </button>

            <button
              onClick={onGetKickstart}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Rocket className="h-4 w-4" />
              Kickstart
            </button>

            <button
              onClick={onGetServiceProviders}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Phone className="h-4 w-4" />
              Contact
            </button>
          </div>
        </div>

        {/* Business Context */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">Business Context</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Business:</span>
              <span className="font-medium ml-2">{task.business_context.business_name}</span>
            </div>
            <div>
              <span className="text-gray-600">Industry:</span>
              <span className="font-medium ml-2">{task.business_context.industry}</span>
            </div>
            <div>
              <span className="text-gray-600">Location:</span>
              <span className="font-medium ml-2">{task.business_context.location}</span>
            </div>
            <div>
              <span className="text-gray-600">Type:</span>
              <span className="font-medium ml-2">{task.business_context.business_type}</span>
            </div>
          </div>
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