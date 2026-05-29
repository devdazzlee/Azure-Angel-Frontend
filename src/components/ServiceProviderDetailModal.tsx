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
  Building2,
} from 'lucide-react';
import { normalizeSpecialties } from '../utils/serviceProvider';
import { displayBusinessNameFromApi } from '../utils/businessName';

interface ServiceProvider {
  name: string;
  type: string;
  local: boolean;
  description: string;
  key_considerations?: string;
  estimated_cost?: string;
  contact_method?: string;
  specialties?: string | string[];
  category?: string;
  address?: string;
  rating?: number;
  rating_source?: string;
  website?: string;
  email?: string;
  phone?: string;
}

export interface VentureBusinessContext {
  business_name?: string;
  industry?: string;
  location?: string;
  business_type?: string;
}

interface ServiceProviderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: ServiceProvider | null;
  businessContext?: VentureBusinessContext;
  businessLocation?: string;
  onContactProvider?: (provider: ServiceProvider) => void;
}

const extractWebsiteUrl = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.replace(/^\s*(?:website|contact|url)\s*:\s*/i, '').trim();
  if (!trimmed) return null;
  const looksLikeUrl =
    /^(?:https?:\/\/|www\.)/i.test(trimmed) || /^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(trimmed);
  if (!looksLikeUrl) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const ServiceProviderDetailModal: React.FC<ServiceProviderDetailModalProps> = ({
  isOpen,
  onClose,
  provider,
  businessContext,
  businessLocation,
  onContactProvider,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');

  if (!isOpen || !provider) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const websiteUrl =
    extractWebsiteUrl(provider.website) ?? extractWebsiteUrl(provider.contact_method);
  const contactUrl =
    websiteUrl ?? `https://www.google.com/search?q=${encodeURIComponent(provider.name)}`;
  const contactLabelIsWebsite = Boolean(websiteUrl);

  const ratingSourceLabel = provider.rating_source?.trim() || 'public reviews';
  const specialtiesList = normalizeSpecialties(provider.specialties);

  const ratingValue =
    typeof provider.rating === 'number'
      ? provider.rating
      : provider.rating != null
        ? Number.parseFloat(String(provider.rating))
        : NaN;
  const hasRating = Number.isFinite(ratingValue);

  const ventureName = displayBusinessNameFromApi(businessContext?.business_name);
  const ventureIndustry = businessContext?.industry?.trim() || '';
  const ventureLocation =
    businessContext?.location?.trim() || businessLocation?.trim() || '';
  const ventureType = businessContext?.business_type?.trim() || '';
  const hasVentureProfile = Boolean(
    ventureName || ventureIndustry || ventureLocation || ventureType,
  );

  const headerTone = provider.local
    ? 'from-emerald-600 to-teal-600'
    : 'from-blue-600 to-indigo-600';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="provider-modal-title"
    >
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact header */}
        <div className={`relative bg-gradient-to-r ${headerTone} px-4 py-3 text-white`}>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <Briefcase className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 pr-6">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2
                  id="provider-modal-title"
                  className="truncate text-base font-semibold leading-tight"
                >
                  {provider.name}
                </h2>
                {provider.local && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-medium">
                    <MapPin className="h-2.5 w-2.5" aria-hidden />
                    Local
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-white/85">{provider.type}</p>
              {hasRating && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                  <div className="flex items-center" aria-label={`Rating ${ratingValue.toFixed(1)}`}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.floor(ratingValue)
                            ? 'fill-amber-300 text-amber-300'
                            : 'text-white/35'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-medium">{ratingValue.toFixed(1)}</span>
                  <span className="text-white/70">· {ratingSourceLabel}</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 rounded-md p-1 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50/80 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-3 py-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-b-2 border-teal-600 bg-white text-teal-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex-1 px-3 py-2 transition-colors ${
              activeTab === 'details'
                ? 'border-b-2 border-teal-600 bg-white text-teal-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Details
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[min(52vh,420px)] overflow-y-auto px-4 py-3 text-sm text-gray-700">
          {activeTab === 'overview' && (
            <div className="space-y-3">
              {hasVentureProfile && (
                <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2">
                  <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    <Building2 className="h-3 w-3" aria-hidden />
                    Your venture
                  </p>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {ventureName && (
                      <>
                        <dt className="text-[11px] text-gray-500">Business</dt>
                        <dd className="text-xs font-medium text-gray-900">{ventureName}</dd>
                      </>
                    )}
                    {ventureIndustry && (
                      <>
                        <dt className="text-[11px] text-gray-500">Industry</dt>
                        <dd className="text-xs text-gray-900 line-clamp-2">{ventureIndustry}</dd>
                      </>
                    )}
                    {ventureLocation && (
                      <>
                        <dt className="text-[11px] text-gray-500">Location</dt>
                        <dd className="text-xs text-gray-900">{ventureLocation}</dd>
                      </>
                    )}
                    {ventureType && (
                      <>
                        <dt className="text-[11px] text-gray-500">Type</dt>
                        <dd className="text-xs text-gray-900">{ventureType}</dd>
                      </>
                    )}
                  </dl>
                </div>
              )}

              <div>
                <p className="mb-1 text-xs font-semibold text-gray-900">About</p>
                <p className="text-xs leading-relaxed text-gray-600">{provider.description}</p>
              </div>

              {(provider.estimated_cost || provider.category) && (
                <div className="flex flex-wrap gap-2">
                  {provider.estimated_cost && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs text-green-900">
                      <DollarSign className="h-3 w-3 shrink-0" aria-hidden />
                      {provider.estimated_cost}
                    </span>
                  )}
                  {provider.category && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs capitalize text-blue-900">
                      <Briefcase className="h-3 w-3 shrink-0" aria-hidden />
                      {provider.category}
                    </span>
                  )}
                </div>
              )}

              {provider.key_considerations && (
                <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2">
                  <p className="mb-0.5 flex items-center gap-1 text-xs font-semibold text-amber-900">
                    <Award className="h-3 w-3" aria-hidden />
                    Considerations
                  </p>
                  <p className="text-xs leading-relaxed text-amber-900/90">
                    {provider.key_considerations}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-3">
              {specialtiesList.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-gray-900">Expertise</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {specialtiesList.map((specialty, index) => (
                      <li
                        key={index}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-700"
                      >
                        <CheckCircle className="h-3 w-3 shrink-0 text-teal-600" aria-hidden />
                        {specialty}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600">
                <p className="mb-1 font-semibold text-gray-900">Service</p>
                <ul className="space-y-1">
                  <li>
                    {provider.local
                      ? 'Local / in-person available'
                      : 'Nationwide / remote'}
                  </li>
                  <li>{provider.type}</li>
                  {provider.estimated_cost && <li>Est. cost: {provider.estimated_cost}</li>}
                  {provider.address && <li>{provider.address}</li>}
                </ul>
              </div>

              {specialtiesList.length === 0 && !provider.address && (
                <p className="text-xs text-gray-500">No additional details for this provider.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-4 py-2.5">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-gray-600 hover:text-gray-900"
          >
            Close
          </button>
          <a
            href={contactUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (onContactProvider && provider) onContactProvider(provider);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
            title={
              contactLabelIsWebsite
                ? `Open ${provider.name}'s website`
                : `Search for ${provider.name}`
            }
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            {contactLabelIsWebsite ? 'Visit website' : 'Find on the web'}
          </a>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderDetailModal;
