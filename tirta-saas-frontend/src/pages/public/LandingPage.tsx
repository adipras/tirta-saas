import { useNavigate } from 'react-router-dom';
import {
  CheckCircleIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: UserGroupIcon,
      title: 'Manajemen Pelanggan',
      description: 'Kelola data pelanggan air dengan mudah dan terorganisir',
    },
    {
      icon: DocumentTextIcon,
      title: 'Invoice Otomatis',
      description: 'Generate tagihan bulanan secara otomatis berdasarkan pemakaian',
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Pembayaran Fleksibel',
      description: 'Terima pembayaran via transfer bank, QRIS, dan e-wallet',
    },
    {
      icon: ChartBarIcon,
      title: 'Laporan Lengkap',
      description: 'Dashboard dan laporan keuangan real-time',
    },
    {
      icon: DevicePhoneMobileIcon,
      title: 'Akses Mobile',
      description: 'Kelola bisnis dari mana saja via smartphone',
    },
    {
      icon: ClockIcon,
      title: 'Trial 14 Hari',
      description: 'Coba gratis 14 hari, tidak perlu kartu kredit',
    },
  ];

  const pricingPlans = [
    {
      name: 'BASIC',
      price: 'Rp 500.000',
      period: '/bulan',
      features: [
        'Hingga 100 pelanggan',
        'Invoice otomatis',
        'Laporan dasar',
        'Support email',
      ],
      popular: false,
    },
    {
      name: 'PRO',
      price: 'Rp 1.000.000',
      period: '/bulan',
      features: [
        'Hingga 500 pelanggan',
        'Semua fitur Basic',
        'WhatsApp notifications',
        'Laporan lengkap',
        'Support prioritas',
      ],
      popular: true,
    },
    {
      name: 'ENTERPRISE',
      price: 'Custom',
      period: '',
      features: [
        'Unlimited pelanggan',
        'Semua fitur Pro',
        'Custom features',
        'Dedicated support',
        'On-premise deployment',
      ],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">TirtaSaaS</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/login')}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Daftar Gratis
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">
            Sistem Manajemen Air Bersih
            <br />
            <span className="text-blue-600">untuk RT/RW & Kelurahan</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Kelola tagihan air, pelanggan, dan pembayaran dengan mudah. 
            Tingkatkan efisiensi pengelolaan air bersih di lingkungan Anda.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
            >
              Mulai Trial 14 Hari Gratis
            </button>
            <button
              onClick={() => {
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
            >
              Lihat Harga
            </button>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            ✓ Tidak perlu kartu kredit  ✓ Setup 5 menit  ✓ Support 24/7
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Fitur Lengkap untuk Pengelolaan Air
            </h2>
            <p className="text-xl text-gray-600">
              Semua yang Anda butuhkan dalam satu platform
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-blue-50 rounded-lg hover:shadow-lg transition-shadow"
              >
                <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Cara Memulai
            </h2>
            <p className="text-xl text-gray-600">
              Mulai kelola air bersih dalam 3 langkah mudah
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Daftar Gratis</h3>
              <p className="text-gray-600">
                Daftar dengan email dan informasi RT/RW Anda. Trial 14 hari langsung aktif.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Input Data Pelanggan</h3>
              <p className="text-gray-600">
                Masukkan data pelanggan air, tarif, dan rekening bank untuk pembayaran.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Kelola & Monitor</h3>
              <p className="text-gray-600">
                Catat pemakaian, generate invoice, terima pembayaran. Semua otomatis!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Harga Transparan
            </h2>
            <p className="text-xl text-gray-600">
              Pilih paket sesuai kebutuhan Anda
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-lg ${
                  plan.popular
                    ? 'bg-blue-600 text-white shadow-xl scale-105'
                    : 'bg-white border-2 border-gray-200'
                } p-8 relative`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 px-3 py-1 rounded-bl-lg rounded-tr-lg text-sm font-semibold">
                    POPULER
                  </div>
                )}
                <h3
                  className={`text-2xl font-bold mb-4 ${
                    plan.popular ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-xl">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start">
                      <CheckCircleIcon
                        className={`h-6 w-6 ${
                          plan.popular ? 'text-blue-200' : 'text-green-500'
                        } mr-2 flex-shrink-0`}
                      />
                      <span className={plan.popular ? 'text-blue-50' : 'text-gray-600'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/register')}
                  className={`w-full py-3 px-6 rounded-md font-medium ${
                    plan.popular
                      ? 'bg-white text-blue-600 hover:bg-gray-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Mulai Sekarang
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <ShieldCheckIcon className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-3xl font-extrabold mb-4">
              Aman & Terpercaya
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Data Anda tersimpan aman dengan enkripsi tingkat bank. 
              Backup otomatis dan uptime 99.9%.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Siap Tingkatkan Pengelolaan Air di RT/RW Anda?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Bergabung dengan puluhan RT/RW yang sudah menggunakan TirtaSaaS
          </p>
          <button
            onClick={() => navigate('/register')}
            className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Daftar Sekarang - Gratis 14 Hari
          </button>
          <p className="mt-4 text-sm text-gray-500">
            Sudah punya akun?{' '}
            <button
              onClick={() => navigate('/admin/login')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Login di sini
            </button>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">TirtaSaaS</h3>
              <p className="text-sm">
                Solusi manajemen air bersih untuk RT/RW dan Kelurahan di Indonesia.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Produk</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Fitur</a></li>
                <li><a href="#pricing" className="hover:text-white">Harga</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Perusahaan</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Tentang Kami</a></li>
                <li><a href="#" className="hover:text-white">Kontak</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Bantuan</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Support</a></li>
                <li><a href="#" className="hover:text-white">Dokumentasi</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 TirtaSaaS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
