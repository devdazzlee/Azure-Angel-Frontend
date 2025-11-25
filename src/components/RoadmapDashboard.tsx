import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RoadmapStage {
  id: string;
  name: string;
  icon: string;
  progress: number;
  tasks: Task[];
}

interface Task {
  id: string;
  name: string;
  description: string;
  dependencies: string;
  angelRole: string;
  status: 'complete' | 'in-progress' | 'upcoming';
}

interface RoadmapDashboardProps {
  roadmapContent: string;
  businessName: string;
}

const RoadmapDashboard: React.FC<RoadmapDashboardProps> = ({
  roadmapContent,
  businessName
}) => {
  const [activeTab, setActiveTab] = useState('stage-1');

  // Parse roadmap content into stages (you'd implement actual parsing logic)
  const stages: RoadmapStage[] = [
    {
      id: 'stage-1',
      name: 'Legal Formation',
      icon: '⚖️',
      progress: 40,
      tasks: []
    },
    {
      id: 'stage-2',
      name: 'Financial Planning',
      icon: '💰',
      progress: 0,
      tasks: []
    },
    {
      id: 'stage-3',
      name: 'Product & Operations',
      icon: '🏗️',
      progress: 0,
      tasks: []
    },
    {
      id: 'stage-4',
      name: 'Marketing',
      icon: '📣',
      progress: 0,
      tasks: []
    },
    {
      id: 'stage-5',
      name: 'Launch & Scaling',
      icon: '🚀',
      progress: 0,
      tasks: []
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">
            🗺️ Launch Roadmap for {businessName}
          </h1>
          <p className="text-lg opacity-90">
            Each section unlocks as you go, and I'll be right here with advice and shortcuts along the way.
          </p>

          {/* Overall Progress Bar */}
          <div className="mt-6 bg-white/20 rounded-full h-4 overflow-hidden backdrop-blur-sm">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '8%' }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
            />
          </div>
          <p className="text-sm mt-2 opacity-80">Overall Progress: 8% Complete</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto space-x-2 py-4">
            {stages.map((stage) => (
              <button
                key={stage.id}
                onClick={() => setActiveTab(stage.id)}
                className={`flex-shrink-0 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === stage.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{stage.icon}</span>
                  <span>{stage.name}</span>
                  {stage.progress > 0 && (
                    <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                      {stage.progress}%
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto p-8">
        <AnimatePresence mode="wait">
          {stages.map((stage) => (
            activeTab === stage.id && (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Stage Header */}
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                    <span className="text-4xl">{stage.icon}</span>
                    {stage.name}
                  </h2>

                  {/* Stage Progress */}
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stage.progress}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{stage.progress}% Done</span>
                  </div>
                </div>

                {/* Roadmap Content for this stage */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                  <div className="prose prose-lg max-w-none">
                    {/* This would show the actual roadmap content for this stage */}
                    <div className="text-gray-700">
                      {roadmapContent}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RoadmapDashboard;

