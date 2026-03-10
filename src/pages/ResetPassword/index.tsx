import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaLock, FaArrowRight, FaMagic, FaCheckCircle } from 'react-icons/fa';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { updatePassword } from '../../services/authService';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({ pass: false, confirm: false });
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string>('');

  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Use Supabase client to automatically handle auth redirects and token exchange
    // This is the standard way Supabase handles password reset links
    const handleTokenExtraction = async () => {
      const hash = window.location.hash;
      const urlParams = new URLSearchParams(window.location.search);
      
      console.log('ResetPassword: Current URL:', window.location.href);
      console.log('ResetPassword: Hash:', hash);
      console.log('ResetPassword: Query params:', Object.fromEntries(urlParams.entries()));
      
      // Check for errors in hash first (Supabase error redirects)
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1));
        
        // Check for error cases
        const error = hashParams.get('error');
        const errorCode = hashParams.get('error_code');
        const errorDescription = hashParams.get('error_description');
        
        if (error || errorCode) {
          // Handle error cases
          let errorMsg = 'Invalid or expired reset link.';
          
          if (errorCode === 'otp_expired' || errorCode === 'token_expired') {
            errorMsg = 'This password reset link has expired. Password reset links are valid for 1 hour. Please request a new one.';
          } else if (errorCode === 'invalid_token') {
            errorMsg = 'This password reset link is invalid. It may have already been used. Please request a new one.';
          } else if (errorDescription) {
            errorMsg = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
          } else if (error) {
            errorMsg = `Error: ${error}`;
          }
          
          setErrorMessage(errorMsg);
          toast.error(errorMsg);
          
          // Clean up URL hash
          window.history.replaceState(null, '', window.location.pathname);
          
          // Redirect after showing error
          setTimeout(() => navigate('/forgot-password'), 4000);
          return;
        }
      }
      
      // Try multiple methods to extract the token
      let extractedToken: string | null = null;
      
      // Method 1: Check URL hash for access_token (Supabase redirect format)
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        
        if (accessToken && type === 'recovery') {
          console.log('ResetPassword: Found access_token in hash');
          extractedToken = accessToken;
        }
      }
      
      // Method 2: Check query params (direct Supabase verify links)
      if (!extractedToken) {
        const tokenFromQuery = urlParams.get('token') || urlParams.get('access_token');
        const typeFromQuery = urlParams.get('type');
        
        if (tokenFromQuery && typeFromQuery === 'recovery') {
          console.log('ResetPassword: Found token in query params');
          extractedToken = tokenFromQuery;
        }
      }
      
      // Method 3: Use Supabase's getSession() to get token from session
      if (!extractedToken) {
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('ResetPassword: Session error:', sessionError);
          }
          
          if (session?.access_token) {
            // Verify this is a recovery session by checking URL
            const hash = window.location.hash;
            if (hash) {
              const hashParams = new URLSearchParams(hash.substring(1));
              const type = hashParams.get('type');
              
              if (type === 'recovery') {
                console.log('ResetPassword: Found recovery session from getSession()');
                extractedToken = session.access_token;
              }
            } else {
              // If no hash but we have a session, it might still be recovery
              // Check if we're on reset-password page (user likely came from email)
              if (window.location.pathname === '/reset-password') {
                console.log('ResetPassword: Using session token (assuming recovery from email link)');
                extractedToken = session.access_token;
              }
            }
          }
        } catch (err) {
          console.error('ResetPassword: Error getting session:', err);
        }
      }
      
      // Set token if found
      if (extractedToken) {
        console.log('ResetPassword: Token extracted successfully, length:', extractedToken.length);
        setToken(extractedToken);
        // Clean up URL after extracting token
        if (hash || urlParams.toString()) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        return;
      }
      
      // If no token found and no error, show error
      console.log('ResetPassword: No token found in hash, query params, or session');
      console.log('ResetPassword: Hash:', hash);
      console.log('ResetPassword: Query params:', Object.fromEntries(urlParams.entries()));
      const errorMsg = 'Invalid or missing reset token. Please request a new password reset link.';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
      setTimeout(() => navigate('/forgot-password'), 2000);
    };
    
    handleTokenExtraction();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!token) {
      toast.error('Invalid reset token. Please request a new password reset link.');
      navigate('/forgot-password');
      return;
    }

    setIsLoading(true);

    try {
      await updatePassword({
        token: token,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      toast.success('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Update password error:', err);
      toast.error(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
                <p className="text-gray-700">Enter your new password</p>
              </div>
            </div>

            {/* Error Message Display */}
            {errorMessage && (
              <div className="px-8 pt-2">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 text-sm">{errorMessage}</p>
                  <p className="text-red-600 text-xs mt-2">Redirecting to forgot password page...</p>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <form className="p-8 pt-2" onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">New Password</label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-3 text-gray-400" />
                    <input
                      name="password"
                      type={showPassword.pass ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter new password"
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
                  <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-3 text-gray-400" />
                    <input
                      name="confirmPassword"
                      type={showPassword.confirm ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm new password"
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
                  disabled={isLoading || !token}
                  className="w-full flex items-center justify-center py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Updating...' : <>Update Password <FaArrowRight className="ml-2" /></>}
                </button>
                
                {/* Debug info - show why button is disabled */}
                {!token && !errorMessage && (
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    Waiting for reset token... Check browser console for details.
                  </div>
                )}

                {/* Back to Login */}
                <div className="text-center">
                  <Link 
                    to="/login" 
                    className="text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

