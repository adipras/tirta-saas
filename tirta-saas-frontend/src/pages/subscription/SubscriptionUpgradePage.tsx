import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDaysIcon,
  CheckIcon,
  CheckCircleIcon,
  ClockIcon,
  CloudArrowUpIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  DashboardStatCard,
  FormInput,
  FormSelect,
  FormTextarea,
  PageHeader,
  useToast,
} from '../../components';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import { platformPaymentSettingsService } from '../../services/platformPaymentSettingsService';
import type { PlatformPaymentSettings } from '../../services/platformPaymentSettingsService';
import { subscriptionPaymentService } from '../../services/subscriptionPaymentService';

interface PlanOption {
  id: string;
  code: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
}

interface RegistrationInvoice {
  id: string;
  invoiceNumber: string;
  type: string;
  status: string;
  subscriptionPlan: string;
  planName: string;
  billingPeriod: number;
  amount: number;
  description: string;
  issuedAt: string;
  dueDate?: string;
  paidAt?: string;
}

interface PublicPlanApi {
  id: string;
  plan: string;
  name: string;
  description?: string;
  monthly_price: number;
  yearly_price: number;
  features?: string[];
}

const DEFAULT_PAYMENT_SETTINGS: PlatformPaymentSettings = {
  bank_accounts: [
    {
      bank_name: 'BCA',
      account_number: '1234567890',
      account_name: 'PT Tirta SaaS Indonesia',
    },
  ],
  qr_codes: [],
  payment_methods: ['bank_transfer'],
};

