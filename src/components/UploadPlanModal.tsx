import React, { useState, useRef, useEffect } from 'react';
import httpClient from '../api/httpClient';
import { toast } from 'react-toastify';
import PlanAnalysisModal from './PlanAnalysisModal';

interface UploadPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (businessInfo: any, analysis?: PlanAnalysis | null) => void;
  sessionId?: string;
  initialMode?: 'upload' | 'paste';
  onStartAnswering?: (analysis?: PlanAnalysis, businessInfo?: any) => void;
}

interface PlanAnalysis {
  summary: string;
  completeness_score: number;
  found_information: Record<string, boolean>;
  missing_questions: Array<{
    question_number: number;
    question_text: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  recommendations: string;
}

interface UploadedPlan {
  file_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  business_info: any;
  status: string;
  created_at: string;
}

interface UploadResponse {
  success: boolean;
  business_info?: any;
  analysis?: PlanAnalysis | null;
}

const UploadPlanModal: React.FC<UploadPlanModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  sessionId,
  initialMode = 'upload',
  onStartAnswering,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeMode, setActiveMode] = useState<'upload' | 'paste'>(initialMode);
  const [pastedText, setPastedText] = useState('');
  const [textError, setTextError] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState<PlanAnalysis | null>(null);
  const [uploadedBusinessInfo, setUploadedBusinessInfo] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        modalContentRef.current &&
        !modalContentRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    // Handle ESC key to close
    const handleEscape = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape' && !showAnalysis) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, showAnalysis]);

  useEffect(() => {
    if (isOpen) {
      setActiveMode(initialMode);
      setPastedText('');
      setTextError('');
      setDragActive(false);
      setShowAnalysis(false);
      setAnalysisData(null);
      setUploadedBusinessInfo(null);
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen, initialMode]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (uploading) {
      return; // Don't allow drag operations while uploading
    }
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      // Only set dragActive to false if we're actually leaving the drop zone
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setDragActive(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (uploading) {
      return; // Don't allow drop operations while uploading
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleTextSubmit = async () => {
    if (!pastedText.trim()) {
      setTextError('Please paste your business plan content before submitting.');
      return;
    }
    setTextError('');
    const blob = new Blob([pastedText], { type: 'text/plain' });
    const file = new File([blob], 'business-plan.txt', { type: 'text/plain' });
    await handleFileUpload(file);
    setPastedText('');
  };

  const handleFileUpload = async (file: File) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    // Also check file extension as a fallback
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      toast.error('Please upload a PDF, DOC, DOCX, or TXT file.');
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB.');
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setUploading(true);
    setDragActive(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await httpClient.post<UploadResponse>('/upload-plan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minute timeout for large file processing
      });

      if (response.data.success) {
        toast.success('Business plan analyzed successfully!');
        
        // Store business info and analysis
        const businessInfo = response.data.business_info || {};
        const analysis = response.data.analysis || null;
        
        setUploadedBusinessInfo(businessInfo);
        
        // Reset file input on success
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // If analysis is available, show analysis modal
        if (analysis) {
          setAnalysisData(analysis);
          setShowAnalysis(true);
        } else {
          // If no analysis, just close and call success callback
          if (businessInfo) {
            onUploadSuccess(businessInfo, null);
          }
          onClose();
        }
      } else {
        toast.error('Failed to upload business plan. Please try again.');
        // Reset file input on failure
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.message || 
                          'Failed to upload business plan. Please try again.';
      toast.error(errorMessage);
      // Reset file input on error
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setUploading(false);
      setDragActive(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleAnalysisClose = () => {
    setShowAnalysis(false);
    // Apply business info to session even if user closes analysis
    if (uploadedBusinessInfo) {
      onUploadSuccess(uploadedBusinessInfo, analysisData);
    }
    onClose();
  };

  const handleStartAnswering = () => {
    setShowAnalysis(false);
    // Apply business info and analysis to session
    if (uploadedBusinessInfo) {
      onUploadSuccess(uploadedBusinessInfo, analysisData);
    }
    onClose();
    // Call the callback to start answering questions - pass analysis data directly
    if (onStartAnswering) {
      onStartAnswering(analysisData || null, uploadedBusinessInfo || null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Analysis Modal */}
      {showAnalysis && analysisData && (
        <PlanAnalysisModal
          isOpen={showAnalysis}
          onClose={handleAnalysisClose}
          analysis={analysisData}
          onStartAnswering={handleStartAnswering}
          sessionId={sessionId}
        />
      )}

      {/* Upload Modal - Hide when analysis is shown */}
      {!showAnalysis && (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
      <div 
        ref={modalContentRef}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            📄 Upload Business Plan
          </h2>
          <button
            onClick={onClose}
            disabled={uploading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-1 hover:bg-gray-100 rounded-full"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6 rounded-xl border border-purple-200 bg-purple-50 p-4">
            <p className="text-sm font-medium text-purple-900">
              If you already have a completed business plan, upload it now and I&rsquo;ll review it to highlight anything else we need before generating your launch roadmap.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={() => setActiveMode('upload')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                activeMode === 'upload'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-700'
              }`}
            >
              Upload document
            </button>
            <button
              onClick={() => setActiveMode('paste')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                activeMode === 'paste'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700'
              }`}
            >
              Paste plan text
            </button>
          </div>

          {/* Upload Area */}
          <div className="space-y-6">
            {activeMode === 'upload' ? (
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : uploading
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Drop your business plan here
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      or click to browse files
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (!uploading && fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    disabled={uploading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {uploading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </span>
                    ) : (
                      'Choose File'
                    )}
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileInput}
                    disabled={uploading}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste your business plan content here..."
                  rows={12}
                  className="w-full border border-indigo-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-shadow"
                  disabled={uploading}
                />
                {textError && (
                  <div className="text-sm text-red-500">{textError}</div>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{pastedText.length.toLocaleString()} characters</span>
                  <span>Tip: include every section you’d expect in a polished plan.</span>
                </div>
                <button
                  onClick={handleTextSubmit}
                  disabled={uploading || !pastedText.trim()}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {uploading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </span>
                  ) : (
                    'Analyze This Text'
                  )}
                </button>
              </div>
            )}

              {/* File Requirements */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Supported File Types</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• PDF documents (.pdf)</li>
                  <li>• Microsoft Word (.doc, .docx)</li>
                  <li>• Text files (.txt)</li>
                  <li>• Maximum file size: 10MB</li>
                </ul>
              </div>

              {/* What Happens Next */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• We'll extract key business information from your plan</li>
                  <li>• The information will be used to pre-fill your business planning questions</li>
                  <li>• You can still modify and customize everything during the planning process</li>
                  <li>• Your content will be processed instantly (not stored permanently)</li>
                </ul>
              </div>
            </div>
        </div>
      </div>
      </div>
      )}
    </>
  );
};

export default UploadPlanModal;
