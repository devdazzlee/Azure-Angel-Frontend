import React, { useState, useRef } from 'react';
import httpClient from '../api/httpClient';
import { toast } from 'react-toastify';

interface UploadPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (businessInfo: any) => void;
  sessionId?: string;
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

const UploadPlanModal: React.FC<UploadPlanModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  sessionId
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedPlans, setUploadedPlans] = useState<UploadedPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showExistingPlans, setShowExistingPlans] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, DOC, DOCX, or TXT file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB.');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await httpClient.post('/upload-plan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Load existing plans to show the new one
        await loadUploadedPlans();
        
        // Apply to session if sessionId is provided
        if (sessionId) {
          await applyPlanToSession(response.data.data.file_id);
        }
        
        onUploadSuccess(response.data.data.business_info);
        onClose();
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload business plan. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const loadUploadedPlans = async () => {
    try {
      const response = await httpClient.get('/uploaded-plans');
      if (response.data.success) {
        setUploadedPlans(response.data.data);
      }
    } catch (error) {
      console.error('Error loading uploaded plans:', error);
    }
  };

  const applyPlanToSession = async (fileId: string) => {
    if (!sessionId) return;

    try {
      const response = await httpClient.post(`/uploaded-plans/${fileId}/use`, {
        session_id: sessionId
      });
      
      if (response.data.success) {
        console.log('Plan applied to session successfully');
      }
    } catch (error) {
      console.error('Error applying plan to session:', error);
    }
  };

  const handleUseExistingPlan = async () => {
    if (!selectedPlan || !sessionId) return;

    try {
      await applyPlanToSession(selectedPlan);
      
      // Get business info for the selected plan
      const plan = uploadedPlans.find(p => p.file_id === selectedPlan);
      if (plan) {
        onUploadSuccess(plan.business_info);
      }
      
      onClose();
    } catch (error) {
      console.error('Error using existing plan:', error);
      alert('Failed to apply plan to session.');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            📄 Upload Business Plan
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setShowExistingPlans(false)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                !showExistingPlans
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Upload New Plan
            </button>
            <button
              onClick={() => {
                setShowExistingPlans(true);
                loadUploadedPlans();
              }}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                showExistingPlans
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Use Existing Plan
            </button>
          </div>

          {/* Upload New Plan */}
          {!showExistingPlans && (
            <div className="space-y-6">
              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
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
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Uploading...' : 'Choose File'}
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>
              </div>

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
                  <li>• Your plan will be securely stored and can be reused for future sessions</li>
                </ul>
              </div>
            </div>
          )}

          {/* Use Existing Plan */}
          {showExistingPlans && (
            <div className="space-y-6">
              {uploadedPlans.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Select a previously uploaded plan:</h3>
                  
                  <div className="space-y-3">
                    {uploadedPlans.map((plan) => (
                      <div
                        key={plan.file_id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedPlan === plan.file_id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedPlan(plan.file_id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            
                            <div>
                              <p className="font-medium text-gray-900">{plan.file_name}</p>
                              <p className="text-sm text-gray-500">
                                {formatFileSize(plan.file_size)} • {formatDate(plan.created_at)}
                              </p>
                              {plan.business_info?.business_name && (
                                <p className="text-sm text-blue-600">
                                  {plan.business_info.business_name}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className={`w-5 h-5 rounded-full border-2 ${
                            selectedPlan === plan.file_id
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedPlan === plan.file_id && (
                              <div className="w-full h-full rounded-full bg-white scale-50"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={handleUseExistingPlan}
                    disabled={!selectedPlan}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Use Selected Plan
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">No uploaded plans yet</h3>
                  <p className="text-gray-500 mb-4">
                    Upload your first business plan to get started.
                  </p>
                  <button
                    onClick={() => setShowExistingPlans(false)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Upload a plan now
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPlanModal;
