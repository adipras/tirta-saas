import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, CreditCardIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import customerAuthService from '../../services/customerAuthService';
import customerPortalService, { type CustomerPayment } from '../../services/customerPortalService';

const CustomerPembayaran: React.FC = () => {
  const navigate = useNavigate();
  const [payments, setPembayaran] = useState<CustomerPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerAuthService.isAuthenticated()) {
      navigate('/customer/login');
      return;
    }
    loadPembayaran();
  }, [navigate]);

  const loadPembayaran = async () => {
    try {
      const data = await customerPortalService.getPembayaran();
      setPembayaran(data);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

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
              <h1 className="text-2xl font-bold text-gray-900">Riwayat Pembayaran</h1>
              <p className="text-sm text-gray-600">Lihat semua pembayaran yang telah dilakukan</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Card */}
        <div className="mb-6 rounded-lg bg-gradient-to-r from-green-500 to-green-600 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-green-100 text-sm mb-1">Total Pembayaran</p>
              <p className="text-3xl font-bold">{formatCurrency(totalPaid)}</p>
              <p className="text-green-100 text-sm mt-2">{payments.length} transaksi</p>
            </div>
            <CheckCircleIcon className="h-16 w-16 text-green-100" />
          </div>
        </div>

        {/* Pembayaran List */}
        {payments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <CreditCardIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Belum ada riwayat pembayaran</p>
          </div>
        ) : (
          <div className="space-y-3 rounded-lg bg-white p-4 shadow-md sm:p-6">
            {payments.map((payment) => (
              <div key={payment.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {payment.invoice?.invoice_number || '-'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {payment.invoice ? `${payment.invoice.usage_month} ${payment.invoice.usage_year}` : '-'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{formatDate(payment.payment_date)}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                    <CheckCircleIcon className="h-4 w-4" />
                    Berhasil
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-sm text-gray-600">Jumlah</span>
                  <span className="text-sm font-semibold text-green-600">{formatCurrency(payment.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPembayaran;
