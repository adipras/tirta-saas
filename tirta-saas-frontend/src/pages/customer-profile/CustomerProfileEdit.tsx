import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { customerProfilService } from '../../services/customerProfileService';
import type { CustomerProfil, UpdateProfilDto } from '../../types/customerProfile';
import { FormSkeleton, useToast } from '../../components';
import { extractApiErrorMessage } from '../../utils/apiError';

export default function CustomerProfilEdit() {
  const navigate = useNavigate();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfil] = useState<CustomerProfil | null>(null);

  const [formData, setFormData] = useState<UpdateProfilDto>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadProfil = useCallback(async () => {
    try {
      setLoading(true);
      const data = await customerProfilService.getProfil();
      setProfil(data);
      setFormData({
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
      });
      setError(null);
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Gagal memuat profil'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfil();
  }, [loadProfil]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama wajib diisi';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Nomor telepon wajib diisi';
    } else if (!/^[0-9+\-\\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'Format nomor telepon tidak valid';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Alamat wajib diisi';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Kota wajib diisi';
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Kode pos wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      await customerProfilService.updateProfil(formData);
      showSuccessToast('Profil berhasil diperbarui');
      navigate('/customer/profile');
    } catch (err: unknown) {
      const message = extractApiErrorMessage(err, 'Gagal memperbarui profil');
      setError(message);
      showErrorToast(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/customer/profile');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-100" />
        <div className="card">
          <FormSkeleton />
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-1.5 text-sm text-surface-500">
          <button onClick={() => navigate('/customer/profile')} className="hover:text-brand-600 transition-colors">
            Profil
          </button>
          <span className="text-surface-300">/</span>
          <span className="text-surface-700 font-medium">Ubah</span>
        </div>
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-6 text-center">
          <p className="text-[13px] text-danger-700">{error}</p>
          <button
            onClick={() => void loadProfil()}
            className="mt-4 rounded-lg bg-danger-600 px-4 py-2 text-sm text-white hover:bg-danger-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-surface-500">
        <button onClick={() => navigate('/customer/profile')} className="hover:text-brand-600 transition-colors">
          Profil
        </button>
        <span className="text-surface-300">/</span>
        <span className="text-surface-700 font-medium">Ubah Profil</span>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4">
          <p className="text-[13px] text-danger-700">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-surface-900">Informasi Pribadi</h2>
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 transition hover:text-brand-600"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Kembali
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-1.5 block text-[13px] font-medium text-surface-700">
              Nama Lengkap <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              className={`input-base ${errors.name ? 'border-danger-300 focus:ring-danger-500/20' : ''}`}
            />
            {errors.name && <p className="mt-1.5 text-[12px] text-danger-600">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-surface-700">
              Alamat Email <span className="text-danger-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className={`input-base ${errors.email ? 'border-danger-300 focus:ring-danger-500/20' : ''}`}
            />
            {errors.email && <p className="mt-1.5 text-[12px] text-danger-600">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-[13px] font-medium text-surface-700">
              Nomor Telepon <span className="text-danger-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              className={`input-base ${errors.phone ? 'border-danger-300 focus:ring-danger-500/20' : ''}`}
            />
            {errors.phone && <p className="mt-1.5 text-[12px] text-danger-600">{errors.phone}</p>}
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="mb-1.5 block text-[13px] font-medium text-surface-700">
              Alamat <span className="text-danger-500">*</span>
            </label>
            <textarea
              id="address"
              name="address"
              rows={3}
              autoComplete="street-address"
              value={formData.address}
              onChange={handleChange}
              className={`input-base ${errors.address ? 'border-danger-300 focus:ring-danger-500/20' : ''}`}
            />
            {errors.address && <p className="mt-1.5 text-[12px] text-danger-600">{errors.address}</p>}
          </div>

          {/* City and Postal Code */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className="mb-1.5 block text-[13px] font-medium text-surface-700">
                Kota <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                id="city"
                name="city"
                autoComplete="address-level2"
                value={formData.city}
                onChange={handleChange}
                className={`input-base ${errors.city ? 'border-danger-300 focus:ring-danger-500/20' : ''}`}
              />
              {errors.city && <p className="mt-1.5 text-[12px] text-danger-600">{errors.city}</p>}
            </div>

            <div>
              <label htmlFor="postalCode" className="mb-1.5 block text-[13px] font-medium text-surface-700">
                Kode Pos <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                autoComplete="postal-code"
                value={formData.postalCode}
                onChange={handleChange}
                className={`input-base ${errors.postalCode ? 'border-danger-300 focus:ring-danger-500/20' : ''}`}
              />
              {errors.postalCode && <p className="mt-1.5 text-[12px] text-danger-600">{errors.postalCode}</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-surface-100 pt-5">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="btn-secondary disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Menyimpan...
              </>
            ) : (
              'Simpan Perubahan'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
