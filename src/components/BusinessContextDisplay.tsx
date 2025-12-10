import React from 'react';
import { Building2, Target, MapPin } from 'lucide-react';

interface BusinessContextDisplayProps {
  businessContext: {
    business_name?: string;
    industry?: string;
    location?: string;
    business_type?: string;
  };
}

const BusinessContextDisplay: React.FC<BusinessContextDisplayProps> = ({ businessContext }) => {
  const isValid = businessContext.business_name && 
                  businessContext.business_name !== 'Unsure' && 
                  businessContext.business_name !== 'Your Business';

  return (
    <div className="pt-4 border-t border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <div className="p-1.5 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
          Business Context
        </span>
      </h3>
      {!isValid ? (
        // Beautiful Skeleton Loader
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-pulse">
          <div className="flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg">
            <div className="h-6 w-6 bg-gradient-to-br from-teal-200 to-blue-200 rounded"></div>
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded w-20 mb-1.5"></div>
              <div className="h-4 bg-gray-300 rounded w-32"></div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg">
            <div className="h-6 w-6 bg-gradient-to-br from-teal-200 to-blue-200 rounded"></div>
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded w-16 mb-1.5"></div>
              <div className="h-4 bg-gray-300 rounded w-28"></div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg">
            <div className="h-6 w-6 bg-gradient-to-br from-teal-200 to-blue-200 rounded"></div>
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded w-20 mb-1.5"></div>
              <div className="h-4 bg-gray-300 rounded w-36"></div>
            </div>
          </div>
        </div>
      ) : (
        // Beautiful Actual Content
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2.5 p-3 bg-gradient-to-r from-teal-50/80 to-blue-50/80 hover:from-teal-100 hover:to-blue-100 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md group">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Business</p>
              <p className="text-sm font-bold text-gray-900 truncate">{businessContext.business_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 hover:from-blue-100 hover:to-indigo-100 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md group">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
              <Target className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Industry</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{businessContext.industry}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 hover:from-indigo-100 hover:to-purple-100 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md group">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Location</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{businessContext.location}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessContextDisplay;









