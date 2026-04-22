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
import { DataTable } from '../../components/DataTable';
import invoiceService, { type InvoiceFilters } from '../../services/invoiceService';
import type { Invoice } from '../../types/invoice';
import { useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';
import { PageHeader } from '../../components';
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

  const columns = [
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
      render: (billingPeriod: string) => {
        const type = billingPeriod ? 'Monthly' : 'Registration';
        const color = billingPeriod ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
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
      render: (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(amount || 0);
      },
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (dueDate: string) => {
        return dueDate ? new Date(dueDate).toLocaleDateString('id-ID') : 'N/A';
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status: Invoice['status']) => getStatusBadge(status),
    },
  ];

  const actions = (invoice: Invoice) => (
    <div className="flex items-center space-x-2 print:hidden">
      <button
        onClick={() => navigate(`/admin/invoices/${invoice.id}`)}
        className="text-blue-600 hover:text-blue-900"
        title="View Details"
      >
        <EyeIcon className="h-5 w-5" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tagihan"
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
            <button
              onClick={() => navigate('/admin/invoices/bulk-generate')}
              className="print:hidden inline-flex w-full items-center justify-center rounded-md border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm hover:bg-blue-50 sm:w-auto"
            >
              <DocumentTextIcon className="mr-2 h-4 w-4" />
              Bulk Generate
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
              Create Invoice
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow print:hidden">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoice # or customer..."
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
              <option value="">All Status</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="partial">Partial</option>
            </select>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as InvoiceFilters['type'] | '')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Types</option>
              <option value="monthly">Monthly</option>
              <option value="registration">Registration</option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 sm:flex-shrink-0"
                title="Clear filters"
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
          emptyMessage="No invoices found"
        />
      </div>
    </div>
  );
}
