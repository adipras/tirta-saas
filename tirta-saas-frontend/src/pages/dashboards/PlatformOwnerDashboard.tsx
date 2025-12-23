import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function PlatformOwnerDashboard() {
  const navigate = useNavigate();

  const stats = [
    {
      name: 'Total Tenant',
      value: '45',
      change: '+3',
      changeType: 'increase',
      icon: BuildingOfficeIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Tenant Aktif',
      value: '38',
      change: '+2',
      changeType: 'increase',
      icon: CheckCircleIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Pending Approval',
      value: '7',
      change: '+5',
      changeType: 'increase',
      icon: ClockIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'Revenue Bulan Ini',
      value: 'Rp 42.5 Jt',
      change: '+12%',
      changeType: 'increase',
      icon: CurrencyDollarIcon,
      color: 'bg-blue-500',
    },
  ];

  const recentActivities = [
    { type: 'tenant', message: 'Tenant baru terdaftar: RT 05 RW 03 Kelurahan Maju', time: '10 menit lalu' },
    { type: 'subscription', message: 'RT 02 RW 01 upgrade ke paket PRO', time: '1 jam lalu' },
    { type: 'payment', message: 'Pembayaran subscription diterima dari RT 04 RW 02 - Rp 1,000,000', time: '2 jam lalu' },
    { type: 'approval', message: 'Tenant RT 01 RW 04 disetujui dan aktif', time: '3 jam lalu' },
    { type: 'trial', message: 'Trial period berakhir untuk RT 03 RW 05', time: '5 jam lalu' },
  ];

  const pendingTenants = [
    { name: 'RT 08 RW 02 Kelurahan Sejahtera', village: 'KLR-SEJ-002', registeredAt: '2024-12-22', plan: 'BASIC' },
    { name: 'RT 05 RW 04 Kelurahan Maju', village: 'KLR-MAJ-004', registeredAt: '2024-12-22', plan: 'PRO' },
    { name: 'RT 02 RW 03 Kelurahan Damai', village: 'KLR-DAM-003', registeredAt: '2024-12-21', plan: 'BASIC' },
  ];

  const subscriptionStats = [
    { plan: 'BASIC', count: 15, revenue: 'Rp 7.5 Jt', color: 'bg-blue-100 text-blue-800' },
    { plan: 'PRO', count: 20, revenue: 'Rp 20 Jt', color: 'bg-purple-100 text-purple-800' },
    { plan: 'ENTERPRISE', count: 3, revenue: 'Rp 15 Jt', color: 'bg-orange-100 text-orange-800' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Owner Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview pengelolaan tenant dan subscription platform</p>
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
            onClick={() => navigate('/admin/platform/tenants')}
            className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <BuildingOfficeIcon className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Kelola Tenant</span>
          </button>
          <button
            onClick={() => navigate('/admin/platform/subscription-payments')}
            className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <CurrencyDollarIcon className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Verifikasi Pembayaran</span>
          </button>
          <button
            onClick={() => navigate('/admin/platform/subscription-plans')}
            className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <ChartBarIcon className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Paket Subscription</span>
          </button>
          <button
            onClick={() => navigate('/admin/platform/analytics')}
            className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <ChartBarIcon className="h-8 w-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Analytics</span>
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
                  activity.type === 'tenant' ? 'bg-purple-500' :
                  activity.type === 'subscription' ? 'bg-blue-500' :
                  activity.type === 'approval' ? 'bg-green-500' :
                  'bg-yellow-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Tenants */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Tenant Pending Approval</h2>
            <button
              onClick={() => navigate('/admin/platform/tenants')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Lihat Semua →
            </button>
          </div>
          <div className="space-y-3">
            {pendingTenants.map((tenant, index) => (
              <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tenant.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Village: {tenant.village}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                    {tenant.plan}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">{tenant.registeredAt}</p>
                  <div className="flex space-x-2">
                    <button className="text-xs text-green-600 hover:text-green-700 font-medium">
                      Approve
                    </button>
                    <button className="text-xs text-red-600 hover:text-red-700 font-medium">
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subscription Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistik Subscription</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subscriptionStats.map((stat) => (
            <div key={stat.plan} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${stat.color}`}>
                  {stat.plan}
                </span>
                <span className="text-2xl font-bold text-gray-900">{stat.count}</span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Revenue:</span> {stat.revenue}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
