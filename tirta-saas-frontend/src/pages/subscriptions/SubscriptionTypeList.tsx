import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  TagIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { DataTable } from '../../components/DataTable';
import { subscriptionService } from '../../services/subscriptionService';
import type { SubscriptionType } from '../../types/subscription';
import { PageHeader, DashboardStatCard, ConfirmModal, useToast } from '../../components';

export default function SubscriptionTypeList() {
  const navigate = useNavigate();
  const toast = useToast();

  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage] = useState(1);
  const [, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchSubscriptionTypes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getSubscriptionTypes(
        currentPage,
        10,
        search || undefined
      );

      if (response && response.data) {
        const processedData = response.data.map((item: SubscriptionType) => ({
          ...item,
          registration_fee: Number(item.registration_fee),
          monthly_fee: Number(item.monthly_fee),
          maintenance_fee: Number(item.maintenance_fee),
          late_fee_per_day: Number(item.late_fee_per_day),
          max_late_fee: Number(item.max_late_fee),
        }));
        setSubscriptionTypes(processedData);
        setTotalPages(response.totalPages || 1);
      } else {
        setSubscriptionTypes([]);
        setTotalPages(1);
      }
    } catch {
      toast.error('Gagal memuat daftar golongan langganan');
      setSubscriptionTypes([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, toast]);

  useEffect(() => {
    fetchSubscriptionTypes();
  }, [fetchSubscriptionTypes]);

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await subscriptionService.deleteSubscriptionType(deleteTarget);
      toast.success('Golongan langganan berhasil dihapus');
      setDeleteTarget(null);
      fetchSubscriptionTypes();
    } catch {
      toast.error('Gagal menghapus golongan langganan');
    }
  };

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

  const avgMonthlyFee =
    subscriptionTypes.length > 0
      ? Math.round(subscriptionTypes.reduce((sum, t) => sum + t.monthly_fee, 0) / subscriptionTypes.length)
      : 0;

  const columns = [
    {
      key: 'name',
      label: 'Nama',
      sortable: true,
    },
    {
      key: 'description',
      label: 'Deskripsi',
      render: (_value: unknown, row: SubscriptionType) => row.description || '-',
    },
    {
      key: 'registration_fee',
      label: 'Biaya Pendaftaran',
      render: (_value: unknown, row: SubscriptionType) => (
        <span className="font-semibold text-surface-900">{formatCurrency(row.registration_fee)}</span>
      ),
      align: 'right' as const,
    },
    {
      key: 'monthly_fee',
      label: 'Biaya Bulanan',
      render: (_value: unknown, row: SubscriptionType) => (
        <span className="font-semibold text-brand-600">{formatCurrency(row.monthly_fee)}</span>
      ),
      align: 'right' as const,
    },
    {
      key: 'maintenance_fee',
      label: 'Pemeliharaan',
      render: (_value: unknown, row: SubscriptionType) => formatCurrency(row.maintenance_fee),
      align: 'right' as const,
    },
    {
      key: 'late_fee_per_day',
      label: 'Denda/Hari',
      render: (_value: unknown, row: SubscriptionType) => (
        <span className="text-danger-600">{formatCurrency(row.late_fee_per_day)}</span>
      ),
      align: 'right' as const,
    },
    {
      key: 'max_late_fee',
      label: 'Batas Denda',
      render: (_value: unknown, row: SubscriptionType) => formatCurrency(row.max_late_fee),
      align: 'right' as const,
    },
    {
      key: 'created_at',
      label: 'Dibuat',
      render: (_value: unknown, row: SubscriptionType) =>
        new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      align: 'center' as const,
    },
  ];

  const actions = (row: SubscriptionType) => (
    <div className="flex items-center justify-end gap-1.5">
      <button
        onClick={() => navigate(`/admin/subscriptions/edit/${row.id}`)}
        className="btn-secondary !px-2.5 !py-1 text-xs"
      >
        Ubah
      </button>
      <button
        onClick={() => handleDelete(row.id)}
        className="rounded-lg border border-danger-200 bg-danger-50 px-2.5 py-1 text-xs font-medium text-danger-700 transition hover:bg-danger-100"
      >
        Hapus
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Golongan Langganan"
        subtitle="Kelola golongan langganan beserta struktur biayanya."
        actions={
          <button
            onClick={() => navigate('/admin/subscriptions/create')}
            className="btn-primary"
          >
            <PlusIcon className="h-4 w-4" />
            Tambah Golongan
          </button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DashboardStatCard
          title="Total Golongan"
          value={subscriptionTypes.length.toLocaleString('id-ID')}
          subtitle="Jumlah golongan langganan yang terdaftar."
          icon={TagIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Rata-rata Biaya Bulanan"
          value={subscriptionTypes.length > 0 ? formatCurrency(avgMonthlyFee) : '-'}
          subtitle="Rata-rata biaya bulanan dari seluruh golongan."
          icon={CurrencyDollarIcon}
          tone="green"
        />
      </div>

      {/* Filters */}
      <div className="card">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-surface-900">Filter Golongan</h3>
            <p className="mt-0.5 text-xs text-surface-400">
              Cari berdasarkan nama atau deskripsi golongan langganan.
            </p>
          </div>
          {search !== '' && (
            <button
              onClick={() => setSearch('')}
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 transition hover:bg-brand-100"
            >
              <XMarkIcon className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-300" />
          <input
            type="text"
            placeholder="Cari golongan langganan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card p-0">
        <DataTable
          columns={columns}
          data={subscriptionTypes}
          actions={actions}
          loading={loading}
          searchable={false}
          emptyMessage="Belum ada golongan langganan."
        />
      </div>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Hapus Golongan Langganan"
        message="Apakah Anda yakin ingin menghapus golongan langganan ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
}
