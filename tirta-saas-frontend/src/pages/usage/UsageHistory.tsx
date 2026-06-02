import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, ChartBarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { usageService } from '../../services/usageService';
import { customerService } from '../../services/customerService';
import type { PemakaianHistory } from '../../types/usage';
import type { Customer } from '../../types/customer';
import {
  DashboardStatCard,
  DataTable,
  PageHeader,
} from '../../components';
import type { Column } from '../../components';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const formatMonth = (month: string) => {
  const [year, monthNum] = month.split('-');
  const date = new Date(Number(year), Number(monthNum) - 1);
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
  });
};

export default function PemakaianHistoryPage() {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [history, setHistory] = useState<PemakaianHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCustomer = useCallback(async () => {
    if (!customerId) {
      return;
    }

    try {
      const data = await customerService.getCustomerById(customerId);
      setCustomer(data);
    } catch {
      setError('Profil pelanggan belum bisa dimuat. Silakan coba lagi.');
    }
  }, [customerId]);

  const fetchHistory = useCallback(async () => {
    if (!customerId) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await usageService.getCustomerPemakaianHistoryById(customerId);
      setHistory(data);
    } catch {
      setError('Riwayat pemakaian belum bisa dimuat. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void fetchCustomer();
    void fetchHistory();
  }, [fetchCustomer, fetchHistory]);

  const totalPemakaian = history.reduce((sum, item) => sum + item.usageM3, 0);
  const totalAmount = history.reduce((sum, item) => sum + item.amount, 0);
  const averagePemakaian = history.length > 0 ? totalPemakaian / history.length : 0;

  const columns: Column<PemakaianHistory>[] = [
    {
      key: 'month',
      label: 'Periode',
      sortable: true,
      render: (_value, item) => formatMonth(item.month),
    },
    {
      key: 'meterStart',
      label: 'Meter Awal',
      sortable: true,
      align: 'right',
      render: (value) => Number(value || 0).toFixed(2),
    },
    {
      key: 'meterEnd',
      label: 'Meter Akhir',
      sortable: true,
      align: 'right',
      render: (value) => Number(value || 0).toFixed(2),
    },
    {
      key: 'usageM3',
      label: 'Pemakaian',
      sortable: true,
      align: 'right',
      render: (value) => `${Number(value || 0).toFixed(2)} m3`,
    },
    {
      key: 'amount',
      label: 'Nominal',
      sortable: true,
      align: 'right',
      render: (value) => formatCurrency(Number(value || 0)),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Pemakaian"
        subtitle={customer
          ? `${customer.name}${customer.meters?.[0]?.meter_number ? ` (${customer.meters[0].meter_number})` : ''}`
          : 'Pantau histori pemakaian pelanggan dari daftar yang lebih nyaman di mobile.'}
        actions={
          <button
            type="button"
            onClick={() => navigate('/admin/usage')}
            className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Kembali ke Pemakaian Air
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardStatCard
          title="Total Pemakaian"
          value={`${totalPemakaian.toFixed(2)} m3`}
          helper={`${history.length} periode`}
          subtitle="Akumulasi pemakaian air dari histori pelanggan yang berhasil dimuat."
          icon={ChartBarIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Rata-rata Pemakaian"
          value={`${averagePemakaian.toFixed(2)} m3`}
          helper="Per periode"
          subtitle="Rerata pemakaian air pelanggan pada tiap periode histori."
          icon={ChartBarIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Total Nominal"
          value={formatCurrency(totalAmount)}
          helper="Akumulasi tagihan"
          subtitle="Total nominal dari seluruh riwayat pemakaian yang tampil."
          icon={CurrencyDollarIcon}
          tone="purple"
        />
      </div>

      {error && (
        <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          {error}
        </section>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Histori bulanan</h2>
        </div>
        <DataTable
          data={history}
          columns={columns}
          loading={loading}
          searchable={false}
          emptyMessage="Belum ada riwayat pemakaian untuk pelanggan ini."
        />
      </section>
    </div>
  );
}
