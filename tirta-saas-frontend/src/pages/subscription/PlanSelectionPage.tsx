import { useMemo, useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { DashboardStatCard, PageHeader } from '../../components';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
}

interface BillingOption {
  months: number;
  discountRate: number;
  label: string;
}

const plans: SubscriptionPlan[] = [
  {
    id: 'BASIC',
    name: 'Basic',
    price: 500000,
    features: [
      'Hingga 100 pelanggan',
      'Pencatatan pemakaian dasar',
      'Pembuatan invoice',
      'Pelacakan pembayaran',
      'Dukungan email',
      'Laporan bulanan',
    ],
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 1500000,
    features: [
      'Hingga 500 pelanggan',
      'Analitik pemakaian lanjutan',
      'Invoice otomatis',
      'Pengingat pembayaran',
      'Priority support',
      'Laporan lanjutan',
      'Mobile meter reading',
      'Notifikasi khusus',
    ],
    recommended: true,
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 3000000,
    features: [
      'Pelanggan tanpa batas',
      'Sistem manajemen air lengkap',
      'Analitik & BI tingkat lanjut',
      'Workflow otomatis',
      'Dedicated support',
      'Integrasi khusus',
      'Aplikasi mobile untuk seluruh peran',
      'White-label branding',
      'Jaminan SLA',
    ],
  },
];

const billingOptions: BillingOption[] = [
  { months: 1, discountRate: 0, label: '1 bulan' },
  { months: 3, discountRate: 0.05, label: '3 bulan • hemat 5%' },
  { months: 6, discountRate: 0.1, label: '6 bulan • hemat 10%' },
  { months: 12, discountRate: 0.15, label: '12 bulan • hemat 15%' },
];

const PlanSelectionPage = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string>('PRO');
  const [billingPeriod, setBillingPeriod] = useState<number>(1);

  const currentPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlan) ?? plans[0],
    [selectedPlan]
  );

  const currentBillingOption = useMemo(
    () => billingOptions.find((option) => option.months === billingPeriod) ?? billingOptions[0],
    [billingPeriod]
  );

  const handleContinue = () => {
    navigate('/subscription/payment', {
      state: {
        plan: currentPlan.id,
        planName: currentPlan.name,
        basePrice: currentPlan.price,
        billingPeriod,
        totalAmount: calculateTotal(currentPlan.price, billingPeriod, currentBillingOption.discountRate),
      },
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

  const calculateTotal = (basePrice: number, months: number, discountRate: number) =>
    Math.round(basePrice * months * (1 - discountRate));

  const totalAmount = calculateTotal(
    currentPlan.price,
    billingPeriod,
    currentBillingOption.discountRate
  );

  const totalSavings = Math.round(currentPlan.price * billingPeriod * currentBillingOption.discountRate);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pilih Paket Langganan"
        subtitle="Bandingkan paket dan pilih kombinasi periode yang paling cocok untuk kebutuhan tenant."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardStatCard
          title="Paket Dipilih"
          value={currentPlan.name}
          helper="Siap diproses"
          subtitle="Paket yang akan dibawa ke langkah pembayaran."
          icon={CheckIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Periode Billing"
          value={`${billingPeriod} bulan`}
          helper={currentBillingOption.discountRate > 0 ? `Hemat ${Math.round(currentBillingOption.discountRate * 100)}%` : 'Harga normal'}
          subtitle="Durasi pembayaran yang dipilih tenant."
          icon={CheckIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Total Pembayaran"
          value={formatCurrency(totalAmount)}
          helper={totalSavings > 0 ? `Hemat ${formatCurrency(totalSavings)}` : 'Tanpa diskon'}
          subtitle="Estimasi total yang akan diteruskan ke halaman pembayaran."
          icon={CheckIcon}
          tone="purple"
        />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <label htmlFor="billing-period" className="block text-sm font-semibold text-gray-900">
          Periode langganan
        </label>
        <p className="mt-1 text-sm text-gray-500">
          Semakin panjang periode, total pembayaran makin hemat.
        </p>
        <select
          id="billing-period"
          value={billingPeriod}
          onChange={(event) => setBillingPeriod(Number(event.target.value))}
          className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {billingOptions.map((option) => (
            <option key={option.months} value={option.months}>
              {option.label}
            </option>
          ))}
        </select>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const planTotal = calculateTotal(plan.price, billingPeriod, currentBillingOption.discountRate);

          return (
            <article
              key={plan.id}
              className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-100'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-gray-900">{plan.name}</h2>
                    {plan.recommended && (
                      <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        Rekomendasi
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-3xl font-bold text-gray-900">
                    {formatCurrency(plan.price)}
                    <span className="ml-1 text-sm font-normal text-gray-500">/bulan</span>
                  </p>
                  <p className="mt-2 text-sm font-medium text-blue-700">
                    Total {billingPeriod} bulan: {formatCurrency(planTotal)}
                  </p>
                </div>
              </div>

              <ul className="mt-5 space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={`${plan.id}-${index}`} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={`mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  isSelected
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isSelected ? 'Paket Terpilih' : 'Pilih Paket'}
              </button>
            </article>
          );
        })}
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">Ringkasan pesanan</h3>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <span className="text-gray-500">Paket</span>
            <span className="text-right font-medium text-gray-900">{currentPlan.name}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-gray-500">Periode</span>
            <span className="text-right font-medium text-gray-900">{billingPeriod} bulan</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-gray-500">Harga per bulan</span>
            <span className="text-right font-medium text-gray-900">
              {formatCurrency(currentPlan.price)}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-gray-500">Diskon periode</span>
            <span className="text-right font-medium text-gray-900">
              {currentBillingOption.discountRate > 0
                ? `${Math.round(currentBillingOption.discountRate * 100)}%`
                : 'Tidak ada'}
            </span>
          </div>
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-start justify-between gap-4">
              <span className="text-base font-semibold text-gray-900">Total pembayaran</span>
              <span className="text-right text-xl font-bold text-blue-600">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            Lanjut ke Pembayaran
          </button>
        </div>
      </section>
    </div>
  );
};

export default PlanSelectionPage;
