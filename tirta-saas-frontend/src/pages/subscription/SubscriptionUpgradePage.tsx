import { useEffect, useState } from 'react';
import {
  CalendarDaysIcon,
  CheckIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import { useToast } from '../../components';
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

const buildFallbackPlanFromInvoice = (invoice: {
  id: string;
  subscriptionPlan: string;
  planName: string;
  amount: number;
  billingPeriod: number;
  description: string;
}): PlanOption => ({
  id: `invoice-${invoice.id}`,
  code: invoice.subscriptionPlan,
  name: invoice.planName,
  description: invoice.description,
  monthlyPrice:
    invoice.billingPeriod > 0 ? Math.round(invoice.amount / invoice.billingPeriod) : invoice.amount,
  yearlyPrice: invoice.billingPeriod >= 12 ? invoice.amount : 0,
  features: [],
});

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
  const [registrationInvoice, setRegistrationInvoice] = useState<{
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
  } | null>(null);
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
  } | null>(null);

  useEffect(() => {
    void Promise.all([loadAvailablePlans(), loadPaymentSettings(), loadSubscriptionStatus()]);
  }, []);

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

  const loadAvailablePlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PUBLIC.SUBSCRIPTION_PLANS}`);
      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      const items = Array.isArray(payload) ? payload : payload.data || [];
      setPlans(
        items.map((plan: any) => ({
          id: plan.id,
          code: plan.plan,
          name: plan.name,
          description: plan.description,
          monthlyPrice: plan.monthly_price,
          yearlyPrice: plan.yearly_price,
          features: Array.isArray(plan.features) ? plan.features : [],
        }))
      );
    } catch {
      setPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const loadSubscriptionStatus = async () => {
    try {
      const status = await subscriptionPaymentService.getSubscriptionStatus();
      setSubscriptionStatus({
        status: status.status,
        subscriptionStart: status.subscriptionStart,
        subscriptionEnd: status.subscriptionEnd,
        daysRemaining: status.daysRemaining,
        subscriptionPlan: status.subscriptionPlan,
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
      // Keep default view when status cannot be loaded.
    }
  };

  const loadPaymentSettings = async () => {
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
  };

  const hasQrCodes = paymentSettings.qr_codes.length > 0;

  const calculateAmount = () => {
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
  };

  const calculatePlanAmount = (plan: PlanOption) => {
    if (billingPeriod === 12 && plan.yearlyPrice > 0) {
      return plan.yearlyPrice;
    }

    return plan.monthlyPrice * billingPeriod;
  };

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Transfer bank';
      case 'e_wallet':
        return 'E-Wallet / QRIS';
      default:
        return 'Metode lain';
    }
  };

  const activeDaysRemaining = subscriptionStatus?.daysRemaining ?? 0;
  const isExpiryUrgent = activeDaysRemaining > 0 && activeDaysRemaining <= 7;
  const isExpiryWarning = activeDaysRemaining > 7 && activeDaysRemaining <= 14;

  const handlePlanSelect = (plan: PlanOption) => {
    setSelectedPlan(plan);
    setRegistrationInvoice(null);
    setInvoiceLocked(false);
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
          billingPeriod: registrationInvoice?.billingPeriod || billingPeriod,
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
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal mengirim konfirmasi pembayaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'waiting-verification') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-xl bg-white p-8 shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <DocumentTextIcon className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="mb-3 text-center text-2xl font-bold text-gray-900">
            Menunggu Verifikasi Pembayaran
          </h2>
          <p className="mb-6 text-center text-gray-600">
            Bukti pembayaran langganan tenant sudah diterima. Admin platform akan memeriksa bukti
            pembayaran sebelum tenant diproses ke tahap aktivasi.
          </p>

          {registrationInvoice && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
              <div className="flex items-center justify-between gap-4">
                <span>Invoice</span>
                <span className="font-semibold">{registrationInvoice.invoiceNumber}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <span>Paket</span>
                <span className="font-semibold">{registrationInvoice.planName}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <span>Total tagihan</span>
                <span className="font-semibold">{formatCurrency(registrationInvoice.amount)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'active-summary') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="overflow-hidden rounded-lg bg-white shadow-lg">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-8 text-white">
            <h2 className="mb-2 text-2xl font-bold">Langganan Tenant Sedang Berjalan</h2>
            <p className="text-green-50">
              Tenant Anda sudah aktif. Halaman ini menampilkan informasi paket aktif dan masa
              langganan yang sedang berjalan.
            </p>
          </div>

          <div className="space-y-6 p-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-green-100 bg-green-50 p-4">
                <h3 className="mb-3 flex items-center font-semibold text-gray-900">
                  <CheckCircleIcon className="mr-2 h-5 w-5 text-green-600" />
                  Paket aktif
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between gap-4">
                    <span>Nama paket</span>
                    <span className="text-right font-semibold">
                      {selectedPlan?.name || subscriptionStatus?.subscriptionPlan || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Kode paket</span>
                    <span className="text-right font-semibold">
                      {selectedPlan?.code || subscriptionStatus?.subscriptionPlan || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Status</span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      AKTIF
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Harga paket</span>
                    <span className="text-right font-semibold">
                      {selectedPlan ? formatCurrency(selectedPlan.monthlyPrice) : '-'}
                    </span>
                  </div>
                </div>
                {selectedPlan?.description && (
                  <p className="mt-4 text-sm text-gray-600">{selectedPlan.description}</p>
                )}
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <h3 className="mb-3 flex items-center font-semibold text-gray-900">
                  <CalendarDaysIcon className="mr-2 h-5 w-5 text-blue-600" />
                  Periode langganan berjalan
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between gap-4">
                    <span>Tanggal mulai</span>
                    <span className="text-right font-semibold">
                      {formatDate(subscriptionStatus?.subscriptionStart)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Tanggal berakhir</span>
                    <span className="text-right font-semibold">
                      {formatDate(subscriptionStatus?.subscriptionEnd)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Sisa masa aktif</span>
                    <span
                      className={`text-right font-semibold ${
                        isExpiryUrgent
                          ? 'text-red-600'
                          : isExpiryWarning
                            ? 'text-amber-600'
                            : 'text-gray-900'
                      }`}
                    >
                      {activeDaysRemaining} hari
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {(isExpiryUrgent || isExpiryWarning) && (
              <div
                className={`rounded-lg border p-4 ${
                  isExpiryUrgent
                    ? 'border-red-200 bg-red-50 text-red-900'
                    : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}
              >
                <div className="flex items-start">
                  <ExclamationTriangleIcon
                    className={`mr-3 h-6 w-6 flex-shrink-0 ${
                      isExpiryUrgent ? 'text-red-600' : 'text-amber-600'
                    }`}
                  />
                  <div>
                    <h3 className="font-semibold">
                      {isExpiryUrgent
                        ? 'Masa langganan hampir berakhir'
                        : 'Langganan mendekati akhir masa aktif'}
                    </h3>
                    <p className="mt-1 text-sm">
                      {isExpiryUrgent
                        ? `Sisa masa aktif tenant tinggal ${activeDaysRemaining} hari. Segera siapkan perpanjangan langganan.`
                        : `Sisa masa aktif tenant tinggal ${activeDaysRemaining} hari. Silakan pantau masa langganan agar tidak terlewat.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedPlan?.features?.length ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-3 font-semibold text-gray-900">Fitur paket aktif</h3>
                <ul className="grid gap-3 md:grid-cols-2">
                  {selectedPlan.features.map((feature) => (
                    <li key={feature} className="flex items-start text-sm text-gray-700">
                      <CheckIcon className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'select-plan') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Pilih Paket Langganan</h1>
          <p className="text-lg text-gray-600">
            Pilih paket yang paling sesuai untuk operasional pengelolaan air Anda.
          </p>
        </div>

        <div className="mx-auto mb-12 max-w-md">
          <label className="mb-3 block text-center text-sm font-medium text-gray-700">
            Periode tagihan
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { months: 1, label: '1 Bulan' },
              { months: 12, label: '1 Tahun' },
            ].map((period) => (
              <button
                key={period.months}
                onClick={() => setBillingPeriod(period.months)}
                className={`rounded-lg border-2 px-4 py-3 transition-all ${
                  billingPeriod === period.months
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">{period.label}</div>
              </button>
            ))}
          </div>
        </div>

        {loadingPlans ? (
          <div className="py-12 text-center text-gray-500">Memuat paket langganan...</div>
        ) : (
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg transition-all hover:shadow-xl"
              >
                <div className="p-8">
                  <h3 className="mb-2 text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mb-3 text-sm font-medium uppercase tracking-wide text-blue-600">
                    {plan.code}
                  </div>
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatCurrency(calculatePlanAmount(plan))}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {billingPeriod === 12
                        ? `${formatCurrency(plan.yearlyPrice)}/tahun`
                        : `${formatCurrency(plan.monthlyPrice)}/bulan`}
                    </p>
                  </div>

                  {plan.description && (
                    <p className="mb-6 text-sm text-gray-600">{plan.description}</p>
                  )}

                  <ul className="mb-8 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <CheckIcon className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePlanSelect(plan)}
                    className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Pilih paket {plan.name}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {!invoiceLocked && (
        <div className="mb-6">
          <button
            onClick={() => setStep('select-plan')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Ganti paket
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow-lg">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
          <h2 className="mb-2 text-2xl font-bold">Langganan & Pembayaran Tenant</h2>
          <p className="text-blue-100">
            Halaman ini menampilkan detail paket, detail invoice, info pembayaran, dan form kirim
            bukti bayar.
          </p>
        </div>

        <div className="space-y-6 p-6">
          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <h3 className="mb-3 font-semibold text-gray-900">Detail paket langganan</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between gap-4">
                  <span>Nama paket</span>
                  <span className="text-right font-semibold">{selectedPlan?.name || '-'}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Kode paket</span>
                  <span className="text-right font-semibold">{selectedPlan?.code || '-'}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Periode</span>
                  <span className="text-right font-semibold">
                    {formatBillingPeriod(registrationInvoice?.billingPeriod || billingPeriod)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Harga paket</span>
                  <span className="text-right font-semibold">{formatCurrency(calculateAmount())}</span>
                </div>
              </div>
              {selectedPlan?.description && (
                <p className="mt-4 text-sm text-gray-600">{selectedPlan.description}</p>
              )}
            </div>

            <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
              <h3 className="mb-3 font-semibold text-gray-900">Detail invoice</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between gap-4">
                  <span>Nomor invoice</span>
                  <span className="text-right font-semibold">
                    {registrationInvoice?.invoiceNumber || 'Akan dibuat setelah konfirmasi'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Status</span>
                  <span className="text-right font-semibold">
                    {registrationInvoice?.status || 'DRAFT'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Tanggal terbit</span>
                  <span className="text-right font-semibold">
                    {formatDate(registrationInvoice?.issuedAt)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Jatuh tempo</span>
                  <span className="text-right font-semibold">
                    {formatDate(registrationInvoice?.dueDate)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Total tagihan</span>
                  <span className="text-right text-base font-bold text-blue-700">
                    {formatCurrency(calculateAmount())}
                  </span>
                </div>
              </div>
              {registrationInvoice?.description && (
                <p className="mt-4 text-sm text-gray-600">{registrationInvoice.description}</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <h3 className="mb-2 font-semibold text-gray-900">Informasi pembayaran</h3>
            <ol className="list-inside list-decimal space-y-1 text-sm text-gray-700">
              <li>Bayarkan sesuai nominal invoice di atas.</li>
              <li>Gunakan salah satu rekening atau QRIS platform berikut.</li>
              <li>Unggah bukti pembayaran pada form konfirmasi di bawah.</li>
              <li>Admin platform akan memverifikasi pembayaran tenant Anda.</li>
            </ol>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 font-semibold text-gray-900">Rekening tujuan pembayaran</h3>
              {loadingSettings ? (
                <div className="py-4 text-center text-sm text-gray-500">
                  Memuat informasi pembayaran...
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentSettings.bank_accounts.map((bank) => (
                    <div key={`${bank.bank_name}-${bank.account_number}`} className="rounded-lg bg-white p-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-600">Bank</span>
                          <span className="text-right font-medium">{bank.bank_name}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-600">Nomor rekening</span>
                          <span className="text-right font-medium">{bank.account_number}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-600">Atas nama</span>
                          <span className="text-right font-medium">{bank.account_name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 font-semibold text-gray-900">QR pembayaran / QRIS</h3>
              {loadingSettings ? (
                <div className="py-4 text-center text-sm text-gray-500">Memuat QR pembayaran...</div>
              ) : hasQrCodes ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {paymentSettings.qr_codes.map((qr) => (
                    <div key={qr.id} className="rounded-lg border border-gray-200 bg-white p-3">
                      <div className="mb-3 flex items-center justify-between">
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
                          className="mx-auto h-40 w-40 rounded-lg border border-gray-200 object-contain"
                        />
                      ) : (
                        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-100 text-sm text-gray-500">
                          QR tidak tersedia
                        </div>
                      )}
                      {qr.notes && <p className="mt-3 text-xs text-gray-500">{qr.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Admin platform belum menambahkan QR pembayaran. Silakan gunakan transfer bank.
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <h3 className="mb-1 font-semibold text-gray-900">Form kirim bukti bayar</h3>
              <p className="text-sm text-gray-700">
                Isi data pembayaran dengan benar agar verifikasi langganan tenant dapat diproses.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 font-semibold text-gray-900">Metode pembayaran yang tersedia</h3>
              <div className="flex flex-wrap gap-2">
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

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tanggal pembayaran *
                </label>
                <input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Metode pembayaran *
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  required
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  {paymentSettings.payment_methods.includes('bank_transfer') && (
                    <option value="bank_transfer">Transfer bank</option>
                  )}
                  {paymentSettings.payment_methods.includes('e_wallet') && (
                    <option value="e_wallet">E-Wallet / QRIS</option>
                  )}
                  {paymentSettings.payment_methods.includes('other') && (
                    <option value="other">Metode lain</option>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nama pengirim *</label>
              <input
                type="text"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                placeholder="Nama pemilik rekening / akun pengirim"
                required
                className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nomor rekening / nomor akun
              </label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="Nomor rekening atau nomor akun pengirim"
                className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nomor referensi transaksi
              </label>
              <input
                type="text"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                placeholder="Nomor referensi / kode transaksi"
                className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Catatan tambahan</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Catatan tambahan untuk admin platform"
                className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Bukti pembayaran * (maks. 5MB - JPG, PNG, PDF)
              </label>
              <div className="mt-1 flex justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 pb-6 pt-5 transition-colors hover:border-gray-400">
                <div className="space-y-1 text-center">
                  {proofFile ? (
                    <div>
                      <DocumentTextIcon className="mx-auto h-12 w-12 text-green-500" />
                      <p className="text-sm font-medium text-gray-900">{proofFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(proofFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        onClick={() => setProofFile(null)}
                        className="mt-2 text-sm text-red-600 hover:text-red-700"
                      >
                        Hapus file
                      </button>
                    </div>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 hover:text-blue-500">
                          <span>Unggah file</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,application/pdf"
                            onChange={handleFileChange}
                            required
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">atau pilih dari perangkat</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, PDF hingga 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              {!invoiceLocked && (
                <button
                  type="button"
                  onClick={() => setStep('select-plan')}
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Kembali
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !proofFile}
                className="flex flex-1 items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                    Mengirim...
                  </>
                ) : (
                  <>
                    <CreditCardIcon className="mr-2 h-5 w-5" />
                    Kirim bukti bayar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
