import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { waterRateService } from '../../services/waterRateService';
import { subscriptionService } from '../../services/subscriptionService';
import type { RateHistory } from '../../types/waterRate';
import type { SubscriptionType } from '../../types/subscription';
import { DashboardStatCard } from '../../components';
import { useToast } from '../../components';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const formatDateTime = (date: string) =>
  new Date(date).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function RateHistory() {
  const navigate = useNavigate();
  const toast = useToast();

  const [history, setHistory] = useState<RateHistory[]>([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage] = useState(1);
  const [selectedSubscription, setSelectedSubscription] = useState('');

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await waterRateService.getRateHistory(
        selectedSubscription || undefined,
        currentPage,
        20
      );
      setHistory(response.data);
    } catch {
      toast.error('Riwayat tarif air belum bisa dimuat');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedSubscription, toast]);

  const fetchSubscriptionTypes = useCallback(async () => {
    try {
      const types = await subscriptionService.getAllSubscriptionTypes();
      setSubscriptionTypes(types);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    void fetchSubscriptionTypes();
  }, [fetchSubscriptionTypes]);

  const activeCount = history.filter((item) => item.active).length;
  const inactiveCount = history.filter((item) => !item.active).length;
  const latestRate = history[0]?.amount || 0;

  const filteredHistory = history;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[13px] text-surface-400">
        <button
          onClick={() => navigate('/admin/water-rates')}
          className="transition-colors hover:text-surface-600"
        >
          Tarif Air
        </button>
        <span>/</span>
        <span className="font-medium text-surface-700">Riwayat</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-surface-900">Riwayat Tarif Air</h1>
          <p className="mt-1 text-[13px] text-surface-400">
            Pantau perubahan tarif air dari waktu ke waktu.
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/water-rates')}
          className="btn-secondary self-start"
        >
          ← Kembali ke Tarif
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardStatCard
          title="Riwayat Tampil"
          value={loading ? '...' : filteredHistory.length.toLocaleString('id-ID')}
          helper={selectedSubscription ? 'Sudah difilter' : 'Semua data pada halaman'}
          subtitle="Jumlah riwayat tarif yang sedang tampil."
          icon={ClockIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Tarif Aktif"
          value={loading ? '...' : activeCount.toLocaleString('id-ID')}
          helper={`${inactiveCount.toLocaleString('id-ID')} nonaktif`}
          subtitle="Entri tarif yang masih aktif."
          icon={CheckCircleIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Tarif Terbaru"
          value={loading ? '...' : formatCurrency(latestRate)}
          helper="Entri teratas"
          subtitle="Nilai tarif paling baru."
          icon={CurrencyDollarIcon}
          tone="purple"
        />
      </div>

      {/* Filter */}
      <div className="card p-5">
        <h2 className="text-[15px] font-semibold text-surface-800">Filter riwayat</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:max-w-lg">
          <div>
            <label className="label-base">Golongan langganan</label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-4 w-4 text-surface-300" />
              </div>
              <select
                value={selectedSubscription}
                onChange={(e) => {
                  setSelectedSubscription(e.target.value);
                }}
                className="input-base pl-10"
              >
                <option value="">Semua golongan langganan</option>
                {subscriptionTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="card overflow-hidden">
        <div className="border-b border-surface-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-surface-800">Timeline perubahan tarif</h2>
        </div>
        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-100" />
            ))}
          </div>
        ) : filteredHistory.length > 0 ? (
          <div className="divide-y divide-surface-100 p-5">
            {filteredHistory.slice(0, 5).map((rate) => (
              <div key={rate.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                    rate.active
                      ? 'bg-success-50 text-success-600 ring-1 ring-inset ring-success-200'
                      : 'bg-surface-50 text-surface-400 ring-1 ring-inset ring-surface-200'
                  }`}>
                    {rate.active ? (
                      <CheckCircleIcon className="h-4 w-4" />
                    ) : (
                      <XCircleIcon className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-surface-800">{rate.subscription_name}</p>
                    <p className="mt-0.5 text-[13px] text-surface-400">{formatDate(rate.effective_date)}</p>
                    <p className="mt-0.5 text-[12px] text-surface-400">Dibuat {formatDateTime(rate.created_at)}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-lg font-semibold text-surface-800">{formatCurrency(rate.amount)}</p>
                  <p className="text-[12px] text-surface-400">per m3</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100">
              <ClockIcon className="h-6 w-6 text-surface-300" />
            </div>
            <p className="text-[13px] text-surface-400">
              Belum ada riwayat tarif yang tersedia.
            </p>
          </div>
        )}
      </div>

      {/* Full History Table */}
      <div className="card overflow-hidden">
        <div className="border-b border-surface-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-surface-800">Riwayat lengkap</h2>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/50">
                <th className="px-5 py-3 font-medium text-surface-500">Golongan Langganan</th>
                <th className="px-5 py-3 text-right font-medium text-surface-500">Tarif per m3</th>
                <th className="px-5 py-3 font-medium text-surface-500">Mulai Berlaku</th>
                <th className="px-5 py-3 font-medium text-surface-500">Dibuat</th>
                <th className="px-5 py-3 text-center font-medium text-surface-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-5 py-4">
                      <div className="h-5 animate-pulse rounded bg-surface-100" />
                    </td>
                  </tr>
                ))
              ) : filteredHistory.length > 0 ? (
                filteredHistory.map((rate) => (
                  <tr key={rate.id} className="transition-colors hover:bg-surface-50/50">
                    <td className="px-5 py-3.5 font-medium text-surface-800">
                      {rate.subscription_name}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-brand-600">
                      {formatCurrency(rate.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-surface-600">{formatDate(rate.effective_date)}</td>
                    <td className="px-5 py-3.5 text-surface-400">{formatDateTime(rate.created_at)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1 ring-inset ${
                        rate.active
                          ? 'bg-success-50 text-success-700 ring-success-200/60'
                          : 'bg-surface-50 text-surface-500 ring-surface-200/60'
                      }`}>
                        {rate.active ? (
                          <><CheckCircleIcon className="h-3.5 w-3.5" /> Aktif</>
                        ) : (
                          <><XCircleIcon className="h-3.5 w-3.5" /> Nonaktif</>
                        )}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-surface-400">
                    Belum ada riwayat tarif yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden">
          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-100" />
              ))}
            </div>
          ) : filteredHistory.length > 0 ? (
            <div className="divide-y divide-surface-100">
              {filteredHistory.map((rate) => (
                <div key={rate.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[14px] font-medium text-surface-800">{rate.subscription_name}</p>
                      <p className="mt-0.5 text-[12px] text-surface-400">
                        Berlaku: {formatDate(rate.effective_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] font-semibold text-brand-600">{formatCurrency(rate.amount)}</p>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                        rate.active
                          ? 'bg-success-50 text-success-700 ring-success-200/60'
                          : 'bg-surface-50 text-surface-500 ring-surface-200/60'
                      }`}>
                        {rate.active ? <CheckCircleIcon className="h-3 w-3" /> : <XCircleIcon className="h-3 w-3" />}
                        {rate.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-[13px] text-surface-400">
              Belum ada riwayat tarif yang cocok dengan filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
