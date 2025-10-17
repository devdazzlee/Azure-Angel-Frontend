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

interface UploadResponse {
  success: boolean;
  business_info?: any;
}

const UploadPlanModal: React.FC<UploadPlanModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  sessionId
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
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

      const response = await httpClient.post<UploadResponse>('/upload-plan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success('Business plan uploaded and processed successfully!');
        
        // Extract business info from response (backend returns it directly)
        if (response.data.business_info) {
          onUploadSuccess(response.data.business_info);
        }
        
        onClose();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload business plan. Please try again.');
    } finally {
      setUploading(false);
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
          {/* Upload Area */}
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
                  <li>• Your document will be processed instantly (not stored permanently)</li>
                </ul>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPlanModal;
