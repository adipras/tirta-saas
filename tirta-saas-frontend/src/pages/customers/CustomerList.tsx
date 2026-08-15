import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  PencilIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
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
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  
  const [filters, setFilters] = useState({
    isActive: '' as boolean | '',
    subscriptionTypeId: '',
    search: '',
  });
  const hasActiveFilters =
    filters.isActive !== '' ||
    filters.subscriptionTypeId !== '' ||
    filters.search.trim() !== '';

  const fetchPelanggan = useCallback(async () => {
    try {
      setLoading(true);
      const response = await customerService.getPelanggan(1, 1000);
      setPelanggan(response.data);
    } catch {
      toast.error('Gagal memuat daftar pelanggan');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPelanggan();
  }, [fetchPelanggan]);

  useEffect(() => {
    fetchSubscriptionTypes();
  }, []);

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
        search: filters.search.trim() || undefined,
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
      key: 'service_area_name',
      label: 'Area Layanan',
      render: (_value: unknown, item: Customer) => item.service_area_name || '-',
      hideOnMobile: true,
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

  const filteredCustomers = useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();

    return customers.filter((customer) => {
      if (filters.isActive !== '' && customer.is_active !== filters.isActive) {
        return false;
      }

      if (
        filters.subscriptionTypeId &&
        customer.subscription?.id !== filters.subscriptionTypeId
      ) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const searchableValues = [
        customer.name,
        customer.email,
        customer.phone,
        customer.address,
        customer.subscription?.name,
        customer.service_area_name,
      ];

      return searchableValues.some((value) =>
        (value || '').toLowerCase().includes(keyword)
      );
    });
  }, [customers, filters]);

  const activeCustomers = filteredCustomers.filter((customer) => customer.is_active).length;
  const inactiveCustomers = filteredCustomers.length - activeCustomers;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pelanggan"
        subtitle="Kelola data pelanggan dengan pencarian cepat dan filter yang ringkas."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardStatCard
          title="Total Pelanggan"
          value={loading ? '...' : filteredCustomers.length.toLocaleString('id-ID')}
          helper={hasActiveFilters ? 'Hasil filter aktif' : undefined}
          icon={CheckCircleIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Aktif"
          value={loading ? '...' : activeCustomers.toLocaleString('id-ID')}
          icon={CheckCircleIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Nonaktif"
          value={loading ? '...' : inactiveCustomers.toLocaleString('id-ID')}
          icon={XCircleIcon}
          tone="yellow"
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-1">
            <label htmlFor="filter-pencarian-pelanggan" className="block text-sm font-medium text-gray-700">Pencarian</label>
            <div className="relative mt-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="filter-pencarian-pelanggan"
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Nama, email, telepon, alamat..."
                className="block w-full rounded-md border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="filter-status-pelanggan" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="filter-status-pelanggan"
              value={filters.isActive === '' ? '' : filters.isActive ? 'active' : 'inactive'}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value === '' ? '' : e.target.value === 'active' })}
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="">Semua status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
          <div>
            <label htmlFor="filter-tipe-langganan" className="block text-sm font-medium text-gray-700">Golongan</label>
            <select
              id="filter-tipe-langganan"
              value={filters.subscriptionTypeId}
              onChange={(e) => setFilters({ ...filters, subscriptionTypeId: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="">Semua golongan</option>
              {subscriptionTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => setFilters({
                isActive: '' as boolean | '',
                subscriptionTypeId: '',
                search: '',
              })}
              className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
            >
              Atur ulang filter
            </button>
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable
          data={filteredCustomers}
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
