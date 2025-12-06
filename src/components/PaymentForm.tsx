import React, { useState } from 'react';
import { toast } from 'react-toastify';

interface PaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  amount: number;
  itemName: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  amount,
  itemName
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    email: '',
    billingAddress: '',
    city: '',
    zipCode: '',
    country: 'United States'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const cleaned = value.replace(/\s/g, '');
      const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
      setFormData(prev => ({ ...prev, [name]: formatted.slice(0, 19) })); // Max 16 digits + 3 spaces
      return;
    }
    
    // Format expiry date
    if (name === 'expiryDate') {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length >= 2) {
        setFormData(prev => ({ ...prev, [name]: `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}` }));
      } else {
        setFormData(prev => ({ ...prev, [name]: cleaned }));
      }
      return;
    }
    
    // Format CVV (numbers only)
    if (name === 'cvv') {
      setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 4) }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 13) {
      toast.error('Please enter a valid card number');
      return;
    }
    if (!formData.cardName) {
      toast.error('Please enter cardholder name');
      return;
    }
    if (!formData.expiryDate || formData.expiryDate.length < 5) {
      toast.error('Please enter expiry date (MM/YY)');
      return;
    }
    if (!formData.cvv || formData.cvv.length < 3) {
      toast.error('Please enter CVV');
      return;
    }
    if (!formData.email) {
      toast.error('Please enter email address');
      return;
    }

    setLoading(true);

    // 🧪 TESTING MODE: For now, just simulate payment success
    // TODO: Integrate with actual payment gateway (Stripe, PayPal, etc.)
    setTimeout(() => {
      setLoading(false);
      toast.success('Payment processed successfully! 🎉');
      onPaymentSuccess();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-blue-500 p-6 text-white sticky top-0 z-10">
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
              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-gray-900">${amount.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Item</p>
              <p className="text-lg font-semibold text-gray-900">{itemName}</p>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Card Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              💳 Card Information
            </h3>
            
            <div className="space-y-4">
              {/* Card Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number *
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  required
                  disabled={loading}
                />
              </div>

              {/* Cardholder Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cardholder Name *
                </label>
                <input
                  type="text"
                  name="cardName"
                  value={formData.cardName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  required
                  disabled={loading}
                />
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date *
                  </label>
                  <input
                    type="text"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV *
                  </label>
                  <input
                    type="text"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Billing Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📍 Billing Information
            </h3>
            
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  required
                  disabled={loading}
                />
              </div>

              {/* Billing Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Billing Address
                </label>
                <input
                  type="text"
                  name="billingAddress"
                  value={formData.billingAddress}
                  onChange={handleInputChange}
                  placeholder="123 Main Street"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>

              {/* City and Zip */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="New York"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="10001"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  required
                  disabled={loading}
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                  <option value="Pakistan">Pakistan</option>
                  <option value="India">India</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-green-900 mb-1">
                  🔒 Secure Payment
                </p>
                <p className="text-xs text-green-800">
                  Your payment information is encrypted and secure. We never store your card details.
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
                  Payment integration is currently in testing mode. Enter any card details to proceed. 
                  Real payment processing will be integrated soon.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing...</span>
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
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;




