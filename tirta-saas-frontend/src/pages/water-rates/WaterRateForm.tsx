import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { waterRateService } from '../../services/waterRateService';
import { subscriptionService } from '../../services/subscriptionService';
import type { WaterRateFormData } from '../../types/waterRate';
import type { SubscriptionType } from '../../types/subscription';
import { PageHeader } from '../../components';
import { useToast } from '../../components';

export default function WaterRateForm() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [formData, setFormData] = useState<WaterRateFormData>({
    amount: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    subscriptionId: '',
    categoryId: '',
    description: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof WaterRateFormData, string>>>({});

  useEffect(() => {
    fetchSubscriptionTypes();
    if (isEditMode && id) {
      fetchWaterRate(id);
    }
  }, [id, isEditMode]);

  const fetchSubscriptionTypes = async () => {
    try {
      const types = await subscriptionService.getAllSubscriptionTypes();
      setSubscriptionTypes(types);
    } catch  {
      toast.error('Gagal memuat data golongan langganan');
    }
  };

  const fetchWaterRate = async (rateId: string) => {
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
    } catch  {
      toast.error('Gagal memuat data tarif air');
    } finally {
      setLoading(false);
    }
  };

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
    // Clear error when user starts typing
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
    } catch  {
      toast.error(`Gagal ${isEditMode ? 'memperbarui' : 'membuat'} tarif air`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/admin/water-rates')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Kembali ke Tarif Air
      </button>
      <PageHeader
        title={isEditMode ? 'Edit Tarif Air' : 'Buat Tarif Air'}
        subtitle={
          isEditMode
            ? 'Perbarui tarif air per meter kubik untuk golongan langganan yang dipilih.'
            : 'Tetapkan tarif air baru per meter kubik untuk golongan langganan.'
        }
      />

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rate Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Tarif</h3>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <label htmlFor="subscriptionId" className="block text-sm font-medium text-gray-700">
                  Golongan Langganan <span className="text-red-500">*</span>
                </label>
                <select
                  id="subscriptionId"
                  name="subscriptionId"
                  value={formData.subscriptionId}
                  onChange={handleChange}
                  disabled={isEditMode}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.subscriptionId
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } ${isEditMode ? 'bg-gray-100' : ''}`}
                >
                  <option value="">Pilih golongan langganan</option>
                  {subscriptionTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {errors.subscriptionId && (
                  <p className="mt-1 text-sm text-red-600">{errors.subscriptionId}</p>
                )}
                {isEditMode && (
                  <p className="mt-1 text-sm text-gray-500">
                    Golongan langganan tidak dapat diubah setelah tarif dibuat
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Tarif per m³ (IDR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  min="0"
                  step="100"
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.amount
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="mis. 5000"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Tarif yang dibebankan untuk setiap meter kubik pemakaian air
                </p>
              </div>

              <div>
                <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700">
                  Tanggal Berlaku <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="effectiveDate"
                  name="effectiveDate"
                  value={formData.effectiveDate}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.effectiveDate
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {errors.effectiveDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.effectiveDate}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Tanggal saat tarif ini mulai aktif digunakan
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Deskripsi
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Catatan atau keterangan opsional untuk tarif ini"
                />
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Penting:</strong> Membuat tarif baru tidak otomatis menonaktifkan tarif lama.
                  Pastikan tarif sebelumnya dinonaktifkan bila memang sudah tidak dipakai.
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin/water-rates')}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {loading ? 'Menyimpan...' : isEditMode ? 'Perbarui Tarif' : 'Buat Tarif'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
