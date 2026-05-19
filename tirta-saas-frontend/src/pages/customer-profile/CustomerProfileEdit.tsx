import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    } else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
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
    // Clear error for this field
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
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="h-8 w-40 animate-pulse rounded bg-gray-200 mb-2" />
          <div className="h-4 w-56 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <FormSkeleton />
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => void loadProfil()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Profil</h1>
          <p className="text-gray-600">Perbarui informasi pribadi Anda</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Informasi Pribadi</h2>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Alamat Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Nomor Telepon <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.phone ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Alamat <span className="text-red-500">*</span>
            </label>
            <textarea
              id="address"
              name="address"
              rows={3}
              autoComplete="street-address"
              value={formData.address}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.address ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
          </div>

          {/* City and Postal Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                Kota <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="city"
                name="city"
                autoComplete="address-level2"
                value={formData.city}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.city ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
            </div>

            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                Kode Pos <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                autoComplete="postal-code"
                value={formData.postalCode}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.postalCode ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.postalCode && <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
