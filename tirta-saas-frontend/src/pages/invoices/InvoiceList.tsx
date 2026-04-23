import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import { DataTable, type Column } from '../../components/DataTable';
import invoiceService, { type InvoiceFilters } from '../../services/invoiceService';
import type { Invoice } from '../../types/invoice';
import { useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';
import { DashboardStatCard, PageHeader } from '../../components';
import { exportToCSV, exportToExcel, formatIDR } from '../../utils/exportUtils';
import { thermalPrinterService } from '../../services/thermalPrinterService';

export default function InvoiceList() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [invoices, setTagihan] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<InvoiceFilters['status'] | ''>('');
  const [filterType, setFilterType] = useState<InvoiceFilters['type'] | ''>('');

  const hasActiveFilters = searchTerm !== '' || filterStatus !== '' || filterType !== '';

  const fetchTagihan = useCallback(async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getTagihan(currentPage, 100, {
        search: searchTerm || undefined,
        status: filterStatus || undefined,
        type: filterType || undefined,
      });
      setTagihan(response.data);
    } catch {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch invoices',
      }));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterStatus, filterType, dispatch]);

  useEffect(() => {
    fetchTagihan();
  }, [fetchTagihan]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterType('');
  };

  const handleExport = (format: 'csv' | 'excel') => {
    const rows = invoices.map((inv) => ({
      'Invoice #': inv.invoiceNumber,
      'Customer': inv.customerName,
      'Type': inv.billingPeriod ? 'Monthly' : 'Registration',
      'Billing Period': inv.billingPeriod || '',
      'Amount (IDR)': inv.totalAmount,
      'Amount': formatIDR(inv.totalAmount),
      'Amount Due (IDR)': inv.amountDue,
      'Amount Due': formatIDR(inv.amountDue),
      'Due Date': inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('id-ID') : '',
      'Status': inv.status,
    }));
    const baseName = `invoices_${new Date().toISOString().split('T')[0]}`;
    if (format === 'csv') {
      exportToCSV(rows, `${baseName}.csv`);
    } else {
      exportToExcel([{ sheetName: 'Tagihan', data: rows }], `${baseName}.xlsx`);
    }
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig: Record<Invoice['status'], { color: string }> = {
      paid: { color: 'bg-green-100 text-green-800' },
      unpaid: { color: 'bg-yellow-100 text-yellow-800' },
      overdue: { color: 'bg-red-100 text-red-800' },
      partial: { color: 'bg-blue-100 text-blue-800' },
    };

    const config = statusConfig[status] || statusConfig.unpaid;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const columns: Column<Invoice>[] = [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      sortable: true,
    },
    {
      key: 'customerName',
      label: 'Customer',
      sortable: true,
    },
    {
      key: 'billingPeriod',
      label: 'Type',
      sortable: true,
      render: (billingPeriod: unknown) => {
        const billingPeriodValue = typeof billingPeriod === 'string' ? billingPeriod : '';
        const type = billingPeriodValue ? 'Monthly' : 'Registration';
        const color = billingPeriodValue ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
            {type}
          </span>
        );
      },
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (amount: unknown) => {
        const amountValue = typeof amount === 'number' ? amount : 0;
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(amountValue);
      },
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      hideOnMobile: true,
      render: (dueDate: unknown) => {
        return typeof dueDate === 'string' && dueDate ? new Date(dueDate).toLocaleDateString('id-ID') : 'N/A';
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status: unknown) => getStatusBadge((status as Invoice['status']) || 'unpaid'),
    },
  ];

  const actions = (invoice: Invoice) => (
    <div className="flex items-center justify-end gap-2 print:hidden">
      <button
        onClick={() => navigate(`/admin/invoices/${invoice.id}`)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 text-blue-600 transition hover:bg-blue-50"
        title="Lihat detail"
      >
        <EyeIcon className="h-5 w-5" />
      </button>
    </div>
  );

  const totalOutstanding = invoices.reduce((sum, invoice) => sum + (invoice.amountDue || 0), 0);
  const overdueCount = invoices.filter((invoice) => invoice.status === 'overdue').length;
  const paidCount = invoices.filter((invoice) => invoice.status === 'paid').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tagihan"
        subtitle="Pantau tagihan pelanggan dengan ringkasan cepat, filter yang ringkas, dan daftar yang tetap nyaman di layar kecil."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
            <button
              onClick={() => navigate('/admin/invoices/bulk-generate')}
              className="print:hidden inline-flex w-full items-center justify-center rounded-md border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm hover:bg-blue-50 sm:w-auto"
            >
              <DocumentTextIcon className="mr-2 h-4 w-4" />
              Generate Massal
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="print:hidden inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:w-auto"
            >
              <ArrowDownTrayIcon className="mr-1 h-4 w-4" />
              CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="print:hidden inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:w-auto"
            >
              <ArrowDownTrayIcon className="mr-1 h-4 w-4" />
              Excel
            </button>
            <button
              onClick={() => thermalPrinterService.printPage()}
              className="print:hidden inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:w-auto"
            >
              <PrinterIcon className="mr-1 h-4 w-4" />
              Print
            </button>
            <button
              onClick={() => navigate('/admin/invoices/new')}
              className="print:hidden inline-flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 sm:w-auto"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Buat Tagihan
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Tagihan tampil"
          value={loading ? '...' : invoices.length.toLocaleString('id-ID')}
          helper={hasActiveFilters ? 'Daftar sedang difilter' : 'Semua item pada daftar'}
          subtitle="Jumlah tagihan yang sedang tampil sesuai filter aktif saat ini."
          icon={DocumentTextIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Total outstanding"
          value={loading ? '...' : formatIDR(totalOutstanding)}
          subtitle="Ringkasan sisa tagihan yang masih perlu ditagih dari daftar saat ini."
          icon={PrinterIcon}
          tone="yellow"
        />
        <DashboardStatCard
          title="Tagihan overdue"
          value={loading ? '...' : overdueCount.toLocaleString('id-ID')}
          subtitle="Gunakan angka ini untuk menentukan prioritas penagihan pelanggan."
          icon={XMarkIcon}
          tone="purple"
        />
        <DashboardStatCard
          title="Tagihan lunas"
          value={loading ? '...' : paidCount.toLocaleString('id-ID')}
          subtitle="Membantu melihat pembayaran yang sudah selesai pada daftar aktif."
          icon={EyeIcon}
          tone="green"
        />
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm print:hidden sm:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Filter tagihan</h2>
            <p className="mt-1 text-sm text-gray-500">
              Cari tagihan berdasarkan pelanggan, status pembayaran, atau tipe invoice.
            </p>
          </div>
          {hasActiveFilters && (
            <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              Filter aktif
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nomor invoice atau pelanggan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as InvoiceFilters['status'] | '')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Semua status</option>
              <option value="unpaid">Belum bayar</option>
              <option value="paid">Lunas</option>
              <option value="overdue">Terlambat</option>
              <option value="partial">Parsial</option>
            </select>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as InvoiceFilters['type'] | '')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Semua tipe</option>
              <option value="monthly">Bulanan</option>
              <option value="registration">Registrasi</option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 sm:flex-shrink-0"
                title="Reset filter"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable
          data={invoices}
          columns={columns}
          actions={actions}
          loading={loading}
          searchable={false}
          pageSize={10}
          emptyMessage="Belum ada tagihan yang sesuai dengan filter"
          onRowClick={(invoice) => navigate(`/admin/invoices/${invoice.id}`)}
        />
      </div>
    </div>
  );
}
