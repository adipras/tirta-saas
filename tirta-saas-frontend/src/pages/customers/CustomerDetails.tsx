import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ChartBarIcon,
  KeyIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import customerService from '../../services/customerService';
import type { Customer } from '../../types/customer';
import { PageHeader } from '../../components';
import { useToast } from '../../components';
import { useAppSelector } from '../../hooks/redux';
import CustomerMetersSection from './CustomerMetersSection';

export default function CustomerDetails() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const currentUserRole = useAppSelector((state) => state.auth.user?.role);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetPasswordModal, setResetPasswordModal] = useState<{ open: boolean; password: string }>({ open: false, password: '' });
  const [copied, setCopied] = useState(false);

  const fetchCustomer = async (customerId: string) => {
    try {
      setLoading(true);
      const data = await customerService.getCustomerById(customerId);
      setCustomer(data);
    } catch  {
      toast.error('Gagal memuat data pelanggan');
      navigate('/admin/customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCustomer(id);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (newIsActive: boolean) => {    if (!customer) return;

    try {
      let updatedCustomer;
      if (newIsActive) {
        updatedCustomer = await customerService.activateCustomer(customer.id);
      } else {
        updatedCustomer = await customerService.deactivateCustomer(customer.id);
      }
      
      if (updatedCustomer) {
        setCustomer(updatedCustomer);
        toast.success(`Pelanggan berhasil ${newIsActive ? 'diaktifkan' : 'dinonaktifkan'}`);
      }
    } catch {
      toast.error('Gagal memperbarui status pelanggan');
    }
  };

  const handleResetPassword = async () => {
    if (!customer) return;
    try {
      const result = await customerService.resetCustomerPassword(customer.id);
      setResetPasswordModal({ open: true, password: result.new_password });
    } catch {
      toast.error('Gagal mereset password pelanggan');
    }
  };

  const handleCopyPassword = async () => {
    await navigator.clipboard.writeText(resetPasswordModal.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {isActive ? (
          <>
            <CheckCircleIcon className="mr-2 h-4 w-4" />
            Active
          </>
        ) : (
          <>
            <XCircleIcon className="mr-2 h-4 w-4" />
            Inactive
          </>
        )}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Customer not found</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      <PageHeader
        title={customer.name || 'Customer Details'}
        subtitle={`Meter Number: ${customer.meter_number}`}
        actions={
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/admin/customers')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back
            </button>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${customer.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                {customer.is_active ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={() => handleStatusChange(!customer.is_active)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  customer.is_active ? 'bg-green-600' : 'bg-gray-300'
                }`}
                title={customer.is_active ? 'Klik untuk menonaktifkan pelanggan' : 'Klik untuk mengaktifkan pelanggan'}
                aria-label={customer.is_active ? 'Nonaktifkan pelanggan' : 'Aktifkan pelanggan'}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    customer.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <button
              onClick={() => navigate(`/admin/customers/${customer.id}/edit`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <PencilIcon className="mr-2 h-4 w-4" />
              Ubah
            </button>
            {currentUserRole === 'tenant_admin' && (
              <button
                onClick={handleResetPassword}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50"
              >
                <KeyIcon className="mr-2 h-4 w-4" />
                Reset Password
              </button>
            )}
          </div>
        }
      />

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {customer.name}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Nomor Meter: {customer.meter_number}
              </p>
            </div>
            {getStatusBadge(customer.is_active)}
          </div>
        </div>

        <div className="border-t border-gray-200">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <a href={`mailto:${customer.email}`} className="text-blue-600 hover:text-blue-800">
                  {customer.email}
                </a>
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Nomor Telepon</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <a href={`tel:${customer.phone}`} className="text-blue-600 hover:text-blue-800">
                  {customer.phone}
                </a>
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Alamat</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {customer.address}
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Golongan Langganan</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {customer.subscription ? (
                  <div>
                    <p className="font-medium">{customer.subscription.name}</p>
                    <p className="text-gray-500">
                      Biaya Bulanan: Rp {customer.subscription.monthly_fee?.toLocaleString('id-ID') || '-'}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">Belum ada golongan langganan</p>
                )}
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Area Layanan</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {customer.service_area_name || <span className="text-gray-500">Belum ditentukan</span>}
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Nomor Meter</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {customer.meter_number}
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Tanggal Pendaftaran</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(customer.created_at).toLocaleDateString('id-ID')}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tagihan Terbaru
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      Lihat Semua
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <button
                onClick={() => navigate(`/admin/invoices?customerId=${customer.id}`)}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Lihat tagihan
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCardIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Riwayat Pembayaran
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      Lihat Semua
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <button
                onClick={() => navigate(`/admin/payments?customerId=${customer.id}`)}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Lihat pembayaran
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pemakaian Air
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      Lihat Tren
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <button
                onClick={() => navigate(`/admin/water-usage?customerId=${customer.id}`)}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Lihat pemakaian
              </button>
            </div>
          </div>
        </div>
      </div>

      <CustomerMetersSection customerId={customer.id} />
    </div>

      {/* Modal Reset Password */}
      {resetPasswordModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-3">
                <KeyIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Password Berhasil Direset</h3>
              <p className="mt-1 text-sm text-gray-500">
                Catat password baru ini dan berikan ke pelanggan. Password tidak akan ditampilkan lagi.
              </p>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-bold text-gray-800 tracking-widest">
                  {resetPasswordModal.password}
                </span>
                <button
                  onClick={handleCopyPassword}
                  className="ml-3 p-2 text-gray-500 hover:text-blue-600 rounded-md hover:bg-blue-50"
                  title="Salin password"
                >
                  {copied ? (
                    <CheckIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ClipboardDocumentIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <button
              onClick={() => setResetPasswordModal({ open: false, password: '' })}
              className="mt-5 w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </>
  );
}