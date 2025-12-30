import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckIcon,
  CloudArrowUpIcon,
  CreditCardIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { subscriptionPaymentService } from '../../services/subscriptionPaymentService';
import { platformPaymentSettingsService } from '../../services/platformPaymentSettingsService';
import type { PlatformPaymentSettings } from '../../services/platformPaymentSettingsService';

interface PlanOption {
  id: string;
  name: string;
  monthlyPrice: number;
  features: string[];
  popular?: boolean;
}

const PLANS: PlanOption[] = [
  {
    id: 'BASIC',
    name: 'Basic',
    monthlyPrice: 150000,
    features: [
      'Up to 100 customers',
      'Unlimited invoice generation',
      'Basic reporting',
      'Email support',
      'Mobile meter reading',
    ],
  },
  {
    id: 'PRO',
    name: 'Professional',
    monthlyPrice: 250000,
    popular: true,
    features: [
      'Up to 500 customers',
      'Advanced reporting & analytics',
      'WhatsApp notifications',
      'Priority support',
      'Customer portal',
      'Bulk operations',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    monthlyPrice: 500000,
    features: [
      'Unlimited customers',
      'Custom reporting',
      'API access',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
    ],
  },
];

export default function SubscriptionUpgradePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'select-plan' | 'payment-form'>('select-plan');
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<number>(1);
  const [paymentSettings, setPaymentSettings] = useState<PlatformPaymentSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [formData, setFormData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    accountNumber: '',
    accountName: '',
    referenceNumber: '',
    notes: '',
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch payment settings on mount
  useEffect(() => {
    loadPaymentSettings();
  }, []);

  const loadPaymentSettings = async () => {
    try {
      setLoadingSettings(true);
      const settings = await platformPaymentSettingsService.getPlatformPaymentSettings();
      setPaymentSettings(settings);
    } catch (err) {
      console.error('Failed to load payment settings:', err);
      // Use default if fetch fails
      setPaymentSettings({
        bank_accounts: [
          {
            bank_name: 'BCA',
            account_number: '1234567890',
            account_name: 'PT Tirta SaaS Indonesia',
          },
        ],
        payment_methods: ['bank_transfer', 'e_wallet', 'other'],
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  const handlePlanSelect = (plan: PlanOption) => {
    setSelectedPlan(plan);
    setStep('payment-form');
  };

  const calculateAmount = () => {
    if (!selectedPlan) return 0;
    const total = selectedPlan.monthlyPrice * billingPeriod;
    // Discount for longer periods
    if (billingPeriod === 6) return total * 0.95; // 5% off
    if (billingPeriod === 12) return total * 0.9; // 10% off
    return total;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('File must be JPG, PNG, or PDF');
      return;
    }

    setProofFile(file);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlan || !proofFile) {
      setError('Please select a plan and upload payment proof');
      return;
    }

    if (!formData.accountName.trim()) {
      setError('Account name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await subscriptionPaymentService.submitPayment(
        {
          subscriptionPlan: selectedPlan.id,
          billingPeriod,
          amount: calculateAmount(),
          paymentDate: formData.paymentDate,
          paymentMethod: formData.paymentMethod,
          accountNumber: formData.accountNumber,
          accountName: formData.accountName,
          referenceNumber: formData.referenceNumber,
          notes: formData.notes,
        },
        proofFile
      );

      alert(
        `Payment submitted successfully!\n\nConfirmation ID: ${result.confirmationId}\n\nYour payment is being verified. You will be notified once approved.`
      );
      navigate('/subscription/status');
    } catch (err: any) {
      console.error('Failed to submit payment:', err);
      setError(err.response?.data?.error || 'Failed to submit payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'select-plan') {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Upgrade Your Subscription
          </h1>
          <p className="text-lg text-gray-600">
            Choose the perfect plan for your water management needs
          </p>
        </div>

        {/* Billing Period Selector */}
        <div className="max-w-md mx-auto mb-12">
          <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
            Billing Period (Get discounts for longer periods!)
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { months: 1, label: '1 Month', discount: '' },
              { months: 6, label: '6 Months', discount: 'Save 5%' },
              { months: 12, label: '1 Year', discount: 'Save 10%' },
            ].map((period) => (
              <button
                key={period.months}
                onClick={() => setBillingPeriod(period.months)}
                className={`relative py-3 px-4 rounded-lg border-2 transition-all ${
                  billingPeriod === period.months
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">{period.label}</div>
                {period.discount && (
                  <div className="text-xs text-green-600 font-medium mt-1">{period.discount}</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {PLANS.map((plan) => {
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
                  plan.popular ? 'border-4 border-blue-500 transform scale-105' : 'border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                    MOST POPULAR
                  </div>
                )}
                
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatCurrency(plan.monthlyPrice * billingPeriod)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatCurrency(plan.monthlyPrice)}/month
                    </p>
                    {billingPeriod > 1 && (
                      <p className="text-xs text-green-600 font-medium mt-1">
                        Billed {billingPeriod === 6 ? 'semi-annually' : 'annually'}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePlanSelect(plan)}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                      plan.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    Select {plan.name}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center text-sm text-gray-600">
          <p>💡 All plans include 24/7 email support and regular updates</p>
          <p className="mt-2">Need help choosing? Contact us at support@tirtasaas.com</p>
        </div>
      </div>
    );
  }

  // Payment Form
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6">
        <button
          onClick={() => setStep('select-plan')}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          ← Change Plan
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Complete Your Subscription</h2>
          <p className="text-blue-100">Submit your payment proof to activate your subscription</p>
        </div>

        {/* Selected Plan Summary */}
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Selected Plan</p>
              <p className="text-lg font-bold text-gray-900">{selectedPlan?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(calculateAmount())}</p>
              <p className="text-xs text-gray-600">{billingPeriod} {billingPeriod === 1 ? 'month' : 'months'}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Payment Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">📋 Payment Instructions</h3>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Transfer the exact amount to our bank account</li>
              <li>Take a screenshot or photo of the transfer receipt</li>
              <li>Fill in the payment details below</li>
              <li>Upload your payment proof</li>
              <li>Submit and wait for verification (usually within 24 hours)</li>
            </ol>
          </div>

          {/* Bank Account Info - Dynamic */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">🏦 Bank Account Details</h3>
            {loadingSettings ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading payment info...</p>
              </div>
            ) : paymentSettings && paymentSettings.bank_accounts.length > 0 ? (
              <div className="space-y-4">
                {paymentSettings.bank_accounts.map((bank, index) => (
                  <div key={index} className={`${index > 0 ? 'pt-4 border-t border-gray-300' : ''}`}>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bank Name:</span>
                        <span className="font-medium">{bank.bank_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account Number:</span>
                        <span className="font-medium">{bank.account_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account Name:</span>
                        <span className="font-medium">{bank.account_name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">Payment information not available</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method *
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="e_wallet">E-Wallet (GoPay, OVO, DANA)</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Name (Sender) *
            </label>
            <input
              type="text"
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              placeholder="Name on your account"
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number (Optional)
            </label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              placeholder="Your account/phone number"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference Number (Optional)
            </label>
            <input
              type="text"
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              placeholder="Transaction reference number"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Any additional information..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Proof * (Max 5MB - JPG, PNG, PDF)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                {proofFile ? (
                  <div>
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-green-500" />
                    <p className="text-sm text-gray-900 font-medium">{proofFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(proofFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={() => setProofFile(null)}
                      className="mt-2 text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,application/pdf"
                          onChange={handleFileChange}
                          required
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF up to 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setStep('select-plan')}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !proofFile}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CreditCardIcon className="h-5 w-5 mr-2" />
                  Submit Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
