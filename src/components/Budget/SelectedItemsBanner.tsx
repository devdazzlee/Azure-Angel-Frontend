import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MessageSquareText } from 'lucide-react';

interface SelectedItemsBannerProps {
  selectedItemIds: Set<string>;
  onChatOpen: () => void;
}

const SelectedItemsBanner: React.FC<SelectedItemsBannerProps> = ({
  selectedItemIds,
  onChatOpen
}) => {
  if (selectedItemIds.size === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-teal-50 to-cyan-50 p-3 sm:p-4 rounded-xl border border-teal-200/60 min-w-0"
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="shrink-0 px-3 py-1 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-full text-sm font-bold shadow-sm">
          {selectedItemIds.size}
        </div>
        <p className="text-gray-700 font-medium text-xs sm:text-sm leading-snug">
          items selected for Angel chat
        </p>
      </div>

      <Button
        onClick={onChatOpen}
        size="sm"
        className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md"
      >
        <MessageSquareText className="w-4 h-4 mr-2 shrink-0" />
        Chat with Angel
      </Button>
    </motion.div>
  );
};

export default SelectedItemsBanner;
