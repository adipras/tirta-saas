import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { DataTable } from '../../components/DataTable';
import invoiceService, { type InvoiceFilters } from '../../services/invoiceService';
import type { Invoice } from '../../types/invoice';
import { useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';
import { PageHeader } from '../../components';

export default function InvoiceList() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<InvoiceFilters['status'] | ''>('');
  const [filterType, setFilterType] = useState<InvoiceFilters['type'] | ''>('');

  const hasActiveFilters = searchTerm !== '' || filterStatus !== '' || filterType !== '';

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getInvoices(currentPage, 100, {
        search: searchTerm || undefined,
        status: filterStatus || undefined,
        type: filterType || undefined,
      });
      setInvoices(response.data);
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
    fetchInvoices();
  }, [fetchInvoices]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterType('');
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
    <div className="flex items-center space-x-2">
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
        title="Invoices"
        actions={
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/admin/invoices/bulk-generate')}
              className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50"
            >
              <DocumentTextIcon className="mr-2 h-4 w-4" />
              Bulk Generate
            </button>
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
              Export
            </button>
            <button
              onClick={() => navigate('/admin/invoices/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Invoice
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
          <div className="flex items-center gap-3">
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
                className="flex-shrink-0 inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50"
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