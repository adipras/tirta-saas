import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  BuildingOffice2Icon,
  CheckCircleIcon,
  CreditCardIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useAppDispatch } from '../../hooks/redux';
import { setUser } from '../../store/slices/authSlice';
import { authService } from '../../services/authService';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';

interface SubscriptionPlan {
  id: string;
  name: string;
  plan: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
}

interface SetupTenantFormData {
  organization_name: string;
  village_code: string;
  address: string;
  phone: string;
  email: string;
  admin_phone: string;
  plan_type: 'trial' | 'subscription';
  plan_id: string;
}

const schema = yup.object({
  organization_name: yup
    .string()
    .min(3, 'Minimal 3 karakter')
    .required('Nama organisasi wajib diisi'),
  village_code: yup
    .string()
    .min(3, 'Minimal 3 karakter')
    .max(20, 'Maksimal 20 karakter')
    .required('Kode desa wajib diisi'),
  address: yup.string().required('Alamat wajib diisi'),
  phone: yup.string().required('Nomor telepon wajib diisi'),
  email: yup.string().email('Format email tidak valid').required('Email organisasi wajib diisi'),
  admin_phone: yup.string().default(''),
  plan_type: yup
    .string()
    .oneOf(['trial', 'subscription'])
    .required('Pilih jenis paket'),
  plan_id: yup.string().default(''),
});

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const SetupTenant = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = authService.getUser();
  const token = authService.getToken();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SetupTenantFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      plan_type: 'trial',
      email: user?.email || '',
      plan_id: '',
    },
  });

  const selectedPlanType = watch('plan_type');
  const selectedPlanId = watch('plan_id');

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? null,
    [plans, selectedPlanId]
  );

  const loadPlans = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PUBLIC.SUBSCRIPTION_PLANS}`);

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setPlans(Array.isArray(data) ? data : data.data || []);
    } catch {
      setPlans([]);
    }
  }, []);

  useEffect(() => {
    if (user?.tenant_id) {
      navigate('/admin');
      return;
    }

    void loadPlans();
  }, [loadPlans, navigate, user?.tenant_id]);

  const onSubmit = async (data: SetupTenantFormData) => {
    if (isLoading) {
      return;
    }

    if (data.plan_type === 'subscription' && !data.plan_id) {
      setError('Pilih salah satu paket berlangganan.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SETUP.TENANT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organization_name: data.organization_name,
          village_code: data.village_code,
          address: data.address,
          phone: data.phone,
          email: data.email,
          admin_phone: data.admin_phone || data.phone,
          plan_type: data.plan_type,
          plan_id: data.plan_type === 'subscription' ? data.plan_id : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Setup tenant gagal');
      }

      if (result.token) {
        const updatedUser = {
          ...user!,
          tenant_id: result.tenant_id,
          trial_ends_at: result.trial_ends_at || null,
          tenant_status: result.tenant_status || null,
        };
        authService.updateAuth(result.token, updatedUser);
        dispatch(setUser(updatedUser));
      }

      if (data.plan_type === 'subscription') {
        navigate('/admin/subscription/upgrade');
      } else {
        navigate('/admin');
      }
    } catch  {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Terjadi kesalahan. Coba lagi.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <BuildingOffice2Icon className="h-6 w-6" />
              </div>
              <h1 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
                Setup Organisasi
              </h1>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Langkah 2 dari 2. Lengkapi identitas organisasi dan pilih apakah tenant ingin
                langsung trial atau masuk ke flow langganan.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <p className="font-medium text-gray-900">{user?.email || 'Akun admin'}</p>
              <p className="mt-1">Akun ini akan menjadi admin utama tenant.</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                <BuildingOffice2Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Status setup</p>
                <p className="text-lg font-semibold text-gray-900">Siap diselesaikan</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <SparklesIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Trial default</p>
                <p className="text-lg font-semibold text-gray-900">14 hari gratis</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-green-100 p-3 text-green-700">
                <CreditCardIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pilihan langganan</p>
                <p className="text-lg font-semibold text-gray-900">
                  {plans.length > 0 ? `${plans.length} paket tersedia` : 'Memuat paket'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-gray-900">Informasi organisasi</h2>
            <p className="mt-1 text-sm text-gray-500">
              Data ini dipakai untuk identitas tenant, kontak utama, dan konfigurasi awal.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nama organisasi / PDAM
                </label>
                <input
                  {...register('organization_name')}
                  type="text"
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Contoh: PDAM Tirta Jaya"
                />
                {errors.organization_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.organization_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Kode desa / kelurahan
                </label>
                <input
                  {...register('village_code')}
                  type="text"
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Contoh: JAYABARU-01"
                />
                {errors.village_code && (
                  <p className="mt-1 text-sm text-red-600">{errors.village_code.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Nomor telepon</label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="08xxxxxxxxxx"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email organisasi</label>
                <input
                  {...register('email')}
                  type="email"
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="info@organisasi.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  No. HP admin <span className="text-gray-400">(opsional)</span>
                </label>
                <input
                  {...register('admin_phone')}
                  type="tel"
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Alamat</label>
                <textarea
                  {...register('address')}
                  rows={4}
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Alamat lengkap organisasi"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-gray-900">Pilih paket awal</h2>
            <p className="mt-1 text-sm text-gray-500">
              Tenant bisa langsung trial atau masuk ke flow langganan dan pembayaran sejak awal.
            </p>

            <div className="mt-6 space-y-4">
              <label
                className={`block cursor-pointer rounded-2xl border-2 p-4 transition ${
                  selectedPlanType === 'trial'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    {...register('plan_type')}
                    type="radio"
                    value="trial"
                    className="mt-1 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900">Mulai trial 14 hari gratis</span>
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                        Paling cepat
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      Coba semua fitur tanpa biaya dan tenant langsung aktif setelah setup selesai.
                    </p>
                  </div>
                </div>
              </label>

              <label
                className={`block cursor-pointer rounded-2xl border-2 p-4 transition ${
                  selectedPlanType === 'subscription'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    {...register('plan_type')}
                    type="radio"
                    value="subscription"
                    className="mt-1 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900">Langsung berlangganan</span>
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                        Flow invoice awal
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      Sistem akan membuat invoice awal dan tenant langsung diarahkan ke halaman
                      langganan dan pembayaran.
                    </p>
                  </div>
                </div>
              </label>

              {selectedPlanType === 'subscription' && (
                <div className="space-y-4 pt-2">
                  {plans.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                      Memuat paket langganan...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      {plans.map((plan) => {
                        const isSelected = selectedPlanId === plan.id;
                        return (
                          <label
                            key={plan.id}
                            className={`block cursor-pointer rounded-2xl border-2 p-4 transition ${
                              isSelected
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="radio"
                                value={plan.id}
                                checked={isSelected}
                                onChange={() => setValue('plan_id', plan.id, { shouldValidate: true })}
                                className="mt-1 h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-gray-900">{plan.name}</p>
                                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                                      {plan.plan}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-gray-900">
                                      {formatCurrency(plan.monthly_price)}
                                    </p>
                                    <p className="text-xs text-gray-500">/bulan</p>
                                  </div>
                                </div>
                                {plan.description && (
                                  <p className="mt-3 text-sm leading-6 text-gray-500">
                                    {plan.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {selectedPlan && (
                    <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                      <div className="flex items-start gap-3">
                        <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                        <div>
                          <p className="font-medium">
                            Paket <strong>{selectedPlan.name}</strong> dipilih.
                          </p>
                          <p className="mt-1">
                            Setelah setup selesai, tenant akan diarahkan ke flow langganan untuk
                            melihat invoice awal dan mengirim bukti pembayaran.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {errors.plan_id && (
                    <p className="text-sm text-red-600">{errors.plan_id.message}</p>
                  )}
                </div>
              )}
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isLoading ? 'Menyimpan...' : 'Selesaikan Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetupTenant;
