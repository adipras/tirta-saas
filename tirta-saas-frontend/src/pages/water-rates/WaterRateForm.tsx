import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BanknotesIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { waterRateService } from '../../services/waterRateService';
import { subscriptionService } from '../../services/subscriptionService';
import tariffService from '../../services/tariffService';
import type { WaterRateFormData } from '../../types/waterRate';
import type { SubscriptionType } from '../../types/subscription';
import type { TariffCategory } from '../../types/tariff';
import { useToast } from '../../components';

export default function WaterRateForm() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [tariffCategories, setTariffCategories] = useState<TariffCategory[]>([]);
  const [formData, setFormData] = useState<WaterRateFormData>({
    amount: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    subscriptionId: '',
    categoryId: '',
    description: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof WaterRateFormData, string>>>({});

  const fetchSubscriptionTypes = useCallback(async () => {
    try {
      const types = await subscriptionService.getAllSubscriptionTypes();
      setSubscriptionTypes(types);
    } catch {
      toast.error('Gagal memuat data golongan langganan');
    }
  }, [toast]);

  const fetchTariffCategories = useCallback(async () => {
    try {
      const categories = await tariffService.getTariffCategories();
      setTariffCategories(categories.filter((item) => item.is_active));
    } catch {
      toast.error('Gagal memuat kategori tarif');
    }
  }, [toast]);

  const fetchWaterRate = useCallback(async (rateId: string) => {
    try {
      setLoading(true);
      const data = await waterRateService.getWaterRate(rateId);
      setFormData({
        amount: data.amount.toString(),
        effectiveDate: data.effective_date.split('T')[0],
        subscriptionId: data.subscription_id,
        categoryId: data.category_id || '',
        description: data.description || '',
      });
    } catch {
      toast.error('Gagal memuat data tarif air');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchSubscriptionTypes();
    void fetchTariffCategories();
    if (isEditMode && id) {
      void fetchWaterRate(id);
    }
  }, [fetchSubscriptionTypes, fetchTariffCategories, fetchWaterRate, id, isEditMode]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof WaterRateFormData, string>> = {};

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Tarif per m³ harus berupa angka positif';
    }

    if (!formData.effectiveDate) {
      newErrors.effectiveDate = 'Tanggal berlaku wajib diisi';
    } else {
      const selectedDate = new Date(formData.effectiveDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (!isEditMode && selectedDate < today) {
        newErrors.effectiveDate = 'Tanggal berlaku tidak boleh di masa lalu';
      }
    }

    if (!formData.subscriptionId) {
      newErrors.subscriptionId = 'Golongan langganan wajib dipilih';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof WaterRateFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const payload = {
        amount: parseFloat(formData.amount),
        effective_date: formData.effectiveDate,
        subscription_id: formData.subscriptionId,
        category_id: formData.categoryId || undefined,
        description: formData.description.trim() || undefined,
      };

      if (isEditMode && id) {
        await waterRateService.updateWaterRate(id, payload);
        toast.success('Tarif air berhasil diperbarui');
      } else {
        await waterRateService.createWaterRate(payload);
        toast.success('Tarif air berhasil dibuat');
      }

      navigate('/admin/water-rates');
    } catch {
      toast.error(`Gagal ${isEditMode ? 'memperbarui' : 'membuat'} tarif air`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[13px] text-surface-400">
        <button
          onClick={() => navigate('/admin/water-rates')}
          className="transition-colors hover:text-surface-600"
        >
          Tarif Air
        </button>
        <span>/</span>
        <span className="font-medium text-surface-700">
          {isEditMode ? 'Ubah Tarif' : 'Tambah Tarif'}
        </span>
      </nav>

      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-surface-900">
          {isEditMode ? 'Ubah Tarif Air' : 'Buat Tarif Air Baru'}
        </h1>
        <p className="mt-1 text-[13px] text-surface-400">
          {isEditMode
            ? 'Perbarui tarif air per meter kubik untuk golongan langganan yang dipilih.'
            : 'Tetapkan tarif air baru per meter kubik untuk golongan langganan.'}
        </p>
      </div>

      {/* Form Card */}
      <div className="card overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* Form Body */}
          <div className="p-6 space-y-6">
            {/* Section: Informasi Tarif */}
            <div>
              <h3 className="mb-4 text-[15px] font-semibold text-surface-800">
                Informasi Tarif
              </h3>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* Golongan Langganan */}
                <div>
                  <label htmlFor="subscriptionId" className="label-base">
                    Golongan Langganan <span className="text-danger-500">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <TagIcon className="h-4 w-4 text-surface-300" />
                    </div>
                    <select
                      id="subscriptionId"
                      name="subscriptionId"
                      value={formData.subscriptionId}
                      onChange={handleChange}
                      disabled={isEditMode}
                      className={`input-base pl-10 pr-4 ${
                        errors.subscriptionId
                          ? 'border-danger-300 focus:ring-danger-500/20 focus:border-danger-500'
                          : ''
                      } ${isEditMode ? 'bg-surface-50 text-surface-500' : ''}`}
                    >
                      <option value="">Pilih golongan langganan</option>
                      {subscriptionTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.subscriptionId && (
                    <p className="mt-1.5 text-[12px] text-danger-600">{errors.subscriptionId}</p>
                  )}
                  {isEditMode && (
                    <p className="mt-1.5 text-[12px] text-surface-400">
                      Golongan langganan tidak dapat diubah setelah tarif dibuat
                    </p>
                  )}
                </div>

                {/* Tarif per m³ */}
                <div>
                  <label htmlFor="amount" className="label-base">
                    Tarif per m³ (IDR) <span className="text-danger-500">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <BanknotesIcon className="h-4 w-4 text-surface-300" />
                    </div>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      min="0"
                      step="100"
                      className={`input-base pl-10 pr-4 ${
                        errors.amount
                          ? 'border-danger-300 focus:ring-danger-500/20 focus:border-danger-500'
                          : ''
                      }`}
                      placeholder="mis. 5000"
                    />
                  </div>
                  {errors.amount && (
                    <p className="mt-1.5 text-[12px] text-danger-600">{errors.amount}</p>
                  )}
                  <p className="mt-1.5 text-[12px] text-surface-400">
                    Tarif yang dibebankan untuk setiap meter kubik pemakaian air
                  </p>
                </div>

                {/* Tanggal Berlaku */}
                <div>
                  <label htmlFor="effectiveDate" className="label-base">
                    Tanggal Berlaku <span className="text-danger-500">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <CalendarDaysIcon className="h-4 w-4 text-surface-300" />
                    </div>
                    <input
                      type="date"
                      id="effectiveDate"
                      name="effectiveDate"
                      value={formData.effectiveDate}
                      onChange={handleChange}
                      className={`input-base pl-10 pr-4 ${
                        errors.effectiveDate
                          ? 'border-danger-300 focus:ring-danger-500/20 focus:border-danger-500'
                          : ''
                      }`}
                    />
                  </div>
                  {errors.effectiveDate && (
                    <p className="mt-1.5 text-[12px] text-danger-600">{errors.effectiveDate}</p>
                  )}
                  <p className="mt-1.5 text-[12px] text-surface-400">
                    Tanggal saat tarif ini mulai aktif digunakan
                  </p>
                </div>

                {/* Kategori Tarif Progresif */}
                <div>
                  <label htmlFor="categoryId" className="label-base">
                    Kategori Tarif Progresif
                  </label>
                  <div className="relative mt-1.5">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <TagIcon className="h-4 w-4 text-surface-300" />
                    </div>
                    <select
                      id="categoryId"
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
                      className="input-base pl-10 pr-4"
                    >
                      <option value="">Tanpa kategori progresif</option>
                      {tariffCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.code} - {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1.5 text-[12px] text-surface-400">
                    Pilih kategori agar tarif dasar ini selaras dengan skema tarif progresif tenant.
                  </p>
                </div>

                {/* Deskripsi — full width */}
                <div className="lg:col-span-2">
                  <label htmlFor="description" className="label-base">
                    Deskripsi
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="input-base mt-1.5"
                    placeholder="Catatan atau keterangan opsional untuk tarif ini"
                  />
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="rounded-xl border border-warning-200 bg-warning-50 p-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <ExclamationTriangleIcon className="h-5 w-5 text-warning-500" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-warning-700">Penting</p>
                  <p className="mt-1 text-[13px] text-warning-600">
                    Membuat tarif baru tidak otomatis menonaktifkan tarif lama.
                    Pastikan tarif sebelumnya dinonaktifkan bila memang sudah tidak dipakai.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-surface-100 bg-surface-50/50 px-6 py-4">
            <button
              type="button"
              onClick={() => navigate('/admin/water-rates')}
              className="btn-secondary"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Menyimpan...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4" />
                  {isEditMode ? 'Perbarui Tarif' : 'Buat Tarif'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
