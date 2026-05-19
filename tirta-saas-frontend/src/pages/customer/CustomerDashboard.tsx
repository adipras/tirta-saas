import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  CreditCardIcon, 
  ChartBarIcon, 
  UserCircleIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { logoutAsync } from '../../store/slices/authSlice';
import { invoiceService } from '../../services/invoiceService';
import { customerProfilService } from '../../services/customerProfileService';
import type { Invoice } from '../../types/invoice';
import type { CustomerProfil } from '../../types/customerProfile';
import { TableSkeleton } from '../../components';

const CustomerDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [profile, setProfil] = useState<CustomerProfil | null>(null);
  const [invoices, setTagihan] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileData, invoicesData] = await Promise.all([
        customerProfilService.getProfil(),
        invoiceService.getCustomerTagihan(),
      ]);
      setProfil(profileData);
      setTagihan(invoicesData);
    } catch {
      setError('Gagal memuat data. Silakan muat ulang halaman.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logoutAsync());
  };

  const unpaidTagihan = invoices.filter((inv) => inv.status !== 'paid');
  const totalUnpaid = unpaidTagihan.reduce((sum, inv) => sum + Number(inv.totalAmount ?? 0), 0);
  const overdueTagihan = unpaidTagihan.filter((inv) => inv.status === 'overdue');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg bg-white p-6 shadow-md">
              <TableSkeleton rows={2} cols={1} />
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-white p-6 shadow-md">
          <TableSkeleton rows={3} cols={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profil Card */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <UserCircleIcon className="h-16 w-16 flex-shrink-0 text-indigo-600" />
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-gray-900">
                {profile?.name ?? user?.name ?? '-'}
              </h2>
              <p className="text-gray-600">No. Meteran: {profile?.meterNumber ?? '-'}</p>
              <p className="text-gray-600">{profile?.address ?? '-'}</p>
              <p className="text-sm text-gray-500 mt-2">
                Paket:{' '}
                <span className="font-medium text-indigo-600">
                  {profile?.subscriptionType?.name ?? '-'}
                </span>
              </p>
            </div>
          </div>
          {profile?.status === 'active' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              <CheckCircleIcon className="h-4 w-4" />
              Aktif
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
              <XCircleIcon className="h-4 w-4" />
              Tidak Aktif
            </span>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tagihan Belum Dibayar</p>
              <p className="text-2xl font-bold text-gray-900">
                Rp {totalUnpaid.toLocaleString('id-ID')}
              </p>
              <p className="mt-1 text-sm text-gray-500">{unpaidTagihan.length} tagihan</p>
            </div>
            <div className="rounded-full bg-yellow-100 p-3">
              <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tagihan Terlambat</p>
              <p className="text-2xl font-bold text-red-600">{overdueTagihan.length}</p>
              <p className="mt-1 text-sm text-gray-500">
                {overdueTagihan.length > 0 ? 'Segera bayar!' : 'Tidak ada'}
              </p>
            </div>
            <div className="rounded-full bg-red-100 p-3">
              <ClockIcon className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tagihan Lunas</p>
              <p className="text-2xl font-bold text-green-600">
                {invoices.filter((inv) => inv.status === 'paid').length}
              </p>
              <p className="mt-1 text-sm text-gray-500">Dari {invoices.length} tagihan</p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Link
          to="/customer/invoices"
          className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-md transition-shadow hover:shadow-lg"
        >
          <DocumentTextIcon className="h-8 w-8 flex-shrink-0 text-indigo-600" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">Tagihan Saya</p>
            <p className="truncate text-sm text-gray-600">Lihat semua tagihan</p>
          </div>
        </Link>

        <Link
          to="/customer/invoices"
          className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-md transition-shadow hover:shadow-lg"
        >
          <CreditCardIcon className="h-8 w-8 flex-shrink-0 text-green-600" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">Bayar Tagihan</p>
            <p className="truncate text-sm text-gray-600">Lakukan pembayaran</p>
          </div>
        </Link>

        <Link
          to="/customer/usage"
          className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-md transition-shadow hover:shadow-lg"
        >
          <ChartBarIcon className="h-8 w-8 flex-shrink-0 text-blue-600" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">Pemakaian Air</p>
            <p className="truncate text-sm text-gray-600">Lihat riwayat</p>
          </div>
        </Link>

        <Link
          to="/customer/profile"
          className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-md transition-shadow hover:shadow-lg"
        >
          <UserCircleIcon className="h-8 w-8 flex-shrink-0 text-purple-600" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">Profil Saya</p>
            <p className="truncate text-sm text-gray-600">Kelola profil</p>
          </div>
        </Link>
      </div>

      {/* Tagihan Terbaru */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Tagihan Belum Dibayar</h3>
        {unpaidTagihan.length === 0 ? (
          <p className="py-8 text-center text-gray-500">Tidak ada tagihan yang belum dibayar</p>
        ) : (
          <div className="space-y-3">
            {unpaidTagihan.slice(0, 5).map((invoice) => {
              const isOverdue = invoice.status === 'overdue';
              return (
                <div key={invoice.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        {invoice.billingPeriod}
                      </p>
                      {invoice.dueDate && (
                        <p className="mt-1 text-xs text-gray-500">
                          Jatuh tempo{' '}
                          {new Date(invoice.dueDate).toLocaleDateString('id-ID')}
                        </p>
                      )}
                    </div>
                    {isOverdue ? (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                        Terlambat
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        Belum Dibayar
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                    <span className="text-sm text-gray-600">Total tagihan</span>
                    <span className="text-sm font-semibold text-gray-900">
                      Rp {Number(invoice.totalAmount ?? 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="mt-3 pt-1">
                    <Link
                      to={`/customer/pay/${invoice.id}`}
                      className="block w-full rounded-lg bg-indigo-600 py-2 px-4 text-center text-sm text-white transition-colors hover:bg-indigo-700"
                    >
                      Konfirmasi Pembayaran
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {unpaidTagihan.length > 5 && (
          <div className="mt-4 text-center">
            <Link
              to="/customer/invoices"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Lihat Semua Tagihan →
            </Link>
          </div>
        )}
      </div>

      {/* Logout button */}
      <div className="flex justify-end">
        <button
          onClick={handleLogout}
          className="rounded-lg px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
        >
          Keluar
        </button>
      </div>
    </div>
  );
};

export default CustomerDashboard;
