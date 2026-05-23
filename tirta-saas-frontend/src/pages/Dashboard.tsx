import {
  UserGroupIcon,
  CurrencyDollarIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '../components';

const stats = [
  {
    name: 'Total Pelanggan',
    stat: '1,245',
    icon: UserGroupIcon,
    change: '12%',
    changeType: 'increase',
  },
  {
    name: 'Pendapatan Bulanan',
    stat: 'Rp 45.231.000',
    icon: CurrencyDollarIcon,
    change: '8%',
    changeType: 'increase',
  },
  {
    name: 'Total Tagihan',
    stat: '892',
    icon: DocumentDuplicateIcon,
    change: '3%',
    changeType: 'increase',
  },
  {
    name: 'Pending Pembayaran',
    stat: '23',
    icon: ExclamationTriangleIcon,
    change: '5%',
    changeType: 'decrease',
  },
];

const Dashboard = () => {
  
  return (
    <div className="space-y-8 bg-white p-5">
      <PageHeader title="Ringkasan Dashboard" />
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
          >
            <dt>
              <div className="absolute bg-blue-500 rounded-md p-3">
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 truncate">{item.name}</p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  item.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {item.changeType === 'increase' ? '+' : '-'}
                {item.change}
              </p>
            </dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Aktivitas Terbaru</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-600">Pelanggan baru terdaftar: John Doe</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-sm text-gray-600">Tagihan #INV-001 berhasil dibuat</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-sm text-gray-600">Pembayaran diterima: Rp 450.000</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Aksi Cepat</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Tambah Pelanggan
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              Buat Tagihan
            </button>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
              Catat Pembayaran
            </button>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
              Lihat Laporan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;