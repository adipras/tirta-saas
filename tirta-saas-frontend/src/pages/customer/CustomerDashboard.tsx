import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  CreditCardIcon, 
  ChartBarIcon, 
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import customerAuthService from '../../services/customerAuthService';
import customerPortalService, { type CustomerInvoice, type CustomerProfile } from '../../services/customerPortalService';

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerAuthService.isAuthenticated()) {
      navigate('/customer/login');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const [profileData, invoicesData] = await Promise.all([
        customerPortalService.getProfile(),
        customerPortalService.getInvoices()
      ]);
      setProfile(profileData);
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    customerAuthService.logout();
    navigate('/customer/login');
  };

  const unpaidInvoices = invoices.filter(inv => !inv.is_paid);
  const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + (inv.total_amount - inv.total_paid), 0);
  const overdueInvoices = unpaidInvoices.filter(inv => new Date(inv.due_date) < new Date());

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Portal Pelanggan</h1>
              <p className="text-sm text-gray-600">Selamat datang, {profile?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <UserCircleIcon className="h-16 w-16 text-indigo-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{profile?.name}</h2>
                <p className="text-gray-600">No. Meteran: {profile?.meter_number}</p>
                <p className="text-gray-600">{profile?.address}</p>
                <p className="text-gray-600">{profile?.phone}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Paket: <span className="font-medium text-indigo-600">{profile?.subscription?.name}</span>
                </p>
              </div>
            </div>
            {profile?.is_active ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <CheckCircleIcon className="h-4 w-4" />
                Aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                <XCircleIcon className="h-4 w-4" />
                Tidak Aktif
              </span>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tagihan Belum Dibayar</p>
                <p className="text-2xl font-bold text-gray-900">
                  Rp {totalUnpaid.toLocaleString('id-ID')}
                </p>
                <p className="text-sm text-gray-500 mt-1">{unpaidInvoices.length} tagihan</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tagihan Terlambat</p>
                <p className="text-2xl font-bold text-red-600">{overdueInvoices.length}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {overdueInvoices.length > 0 ? 'Segera bayar!' : 'Tidak ada'}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <ClockIcon className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tagihan Lunas</p>
                <p className="text-2xl font-bold text-green-600">
                  {invoices.filter(inv => inv.is_paid).length}
                </p>
                <p className="text-sm text-gray-500 mt-1">Bulan ini</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Link
            to="/customer/invoices"
            className="flex items-center gap-3 bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
          >
            <DocumentTextIcon className="h-8 w-8 text-indigo-600" />
            <div>
              <p className="font-semibold text-gray-900">Tagihan Saya</p>
              <p className="text-sm text-gray-600">Lihat semua tagihan</p>
            </div>
          </Link>

          <Link
            to="/customer/payments"
            className="flex items-center gap-3 bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
          >
            <CreditCardIcon className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-semibold text-gray-900">Riwayat Pembayaran</p>
              <p className="text-sm text-gray-600">Lihat pembayaran</p>
            </div>
          </Link>

          <Link
            to="/customer/usage"
            className="flex items-center gap-3 bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
          >
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
            <div>
              <p className="font-semibold text-gray-900">Pemakaian Air</p>
              <p className="text-sm text-gray-600">Lihat riwayat</p>
            </div>
          </Link>

          <Link
            to="/customer/profile"
            className="flex items-center gap-3 bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
          >
            <UserCircleIcon className="h-8 w-8 text-purple-600" />
            <div>
              <p className="font-semibold text-gray-900">Profil Saya</p>
              <p className="text-sm text-gray-600">Kelola profil</p>
            </div>
          </Link>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tagihan Terbaru</h3>
          {unpaidInvoices.length === 0 ? (
            <p className="text-gray-600 text-center py-8">Tidak ada tagihan yang belum dibayar</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jatuh Tempo</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {unpaidInvoices.slice(0, 5).map((invoice) => {
                    const isOverdue = new Date(invoice.due_date) < new Date();
                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.invoice_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {invoice.usage_month} {invoice.usage_year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(invoice.due_date).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          Rp {(invoice.total_amount - invoice.total_paid).toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {isOverdue ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Terlambat
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Belum Dibayar
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {unpaidInvoices.length > 5 && (
            <div className="mt-4 text-center">
              <Link to="/customer/invoices" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                Lihat Semua Tagihan →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
