import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { DataTable } from '../../components/DataTable';
import invoiceService from '../../services/invoiceService';
import type { Invoice } from '../../types/invoice';
import { useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';

export default function InvoiceList() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage] = useState(1);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getInvoices(currentPage, 10);
      setInvoices(response.data);
    } catch {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch invoices',
      }));
    } finally {
      setLoading(false);
    }
  }, [currentPage, dispatch]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-800' },
      unpaid: { color: 'bg-yellow-100 text-yellow-800' },
      overdue: { color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status];

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
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (amount: number) => `$${amount.toFixed(2)}`,
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
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
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
          <button
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FunnelIcon className="mr-2 h-4 w-4" />
            Filters
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