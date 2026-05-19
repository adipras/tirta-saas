import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCircleIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, CreditCardIcon, KeyIcon } from '@heroicons/react/24/outline';
import { PageHeader, useToast } from '../../components';
import { customerProfilService } from '../../services/customerProfileService';
import type { CustomerProfil as CustomerProfilType } from '../../types/customerProfile';
import { extractApiErrorMessage } from '../../utils/apiError';

export default function CustomerProfil() {
  const [profile, setProfil] = useState<CustomerProfilType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { error: showErrorToast } = useToast();

  const loadProfil = useCallback(async () => {
    try {
      setLoading(true);
      const data = await customerProfilService.getProfil();
      setProfil(data);
      setError(null);
    } catch (err: unknown) {
      const message = extractApiErrorMessage(err, 'Gagal memuat profil');
      setError(message);
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  }, [showErrorToast]);

  useEffect(() => {
    void loadProfil();
  }, [loadProfil]);

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
    };
    return badges[status as keyof typeof badges] || badges.inactive;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'AKTIF',
      inactive: 'NONAKTIF',
      suspended: 'DITANGGUHKAN',
    };

    return labels[status] || status.toUpperCase();
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">{error}</p>
        <button onClick={() => void loadProfil()} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">Coba Lagi</button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-600">Profil tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil Saya"
        subtitle="Kelola informasi pribadi, status akun, dan detail langganan pelanggan Anda."
        actions={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/customer/profile/change-password"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <KeyIcon className="mr-2 h-5 w-5" />
              Ubah Kata Sandi
            </Link>
            <Link
              to="/customer/profile/edit"
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Edit Profil
            </Link>
          </div>
        }
      />

      {/* Status Alert */}
      {profile.outstandingBalance > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                 Anda memiliki tunggakan sebesar <strong>{formatCurrency(profile.outstandingBalance)}</strong>.
                 Silakan lakukan pembayaran agar layanan tidak terputus.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Informasi Pribadi</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-start">
              <UserCircleIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Nama Lengkap</p>
                <p className="text-base text-gray-900">{profile.name}</p>
              </div>
            </div>

            <div className="flex items-start">
              <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Alamat Email</p>
                <p className="text-base text-gray-900">{profile.email}</p>
              </div>
            </div>

            <div className="flex items-start">
              <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Nomor Telepon</p>
                <p className="text-base text-gray-900">{profile.phone}</p>
              </div>
            </div>

            <div className="flex items-start">
              <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Alamat</p>
                <p className="text-base text-gray-900">{profile.address}</p>
                <p className="text-sm text-gray-600">{profile.city}, {profile.postalCode}</p>
              </div>
            </div>

            <div className="flex items-start">
              <CreditCardIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">ID Pelanggan</p>
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
               <h2 className="text-lg font-semibold text-gray-900">Status Akun</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(profile.status)}`}>
                  {getStatusLabel(profile.status)}
                </span>
              </div>
              <div>
                  <p className="text-sm font-medium text-gray-500">Tanggal Pendaftaran</p>
                <p className="text-base text-gray-900">{formatDate(profile.registrationDate)}</p>
              </div>
              {profile.lastPaymentDate && (
                <div>
                    <p className="text-sm font-medium text-gray-500">Pembayaran Terakhir</p>
                  <p className="text-base text-gray-900">{formatDate(profile.lastPaymentDate)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Subscription Details */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
               <h2 className="text-lg font-semibold text-gray-900">Langganan</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                  <p className="text-sm font-medium text-gray-500">Jenis Langganan</p>
                <p className="text-base text-gray-900 font-medium">{profile.subscriptionType.name}</p>
              </div>
              <div>
                  <p className="text-sm font-medium text-gray-500">Biaya Bulanan</p>
                <p className="text-base text-gray-900">{formatCurrency(profile.subscriptionType.monthlyFee)}</p>
              </div>
              {profile.meterNumber && (
                <div>
                    <p className="text-sm font-medium text-gray-500">Nomor Meter</p>
                  <p className="text-base text-gray-900 font-mono">{profile.meterNumber}</p>
                </div>
              )}
              {profile.meterLocation && (
                <div>
                    <p className="text-sm font-medium text-gray-500">Lokasi Meter</p>
                  <p className="text-base text-gray-900">{profile.meterLocation}</p>
                </div>
              )}
            </div>
          </div>

          {/* Outstanding Balance */}
          {profile.outstandingBalance > 0 && (
            <div className="bg-red-50 rounded-lg shadow border border-red-200">
              <div className="px-6 py-4">
                <p className="text-sm font-medium text-red-900">Tunggakan</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(profile.outstandingBalance)}</p>
                <Link
                  to="/customer/invoices"
                  className="inline-flex items-center text-sm text-red-700 hover:text-red-800 mt-2"
                >
                  Lihat Tagihan →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
