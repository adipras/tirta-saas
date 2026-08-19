import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  BeakerIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { usageService } from '../../services/usageService';
import { customerService } from '../../services/customerService';
import type { WaterPemakaian, WaterPemakaianFilters } from '../../types/usage';
import type { Customer } from '../../types/customer';
import { ActionIconButton, DashboardStatCard, PageHeader, ConfirmModal } from '../../components';
import { useToast } from '../../components';

const PAGE_SIZE = 10;

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const formatMonth = (month: string | undefined): string => {
  if (!month) return '-';
  const [year, monthNum] = month.split('-');
  return new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
};

function groupByCustomer(records: WaterPemakaian[]): { customerId: string; customer: WaterPemakaian['customer']; items: WaterPemakaian[] }[] {
  const map = new Map<string, { customer: WaterPemakaian['customer']; items: WaterPemakaian[] }>();
  for (const r of records) {
    if (!map.has(r.customerId)) map.set(r.customerId, { customer: r.customer, items: [] });
    map.get(r.customerId)!.items.push(r);
  }
  return Array.from(map.entries()).map(([customerId, v]) => ({ customerId, ...v }));
}

export default function PemakaianList() {
  const navigate = useNavigate();
  const toast = useToast();

  const [waterPemakaians, setWaterPemakaians] = useState<WaterPemakaian[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [filters, setFilters] = useState<WaterPemakaianFilters>({ customerId: undefined, usageMonth: undefined });
  const hasActiveFilters = Boolean(filters.customerId || filters.usageMonth);

  const [customerQuery, setCustomerQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerSearchRef = useRef<HTMLDivElement>(null);

  const selectedCustomer = customers.find(c => c.id === filters.customerId) ?? null;
  const filteredCustomers = customerQuery.trim() === ''
    ? customers.slice(0, 30)
    : customers.filter(c => {
        const q = customerQuery.toLowerCase();
        const meter = c.meters?.[0]?.meter_number ?? '';
        return c.name.toLowerCase().includes(q) || meter.toLowerCase().includes(q);
      }).slice(0, 30);

  const fetchWaterPemakaians = useCallback(async () => {
    try {
      setLoading(true);
      const response = await usageService.getWaterPemakaians(currentPage, PAGE_SIZE, filters);
      setWaterPemakaians(response.data);
      setTotalPages(response.totalPages || 1);
      setTotalItems(response.total || response.data.length);
    } catch {
      toast.error('Gagal memuat data pemakaian air');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, toast]);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await customerService.getPelanggan(1, 1000, { isActive: true });
      setCustomers(response.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchWaterPemakaians(); }, [fetchWaterPemakaians]);
  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDelete = (id: string) => setDeleteTarget(id);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await usageService.deleteWaterPemakaian(deleteTarget);
      toast.success('Data pemakaian air berhasil dihapus');
      setDeleteTarget(null);
      fetchWaterPemakaians();
    } catch {
      toast.error('Gagal menghapus data pemakaian air');
    }
  };

  const selectCustomer = (customer: Customer | null) => {
    setFilters(prev => ({ ...prev, customerId: customer?.id }));
    setCustomerQuery(customer ? customer.name : '');
    setShowCustomerDropdown(false);
    setCurrentPage(1);
  };

  const clearCustomerFilter = () => {
    setFilters(prev => ({ ...prev, customerId: undefined }));
    setCustomerQuery('');
    setCurrentPage(1);
  };

  const handleMonthChange = (value: string) => {
    setFilters(prev => ({ ...prev, usageMonth: value === '' ? undefined : value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ customerId: undefined, usageMonth: undefined });
    setCustomerQuery('');
    setCurrentPage(1);
  };

  const totalPemakaian = waterPemakaians.reduce((sum, u) => sum + u.usageM3, 0);
  const totalAmount = waterPemakaians.reduce((sum, u) => sum + u.amountCalculated, 0);
  const anomaliesCount = waterPemakaians.filter(u => u.isAnomaly).length;
  const grouped = groupByCustomer(waterPemakaians);

  const pageStart = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, totalItems);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pemakaian Air"
        subtitle="Pantau pencatatan meter, nominal pemakaian, dan anomali per pelanggan."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <DashboardStatCard
          title="Total data"
          value={loading ? '—' : totalItems.toLocaleString('id-ID')}
          helper={hasActiveFilters ? 'Difilter' : 'Semua'}
          subtitle="Jumlah catatan sesuai filter."
          icon={BeakerIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Total pemakaian"
          value={loading ? '—' : `${totalPemakaian.toFixed(2)} m³`}
          subtitle="Akumulasi pemakaian halaman ini."
          icon={ChartBarIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Total nominal"
          value={loading ? '—' : formatCurrency(totalAmount)}
          subtitle="Ringkasan nominal halaman ini."
          icon={CurrencyDollarIcon}
          tone="purple"
        />
        <DashboardStatCard
          title="Anomali"
          value={loading ? '—' : anomaliesCount.toLocaleString('id-ID')}
          subtitle="Indikasi anomali pada halaman ini."
          icon={ExclamationTriangleIcon}
          tone={anomaliesCount > 0 ? 'red' : 'yellow'}
        />
      </div>

      {/* Toolbar */}
      <div className="card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          {/* Customer search */}
          <div className="flex-1 min-w-0" ref={customerSearchRef}>
            <label className="mb-1.5 block text-[12px] font-medium text-surface-500">Cari Pelanggan</label>
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                value={selectedCustomer ? selectedCustomer.name : customerQuery}
                onChange={(e) => {
                  setCustomerQuery(e.target.value);
                  if (filters.customerId) setFilters(prev => ({ ...prev, customerId: undefined }));
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                placeholder="Nama atau nomor meter..."
                className="input-base pl-9"
              />
              {(filters.customerId || customerQuery) && (
                <button
                  type="button"
                  onClick={clearCustomerFilter}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                  aria-label="Hapus filter pelanggan"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
              {showCustomerDropdown && (
                <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-surface-200 bg-white py-1 shadow-dropdown text-[13px]">
                  <li>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-surface-500 hover:bg-surface-50 italic"
                      onMouseDown={() => selectCustomer(null)}
                    >
                      Semua pelanggan
                    </button>
                  </li>
                  {filteredCustomers.length === 0 ? (
                    <li className="px-3 py-2 text-surface-400">Tidak ditemukan</li>
                  ) : (
                    filteredCustomers.map(c => (
                      <li key={c.id}>
                        <button
                          type="button"
                          className={`w-full px-3 py-2 text-left hover:bg-brand-50 ${filters.customerId === c.id ? 'bg-brand-50 font-medium text-brand-700' : 'text-surface-900'}`}
                          onMouseDown={() => selectCustomer(c)}
                        >
                          <span className="block truncate">{c.name}</span>
                          <span className="text-[11px] text-surface-400">
                            {c.meters?.[0]?.meter_number ?? 'No meter'}
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>

          {/* Month filter */}
          <div className="w-full sm:w-44">
            <label className="mb-1.5 block text-[12px] font-medium text-surface-500">Periode</label>
            <input
              type="month"
              value={filters.usageMonth || ''}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="input-base"
            />
          </div>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="btn-ghost whitespace-nowrap"
            >
              <XMarkIcon className="h-4 w-4" />
              Reset
            </button>
          )}

          <div className="flex gap-2 sm:ml-auto">
            <button
              type="button"
              onClick={() => navigate('/admin/usage/bulk-import')}
              className="btn-secondary whitespace-nowrap"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              Import
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/usage/create')}
              className="btn-primary whitespace-nowrap"
            >
              <PlusIcon className="h-4 w-4" />
              Tambah
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.customerId && selectedCustomer && (
              <span className="badge-info">
                <UserIcon className="h-3 w-3" />
                {selectedCustomer.name}
                <button type="button" onClick={clearCustomerFilter} className="ml-1 hover:text-info-900">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.usageMonth && (
              <span className="badge-success">
                {formatMonth(filters.usageMonth)}
                <button type="button" onClick={() => handleMonthChange('')} className="ml-1 hover:text-success-900">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Grouped list */}
      <div className="space-y-3">
        {loading ? (
          <div className="card p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-surface-200 border-t-brand-600" />
            <p className="mt-3 text-[13px] text-surface-400">Memuat data...</p>
          </div>
        ) : grouped.length === 0 ? (
          <div className="card p-12 text-center">
            <BeakerIcon className="mx-auto h-10 w-10 text-surface-300" />
            <p className="mt-3 text-sm font-medium text-surface-500">Belum ada data pemakaian</p>
            <p className="mt-1 text-[12px] text-surface-400">Tidak ada data yang sesuai dengan filter.</p>
          </div>
        ) : (
          grouped.map(({ customerId, customer, items }) => (
            <div key={customerId} className="card overflow-hidden">
              {/* Customer group header */}
              <div
                className="flex cursor-pointer items-center gap-3 border-b border-surface-100 bg-surface-50/80 px-4 py-3 transition-colors hover:bg-surface-100"
                onClick={() => navigate(`/admin/usage/${customerId}/history`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/admin/usage/${customerId}/history`)}
                aria-label={`Lihat riwayat pemakaian ${customer?.name ?? customerId}`}
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 ring-1 ring-brand-100">
                  <UserIcon className="h-4 w-4 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[13px] font-semibold text-surface-900">{customer?.name ?? '-'}</p>
                  <p className="truncate text-[11px] text-surface-400">
                    {customer?.customerId ? `ID: ${customer.customerId}` : ''}
                    {customer?.meterNumber ? ` • Meter: ${customer.meterNumber}` : ''}
                    {customer?.address ? ` • ${customer.address}` : ''}
                  </p>
                </div>
                <span className="badge-primary">
                  {items.length} catatan
                </span>
              </div>

              {/* Records table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-surface-100 text-[13px]">
                  <thead>
                    <tr className="bg-white">
                      <th className="hidden px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-surface-500 sm:table-cell">Meter</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-surface-500">Periode</th>
                      <th className="hidden px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-surface-500 sm:table-cell">Awal</th>
                      <th className="hidden px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-surface-500 sm:table-cell">Akhir</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-surface-500">Pemakaian</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-surface-500">Nominal</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-surface-500">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-50">
                    {items.map(row => (
                      <tr key={row.id} className="transition-colors hover:bg-surface-50/50">
                        <td className="hidden px-4 py-3 sm:table-cell">
                          <span className="font-mono text-surface-700">{row.customer?.meterNumber || '—'}</span>
                          {row.customer?.meterLocationName && (
                            <span className="ml-1 text-[11px] text-surface-400">({row.customer.meterLocationName})</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-surface-900 whitespace-nowrap">
                          {formatMonth(row.usageMonth)}
                        </td>
                        <td className="hidden px-4 py-3 text-right font-mono text-surface-600 sm:table-cell">
                          {(row.meterStart ?? 0).toFixed(2)}
                        </td>
                        <td className="hidden px-4 py-3 text-right font-mono text-surface-600 sm:table-cell">
                          {(row.meterEnd ?? 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="font-medium text-surface-900">{(row.usageM3 ?? 0).toFixed(2)} m³</span>
                          {row.isAnomaly && (
                            <ExclamationTriangleIcon
                              className="ml-1.5 inline h-4 w-4 text-warning-500"
                              title="Terdeteksi anomali"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap text-surface-600">
                          {formatCurrency(row.amountCalculated)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <ActionIconButton
                              icon={ChartBarIcon}
                              label={`Riwayat ${row.customer?.name ?? ''}`}
                              tone="purple"
                              variant="ghost"
                              onClick={() => navigate(`/admin/usage/${row.customerId}/history`)}
                            />
                            <ActionIconButton
                              icon={PencilIcon}
                              label={`Ubah ${row.customer?.name ?? ''}`}
                              tone="brand"
                              variant="ghost"
                              onClick={() => navigate(`/admin/usage/edit/${row.id}`)}
                            />
                            <ActionIconButton
                              icon={TrashIcon}
                              label={`Hapus ${row.customer?.name ?? ''}`}
                              tone="red"
                              variant="ghost"
                              onClick={() => handleDelete(row.id)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && totalItems > 0 && (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-[13px] text-surface-500">
            Menampilkan <span className="font-medium text-surface-700">{pageStart}–{pageEnd}</span> dari{' '}
            <span className="font-medium text-surface-700">{totalItems.toLocaleString('id-ID')}</span> catatan
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 disabled:opacity-30"
              aria-label="Sebelumnya"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === 'ellipsis' ? (
                  <span key={`e${i}`} className="px-1 text-surface-300">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p as number)}
                    className={`min-w-[32px] rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                      currentPage === p
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-surface-500 hover:bg-surface-100 hover:text-surface-700'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 disabled:opacity-30"
              aria-label="Berikutnya"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Hapus Data Pemakaian"
        message="Apakah kamu yakin ingin menghapus data pemakaian air ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
}
