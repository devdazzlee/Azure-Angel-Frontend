// Azure-Angel-Frontend/src/components/ui/SaveStatusIndicator.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader, AlertTriangle } from 'lucide-react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  onRetry?: () => void;
}

const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({ status, onRetry }) => {
  const statusConfig = {
    saving: {
      icon: <Loader className="animate-spin w-4 h-4 text-gray-500" />,
      text: 'Saving...',
      color: 'text-gray-500',
    },
    saved: {
      icon: <Check className="w-4 h-4 text-green-500" />,
      text: 'Saved',
      color: 'text-green-500',
    },
    error: {
      icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
      text: 'Error saving',
      color: 'text-red-500',
    },
    idle: {
      icon: null,
      text: null,
      color: 'text-transparent',
    },
  };

  const currentStatus = statusConfig[status] || statusConfig.idle;

  return (
    <div className="flex items-center space-x-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center space-x-1 text-sm font-medium ${currentStatus.color}`}
        >
          {currentStatus.icon}
          {currentStatus.text && <span>{currentStatus.text}</span>}
        </motion.div>
      </AnimatePresence>
      {status === 'error' && onRetry && (
        <button onClick={onRetry} className="text-xs text-blue-600 hover:underline">
          Retry
        </button>
      )}
    </div>
  );
};

export default SaveStatusIndicator;
