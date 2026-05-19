import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { usageService } from '../../services/usageService';
import { customerService } from '../../services/customerService';
import { waterRateService } from '../../services/waterRateService';
import { CustomerSearchSelect } from '../../components';
import type { WaterPemakaianFormData } from '../../types/usage';
import type { Customer } from '../../types/customer';
import type { WaterRate } from '../../types/waterRate';
import { PageHeader } from '../../components';
import { useToast } from '../../components';

export default function MeterReadingForm() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [customers, setPelanggan] = useState<Customer[]>([]);
  const [previousReading, setPreviousReading] = useState<number | null>(null);
  const [calculatedPemakaian, setCalculatedPemakaian] = useState<number>(0);
  const [activeRate, setActiveRate] = useState<WaterRate | null>(null);
  const [isCheckingRate, setIsCheckingRate] = useState(false);
  const [rateWarning, setRateWarning] = useState<string>('');
  
  const [formData, setFormData] = useState<WaterPemakaianFormData>({
    customerId: '',
    usageMonth: new Date().toISOString().slice(0, 7),
    meterEnd: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof WaterPemakaianFormData, string>>>({});

  useEffect(() => {
    fetchPelanggan();
    if (isEditMode && id) {
      fetchWaterPemakaian(id);
    }
  }, [id, isEditMode]);

  useEffect(() => {
    if (formData.customerId && formData.usageMonth && !isEditMode) {
      fetchPreviousReading(formData.customerId);
    }
  }, [formData.customerId, formData.usageMonth, isEditMode]);

  useEffect(() => {
    if (!formData.customerId) {
      setActiveRate(null);
      setRateWarning('');
      return;
    }

    const selectedCustomer = customers.find((customer) => customer.id === formData.customerId);
    if (!selectedCustomer?.subscription_id) {
      setActiveRate(null);
      setRateWarning('Tipe langganan pelanggan belum tersedia.');
      return;
    }

    void fetchActiveRate(selectedCustomer.subscription_id);
  }, [formData.customerId, customers]);

  useEffect(() => {
    if (previousReading !== null && formData.meterEnd) {
      const meterEnd = parseFloat(formData.meterEnd);
      if (!isNaN(meterEnd)) {
        setCalculatedPemakaian(Math.max(0, meterEnd - previousReading));
      }
    }
  }, [previousReading, formData.meterEnd]);

  const fetchPelanggan = async () => {
    try {
      const response = await customerService.getPelanggan(1, 1000, { isActive: true });
      setPelanggan(response.data);
    } catch  {
      toast.error('Gagal memuat data pelanggan');
    }
  };

  const fetchActiveRate = async (subscriptionId: string) => {
    try {
      setIsCheckingRate(true);
      const rate = await waterRateService.getCurrentRate(subscriptionId);
      setActiveRate(rate);
      setRateWarning(
        rate
          ? ''
          : 'Belum ada tarif air aktif untuk tipe langganan pelanggan ini. Tambahkan atau aktifkan tarif terlebih dahulu di menu Konfigurasi Tarif Air.'
      );
    } catch {
      setActiveRate(null);
      setRateWarning('Gagal memeriksa tarif air aktif untuk pelanggan ini.');
    } finally {
      setIsCheckingRate(false);
    }
  };

  const fetchPreviousReading = async (customerId: string) => {
    try {
      const history = await usageService.getCustomerPemakaianHistoryById(customerId);
      if (history.length > 0) {
        // Backend returns DESC order, so index 0 is the most recent reading
        const lastReading = history[0];
        setPreviousReading(lastReading.meterEnd);
      } else {
        setPreviousReading(0);
      }
    } catch {
      setPreviousReading(0);
    }
  };

  const fetchWaterPemakaian = async (usageId: string) => {
    try {
      setLoading(true);
      const data = await usageService.getWaterPemakaian(usageId);
      setFormData({
        customerId: data.customerId,
        usageMonth: data.usageMonth,
        meterEnd: data.meterEnd.toString(),
        notes: data.notes || '',
      });
      setPreviousReading(data.meterStart);
    } catch  {
      toast.error('Gagal memuat data pemakaian air');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof WaterPemakaianFormData, string>> = {};

    if (!formData.customerId) {
      newErrors.customerId = 'Pelanggan wajib dipilih';
    }

    if (!formData.usageMonth) {
      newErrors.usageMonth = 'Bulan pemakaian wajib diisi';
    }

    const meterEnd = parseFloat(formData.meterEnd);
    if (isNaN(meterEnd) || meterEnd < 0) {
      newErrors.meterEnd = 'Meter akhir harus berupa angka dan tidak boleh negatif';
    } else if (previousReading !== null && meterEnd < previousReading) {
      newErrors.meterEnd = `Meter akhir tidak boleh lebih kecil dari meter sebelumnya (${previousReading.toFixed(2)})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof WaterPemakaianFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!isEditMode && !activeRate) {
      toast.error(rateWarning || 'Tarif air aktif belum tersedia untuk pelanggan ini');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        customerId: formData.customerId,
        usageMonth: formData.usageMonth,
        meterEnd: parseFloat(formData.meterEnd),
        notes: formData.notes.trim() || undefined,
      };

      if (isEditMode && id) {
        await usageService.updateWaterPemakaian(id, {
          meterEnd: payload.meterEnd,
          notes: payload.notes,
        });
        toast.success('Pembacaan meter berhasil diperbarui');
      } else {
        await usageService.createWaterPemakaian(payload);
        toast.success('Pembacaan meter berhasil dicatat');
      }

      navigate('/admin/usage');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || `Gagal ${isEditMode ? 'memperbarui' : 'mencatat'} pembacaan meter`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/admin/usage')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Kembali ke Pemakaian Air
      </button>
      <PageHeader
        title={isEditMode ? 'Ubah Pembacaan Meter' : 'Catat Pembacaan Meter'}
        subtitle={isEditMode ? 'Perbarui pembacaan meter dan pemakaian akan dihitung ulang' : 'Masukkan meter akhir untuk menghitung pemakaian air'}
      />

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Pelanggan</h3>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <CustomerSearchSelect
                  customers={customers}
                  value={formData.customerId}
                  onChange={(customerId) => {
                    setFormData({ ...formData, customerId });
                   setErrors({ ...errors, customerId: '' });
                  }}
                  disabled={isEditMode}
                  error={errors.customerId}
                  label="Pelanggan"
                  required
                />
              </div>

              <div>
                <label htmlFor="usageMonth" className="block text-sm font-medium text-gray-700">
                  Bulan Pemakaian <span className="text-red-500">*</span>
                </label>
                <input
                  type="month"
                  id="usageMonth"
                  name="usageMonth"
                  value={formData.usageMonth}
                  onChange={handleChange}
                  disabled={isEditMode}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.usageMonth
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } ${isEditMode ? 'bg-gray-100' : ''}`}
                />
                {errors.usageMonth && (
                  <p className="mt-1 text-sm text-red-600">{errors.usageMonth}</p>
                )}
              </div>
            </div>

            {formData.customerId && (
              <div className={`mt-4 rounded-lg border p-4 ${
                activeRate
                  ? 'border-green-200 bg-green-50'
                  : 'border-yellow-200 bg-yellow-50'
              }`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {isCheckingRate ? 'Memeriksa tarif air aktif...' : 'Status Tarif Air'}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Tipe langganan: {customers.find((customer) => customer.id === formData.customerId)?.subscription?.name || '-'}
                    </p>
                    {activeRate ? (
                      <p className="mt-1 text-sm text-green-700">
                        Tarif aktif tersedia: Rp {activeRate.amount.toLocaleString('id-ID')} / m3
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-yellow-800">
                        {rateWarning || 'Tarif air aktif belum tersedia untuk pelanggan ini.'}
                      </p>
                    )}
                  </div>

                  {!activeRate && !isCheckingRate && !isEditMode && (
                    <button
                      type="button"
                      onClick={() => navigate('/admin/water-rates')}
                      className="shrink-0 rounded-md border border-yellow-300 px-3 py-2 text-sm font-medium text-yellow-800 hover:bg-yellow-100"
                    >
                      Buka Konfigurasi Tarif Air
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Meter Reading */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pembacaan Meter</h3>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Meter Sebelumnya
                </label>
                <input
                  type="text"
                  value={previousReading !== null ? previousReading.toFixed(2) : '-'}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Diambil dari catatan bulan sebelumnya
                </p>
              </div>

              <div>
                <label htmlFor="meterEnd" className="block text-sm font-medium text-gray-700">
                  Meter Akhir <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="meterEnd"
                  name="meterEnd"
                  value={formData.meterEnd}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.meterEnd
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                   }`}
                   placeholder="Contoh: 1250.50"
                 />
                {errors.meterEnd && (
                  <p className="mt-1 text-sm text-red-600">{errors.meterEnd}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Pemakaian Terkalkulasi
                </label>
                <input
                  type="text"
                  value={`${calculatedPemakaian.toFixed(2)} m³`}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 bg-blue-50 shadow-sm sm:text-sm font-medium text-blue-900"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Dihitung otomatis dari meter sebelumnya dan meter akhir
                </p>
              </div>

              <div className="xl:col-span-3">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Catatan
                </label>
                <textarea
                  id="notes"
                  name="notes"
                   rows={3}
                   value={formData.notes}
                   onChange={handleChange}
                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                   placeholder="Catatan tambahan tentang pembacaan ini (opsional)"
                 />
              </div>
            </div>
          </div>

          {/* Important Notice */}
          {calculatedPemakaian > 100 && (
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
                     <strong>Peringatan Pemakaian Tinggi:</strong> Pemakaian terhitung ({calculatedPemakaian.toFixed(2)} m³)
                     {' '}terlihat cukup tinggi. Pastikan angka meter yang dimasukkan sudah benar.
                   </p>
                 </div>
               </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin/usage')}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || (!isEditMode && !activeRate) || isCheckingRate}
              className="w-full rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {loading ? 'Menyimpan...' : isEditMode ? 'Perbarui Pembacaan' : 'Catat Pembacaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
