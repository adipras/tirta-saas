import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCircleIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, CreditCardIcon, KeyIcon } from '@heroicons/react/24/outline';
import { customerProfileService } from '../../services/customerProfileService';
import type { CustomerProfile as CustomerProfileType } from '../../types/customerProfile';

export default function CustomerProfile() {
  const [profile, setProfile] = useState<CustomerProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await customerProfileService.getProfile();
      setProfile(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
    };
    return badges[status as keyof typeof badges] || badges.inactive;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-600">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your personal information and account settings</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/customer/profile/change-password"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <KeyIcon className="h-5 w-5 mr-2" />
            Change Password
          </Link>
          <Link
            to="/customer/profile/edit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Status Alert */}
      {profile.outstandingBalance > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You have an outstanding balance of <strong>{formatCurrency(profile.outstandingBalance)}</strong>. 
                Please make a payment to avoid service interruption.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-start">
              <UserCircleIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="text-base text-gray-900">{profile.name}</p>
              </div>
            </div>

            <div className="flex items-start">
              <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Email Address</p>
                <p className="text-base text-gray-900">{profile.email}</p>
              </div>
            </div>

            <div className="flex items-start">
              <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Phone Number</p>
                <p className="text-base text-gray-900">{profile.phone}</p>
              </div>
            </div>

            <div className="flex items-start">
              <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="text-base text-gray-900">{profile.address}</p>
                <p className="text-sm text-gray-600">{profile.city}, {profile.postalCode}</p>
              </div>
            </div>

            <div className="flex items-start">
              <CreditCardIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Customer ID</p>
                <p className="text-base text-gray-900 font-mono">{profile.customerId}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Information */}
        <div className="space-y-6">
          {/* Account Status */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Account Status</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(profile.status)}`}>
                  {profile.status.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Registration Date</p>
                <p className="text-base text-gray-900">{formatDate(profile.registrationDate)}</p>
              </div>
              {profile.lastPaymentDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Payment</p>
                  <p className="text-base text-gray-900">{formatDate(profile.lastPaymentDate)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Subscription Details */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Subscription Type</p>
                <p className="text-base text-gray-900 font-medium">{profile.subscriptionType.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Monthly Fee</p>
                <p className="text-base text-gray-900">{formatCurrency(profile.subscriptionType.monthlyFee)}</p>
              </div>
              {profile.meterNumber && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Meter Number</p>
                  <p className="text-base text-gray-900 font-mono">{profile.meterNumber}</p>
                </div>
              )}
              {profile.meterLocation && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Meter Location</p>
                  <p className="text-base text-gray-900">{profile.meterLocation}</p>
                </div>
              )}
            </div>
          </div>

          {/* Outstanding Balance */}
          {profile.outstandingBalance > 0 && (
            <div className="bg-red-50 rounded-lg shadow border border-red-200">
              <div className="px-6 py-4">
                <p className="text-sm font-medium text-red-900">Outstanding Balance</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(profile.outstandingBalance)}</p>
                <Link
                  to="/customer/invoices"
                  className="inline-flex items-center text-sm text-red-700 hover:text-red-800 mt-2"
                >
                  View Invoices →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
