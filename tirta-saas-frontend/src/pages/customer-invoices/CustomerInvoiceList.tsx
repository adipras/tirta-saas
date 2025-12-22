import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon
} from '@heroicons/react/24/outline';
import { invoiceService } from '../../services/invoiceService';
import type { Invoice } from '../../types/invoice';

type InvoiceStatus = 'all' | 'paid' | 'unpaid' | 'overdue' | 'partial';

export default function CustomerInvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus>('all');

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, statusFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      // In real scenario, this would call a customer-specific endpoint
      // For now, we'll use the same service
      const data = await invoiceService.getCustomerInvoices();
      setInvoices(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(term) ||
        invoice.billingPeriod.toLowerCase().includes(term)
      );
    }

    setFilteredInvoices(filtered);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      partial: 'bg-blue-100 text-blue-800',
    };
    return badges[status as keyof typeof badges] || badges.unpaid;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTotalUnpaid = () => {
    return invoices
      .filter(inv => inv.status === 'unpaid' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.amountDue, 0);
  };

  const getStatusCount = (status: InvoiceStatus) => {
    if (status === 'all') return invoices.length;
    return invoices.filter(inv => inv.status === status).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Invoices</h1>
        <p className="text-gray-600">View and manage your water bills</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Total Invoices</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{invoices.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Paid</p>
          <p className="text-2xl font-bold text-green-600 mt-2">{getStatusCount('paid')}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Unpaid</p>
          <p className="text-2xl font-bold text-yellow-600 mt-2">{getStatusCount('unpaid')}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-6 border border-red-200">
          <p className="text-sm font-medium text-red-900">Total Outstanding</p>
          <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(getTotalUnpaid())}</p>
        </div>
      </div>

      {/* Outstanding Alert */}
      {getTotalUnpaid() > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700">
                You have <strong>{getStatusCount('unpaid') + getStatusCount('overdue')}</strong> unpaid invoice(s) 
                with total amount of <strong>{formatCurrency(getTotalUnpaid())}</strong>
              </p>
            </div>
            <Link
              to="/customer/payments/new"
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium"
            >
              Pay Now
            </Link>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice number or period..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status ({getStatusCount('all')})</option>
                <option value="paid">Paid ({getStatusCount('paid')})</option>
                <option value="unpaid">Unpaid ({getStatusCount('unpaid')})</option>
                <option value="overdue">Overdue ({getStatusCount('overdue')})</option>
                <option value="partial">Partial ({getStatusCount('partial')})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoice List */}
        <div className="divide-y divide-gray-200">
          {filteredInvoices.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'You don\'t have any invoices yet.'}
              </p>
            </div>
          ) : (
            filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <DocumentTextIcon className="h-10 w-10 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900">
                            {invoice.invoiceNumber}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(invoice.status)}`}>
                            {invoice.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Billing Period: {invoice.billingPeriod}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>Issue Date: {formatDate(invoice.issueDate)}</span>
                          <span>•</span>
                          <span>Due Date: {formatDate(invoice.dueDate)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 ml-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-500">Total Amount</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(invoice.totalAmount)}</p>
                      {invoice.status !== 'paid' && invoice.amountDue > 0 && (
                        <p className="text-sm text-red-600">Due: {formatCurrency(invoice.amountDue)}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link
                        to={`/customer/invoices/${invoice.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium text-center"
                      >
                        View Details
                      </Link>
                      {invoice.status !== 'paid' && (
                        <Link
                          to={`/customer/payments/new?invoice=${invoice.id}`}
                          className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium text-center"
                        >
                          Pay Now
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
