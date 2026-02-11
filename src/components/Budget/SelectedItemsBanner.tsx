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
      className="mt-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200"
    >
      <div className="flex items-center gap-3">
        <div className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-bold">
          {selectedItemIds.size}
        </div>
        <p className="text-gray-700 font-medium">items selected for Angel chat</p>
      </div>
      
      <Button
        onClick={onChatOpen}
        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg"
      >
        <MessageSquareText className="w-4 h-4 mr-2" />
        Chat with Angel
      </Button>
    </motion.div>
  );
};

export default SelectedItemsBanner;
