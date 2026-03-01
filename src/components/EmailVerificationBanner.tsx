import React, { useEffect, useState } from 'react';
import { FaEnvelopeOpenText, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import {
  getEmailPendingVerification,
  clearEmailPendingVerification,
  EMAIL_VERIFICATION_MESSAGE,
} from '../utils/tokenUtils';

const EmailVerificationBanner: React.FC = () => {
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setPendingEmail(getEmailPendingVerification());
  }, []);

  if (!pendingEmail || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    clearEmailPendingVerification();
  };

  return (
    <div className="relative z-50 bg-amber-50 border-b border-amber-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 rounded-full bg-amber-100 p-2 text-amber-600">
            <FaEnvelopeOpenText className="h-4 w-4" />
          </div>
          <p className="text-sm leading-snug text-amber-800">
            <span className="font-semibold">Email verification required.</span>{' '}
            {EMAIL_VERIFICATION_MESSAGE}
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/verify-email', { state: { email: pendingEmail } })}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition"
          >
            Resend / View
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-100 hover:text-amber-700 transition"
            aria-label="Dismiss"
          >
            <FaTimes className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
