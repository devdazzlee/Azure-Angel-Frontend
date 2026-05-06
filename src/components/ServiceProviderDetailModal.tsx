import React, { useState } from 'react';
import {
  X,
  MapPin,
  Star,
  DollarSign,
  CheckCircle,
  ExternalLink,
  Briefcase,
  Award,
  Clock,
  TrendingUp
} from 'lucide-react';

interface ServiceProvider {
  name: string;
  type: string;
  local: boolean;
  description: string;
  key_considerations?: string;
  estimated_cost?: string;
  contact_method?: string;
  specialties?: string;
  category?: string;
  address?: string;
  rating?: number;
  rating_source?: string; // Where the rating was sourced from (e.g. "Google", "Yelp")
  website?: string;
  email?: string;
  phone?: string;
}

interface ServiceProviderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: ServiceProvider | null;
  // The user's business city, used for the "Business Location" stat. The
  // modal still falls back to a generic label if it isn't provided.
  businessLocation?: string;
  onContactProvider?: (provider: ServiceProvider) => void;
}

// Strip leading "Website: " / "Contact: " labels and trim. Returns the URL
// or null if the string doesn't look like one.
const extractWebsiteUrl = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.replace(/^\s*(?:website|contact|url)\s*:\s*/i, '').trim();
  if (!trimmed) return null;
  // Accept obvious URLs and bare domains.
  const looksLikeUrl = /^(?:https?:\/\/|www\.)/i.test(trimmed) || /^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(trimmed);
  if (!looksLikeUrl) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const ServiceProviderDetailModal: React.FC<ServiceProviderDetailModalProps> = ({
  isOpen,
  onClose,
  provider,
  businessLocation,
  onContactProvider
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');

  if (!isOpen || !provider) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Resolve the best URL we have for the provider, in priority order:
  //   1. an explicit `website` field
  //   2. a URL embedded in `contact_method` (e.g. "Website: example.com")
  //   3. a Google search for the provider name as a discoverable fallback,
  //      so the button is never a dead end — the user can always reach
  //      a real contact channel from here.
  const websiteUrl = extractWebsiteUrl(provider.website) ?? extractWebsiteUrl(provider.contact_method);
  const contactUrl = websiteUrl ?? `https://www.google.com/search?q=${encodeURIComponent(provider.name)}`;
  const contactLabelIsWebsite = Boolean(websiteUrl);

  const ratingSourceLabel = provider.rating_source && provider.rating_source.trim()
    ? provider.rating_source.trim()
    : 'aggregated public reviews';

  const specialtiesList = provider.specialties ? provider.specialties.split(',').map(s => s.trim()) : [];

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
        {/* Header */}
        <div className={`relative ${provider.local ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'} p-8 text-white`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Briefcase className="h-8 w-8 text-white" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold">{provider.name}</h2>
                {provider.local && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm">
                    <MapPin className="h-4 w-4" />
                    Local
                  </span>
                )}
              </div>
              
              <p className="text-white/90 text-lg mb-3">{provider.type}</p>
              
              {provider.rating && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(provider.rating || 0)
                            ? 'fill-yellow-300 text-yellow-300'
                            : 'text-white/30'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-white/90 font-semibold text-lg">
                    {provider.rating.toFixed(1)}
                  </span>
                  <span className="text-white/75 text-xs font-medium">
                    Source: {ratingSourceLabel}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-6 py-4 font-medium transition-all ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 px-6 py-4 font-medium transition-all ${
                activeTab === 'details'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              Details & Specialties
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-300px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  About This Provider
                </h3>
                <p className="text-gray-700 leading-relaxed text-base">
                  {provider.description}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {provider.estimated_cost && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Estimated Pricing</span>
                    </div>
                    <p className="text-lg font-bold text-green-900">{provider.estimated_cost}</p>
                  </div>
                )}

                {provider.category && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Category</span>
                    </div>
                    <p className="text-lg font-bold text-blue-900 capitalize">{provider.category}</p>
                  </div>
                )}

                {(provider.local || businessLocation) && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">Business Location</span>
                    </div>
                    <p className="text-lg font-bold text-purple-900">
                      {businessLocation && businessLocation.trim()
                        ? businessLocation.trim()
                        : 'Local Provider'}
                    </p>
                  </div>
                )}
              </div>

              {/* Next Steps — moved here from the deleted Contact Info tab. */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
                <h4 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Next Steps
                </h4>
                <ol className="space-y-3 text-indigo-800">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                    <span>Use the website link below to reach out to {provider.name}.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                    <span>Mention your business needs and ask about their services.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                    <span>Request a consultation or quote for your specific requirements.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                    <span>Compare with other providers to find the best fit.</span>
                  </li>
                </ol>
              </div>

              {/* Key Considerations */}
              {provider.key_considerations && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Key Considerations
                  </h4>
                  <p className="text-amber-800 leading-relaxed">{provider.key_considerations}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Specialties */}
              {specialtiesList.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    Areas of Expertise
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {specialtiesList.map((specialty, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-800 font-medium">{specialty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Type Details */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Service Type & Delivery</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${provider.local ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                    <span className="text-gray-700">
                      {provider.local ? 'Local, in-person services available' : 'Nationwide remote services'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-gray-700">{provider.type}</span>
                  </div>
                  {provider.estimated_cost && (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-gray-700">Estimated cost: {provider.estimated_cost}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Why Choose This Provider */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <h4 className="font-semibold text-green-900 mb-3">✨ Why Choose This Provider?</h4>
                <ul className="space-y-2 text-green-800">
                  {provider.local && (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <span>Local presence means personalized service and face-to-face meetings</span>
                    </li>
                  )}
                  {!provider.local && (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <span>Nationwide reach with consistent, standardized processes</span>
                    </li>
                  )}
                  {provider.rating && provider.rating >= 4.5 && (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <span>High customer satisfaction rating ({provider.rating}/5.0)</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <span>Specialized expertise in {provider.category || 'business services'}</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 bg-gray-50 px-8 py-5 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Close
          </button>
          
          <div className="flex items-center gap-3">
            <a
              href={contactUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (onContactProvider && provider) onContactProvider(provider);
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
              title={contactLabelIsWebsite ? `Open ${provider.name}'s website` : `Search for ${provider.name}`}
            >
              <ExternalLink className="h-4 w-4" />
              {contactLabelIsWebsite ? 'Visit Website' : 'Find on the web'}
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ServiceProviderDetailModal;









