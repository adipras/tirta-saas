import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence, type Variants } from 'framer-motion';
import {
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Smartphone,
  Clock,
  Shield,
  CheckCircle2,
  ChevronRight,
  Menu,
  X,
  Droplets,
  Zap,
  TrendingUp,
  Bell,
  Star,
  ArrowRight,
  Check,
} from 'lucide-react';
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

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="absolute -inset-4 bg-brand-500/20 rounded-3xl blur-3xl" />
      <div className="relative bg-surface-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 mx-3">
            <div className="h-5 bg-white/5 rounded-md w-48 mx-auto flex items-center justify-center">
              <span className="text-[10px] text-white/40 font-mono">app.tirtasaas.id/admin</span>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Pelanggan', val: '248', icon: '👥', color: 'text-brand-400' },
              { label: 'Invoice', val: '93', icon: '📄', color: 'text-success-400' },
              { label: 'Pendapatan', val: '42.3jt', icon: '💰', color: 'text-warning-400' },
              { label: 'Lunas', val: '87%', icon: '✅', color: 'text-success-400' },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                <div className="text-base">{s.icon}</div>
                <div className={`text-sm font-bold mt-1 ${s.color}`}>{s.val}</div>
                <div className="text-[9px] text-white/40 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/60 font-medium">Pemakaian Air (m³)</span>
              <span className="text-[9px] text-success-400 bg-success-400/10 px-1.5 py-0.5 rounded-full">↑ 12%</span>
            </div>
            <div className="flex items-end gap-1.5 h-14">
              {[40, 65, 50, 80, 60, 90, 70, 85, 55, 75, 88, 78].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${h}%`,
                    background: i === 11
                      ? 'linear-gradient(to top, #4f46e5, #818cf8)'
                      : 'rgba(79, 70, 229, 0.3)',
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'].map((m) => (
                <span key={m} className="text-[7px] text-white/25">{m}</span>
              ))}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
            <div className="px-3 py-2 border-b border-white/5">
              <span className="text-[10px] text-white/60 font-medium">Invoice Terbaru</span>
            </div>
            {[
              { name: 'Ahmad Suharto', amount: 'Rp 45.000', status: 'Lunas', color: 'text-success-400 bg-success-400/10' },
              { name: 'Siti Rahayu', amount: 'Rp 38.500', status: 'Belum', color: 'text-danger-400 bg-danger-400/10' },
              { name: 'Budi Santoso', amount: 'Rp 52.000', status: 'Lunas', color: 'text-success-400 bg-success-400/10' },
            ].map((inv) => (
              <div key={inv.name} className="flex items-center justify-between px-3 py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-[9px] text-brand-300">
                    {inv.name[0]}
                  </div>
                  <span className="text-[9px] text-white/70">{inv.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-white/50">{inv.amount}</span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${inv.color}`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [pricingPlans, setPricingPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetchSubscriptionPlans();
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const fetchSubscriptionPlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await apiClient.get('/public/subscription-plans');
      const plans = response.data || [];
      const activePlans = plans
        .filter((plan: SubscriptionPlan) => plan.is_active)
        .sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.display_order - b.display_order);
      setPricingPlans(activePlans);
    } catch {
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
    return plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('premium');
  };

  const features = [
    {
      icon: Users,
      title: 'Manajemen Pelanggan',
      description: 'Kelola data pelanggan air dengan mudah dan terorganisir. Import massal via Excel.',
      color: 'bg-brand-50 text-brand-600',
      border: 'hover:border-brand-200',
    },
    {
      icon: FileText,
      title: 'Invoice Otomatis',
      description: 'Generate tagihan bulanan secara otomatis berdasarkan pemakaian meter air.',
      color: 'bg-success-50 text-success-600',
      border: 'hover:border-success-200',
    },
    {
      icon: CreditCard,
      title: 'Pembayaran Fleksibel',
      description: 'Terima pembayaran via transfer bank, QRIS, dan e-wallet dengan verifikasi cepat.',
      color: 'bg-purple-50 text-purple-600',
      border: 'hover:border-purple-200',
    },
    {
      icon: BarChart3,
      title: 'Laporan Real-time',
      description: 'Dashboard analitik dan laporan keuangan yang bisa diakses kapan saja.',
      color: 'bg-warning-50 text-warning-600',
      border: 'hover:border-warning-200',
    },
    {
      icon: Smartphone,
      title: 'Akses Mobile',
      description: 'Kelola bisnis dari mana saja via smartphone — iOS maupun Android.',
      color: 'bg-info-50 text-info-600',
      border: 'hover:border-info-200',
    },
    {
      icon: Clock,
      title: 'Trial 14 Hari',
      description: 'Coba seluruh fitur platform gratis selama 14 hari. Tanpa kartu kredit.',
      color: 'bg-danger-50 text-danger-600',
      border: 'hover:border-danger-200',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Daftar & Trial Gratis',
      desc: 'Daftar dengan email dan informasi RT/RW Anda. Dapatkan akses trial 14 hari penuh tanpa biaya.',
      icon: Zap,
    },
    {
      num: '02',
      title: 'Coba Semua Fitur',
      desc: 'Kelola pelanggan, buat invoice, terima pembayaran, pantau laporan keuangan secara real-time.',
      icon: TrendingUp,
    },
    {
      num: '03',
      title: 'Pilih Paket & Lanjutkan',
      desc: 'Setelah trial, pilih paket Basic/Premium/Enterprise yang sesuai kebutuhan RT/RW Anda.',
      icon: Star,
    },
  ];

  const stats = [
    { val: '500+', label: 'RT/RW Aktif' },
    { val: '50rb+', label: 'Pelanggan Terkelola' },
    { val: '99.9%', label: 'Uptime SLA' },
    { val: '24/7', label: 'Support Siap' },
  ];

  return (
    <div className="min-h-screen bg-surface-50 font-sans antialiased">

      {/* Navbar */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl border-b border-surface-100 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="overflow-hidden" style={{ margin: '-10px -12px' }}>
                <img
                  src="/logo.png"
                  alt="Tirta SaaS"
                  className="h-20 w-auto mix-blend-multiply"
                  style={{ maxWidth: '180px' }}
                />
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-surface-600 hover:text-brand-600 transition-colors">Fitur</a>
              <a href="#how-it-works" className="text-sm font-medium text-surface-600 hover:text-brand-600 transition-colors">Cara Kerja</a>
              <a href="#pricing" className="text-sm font-medium text-surface-600 hover:text-brand-600 transition-colors">Harga</a>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate('/admin/login')}
                className="text-sm font-medium text-surface-700 hover:text-brand-600 transition-colors px-4 py-2"
              >
                Masuk
              </button>
              <button
                onClick={() => navigate('/register')}
                className="btn-primary"
              >
                Coba Gratis
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              className="md:hidden p-2 rounded-lg text-surface-600 hover:bg-surface-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-white border-b border-surface-100 shadow-lg"
            >
              <div className="px-4 py-4 space-y-1">
                {[
                  { label: 'Fitur', href: '#features' },
                  { label: 'Cara Kerja', href: '#how-it-works' },
                  { label: 'Harga', href: '#pricing' },
                ].map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 text-sm font-medium text-surface-700 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
                <div className="pt-3 pb-1 border-t border-surface-100 flex flex-col gap-2">
                  <button
                    onClick={() => { navigate('/admin/login'); setMobileMenuOpen(false); }}
                    className="btn-secondary w-full"
                  >
                    Masuk
                  </button>
                  <button
                    onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}
                    className="btn-primary w-full"
                  >
                    Coba Gratis — 14 Hari
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero */}
      <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern" />
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-brand-50/80 to-transparent pointer-events-none" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-brand-300/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <motion.div variants={fadeUp} className="mb-6 -ml-3">
                <img src="/logo.png" alt="Tirta SaaS" className="h-28 sm:h-36 w-auto mix-blend-multiply" style={{ maxWidth: '320px' }} />
              </motion.div>

              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
                <Droplets className="w-3.5 h-3.5" />
                Platform #1 Manajemen Air untuk RT/RW
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-surface-900 leading-[1.1] tracking-tight mb-6"
              >
                Kelola Air Bersih
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">
                  Lebih Cerdas & Efisien
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} className="text-base sm:text-lg text-surface-500 leading-relaxed max-w-xl mb-8">
                Tirta SaaS mengotomasi tagihan air, pembayaran, dan laporan keuangan untuk RT/RW & Kelurahan di seluruh Indonesia. Setup 5 menit, langsung jalan.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mb-8">
                <button
                  onClick={() => navigate('/register')}
                  className="btn-primary text-base px-7 py-3.5"
                >
                  Mulai Trial 14 Hari Gratis
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn-secondary text-base px-7 py-3.5"
                >
                  Lihat Paket Harga
                </button>
              </motion.div>

              <motion.div variants={fadeUp} className="flex flex-wrap gap-x-5 gap-y-2">
                {['Tidak perlu kartu kredit', 'Setup 5 menit', 'Support 24/7'].map((t) => (
                  <div key={t} className="flex items-center gap-1.5 text-sm text-surface-500">
                    <CheckCircle2 className="w-4 h-4 text-success-500 flex-shrink-0" />
                    {t}
                  </div>
                ))}
              </motion.div>
            </AnimatedSection>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              className="animate-float"
            >
              <DashboardMockup />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="absolute -bottom-4 -left-4 bg-white border border-surface-100 rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 max-w-xs"
              >
                <div className="w-9 h-9 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-success-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-surface-900">Invoice terkirim otomatis</p>
                  <p className="text-[11px] text-surface-400 mt-0.5">48 tagihan digenerate — baru saja</p>
                </div>
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-surface-200 rounded-2xl overflow-hidden border border-surface-200"
          >
            {stats.map((s) => (
              <div key={s.label} className="bg-white px-6 py-5 text-center">
                <div className="font-display text-2xl sm:text-3xl font-bold text-surface-900">{s.val}</div>
                <div className="text-sm text-surface-500 mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">Fitur Platform</motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold text-surface-900 mb-4">
              Semua yang Anda butuhkan,<br />
              <span className="text-surface-400">dalam satu platform</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-surface-500 text-base sm:text-lg max-w-2xl mx-auto">
              Dari manajemen pelanggan hingga laporan keuangan — Tirta SaaS menangani semuanya sehingga Anda bisa fokus pada hal yang penting.
            </motion.p>
          </AnimatedSection>

          <AnimatedSection className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                className={`group relative bg-white border border-surface-100 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-default ${feature.border}`}
              >
                <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${feature.color} mb-4`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-base font-semibold text-surface-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">Cara Memulai</motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold text-surface-900 mb-4">Mulai dalam 3 langkah mudah</motion.h2>
            <motion.p variants={fadeUp} className="text-surface-500 text-base sm:text-lg max-w-xl mx-auto">
              Tidak perlu keahlian teknis. Tidak perlu install apapun. Langsung dari browser.
            </motion.p>
          </AnimatedSection>

          <AnimatedSection className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div key={i} variants={fadeUp} className="relative flex flex-col items-start">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%+1rem)] w-8 h-px bg-surface-200 -translate-y-1/2" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center mb-5 shadow-lg shadow-brand-200">
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <div className="font-mono text-xs font-bold text-brand-400 mb-2">{step.num}</div>
                <h3 className="font-display text-lg font-semibold text-surface-900 mb-2">{step.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">Harga</motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold text-surface-900 mb-4">Harga transparan, tanpa biaya tersembunyi</motion.h2>
            <motion.p variants={fadeUp} className="text-surface-500 text-base sm:text-lg max-w-xl mx-auto">
              Pilih paket yang sesuai kebutuhan RT/RW Anda. Semua paket dilengkapi trial 14 hari gratis.
            </motion.p>
          </AnimatedSection>

          {loadingPlans ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-12 h-12 rounded-full border-2 border-surface-200 border-t-brand-600 animate-spin" />
            </div>
          ) : pricingPlans.length > 0 ? (
            <AnimatedSection className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {pricingPlans.map((plan) => {
                const popular = isPopularPlan(plan);
                return (
                  <motion.div
                    key={plan.id}
                    variants={fadeUp}
                    className={`relative rounded-2xl p-8 flex flex-col transition-all duration-300 ${
                      popular
                        ? 'bg-surface-900 text-white shadow-2xl shadow-surface-900/30 ring-1 ring-white/10 md:-mt-4 md:mb-4'
                        : 'bg-white border border-surface-200 hover:border-surface-300 hover:shadow-lg'
                    }`}
                  >
                    {popular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center gap-1.5 bg-brand-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                          <Star className="w-3 h-3 fill-current" />
                          PALING POPULER
                        </span>
                      </div>
                    )}

                    <div className="mb-6">
                      <h3 className={`font-display text-xl font-bold mb-2 ${popular ? 'text-white' : 'text-surface-900'}`}>{plan.name}</h3>
                      {plan.description && (
                        <p className={`text-sm ${popular ? 'text-surface-400' : 'text-surface-500'}`}>{plan.description}</p>
                      )}
                    </div>

                    <div className="mb-8">
                      <div className="flex items-baseline gap-1">
                        <span className={`font-display text-4xl font-extrabold ${popular ? 'text-white' : 'text-surface-900'}`}>
                          {formatCurrency(plan.monthly_price)}
                        </span>
                        <span className={`text-sm ${popular ? 'text-surface-400' : 'text-surface-500'}`}>/bln</span>
                      </div>
                      {plan.yearly_price > 0 && (
                        <p className={`text-xs mt-1.5 ${popular ? 'text-surface-500' : 'text-surface-400'}`}>
                          atau {formatCurrency(plan.yearly_price)}/tahun (hemat 2 bulan)
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {[
                        `Hingga ${plan.max_customers} pelanggan`,
                        `${plan.max_users} pengguna admin`,
                        `${plan.max_storage_gb} GB penyimpanan`,
                        ...(plan.trial_days > 0 ? [`Trial ${plan.trial_days} hari gratis`] : []),
                        ...plan.features,
                      ].map((feat, fi) => (
                        <li key={fi} className="flex items-start gap-2.5">
                          <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                            popular ? 'bg-brand-500/20' : 'bg-success-50'
                          }`}>
                            <Check className={`w-2.5 h-2.5 ${popular ? 'text-brand-300' : 'text-success-600'}`} />
                          </div>
                          <span className={`text-sm ${popular ? 'text-surface-300' : 'text-surface-600'}`}>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => navigate('/register')}
                      className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 ${
                        popular
                          ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-900/30'
                          : 'bg-surface-900 hover:bg-surface-800 text-white'
                      }`}
                    >
                      Mulai Sekarang
                    </button>
                  </motion.div>
                );
              })}
            </AnimatedSection>
          ) : (
            <div className="text-center py-16 text-surface-400">
              <p>Paket subscription akan segera tersedia. Hubungi kami untuk informasi lebih lanjut.</p>
            </div>
          )}
        </div>
      </section>

      {/* Security Banner */}
      <section className="py-20 sm:py-28 bg-surface-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center">
            <motion.div variants={fadeUp} className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/20 mb-6">
              <Shield className="w-8 h-8 text-brand-400" />
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">Keamanan tingkat enterprise</motion.h2>
            <motion.p variants={fadeUp} className="text-surface-400 text-base sm:text-lg max-w-2xl mx-auto mb-12">
              Data Anda dilindungi enkripsi end-to-end, backup otomatis setiap hari, dan infrastruktur cloud yang terjamin.
            </motion.p>

            <motion.div variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Shield, label: 'SSL / TLS Encryption', sub: 'Data terenkripsi penuh' },
                { icon: Clock, label: 'Backup Otomatis', sub: 'Setiap 24 jam' },
                { icon: Zap, label: '99.9% Uptime', sub: 'SLA terjamin' },
                { icon: Bell, label: 'Support 24/7', sub: 'Siap membantu kapanpun' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="flex flex-col items-center text-center bg-white/5 border border-white/10 rounded-2xl px-4 py-6 hover:bg-white/8 transition-colors"
                >
                  <item.icon className="w-6 h-6 text-brand-400 mb-3" />
                  <div className="text-sm font-semibold text-white mb-1">{item.label}</div>
                  <div className="text-xs text-surface-500">{item.sub}</div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28 bg-surface-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
              <Droplets className="w-3.5 h-3.5" />
              Bergabung dengan RT/RW terbaik di Indonesia
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold text-surface-900 mb-5">
              Siap mentransformasi pengelolaan<br />air bersih RT/RW Anda?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-surface-500 text-base sm:text-lg mb-8 max-w-xl mx-auto">
              Daftar sekarang dan rasakan perbedaannya. Trial 14 hari penuh, tanpa kartu kredit.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="btn-primary text-base px-8 py-4"
              >
                Daftar Sekarang — Gratis 14 Hari
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
            <motion.p variants={fadeUp} className="mt-6 text-sm text-surface-500">
              Sudah punya akun?{' '}
              <button
                onClick={() => navigate('/admin/login')}
                className="text-brand-600 hover:text-brand-700 font-medium underline underline-offset-2"
              >
                Masuk di sini
              </button>
            </motion.p>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-900 text-surface-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="inline-block bg-white rounded-xl px-3 py-2 mb-5 shadow-sm" style={{ margin: '-8px -10px', marginBottom: '20px' }}>
                <img src="/logo.png" alt="Tirta SaaS" className="h-16 w-auto" style={{ maxWidth: '200px' }} />
              </div>
              <p className="text-sm text-surface-500 leading-relaxed max-w-xs">
                Platform SaaS manajemen air bersih untuk RT/RW dan Kelurahan di seluruh Indonesia.
              </p>
            </div>

            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Produk</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Fitur</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Harga</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">Cara Kerja</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Perusahaan</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Tentang Kami</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kontak</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Bantuan</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Dokumentasi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-surface-600">© 2024 Tirta SaaS. All rights reserved.</p>
            <div className="flex items-center gap-1.5 text-xs text-surface-600">
              <Droplets className="w-3.5 h-3.5 text-brand-500" />
              Dibuat dengan ❤️ untuk Indonesia
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
