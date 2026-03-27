import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchSessions } from '../../services/authService';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [venturesCount, setVenturesCount] = useState<number>(0);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [togglingAutoRenewal, setTogglingAutoRenewal] = useState(false);
  const [subscriptionHistory, setSubscriptionHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  // Load user profile and subscription details
  const loadProfileData = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const token = localStorage.getItem('sb_access_token');
      if (!token) {
        toast.error('Please sign in to view your profile');
        navigate('/login');
        return;
      }

      // Fetch subscription status
      // TODO: ON AUGUST UNCOMMENT THIS - Free intro period until August
      /* 
      const subscriptionResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/stripe/check-subscription-status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const subscriptionData = await subscriptionResponse.json();
      */
      const subscriptionData: any = {
        success: true,
        has_active_subscription: true,
        user_email: '',
        subscription: {
          subscription_status: 'active',
          amount: 0,
          currency: 'USD'
        }
      };
      setSubscriptionDetails(subscriptionData);

      // Fetch ventures count
      try {
        const sessions = await fetchSessions();
        const sessionsArray = Array.isArray(sessions) ? sessions : [sessions];
        setVenturesCount(sessionsArray.length);
      } catch (error) {
        console.error('Failed to fetch ventures:', error);
        setVenturesCount(0);
      }

      // Get user info from token or localStorage
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const email = payload.email || payload.user?.email || 'N/A';
          const name = payload.name || payload.user?.name || payload.full_name || payload.user?.full_name || email?.split('@')[0] || 'User';
          
          setUserProfile({
            email: email,
            id: payload.sub || payload.user_id || payload.user?.id || 'N/A',
            name: name,
            fullName: payload.full_name || payload.user?.full_name || name,
            firstName: name.split(' ')[0] || name,
            lastName: name.split(' ').slice(1).join(' ') || '',
            createdAt: payload.created_at || payload.iat ? new Date((payload.iat || payload.created_at) * 1000).toLocaleDateString() : 'N/A',
          });
        } else {
          const sessionStr = localStorage.getItem('sb_session');
          if (sessionStr) {
            const session = JSON.parse(sessionStr);
            const email = session.user?.email || 'N/A';
            const name = session.user?.name || session.user?.full_name || email?.split('@')[0] || 'User';
            
            setUserProfile({
              email: email,
              id: session.user?.id || 'N/A',
              name: name,
              fullName: session.user?.full_name || name,
              firstName: name.split(' ')[0] || name,
              lastName: name.split(' ').slice(1).join(' ') || '',
              createdAt: session.user?.created_at || 'N/A',
            });
          } else {
            setUserProfile({
              email: 'N/A',
              id: 'N/A',
              name: 'User',
              fullName: 'User',
              firstName: 'User',
              lastName: '',
              createdAt: 'N/A',
            });
          }
        }
      } catch (decodeError) {
        console.error('Failed to decode token:', decodeError);
        const email = subscriptionData.user_email || 'N/A';
        setUserProfile({
          email: email,
          id: 'N/A',
          name: email.split('@')[0] || 'User',
          fullName: email.split('@')[0] || 'User',
          firstName: email.split('@')[0] || 'User',
          lastName: '',
          createdAt: 'N/A',
        });
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
      toast.error('Failed to load profile information');
    } finally {
      setLoadingProfile(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Cancel subscription
  const handleCancelSubscription = async () => {
    setShowCancelModal(false);
    setCancellingSubscription(true);
    try {
      const token = localStorage.getItem('sb_access_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/stripe/cancel-subscription`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Subscription will be canceled at the end of your billing period');
        await loadProfileData();
      } else {
        toast.error(data.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setCancellingSubscription(false);
    }
  };

  // Toggle auto-renewal
  const handleToggleAutoRenewal = async (enable: boolean) => {
    setTogglingAutoRenewal(true);
    try {
      const token = localStorage.getItem('sb_access_token');
      const url = new URL(`${import.meta.env.VITE_API_BASE_URL}/stripe/toggle-auto-renewal`);
      url.searchParams.append('enable', enable.toString());
      
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message || `Auto-renewal ${enable ? 'enabled' : 'disabled'}`);
        await loadProfileData();
      } else {
        toast.error(data.message || 'Failed to update auto-renewal setting');
      }
    } catch (error) {
      console.error('Failed to toggle auto-renewal:', error);
      toast.error('Failed to update auto-renewal setting');
    } finally {
      setTogglingAutoRenewal(false);
    }
  };

  // Load subscription history
  const loadSubscriptionHistory = async () => {
    setLoadingHistory(true);
    try {
      // Always fetch fresh data when opening modal
      const token = localStorage.getItem('sb_access_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/stripe/subscription-history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setSubscriptionHistory(data.history || []);
        setShowHistoryModal(true);
      } else {
        toast.error(data.message || 'Failed to load subscription history');
      }
    } catch (error) {
      console.error('Failed to load subscription history:', error);
      toast.error('Failed to load subscription history');
    } finally {
      setLoadingHistory(false);
    }
  };


  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-gray-600 mt-2">Manage your account and subscription</p>
        </div>

        <div className="space-y-6">
          {/* User Information */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <span className="mr-3">👤</span>
              Account Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Full Name:</span>
                <span className="text-gray-900 font-semibold">{userProfile?.fullName || userProfile?.name || 'N/A'}</span>
              </div>
              {userProfile?.firstName && userProfile?.lastName && (
                <>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">First Name:</span>
                    <span className="text-gray-900 font-semibold">{userProfile.firstName}</span>
                  </div>
                  {userProfile.lastName && (
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Last Name:</span>
                      <span className="text-gray-900 font-semibold">{userProfile.lastName}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Email:</span>
                <span className="text-gray-900 font-semibold">{userProfile?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Number of Ventures:</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-900 font-semibold flex items-center gap-2">
                    <span className="w-10 h-10 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full text-white font-bold text-lg shadow-md flex items-center justify-center">
                      {venturesCount}
                    </span>
                    <span className="text-sm text-gray-500">venture{venturesCount !== 1 ? 's' : ''}</span>
                  </span>
                  {venturesCount > 0 && (
                    <button
                      onClick={() => navigate('/ventures')}
                      className="text-teal-600 hover:text-teal-700 font-medium text-sm flex items-center gap-1 transition-colors"
                    >
                      View All
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {userProfile?.createdAt && userProfile.createdAt !== 'N/A' && (
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Account Created:</span>
                  <span className="text-gray-900">{userProfile.createdAt}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600 font-medium">User ID:</span>
                <span className="text-sm font-mono text-gray-700">{userProfile?.id || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Subscription Summary Card */}
          {subscriptionDetails?.has_active_subscription && subscriptionDetails?.subscription && (
            <div className="bg-gradient-to-r from-teal-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-white/90 mb-1">Current Plan</h3>
                  <p className="text-3xl font-bold">
                    ${subscriptionDetails.subscription.amount || 0}
                    <span className="text-lg font-normal text-white/80 ml-1">/month</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/80 mb-1">Status</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    subscriptionDetails.subscription.cancel_at_period_end || subscriptionDetails.cancel_at_period_end
                      ? 'bg-orange-500 text-white'
                      : subscriptionDetails.subscription.subscription_status?.toLowerCase() === 'active' || subscriptionDetails.subscription.subscription_status?.toLowerCase() === 'trialing'
                      ? 'bg-green-500 text-white'
                      : subscriptionDetails.subscription.subscription_status?.toLowerCase() === 'past_due' || subscriptionDetails.subscription.subscription_status?.toLowerCase() === 'unpaid'
                      ? 'bg-red-500 text-white'
                      : 'bg-yellow-500 text-white'
                  }`}>
                    {subscriptionDetails.subscription.cancel_at_period_end || subscriptionDetails.cancel_at_period_end
                      ? 'CANCELING'
                      : subscriptionDetails.subscription.subscription_status?.toUpperCase() || 'ACTIVE'}
                  </span>
                </div>
              </div>
              {subscriptionDetails.subscription.current_period_end && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/80">Next billing date</span>
                    <span className="font-semibold">
                      {new Date(subscriptionDetails.subscription.current_period_end).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subscription Details */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <span className="mr-3">💳</span>
              Subscription Details
            </h2>
            {subscriptionDetails?.has_active_subscription || subscriptionDetails?.subscription ? (
              <div className="space-y-4">
                {/* Payment Failure Warning */}
                {subscriptionDetails?.payment_failed && (
                  <div className="mb-6 p-5 bg-red-50 border-2 border-red-300 rounded-xl">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-red-900 mb-2">Payment Failed</h3>
                        <p className="text-red-800 mb-3">
                          We were unable to charge your payment method. Your premium features have been temporarily disabled until payment is resolved.
                        </p>
                        <p className="text-sm text-red-700 mb-4">
                          Please update your payment method to restore access to premium features.
                        </p>
                        <button
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('sb_access_token');
                              const response = await fetch(
                                `${import.meta.env.VITE_API_BASE_URL}/stripe/create-portal-session`,
                                {
                                  method: 'POST',
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                  },
                                }
                              );
                              const data = await response.json();
                              if (data.success && data.url) {
                                window.location.href = data.url;
                              } else {
                                toast.error('Failed to open payment portal');
                              }
                            } catch (error) {
                              console.error('Failed to create portal session:', error);
                              toast.error('Failed to open payment portal');
                            }
                          }}
                          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          Update Payment Method
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Status:</span>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      subscriptionDetails.subscription?.cancel_at_period_end || subscriptionDetails.cancel_at_period_end
                        ? 'bg-orange-100 text-orange-800'
                        : subscriptionDetails.subscription?.subscription_status?.toLowerCase() === 'active' || subscriptionDetails.subscription?.subscription_status?.toLowerCase() === 'trialing'
                        ? 'bg-green-100 text-green-800'
                        : subscriptionDetails.subscription?.subscription_status?.toLowerCase() === 'past_due' || subscriptionDetails.subscription?.subscription_status?.toLowerCase() === 'unpaid'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {subscriptionDetails.subscription?.cancel_at_period_end || subscriptionDetails.cancel_at_period_end
                        ? 'CANCELING'
                        : subscriptionDetails.subscription?.subscription_status?.toUpperCase() || 'ACTIVE'}
                    </span>
                    {subscriptionDetails.subscription?.cancel_at_period_end || subscriptionDetails.cancel_at_period_end ? (
                      <span className="text-xs text-orange-600">Will cancel at period end</span>
                    ) : null}
                  </div>
                </div>
                {subscriptionDetails.subscription && (
                  <>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Billing Cycle:</span>
                      <span className="text-gray-900 font-semibold">Monthly</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Amount:</span>
                      <span className="text-gray-900 font-semibold">
                        ${subscriptionDetails.subscription.amount || 0} {subscriptionDetails.subscription.currency?.toUpperCase() || 'USD'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Subscription Started:</span>
                      <span className="text-gray-900">
                        {subscriptionDetails.subscription.created_at 
                          ? new Date(subscriptionDetails.subscription.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Current Period Start:</span>
                      <span className="text-gray-900">
                        {subscriptionDetails.subscription.current_period_start 
                          ? new Date(subscriptionDetails.subscription.current_period_start).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Current Period End:</span>
                      <span className="text-gray-900 font-semibold">
                        {subscriptionDetails.subscription.current_period_end 
                          ? new Date(subscriptionDetails.subscription.current_period_end).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Next Billing Date:</span>
                      <span className="text-gray-900 font-semibold text-teal-600">
                        {subscriptionDetails.subscription.current_period_end 
                          ? new Date(subscriptionDetails.subscription.current_period_end).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'N/A'}
                      </span>
                    </div>
                    {subscriptionHistory.length > 0 && (
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Total Payments:</span>
                        <span className="text-gray-900 font-semibold">
                          {subscriptionHistory.filter(inv => inv.paid).length} successful payment{subscriptionHistory.filter(inv => inv.paid).length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex flex-col">
                        <span className="text-gray-600 font-medium">Auto-Renewal:</span>
                        <span className="text-sm text-gray-500 mt-1">
                          {subscriptionDetails.subscription.cancel_at_period_end 
                            ? 'Disabled - Subscription will end at period end' 
                            : 'Enabled - Subscription will automatically renew'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {togglingAutoRenewal && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                        )}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!subscriptionDetails.subscription.cancel_at_period_end}
                            onChange={(e) => handleToggleAutoRenewal(e.target.checked)}
                            disabled={togglingAutoRenewal}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                        </label>
                      </div>
                    </div>
                  </>
                )}
                {!subscriptionDetails.subscription?.cancel_at_period_end && (
                  <div className="pt-6 border-t border-gray-200 mt-6">
                    <button
                      onClick={() => setShowCancelModal(true)}
                      disabled={cancellingSubscription}
                      className="w-full px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Cancel Subscription</span>
                    </button>
                    <p className="text-sm text-gray-500 mt-3 text-center">
                      Your subscription will remain active until the end of your current billing period
                    </p>
                  </div>
                )}
                {subscriptionDetails.subscription?.cancel_at_period_end && (
                  <div className="pt-6 border-t border-gray-200 mt-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <p className="text-sm text-yellow-800 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Your subscription is scheduled to cancel at the end of your current billing period.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-2 font-medium">No active subscription found</p>
                <p className="text-sm text-gray-500">Subscribe to access premium features and download your documents</p>
              </div>
            )}
            
            {/* Premium Access Warning for Payment Failures */}
            {subscriptionDetails?.payment_failed && (
              <div className="mt-6 p-5 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-semibold text-yellow-900 mb-1">Premium Features Temporarily Disabled</h4>
                    <p className="text-sm text-yellow-800">
                      Due to a failed payment, premium features including document downloads are currently unavailable. 
                      Please update your payment method to restore access.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {subscriptionDetails?.has_active_subscription && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <span className="mr-3">⚡</span>
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={loadSubscriptionHistory}
                  disabled={loadingHistory}
                  className="p-4 bg-gradient-to-r from-teal-50 to-blue-50 hover:from-teal-100 hover:to-blue-100 rounded-xl border border-teal-200 transition-all flex items-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center group-hover:bg-teal-600 transition-colors">
                    {loadingHistory ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-gray-900">
                      {loadingHistory ? 'Loading...' : 'Payment History'}
                    </div>
                    <div className="text-sm text-gray-600">View invoices and receipts</div>
                  </div>
                </button>
                <button
                  onClick={async () => {
                    setLoadingPortal(true);
                    try {
                      const token = localStorage.getItem('sb_access_token');
                      const response = await fetch(
                        `${import.meta.env.VITE_API_BASE_URL}/stripe/create-portal-session`,
                        {
                          method: 'POST',
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        }
                      );
                      const data = await response.json();
                      if (data.success && data.url) {
                        window.location.href = data.url;
                      } else {
                        toast.error('Failed to open payment portal');
                        setLoadingPortal(false);
                      }
                    } catch (error) {
                      console.error('Failed to create portal session:', error);
                      toast.error('Failed to open payment portal');
                      setLoadingPortal(false);
                    }
                  }}
                  disabled={loadingPortal}
                  className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl border border-blue-200 transition-all flex items-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    {loadingPortal ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    )}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-gray-900">
                      {loadingPortal ? 'Loading...' : 'Manage Billing'}
                    </div>
                    <div className="text-sm text-gray-600">Update payment method</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Subscription Statistics */}
          {subscriptionDetails?.has_active_subscription && subscriptionHistory.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <svg className="w-7 h-7 mr-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Subscription Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl">
                  <div className="text-3xl font-bold text-teal-600 mb-1">
                    {subscriptionHistory.filter(inv => inv.paid).length}
                  </div>
                  <div className="text-sm text-gray-600">Successful Payments</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    ${subscriptionHistory.filter(inv => inv.paid).reduce((sum, inv) => sum + (inv.amount || 0), 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Total Paid</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl">
                  <div className="text-3xl font-bold text-indigo-600 mb-1">
                    {subscriptionDetails.subscription?.created_at 
                      ? Math.floor((new Date().getTime() - new Date(subscriptionDetails.subscription.created_at).getTime()) / (1000 * 60 * 60 * 24))
                      : 0}
                  </div>
                  <div className="text-sm text-gray-600">Days as Member</div>
                </div>
              </div>
            </div>
          )}

          {/* Account Benefits */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-6 border border-blue-100">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <span className="mr-3">ℹ️</span>
              Account Benefits
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-teal-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Access to all premium features</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-teal-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Download business plans and roadmaps</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-teal-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Priority support</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-teal-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Regular updates and new features</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Payment History</h3>
                <p className="text-sm text-gray-500 mt-1">View all your invoices and payment receipts</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                </div>
              ) : subscriptionHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">No payment history found</p>
                  <p className="text-sm text-gray-500 mt-2">Your payment history will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {subscriptionHistory.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xl font-bold text-gray-900">
                            ${invoice.amount} {invoice.currency}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              invoice.paid
                                ? 'bg-green-100 text-green-800'
                                : invoice.status === 'open'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {invoice.status?.toUpperCase() || (invoice.paid ? 'PAID' : 'PENDING')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {invoice.date
                            ? new Date(invoice.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'N/A'}
                        </div>
                        {invoice.period_start && invoice.period_end && (
                          <div className="text-xs text-gray-500 mt-1">
                            Billing Period: {new Date(invoice.period_start).toLocaleDateString()} - {new Date(invoice.period_end).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      {invoice.hosted_invoice_url && (
                        <a
                          href={invoice.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 px-5 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Invoice
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Cancel Subscription?</h3>
                  <p className="text-sm text-gray-500 mt-1">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to cancel your subscription? Your subscription will remain active until the end of your current billing period, and you'll continue to have access to all premium features until then.
              </p>
              {subscriptionDetails?.subscription?.current_period_end && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Access until:</span>{' '}
                    {new Date(subscriptionDetails.subscription.current_period_end).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancellingSubscription}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {cancellingSubscription ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Yes, Cancel</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

