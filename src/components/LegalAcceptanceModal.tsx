import React, { useState } from 'react';
import { FaTimes, FaCheckCircle, FaFileContract } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface LegalAcceptanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (name: string, date: string) => Promise<void>;
  title: string;
  content: string;
  type: 'terms' | 'privacy';
  isLoading?: boolean;
}

const LegalAcceptanceModal: React.FC<LegalAcceptanceModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  title,
  content,
  type,
  isLoading = false,
}) => {
  const [name, setName] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState('');

  // Get today's date in YYYY-MM-DD format for max validation
  const todayString = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split('T')[0];
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!selectedDate) {
      setError('Please select a date');
      return;
    }

    // Check if date is in the future
    if (selectedDate > todayString) {
      setError('Please select today or an earlier date');
      return;
    }

    if (!acknowledged) {
      setError('You must acknowledge and accept to proceed');
      return;
    }

    try {
      // Date is already in YYYY-MM-DD format
      await onAccept(name.trim(), selectedDate);
      // Reset form after successful acceptance
      setName('');
      setSelectedDate('');
      setAcknowledged(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to accept. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" style={{ isolation: 'isolate' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-600 p-6">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 via-blue-400/20 to-indigo-400/20"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <FaFileContract className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{title}</h2>
                  <p className="text-teal-100 text-sm mt-1">Please read and acknowledge</p>
                </div>
              </div>
              {/* Close button disabled - user must accept to proceed */}
              <div className="p-2 opacity-50 cursor-not-allowed">
                <FaTimes className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Legal Document Content */}
            <div className="prose prose-slate max-w-none text-gray-700 leading-relaxed">
              <div
                className="max-h-[60vh] overflow-y-auto pr-4"
                style={{ 
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e1 #f1f5f9'
                }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>

            {/* Acceptance Form */}
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Acknowledgment and Acceptance
              </h3>

              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
              </div>

              {/* Date Input */}
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </Label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setError(''); // Clear error when date is selected
                  }}
                  max={todayString}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
                {selectedDate && selectedDate > todayString && (
                  <p className="text-sm text-red-600 mt-1">Please select today or an earlier date</p>
                )}
              </div>

              {/* Acknowledgment Checkbox */}
              <div className="flex items-center gap-3">
                <Checkbox
                  id="acknowledge"
                  checked={acknowledged}
                  onCheckedChange={(checked) => {
                    setAcknowledged(checked === true);
                    setError(''); // Clear error when checkbox is checked
                  }}
                  disabled={isLoading}
                  className="shrink-0 border-2 border-slate-500 data-[state=checked]:border-slate-700 data-[state=checked]:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-600/50"
                />
                <Label 
                  htmlFor="acknowledge" 
                  className="text-sm text-gray-700 cursor-pointer flex-1"
                >
                  I acknowledge and accept the {type === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'} <span className="text-red-500">*</span>
                </Label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex gap-3">
              {/* Cancel button removed - user must accept to proceed */}
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading || !name || !selectedDate || !acknowledged}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="w-5 h-5" />
                    I Acknowledge and Accept
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};

export default LegalAcceptanceModal;