const billingPeriodOptions = [
  { months: 1, label: 'Bulanan', helper: 'Cocok untuk mulai cepat' },
  { months: 12, label: 'Tahunan', helper: 'Ringkas untuk operasional panjang' },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (value?: string) => {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatBillingPeriod = (months: number) => {
  if (months === 12) {
    return '1 tahun';
  }

  return `${months} bulan`;
};

const formatPaymentMethod = (method: string) => {
  switch (method) {
    case 'bank_transfer':
      return 'Transfer bank';
    case 'e_wallet':
    case 'e-wallet':
      return 'E-Wallet / QRIS';
    default:
      return 'Metode lain';
  }
};

const formatInvoiceStatus = (status?: string) => {
  if (!status) {
    return '-';
  }

  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

const buildFallbackPlanFromInvoice = (invoice: RegistrationInvoice): PlanOption => ({
  id: `invoice-${invoice.id}`,
  code: invoice.subscriptionPlan,
  name: invoice.planName,
  description: invoice.description,
  monthlyPrice:
    invoice.billingPeriod > 0 ? Math.round(invoice.amount / invoice.billingPeriod) : invoice.amount,
  yearlyPrice: invoice.billingPeriod >= 12 ? invoice.amount : 0,
  features: [],
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parsePlans = (payload: unknown): PublicPlanApi[] => {
  const rawItems =
    Array.isArray(payload) ? payload : isRecord(payload) && Array.isArray(payload.data) ? payload.data : [];

  return rawItems.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    if (
      typeof item.id !== 'string' ||
      typeof item.plan !== 'string' ||
      typeof item.name !== 'string' ||
      typeof item.monthly_price !== 'number' ||
      typeof item.yearly_price !== 'number'
    ) {
      return [];
    }

    return [
      {
        id: item.id,
        plan: item.plan,
        name: item.name,
        description: typeof item.description === 'string' ? item.description : '',
        monthly_price: item.monthly_price,
        yearly_price: item.yearly_price,
        features: Array.isArray(item.features)
          ? item.features.filter((feature): feature is string => typeof feature === 'string')
          : [],
      },
    ];
  });
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!isRecord(error)) {
    return fallback;
  }

  const response = error.response;
  if (!isRecord(response)) {
    return fallback;
  }

  const data = response.data;
  if (!isRecord(data) || typeof data.error !== 'string') {
    return fallback;
  }

  return data.error;
};

export default function SubscriptionUpgradePage() {
  const toast = useToast();
  const [step, setStep] = useState<
    'select-plan' | 'payment-form' | 'waiting-verification' | 'active-summary'
  >('select-plan');
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<number>(1);
  const [invoiceLocked, setInvoiceLocked] = useState(false);
  const [registrationInvoice, setRegistrationInvoice] = useState<RegistrationInvoice | null>(null);
  const [paymentSettings, setPaymentSettings] =
    useState<PlatformPaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [formData, setFormData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    accountNumber: '',
    accountName: '',
    referenceNumber: '',
    notes: '',
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    status: string;
    subscriptionStart?: string;
    subscriptionEnd?: string;
    daysRemaining: number;
    subscriptionPlan?: string;
    pendingPayment?: {
      id: string;
      status: string;
      submittedAt: string;
    };
  } | null>(null);

  const loadAvailablePlans = useCallback(async () => {
    try {
      setLoadingPlans(true);
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PUBLIC.SUBSCRIPTION_PLANS}`);
      if (!response.ok) {
        setPlans([]);
        return;
      }

      const payload: unknown = await response.json();
      const nextPlans = parsePlans(payload).map((plan) => ({
        id: plan.id,
        code: plan.plan,
        name: plan.name,
        description: plan.description || '',
        monthlyPrice: plan.monthly_price,
        yearlyPrice: plan.yearly_price,
        features: plan.features || [],
      }));

      setPlans(nextPlans);
    } catch {
      setPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  const loadPaymentSettings = useCallback(async () => {
    try {
      setLoadingSettings(true);
      const settings = await platformPaymentSettingsService.getPlatformPaymentSettings();
      setPaymentSettings({
        ...DEFAULT_PAYMENT_SETTINGS,
        ...settings,
        bank_accounts: settings.bank_accounts?.length
          ? settings.bank_accounts
          : DEFAULT_PAYMENT_SETTINGS.bank_accounts,
        qr_codes: settings.qr_codes || [],
        payment_methods: settings.payment_methods?.length
          ? settings.payment_methods
          : DEFAULT_PAYMENT_SETTINGS.payment_methods,
      });
    } catch {
      setPaymentSettings(DEFAULT_PAYMENT_SETTINGS);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  const loadSubscriptionStatus = useCallback(async () => {
    try {
      const status = await subscriptionPaymentService.getSubscriptionStatus();
      setSubscriptionStatus({
        status: status.status,
        subscriptionStart: status.subscriptionStart,
        subscriptionEnd: status.subscriptionEnd,
        daysRemaining: status.daysRemaining,
        subscriptionPlan: status.subscriptionPlan,
        pendingPayment: status.pendingPayment,
      });

      if (status.selectedPlan) {
        setSelectedPlan({
          id: status.selectedPlan.id,
          code: status.selectedPlan.plan,
          name: status.selectedPlan.name,
          description: status.selectedPlan.description,
          monthlyPrice: status.selectedPlan.monthlyPrice,
          yearlyPrice: status.selectedPlan.yearlyPrice,
          features: status.selectedPlan.features,
        });
      }

      if (status.registrationInvoice) {
        setRegistrationInvoice(status.registrationInvoice);
        setBillingPeriod(status.registrationInvoice.billingPeriod || 1);
        setInvoiceLocked(true);
      }

      if (status.pendingPayment || status.status === 'pending_verification') {
        setStep('waiting-verification');
        return;
      }

      if (status.status === 'active') {
        setStep('active-summary');
        return;
      }

      if (
        status.status === 'pending_payment' &&
        (status.selectedPlan || status.registrationInvoice)
      ) {
        setStep('payment-form');
      }
    } catch {
      // Keep default step when subscription data cannot be loaded.
    }
  }, []);

  useEffect(() => {
    void Promise.all([loadAvailablePlans(), loadPaymentSettings(), loadSubscriptionStatus()]);
  }, [loadAvailablePlans, loadPaymentSettings, loadSubscriptionStatus]);

  useEffect(() => {
    if (!paymentSettings.payment_methods.length) {
      return;
    }

    setFormData((current) =>
      paymentSettings.payment_methods.includes(current.paymentMethod)
        ? current
        : { ...current, paymentMethod: paymentSettings.payment_methods[0] }
    );
  }, [paymentSettings]);

  useEffect(() => {
    if (!registrationInvoice || selectedPlan) {
      return;
    }

    const matchedPlan = plans.find(
      (plan) =>
        plan.code === registrationInvoice.subscriptionPlan ||
        plan.name.toLowerCase() === registrationInvoice.planName.toLowerCase()
    );

    setSelectedPlan(matchedPlan || buildFallbackPlanFromInvoice(registrationInvoice));
  }, [plans, registrationInvoice, selectedPlan]);

  const paymentMethodOptions = useMemo(
    () =>
      paymentSettings.payment_methods.map((method) => ({
        value: method,
        label: formatPaymentMethod(method),
      })),
    [paymentSettings.payment_methods]
  );

  const hasQrCodes = paymentSettings.qr_codes.length > 0;
  const selectedBillingPeriod = registrationInvoice?.billingPeriod || billingPeriod;
  const activeDaysRemaining = subscriptionStatus?.daysRemaining ?? 0;
  const isExpiryUrgent = activeDaysRemaining > 0 && activeDaysRemaining <= 7;
  const isExpiryWarning = activeDaysRemaining > 7 && activeDaysRemaining <= 14;

  const calculateAmount = useCallback(() => {
    if (registrationInvoice) {
      return registrationInvoice.amount;
    }

    if (!selectedPlan) {
      return 0;
    }

    const total = selectedPlan.monthlyPrice * billingPeriod;
    if (billingPeriod === 12 && selectedPlan.yearlyPrice > 0) {
      return selectedPlan.yearlyPrice;
    }

    return total;
  }, [billingPeriod, registrationInvoice, selectedPlan]);

  const calculatePlanAmount = useCallback(
    (plan: PlanOption) => {
      if (billingPeriod === 12 && plan.yearlyPrice > 0) {
        return plan.yearlyPrice;
      }

      return plan.monthlyPrice * billingPeriod;
    },
    [billingPeriod]
  );

  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handlePlanSelect = (plan: PlanOption) => {
    setSelectedPlan(plan);
    setRegistrationInvoice(null);
    setInvoiceLocked(false);
    setProofFile(null);
    setError('');
    setStep('payment-form');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('File harus berupa JPG, PNG, atau PDF.');
      return;
    }

    setProofFile(file);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlan || !proofFile) {
      setError('Pilih paket dan unggah bukti pembayaran terlebih dahulu.');
      return;
    }

    if (!formData.accountName.trim()) {
      setError('Nama pengirim wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await subscriptionPaymentService.submitPayment(
        {
          subscriptionPlan: selectedPlan.code,
          billingPeriod: selectedBillingPeriod,
          amount: calculateAmount(),
          paymentDate: formData.paymentDate,
          paymentMethod: formData.paymentMethod,
          accountNumber: formData.accountNumber,
          accountName: formData.accountName,
          referenceNumber: formData.referenceNumber,
          notes: formData.notes,
        },
        proofFile
      );

      toast.success(`Pembayaran berhasil dikirim. ID konfirmasi: ${result.confirmationId}.`);
      setStep('waiting-verification');
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, 'Gagal mengirim konfirmasi pembayaran.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const summaryCards = [
    {
      title: 'Paket',
      value: selectedPlan?.name || registrationInvoice?.planName || subscriptionStatus?.subscriptionPlan || '-',
      helper: invoiceLocked ? 'Mengikuti invoice aktif' : 'Bisa diubah sebelum kirim pembayaran',
      subtitle: 'Paket yang sedang diproses pada flow langganan tenant.',
      icon: CreditCardIcon,
      tone: 'blue' as const,
    },
    {
      title: 'Periode',
      value: formatBillingPeriod(selectedBillingPeriod),
      helper: selectedBillingPeriod === 12 ? 'Penagihan tahunan' : 'Penagihan bulanan',
      subtitle: 'Durasi tagihan yang digunakan pada invoice atau paket terpilih.',
      icon: CalendarDaysIcon,
      tone: 'green' as const,
    },
    {
      title: 'Total Tagihan',
      value: formatCurrency(calculateAmount()),
      helper: proofFile ? 'Bukti bayar siap dikirim' : 'Menunggu unggah bukti bayar',
      subtitle: 'Nominal yang harus dibayarkan tenant sesuai paket aktif.',
      icon: DocumentTextIcon,
      tone: proofFile ? ('green' as const) : ('yellow' as const),
    },
  ];

  if (step === 'waiting-verification') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Menunggu Verifikasi"
          subtitle="Bukti pembayaran sudah diterima. Tim platform akan memeriksa pembayaran tenant sebelum aktivasi diproses."
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <DashboardStatCard
            title="Status"
            value="Menunggu Verifikasi"
            helper="Sedang diperiksa"
            subtitle="Pembayaran tenant belum aktif sampai proses verifikasi selesai."
            icon={ClockIcon}
            tone="blue"
          />
          <DashboardStatCard
            title="Paket"
            value={selectedPlan?.name || registrationInvoice?.planName || '-'}
            helper="Paket yang diajukan"
            subtitle="Nama paket yang sedang diproses pada pembayaran terakhir."
            icon={CreditCardIcon}
            tone="green"
          />
          <DashboardStatCard
            title="Nominal"
            value={formatCurrency(registrationInvoice?.amount || calculateAmount())}
            helper="Menunggu pengecekan"
            subtitle="Pastikan nominal yang dibayarkan sesuai invoice terbaru."
            icon={DocumentTextIcon}
            tone="yellow"
          />
        </div>

        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-blue-900">Ringkasan pembayaran terakhir</h2>
          <dl className="mt-4 space-y-3 text-sm text-blue-900">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-blue-700">Nomor invoice</dt>
              <dd className="text-right font-semibold">
                {registrationInvoice?.invoiceNumber || '-'}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-blue-700">Status pembayaran</dt>
              <dd className="text-right font-semibold">
                {formatInvoiceStatus(subscriptionStatus?.pendingPayment?.status || registrationInvoice?.status)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-blue-700">Tanggal submit</dt>
              <dd className="text-right font-semibold">
                {formatDate(subscriptionStatus?.pendingPayment?.submittedAt || registrationInvoice?.paidAt)}
              </dd>
            </div>
          </dl>
        </section>

        {registrationInvoice && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Detail invoice langganan</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Paket</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">{registrationInvoice.planName}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Total tagihan</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {formatCurrency(registrationInvoice.amount)}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    );
  }

  if (step === 'active-summary') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Langganan Tenant Aktif"
          subtitle="Ringkasan paket dan masa aktif tenant ditampilkan dalam format yang lebih mudah dipantau dari mobile."
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <DashboardStatCard
            title="Status"
            value="Aktif"
            helper="Tenant berjalan"
            subtitle="Akses tenant saat ini aktif dan dapat digunakan normal."
            icon={CheckCircleIcon}
            tone="green"
          />
          <DashboardStatCard
            title="Sisa Hari"
            value={`${activeDaysRemaining}`}
            helper={
              isExpiryUrgent
                ? 'Perlu perpanjangan cepat'
                : isExpiryWarning
                  ? 'Mendekati akhir periode'
                  : 'Masih aman'
            }
            subtitle="Pantau sisa masa aktif untuk menyiapkan perpanjangan lebih awal."
            icon={CalendarDaysIcon}
            tone={isExpiryUrgent || isExpiryWarning ? 'yellow' : 'blue'}
          />
          <DashboardStatCard
            title="Paket Aktif"
            value={selectedPlan?.name || subscriptionStatus?.subscriptionPlan || '-'}
            helper="Paket berjalan"
            subtitle="Paket yang saat ini dipakai oleh tenant Anda."
            icon={CreditCardIcon}
            tone="purple"
          />
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Detail langganan aktif</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
              <p className="text-sm text-green-700">Tanggal mulai</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {formatDate(subscriptionStatus?.subscriptionStart)}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm text-blue-700">Tanggal berakhir</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {formatDate(subscriptionStatus?.subscriptionEnd)}
              </p>
            </div>
          </div>
        </section>

        {(isExpiryUrgent || isExpiryWarning) && (
          <section
            className={`rounded-2xl border p-5 shadow-sm ${
              isExpiryUrgent
                ? 'border-red-200 bg-red-50 text-red-900'
                : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon
                className={`mt-0.5 h-6 w-6 flex-shrink-0 ${
                  isExpiryUrgent ? 'text-red-600' : 'text-amber-600'
                }`}
              />
              <div>
                <h3 className="text-base font-semibold">
                  {isExpiryUrgent
                    ? 'Masa langganan hampir berakhir'
                    : 'Langganan mendekati akhir masa aktif'}
                </h3>
                <p className="mt-2 text-sm leading-6">
                  {isExpiryUrgent
                    ? `Sisa masa aktif tenant tinggal ${activeDaysRemaining} hari. Segera siapkan proses perpanjangan agar layanan tidak terputus.`
                    : `Sisa masa aktif tenant tinggal ${activeDaysRemaining} hari. Silakan jadwalkan perpanjangan sebelum masa aktif habis.`}
                </p>
              </div>
            </div>
          </section>
        )}

        {selectedPlan?.features?.length ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Fitur paket aktif</h2>
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {selectedPlan.features.map((feature) => (
                <li key={feature} className="flex items-start text-sm text-gray-700">
                  <CheckIcon className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    );
  }

  if (step === 'select-plan') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Pilih Paket Langganan"
          subtitle="Pilih paket yang paling sesuai untuk operasional pengelolaan air, lalu lanjutkan ke pembayaran tenant dari satu flow yang ringkas."
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <DashboardStatCard
            title="Paket Tersedia"
            value={loadingPlans ? '...' : `${plans.length}`}
            helper="Siap dipilih"
            subtitle="Jumlah paket yang bisa dipakai tenant untuk aktivasi atau perpanjangan."
            icon={CreditCardIcon}
            tone="blue"
          />
          <DashboardStatCard
            title="Periode Aktif"
            value={formatBillingPeriod(billingPeriod)}
            helper={billingPeriod === 12 ? 'Opsi tahunan' : 'Opsi bulanan'}
            subtitle="Ganti periode lebih dulu agar total harga langsung mengikuti pilihan Anda."
            icon={CalendarDaysIcon}
            tone="green"
          />
          <DashboardStatCard
            title="Metode Bayar"
            value={`${paymentSettings.payment_methods.length}`}
            helper="Dari pengaturan platform"
            subtitle="Metode pembayaran aktif akan otomatis muncul saat tenant kirim bukti bayar."
            icon={DocumentTextIcon}
            tone="purple"
          />
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Pilih periode penagihan</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {billingPeriodOptions.map((period) => {
              const isActive = billingPeriod === period.months;

              return (
                <button
                  key={period.months}
                  type="button"
                  onClick={() => setBillingPeriod(period.months)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    isActive
                      ? 'border-blue-200 bg-blue-50 ring-2 ring-blue-500/30'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm text-gray-500">{period.helper}</p>
                  <p className="mt-2 text-lg font-semibold text-gray-900">{period.label}</p>
                  <p className="mt-1 text-sm text-gray-600">{formatBillingPeriod(period.months)}</p>
                </button>
              );
            })}
          </div>
        </section>

        {loadingPlans ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
            Memuat paket langganan...
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h2 className="mt-4 text-base font-semibold text-gray-900">Paket belum tersedia</h2>
            <p className="mt-2 text-sm text-gray-500">
              Admin platform belum menambahkan paket aktif. Coba lagi beberapa saat lagi.
            </p>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{plan.code}</p>
                    <h2 className="mt-2 text-xl font-semibold text-gray-900">{plan.name}</h2>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {formatBillingPeriod(billingPeriod)}
                  </span>
                </div>

                <div className="mt-5">
                  <p className="text-3xl font-semibold tracking-tight text-gray-900">
                    {formatCurrency(calculatePlanAmount(plan))}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {billingPeriod === 12
                      ? `${formatCurrency(plan.yearlyPrice)}/tahun`
                      : `${formatCurrency(plan.monthlyPrice)}/bulan`}
                  </p>
                </div>

                <p className="mt-4 text-sm leading-6 text-gray-500">
                  {plan.description || 'Paket ini siap dipakai untuk operasional tenant.'}
                </p>

                {plan.features.length > 0 && (
                  <ul className="mt-5 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start text-sm text-gray-700">
                        <CheckIcon className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  type="button"
                  onClick={() => handlePlanSelect(plan)}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Pilih Paket
                </button>
              </article>
            ))}
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pembayaran Langganan Tenant"
        subtitle="Lengkapi detail pembayaran, lihat instruksi transfer, lalu kirim bukti bayar dari layout yang lebih ringkas di mobile."
        actions={
          !invoiceLocked ? (
            <button
              type="button"
              onClick={() => setStep('select-plan')}
              className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
            >
              Ganti Paket
            </button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <DashboardStatCard
            key={card.title}
            title={card.title}
            value={card.value}
            helper={card.helper}
            subtitle={card.subtitle}
            icon={card.icon}
            tone={card.tone}
          />
        ))}
      </div>

      {error && (
        <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          {error}
        </section>
      )}

      <section className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-yellow-900">Langkah pembayaran</h2>
        <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-yellow-900">
          <li>Bayarkan sesuai nominal invoice atau paket yang dipilih.</li>
          <li>Gunakan rekening tujuan atau QRIS yang tersedia pada halaman ini.</li>
          <li>Isi form konfirmasi dan unggah bukti pembayaran yang jelas.</li>
          <li>Tim platform akan memverifikasi pembayaran sebelum tenant diaktifkan.</li>
        </ol>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Ringkasan paket & invoice</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <h3 className="text-sm font-semibold text-blue-900">Paket langganan</h3>
                <dl className="mt-3 space-y-3 text-sm text-blue-900">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-blue-700">Nama paket</dt>
                    <dd className="text-right font-semibold">{selectedPlan?.name || '-'}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-blue-700">Kode paket</dt>
                    <dd className="text-right font-semibold">{selectedPlan?.code || '-'}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-blue-700">Periode</dt>
                    <dd className="text-right font-semibold">{formatBillingPeriod(selectedBillingPeriod)}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-blue-700">Total paket</dt>
                    <dd className="text-right font-semibold">{formatCurrency(calculateAmount())}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-sm leading-6 text-blue-900">
                  {selectedPlan?.description || 'Paket diproses sesuai pilihan tenant saat ini.'}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <h3 className="text-sm font-semibold text-amber-900">Invoice langganan</h3>
                <dl className="mt-3 space-y-3 text-sm text-amber-900">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-amber-700">Nomor invoice</dt>
                    <dd className="text-right font-semibold">
                      {registrationInvoice?.invoiceNumber || 'Akan dibuat setelah konfirmasi'}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-amber-700">Status</dt>
                    <dd className="text-right font-semibold">
                      {formatInvoiceStatus(registrationInvoice?.status || 'draft')}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-amber-700">Tanggal terbit</dt>
                    <dd className="text-right font-semibold">{formatDate(registrationInvoice?.issuedAt)}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-amber-700">Jatuh tempo</dt>
                    <dd className="text-right font-semibold">{formatDate(registrationInvoice?.dueDate)}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-sm leading-6 text-amber-900">
                  {registrationInvoice?.description || 'Invoice akan mengikuti paket dan periode yang dipilih.'}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Tujuan pembayaran</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <h3 className="text-sm font-semibold text-gray-900">Rekening bank</h3>
                {loadingSettings ? (
                  <div className="py-6 text-center text-sm text-gray-500">
                    Memuat informasi pembayaran...
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {paymentSettings.bank_accounts.map((bank) => (
                      <div
                        key={`${bank.bank_name}-${bank.account_number}`}
                        className="rounded-2xl border border-gray-200 bg-white p-4"
                      >
                        <dl className="space-y-2 text-sm text-gray-700">
                          <div className="flex items-start justify-between gap-4">
                            <dt className="text-gray-500">Bank</dt>
                            <dd className="text-right font-semibold">{bank.bank_name}</dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt className="text-gray-500">Nomor rekening</dt>
                            <dd className="text-right font-semibold">{bank.account_number}</dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt className="text-gray-500">Atas nama</dt>
                            <dd className="text-right font-semibold">{bank.account_name}</dd>
                          </div>
                        </dl>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <h3 className="text-sm font-semibold text-gray-900">QR pembayaran / QRIS</h3>
                {loadingSettings ? (
                  <div className="py-6 text-center text-sm text-gray-500">Memuat QR pembayaran...</div>
                ) : hasQrCodes ? (
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {paymentSettings.qr_codes.map((qr) => (
                      <div key={qr.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-gray-900">{qr.type}</span>
                          {qr.is_primary && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                              Utama
                            </span>
                          )}
                        </div>
                        {qr.imageDisplayUrl ? (
                          <img
                            src={qr.imageDisplayUrl}
                            alt={`QR pembayaran ${qr.type}`}
                            className="mx-auto mt-4 h-40 w-40 rounded-xl border border-gray-200 object-contain"
                          />
                        ) : (
                          <div className="mt-4 flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-100 text-sm text-gray-500">
                            QR tidak tersedia
                          </div>
                        )}
                        {qr.notes && <p className="mt-3 text-xs leading-5 text-gray-500">{qr.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    Admin platform belum menambahkan QR pembayaran. Silakan gunakan transfer bank.
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <h2 className="text-base font-semibold text-blue-900">Form kirim bukti bayar</h2>
            <p className="mt-2 text-sm leading-6 text-blue-900">
              Isi data pembayaran dengan benar agar verifikasi langganan tenant dapat diproses tanpa hambatan.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900">Metode pembayaran tersedia</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {paymentSettings.payment_methods.map((method) => (
                  <span
                    key={method}
                    className="rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-700 ring-1 ring-gray-200"
                  >
                    {formatPaymentMethod(method)}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormInput
                type="date"
                label="Tanggal pembayaran"
                value={formData.paymentDate}
                onChange={(e) => handleFormChange('paymentDate', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
              <FormSelect
                label="Metode pembayaran"
                value={formData.paymentMethod}
                onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
                options={paymentMethodOptions}
                required
              />
            </div>

            <FormInput
              type="text"
              label="Nama pengirim"
              value={formData.accountName}
              onChange={(e) => handleFormChange('accountName', e.target.value)}
              placeholder="Nama pemilik rekening atau akun pengirim"
              required
            />

            <FormInput
              type="text"
              label="Nomor rekening / nomor akun"
              value={formData.accountNumber}
              onChange={(e) => handleFormChange('accountNumber', e.target.value)}
              placeholder="Nomor rekening atau nomor akun pengirim"
            />

            <FormInput
              type="text"
              label="Nomor referensi transaksi"
              value={formData.referenceNumber}
              onChange={(e) => handleFormChange('referenceNumber', e.target.value)}
              placeholder="Nomor referensi atau kode transaksi"
            />

            <FormTextarea
              label="Catatan tambahan"
              value={formData.notes}
              onChange={(e) => handleFormChange('notes', e.target.value)}
              rows={4}
              placeholder="Catatan tambahan untuk admin platform"
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Bukti pembayaran <span className="ml-1 text-red-500">*</span>
              </label>
              <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 transition-colors hover:border-gray-400">
                <div className="space-y-2 text-center">
                  {proofFile ? (
                    <>
                      <DocumentTextIcon className="mx-auto h-12 w-12 text-green-500" />
                      <p className="text-sm font-medium text-gray-900">{proofFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(proofFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        onClick={() => setProofFile(null)}
                        className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        Hapus File
                      </button>
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="text-sm text-gray-600">Unggah file JPG, PNG, atau PDF hingga 5MB.</p>
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
                        Pilih File
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,application/pdf"
                          onChange={handleFileChange}
                          required
                          className="sr-only"
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>

            {selectedPlan?.features.length ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <h3 className="text-sm font-semibold text-gray-900">Ringkasan fitur paket</h3>
                <ul className="mt-3 space-y-2">
                  {selectedPlan.features.slice(0, 5).map((feature) => (
                    <li key={feature} className="flex items-start text-sm text-gray-700">
                      <CheckIcon className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              {!invoiceLocked && (
                <button
                  type="button"
                  onClick={() => setStep('select-plan')}
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Kembali
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !proofFile}
                className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-b-white" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <CreditCardIcon className="mr-2 h-5 w-5" />
                    Kirim Bukti Bayar
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
