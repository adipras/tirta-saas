import { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
}

const plans: SubscriptionPlan[] = [
  {
    id: 'BASIC',
    name: 'Basic',
    price: 500000,
    features: [
      'Up to 100 customers',
      'Basic water usage tracking',
      'Invoice generation',
      'Payment tracking',
      'Email support',
      'Monthly reports',
    ],
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 1500000,
    features: [
      'Up to 500 customers',
      'Advanced water usage analytics',
      'Automated invoice generation',
      'Payment reminders',
      'Priority support',
      'Advanced reporting',
      'Mobile meter reading app',
      'Custom notifications',
    ],
    recommended: true,
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 3000000,
    features: [
      'Unlimited customers',
      'Full water management system',
      'Advanced analytics & BI',
      'Automated workflows',
      'Dedicated support',
      'Custom integrations',
      'Mobile app for all users',
      'White-label branding',
      'SLA guarantee',
    ],
  },
];

const PlanSelectionPage = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string>('PRO');
  const [billingPeriod, setBillingPeriod] = useState<number>(1);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleContinue = () => {
    const plan = plans.find((p) => p.id === selectedPlan);
    if (plan) {
      navigate('/subscription/payment', {
        state: {
          plan: plan.id,
          planName: plan.name,
          basePrice: plan.price,
          billingPeriod,
          totalAmount: plan.price * billingPeriod,
        },
      });
    }
  };

  const calculateTotal = () => {
    const plan = plans.find((p) => p.id === selectedPlan);
    if (!plan) return 0;
    return plan.price * billingPeriod;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upgrade Your Subscription</h1>
        <p className="text-lg text-gray-600">Choose the plan that fits your needs</p>
      </div>

      {/* Billing Period Selector */}
      <div className="max-w-md mx-auto mb-8">
        <label htmlFor="billing-period" className="block text-sm font-medium text-gray-700 mb-2">
          Billing Period
        </label>
        <select
          id="billing-period"
          value={billingPeriod}
          onChange={(e) => setBillingPeriod(Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={1}>1 Month</option>
          <option value={3}>3 Months (Save 5%)</option>
          <option value={6}>6 Months (Save 10%)</option>
          <option value={12}>12 Months (Save 15%)</option>
        </select>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-200 cursor-pointer ${
              selectedPlan === plan.id
                ? 'ring-2 ring-blue-600 transform scale-105'
                : 'hover:shadow-xl'
            }`}
            onClick={() => handleSelectPlan(plan.id)}
          >
            {plan.recommended && (
              <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                RECOMMENDED
              </div>
            )}

            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">
                  {formatCurrency(plan.price)}
                </span>
                <span className="text-gray-600">/month</span>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
                  selectedPlan === plan.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary and Continue */}
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Selected Plan:</span>
            <span className="font-medium text-gray-900">
              {plans.find((p) => p.id === selectedPlan)?.name}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Billing Period:</span>
            <span className="font-medium text-gray-900">
              {billingPeriod} {billingPeriod === 1 ? 'Month' : 'Months'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Price per Month:</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(plans.find((p) => p.id === selectedPlan)?.price || 0)}
            </span>
          </div>
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-base font-semibold text-gray-900">Total Amount:</span>
              <span className="text-xl font-bold text-blue-600">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Continue to Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanSelectionPage;
