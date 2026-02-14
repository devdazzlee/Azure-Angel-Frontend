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
      className="mt-4 flex items-center justify-between bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-xl border border-teal-200/60"
    >
      <div className="flex items-center gap-3">
        <div className="px-3 py-1 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-full text-sm font-bold shadow-sm">
          {selectedItemIds.size}
        </div>
        <p className="text-gray-700 font-medium text-sm">items selected for Angel chat</p>
      </div>
      
      <Button
        onClick={onChatOpen}
        size="sm"
        className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md"
      >
        <MessageSquareText className="w-4 h-4 mr-2" />
        Chat with Angel
      </Button>
    </motion.div>
  );
};

export default SelectedItemsBanner;
