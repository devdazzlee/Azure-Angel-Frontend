import React, { useState } from 'react';
import { toast } from 'react-toastify';
import httpClient from '../api/httpClient';

interface PaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  amount: number;
  itemName: string;
}

interface StripeCheckoutResponse {
  success: boolean;
  checkout_url?: string;
  message?: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  amount,
  itemName
}) => {
  const [loading, setLoading] = useState(false);

  const handleStripeCheckout = async () => {
    setLoading(true);
    
    try {
      // Get current URL for success/cancel redirects
      const currentUrl = window.location.origin + window.location.pathname;
      const successUrl = `${currentUrl}?payment=success`;
      const cancelUrl = `${currentUrl}?payment=canceled`;
      
      // Call backend to create Stripe Checkout session
      const response = await httpClient.post<StripeCheckoutResponse>('/stripe/create-subscription', {
        success_url: successUrl,
        cancel_url: cancelUrl,
        amount: Math.round(amount * 100), // Convert to cents
        product_name: itemName
      });
      
      if (response.data.success && response.data.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.checkout_url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Stripe checkout error:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to start payment process';
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  // Check for payment success/cancel in URL params
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      toast.success('Payment successful! 🎉');
      onPaymentSuccess();
      onClose();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (paymentStatus === 'canceled') {
      toast.info('Payment canceled');
      onClose();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [onPaymentSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-blue-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">💳 Secure Payment</h2>
              <p className="text-sm opacity-90">Complete your purchase to access {itemName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Monthly Subscription</p>
              <p className="text-3xl font-bold text-gray-900">${amount.toFixed(2)}<span className="text-lg font-normal text-gray-600">/month</span></p>
              <p className="text-xs text-gray-500 mt-1">Cancel anytime</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Subscription</p>
              <p className="text-lg font-semibold text-gray-900">{itemName}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Secure Stripe Checkout
                </p>
                <p className="text-xs text-blue-800">
                  You'll be redirected to Stripe's secure payment page to complete your subscription. 
                  Your card details are never stored on our servers.
                </p>
              </div>
            </div>
          </div>

          {/* Testing Mode Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-900 mb-1">
                  🧪 Testing Mode
                </p>
                <p className="text-xs text-yellow-800">
                  Use test card: <strong>4242 4242 4242 4242</strong> with any future expiry date, CVC, and ZIP code.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStripeCheckout}
              disabled={loading}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Redirecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Pay ${amount.toFixed(2)}</span>
                </>
              )}
            </button>
          </div>

          {/* Accepted Cards */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">We accept</p>
            <div className="flex items-center justify-center gap-3">
              <div className="px-3 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-700">VISA</div>
              <div className="px-3 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-700">Mastercard</div>
              <div className="px-3 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-700">AMEX</div>
              <div className="px-3 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-700">Discover</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;
