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
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
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
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No. Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Periode
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.payment_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.invoice?.invoice_number || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {payment.invoice ? `${payment.invoice.usage_month} ${payment.invoice.usage_year}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          <CheckCircleIcon className="h-4 w-4" />
                          Berhasil
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPembayaran;
