import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { DataTable } from '../../components/DataTable';
import { waterRateService } from '../../services/waterRateService';
import { subscriptionService } from '../../services/subscriptionService';
import type { WaterRate } from '../../types/waterRate';
import type { SubscriptionType } from '../../types/subscription';
import { useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';
import { PageHeader, ConfirmModal } from '../../components';

export default function WaterRateList() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
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
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Gagal memuat tarif air',
      }));
      console.error('Error fetching water rates:', error);
      setWaterRates([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterSubscription, filterActive, dispatch]);

  const fetchSubscriptionTypes = useCallback(async () => {
    try {
      const types = await subscriptionService.getAllSubscriptionTypes();
      setSubscriptionTypes(types || []);
    } catch (error) {
      console.error('Error fetching subscription types:', error);
    }
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
      dispatch(addNotification({
        type: 'success',
        message: 'Tarif air berhasil dihapus',
      }));
      setDeleteTarget(null);
      fetchWaterRates();
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Gagal menghapus tarif air',
      }));
      console.error('Error deleting water rate:', error);
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
      
      dispatch(addNotification({
        type: 'success',
        message: `Tarif air berhasil ${currentActive ? 'dinonaktifkan' : 'diaktifkan'}`,
      }));
      await fetchWaterRates();
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Gagal memperbarui status tarif air',
      }));
    } finally {
      setTogglingRateId(null);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const columns = [
    {
      key: 'subscription',
      label: 'Golongan Langganan',
      render: (_value: any, row: WaterRate) => row.subscription?.name || '-',
      sortable: true,
    },
    {
      key: 'amount',
      label: 'Tarif per m3',
      render: (_value: any, row: WaterRate) => formatCurrency(row.amount),
      align: 'right' as const,
      sortable: true,
    },
    {
      key: 'effective_date',
      label: 'Berlaku Mulai',
      render: (_value: any, row: WaterRate) => formatDate(row.effective_date),
      sortable: true,
    },
    {
      key: 'description',
      label: 'Deskripsi',
      render: (_value: any, row: WaterRate) => row.description || '-',
    },
    {
      key: 'active',
      label: 'Status',
      render: (_value: any, row: WaterRate) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.active
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {row.active ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
      align: 'center' as const,
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (_value: any, row: WaterRate) => (
        <div className="flex space-x-2 justify-center">
          <button
            type="button"
            onClick={() => handleToggleActive(row.id, row.active)}
            disabled={togglingRateId === row.id}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              row.active ? 'bg-green-600' : 'bg-gray-300'
            } ${togglingRateId === row.id ? 'cursor-not-allowed opacity-60' : ''}`}
            title={row.active ? 'Nonaktifkan tarif' : 'Aktifkan tarif'}
            aria-label={row.active ? 'Nonaktifkan tarif' : 'Aktifkan tarif'}
            aria-pressed={row.active}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                row.active ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <button
            onClick={() => navigate(`/admin/water-rates/edit/${row.id}`)}
            className="text-blue-600 hover:text-blue-900"
            title="Ubah"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-900"
            title="Hapus"
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
        title="Tarif Air"
        subtitle="Kelola tarif air per meter kubik untuk setiap golongan langganan"
        actions={
          <button
            onClick={() => navigate('/admin/water-rates/create')}
            className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Tambah Tarif Air
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Golongan Langganan
            </label>
            <select
              value={filterSubscription}
              onChange={(e) => setFilterSubscription(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Semua Golongan</option>
              {subscriptionTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as 'all' | 'true' | 'false')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">Semua Status</option>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>

          {(filterSubscription !== '' || filterActive !== 'all') && (
            <div>
              <button
                onClick={() => { setFilterSubscription(''); setFilterActive('all'); }}
                className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 sm:w-auto"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg">
        <DataTable
          columns={columns}
          data={waterRates}
          loading={loading}
          emptyMessage="Belum ada tarif air. Tambahkan tarif air pertama untuk memulai."
        />
      </div>

      {/* Stats */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="text-sm text-gray-600">
          Menampilkan {waterRates.length} tarif air
        </div>
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
