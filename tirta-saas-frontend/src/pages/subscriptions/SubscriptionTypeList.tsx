import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  PencilIcon,
  TrashIcon,
  TagIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { DataTable } from '../../components/DataTable';
import { subscriptionService } from '../../services/subscriptionService';
import type { SubscriptionType } from '../../types/subscription';
import { PageHeader, ConfirmModal } from '../../components';
import { useToast } from '../../components';

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
      
      // Response is already formatted by service with {data, totalPages}
      if (response && response.data) {
        // Convert string numbers to actual numbers
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
    } catch  {
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
    } catch  {
      toast.error('Gagal menghapus golongan langganan');
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
      render: (_value: unknown, row: SubscriptionType) => formatCurrency(row.registration_fee),
      align: 'right' as const,
    },
    {
      key: 'monthly_fee',
      label: 'Biaya Bulanan',
      render: (_value: unknown, row: SubscriptionType) => formatCurrency(row.monthly_fee),
      align: 'right' as const,
    },
    {
      key: 'maintenance_fee',
      label: 'Biaya Pemeliharaan',
      render: (_value: unknown, row: SubscriptionType) => formatCurrency(row.maintenance_fee),
      align: 'right' as const,
    },
    {
      key: 'late_fee_per_day',
      label: 'Denda/Hari',
      render: (_value: unknown, row: SubscriptionType) => formatCurrency(row.late_fee_per_day),
      align: 'right' as const,
    },
    {
      key: 'max_late_fee',
      label: 'Batas Maks. Denda',
      render: (_value: unknown, row: SubscriptionType) => formatCurrency(row.max_late_fee),
      align: 'right' as const,
    },
    {
      key: 'created_at',
      label: 'Dibuat Pada',
      render: (_value: unknown, row: SubscriptionType) => new Date(row.created_at).toLocaleDateString('id-ID'),
      align: 'center' as const,
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (_value: unknown, row: SubscriptionType) => (
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/admin/subscriptions/edit/${row.id}`)}
            className="text-blue-600 hover:text-blue-900"
            title="Ubah"
            aria-label={`Ubah golongan langganan ${row.name}`}
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-900"
            title="Hapus"
            aria-label={`Hapus golongan langganan ${row.name}`}
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      ),
      align: 'center' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Golongan Langganan"
        subtitle="Kelola golongan langganan beserta struktur biayanya"
        actions={
          <button
            onClick={() => navigate('/admin/subscriptions/create')}
            className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            Tambah Golongan Langganan
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TagIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Golongan
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {subscriptionTypes.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Rata-rata Biaya Bulanan
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {subscriptionTypes.length > 0
                      ? `Rp ${Math.round(subscriptionTypes.reduce((sum, t) => sum + t.monthly_fee, 0) / subscriptionTypes.length).toLocaleString('id-ID')}`
                      : '-'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="rounded-lg bg-white p-4 shadow">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-lg">
          <input
            type="text"
            placeholder="Cari golongan langganan..."
            aria-label="Cari golongan langganan"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <p className="text-sm text-gray-500">
          Menampilkan {subscriptionTypes.length} golongan langganan
        </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg">
        <DataTable
          columns={columns}
          data={subscriptionTypes}
          loading={loading}
          searchable={false}
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
