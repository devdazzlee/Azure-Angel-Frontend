import React, { useState } from 'react';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface KickstartPlan {
  plan: string;
  sub_tasks: string[];
  estimated_time: string;
  priority: string;
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
  business_context: {
    business_name: string;
    industry: string;
    location: string;
    business_type: string;
  };
}

interface KickstartModalProps {
  isOpen: boolean;
  onClose: () => void;
  kickstartPlan: KickstartPlan | null;
  task: ImplementationTask | null;
}

const KickstartModal: React.FC<KickstartModalProps> = ({
  isOpen,
  onClose,
  kickstartPlan,
  task
}) => {
  const [selectedSubTasks, setSelectedSubTasks] = useState<string[]>([]);

  if (!isOpen || !task || !kickstartPlan) return null;

  // Ensure sub_tasks is an array
  const subTasks = Array.isArray(kickstartPlan.sub_tasks) ? kickstartPlan.sub_tasks : [];

  const handleSubTaskToggle = (subTask: string) => {
    setSelectedSubTasks(prev => 
      prev.includes(subTask) 
        ? prev.filter(task => task !== subTask)
        : [...prev, subTask]
    );
  };

  const handleSelectAll = () => {
    if (selectedSubTasks.length === subTasks.length && subTasks.length > 0) {
      setSelectedSubTasks([]);
    } else {
      setSelectedSubTasks([...subTasks]);
    }
  };

  const handleStartKickstart = () => {
    if (selectedSubTasks.length === 0) {
      toast.error('Please select at least one sub-task to get started');
      return;
    }

    toast.success(`Starting kickstart plan with ${selectedSubTasks.length} selected tasks!`);
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-teal-500 p-6 text-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">🚀 Kickstart Plan</h2>
              <p className="text-green-100 mt-1">Detailed action plan for {task.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-green-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Task Overview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{task.title}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                {task.priority} Priority
              </span>
            </div>
            <div className="prose prose-sm max-w-none mb-2">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="text-sm text-gray-700 leading-relaxed mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                }}
              >
                {task.description}
              </ReactMarkdown>
            </div>
            <div className="text-xs text-gray-500">
              <span className="font-medium">Phase:</span> {task.phase_name} • 
              <span className="font-medium ml-1">Estimated Time:</span> {task.estimated_time}
            </div>
          </div>

          {/* Kickstart Plan */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 Detailed Action Plan</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="prose prose-sm max-w-none text-green-900">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold text-green-900 mb-4 mt-6 first:mt-0">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold text-green-800 mb-3 mt-5">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold text-green-800 mb-2 mt-4">{children}</h3>,
                    p: ({ children }) => <p className="text-green-900 mb-3 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 text-green-900">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-green-900">{children}</ol>,
                    li: ({ children }) => <li className="text-green-900 leading-relaxed">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-green-900">{children}</strong>,
                    code: ({ children }) => <code className="bg-green-100 text-green-900 px-1.5 py-0.5 rounded text-sm">{children}</code>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-green-400 pl-4 italic text-green-800 my-3">{children}</blockquote>,
                  }}
                >
                  {kickstartPlan.plan}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Sub-tasks Selection */}
          {subTasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">✨ Angel Actions Available</h3>
              <button
                onClick={handleSelectAll}
                className="text-sm text-teal-600 hover:text-teal-800 font-medium"
              >
                {selectedSubTasks.length === subTasks.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="space-y-2">
              {subTasks.map((subTask, index) => (
                <label key={index} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedSubTasks.includes(subTask)}
                    onChange={() => handleSubTaskToggle(subTask)}
                    className="w-4 h-4 text-teal-500 focus:ring-teal-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="text-gray-700">{subTask}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
          )}

          {/* Timeline */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">⏱️ Timeline & Resources</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p><span className="font-medium">Estimated Time:</span> {kickstartPlan.estimated_time}</p>
              <p><span className="font-medium">Priority Level:</span> {kickstartPlan.priority}</p>
              <p><span className="font-medium">Selected Actions:</span> {selectedSubTasks.length} of {subTasks.length}</p>
            </div>
          </div>

          {/* Angel Assistance */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <h3 className="font-semibold text-teal-900 mb-2">🤖 How Angel Will Help</h3>
            <div className="text-sm text-teal-800 space-y-1">
              <p>• Generate templates and documents for selected actions</p>
              <p>• Conduct research and provide data for decision-making</p>
              <p>• Create checklists and step-by-step guides</p>
              <p>• Review and analyze your progress</p>
              <p>• Provide ongoing support and guidance</p>
            </div>
          </div>

          {/* Success Metrics */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">🎯 Success Metrics</h3>
            <div className="text-sm text-purple-800 space-y-1">
              <p>• Complete all selected Angel actions</p>
              <p>• Make informed decisions based on research</p>
              <p>• Document all actions and outcomes</p>
              <p>• Meet timeline expectations</p>
              <p>• Achieve task completion criteria</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedSubTasks.length > 0 && (
              <span>{selectedSubTasks.length} action{selectedSubTasks.length !== 1 ? 's' : ''} selected</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStartKickstart}
              disabled={selectedSubTasks.length === 0}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <span>🚀</span>
              Start Kickstart Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KickstartModal;
