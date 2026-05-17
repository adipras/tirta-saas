import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { waterRateService } from '../../services/waterRateService';
import { subscriptionService } from '../../services/subscriptionService';
import type { RateHistory } from '../../types/waterRate';
import type { SubscriptionType } from '../../types/subscription';
import {
  DashboardStatCard,
  DataTable,
  FormSelect,
  PageHeader,
} from '../../components';
import type { Column } from '../../components';
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
  const [currentPage, setCurrentPage] = useState(1);
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
    } catch  {
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

  const columns: Column<RateHistory>[] = [
    {
      key: 'subscription_name',
      label: 'Golongan Langganan',
      sortable: true,
    },
    {
      key: 'amount',
      label: 'Tarif per m3',
      render: (_value, row) => formatCurrency(row.amount),
      align: 'right',
      sortable: true,
    },
    {
      key: 'effective_date',
      label: 'Mulai Berlaku',
      render: (_value, row) => formatDate(row.effective_date),
      sortable: true,
    },
    {
      key: 'created_at',
      label: 'Dibuat',
      render: (_value, row) => formatDateTime(row.created_at),
      sortable: true,
    },
    {
      key: 'active',
      label: 'Status',
      render: (_value, row) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
            row.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {row.active ? (
            <>
              <CheckCircleIcon className="mr-1 h-4 w-4" />
              Aktif
            </>
          ) : (
            <>
              <XCircleIcon className="mr-1 h-4 w-4" />
              Nonaktif
            </>
          )}
        </span>
      ),
      align: 'center',
    },
  ];

  const subscriptionOptions = useMemo(
    () => [
      { value: '', label: 'Semua golongan langganan' },
      ...subscriptionTypes.map((type) => ({ value: type.id, label: type.name })),
    ],
    [subscriptionTypes]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Tarif Air"
        subtitle="Pantau perubahan tarif air dari waktu ke waktu dengan filter yang lebih ringkas dan daftar yang mobile-friendly."
        actions={
          <button
            type="button"
            onClick={() => navigate('/admin/water-rates')}
            className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Kembali ke Tarif Air
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardStatCard
          title="Riwayat Tampil"
          value={loading ? '...' : history.length.toLocaleString('id-ID')}
          helper={selectedSubscription ? 'Sudah difilter' : 'Semua data pada halaman'}
          subtitle="Jumlah riwayat tarif yang sedang tampil pada daftar aktif."
          icon={ClockIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Tarif Aktif"
          value={loading ? '...' : activeCount.toLocaleString('id-ID')}
          helper={`${inactiveCount.toLocaleString('id-ID')} nonaktif`}
          subtitle="Membantu memantau berapa entri tarif yang masih aktif digunakan."
          icon={CheckCircleIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Tarif Terbaru"
          value={loading ? '...' : formatCurrency(latestRate)}
          helper="Entri teratas"
          subtitle="Nilai tarif paling baru dari hasil daftar riwayat yang tampil."
          icon={CurrencyDollarIcon}
          tone="purple"
        />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Filter riwayat</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:max-w-lg">
          <FormSelect
            label="Golongan langganan"
            value={selectedSubscription}
            onChange={(e) => {
              setSelectedSubscription(e.target.value);
              setCurrentPage(1);
            }}
            options={subscriptionOptions}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Timeline perubahan tarif</h2>
        {history.length > 0 ? (
          <div className="mt-4 space-y-4">
            {history.slice(0, 5).map((rate) => (
              <div key={rate.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{rate.subscription_name}</p>
                    <p className="mt-1 text-sm text-gray-500">{formatDate(rate.effective_date)}</p>
                    <p className="mt-1 text-xs text-gray-500">Dibuat {formatDateTime(rate.created_at)}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(rate.amount)}</p>
                    <p className="text-xs text-gray-500">per m3</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
            Belum ada riwayat tarif yang tersedia.
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Riwayat lengkap</h2>
        </div>
        <DataTable
          columns={columns}
          data={history}
          loading={loading}
          searchable={false}
          emptyMessage="Belum ada riwayat tarif yang cocok dengan filter."
        />
      </section>
    </div>
  );
}
