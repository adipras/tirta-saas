import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CreditCardIcon,
  KeyIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, useToast } from '../../components';
import { customerProfilService } from '../../services/customerProfileService';
import type { CustomerProfil as CustomerProfilType } from '../../types/customerProfile';
import { extractApiErrorMessage } from '../../utils/apiError';

const STATUS_CLASSES: Record<string, { bg: string; text: string; ring: string }> = {
  active: { bg: 'bg-success-50', text: 'text-success-700', ring: 'ring-success-200' },
  inactive: { bg: 'bg-surface-50', text: 'text-surface-500', ring: 'ring-surface-200' },
  suspended: { bg: 'bg-danger-50', text: 'text-danger-700', ring: 'ring-danger-200' },
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  inactive: 'Nonaktif',
  suspended: 'Ditangguhkan',
};

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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-surface-100" />
        <div className="h-48 animate-pulse rounded-xl bg-surface-100" />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 h-64 animate-pulse rounded-xl bg-surface-100" />
          <div className="space-y-6">
            <div className="h-40 animate-pulse rounded-xl bg-surface-100" />
            <div className="h-40 animate-pulse rounded-xl bg-surface-100" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Profil Saya" subtitle="Kelola informasi pribadi dan detail langganan Anda." />
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-6 text-center">
          <p className="text-[13px] text-danger-700">{error}</p>
          <button
            onClick={() => void loadProfil()}
            className="mt-4 rounded-lg bg-danger-600 px-4 py-2 text-sm text-white hover:bg-danger-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="Profil Saya" subtitle="Kelola informasi pribadi dan detail langganan Anda." />
        <div className="rounded-xl border border-warning-200 bg-warning-50 p-6 text-center">
          <p className="text-[13px] text-warning-700">Profil tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  const s = STATUS_CLASSES[profile.status] || STATUS_CLASSES.inactive;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil Saya"
        subtitle="Kelola informasi pribadi, status akun, dan detail langganan pelanggan Anda."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/customer/profile/change-password" className="btn-secondary">
              <KeyIcon className="h-4 w-4" />
              Ubah Kata Sandi
            </Link>
            <Link to="/customer/profile/edit" className="btn-primary">
              <PencilSquareIcon className="h-4 w-4" />
              Ubah Profil
            </Link>
          </div>
        }
      />

      {/* Outstanding Alert */}
      {profile.outstandingBalance > 0 && (
        <div className="rounded-xl border border-warning-200 bg-warning-50 p-4">
          <p className="text-[13px] text-warning-700">
            Anda memiliki tunggakan sebesar <strong>{formatCurrency(profile.outstandingBalance)}</strong>.
            Silakan lakukan pembayaran agar layanan tidak terputus.
          </p>
        </div>
      )}

      {/* Profile Header Card */}
      <section className="relative overflow-hidden rounded-xl border border-surface-200/80 bg-white shadow-card">
        <div className="gradient-brand p-6 text-white sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
                <UserCircleIcon className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-1">
                <span className="inline-flex w-fit rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90">
                  Akun Pelanggan
                </span>
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{profile.name}</h2>
                <p className="text-[13px] text-white/80">{profile.email}</p>
              </div>
            </div>
            <span className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${s.bg} ${s.text} ${s.ring}`}>
              <CheckCircleIcon className="h-4 w-4" />
              {STATUS_LABELS[profile.status] ?? profile.status}
            </span>
          </div>
        </div>

        {/* Quick Info Row */}
        <div className="grid grid-cols-2 divide-y border-t border-surface-100 sm:grid-cols-4 sm:divide-y-0 sm:divide-x">
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">Paket</p>
            <p className="mt-1 text-sm font-bold text-surface-900">{profile.subscriptionType.name}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">Biaya Bulanan</p>
            <p className="mt-1 text-sm font-bold text-surface-900">{formatCurrency(profile.subscriptionType.monthlyFee)}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">Nomor Meter</p>
            <p className="mt-1 font-mono text-sm font-bold text-surface-900">{profile.meterNumber || '-'}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">ID Pelanggan</p>
            <p className="mt-1 font-mono text-sm font-bold text-surface-900">{profile.customerId}</p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Personal Information */}
        <div className="card">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-surface-900">
            <UserCircleIcon className="h-4 w-4 text-brand-500" />
            Informasi Pribadi
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
                <UserCircleIcon className="h-4 w-4 text-brand-600" />
              </div>
              <div>
                <p className="text-xs text-surface-400">Nama Lengkap</p>
                <p className="mt-0.5 text-sm font-medium text-surface-900">{profile.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info-50">
                <EnvelopeIcon className="h-4 w-4 text-info-600" />
              </div>
              <div>
                <p className="text-xs text-surface-400">Alamat Email</p>
                <p className="mt-0.5 text-sm font-medium text-surface-900">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-50">
                <PhoneIcon className="h-4 w-4 text-warning-600" />
              </div>
              <div>
                <p className="text-xs text-surface-400">Nomor Telepon</p>
                <p className="mt-0.5 text-sm font-medium text-surface-900">{profile.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-50">
                <MapPinIcon className="h-4 w-4 text-success-600" />
              </div>
              <div>
                <p className="text-xs text-surface-400">Alamat</p>
                <p className="mt-0.5 text-sm font-medium text-surface-900">{profile.address}</p>
                <p className="text-[12px] text-surface-500">{profile.city}, {profile.postalCode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Account Status */}
          <div className="card">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-surface-900">
              <CheckCircleIcon className="h-4 w-4 text-brand-500" />
              Status Akun
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-surface-500">Status</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.bg} ${s.text} ${s.ring}`}>
                  {STATUS_LABELS[profile.status] ?? profile.status}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-surface-100 pt-3">
                <span className="text-[13px] text-surface-500">Tanggal Pendaftaran</span>
                <span className="text-[13px] font-medium text-surface-900">{formatDate(profile.registrationDate)}</span>
              </div>
              {profile.lastPaymentDate && (
                <div className="flex items-center justify-between border-t border-surface-100 pt-3">
                  <span className="text-[13px] text-surface-500">Pembayaran Terakhir</span>
                  <span className="text-[13px] font-medium text-surface-900">{formatDate(profile.lastPaymentDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Subscription Details */}
          <div className="card">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-surface-900">
              <BoltIcon className="h-4 w-4 text-info-500" />
              Langganan
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-surface-500">Jenis Langganan</span>
                <span className="text-[13px] font-semibold text-surface-900">{profile.subscriptionType.name}</span>
              </div>
              <div className="flex items-center justify-between border-t border-surface-100 pt-3">
                <span className="text-[13px] text-surface-500">Biaya Bulanan</span>
                <span className="text-[13px] font-semibold text-surface-900">{formatCurrency(profile.subscriptionType.monthlyFee)}</span>
              </div>
              {profile.meterLocation && (
                <div className="flex items-center justify-between border-t border-surface-100 pt-3">
                  <span className="text-[13px] text-surface-500">Lokasi Meter</span>
                  <span className="text-[13px] font-medium text-surface-900">{profile.meterLocation}</span>
                </div>
              )}
            </div>
          </div>

          {/* Outstanding Balance */}
          {profile.outstandingBalance > 0 && (
            <div className="rounded-xl border border-danger-200 bg-danger-50 p-5 shadow-card">
              <div className="flex items-center gap-2 text-danger-700">
                <CreditCardIcon className="h-5 w-5" />
                <span className="text-sm font-semibold">Tunggakan</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-danger-600">{formatCurrency(profile.outstandingBalance)}</p>
              <Link
                to="/customer/invoices"
                className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-danger-700 hover:text-danger-800 transition-colors"
              >
                Lihat Tagihan →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
