import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  PencilIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { DataTable, type Column } from '../../components/DataTable';
import customerService from '../../services/customerService';
import type { Customer, CustomerFilters, SubscriptionType } from '../../types/customer';
import { ActionIconButton, DashboardStatCard, PageHeader } from '../../components';
import { useToast } from '../../components';

export default function CustomerList() {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [customers, setPelanggan] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  
  const [filters, setFilters] = useState({
    isActive: '' as boolean | '',
    subscriptionTypeId: '',
    hasOutstandingBalance: '',
    search: '',
  });
  const hasActiveFilters =
    filters.isActive !== '' ||
    filters.subscriptionTypeId !== '' ||
    filters.hasOutstandingBalance !== '' ||
    filters.search !== '';

  const fetchPelanggan = useCallback(async () => {
    try {
      setLoading(true);
      const filterParams: CustomerFilters = {
        isActive: filters.isActive === '' ? undefined : filters.isActive,
        subscriptionTypeId: filters.subscriptionTypeId || undefined,
        hasOutstandingBalance: filters.hasOutstandingBalance === 'true' ? true : 
                               filters.hasOutstandingBalance === 'false' ? false : undefined,
        search: filters.search || undefined,
      };

      const response = await customerService.getPelanggan(currentPage, 10, filterParams);
      setPelanggan(response.data);
    } catch {
      toast.error('Gagal memuat daftar pelanggan');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, toast]);

  useEffect(() => {
    fetchPelanggan();
    fetchSubscriptionTypes();
  }, [currentPage, filters, fetchPelanggan]);

  const fetchSubscriptionTypes = async () => {
    try {
      const types = await customerService.getSubscriptionTypes();
      setSubscriptionTypes(types);
    } catch { /* ignore */ }
  };

  const handleStatusChange = async (customerId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await customerService.activateCustomer(customerId);
      } else {
        await customerService.deactivateCustomer(customerId);
      }
      
      toast.success(`Pelanggan berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
      
      fetchPelanggan();
    } catch {
      toast.error('Gagal memperbarui status pelanggan');
    }
  };

  const handleExport = async () => {
    try {
      const exportFilters: CustomerFilters = {
        isActive: filters.isActive === '' ? undefined : filters.isActive,
        subscriptionTypeId: filters.subscriptionTypeId || undefined,
        hasOutstandingBalance: filters.hasOutstandingBalance === 'true' ? true : 
                               filters.hasOutstandingBalance === 'false' ? false : undefined,
        search: filters.search || undefined,
      };
      const blob = await customerService.exportPelanggan(exportFilters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Data pelanggan berhasil diekspor');
    } catch {
      toast.error('Gagal mengekspor data pelanggan');
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {isActive ? (
          <>
            <CheckCircleIcon className="mr-1 h-3 w-3" />
            Active
          </>
        ) : (
          <>
            <XCircleIcon className="mr-1 h-3 w-3" />
            Inactive
          </>
        )}
      </span>
    );
  };

  const columns: Column<Customer>[] = [
    {
      key: 'meter_number',
      label: 'No. Meter',
      sortable: true,
    },
    {
      key: 'name',
      label: 'Nama',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      hideOnMobile: true,
    },
    {
      key: 'phone',
      label: 'Telepon',
      hideOnMobile: true,
    },
    {
      key: 'subscription',
      label: 'Golongan',
      sortable: true,
      render: (_value: unknown, item: Customer) => item.subscription?.name || '-',
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (isActive: unknown) => getStatusBadge(Boolean(isActive)),
    },
  ];

  const actions = (customer: Customer) => (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <ActionIconButton
        icon={EyeIcon}
        label={`Lihat detail pelanggan ${customer.name}`}
        tone="blue"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          navigate(`/admin/customers/${customer.id}`);
        }}
      />
      <ActionIconButton
        icon={PencilIcon}
        label={`Ubah pelanggan ${customer.name}`}
        tone="gray"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          navigate(`/admin/customers/${customer.id}/edit`);
        }}
      />
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleStatusChange(customer.id, !customer.is_active);
        }}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          customer.is_active ? 'bg-green-600' : 'bg-gray-300'
        }`}
        title={customer.is_active ? 'Aktif - klik untuk nonaktifkan' : 'Nonaktif - klik untuk aktifkan'}
        aria-label={`${customer.is_active ? 'Nonaktifkan' : 'Aktifkan'} pelanggan ${customer.name}`}
        aria-pressed={customer.is_active}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            customer.is_active ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  const activeCustomers = customers.filter((customer) => customer.is_active).length;
  const inactiveCustomers = customers.length - activeCustomers;
  const usedSubscriptions = new Set(customers.map((customer) => customer.subscription?.id).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pelanggan"
        subtitle="Kelola pelanggan dari daftar yang lebih mudah dibaca di layar kecil, lengkap dengan filter dan aksi cepat."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:w-auto"
            >
              <FunnelIcon className="mr-2 h-4 w-4" />
              {showFilters ? 'Tutup Filter' : 'Filter'}
            </button>
            <button
              onClick={handleExport}
              className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:w-auto"
            >
              <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
              Ekspor
            </button>
            <button
              onClick={() => navigate('/admin/customers/bulk-import')}
              className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:w-auto"
            >
              <ArrowUpTrayIcon className="mr-2 h-4 w-4" />
              Import Massal
            </button>
            <button
              onClick={() => navigate('/admin/customers/new')}
              className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 sm:w-auto"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Tambah Pelanggan
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Pelanggan tampil"
          value={loading ? '...' : customers.length.toLocaleString('id-ID')}
          helper={hasActiveFilters ? 'Daftar sedang difilter' : 'Semua data pada halaman'}
          subtitle="Jumlah pelanggan yang sedang tampil pada daftar aktif saat ini."
          icon={CheckCircleIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Pelanggan aktif"
          value={loading ? '...' : activeCustomers.toLocaleString('id-ID')}
          subtitle="Memudahkan pemantauan pelanggan yang masih aktif menerima layanan."
          icon={CheckCircleIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Pelanggan nonaktif"
          value={loading ? '...' : inactiveCustomers.toLocaleString('id-ID')}
          subtitle="Cocok untuk meninjau akun yang perlu diaktifkan kembali atau diverifikasi."
          icon={XCircleIcon}
          tone="yellow"
        />
        <DashboardStatCard
          title="Golongan terpakai"
          value={loading ? '...' : usedSubscriptions.toLocaleString('id-ID')}
          subtitle="Menunjukkan berapa golongan langganan yang sedang dipakai pada hasil daftar."
          icon={FunnelIcon}
          tone="cyan"
        />
      </div>

      {showFilters && (
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Filter pelanggan</h2>
              <p className="mt-1 text-sm text-gray-500">
                Saring data berdasarkan status, golongan, saldo, atau kata kunci pencarian.
              </p>
            </div>
            {hasActiveFilters && (
              <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                Filter aktif
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <label htmlFor="filter-status-pelanggan" className="block text-sm font-medium text-gray-700">Status</label>
              <select
                id="filter-status-pelanggan"
                value={filters.isActive === '' ? '' : filters.isActive ? 'active' : 'inactive'}
                onChange={(e) => setFilters({ ...filters, isActive: e.target.value === '' ? '' : e.target.value === 'active' })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Semua status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
          
            <div>
              <label htmlFor="filter-tipe-langganan" className="block text-sm font-medium text-gray-700">Tipe langganan</label>
              <select
                id="filter-tipe-langganan"
                value={filters.subscriptionTypeId}
                onChange={(e) => setFilters({ ...filters, subscriptionTypeId: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Semua tipe</option>
                {subscriptionTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                  </option>
                ))}
              </select>
            </div>
          
            <div>
              <label htmlFor="filter-saldo-tertunggak" className="block text-sm font-medium text-gray-700">Saldo tertunggak</label>
              <select
                id="filter-saldo-tertunggak"
                value={filters.hasOutstandingBalance}
                onChange={(e) => setFilters({ ...filters, hasOutstandingBalance: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Semua</option>
                <option value="true">Ada tunggakan</option>
                <option value="false">Tanpa tunggakan</option>
              </select>
            </div>
          
            <div>
              <label htmlFor="filter-pencarian-pelanggan" className="block text-sm font-medium text-gray-700">Pencarian</label>
              <input
                id="filter-pencarian-pelanggan"
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Nama, email, telepon..."
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => setFilters({
                isActive: '' as boolean | '',
                subscriptionTypeId: '',
                hasOutstandingBalance: '',
                search: '',
              })}
              className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
            >
              Atur ulang filter
            </button>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <DataTable
          data={customers}
          columns={columns}
          actions={actions}
          loading={loading}
          searchable={false}
          pageSize={10}
          emptyMessage="Belum ada pelanggan yang sesuai dengan filter"
          onRowClick={(customer) => navigate(`/admin/customers/${customer.id}`)}
        />
      </div>
    </div>
  );
}
