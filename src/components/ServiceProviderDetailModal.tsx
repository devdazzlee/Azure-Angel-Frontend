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
  Phone,
  Mail,
  Globe,
  Building2,
} from 'lucide-react';
import { normalizeSpecialties, type ServiceProviderRow } from '../utils/serviceProvider';

type DetailTab = 'overview' | 'details' | 'contact';

interface ServiceProviderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: ServiceProviderRow | null;
  onContactProvider?: (provider: ServiceProviderRow) => void;
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

const extractPhone = (provider: ServiceProviderRow): string | null => {
  const direct = provider.phone?.trim();
  if (direct) return direct;
  const fromContact = provider.contact_method?.match(
    /(?:\+?\d[\d\s().-]{7,}\d)/,
  );
  return fromContact?.[0]?.trim() ?? null;
};

const extractEmail = (provider: ServiceProviderRow): string | null => {
  const direct = provider.email?.trim();
  if (direct) return direct;
  const fromContact = provider.contact_method?.match(
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
  );
  return fromContact?.[0]?.trim() ?? null;
};

const resolveBusinessLocation = (provider: ServiceProviderRow): string => {
  if (provider.address?.trim()) return provider.address.trim();
  if (provider.local) return 'Local provider — contact for address or service area';
  return 'Nationwide — no single storefront location';
};

const resolveBusinessScale = (provider: ServiceProviderRow): string =>
  provider.local ? 'Small / local business' : 'Nationwide / large business';

const ServiceProviderDetailModal: React.FC<ServiceProviderDetailModalProps> = ({
  isOpen,
  onClose,
  provider,
  onContactProvider,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  if (!isOpen || !provider) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const websiteUrl =
    extractWebsiteUrl(provider.website) ?? extractWebsiteUrl(provider.contact_method);
  const phone = extractPhone(provider);
  const email = extractEmail(provider);
  const contactHref =
    websiteUrl ??
    (phone ? `tel:${phone.replace(/\s/g, '')}` : null) ??
    (email ? `mailto:${email}` : null) ??
    `https://www.google.com/search?q=${encodeURIComponent(provider.name)}`;

  const contactCtaLabel = websiteUrl
    ? 'Contact provider'
    : phone
      ? 'Call provider'
      : email
        ? 'Email provider'
        : 'Find on the web';

  const ratingSourceLabel =
    (typeof provider.rating_source === 'string' && provider.rating_source.trim()) ||
    'public reviews';
  const specialtiesList = normalizeSpecialties(provider.specialties);

  const ratingValue =
    typeof provider.rating === 'number'
      ? provider.rating
      : provider.rating != null
        ? Number.parseFloat(String(provider.rating))
        : NaN;
  const hasRating = Number.isFinite(ratingValue);

  const headerTone = provider.local
    ? 'from-emerald-600 to-teal-600'
    : 'from-blue-600 to-indigo-600';

  const businessLocation = resolveBusinessLocation(provider);
  const businessScale = resolveBusinessScale(provider);
  const contactMethodText =
    provider.contact_method?.trim() &&
    !extractWebsiteUrl(provider.contact_method)
      ? provider.contact_method.trim()
      : null;

  const tabClass = (tab: DetailTab) =>
    `flex-1 px-2 py-2 transition-colors sm:px-3 ${
      activeTab === tab
        ? 'border-b-2 border-teal-600 bg-white text-teal-700'
        : 'text-gray-600 hover:text-gray-900'
    }`;

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
              <p className="mt-0.5 truncate text-xs text-white/85">{provider.type || 'Service provider'}</p>
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

        <div className="flex border-b border-gray-200 bg-gray-50/80 text-[11px] font-medium sm:text-xs">
          <button type="button" onClick={() => setActiveTab('overview')} className={tabClass('overview')}>
            Overview
          </button>
          <button type="button" onClick={() => setActiveTab('details')} className={tabClass('details')}>
            Details &amp; Specialties
          </button>
          <button type="button" onClick={() => setActiveTab('contact')} className={tabClass('contact')}>
            Contact Info
          </button>
        </div>

        <div className="max-h-[min(52vh,420px)] overflow-y-auto px-4 py-3 text-sm text-gray-700">
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-semibold text-gray-900">About this provider</p>
                <p className="text-xs leading-relaxed text-gray-600">
                  {provider.description?.trim() || 'No description available for this provider.'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {provider.estimated_cost && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
                    <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-green-800">
                      <DollarSign className="h-3 w-3" aria-hidden />
                      Pricing
                    </p>
                    <p className="text-xs font-medium text-green-900">{provider.estimated_cost}</p>
                  </div>
                )}
                <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5">
                  <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-violet-800">
                    <MapPin className="h-3 w-3" aria-hidden />
                    Business location
                  </p>
                  <p className="text-xs font-medium text-violet-900">{businessLocation}</p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2.5">
                <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  <Building2 className="h-3 w-3" aria-hidden />
                  Business type
                </p>
                <p className="text-xs font-medium text-gray-900">{businessScale}</p>
                {provider.type && (
                  <p className="mt-1 text-xs text-gray-600">Service: {provider.type}</p>
                )}
              </div>

              {provider.key_considerations && (
                <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2">
                  <p className="mb-0.5 flex items-center gap-1 text-xs font-semibold text-amber-900">
                    <Award className="h-3 w-3" aria-hidden />
                    What to consider
                  </p>
                  <p className="text-xs leading-relaxed text-amber-900/90">
                    {String(provider.key_considerations)}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-3">
              {specialtiesList.length > 0 ? (
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-gray-900">Specialties</p>
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
              ) : (
                <p className="text-xs text-gray-500">No specialties listed for this provider.</p>
              )}

              {provider.category && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                  <span className="font-semibold">Category: </span>
                  <span className="capitalize">{String(provider.category)}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-3">
              {websiteUrl && (
                <div className="flex items-start gap-2 rounded-lg border border-gray-200 px-3 py-2">
                  <Globe className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900">Website</p>
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-xs text-teal-700 hover:underline"
                    >
                      {websiteUrl.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              )}

              {phone && (
                <div className="flex items-start gap-2 rounded-lg border border-gray-200 px-3 py-2">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Phone</p>
                    <a href={`tel:${phone.replace(/\s/g, '')}`} className="text-xs text-teal-700 hover:underline">
                      {phone}
                    </a>
                  </div>
                </div>
              )}

              {email && (
                <div className="flex items-start gap-2 rounded-lg border border-gray-200 px-3 py-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Email</p>
                    <a href={`mailto:${email}`} className="text-xs text-teal-700 hover:underline">
                      {email}
                    </a>
                  </div>
                </div>
              )}

              {contactMethodText && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                  <p className="mb-1 font-semibold text-gray-900">How to reach them</p>
                  <p className="leading-relaxed">{contactMethodText}</p>
                </div>
              )}

              {!websiteUrl && !phone && !email && !contactMethodText && (
                <p className="text-xs text-gray-500">
                  No direct contact details on file. Use the button below to search for this provider online.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-4 py-2.5">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-gray-600 hover:text-gray-900"
          >
            Close
          </button>
          <a
            href={contactHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (onContactProvider && provider) onContactProvider(provider);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
          >
            {websiteUrl || phone || email ? (
              <Phone className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            )}
            {contactCtaLabel}
          </a>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderDetailModal;
