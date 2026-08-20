import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { subscriptionService } from '../../services/subscriptionService';
import type { SubscriptionTypeFormData } from '../../types/subscription';
import { useToast } from '../../components';

export default function SubscriptionTypeForm() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SubscriptionTypeFormData>({
    name: '',
    description: '',
    registration_fee: '0',
    monthly_fee: '0',
    maintenance_fee: '0',
    late_fee_per_day: '0',
    max_late_fee: '0',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SubscriptionTypeFormData, string>>>({});

  const fetchSubscriptionType = useCallback(async (typeId: string) => {
    try {
      setLoading(true);
      const data = await subscriptionService.getSubscriptionType(typeId);
      setFormData({
        name: data.name,
        description: data.description || '',
        registration_fee: data.registration_fee.toString(),
        monthly_fee: data.monthly_fee.toString(),
        maintenance_fee: data.maintenance_fee.toString(),
        late_fee_per_day: data.late_fee_per_day.toString(),
        max_late_fee: data.max_late_fee.toString(),
      });
    } catch {
      toast.error('Gagal memuat data golongan langganan');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isEditMode && id) {
      void fetchSubscriptionType(id);
    }
  }, [fetchSubscriptionType, id, isEditMode]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SubscriptionTypeFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama golongan langganan wajib diisi';
    }

    if (!formData.registration_fee || formData.registration_fee.trim() === '') {
      newErrors.registration_fee = 'Biaya pendaftaran wajib diisi';
    } else {
      const registrationFee = parseFloat(formData.registration_fee);
      if (isNaN(registrationFee) || registrationFee < 0) {
        newErrors.registration_fee = 'Biaya pendaftaran harus berupa angka nol atau lebih';
      }
    }

    if (!formData.monthly_fee || formData.monthly_fee.trim() === '') {
      newErrors.monthly_fee = 'Biaya bulanan wajib diisi';
    } else {
      const monthlyFee = parseFloat(formData.monthly_fee);
      if (isNaN(monthlyFee) || monthlyFee < 0) {
        newErrors.monthly_fee = 'Biaya bulanan harus berupa angka nol atau lebih';
      }
    }

    if (formData.maintenance_fee && formData.maintenance_fee.trim() !== '') {
      const maintenanceFee = parseFloat(formData.maintenance_fee);
      if (isNaN(maintenanceFee) || maintenanceFee < 0) {
        newErrors.maintenance_fee = 'Biaya pemeliharaan harus berupa angka nol atau lebih';
      }
    }

    if (formData.late_fee_per_day && formData.late_fee_per_day.trim() !== '') {
      const lateFeePerDay = parseFloat(formData.late_fee_per_day);
      if (isNaN(lateFeePerDay) || lateFeePerDay < 0) {
        newErrors.late_fee_per_day = 'Denda keterlambatan per hari harus berupa angka nol atau lebih';
      }
    }

    if (formData.max_late_fee && formData.max_late_fee.trim() !== '') {
      const maxLateFee = parseFloat(formData.max_late_fee);
      if (isNaN(maxLateFee) || maxLateFee < 0) {
        newErrors.max_late_fee = 'Batas maksimum denda harus berupa angka nol atau lebih';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof SubscriptionTypeFormData]) {
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
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        registration_fee: parseFloat(formData.registration_fee) || 0,
        monthly_fee: parseFloat(formData.monthly_fee) || 0,
        maintenance_fee: parseFloat(formData.maintenance_fee) || 0,
        late_fee_per_day: parseFloat(formData.late_fee_per_day) || 0,
        max_late_fee: parseFloat(formData.max_late_fee) || 0,
      };

      if (isEditMode && id) {
        await subscriptionService.updateSubscriptionType(id, payload);
        toast.success('Golongan langganan berhasil diperbarui');
      } else {
        await subscriptionService.createSubscriptionType(payload);
        toast.success('Golongan langganan berhasil dibuat');
      }

      navigate('/admin/subscriptions');
    } catch {
      toast.error(`Gagal ${isEditMode ? 'memperbarui' : 'membuat'} golongan langganan`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-surface-500">
        <button onClick={() => navigate('/admin/subscriptions')} className="hover:text-brand-600 transition-colors">
          Golongan Langganan
        </button>
        <span className="text-surface-300">/</span>
        <span className="text-surface-700 font-medium">{isEditMode ? 'Ubah' : 'Tambah'}</span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-surface-900">
            {isEditMode ? 'Ubah Golongan Langganan' : 'Tambah Golongan Langganan'}
          </h2>
          <button
            type="button"
            onClick={() => navigate('/admin/subscriptions')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 transition hover:text-brand-600"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Kembali
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Basic Information */}
          <div>
            <h3 className="mb-3 text-[13px] font-semibold text-surface-700">Informasi Dasar</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-[13px] font-medium text-surface-700">
                  Nama <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`input-base ${errors.name ? 'border-danger-300 focus:ring-danger-500/20' : ''}`}
                  placeholder="Contoh: Rumah Tangga, Niaga, Industri"
                />
                {errors.name && <p className="mt-1.5 text-[12px] text-danger-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="description" className="mb-1.5 block text-[13px] font-medium text-surface-700">
                  Deskripsi
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="input-base"
                  placeholder="Deskripsi singkat untuk golongan langganan ini"
                />
              </div>
            </div>
          </div>

          {/* Fee Structure */}
          <div className="border-t border-surface-100 pt-5">
            <h3 className="mb-3 text-[13px] font-semibold text-surface-700">Struktur Biaya</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="registration_fee" className="mb-1.5 block text-[13px] font-medium text-surface-700">
                  Biaya Pendaftaran (Rp) <span className="text-danger-500">*</span>
                </label>
                <input
                  type="number"
                  id="registration_fee"
                  name="registration_fee"
                  value={formData.registration_fee}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  className={`input-base ${errors.registration_fee ? 'border-danger-300 focus:ring-danger-500/20' : ''}`}
                />
                {errors.registration_fee && <p className="mt-1.5 text-[12px] text-danger-600">{errors.registration_fee}</p>}
              </div>

              <div>
                <label htmlFor="monthly_fee" className="mb-1.5 block text-[13px] font-medium text-surface-700">
                  Biaya Bulanan (Rp) <span className="text-danger-500">*</span>
                </label>
                <input
                  type="number"
                  id="monthly_fee"
                  name="monthly_fee"
                  value={formData.monthly_fee}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  className={`input-base ${errors.monthly_fee ? 'border-danger-300 focus:ring-danger-500/20' : ''}`}
                />
                {errors.monthly_fee && <p className="mt-1.5 text-[12px] text-danger-600">{errors.monthly_fee}</p>}
              </div>

              <div>
                <label htmlFor="maintenance_fee" className="mb-1.5 block text-[13px] font-medium text-surface-700">
                  Biaya Pemeliharaan (Rp)
                </label>
                <input
                  type="number"
                  id="maintenance_fee"
                  name="maintenance_fee"
                  value={formData.maintenance_fee}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  className={`input-base ${errors.maintenance_fee ? 'border-danger-300 focus:ring-danger-500/20' : ''}`}
                />
                {errors.maintenance_fee && <p className="mt-1.5 text-[12px] text-danger-600">{errors.maintenance_fee}</p>}
              </div>

              <div>
                <label htmlFor="late_fee_per_day" className="mb-1.5 block text-[13px] font-medium text-surface-700">
                  Denda Keterlambatan/Hari (Rp)
                </label>
                <input
                  type="number"
                  id="late_fee_per_day"
                  name="late_fee_per_day"
                  value={formData.late_fee_per_day}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  className={`input-base ${errors.late_fee_per_day ? 'border-danger-300 focus:ring-danger-500/20' : ''}`}
                />
                <p className="mt-1 text-[12px] text-surface-400">Denda keterlambatan harian dalam rupiah</p>
                {errors.late_fee_per_day && <p className="mt-1.5 text-[12px] text-danger-600">{errors.late_fee_per_day}</p>}
              </div>

              <div>
                <label htmlFor="max_late_fee" className="mb-1.5 block text-[13px] font-medium text-surface-700">
                  Batas Maksimum Denda (Rp)
                </label>
                <input
                  type="number"
                  id="max_late_fee"
                  name="max_late_fee"
                  value={formData.max_late_fee}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  className={`input-base ${errors.max_late_fee ? 'border-danger-300 focus:ring-danger-500/20' : ''}`}
                />
                <p className="mt-1 text-[12px] text-surface-400">Batas maksimum total denda keterlambatan</p>
                {errors.max_late_fee && <p className="mt-1.5 text-[12px] text-danger-600">{errors.max_late_fee}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-surface-100 pt-5">
          <button
            type="button"
            onClick={() => navigate('/admin/subscriptions')}
            disabled={loading}
            className="btn-secondary disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : isEditMode ? 'Perbarui' : 'Buat'}
          </button>
        </div>
      </form>
    </div>
  );
}
