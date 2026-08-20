import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  XMarkIcon,
  BoltIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { DataTable } from '../../components/DataTable';
import { waterRateService } from '../../services/waterRateService';
import { subscriptionService } from '../../services/subscriptionService';
import type { WaterRate } from '../../types/waterRate';
import type { SubscriptionType } from '../../types/subscription';
import { ActionIconButton, ConfirmModal, DashboardStatCard, PageHeader, useToast } from '../../components';

export default function WaterRateList() {
  const navigate = useNavigate();
  const toast = useToast();

  const [waterRates, setWaterRates] = useState<WaterRate[]>([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage] = useState(1);
  const [, setTotalPages] = useState(1);
  const [filterSubscription, setFilterSubscription] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'true' | 'false'>('all');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [togglingRateId, setTogglingRateId] = useState<string | null>(null);

  const fetchWaterRates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await waterRateService.getWaterRates(currentPage, 100, {
        subscription_id: filterSubscription || undefined,
        active: filterActive === 'all' ? undefined : filterActive === 'true',
      });

      if (response && response.data) {
        setWaterRates(response.data);
        setTotalPages(response.totalPages || 1);
      } else {
        setWaterRates([]);
      }
    } catch {
      toast.error('Gagal memuat tarif air');
      setWaterRates([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterSubscription, filterActive, toast]);

  const fetchSubscriptionTypes = useCallback(async () => {
    try {
      const types = await subscriptionService.getAllSubscriptionTypes();
      setSubscriptionTypes(types || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchWaterRates();
    fetchSubscriptionTypes();
  }, [fetchWaterRates, fetchSubscriptionTypes]);

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await waterRateService.deleteWaterRate(deleteTarget);
      toast.success('Tarif air berhasil dihapus');
      setDeleteTarget(null);
      fetchWaterRates();
    } catch {
      toast.error('Gagal menghapus tarif air');
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      setTogglingRateId(id);
      if (currentActive) {
        await waterRateService.deactivateWaterRate(id);
      } else {
        await waterRateService.activateWaterRate(id);
      }

      toast.success(`Tarif air berhasil ${currentActive ? 'dinonaktifkan' : 'diaktifkan'}`);
      await fetchWaterRates();
    } catch {
      toast.error('Gagal memperbarui status tarif air');
    } finally {
      setTogglingRateId(null);
    }
  };

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const activeCount = waterRates.filter((r) => r.active).length;
  const hasActiveFilters = filterSubscription !== '' || filterActive !== 'all';

  const columns = [
    {
      key: 'subscription',
      label: 'Golongan Langganan',
      render: (_value: unknown, row: WaterRate) => row.subscription?.name || '-',
      sortable: true,
    },
    {
      key: 'amount',
      label: 'Tarif per m³',
      render: (_value: unknown, row: WaterRate) => (
        <span className="font-semibold text-brand-600">{formatCurrency(row.amount)}</span>
      ),
      align: 'right' as const,
      sortable: true,
    },
    {
      key: 'effective_date',
      label: 'Berlaku Mulai',
      render: (_value: unknown, row: WaterRate) => formatDate(row.effective_date),
      sortable: true,
    },
    {
      key: 'description',
      label: 'Deskripsi',
      render: (_value: unknown, row: WaterRate) => row.description || '-',
    },
    {
      key: 'category',
      label: 'Kategori Progresif',
      render: (_value: unknown, row: WaterRate) => row.category?.name || '-',
    },
    {
      key: 'active',
      label: 'Status',
      render: (_value: unknown, row: WaterRate) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
            row.active
              ? 'bg-success-50 text-success-700 ring-success-200'
              : 'bg-surface-50 text-surface-500 ring-surface-200'
          }`}
        >
          {row.active ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
      align: 'center' as const,
    },
  ];

  const actions = (row: WaterRate) => (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => handleToggleActive(row.id, row.active)}
        disabled={togglingRateId === row.id}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          row.active ? 'bg-success-500' : 'bg-surface-300'
        } ${togglingRateId === row.id ? 'cursor-not-allowed opacity-60' : ''}`}
        title={row.active ? 'Nonaktifkan tarif' : 'Aktifkan tarif'}
        aria-label={row.active ? 'Nonaktifkan tarif' : 'Aktifkan tarif'}
        aria-pressed={row.active}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
            row.active ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <ActionIconButton
        icon={PlusIcon}
        label={`Ubah tarif untuk ${row.subscription?.name ?? 'tarif ini'}`}
        tone="blue"
        onClick={() => navigate(`/admin/water-rates/edit/${row.id}`)}
      />
      <ActionIconButton
        icon={XMarkIcon}
        label={`Hapus tarif untuk ${row.subscription?.name ?? 'tarif ini'}`}
        tone="red"
        onClick={() => handleDelete(row.id)}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tarif Air"
        subtitle="Kelola tarif air per meter kubik untuk setiap golongan langganan."
        actions={
          <button
            onClick={() => navigate('/admin/water-rates/create')}
            className="btn-primary"
          >
            <PlusIcon className="h-4 w-4" />
            Tambah Tarif Air
          </button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DashboardStatCard
          title="Total Tarif"
          value={waterRates.length.toLocaleString('id-ID')}
          subtitle="Jumlah seluruh tarif air yang terdaftar."
          icon={BoltIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Tarif Aktif"
          value={activeCount.toLocaleString('id-ID')}
          subtitle="Tarif yang sedang berlaku."
          icon={CheckCircleIcon}
          tone="green"
        />
      </div>

      {/* Filters */}
      <div className="card">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-surface-900">Filter Tarif Air</h3>
            <p className="mt-0.5 text-xs text-surface-400">
              Saring berdasarkan golongan langganan atau status aktif.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => { setFilterSubscription(''); setFilterActive('all'); }}
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 transition hover:bg-brand-100"
            >
              <XMarkIcon className="h-3 w-3" />
              Reset filter
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-surface-700">Golongan Langganan</label>
            <select
              value={filterSubscription}
              onChange={(e) => setFilterSubscription(e.target.value)}
              className="input-base"
            >
              <option value="">Semua Golongan</option>
              {subscriptionTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-surface-700">Status</label>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as 'all' | 'true' | 'false')}
              className="input-base"
            >
              <option value="all">Semua Status</option>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0">
        <DataTable
          columns={columns}
          data={waterRates}
          actions={actions}
          loading={loading}
          emptyMessage="Belum ada tarif air. Tambahkan tarif air pertama untuk memulai."
        />
      </div>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Hapus Tarif Air"
        message="Apakah kamu yakin ingin menghapus tarif air ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
}
