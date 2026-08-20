import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircleIcon,
  PencilIcon,
  PlusIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { apiClient } from '../../services/apiClient';
import {
  DashboardStatCard,
  FormCheckbox,
  FormInput,
  FormTextarea,
  Modal,
  useToast,
} from '../../components';

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
  created_at: string;
  updated_at: string;
}

interface PlanFormState {
  plan: string;
  name: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  max_users: number;
  max_customers: number;
  max_storage_gb: number;
  max_api_calls_per_day: number;
  features: string;
  trial_days: number;
  display_order: number;
  is_active: boolean;
}

const emptyFormState: PlanFormState = {
  plan: '',
  name: '',
  description: '',
  monthly_price: 0,
  yearly_price: 0,
  max_users: 0,
  max_customers: 0,
  max_storage_gb: 0,
  max_api_calls_per_day: 0,
  features: '',
  trial_days: 0,
  display_order: 0,
  is_active: true,
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export default function SubscriptionPlans() {
  const toast = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState<PlanFormState>(emptyFormState);
  const [submitting, setSubmitting] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/platform/subscription-plans?include_inactive=true');
      setPlans(response.data || []);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Gagal memuat paket langganan.'));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData(emptyFormState);
    setShowModal(true);
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      plan: plan.plan,
      name: plan.name,
      description: plan.description,
      monthly_price: plan.monthly_price,
      yearly_price: plan.yearly_price,
      max_users: plan.max_users,
      max_customers: plan.max_customers,
      max_storage_gb: plan.max_storage_gb,
      max_api_calls_per_day: plan.max_api_calls_per_day,
      features: plan.features.join('\n'),
      trial_days: plan.trial_days,
      display_order: plan.display_order,
      is_active: plan.is_active,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPlan(null);
    setFormData(emptyFormState);
  };

  const handleTextChange = (field: keyof PlanFormState, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleNumberChange = (field: keyof PlanFormState, value: string) => {
    setFormData((current) => ({ ...current, [field]: Number(value) }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        features: formData.features
          .split('\n')
          .map((feature) => feature.trim())
          .filter(Boolean),
      };

      if (editingPlan) {
        await apiClient.put(`/platform/subscription-plans/${editingPlan.id}`, payload);
        toast.success('Paket langganan berhasil diperbarui.');
      } else {
        await apiClient.post('/platform/subscription-plans', payload);
        toast.success('Paket langganan berhasil dibuat.');
      }

      await fetchPlans();
      closeModal();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Gagal menyimpan paket langganan.'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num);

  const planStats = useMemo(
    () => ({
      total: plans.length,
      active: plans.filter((plan) => plan.is_active).length,
      inactive: plans.filter((plan) => !plan.is_active).length,
    }),
    [plans]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 animate-pulse rounded-lg bg-surface-100" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-32 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="card h-64 animate-pulse" />
          <div className="card h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-surface-900">Paket Langganan</h1>
          <p className="mt-1 text-[13px] text-surface-400">
            Kelola katalog paket platform, harga, dan batas layanan.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary self-start"
        >
          <PlusIcon className="h-4 w-4" />
          Tambah Paket
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardStatCard
          title="Total Paket"
          value={formatNumber(planStats.total)}
          helper="Seluruh katalog"
          subtitle="Semua paket yang tersimpan."
          icon={PlusIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Paket Aktif"
          value={formatNumber(planStats.active)}
          helper="Tampil ke tenant"
          subtitle="Paket yang dapat dipilih tenant."
          icon={CheckCircleIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Paket Nonaktif"
          value={formatNumber(planStats.inactive)}
          helper="Draft / disembunyikan"
          subtitle="Paket yang tidak dipublikasikan."
          icon={XCircleIcon}
          tone="yellow"
        />
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-200 bg-white px-6 py-12 text-center">
          <p className="text-[15px] font-medium text-surface-800">Belum ada paket langganan.</p>
          <p className="mt-2 text-[13px] text-surface-400">
            Buat paket pertama untuk mulai menawarkan pilihan subscription ke tenant.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="btn-primary mt-4"
          >
            <PlusIcon className="h-4 w-4" />
            Buat Paket Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`card p-5 ${
                plan.is_active ? 'ring-1 ring-success-200/60' : ''
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[16px] font-semibold text-surface-800">{plan.name}</h3>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1 ring-inset ${
                        plan.is_active
                          ? 'bg-success-50 text-success-700 ring-success-200/60'
                          : 'bg-surface-50 text-surface-500 ring-surface-200/60'
                      }`}
                    >
                      {plan.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-surface-400">
                    {plan.plan}
                  </p>
                  <p className="mt-2 text-[13px] text-surface-400">
                    {plan.description || 'Belum ada deskripsi paket.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openEditModal(plan)}
                  className="btn-secondary self-start"
                >
                  <PencilIcon className="h-4 w-4" />
                  Ubah
                </button>
              </div>

              {/* Pricing */}
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-surface-100 bg-surface-50/50 p-4">
                  <p className="text-[13px] text-surface-400">Harga bulanan</p>
                  <p className="mt-1 text-[20px] font-semibold text-surface-800">
                    {formatCurrency(plan.monthly_price)}
                  </p>
                </div>
                <div className="rounded-xl border border-surface-100 bg-surface-50/50 p-4">
                  <p className="text-[13px] text-surface-400">Harga tahunan</p>
                  <p className="mt-1 text-[20px] font-semibold text-surface-800">
                    {formatCurrency(plan.yearly_price)}
                  </p>
                </div>
              </div>

              {/* Limits */}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { label: 'Maks pengguna', value: formatNumber(plan.max_users) },
                  { label: 'Maks pelanggan', value: formatNumber(plan.max_customers) },
                  { label: 'Penyimpanan', value: `${formatNumber(plan.max_storage_gb)} GB` },
                  { label: 'API / hari', value: formatNumber(plan.max_api_calls_per_day) },
                  { label: 'Trial', value: `${formatNumber(plan.trial_days)} hari` },
                  { label: 'Urutan', value: `#${formatNumber(plan.display_order)}` },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-surface-100 px-3 py-2.5">
                    <p className="text-[12px] text-surface-400">{item.label}</p>
                    <p className="mt-0.5 text-[14px] font-semibold text-surface-800">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div className="mt-4 rounded-xl border border-surface-100 p-4">
                <h4 className="text-[13px] font-semibold text-surface-800">Fitur paket</h4>
                {plan.features.length === 0 ? (
                  <p className="mt-2 text-[13px] text-surface-400">Belum ada fitur yang dicantumkan.</p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {plan.features.map((feature, index) => (
                      <li key={`${plan.id}-${index}`} className="flex items-start gap-2 text-[13px] text-surface-500">
                        <CheckCircleIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingPlan ? 'Ubah Paket Langganan' : 'Tambah Paket Langganan'}
        size="xl"
        mobileFullscreen
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              label="Kode paket"
              required
              value={formData.plan}
              onChange={(event) => handleTextChange('plan', event.target.value)}
              placeholder="contoh: basic"
            />
            <FormInput
              label="Nama paket"
              required
              value={formData.name}
              onChange={(event) => handleTextChange('name', event.target.value)}
              placeholder="contoh: Paket Basic"
            />
          </div>

          <FormTextarea
            label="Deskripsi"
            rows={3}
            value={formData.description}
            onChange={(event) => handleTextChange('description', event.target.value)}
            placeholder="Ringkasan manfaat dan target tenant."
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              label="Harga bulanan (IDR)"
              type="number"
              required
              value={formData.monthly_price}
              onChange={(event) => handleNumberChange('monthly_price', event.target.value)}
            />
            <FormInput
              label="Harga tahunan (IDR)"
              type="number"
              required
              value={formData.yearly_price}
              onChange={(event) => handleNumberChange('yearly_price', event.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              label="Maks pengguna"
              type="number"
              required
              value={formData.max_users}
              onChange={(event) => handleNumberChange('max_users', event.target.value)}
            />
            <FormInput
              label="Maks pelanggan"
              type="number"
              required
              value={formData.max_customers}
              onChange={(event) => handleNumberChange('max_customers', event.target.value)}
            />
            <FormInput
              label="Maks storage (GB)"
              type="number"
              required
              value={formData.max_storage_gb}
              onChange={(event) => handleNumberChange('max_storage_gb', event.target.value)}
            />
            <FormInput
              label="Maks API calls / hari"
              type="number"
              required
              value={formData.max_api_calls_per_day}
              onChange={(event) => handleNumberChange('max_api_calls_per_day', event.target.value)}
            />
            <FormInput
              label="Trial (hari)"
              type="number"
              required
              value={formData.trial_days}
              onChange={(event) => handleNumberChange('trial_days', event.target.value)}
            />
            <FormInput
              label="Urutan tampil"
              type="number"
              required
              value={formData.display_order}
              onChange={(event) => handleNumberChange('display_order', event.target.value)}
            />
          </div>

          <FormTextarea
            label="Fitur paket"
            rows={6}
            value={formData.features}
            onChange={(event) => handleTextChange('features', event.target.value)}
            placeholder={'Fitur 1\nFitur 2\nFitur 3'}
            helperText="Isi satu fitur per baris agar mudah dibaca tenant."
          />

          <div className="rounded-xl border border-surface-100 bg-surface-50 p-4">
            <FormCheckbox
              checked={formData.is_active}
              onChange={(event) =>
                setFormData((current) => ({ ...current, is_active: event.target.checked }))
              }
              label="Aktifkan paket ini agar terlihat oleh tenant"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-surface-100 pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={closeModal} disabled={submitting} className="btn-secondary">
              Batal
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Menyimpan...' : editingPlan ? 'Simpan Perubahan' : 'Buat Paket'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
