import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
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
  organization_name: yup.string().min(3, 'Minimal 3 karakter').required('Nama organisasi wajib diisi'),
  village_code: yup.string().min(3, 'Minimal 3 karakter').max(20, 'Maksimal 20 karakter').required('Kode desa wajib diisi'),
  address: yup.string().required('Alamat wajib diisi'),
  phone: yup.string().required('Nomor telepon wajib diisi'),
  email: yup.string().email('Format email tidak valid').required('Email organisasi wajib diisi'),
  admin_phone: yup.string().default(''),
  plan_type: yup.string().oneOf(['trial', 'subscription']).required('Pilih jenis paket'),
  plan_id: yup.string().default(''),
})

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

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
    },
  });

  const selectedPlanType = watch('plan_type');
  const selectedPlanId = watch('plan_id');

  useEffect(() => {
    // Redirect if user already has a tenant
    if (user?.tenant_id) {
      navigate('/admin');
      return;
    }
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PUBLIC.SUBSCRIPTION_PLANS}`);
      if (response.ok) {
        const data = await response.json();
        setPlans(Array.isArray(data) ? data : data.data || []);
      }
    } catch {
      // Plans failed to load — trial-only mode is still available
    }
  };

  const onSubmit = async (data: SetupTenantFormData) => {
    if (isLoading) return;
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

      // Backend returns new JWT with tenant_id populated
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

      // If subscription: redirect to status page to show payment instructions
      if (data.plan_type === 'subscription') {
        navigate('/admin/subscription/upgrade');
      } else {
        navigate('/admin');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">T</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Setup Organisasi</h2>
          <p className="mt-2 text-sm text-gray-600">
            Langkah 2 dari 2 — Lengkapi informasi organisasi dan pilih paket
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Organization Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Organisasi</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Nama Organisasi / PDAM</label>
                <input
                  {...register('organization_name')}
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Contoh: PDAM Tirta Jaya"
                />
                {errors.organization_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.organization_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Kode Desa / Kelurahan</label>
                <input
                  {...register('village_code')}
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Contoh: JAYABARU-01"
                />
                {errors.village_code && (
                  <p className="mt-1 text-sm text-red-600">{errors.village_code.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Nomor Telepon</label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="08xxxxxxxxxx"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email Organisasi</label>
                <input
                  {...register('email')}
                  type="email"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="info@organisasi.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  No. HP Admin <span className="text-gray-400">(opsional)</span>
                </label>
                <input
                  {...register('admin_phone')}
                  type="tel"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Alamat</label>
                <textarea
                  {...register('address')}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Alamat lengkap organisasi"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Plan Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pilih Paket</h3>
            <div className="space-y-4">
              {/* Trial Option */}
              <label
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedPlanType === 'trial'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  {...register('plan_type')}
                  type="radio"
                  value="trial"
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="block font-medium text-gray-900">
                    Mulai Trial 14 Hari Gratis
                  </span>
                  <span className="block text-sm text-gray-500 mt-1">
                    Coba semua fitur selama 14 hari tanpa biaya. Tidak perlu kartu kredit.
                    Langsung aktif setelah registrasi.
                  </span>
                </div>
              </label>

              {/* Subscription Option */}
              <label
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedPlanType === 'subscription'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  {...register('plan_type')}
                  type="radio"
                  value="subscription"
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3">
                   <span className="block font-medium text-gray-900">Langsung Berlangganan</span>
                   <span className="block text-sm text-gray-500 mt-1">
                     Pilih paket berlangganan. Sistem akan langsung membuat invoice awal
                     dan Anda bisa melanjutkan ke halaman pembayaran tenant.
                   </span>
                 </div>
               </label>

              {/* Subscription Plan Cards (shown when subscription selected) */}
              {selectedPlanType === 'subscription' && (
                <div className="mt-4 ml-7 space-y-3">
                  {plans.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">
                      Memuat paket langganan...
                    </p>
                  ) : (
                    plans.map((plan) => (
                      <label
                        key={plan.id}
                        className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedPlanId === plan.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          value={plan.id}
                          checked={selectedPlanId === plan.id}
                          onChange={() => setValue('plan_id', plan.id)}
                          className="mt-1 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{plan.name}</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {formatCurrency(plan.monthly_price)}<span className="text-gray-500 font-normal">/bln</span>
                            </span>
                          </div>
                          {plan.description && (
                            <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                  {errors.plan_id && (
                    <p className="text-sm text-red-600">{errors.plan_id.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
