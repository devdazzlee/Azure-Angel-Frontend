import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, X, Bot, User } from 'lucide-react';
import type { BudgetItem, BusinessContextPayload } from '@/types/apiTypes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils'; // Assuming cn utility is available
import { fetchQuestion } from '@/services/authService';
import { toast } from 'react-toastify';

interface ChatMessage {
  id: string;
  sender: 'user' | 'angel';
  text: string;
  timestamp: string;
}

interface BudgetChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string | undefined;
  selectedItems: BudgetItem[];
  allBudgetItems: BudgetItem[];
  businessContext: BusinessContextPayload | undefined;
  businessPlanSummary: string;
}

const BudgetChatModal: React.FC<BudgetChatModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  selectedItems,
  allBudgetItems,
  businessContext,
  businessPlanSummary,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      // Generate Angel's initial message
      const selectedItemNames = selectedItems.map(item => item.name).join(', ');
      const initialAngelMessage = `Hi! I can see you've selected: ${selectedItemNames || 'no items'}. What would you like to know about these budget items? I can help you:
      • Evaluate if amounts are reasonable
      • Suggest adjustments
      • Identify missing expenses
      • Explain industry benchmarks`;

      setMessages([
        { id: 'angel-initial', sender: 'angel', text: initialAngelMessage, timestamp: new Date().toLocaleTimeString() }
      ]);
      scrollToBottom();
    }
  }, [isOpen, selectedItems]);

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '' || !sessionId) return;

    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const selectedSummary = selectedItems.length
        ? selectedItems.map((item) => formatBudgetItem(item)).join('\n')
        : 'None';

      const allItemsSummary = allBudgetItems.length
        ? allBudgetItems.slice(0, 200).map((item) => formatBudgetItem(item)).join('\n')
        : 'None';

      const contextText = businessContext ? JSON.stringify(businessContext) : '';

      const content = [
        'You are Angel, a helpful finance assistant. The user is working on a startup budget dashboard.',
        'Give concise, practical budget guidance and suggestions.',
        '',
        'Business plan summary:',
        businessPlanSummary || '',
        '',
        'Business context (JSON):',
        contextText,
        '',
        'Selected budget items (focus on these):',
        selectedSummary,
        '',
        'All budget items (for reference):',
        allItemsSummary,
        '',
        'User message:',
        newUserMessage.text,
      ]
        .filter((v) => v !== undefined)
        .join('\n');

      const res = await fetchQuestion(content, sessionId, 'budget_chat');
      const reply = res?.result?.reply || res?.result?.immediate_response || 'No response received.';

      const angelResponse: ChatMessage = {
        id: `angel-${Date.now()}`,
        sender: 'angel',
        text: reply,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, angelResponse]);
    } catch (err: any) {
      const message = (err as Error)?.message || 'Failed to send message.';
      toast.error(message);
      const errorMessage: ChatMessage = {
        id: `angel-${Date.now()}`,
        sender: 'angel',
        text: message,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatBudgetItem = (item: BudgetItem) => {
    const estAmount = Number(item.estimated_amount) || 0;
    const actAmount = item.actual_amount ? Number(item.actual_amount) || 0 : null;
    return `${item.name} (${item.category === 'expense' ? 'Expense' : 'Revenue'}): Est. $${estAmount.toLocaleString()}${actAmount ? `, Actual $${actAmount.toLocaleString()}` : ''}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] flex flex-col h-[80vh]">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-600" /> Chat with Angel
          </DialogTitle>
          <DialogDescription>
            Discuss your selected budget items with Angel for personalized guidance.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow flex flex-col overflow-hidden border-t pt-4">
          <ScrollArea className="flex-grow pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex items-start gap-3',
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.sender === 'angel' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'p-3 rounded-lg max-w-[70%]',
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    )}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs text-right mt-1 opacity-75">{message.timestamp}</p>
                  </div>
                  {message.sender === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex items-start gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3 rounded-lg bg-gray-100 text-gray-800 max-w-[70%]">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2 pt-4 border-t">
          <Input
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            className="flex-grow"
            disabled={isTyping || !sessionId}
          />
          <Button onClick={handleSendMessage} disabled={isTyping || inputMessage.trim() === '' || !sessionId}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetChatModal;
