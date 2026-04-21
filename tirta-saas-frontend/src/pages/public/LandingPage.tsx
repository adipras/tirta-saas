import { useState, useEffect } from 'react';
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
import { apiClient } from '../../services/apiClient';

interface SubscriptionPlan {
  id: string;
  plan: string;
  name: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  max_users: number;
  max_customers: number;
  max_storage_gb: number;
  max_api_calls_per_day: number;
  features: string[];
  trial_days: number;
  display_order: number;
  is_active: boolean;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [pricingPlans, setPricingPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    fetchSubscriptionPlans();
  }, []);

  const fetchSubscriptionPlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await apiClient.get('/public/subscription-plans');
      const plans = response.data || [];
      // Filter only active plans and sort by display_order
      const activePlans = plans
        .filter((plan: SubscriptionPlan) => plan.is_active)
        .sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.display_order - b.display_order);
      setPricingPlans(activePlans);
    } catch (error) {
      console.error('Failed to fetch subscription plans:', error);
      // Keep empty array on error
    } finally {
      setLoadingPlans(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isPopularPlan = (plan: SubscriptionPlan) => {
    // Mark middle plan as popular, or plan with name containing "pro" or "premium"
    return plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('premium');
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">TirtaSaaS</h1>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:space-x-4 sm:gap-4">
              <button
                onClick={() => navigate('/admin/login')}
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Daftar Gratis
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="text-center">
          <h1 className="mb-6 text-3xl font-extrabold text-gray-900 sm:text-5xl">
            Sistem Manajemen Air Bersih
            <br />
            <span className="text-blue-600">untuk RT/RW & Kelurahan</span>
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-base text-gray-600 sm:text-xl">
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
          <p className="mt-4 text-sm leading-6 text-gray-500">
            ✓ Tidak perlu kartu kredit  ✓ Setup 5 menit  ✓ Support 24/7
          </p>
        </div>
      </section>

      {/* Features Section */}
       <section className="bg-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="mb-12 text-center sm:mb-16">
             <h2 className="mb-4 text-3xl font-extrabold text-gray-900">
              Fitur Lengkap untuk Pengelolaan Air
            </h2>
             <p className="text-base text-gray-600 sm:text-xl">
               Semua yang Anda butuhkan dalam satu platform
             </p>
           </div>
           <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
       <section className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="mb-12 text-center sm:mb-16">
             <h2 className="mb-4 text-3xl font-extrabold text-gray-900">
              Cara Memulai
            </h2>
             <p className="text-base text-gray-600 sm:text-xl">
              Mulai kelola air bersih dalam 3 langkah mudah
            </p>
          </div>
           <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Daftar & Trial Gratis</h3>
              <p className="text-gray-600">
                Daftar dengan email dan informasi RT/RW Anda. Dapatkan akses trial 14 hari gratis untuk mencoba semua fitur platform.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Coba Semua Fitur</h3>
              <p className="text-gray-600">
                Selama trial, gunakan semua fitur: kelola pelanggan, buat invoice, terima pembayaran, lihat laporan.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Pilih Paket & Lanjutkan</h3>
              <p className="text-gray-600">
                Setelah trial, pilih paket yang sesuai kebutuhan Anda (Basic/Premium/Enterprise) dan lanjutkan berlangganan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
       <section id="pricing" className="bg-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="mb-12 text-center sm:mb-16">
             <h2 className="mb-4 text-3xl font-extrabold text-gray-900">
              Harga Transparan
            </h2>
             <p className="text-base text-gray-600 sm:text-xl">
              Pilih paket sesuai kebutuhan Anda
            </p>
          </div>
          
          {loadingPlans ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : pricingPlans.length > 0 ? (
             <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
               {pricingPlans.map((plan) => {
                 const popular = isPopularPlan(plan);
                 return (
                  <div
                    key={plan.id}
                    className={`rounded-lg ${
                      popular
                        ? 'bg-blue-600 text-white shadow-xl md:scale-105'
                        : 'bg-white border-2 border-gray-200'
                    } p-8 relative`}
                  >
                    {popular && (
                      <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 px-3 py-1 rounded-bl-lg rounded-tr-lg text-sm font-semibold">
                        POPULER
                      </div>
                    )}
                    <h3
                      className={`text-2xl font-bold mb-4 ${
                        popular ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {plan.name}
                    </h3>
                    {plan.description && (
                      <p className={`text-sm mb-4 ${popular ? 'text-blue-100' : 'text-gray-600'}`}>
                        {plan.description}
                      </p>
                    )}
                    <div className="mb-6">
                      <span className="text-4xl font-extrabold">
                        {formatCurrency(plan.monthly_price)}
                      </span>
                      <span className="text-xl">/bulan</span>
                      {plan.yearly_price > 0 && (
                        <div className="text-sm mt-2">
                          <span className={popular ? 'text-blue-200' : 'text-gray-600'}>
                            atau {formatCurrency(plan.yearly_price)}/tahun
                          </span>
                        </div>
                      )}
                    </div>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start">
                        <CheckCircleIcon
                          className={`h-6 w-6 ${
                            popular ? 'text-blue-200' : 'text-green-500'
                          } mr-2 flex-shrink-0`}
                        />
                        <span className={popular ? 'text-blue-50' : 'text-gray-600'}>
                          Hingga {plan.max_customers} pelanggan
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon
                          className={`h-6 w-6 ${
                            popular ? 'text-blue-200' : 'text-green-500'
                          } mr-2 flex-shrink-0`}
                        />
                        <span className={popular ? 'text-blue-50' : 'text-gray-600'}>
                          {plan.max_users} users
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon
                          className={`h-6 w-6 ${
                            popular ? 'text-blue-200' : 'text-green-500'
                          } mr-2 flex-shrink-0`}
                        />
                        <span className={popular ? 'text-blue-50' : 'text-gray-600'}>
                          {plan.max_storage_gb} GB storage
                        </span>
                      </li>
                      {plan.trial_days > 0 && (
                        <li className="flex items-start">
                          <CheckCircleIcon
                            className={`h-6 w-6 ${
                              popular ? 'text-blue-200' : 'text-green-500'
                            } mr-2 flex-shrink-0`}
                          />
                          <span className={popular ? 'text-blue-50' : 'text-gray-600'}>
                            Trial {plan.trial_days} hari gratis
                          </span>
                        </li>
                      )}
                      {plan.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-start">
                          <CheckCircleIcon
                            className={`h-6 w-6 ${
                              popular ? 'text-blue-200' : 'text-green-500'
                            } mr-2 flex-shrink-0`}
                          />
                          <span className={popular ? 'text-blue-50' : 'text-gray-600'}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => navigate('/register')}
                      className={`w-full py-3 px-6 rounded-md font-medium ${
                        popular
                          ? 'bg-white text-blue-600 hover:bg-gray-100'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Mulai Sekarang
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">
                Paket subscription akan segera tersedia. Hubungi kami untuk informasi lebih lanjut.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Trust Section */}
       <section className="bg-blue-600 py-16 text-white sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <ShieldCheckIcon className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-3xl font-extrabold mb-4">
              Aman & Terpercaya
            </h2>
             <p className="mx-auto mb-8 max-w-2xl text-base text-blue-100 sm:text-xl">
              Data Anda tersimpan aman dengan enkripsi tingkat bank. 
              Backup otomatis dan uptime 99.9%.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
       <section className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Siap Tingkatkan Pengelolaan Air di RT/RW Anda?
          </h2>
           <p className="mb-8 text-base text-gray-600 sm:text-xl">
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
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
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
