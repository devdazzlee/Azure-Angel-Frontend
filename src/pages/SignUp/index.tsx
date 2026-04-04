import React, { useEffect, useRef, useState } from 'react';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaArrowRight, FaMagic, FaUser } from 'react-icons/fa';
import { signUp, acceptTerms, acceptPrivacy } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { setEmailPendingVerification } from '../../utils/tokenUtils';
import LegalAcceptanceModal from '../../components/LegalAcceptanceModal';
import { getTermsContent, getPrivacyContent } from '../../utils/legalContent';

interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function loadRecaptchaV3Script(siteKey: string): void {
  if (document.querySelector('script[data-recaptcha-v3]')) return;
  const script = document.createElement('script');
  script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
  script.async = true;
  script.defer = true;
  script.dataset.recaptchaV3 = 'true';
  document.body.appendChild(script);
}

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignupFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({ pass: false, confirm: false });
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaWrapperRef = useRef<HTMLDivElement | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
  const recaptchaWidgetIdRef = useRef<number | null>(null);
  
  // Note: Terms/Privacy modals are now handled by AcceptanceGuard after user logs in
  // These states are kept for potential future use but won't be triggered after signup
  const [isAcceptingTerms, setIsAcceptingTerms] = useState(false);
  const [isAcceptingPrivacy, setIsAcceptingPrivacy] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const recaptchaSiteKey = '6Ldfo6YsAAAAAEwH4FSqKnbdWCwuWLZ9FVZFYk79';
  const recaptchaVersion = (import.meta.env.VITE_RECAPTCHA_VERSION as string | undefined)?.toLowerCase().trim();
  const isRecaptchaEnabled = Boolean(recaptchaSiteKey);
  const recaptchaMode: 'v2' | 'v3' = recaptchaVersion === 'v3' ? 'v3' : 'v2';

  useEffect(() => {
    if (!recaptchaSiteKey) return;

    if (recaptchaMode === 'v3') {
      loadRecaptchaV3Script(recaptchaSiteKey);
      return;
    }

    // v2: render the checkbox widget
    let done = false;

    function doRender() {
      if (done || !recaptchaContainerRef.current) return;
      if (!window.grecaptcha || typeof window.grecaptcha.render !== 'function') return;
      try {
        done = true;
        const widgetId = window.grecaptcha.render(recaptchaContainerRef.current, {
          sitekey: recaptchaSiteKey!,
          callback: (token: string) => setCaptchaToken(token),
          'expired-callback': () => setCaptchaToken(null),
          'error-callback': () => setCaptchaToken(null),
        });
        recaptchaWidgetIdRef.current = widgetId;
      } catch (e) {
        done = false;
        console.error('Failed to render reCAPTCHA:', e);
        toast.error('Captcha failed to load. Please refresh and try again.');
      }
    }

    if (window.grecaptcha) {
      window.grecaptcha.ready(doRender);
    } else {
      window.__recaptchaV2Onload = doRender;
      if (!document.querySelector('script[data-recaptcha-v2]')) {
        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js?onload=__recaptchaV2Onload&render=explicit';
        script.async = true;
        script.defer = true;
        script.dataset.recaptchaV2 = 'true';
        script.onerror = () => toast.error('Captcha failed to load. Please refresh and try again.');
        document.body.appendChild(script);
      }
    }

    return () => {
      done = true;
      recaptchaWidgetIdRef.current = null;
    };
  }, [recaptchaMode, recaptchaSiteKey]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    let captchaToSend: string | undefined = undefined;
    if (isRecaptchaEnabled) {
      if (recaptchaMode === 'v2') {
        if (!captchaToken) {
          toast.error('Please complete the captcha.');
          return;
        }
        captchaToSend = captchaToken;
      } else if (recaptchaMode === 'v3') {
        try {
          loadRecaptchaV3Script(recaptchaSiteKey as string);
          if (!window.grecaptcha || typeof window.grecaptcha.execute !== 'function') {
            toast.error('Captcha failed to load. Please refresh and try again.');
            return;
          }

          if (typeof window.grecaptcha.ready === 'function') {
            await new Promise<void>((resolve) => window.grecaptcha?.ready?.(() => resolve()));
          }

          captchaToSend = await window.grecaptcha.execute(recaptchaSiteKey, { action: 'signup' });
        } catch (error) {
          console.error('Failed to execute reCAPTCHA', error);
          toast.error('Captcha verification failed. Please try again.');
          return;
        }
      } else {
        toast.error('Captcha is still loading. Please try again in a moment.');
        return;
      }
    }

    setIsLoading(true);

    try {
      await signUp({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        captchaToken: captchaToSend,
      });
      setEmailPendingVerification(formData.email);

      // Show success message and redirect to verify email page
      toast.success('Account created successfully! Please check your email to verify your account.');
      
      // Redirect to verify email page
      navigate('/verify-email', {
        state: { email: formData.email },
      });
    } catch (err: unknown) {
      console.error('Signup error:', err);
      // Extract error message from Error object (thrown by authService)
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Signup failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      if (isRecaptchaEnabled && recaptchaMode === 'v2' && window.grecaptcha && recaptchaWidgetIdRef.current !== null) {
        window.grecaptcha.reset(recaptchaWidgetIdRef.current);
        setCaptchaToken(null);
      }
    }
  };

  const handleAcceptTerms = async (name: string, date: string) => {
    setIsAcceptingTerms(true);
    try {
      console.log('Accepting Terms with:', { name, date });
      const result = await acceptTerms(name, date);
      console.log('Terms acceptance result:', result);
      
      // Close Terms modal first
      setShowTermsModal(false);
      setIsAcceptingTerms(false);
      
      // Small delay to ensure Terms modal closes before Privacy modal opens
      setTimeout(() => {
        if (result.both_accepted) {
          // Both already accepted (shouldn't happen, but handle it)
          console.log('Both already accepted, redirecting');
          toast.success('Terms and Privacy Policy accepted!');
          // Note: This handler won't be called after signup since we redirect immediately
          // It's kept for potential future use
        } else {
          // Show Privacy modal
          console.log('Showing Privacy Policy modal after Terms acceptance');
          setShowPrivacyModal(true);
          toast.success('Terms and Conditions accepted! Please accept the Privacy Policy.');
        }
      }, 300);
    } catch (err: unknown) {
      console.error('Error accepting Terms:', err);
      setIsAcceptingTerms(false);
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept Terms and Conditions';
      toast.error(errorMessage);
      throw err;
    }
  };

  const handleAcceptPrivacy = async (name: string, date: string) => {
    setIsAcceptingPrivacy(true);
    try {
      const result = await acceptPrivacy(name, date);
      setShowPrivacyModal(false);
      
      if (result.both_accepted) {
        toast.success('Terms and Privacy Policy accepted!');
        // Note: This handler won't be called after signup since we redirect immediately
        // It's kept for potential future use
      } else {
        // This shouldn't happen, but handle it
        toast.warning('Privacy Policy accepted, but Terms acceptance is missing.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept Privacy Policy';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsAcceptingPrivacy(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50">
      {/* Soft Teal Background Glows */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Frosted Glass Card */}
          <div className="backdrop-blur-xl bg-white/80 rounded-3xl border border-teal-100 shadow-lg overflow-hidden hover:scale-[1.02] transition-transform duration-300">
            {/* Header with Teal Accent */}
            <div className="relative p-8 pb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-teal-600"></div>
              <div className="relative text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-teal-600 to-teal-600 rounded-2xl mb-6 shadow-md">
                  <FaMagic className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
                <p className="text-gray-700">Sign up to start your journey</p>
              </div>
            </div>

            {/* IP Protection Promise */}
            <div className="mx-8 mt-2 rounded-xl border border-teal-100 bg-teal-50/80 p-4">
              <p className="text-sm leading-relaxed text-slate-700">
                <span className="font-semibold text-teal-700">The Founderport Promise:</span> Your idea is yours, period.
                Founderport exists to help you shape and launch your business, not to claim it, share it, or reuse it.
                The business you create in Founderport stays private to you and is treated with the same discretion and
                respect we'd expect for our own ideas. We've been there, and know how important this is to you.
              </p>
            </div>

            {/* Form Fields */}
            <form className="p-8 pt-2" onSubmit={handleSubmit}>
              <div className="space-y-6">

                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-3 text-gray-400" />
                    <input
                      name="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-600 transition"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                    <input
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-600 transition"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-3 text-gray-400" />
                    <input
                      name="password"
                      type={showPassword.pass ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-600 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, pass: !showPassword.pass })}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition"
                    >
                      {showPassword.pass ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Re Type Password</label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-3 text-gray-400" />
                    <input
                      name="confirmPassword"
                      type={showPassword.confirm ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter your password"
                      className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-600 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition"
                    >
                      {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* reCAPTCHA */}
                {isRecaptchaEnabled && recaptchaMode === 'v2' && (
                  <div>
                    <div
                      ref={recaptchaWrapperRef}
                      className="w-full flex items-center overflow-hidden"
                      style={{ minHeight: '78px' }}
                    >
                      <div ref={recaptchaContainerRef} />
                    </div>
                    <p className="mt-2 text-center text-xs text-gray-400">
                      Protected by reCAPTCHA — Google{' '}
                      <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="underline hover:text-teal-600">Privacy</a>
                      {' '}&amp;{' '}
                      <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="underline hover:text-teal-600">Terms</a>
                    </p>
                  </div>
                )}
                {isRecaptchaEnabled && recaptchaMode === 'v3' && (
                  <p className="text-center text-xs text-gray-400">
                    Protected by reCAPTCHA — Google{' '}
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="underline hover:text-teal-600">Privacy</a>
                    {' '}&amp;{' '}
                    <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="underline hover:text-teal-600">Terms</a>
                  </p>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-teal-700 transition"
                >
                  {isLoading ? 'Creating account...' : <>Sign Up <FaArrowRight className="ml-2" /></>}
                </button>

                {/* Redirect to Login */}
                <div className="text-center">
                  <p className="text-gray-600">
                    Already have an account? <a href="/login" className="text-teal-600 hover:underline">Sign in</a>
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <LegalAcceptanceModal
          key="terms-modal"
          isOpen={showTermsModal}
          onClose={() => {
            // Don't allow closing - user must accept
            toast.warning('You must accept the Terms and Conditions to proceed.');
          }}
          onAccept={handleAcceptTerms}
          title="Terms and Conditions"
          content={getTermsContent()}
          type="terms"
          isLoading={isAcceptingTerms}
        />
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <LegalAcceptanceModal
          key="privacy-modal"
          isOpen={showPrivacyModal}
          onClose={() => {
            // Don't allow closing - user must accept
            toast.warning('You must accept the Privacy Policy to proceed.');
          }}
          onAccept={handleAcceptPrivacy}
          title="Privacy Policy"
          content={getPrivacyContent()}
          type="privacy"
          isLoading={isAcceptingPrivacy}
        />
      )}
    </div>
  );
};

export default SignupPage;
