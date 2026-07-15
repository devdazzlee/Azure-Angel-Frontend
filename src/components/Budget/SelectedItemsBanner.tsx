import React from 'react';
import { motion } from 'framer-motion';

interface SelectedItemsBannerProps {
  selectedItemIds: Set<string>;
}

const SelectedItemsBanner: React.FC<SelectedItemsBannerProps> = ({
  selectedItemIds,
}) => {
  if (selectedItemIds.size === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-teal-50 to-cyan-50 p-3 sm:p-4 rounded-xl border border-teal-200/60 min-w-0"
    >
      <div className="shrink-0 px-3 py-1 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-full text-sm font-bold shadow-sm">
        {selectedItemIds.size}
      </div>
      <p className="text-gray-700 font-medium text-xs sm:text-sm leading-snug">
        items selected — use the "Chat with Angel" button in the bottom right to discuss them
      </p>
    </motion.div>
  );
};

export default SelectedItemsBanner;
