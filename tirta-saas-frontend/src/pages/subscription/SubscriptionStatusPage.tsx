import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { DashboardStatCard, PageHeader } from '../../components';
import { subscriptionPaymentService } from '../../services/subscriptionPaymentService';
import type { SubscriptionStatus } from '../../services/subscriptionPaymentService';

const statusMeta = {
  trial: {
    badge: 'bg-yellow-100 text-yellow-800',
    label: 'Trial',
    icon: ClockIcon,
    tone: 'yellow' as const,
  },
  pending_approval: {
    badge: 'bg-indigo-100 text-indigo-800',
    label: 'Menunggu Persetujuan',
    icon: ClockIcon,
    tone: 'purple' as const,
  },
  pending_payment: {
    badge: 'bg-amber-100 text-amber-800',
    label: 'Menunggu Pembayaran',
    icon: CreditCardIcon,
    tone: 'yellow' as const,
  },
  pending_verification: {
    badge: 'bg-blue-100 text-blue-800',
    label: 'Menunggu Verifikasi',
    icon: ClockIcon,
    tone: 'blue' as const,
  },
  active: {
    badge: 'bg-green-100 text-green-800',
    label: 'Aktif',
    icon: CheckCircleIcon,
    tone: 'green' as const,
  },
  expired: {
    badge: 'bg-red-100 text-red-800',
    label: 'Berakhir',
    icon: ExclamationCircleIcon,
    tone: 'yellow' as const,
  },
  suspended: {
    badge: 'bg-gray-100 text-gray-800',
    label: 'Ditangguhkan',
    icon: ExclamationCircleIcon,
    tone: 'purple' as const,
  },
};

