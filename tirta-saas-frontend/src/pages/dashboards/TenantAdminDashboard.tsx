import {
  UserGroupIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  BeakerIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function TenantAdminDashboard() {
  const navigate = useNavigate();

  const stats = [
    {
      name: 'Total Pelanggan',
      value: '342',
      change: '+12',
      changeType: 'increase',
      icon: UserGroupIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Tagihan Bulan Ini',
      value: 'Rp 45.2 Jt',
      change: '+8%',
      changeType: 'increase',
      icon: DocumentTextIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Pembayaran Pending',
      value: '23',
      change: '-5',
      changeType: 'decrease',
      icon: ExclamationCircleIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'Pemakaian Air Bulan Ini',
      value: '12,450 m³',
      change: '+3%',
      changeType: 'increase',
      icon: BeakerIcon,
      color: 'bg-cyan-500',
    },
  ];

  const recentActivities = [
    { type: 'payment', message: 'Pembayaran diterima dari Budi Santoso - Rp 150,000', time: '5 menit lalu' },
    { type: 'invoice', message: 'Invoice #INV-2024-089 dibuat untuk Siti Aminah', time: '15 menit lalu' },
    { type: 'customer', message: 'Pelanggan baru terdaftar: Ahmad Wijaya', time: '1 jam lalu' },
    { type: 'usage', message: 'Pencatatan meter selesai untuk Blok A (45 pelanggan)', time: '2 jam lalu' },
    { type: 'payment', message: 'Pembayaran pending dari Dewi Lestari', time: '3 jam lalu' },
  ];

  const pendingPayments = [
    { customer: 'Budi Santoso', invoice: 'INV-2024-085', amount: 'Rp 150,000', dueDate: '2024-12-25', overdue: false },
    { customer: 'Siti Aminah', invoice: 'INV-2024-078', amount: 'Rp 175,000', dueDate: '2024-12-20', overdue: true },
    { customer: 'Ahmad Wijaya', invoice: 'INV-2024-082', amount: 'Rp 125,000', dueDate: '2024-12-26', overdue: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Pengelola</h1>
        <p className="text-gray-600 mt-1">Ringkasan pengelolaan air RT/RW Anda</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className={`text-sm mt-2 ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.changeType === 'increase' ? '↑' : '↓'} {stat.change}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/customers/new')}
            className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <UserGroupIcon className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Tambah Pelanggan</span>
          </button>
          <button
            onClick={() => navigate('/admin/usage/create')}
            className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-cyan-500 hover:bg-cyan-50 transition-colors"
          >
            <BeakerIcon className="h-8 w-8 text-cyan-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Catat Pemakaian</span>
          </button>
          <button
            onClick={() => navigate('/admin/invoices')}
            className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <DocumentTextIcon className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Lihat Tagihan</span>
          </button>
          <button
            onClick={() => navigate('/admin/payments')}
            className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
          >
            <BanknotesIcon className="h-8 w-8 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Pembayaran</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aktivitas Terakhir</h2>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 pb-3 border-b last:border-b-0">
                <div className={`w-2 h-2 mt-2 rounded-full ${
                  activity.type === 'payment' ? 'bg-green-500' :
                  activity.type === 'invoice' ? 'bg-blue-500' :
                  activity.type === 'customer' ? 'bg-purple-500' :
                  'bg-cyan-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pembayaran Pending</h2>
            <button
              onClick={() => navigate('/admin/payment-verification')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Lihat Semua →
            </button>
          </div>
          <div className="space-y-3">
            {pendingPayments.map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{payment.customer}</p>
                  <p className="text-xs text-gray-500">{payment.invoice}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{payment.amount}</p>
                  <p className={`text-xs ${payment.overdue ? 'text-red-600' : 'text-gray-500'}`}>
                    {payment.overdue ? '⚠️ Jatuh tempo' : payment.dueDate}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
