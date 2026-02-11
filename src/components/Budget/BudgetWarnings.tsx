import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface Warning {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  itemId?: string;
}

interface BudgetWarningsProps {
  warnings: Warning[];
}

const BudgetWarnings: React.FC<BudgetWarningsProps> = ({ warnings }) => {
  if (warnings.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {warnings.map(warning => (
        <div
          key={warning.id}
          className={`p-4 rounded-xl border-2 flex items-start gap-3 ${
            warning.type === 'error' 
              ? 'bg-red-50 border-red-200' 
              : warning.type === 'warning'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          {warning.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
          {warning.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />}
          {warning.type === 'info' && <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />}
          <p className="text-sm text-gray-700">{warning.message}</p>
        </div>
      ))}
    </motion.div>
  );
};

export default BudgetWarnings;