export default function SubscriptionStatusPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSubscriptionStatus = useCallback(async () => {
    try {
      const data = await subscriptionPaymentService.getSubscriptionStatus();
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSubscriptionStatus();
  }, [loadSubscriptionStatus]);

  const formatDate = (dateString?: string) => {
    if (!dateString) {
      return '-';
    }

    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const currentMeta = useMemo(
    () => (status ? statusMeta[status.status] ?? statusMeta.trial : statusMeta.trial),
    [status]
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!status) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h2 className="mt-4 text-base font-semibold text-gray-900">
          Status langganan belum bisa dimuat
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Silakan coba lagi beberapa saat lagi.
        </p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void loadSubscriptionStatus();
          }}
          className="mt-4 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Muat Ulang
        </button>
      </div>
    );
  }

  const StatusIcon = currentMeta.icon;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Status Langganan"
        subtitle="Pantau status trial, pembayaran, dan masa aktif tenant dari tampilan yang lebih ringkas di mobile."
      />

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <StatusIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Status saat ini</p>
                <h2 className="text-xl font-semibold text-gray-900">{currentMeta.label}</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-500">
              Ringkasan ini membantu tenant melihat langkah berikutnya tanpa harus masuk ke banyak halaman.
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${currentMeta.badge}`}
          >
            {currentMeta.label}
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardStatCard
          title="Status Tenant"
          value={currentMeta.label}
          helper="Kondisi saat ini"
          subtitle="Gunakan status ini untuk menentukan langkah berikutnya."
          icon={StatusIcon}
          tone={currentMeta.tone}
        />
        <DashboardStatCard
          title="Sisa Hari"
          value={`${status.daysRemaining}`}
          helper={status.daysRemaining <= 3 ? 'Perlu perhatian cepat' : 'Masih tersedia'}
          subtitle="Jumlah hari tersisa untuk trial atau periode aktif tenant."
          icon={CalendarDaysIcon}
          tone={status.daysRemaining <= 3 ? 'yellow' : 'blue'}
        />
        <DashboardStatCard
          title="Paket"
          value={status.subscriptionPlan || status.selectedPlan?.name || '-'}
          helper="Paket berjalan"
          subtitle="Informasi paket aktif atau paket yang sedang diproses."
          icon={CreditCardIcon}
          tone="green"
        />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">Detail langganan</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Tanggal mulai</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {formatDate(status.subscriptionStart)}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Tanggal berakhir</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {formatDate(status.subscriptionEnd || status.trialEndDate)}
            </p>
          </div>
        </div>
      </section>

      {status.status === 'trial' && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-amber-900">Trial masih berjalan</h3>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            Trial berakhir pada <strong>{formatDate(status.trialEndDate)}</strong>. Segera pilih paket
            agar akses tenant tidak terputus.
          </p>
          <button
            type="button"
            onClick={() => navigate('/admin/subscription/upgrade')}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 sm:w-auto"
          >
            Upgrade Sekarang
          </button>
        </section>
      )}

      {status.status === 'pending_approval' && (
        <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm text-sm leading-6 text-indigo-900">
          Tenant sudah terdaftar dan sedang menunggu persetujuan dari platform owner. Setelah disetujui,
          Anda bisa lanjut ke proses pembayaran langganan.
        </section>
      )}

      {status.status === 'pending_payment' && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-amber-900">Pembayaran langganan belum selesai</h3>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            Tenant sudah disetujui. Lanjutkan pembayaran agar akun bisa diproses ke tahap verifikasi.
          </p>
          <button
            type="button"
            onClick={() => navigate('/admin/subscription/upgrade')}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 sm:w-auto"
          >
            Lanjutkan Pembayaran
          </button>
        </section>
      )}

      {status.status === 'pending_verification' && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-blue-900">Pembayaran sedang diverifikasi</h3>
          <p className="mt-2 text-sm leading-6 text-blue-900">
            Bukti pembayaran sudah diterima dan sedang dicek oleh tim platform. Tenant akan aktif setelah
            proses verifikasi selesai.
          </p>
        </section>
      )}

      {status.pendingPayment && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-blue-900">Pembayaran yang sedang diproses</h3>
          <dl className="mt-4 space-y-3 text-sm text-blue-900">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-blue-700">ID pembayaran</dt>
              <dd className="text-right font-semibold">#{status.pendingPayment.id}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-blue-700">Status</dt>
              <dd className="text-right font-semibold">{status.pendingPayment.status.toUpperCase()}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-blue-700">Tanggal submit</dt>
              <dd className="text-right font-semibold">{formatDate(status.pendingPayment.submittedAt)}</dd>
            </div>
          </dl>
        </section>
      )}

      {(status.status === 'active' || status.status === 'expired' || status.status === 'suspended') && (
        <section
          className={`rounded-2xl border p-5 shadow-sm ${
            status.status === 'active'
              ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'
          }`}
        >
          <h3
            className={`text-base font-semibold ${
              status.status === 'active' ? 'text-green-900' : 'text-red-900'
            }`}
          >
            {status.status === 'active'
              ? 'Langganan sedang aktif'
              : status.status === 'expired'
                ? 'Masa langganan telah berakhir'
                : 'Akun tenant ditangguhkan'}
          </h3>
          <p
            className={`mt-2 text-sm leading-6 ${
              status.status === 'active' ? 'text-green-900' : 'text-red-900'
            }`}
          >
            {status.status === 'active'
              ? `Tenant aktif sampai ${formatDate(status.subscriptionEnd)} dengan sisa ${status.daysRemaining} hari.`
              : status.status === 'expired'
                ? 'Silakan perpanjang langganan agar tenant bisa kembali menggunakan layanan.'
                : 'Silakan hubungi tim platform untuk mendapatkan bantuan terkait status penangguhan.'}
          </p>
          {status.status === 'expired' && (
            <button
              type="button"
              onClick={() => navigate('/admin/subscription/upgrade')}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 sm:w-auto"
            >
              Perpanjang Langganan
            </button>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <CalendarDaysIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Butuh bantuan?</h3>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Jika ada pertanyaan terkait status paket atau pembayaran, hubungi tim support platform.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
