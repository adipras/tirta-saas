import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type Column } from '../../components/DataTable';
import { paymentService, type PaymentFilters } from '../../services/paymentService';
import type {
  Payment,
  PaymentStatus,
} from '../../types/payment';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from '../../types/payment';

const PaymentList: React.FC = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<PaymentFilters>({});

  const fetchPayments = useCallback(async (page: number, search: string, currentFilters: PaymentFilters) => {
    try {
      setLoading(true);
      const response = await paymentService.getPayments(page, 10, {
        ...currentFilters,
        search: search || undefined,
      });
      setPayments(response.data);
      setTotalPages(response.pagination.totalPages);
      setCurrentPage(response.pagination.currentPage);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments(1, searchTerm, filters);
  }, [fetchPayments, searchTerm, filters]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handlePageChange = (page: number) => {
    fetchPayments(page, searchTerm, filters);
  };

  const handleFilterChange = (key: keyof PaymentFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleViewReceipt = (payment: Payment) => {
    navigate(`/admin/payments/${payment.id}/receipt`);
  };

  const handleViewInvoice = (payment: Payment) => {
    navigate(`/admin/invoices/${payment.invoiceId}`);
  };

  const handleVoidPayment = async (payment: Payment) => {
    if (!window.confirm('Are you sure you want to void this payment?')) {
      return;
    }

    try {
      await paymentService.voidPayment(payment.id);
      fetchPayments(currentPage, searchTerm, filters);
    } catch (error) {
      console.error('Failed to void payment:', error);
      alert('Failed to void payment');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await paymentService.exportPayments(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export payments:', error);
      alert('Failed to export payments');
    }
  };

  const getStatusBadgeClass = (status: PaymentStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'voided':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns: Column<Payment>[] = [
    {
      key: 'paymentDate',
      label: 'Date',
      sortable: true,
      render: (_: any, payment: Payment) => new Date(payment.paymentDate).toLocaleDateString(),
    },
    {
      key: 'customerName',
      label: 'Customer',
      sortable: true,
      render: (_: any, payment: Payment) => payment.customerName || '-',
    },
    {
      key: 'invoiceNumber',
      label: 'Invoice',
      sortable: true,
      render: (_: any, payment: Payment) => (
        <button
          onClick={() => handleViewInvoice(payment)}
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {payment.invoiceNumber || '-'}
        </button>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (_: any, payment: Payment) => `Rp ${payment.amount.toLocaleString('id-ID')}`,
    },
    {
      key: 'paymentMethod',
      label: 'Method',
      sortable: true,
      render: (_: any, payment: Payment) => PAYMENT_METHOD_LABELS[payment.paymentMethod],
    },
    {
      key: 'referenceNumber',
      label: 'Reference',
      render: (_: any, payment: Payment) => payment.referenceNumber || '-',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: any, payment: Payment) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(payment.status)}`}
        >
          {PAYMENT_STATUS_LABELS[payment.status]}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, payment: Payment) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewReceipt(payment)}
            className="text-blue-600 hover:text-blue-800 text-sm"
            title="View Receipt"
          >
            Receipt
          </button>
          {payment.status === 'completed' && (
            <button
              onClick={() => handleVoidPayment(payment)}
              className="text-red-600 hover:text-red-800 text-sm"
              title="Void Payment"
            >
              Void
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600 mt-1">Manage payment records and receipts</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={filters.paymentMethod || ''}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
            >
              <option value="">All Methods</option>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={filters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={filters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setFilters({})}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <input
            type="text"
            placeholder="Search payments..."
            className="border border-gray-300 rounded-md px-4 py-2 w-96"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <div className="flex space-x-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Export
            </button>
            <button
              onClick={() => navigate('/admin/payments/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Record Payment
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={payments}
          loading={loading}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentList;
