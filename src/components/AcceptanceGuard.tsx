import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAcceptanceStatus, acceptTerms, acceptPrivacy } from '../services/authService';
import LegalAcceptanceModal from './LegalAcceptanceModal';
import { getTermsContent, getPrivacyContent } from '../utils/legalContent';
import { toast } from 'react-toastify';

interface AcceptanceGuardProps {
  children: React.ReactElement;
}

const AcceptanceGuard: React.FC<AcceptanceGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isAcceptingTerms, setIsAcceptingTerms] = useState(false);
  const [isAcceptingPrivacy, setIsAcceptingPrivacy] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const checkAcceptance = async () => {
      try {
        const status = await checkAcceptanceStatus();
        
        if (!status.terms_accepted) {
          // Show Terms modal
          setShowTermsModal(true);
          setIsChecking(false);
          return;
        }
        
        if (!status.privacy_accepted) {
          // Show Privacy modal
          setShowPrivacyModal(true);
          setIsChecking(false);
          return;
        }
        
        // Both accepted, allow access
        setIsChecking(false);
      } catch (err: any) {
        console.error('Failed to check acceptance status:', err);
        // On error, allow access (fail open) but log the error
        setIsChecking(false);
      }
    };

    // Get user name from localStorage or user data
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserName(user.full_name || user.name || '');
      } catch (e) {
        // Ignore parse errors
      }
    }

    checkAcceptance();
  }, []);

  const handleAcceptTerms = async (name: string, date: string) => {
    setIsAcceptingTerms(true);
    try {
      const result = await acceptTerms(name, date);
      setShowTermsModal(false);
      setUserName(name); // Store name for next modal
      
      if (result.both_accepted) {
        toast.success('Terms and Privacy Policy accepted!');
        // Both accepted, reload to show content
        window.location.reload();
      } else {
        // Show Privacy modal
        setShowPrivacyModal(true);
        toast.success('Terms and Conditions accepted!');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to accept Terms and Conditions');
      throw err;
    } finally {
      setIsAcceptingTerms(false);
    }
  };

  const handleAcceptPrivacy = async (name: string, date: string) => {
    setIsAcceptingPrivacy(true);
    try {
      const result = await acceptPrivacy(name, date);
      setShowPrivacyModal(false);
      
      if (result.both_accepted) {
        toast.success('Terms and Privacy Policy accepted!');
        // Both accepted, reload to show content
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to accept Privacy Policy');
      throw err;
    } finally {
      setIsAcceptingPrivacy(false);
    }
  };

  // Show loading while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Logging you in.... </p>
        </div>
      </div>
    );
  }

  // Show modals if not accepted
  if (showTermsModal || showPrivacyModal) {
    return (
      <>
        {showTermsModal && (
          <LegalAcceptanceModal
            isOpen={showTermsModal}
            onClose={() => {
              toast.warning('You must accept the Terms and Conditions to access Angel features.');
            }}
            onAccept={handleAcceptTerms}
            title="Terms and Conditions"
            content={getTermsContent()}
            type="terms"
            isLoading={isAcceptingTerms}
          />
        )}
        {showPrivacyModal && (
          <LegalAcceptanceModal
            isOpen={showPrivacyModal}
            onClose={() => {
              toast.warning('You must accept the Privacy Policy to access Angel features.');
            }}
            onAccept={handleAcceptPrivacy}
            title="Privacy Policy"
            content={getPrivacyContent()}
            type="privacy"
            isLoading={isAcceptingPrivacy}
          />
        )}
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceptance Required</h2>
            <p className="text-gray-600 mb-4">
              You must accept the Terms and Conditions and Privacy Policy to access Angel features.
            </p>
            <p className="text-sm text-gray-500">
              Please complete the acceptance forms above.
            </p>
          </div>
        </div>
      </>
    );
  }

  // Both accepted, show children
  return children;
};

export default AcceptanceGuard;



