import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EyeIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PrinterIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { DataTable, type Column } from '../../components/DataTable';
import invoiceService, { type InvoiceFilters } from '../../services/invoiceService';
import type { Invoice, InvoiceListStats } from '../../types/invoice';
import { ActionIconButton, DashboardStatCard, PageHeader } from '../../components';
import { formatIDR } from '../../utils/exportUtils';
import { useToast } from '../../components';

const STATUS_LABELS: Record<Invoice['status'], string> = {
  paid: 'Lunas',
  unpaid: 'Belum bayar',
  partial: 'Parsial',
  overdue: 'Terlambat',
};

const STATUS_BADGE_CLASSES: Record<Invoice['status'], string> = {
  paid: 'bg-green-100 text-green-800',
  unpaid: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-blue-100 text-blue-800',
  overdue: 'bg-red-100 text-red-800',
};

const EMPTY_STATS: InvoiceListStats = {
  totalInvoices: 0,
  paidCount: 0,
  unpaidCount: 0,
  partialCount: 0,
  overdueCount: 0,
  openCount: 0,
  totalAmount: 0,
  outstandingAmount: 0,
};

const normalizeStats = (stats?: Partial<InvoiceListStats> | null): InvoiceListStats => ({
  totalInvoices: Number(stats?.totalInvoices ?? 0),
  paidCount: Number(stats?.paidCount ?? 0),
  unpaidCount: Number(stats?.unpaidCount ?? 0),
  partialCount: Number(stats?.partialCount ?? 0),
  overdueCount: Number(stats?.overdueCount ?? 0),
  openCount: Number(stats?.openCount ?? 0),
  totalAmount: Number(stats?.totalAmount ?? 0),
  outstandingAmount: Number(stats?.outstandingAmount ?? 0),
});

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export default function InvoiceList() {
  const navigate = useNavigate();
  const toast = useToast();

  const [invoices, setTagihan] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceListStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<InvoiceFilters['status'] | ''>('');
  const [filterType, setFilterType] = useState<InvoiceFilters['type'] | ''>('');
  const [filterBulan, setFilterBulan] = useState('');

  const hasActiveFilters = searchTerm !== '' || filterStatus !== '' || filterType !== '' || filterBulan !== '';

  const fetchTagihan = useCallback(async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getTagihan(1, 100, {
        search: searchTerm || undefined,
        status: filterStatus || undefined,
        type: filterType || undefined,
        usageMonth: filterBulan || undefined,
      });
      setTagihan(response.data);
      setStats(normalizeStats(response.stats));
    } catch {
      toast.error('Gagal memuat data tagihan');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType, filterBulan, searchTerm, toast]);

  useEffect(() => {
    fetchTagihan();
  }, [fetchTagihan]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterType('');
    setFilterBulan('');
  };

  const handlePrintFilteredList = () => {
    if (invoices.length === 0) {
      toast.error('Tidak ada data tagihan untuk dicetak');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      toast.error('Popup diblokir browser. Izinkan popup untuk mencetak daftar tagihan.');
      return;
    }

    const filterSummary = [
      filterBulan ? `Bulan: ${new Date(filterBulan + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}` : null,
      searchTerm ? `Pencarian: ${searchTerm}` : null,
      filterStatus ? `Status: ${STATUS_LABELS[filterStatus]}` : null,
      filterType
        ? `Tipe: ${filterType === 'monthly' ? 'Bulanan' : filterType === 'registration' ? 'Registrasi' : 'Manual'}`
        : null,
    ].filter(Boolean);

    const printTitle = filterBulan
      ? `Daftar Tagihan — ${new Date(filterBulan + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}`
      : 'Daftar Tagihan';

    const rows = invoices.map((invoice, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(invoice.invoiceNumber || '-')}</td>
        <td>${escapeHtml(invoice.meterNumber || '-')}</td>
        <td>${escapeHtml(invoice.customerName || '-')}</td>
        <td>${escapeHtml(invoice.customer?.address || '-')}</td>
        <td>${escapeHtml(invoice.billingPeriod || (invoice.type === 'registration' ? 'Registrasi' : 'Manual'))}</td>
        <td>${escapeHtml(invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('id-ID') : '-')}</td>
        <td style="text-align:right;">${escapeHtml(formatIDR(invoice.totalAmount))}</td>
        <td style="text-align:right;">${escapeHtml(formatIDR(invoice.amountPaid))}</td>
        <td style="text-align:right;">${escapeHtml(formatIDR(invoice.amountDue))}</td>
        <td>${escapeHtml(STATUS_LABELS[invoice.status])}</td>
      </tr>
    `).join('');

    const html = `
      <!doctype html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(printTitle)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
            h1 { margin: 0 0 8px; font-size: 24px; }
            p { margin: 4px 0; color: #4b5563; }
            .summary { margin: 20px 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
            .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 14px; }
            .card-label { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
            .card-value { font-size: 18px; font-weight: 700; color: #111827; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #d1d5db; padding: 10px 12px; font-size: 13px; }
            th { background: #f3f4f6; text-align: left; }
            .meta { margin-top: 12px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(printTitle)}</h1>
          <p>Dicetak pada ${new Date().toLocaleString('id-ID')}</p>
          <p>${filterSummary.length > 0 ? escapeHtml(filterSummary.join(' | ')) : 'Tanpa filter tambahan'}</p>

          <div class="summary">
            <div class="card">
              <div class="card-label">Total nominal</div>
              <div class="card-value">${escapeHtml(formatIDR(stats.totalAmount))}</div>
            </div>
            <div class="card">
              <div class="card-label">Belum lunas</div>
              <div class="card-value">${stats.openCount.toLocaleString('id-ID')}</div>
            </div>
            <div class="card">
              <div class="card-label">Terlambat</div>
              <div class="card-value">${stats.overdueCount.toLocaleString('id-ID')}</div>
            </div>
            <div class="card">
              <div class="card-label">Lunas</div>
              <div class="card-value">${stats.paidCount.toLocaleString('id-ID')}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Nomor Invoice</th>
                <th>Nomor Meter</th>
                <th>Pelanggan</th>
                <th>Alamat</th>
                <th>Periode</th>
                <th>Jatuh Tempo</th>
                <th>Total Tagihan</th>
                <th>Sudah Dibayar</th>
                <th>Sisa Tagihan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <p class="meta">Dokumen ini mencetak hasil daftar tagihan sesuai filter aktif, bukan tampilan halaman admin.</p>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const getStatusBadge = (status: Invoice['status']) => (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );

  const columns: Column<Invoice>[] = [
    {
      key: 'meterNumber',
      label: 'Nomor Meter',
      sortable: true,
      render: (value: unknown, invoice: Invoice) => {
        const meterNumber = typeof value === 'string' && value ? value : invoice.customer?.meterNumber || '-';
        return meterNumber;
      },
    },
    {
      key: 'customerName',
      label: 'Pelanggan',
      sortable: true,
      render: (value: unknown) => typeof value === 'string' && value ? value : '-',
    },
    {
      key: 'totalAmount',
      label: 'Nominal',
      sortable: true,
      render: (value: unknown) => formatIDR(typeof value === 'number' ? value : 0),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: unknown) => getStatusBadge((value as Invoice['status']) || 'unpaid'),
    },
  ];

  const actions = (invoice: Invoice) => (
    <div className="flex items-center justify-end gap-2 print:hidden">
      <ActionIconButton
        icon={EyeIcon}
        label={`Lihat detail tagihan ${invoice.invoiceNumber}`}
        tone="blue"
        onClick={() => navigate(`/admin/invoices/${invoice.id}`)}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tagihan"
        subtitle="Kelola daftar tagihan air dengan filter yang ringkas, statistik yang konsisten, dan cetak daftar sesuai hasil filter."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
            <button
              onClick={() => navigate('/admin/invoices/bulk-generate')}
              className="inline-flex w-full items-center justify-center rounded-md border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm hover:bg-blue-50 sm:w-auto"
            >
              <DocumentTextIcon className="mr-2 h-4 w-4" />
              Buat Tagihan Air
            </button>
            <button
              onClick={() => navigate('/admin/invoices/new')}
              className="inline-flex w-full items-center justify-center rounded-md border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 sm:w-auto"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Buat Tagihan
            </button>
            <button
              onClick={handlePrintFilteredList}
              className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:w-auto"
            >
              <PrinterIcon className="mr-1 h-4 w-4" aria-hidden="true" />
              Cetak
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Total nominal"
          value={loading ? '...' : formatIDR(stats.totalAmount)}
          subtitle="Akumulasi nominal seluruh tagihan yang cocok dengan filter aktif."
          icon={DocumentTextIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Belum lunas"
          value={loading ? '...' : stats.openCount.toLocaleString('id-ID')}
          subtitle="Mencakup tagihan belum bayar, parsial, dan yang sudah lewat jatuh tempo."
          icon={MagnifyingGlassIcon}
          tone="yellow"
        />
        <DashboardStatCard
          title="Terlambat"
          value={loading ? '...' : stats.overdueCount.toLocaleString('id-ID')}
          subtitle="Jumlah tagihan yang sudah lewat jatuh tempo dan masih punya sisa pembayaran."
          icon={XMarkIcon}
          tone="purple"
        />
        <DashboardStatCard
          title="Lunas"
          value={loading ? '...' : stats.paidCount.toLocaleString('id-ID')}
          subtitle="Jumlah tagihan yang sudah lunas penuh dari hasil filter yang sedang aktif."
          icon={EyeIcon}
          tone="green"
        />
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm print:hidden sm:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Filter tagihan</h2>
            <p className="mt-1 text-sm text-gray-500">
              Cari berdasarkan nomor invoice, pelanggan, atau nomor meter. Statistik dan hasil cetak mengikuti filter ini.
            </p>
          </div>
          {hasActiveFilters && (
            <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              Filter aktif
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <label htmlFor="invoice-search" className="sr-only">
              Cari nomor invoice, pelanggan, atau nomor meter
            </label>
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              id="invoice-search"
              type="text"
              placeholder="Cari nomor invoice, pelanggan, atau nomor meter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="invoice-filter-bulan" className="sr-only">Filter bulan tagihan</label>
            <input
              id="invoice-filter-bulan"
              type="month"
              value={filterBulan}
              onChange={(e) => setFilterBulan(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Pilih bulan"
            />
          </div>
          <div>
            <label htmlFor="invoice-filter-status" className="sr-only">Filter status tagihan</label>
            <select
              id="invoice-filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as InvoiceFilters['status'] | '')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Semua status</option>
              <option value="unpaid">Belum bayar</option>
              <option value="partial">Parsial</option>
              <option value="overdue">Terlambat</option>
              <option value="paid">Lunas</option>
            </select>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <label htmlFor="invoice-filter-type" className="sr-only">Filter tipe tagihan</label>
            <select
              id="invoice-filter-type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as InvoiceFilters['type'] | '')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Semua tipe</option>
              <option value="monthly">Bulanan</option>
              <option value="registration">Registrasi</option>
              <option value="manual">Manual</option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 sm:flex-shrink-0"
                title="Reset filter"
                aria-label="Reset filter"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow">
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
