                                        import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaArrowRight, FaMagic, FaUser, FaTimes, FaInfoCircle } from 'react-icons/fa';
import { signUp, signIn, acceptTerms, acceptPrivacy } from '../../services/authService';
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

// Beta Tester Email List - Only these emails can sign up
const BETA_TESTER_EMAILS = [
  'muhammadkonain98@gmail.com',
  'liz.mitros@gmail.com',
  'khadijashah15@gmail.com',
  's_hamza_h@hotmail.com',
  'nzehranaz@gmail.com',
  'sgc.143@gmail.com',
  'yasirshasan@gmail.com',
  'kevin@founderport.ai',
  'm.minhal.kanani@gmail.com',
  'ryansummersmail@gmail.com',
  'tharper1124@gmail.com',
  'ayocum02@yahoo.com',
  'thomas.corey33@gmail.com',
  'mappelman@kpmg.com',
  'michelle.igoshi.harner@gmail.com',
  'adam.harner@gmail.com',
  'aaron_zelt@hotmail.com',
  'walid@vikk.ai',
  'kylemwalk@gmail.com',
  'nam.isaac@gmail.com',
  'arcane.psr22@gmail.com',
  'sarastuart@ucla.edu',
  'ryan@hyperdrivelab.com',
  'mrsnicoleramos@gmail.com',
  'josh@thepromethean.ai',
  'phanley09@gmail.com',
  'lindsaykray@gmail.com',
  'akvinikadze1@gmail.com',
  'calderoni23619@gmail.com',
  'taniadelatorre1@gmail.com',
  'kristinbraden@hotmail.com',
  'juancvieyra@icloud.com',
  'gutierrez6dany@gmail.com',
  'kweybright3910@icloud.com',
  'ufa.asu@gmail.com',
  'williamrigby@pm.me',
  'nora.romaya@gmail.com',
  's.farwa.f@gmail.com',
  'nafisa.jassani@gmail.com',
  'ahmedrazagithub@gmail.com',
  'rawsonleavitt@gmail.com',
  'cifotis172@dubokutv.com',
  'niraseg404@dubokutv.com',
  'mkarpen@msn.com',
  'minhal.webcloners@gmail.com',
  'muhammadkonain8@gmail.com',
  'goyis36860@m3player.com',
  'hayil40085@gamintor.com',
  'minhal2206a@aptechgdn.net',
  'lixib88356@m3player.com',
  'kgmoore0488@yahoo.com',
  'yasir@buildnext.org',
  'kgmoore048@gmail.com'
].map(email => email.toLowerCase()); // Normalize to lowercase for case-insensitive comparison

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
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isAcceptingTerms, setIsAcceptingTerms] = useState(false);
  const [isAcceptingPrivacy, setIsAcceptingPrivacy] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  console.log('Focused Field 1:', focusedField);

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

    // Check if email is in beta tester list
    const emailLower = formData.email.toLowerCase().trim();
    if (!BETA_TESTER_EMAILS.includes(emailLower)) {
      setShowBetaModal(true);
      return;
    }

    setIsLoading(true);

    try {
      await signUp({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      setEmailPendingVerification(formData.email);

      // Sign user in so they can accept Terms/Privacy
      try {
        const session = await signIn({
          email: formData.email,
          password: formData.password,
        });
        
        // Store session tokens
        if (session.access_token) {
          localStorage.setItem('sb_access_token', session.access_token);
        }
        if (session.refresh_token) {
          localStorage.setItem('sb_refresh_token', session.refresh_token);
        }
        
        // Store email/password temporarily for modals
        setUserEmail(formData.email);
        setUserPassword(formData.password);
        
        // Show Terms modal first
        setShowTermsModal(true);
        toast.success('Account created successfully! Please accept the Terms and Conditions.');
      } catch (signInError: any) {
        console.error('Sign in after signup failed:', signInError);
        // If sign in fails, still show modals - user might need to sign in manually
        setUserEmail(formData.email);
        setUserPassword(formData.password);
        setShowTermsModal(true);
        toast.warning('Account created. Please sign in to continue.');
      }
    } catch (err: unknown) {
      console.error('Signup error:', err);
      // Extract error message from Error object (thrown by authService)
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Signup failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
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
          navigate('/verify-email', {
            state: { email: userEmail }, 
          });
        } else {
          // Show Privacy modal
          console.log('Showing Privacy Policy modal after Terms acceptance');
          setShowPrivacyModal(true);
          toast.success('Terms and Conditions accepted! Please accept the Privacy Policy.');
        }
      }, 300);
    } catch (err: any) {
      console.error('Error accepting Terms:', err);
      setIsAcceptingTerms(false);
      toast.error(err?.message || 'Failed to accept Terms and Conditions');
      throw err;
    }
  };

  const handleAcceptPrivacy = async (name: string, date: string) => {
    setIsAcceptingPrivacy(true);
    try {
      const result = await acceptPrivacy(name, date);
      setShowPrivacyModal(false);
      
      if (result.both_accepted) {
        toast.success('Terms and Privacy Policy accepted! Confirmation email will be sent.');
        // Redirect to verify email page
        navigate('/verify-email', {
          state: { email: userEmail }, 
        });
      } else {
        // This shouldn't happen, but handle it
        toast.warning('Privacy Policy accepted, but Terms acceptance is missing.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to accept Privacy Policy');
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
                      onFocus={() => setFocusedField('fullName')}
                      onBlur={() => setFocusedField(null)}
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
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
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
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
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
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
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

      {/* Beta Access Modal */}
      {showBetaModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          style={{ animation: 'fadeIn 0.3s ease-out' }}
        >
          <div 
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            style={{ animation: 'slideUp 0.4s ease-out' }}
          >
            {/* Gradient Header */}
            <div className="relative bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-600 p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 via-blue-400/20 to-indigo-400/20"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <FaInfoCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Beta Access Only</h2>
                    <p className="text-teal-100 text-sm mt-1">Limited Access Program</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBetaModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <FaTimes className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl flex-shrink-0">
                  <FaInfoCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    We're Currently in Beta
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    We are currently in beta version and only available for testing participants. 
                    If you believe you should have access, please contact our support team.
                  </p>
                </div>
              </div>

              {/* Features List */}
              <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-4 border border-teal-100">
                <p className="text-sm font-semibold text-gray-700 mb-2">What's Next?</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500 mt-0.5">•</span>
                    <span>Contact support if you're a beta tester</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowBetaModal(false)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
                >
                  Got It
                </button>
                <button
                  onClick={() => {
                    setShowBetaModal(false);
                    window.location.href = 'mailto:support@founderport.ai?subject=Beta Access Request';
                  }}
                  className="px-4 py-3 bg-white border-2 border-teal-500 text-teal-600 font-semibold rounded-lg hover:bg-teal-50 transition-all"
                >
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Modal Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default SignupPage;
