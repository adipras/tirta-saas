import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import customerAuthService from '../../services/customerAuthService';
import customerPortalService, { type CustomerInvoice } from '../../services/customerPortalService';

const CustomerTagihan: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setTagihan] = useState<CustomerInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');

  useEffect(() => {
    if (!customerAuthService.isAuthenticated()) {
      navigate('/customer/login');
      return;
    }
    loadTagihan();
  }, [navigate]);

  const loadTagihan = async () => {
    try {
      const data = await customerPortalService.getTagihan();
      setTagihan(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTagihan = invoices.filter((inv) => {
    if (filter === 'unpaid') return !inv.is_paid;
    if (filter === 'paid') return inv.is_paid;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (invoice: CustomerInvoice) => {
    if (invoice.is_paid) {
      return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Lunas</span>;
    }
    const isOverdue = new Date(invoice.due_date) < new Date();
    if (isOverdue) {
      return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Terlambat</span>;
    }
    return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Belum Dibayar</span>;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Memuat...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link to="/customer/dashboard" className="text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tagihan Saya</h1>
              <p className="text-sm text-gray-600">Kelola dan bayar tagihan Anda</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semua ({invoices.length})
            </button>
            <button
              onClick={() => setFilter('unpaid')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'unpaid' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Belum Dibayar ({invoices.filter(i => !i.is_paid).length})
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'paid' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Lunas ({invoices.filter(i => i.is_paid).length})
            </button>
          </div>
        </div>

        {/* Tagihan List */}
        {filteredTagihan.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Tidak ada tagihan</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTagihan.map((invoice) => (
              <div key={invoice.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900">{invoice.invoice_number}</h3>
                    <p className="text-sm text-gray-600">
                      Periode: {invoice.usage_month} {invoice.usage_year}
                    </p>
                  </div>
                  {getStatusBadge(invoice)}
                </div>

                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-600">Pemakaian Air</p>
                    <p className="font-medium">{invoice.usage_amount} m³</p>
                    <p className="text-xs text-gray-500">
                      {invoice.previous_reading} m³ → {invoice.current_reading} m³
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Jatuh Tempo</p>
                    <p className="font-medium">{formatDate(invoice.due_date)}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-gray-600">Biaya Air</span>
                      <span>{formatCurrency(invoice.water_charge)}</span>
                    </div>
                      <div className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-gray-600">Biaya Langganan</span>
                      <span>{formatCurrency(invoice.subscription_fee)}</span>
                    </div>
                    {invoice.penalty_amount > 0 && (
                        <div className="flex items-start justify-between gap-3 text-sm text-red-600">
                        <span>Denda Keterlambatan</span>
                        <span>{formatCurrency(invoice.penalty_amount)}</span>
                      </div>
                    )}
                      <div className="flex items-start justify-between gap-3 border-t pt-2 text-lg font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(invoice.total_amount)}</span>
                    </div>
                    {invoice.total_paid > 0 && (
                      <>
                          <div className="flex items-start justify-between gap-3 text-sm text-green-600">
                          <span>Sudah Dibayar</span>
                          <span>-{formatCurrency(invoice.total_paid)}</span>
                        </div>
                          <div className="flex items-start justify-between gap-3 font-bold text-indigo-600">
                          <span>Sisa</span>
                          <span>{formatCurrency(invoice.remaining_amount)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {!invoice.is_paid && (
                  <div className="mt-4 pt-4 border-t">
                    <Link
                      to={`/customer/pay/${invoice.id}`}
                      className="block w-full bg-indigo-600 text-white text-center py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Bayar Sekarang
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerTagihan;
